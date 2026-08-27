import React, { useState, useEffect } from 'react';
import axios from 'axios';

export default function ProductBatchPriceManagement() {
    const [batchPrices, setBatchPrices] = useState([]);
    const [loading, setLoading] = useState(false);
    const [savingId, setSavingId] = useState(null);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);

    // Filters & Pagination
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [lastPage, setLastPage] = useState(1);
    const [total, setTotal] = useState(0);

    // Editing local state map: { [id]: { cost_price, sale_price } }
    const [editPrices, setEditPrices] = useState({});

    // Check authority permission
    const canUpdatePrice = (() => {
        try {
            const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
            const storedPerms = JSON.parse(localStorage.getItem('user_permissions') || '[]');
            if (storedUser.organization_id === null || storedUser.roles?.some(r => r.slug === 'super-admin' || r.slug === 'administrator')) {
                return true;
            }
            return storedPerms.includes('*') || storedPerms.includes('products.batch_prices.update');
        } catch (e) {
            return false;
        }
    })();

    const fetchBatchPrices = async (page = 1) => {
        setLoading(true);
        setError(null);
        try {
            const token = localStorage.getItem('auth_token');
            const res = await axios.get('/api/product-batch-prices', {
                params: {
                    page,
                    search,
                    status: statusFilter,
                },
                headers: { Authorization: `Bearer ${token}` }
            });

            const data = res.data;
            setBatchPrices(data.data || []);
            setCurrentPage(data.current_page || 1);
            setLastPage(data.last_page || 1);
            setTotal(data.total || 0);

            // Populate editPrices state map
            const priceMap = {};
            (data.data || []).forEach(item => {
                priceMap[item.id] = {
                    cost_price: item.cost_price !== null ? item.cost_price : '',
                    sale_price: item.sale_price !== null ? item.sale_price : ''
                };
            });
            setEditPrices(priceMap);
        } catch (err) {
            setError('Failed to load product batch pricing records.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchBatchPrices(1);
    }, [search, statusFilter]);

    const handleInputChange = (id, field, value) => {
        setEditPrices(prev => ({
            ...prev,
            [id]: {
                ...prev[id],
                [field]: value
            }
        }));
    };

    const handleSavePrice = async (id) => {
        if (!canUpdatePrice) {
            setError('You do not have permission to set or update product batch prices.');
            return;
        }

        setSavingId(id);
        setError(null);
        setSuccess(null);

        const currentEdit = editPrices[id] || {};
        const payload = {
            cost_price: currentEdit.cost_price === '' ? null : parseFloat(currentEdit.cost_price),
            sale_price: currentEdit.sale_price === '' ? null : parseFloat(currentEdit.sale_price),
        };

        try {
            const token = localStorage.getItem('auth_token');
            const res = await axios.put(`/api/product-batch-prices/${id}`, payload, {
                headers: { Authorization: `Bearer ${token}` }
            });

            setSuccess(`Batch pricing updated successfully!`);
            // Refresh list entry
            const updated = res.data.data;
            setBatchPrices(prev => prev.map(item => item.id === id ? updated : item));
            setTimeout(() => setSuccess(null), 3000);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to update batch price. Please check input values.');
        } finally {
            setSavingId(null);
        }
    };

    return (
        <div className="animate__animated animate__fadeIn">
            <div className="d-flex align-items-center justify-content-between mb-4">
                <div>
                    <h3 className="fw-bold text-dark mb-1">
                        <i className="fa-solid fa-tags text-primary me-2"></i>Product Batch Pricing Registry
                    </h3>
                    <p className="text-muted small mb-0">
                        Set and manage Cost Price and Sale Price associated with product variant batch numbers received via GRN.
                    </p>
                </div>
                {!canUpdatePrice && (
                    <div className="badge bg-warning-subtle text-warning border border-warning px-3 py-2">
                        <i className="fa-solid fa-lock me-1"></i> Read-Only Mode (Permission Required)
                    </div>
                )}
            </div>

            {error && (
                <div className="alert alert-danger d-flex align-items-center animate__animated animate__shakeX" role="alert">
                    <i className="fa-solid fa-circle-exclamation me-2"></i>
                    <div>{error}</div>
                </div>
            )}

            {success && (
                <div className="alert alert-success d-flex align-items-center animate__animated animate__fadeIn" role="alert">
                    <i className="fa-solid fa-circle-check me-2"></i>
                    <div>{success}</div>
                </div>
            )}

            {/* Filter Bar */}
            <div className="card border-0 shadow-sm p-4 mb-4" style={{ borderRadius: '12px' }}>
                <div className="row g-3">
                    <div className="col-md-6">
                        <label className="form-label small fw-semibold">Search Variant / Batch #</label>
                        <div className="input-group input-group-sm">
                            <span className="input-group-text bg-light border-end-0">
                                <i className="fa-solid fa-magnifying-glass text-muted"></i>
                            </span>
                            <input
                                type="text"
                                className="form-control border-start-0"
                                placeholder="Search by variant name, SKU, or batch number..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>
                    </div>
                    <div className="col-md-4">
                        <label className="form-label small fw-semibold">Pricing Status</label>
                        <select
                            className="form-select form-select-sm"
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                        >
                            <option value="">-- All Batches ({total}) --</option>
                            <option value="unpriced">Pending Pricing (Cost/Sale Empty)</option>
                            <option value="priced">Fully Priced Batches</option>
                        </select>
                    </div>
                    <div className="col-md-2 d-flex align-items-end">
                        <button
                            className="btn btn-outline-secondary btn-sm w-100"
                            onClick={() => {
                                setSearch('');
                                setStatusFilter('');
                            }}
                        >
                            <i className="fa-solid fa-rotate-left me-1"></i> Reset
                        </button>
                    </div>
                </div>
            </div>

            {/* Table */}
            <div className="card border-0 shadow-sm p-4" style={{ borderRadius: '12px' }}>
                {loading ? (
                    <div className="text-center py-5">
                        <div className="spinner-border text-primary" role="status"></div>
                        <span className="ms-2 font-monospace">Loading batch pricing records...</span>
                    </div>
                ) : (
                    <>
                        <div className="table-responsive">
                            <table className="table table-hover align-middle">
                                <thead>
                                    <tr className="text-secondary font-monospace" style={{ fontSize: '0.8rem' }}>
                                        <th>Product Variant</th>
                                        <th>Batch Number</th>
                                        <th>Status</th>
                                        <th style={{ width: '170px' }}>Cost Price (INR)</th>
                                        <th style={{ width: '170px' }}>Sale Price (INR)</th>
                                        <th>Created By</th>
                                        <th className="text-end">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {batchPrices.map((bp) => {
                                        const editState = editPrices[bp.id] || { cost_price: '', sale_price: '' };
                                        const isPriced = bp.cost_price !== null && bp.sale_price !== null;
                                        const isSaving = savingId === bp.id;

                                        return (
                                            <tr key={bp.id}>
                                                <td>
                                                    <div className="fw-bold text-dark">
                                                        {bp.product_variant?.name || 'Unknown Variant'}
                                                    </div>
                                                    <div className="text-muted small font-monospace">
                                                        SKU: {bp.product_variant?.sku || 'N/A'} | Unit: {bp.product_variant?.base_unit?.name || '-'}
                                                    </div>
                                                </td>
                                                <td>
                                                    <span className="badge bg-light text-primary border border-primary-subtle px-2 py-1 font-monospace">
                                                        <i className="fa-solid fa-barcode me-1"></i>
                                                        {bp.batch_number}
                                                    </span>
                                                </td>
                                                <td>
                                                    {isPriced ? (
                                                        <span className="badge bg-success-subtle text-success px-2 py-1">
                                                            <i className="fa-solid fa-check-circle me-1"></i> Priced
                                                        </span>
                                                    ) : (
                                                        <span className="badge bg-warning-subtle text-warning px-2 py-1">
                                                            <i className="fa-solid fa-clock me-1"></i> Pending Price
                                                        </span>
                                                    )}
                                                </td>
                                                <td>
                                                    <input
                                                        type="number"
                                                        step="0.0001"
                                                        min="0"
                                                        className="form-control form-control-sm font-monospace"
                                                        placeholder="Enter Cost Price"
                                                        value={editState.cost_price}
                                                        onChange={(e) => handleInputChange(bp.id, 'cost_price', e.target.value)}
                                                        disabled={!canUpdatePrice || isSaving}
                                                    />
                                                </td>
                                                <td>
                                                    <input
                                                        type="number"
                                                        step="0.0001"
                                                        min="0"
                                                        className="form-control form-control-sm font-monospace fw-bold text-success"
                                                        placeholder="Enter Sale Price"
                                                        value={editState.sale_price}
                                                        onChange={(e) => handleInputChange(bp.id, 'sale_price', e.target.value)}
                                                        disabled={!canUpdatePrice || isSaving}
                                                    />
                                                </td>
                                                <td>
                                                    <div className="small text-secondary">
                                                        {bp.creator?.name || 'System / Auto'}
                                                    </div>
                                                    <div className="text-muted font-monospace" style={{ fontSize: '0.75rem' }}>
                                                        {new Date(bp.created_at).toLocaleDateString()}
                                                    </div>
                                                </td>
                                                <td className="text-end">
                                                    <button
                                                        className="btn btn-sm btn-primary px-3"
                                                        onClick={() => handleSavePrice(bp.id)}
                                                        disabled={!canUpdatePrice || isSaving}
                                                    >
                                                        {isSaving ? (
                                                            <>
                                                                <span className="spinner-border spinner-border-sm me-1" role="status"></span>
                                                                Saving...
                                                            </>
                                                        ) : (
                                                            <>
                                                                <i className="fa-solid fa-floppy-disk me-1"></i> Save
                                                            </>
                                                        )}
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                    {batchPrices.length === 0 && (
                                        <tr>
                                            <td colSpan="7" className="text-center py-5 text-muted font-monospace">
                                                No batch pricing records found matching current search filters.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination Controls */}
                        {lastPage > 1 && (
                            <div className="d-flex align-items-center justify-content-between pt-3 border-top mt-3">
                                <div className="text-muted small">
                                    Page {currentPage} of {lastPage} (Total: {total} records)
                                </div>
                                <div className="btn-group btn-group-sm">
                                    <button
                                        className="btn btn-outline-secondary"
                                        disabled={currentPage <= 1}
                                        onClick={() => fetchBatchPrices(currentPage - 1)}
                                    >
                                        <i className="fa-solid fa-chevron-left me-1"></i> Previous
                                    </button>
                                    <button
                                        className="btn btn-outline-secondary"
                                        disabled={currentPage >= lastPage}
                                        onClick={() => fetchBatchPrices(currentPage + 1)}
                                    >
                                        Next <i className="fa-solid fa-chevron-right ms-1"></i>
                                    </button>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}
