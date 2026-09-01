import React, { useState, useEffect } from 'react';
import axios from 'axios';

export default function ProductPricingPackagingManager() {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [categories, setCategories] = useState([]);
    const [brands, setBrands] = useState([]);

    // Filters & Pagination
    const [searchTerm, setSearchTerm] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('');
    const [brandFilter, setBrandFilter] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [currentPage, setCurrentPage] = useState(1);
    const [lastPage, setLastPage] = useState(1);
    const [totalProducts, setTotalProducts] = useState(0);

    // Selected product for editing commercial settings
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [pricingHistory, setPricingHistory] = useState([]);
    const [showEditModal, setShowEditModal] = useState(false);
    const [saving, setSaving] = useState(false);
    const [modalError, setModalError] = useState(null);
    const [modalSuccess, setModalSuccess] = useState(null);

    // Commercial Form State
    const [pricingForm, setPricingForm] = useState({
        cost_price: '',
        selling_price: '',
        price_basis: 'PCS',
        pieces_per_box: '',
        package_weight_kg: ''
    });

    const isTileCategory = (cat) => {
        if (!cat) return false;
        const name = (cat.name || '').toLowerCase();
        const slug = (cat.slug || '').toLowerCase();
        return name.includes('tile') || slug.includes('tile');
    };

    const isSlabCategory = (cat) => {
        if (!cat) return false;
        const name = (cat.name || '').toLowerCase();
        const slug = (cat.slug || '').toLowerCase();
        return name.includes('granite') || name.includes('marble') || name.includes('slab') ||
               slug.includes('granite') || slug.includes('marble') || slug.includes('slab');
    };

    const isBaggedCategory = (cat) => {
        if (!cat) return false;
        const name = (cat.name || '').toLowerCase();
        const slug = (cat.slug || '').toLowerCase();
        return name.includes('adhesive') || name.includes('grout') || name.includes('cement') ||
               slug.includes('adhesive') || slug.includes('grout') || slug.includes('cement');
    };

    // Load Lookup Categories & Brands
    const loadLookups = async () => {
        try {
            const token = localStorage.getItem('auth_token');
            const res = await axios.get('/api/product/form-data', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setCategories(res.data.categories || []);
            setBrands(res.data.brands || []);
        } catch (err) {
            console.error('Failed to load lookup data', err);
        }
    };

    // Load Products
    const fetchProducts = async (page = 1) => {
        setLoading(true);
        try {
            const token = localStorage.getItem('auth_token');
            const params = {
                page,
                search: searchTerm,
                category_id: categoryFilter,
                brand_id: brandFilter,
                status: statusFilter
            };
            const res = await axios.get('/api/product/pricing-packaging', {
                headers: { Authorization: `Bearer ${token}` },
                params
            });

            const data = res.data || {};
            setProducts(data.data || []);
            setCurrentPage(data.current_page || 1);
            setLastPage(data.last_page || 1);
            setTotalProducts(data.total || 0);
        } catch (err) {
            console.error('Failed to fetch commercial pricing list', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadLookups();
    }, []);

    useEffect(() => {
        fetchProducts(1);
    }, [searchTerm, categoryFilter, brandFilter, statusFilter]);

    // Open Edit Modal for a Product Variant
    const handleOpenEdit = async (prod) => {
        setSelectedProduct(prod);
        setModalError(null);
        setModalSuccess(null);
        setShowEditModal(true);

        // Populate initial form values from currentCommercialPricing or product model defaults
        const currentPricing = prod.current_commercial_pricing;
        setPricingForm({
            cost_price: currentPricing?.cost_price ? parseFloat(currentPricing.cost_price).toString() : '',
            selling_price: currentPricing?.selling_price ? parseFloat(currentPricing.selling_price).toString() : '',
            price_basis: currentPricing?.price_basis || (isSlabCategory(prod.category) ? 'SQFT' : 'PCS'),
            pieces_per_box: currentPricing?.pieces_per_box ? currentPricing.pieces_per_box.toString() : (prod.pieces_per_box ? prod.pieces_per_box.toString() : ''),
            package_weight_kg: currentPricing?.package_weight_kg ? currentPricing.package_weight_kg.toString() : ''
        });

        // Fetch detailed variant history
        try {
            const token = localStorage.getItem('auth_token');
            const res = await axios.get(`/api/product/pricing-packaging/${prod.id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.data?.data) {
                setPricingHistory(res.data.data.commercial_pricings || []);
            }
        } catch (err) {
            console.error('Failed to fetch pricing history', err);
        }
    };

    // Save Commercial Pricing & Packaging Changes
    const handleSavePricing = async (e) => {
        e.preventDefault();
        setSaving(true);
        setModalError(null);
        setModalSuccess(null);

        try {
            const token = localStorage.getItem('auth_token');
            const payload = {
                cost_price: pricingForm.cost_price ? parseFloat(pricingForm.cost_price) : null,
                selling_price: pricingForm.selling_price ? parseFloat(pricingForm.selling_price) : null,
                price_basis: pricingForm.price_basis || 'PCS',
                pieces_per_box: pricingForm.pieces_per_box ? parseInt(pricingForm.pieces_per_box, 10) : null,
                package_weight_kg: pricingForm.package_weight_kg ? parseFloat(pricingForm.package_weight_kg) : null
            };

            const res = await axios.post(`/api/product/pricing-packaging/${selectedProduct.id}`, payload, {
                headers: { Authorization: `Bearer ${token}` }
            });

            setModalSuccess('Commercial pricing & packaging settings saved successfully!');
            setTimeout(() => {
                setShowEditModal(false);
                fetchProducts(currentPage);
            }, 800);
        } catch (err) {
            setModalError(err.response?.data?.message || 'Failed to save commercial settings.');
        } finally {
            setSaving(false);
        }
    };

    const formatCurrency = (val) => {
        if (val === null || val === undefined || val === '') return '—';
        return `₹${parseFloat(val).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    };

    return (
        <div className="container-fluid py-4">
            {/* Header Section */}
            <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-4 pb-2 border-bottom">
                <div>
                    <h3 className="fw-bold text-dark mb-1">
                        <i className="fa-solid fa-tags text-primary me-2"></i>
                        Product Pricing & Packaging
                    </h3>
                    <p className="text-muted small mb-0">
                        Maintain organization commercial cost price, selling price, and active packaging rules per variant.
                    </p>
                </div>
                <div className="mt-3 mt-md-0">
                    <span className="badge bg-light text-secondary border px-3 py-2">
                        <i className="fa-solid fa-building me-1"></i> Organization Scoped Settings
                    </span>
                </div>
            </div>

            {/* Filter Bar */}
            <div className="card shadow-sm border-0 mb-4 bg-white rounded-3">
                <div className="card-body p-3">
                    <div className="row g-3 align-items-center">
                        <div className="col-md-4">
                            <div className="input-group input-group-sm">
                                <span className="input-group-text bg-light border-end-0">
                                    <i className="fa-solid fa-magnifying-glass text-muted"></i>
                                </span>
                                <input
                                    type="text"
                                    className="form-control border-start-0 bg-light"
                                    placeholder="Search by product name, SKU, or barcode..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="col-md-3">
                            <select
                                className="form-select form-select-sm bg-light"
                                value={categoryFilter}
                                onChange={(e) => setCategoryFilter(e.target.value)}
                            >
                                <option value="">All Categories</option>
                                {categories.map(cat => (
                                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                                ))}
                            </select>
                        </div>

                        <div className="col-md-3">
                            <select
                                className="form-select form-select-sm bg-light"
                                value={brandFilter}
                                onChange={(e) => setBrandFilter(e.target.value)}
                            >
                                <option value="">All Brands</option>
                                {brands.map(b => (
                                    <option key={b.id} value={b.id}>{b.name}</option>
                                ))}
                            </select>
                        </div>

                        <div className="col-md-2">
                            <select
                                className="form-select form-select-sm bg-light"
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                            >
                                <option value="all">All Pricing</option>
                                <option value="priced">Priced Only</option>
                                <option value="unpriced">Unpriced Only</option>
                            </select>
                        </div>
                    </div>
                </div>
            </div>

            {/* Products Commercial Registry Table */}
            <div className="card shadow-sm border-0 rounded-3">
                <div className="card-body p-0">
                    {loading ? (
                        <div className="text-center py-5">
                            <div className="spinner-border text-primary" role="status">
                                <span className="visually-hidden">Loading pricing settings...</span>
                            </div>
                            <div className="text-muted small mt-2">Loading commercial pricing registry...</div>
                        </div>
                    ) : products.length === 0 ? (
                        <div className="text-center py-5">
                            <i className="fa-solid fa-tags text-muted fs-1 mb-2 opacity-50"></i>
                            <h6 className="fw-semibold text-secondary">No Product Variants Found</h6>
                            <p className="text-muted small mb-0">Try clearing search filters or add products in Product Catalog.</p>
                        </div>
                    ) : (
                        <div className="table-responsive">
                            <table className="table table-hover align-middle mb-0">
                                <thead className="table-light">
                                    <tr className="small text-uppercase text-muted">
                                        <th className="ps-3 py-3">Product Variant</th>
                                        <th>Category & Brand</th>
                                        <th className="text-end">Cost Price (CP)</th>
                                        <th className="text-end">Selling Price (SP)</th>
                                        <th>Price Basis</th>
                                        <th>Commercial Packaging</th>
                                        <th className="pe-3 text-end">Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {products.map(prod => {
                                        const cp = prod.current_commercial_pricing;
                                        const basis = cp?.price_basis || (isSlabCategory(prod.category) ? 'SQFT' : 'PCS');
                                        const isTile = isTileCategory(prod.category);
                                        const isSlab = isSlabCategory(prod.category);

                                        return (
                                            <tr key={prod.id}>
                                                <td className="ps-3 py-3">
                                                    <div className="fw-bold text-dark mb-0">{prod.name}</div>
                                                    <div className="text-muted small font-monospace">SKU: {prod.sku}</div>
                                                </td>
                                                <td>
                                                    <span className="badge bg-primary-subtle text-primary border border-primary-subtle me-1">
                                                        {prod.category?.name || 'Uncategorized'}
                                                    </span>
                                                    <span className="badge bg-secondary-subtle text-secondary border border-secondary-subtle">
                                                        {prod.brand?.name || 'Generic'}
                                                    </span>
                                                </td>
                                                <td className="text-end fw-semibold text-dark">
                                                    {formatCurrency(cp?.cost_price)}
                                                </td>
                                                <td className="text-end fw-bold text-success">
                                                    {formatCurrency(cp?.selling_price)}
                                                </td>
                                                <td>
                                                    <span className="badge bg-info-subtle text-info-emphasis border border-info-subtle">
                                                        Per {basis === 'SQFT' ? 'Sq.Ft.' : basis === 'PCS' ? 'Piece' : basis}
                                                    </span>
                                                </td>
                                                <td>
                                                    {isTile ? (
                                                        cp?.pieces_per_box || prod.pieces_per_box ? (
                                                            <span className="text-dark small fw-semibold">
                                                                <i className="fa-solid fa-box text-warning me-1"></i>
                                                                1 Box = {cp?.pieces_per_box || prod.pieces_per_box} Pieces
                                                            </span>
                                                        ) : (
                                                            <span className="text-muted small italic">Not set</span>
                                                        )
                                                    ) : isSlab ? (
                                                        <span className="text-secondary small">
                                                            <i className="fa-solid fa-ruler-combined text-primary me-1"></i>
                                                            Slab / Batch Based
                                                        </span>
                                                    ) : (
                                                        <span className="text-muted small">Standard Packaging</span>
                                                    )}
                                                </td>
                                                <td className="pe-3 text-end">
                                                    <button
                                                        className="btn btn-outline-primary btn-sm px-3 shadow-2xs"
                                                        onClick={() => handleOpenEdit(prod)}
                                                    >
                                                        <i className="fa-solid fa-pen-to-square me-1"></i> Edit Commercials
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* Footer Pagination */}
                {!loading && products.length > 0 && (
                    <div className="card-footer bg-white border-0 py-3 d-flex flex-column flex-md-row align-items-center justify-content-between">
                        <div className="text-muted small mb-2 mb-md-0">
                            Showing page <span className="fw-bold">{currentPage}</span> of <span className="fw-bold">{lastPage}</span> ({totalProducts} total variants)
                        </div>
                        <ul className="pagination pagination-sm mb-0">
                            <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                                <button className="page-link" onClick={() => fetchProducts(currentPage - 1)}>Previous</button>
                            </li>
                            {Array.from({ length: lastPage }, (_, i) => i + 1).map(p => (
                                <li key={p} className={`page-item ${currentPage === p ? 'active' : ''}`}>
                                    <button className="page-link" onClick={() => fetchProducts(p)}>{p}</button>
                                </li>
                            ))}
                            <li className={`page-item ${currentPage === lastPage ? 'disabled' : ''}`}>
                                <button className="page-link" onClick={() => fetchProducts(currentPage + 1)}>Next</button>
                            </li>
                        </ul>
                    </div>
                )}
            </div>

            {/* Commercial Settings Edit Modal */}
            {showEditModal && selectedProduct && (
                <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} tabIndex="-1">
                    <div className="modal-dialog modal-lg modal-dialog-centered">
                        <div className="modal-content shadow-lg border-0">
                            <div className="modal-header bg-dark text-white py-3">
                                <div>
                                    <h5 className="modal-title fw-bold mb-0">
                                        <i className="fa-solid fa-sliders text-warning me-2"></i>
                                        Commercial Settings: {selectedProduct.name}
                                    </h5>
                                    <small className="text-light opacity-75 font-monospace">SKU: {selectedProduct.sku}</small>
                                </div>
                                <button type="button" className="btn-close btn-close-white" onClick={() => setShowEditModal(false)}></button>
                            </div>

                            <form onSubmit={handleSavePricing}>
                                <div className="modal-body p-4">
                                    {modalError && (
                                        <div className="alert alert-danger small py-2 mb-3">
                                            <i className="fa-solid fa-triangle-exclamation me-1"></i> {modalError}
                                        </div>
                                    )}
                                    {modalSuccess && (
                                        <div className="alert alert-success small py-2 mb-3">
                                            <i className="fa-solid fa-circle-check me-1"></i> {modalSuccess}
                                        </div>
                                    )}

                                    {/* Section A: Pricing Settings */}
                                    <div className="mb-4">
                                        <h6 className="text-primary fw-bold mb-3 border-bottom pb-2">
                                            <i className="fa-solid fa-indian-rupee-sign me-1"></i> Pricing Configuration
                                        </h6>
                                        <div className="row g-3">
                                            <div className="col-md-4">
                                                <label className="form-label small fw-semibold">Cost Price (CP)</label>
                                                <div className="input-group input-group-sm">
                                                    <span className="input-group-text">₹</span>
                                                    <input
                                                        type="number"
                                                        step="0.01"
                                                        min="0"
                                                        className="form-control font-monospace"
                                                        placeholder="e.g. 180.00"
                                                        value={pricingForm.cost_price}
                                                        onChange={(e) => setPricingForm({ ...pricingForm, cost_price: e.target.value })}
                                                    />
                                                </div>
                                            </div>

                                            <div className="col-md-4">
                                                <label className="form-label small fw-semibold">Selling Price (SP)</label>
                                                <div className="input-group input-group-sm">
                                                    <span className="input-group-text">₹</span>
                                                    <input
                                                        type="number"
                                                        step="0.01"
                                                        min="0"
                                                        className="form-control font-monospace text-success fw-bold"
                                                        placeholder="e.g. 250.00"
                                                        value={pricingForm.selling_price}
                                                        onChange={(e) => setPricingForm({ ...pricingForm, selling_price: e.target.value })}
                                                    />
                                                </div>
                                            </div>

                                            <div className="col-md-4">
                                                <label className="form-label small fw-semibold">Price Basis / Unit</label>
                                                <select
                                                    className="form-select form-select-sm"
                                                    value={pricingForm.price_basis}
                                                    onChange={(e) => setPricingForm({ ...pricingForm, price_basis: e.target.value })}
                                                >
                                                    <option value="PCS">Per Piece</option>
                                                    <option value="SQFT">Per Sq.Ft.</option>
                                                    <option value="BOX">Per Box</option>
                                                    <option value="BAG">Per Bag</option>
                                                    <option value="KG">Per Kg</option>
                                                </select>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Section B: Commercial Packaging */}
                                    <div className="mb-4">
                                        <h6 className="text-primary fw-bold mb-3 border-bottom pb-2">
                                            <i className="fa-solid fa-box-open me-1"></i> Organization Commercial Packaging
                                        </h6>

                                        {isTileCategory(selectedProduct.category) ? (
                                            <div className="p-3 bg-light rounded border">
                                                <div className="row align-items-center">
                                                    <div className="col-md-6">
                                                        <label className="form-label small fw-semibold text-dark mb-1">Pieces per Box</label>
                                                        <input
                                                            type="number"
                                                            min="1"
                                                            step="1"
                                                            className="form-control form-control-sm font-monospace"
                                                            placeholder="e.g. 4"
                                                            value={pricingForm.pieces_per_box}
                                                            onChange={(e) => setPricingForm({ ...pricingForm, pieces_per_box: e.target.value })}
                                                        />
                                                    </div>
                                                    <div className="col-md-6 mt-2 mt-md-0">
                                                        <small className="text-muted">
                                                            <i className="fa-solid fa-info-circle me-1 text-info"></i>
                                                            {pricingForm.pieces_per_box && parseInt(pricingForm.pieces_per_box, 10) > 0
                                                                ? `Current setting: 1 box contains ${pricingForm.pieces_per_box} pieces.`
                                                                : 'Specify standard commercial pieces per box for tiles.'
                                                            }
                                                        </small>
                                                    </div>
                                                </div>
                                            </div>
                                        ) : isBaggedCategory(selectedProduct.category) ? (
                                            <div className="p-3 bg-light rounded border">
                                                <div className="row align-items-center">
                                                    <div className="col-md-6">
                                                        <label className="form-label small fw-semibold text-dark mb-1">Package Weight (KG)</label>
                                                        <input
                                                            type="number"
                                                            min="0"
                                                            step="0.1"
                                                            className="form-control form-control-sm font-monospace"
                                                            placeholder="e.g. 20.0"
                                                            value={pricingForm.package_weight_kg}
                                                            onChange={(e) => setPricingForm({ ...pricingForm, package_weight_kg: e.target.value })}
                                                        />
                                                    </div>
                                                    <div className="col-md-6 mt-2 mt-md-0">
                                                        <small className="text-muted">
                                                            <i className="fa-solid fa-info-circle me-1 text-info"></i>
                                                            Standard bag weight in Kg.
                                                        </small>
                                                    </div>
                                                </div>
                                            </div>
                                        ) : isSlabCategory(selectedProduct.category) ? (
                                            <div className="p-3 bg-light rounded border">
                                                <small className="text-secondary">
                                                    <i className="fa-solid fa-ruler-combined me-1 text-primary"></i>
                                                    Granite/Marble slabs use batch-specific dimensional measurements (Length × Width = Sq.Ft.). Box packaging is not required.
                                                </small>
                                            </div>
                                        ) : (
                                            <div className="p-3 bg-light rounded border text-muted small">
                                                Standard unit packaging applies to this product category.
                                            </div>
                                        )}
                                    </div>

                                    {/* Section C: Pricing History Audit Log */}
                                    <div>
                                        <h6 className="text-secondary fw-bold mb-2 border-bottom pb-2 small">
                                            <i className="fa-solid fa-clock-rotate-left me-1"></i> Commercial Pricing Effective History
                                        </h6>
                                        {pricingHistory.length === 0 ? (
                                            <div className="text-muted small italic">No historical price changes recorded.</div>
                                        ) : (
                                            <div className="table-responsive" style={{ maxHeight: '150px' }}>
                                                <table className="table table-sm table-bordered align-middle small mb-0">
                                                    <thead className="table-light">
                                                        <tr>
                                                            <th>Effective From</th>
                                                            <th>Effective To</th>
                                                            <th className="text-end">CP</th>
                                                            <th className="text-end">SP</th>
                                                            <th>Basis</th>
                                                            <th>Updated By</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {pricingHistory.map((h, idx) => (
                                                            <tr key={h.id || idx} className={h.is_current ? 'table-success-subtle fw-semibold' : ''}>
                                                                <td>{h.effective_from ? new Date(h.effective_from).toLocaleDateString() : '—'}</td>
                                                                <td>{h.is_current ? <span className="badge bg-success">Current Active</span> : (h.effective_to ? new Date(h.effective_to).toLocaleDateString() : '—')}</td>
                                                                <td className="text-end">{formatCurrency(h.cost_price)}</td>
                                                                <td className="text-end">{formatCurrency(h.selling_price)}</td>
                                                                <td>{h.price_basis}</td>
                                                                <td>{h.creator?.name || 'System'}</td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="modal-footer bg-light py-2">
                                    <button type="button" className="btn btn-secondary btn-sm px-3" onClick={() => setShowEditModal(false)}>
                                        Cancel
                                    </button>
                                    <button type="submit" className="btn btn-primary btn-sm px-4" disabled={saving}>
                                        {saving ? (
                                            <>
                                                <span className="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>
                                                Saving...
                                            </>
                                        ) : (
                                            <>
                                                <i className="fa-solid fa-check me-1"></i> Save Changes
                                            </>
                                        )}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
