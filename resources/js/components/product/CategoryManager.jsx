import React, { useState, useEffect } from 'react';
import axios from 'axios';

export default function CategoryManager() {
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);

    // Search, Filter & Pagination states
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all'); // all, active, inactive
    const [currentPage, setCurrentPage] = useState(1);
    const [perPage, setPerPage] = useState(10);

    // Modal state
    const [showModal, setShowModal] = useState(false);
    const [modalMode, setModalMode] = useState('create'); // create, edit
    const [selectedCategory, setSelectedCategory] = useState(null);

    const [units, setUnits] = useState([]);

    const [form, setForm] = useState({
        name: '',
        slug: '',
        parent_id: '',
        description: '',
        sort_order: '0',
        is_active: true,
        default_base_unit_id: '',
        default_purchase_unit_id: '',
        default_sales_unit_id: ''
    });

    const fetchCategories = async () => {
        setLoading(true);
        setError(null);
        try {
            const token = localStorage.getItem('auth_token');
            const [catRes, formRes] = await Promise.all([
                axios.get('/api/categories-crud', { headers: { Authorization: `Bearer ${token}` } }),
                axios.get('/api/product/form-data', { headers: { Authorization: `Bearer ${token}` } })
            ]);
            setCategories(catRes.data || []);
            setUnits(formRes.data?.units || []);
        } catch (err) {
            setError('Failed to fetch categories list.');
        } finally {
            setLoading(false);
        }
    };

    const handleOpenCreate = () => {
        setModalMode('create');
        setSelectedCategory(null);
        setForm({
            name: '',
            slug: '',
            parent_id: '',
            description: '',
            sort_order: '0',
            is_active: true,
            default_base_unit_id: '',
            default_purchase_unit_id: '',
            default_sales_unit_id: ''
        });
        setError(null);
        setShowModal(true);
    };

    const handleOpenEdit = (category) => {
        setModalMode('edit');
        setSelectedCategory(category);
        setForm({
            name: category.name || '',
            slug: category.slug || '',
            parent_id: category.parent_id ? category.parent_id.toString() : '',
            description: category.description || '',
            sort_order: category.sort_order !== undefined ? category.sort_order.toString() : '0',
            is_active: category.is_active === 1 || category.is_active === true,
            default_base_unit_id: category.default_base_unit_id ? category.default_base_unit_id.toString() : '',
            default_purchase_unit_id: category.default_purchase_unit_id ? category.default_purchase_unit_id.toString() : '',
            default_sales_unit_id: category.default_sales_unit_id ? category.default_sales_unit_id.toString() : ''
        });
        setError(null);
        setShowModal(true);
    };

    // Category Specifications Modal state
    const [showAttrModal, setShowAttrModal] = useState(false);
    const [selectedCategoryForAttrs, setSelectedCategoryForAttrs] = useState(null);
    const [attrLoading, setAttrLoading] = useState(false);
    const [attrSaving, setAttrSaving] = useState(false);
    const [attrError, setAttrError] = useState(null);
    const [attrSuccess, setAttrSuccess] = useState(null);

    const [directAttrs, setDirectAttrs] = useState([]);
    const [inheritedFrom, setInheritedFrom] = useState(null);
    const [inheritedAttrs, setInheritedAttrs] = useState([]);
    const [availableSystemAttrs, setAvailableSystemAttrs] = useState([]);
    const [selectedNewAttrId, setSelectedNewAttrId] = useState('');

    const handleOpenAttributesModal = async (category) => {
        setSelectedCategoryForAttrs(category);
        setAttrError(null);
        setAttrSuccess(null);
        setAttrLoading(true);
        setSelectedNewAttrId('');
        setShowAttrModal(true);

        try {
            const token = localStorage.getItem('auth_token');
            const res = await axios.get(`/api/categories/${category.id}/category-attributes`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = res.data || {};
            setDirectAttrs(data.direct_attributes || []);
            setInheritedFrom(data.inherited_from || null);
            setInheritedAttrs(data.inherited_attributes || []);
            setAvailableSystemAttrs(data.available_attributes || []);
        } catch (err) {
            setAttrError('Failed to load category specification attributes.');
        } finally {
            setAttrLoading(false);
        }
    };

    const handleAddAttributeToCategory = () => {
        if (!selectedNewAttrId) return;
        const attrObj = availableSystemAttrs.find(a => a.id.toString() === selectedNewAttrId.toString());
        if (!attrObj) return;

        if (directAttrs.some(a => a.attribute_id === attrObj.id)) {
            setAttrError(`Attribute "${attrObj.name}" is already assigned to this category.`);
            return;
        }

        const newDirectAttr = {
            attribute_id: attrObj.id,
            name: attrObj.name,
            slug: attrObj.slug,
            type: attrObj.type,
            unit_symbol: attrObj.unit_symbol,
            is_required: false,
            sort_order: directAttrs.length + 1,
            allowed_values: []
        };

        setDirectAttrs(prev => [...prev, newDirectAttr]);
        setSelectedNewAttrId('');
        setAttrError(null);
    };

    const handleRemoveAttributeFromCategory = (index) => {
        setDirectAttrs(prev => prev.filter((_, i) => i !== index));
    };

    const handleUpdateDirectAttrField = (index, field, value) => {
        setDirectAttrs(prev => {
            const updated = [...prev];
            updated[index] = { ...updated[index], [field]: value };
            return updated;
        });
    };

    const handleSaveCategoryAttributes = async () => {
        if (!selectedCategoryForAttrs) return;
        setAttrError(null);
        setAttrSuccess(null);
        setAttrSaving(true);

        try {
            const token = localStorage.getItem('auth_token');
            const payload = {
                attributes: directAttrs.map(a => ({
                    attribute_id: a.attribute_id,
                    is_required: a.is_required,
                    sort_order: parseInt(a.sort_order, 10) || 0,
                    allowed_values: Array.isArray(a.allowed_values) 
                        ? a.allowed_values 
                        : (typeof a.allowed_values === 'string' ? a.allowed_values.split(',').map(s => s.trim()).filter(Boolean) : null)
                }))
            };

            await axios.post(`/api/categories/${selectedCategoryForAttrs.id}/category-attributes`, payload, {
                headers: { Authorization: `Bearer ${token}` }
            });

            setAttrSuccess(`Specification attributes for "${selectedCategoryForAttrs.name}" saved successfully.`);
            fetchCategories();
        } catch (err) {
            setAttrError(err.response?.data?.message || 'Failed to save category attributes.');
        } finally {
            setAttrSaving(false);
        }
    };

    useEffect(() => {
        fetchCategories();
    }, []);

    const handleDelete = async (category) => {
        if (!confirm(`Are you sure you want to delete category "${category.name}"? This action cannot be undone.`)) {
            return;
        }
        setError(null);
        setSuccess(null);
        try {
            const token = localStorage.getItem('auth_token');
            await axios.delete(`/api/categories-crud/${category.id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setSuccess('Category successfully deleted.');
            fetchCategories();
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to delete category.');
        }
    };

    const handleToggleStatus = async (category) => {
        const isActive = category.is_active === 1 || category.is_active === true;
        const newStatus = !isActive;
        const actionText = newStatus ? 'activate' : 'deactivate';

        if (!confirm(`Are you sure you want to ${actionText} category "${category.name}"?`)) {
            return;
        }

        setError(null);
        setSuccess(null);

        try {
            const token = localStorage.getItem('auth_token');
            await axios.put(`/api/categories-crud/${category.id}`, {
                is_active: newStatus
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setSuccess(`Category "${category.name}" successfully ${newStatus ? 'activated' : 'deactivated'}.`);
            fetchCategories();
        } catch (err) {
            setError(err.response?.data?.message || `Failed to ${actionText} category.`);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setSuccess(null);

        const payload = {
            ...form,
            sort_order: parseInt(form.sort_order, 10) || 0,
            parent_id: form.parent_id ? parseInt(form.parent_id, 10) : null,
            default_base_unit_id: form.default_base_unit_id ? parseInt(form.default_base_unit_id, 10) : null,
            default_purchase_unit_id: form.default_purchase_unit_id ? parseInt(form.default_purchase_unit_id, 10) : null,
            default_sales_unit_id: form.default_sales_unit_id ? parseInt(form.default_sales_unit_id, 10) : null,
        };

        try {
            const token = localStorage.getItem('auth_token');
            if (modalMode === 'create') {
                await axios.post('/api/categories-crud', payload, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setSuccess('Category created successfully.');
            } else {
                await axios.put(`/api/categories-crud/${selectedCategory.id}`, payload, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setSuccess('Category updated successfully.');
            }
            setShowModal(false);
            fetchCategories();
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to save category.');
        }
    };

    const handleChange = (field, value) => {
        setForm(prev => {
            const updated = { ...prev, [field]: value };
            if (field === 'name' && modalMode === 'create') {
                const autoSlug = value.toLowerCase().replace(/[^a-z0-9-_]/g, '-');
                const oldAutoSlug = (prev.name || '').toLowerCase().replace(/[^a-z0-9-_]/g, '-');
                if (!prev.slug || prev.slug === oldAutoSlug) {
                    updated.slug = autoSlug;
                }
            }
            return updated;
        });
    };

    const getUnitSymbol = (unitId, unitObj) => {
        if (unitObj?.symbol) return unitObj.symbol;
        if (unitObj?.name) return unitObj.name;
        if (!unitId) return null;
        const found = units.find(u => String(u.id) === String(unitId));
        return found ? (found.symbol || found.name) : null;
    };

    const getUnitFullName = (unitId, unitObj) => {
        if (unitObj?.name) return `${unitObj.name}${unitObj.symbol ? ` (${unitObj.symbol})` : ''}`;
        if (!unitId) return '';
        const found = units.find(u => String(u.id) === String(unitId));
        return found ? `${found.name}${found.symbol ? ` (${found.symbol})` : ''}` : '';
    };

    // Filter & Search calculation
    const filteredCategories = categories.filter(c => {
        const matchesStatus = 
            statusFilter === 'all' ? true :
            statusFilter === 'active' ? (c.is_active === 1 || c.is_active === true) :
            (c.is_active === 0 || c.is_active === false);

        if (!matchesStatus) return false;

        if (!searchTerm.trim()) return true;

        const term = searchTerm.toLowerCase();
        const nameMatch = (c.name || '').toLowerCase().includes(term);
        const slugMatch = (c.slug || '').toLowerCase().includes(term);
        const parentMatch = (c.parent?.name || '').toLowerCase().includes(term);
        const descMatch = (c.description || '').toLowerCase().includes(term);
        const baseUnitMatch = (c.default_base_unit?.name || '').toLowerCase().includes(term) || (c.default_base_unit?.symbol || '').toLowerCase().includes(term);
        const purchaseUnitMatch = (c.default_purchase_unit?.name || '').toLowerCase().includes(term) || (c.default_purchase_unit?.symbol || '').toLowerCase().includes(term);
        const salesUnitMatch = (c.default_sales_unit?.name || '').toLowerCase().includes(term) || (c.default_sales_unit?.symbol || '').toLowerCase().includes(term);

        return nameMatch || slugMatch || parentMatch || descMatch || baseUnitMatch || purchaseUnitMatch || salesUnitMatch;
    });

    const totalPages = Math.ceil(filteredCategories.length / perPage) || 1;
    const safeCurrentPage = Math.min(currentPage, totalPages);
    const indexOfFirstItem = (safeCurrentPage - 1) * perPage;
    const indexOfLastItem = Math.min(safeCurrentPage * perPage, filteredCategories.length);
    const paginatedCategories = filteredCategories.slice(indexOfFirstItem, indexOfLastItem);

    // Filter out the selected category itself to prevent self-reference
    const parentOptions = categories.filter(c => !selectedCategory || c.id !== selectedCategory.id);

    return (
        <div className="animate__animated animate__fadeIn">
            {/* Header Banner */}
            <div className="d-flex align-items-center justify-content-between mb-4">
                <div className="col-md-10">
                    <h3 className="fw-bold text-dark">
                        <i className="fa-solid fa-folder-tree me-2 text-primary"></i>Product Category Registry
                    </h3>
                    <div>
                        <strong>What is a Product Category?</strong> Product categories organize your inventory hierarchically (e.g., <i>Tiles &gt; Ceramic Tiles</i>). Categories define logical classification, tax configurations, and properties structure, helping group similar items together for catalog browsing, sales analysis, and stock reporting.
                    </div>
                    <p className="text-muted small mb-0">Define, edit, and group your catalog products by categories and subcategories.</p>
                </div>
                <button className="btn btn-primary shadow-sm" onClick={handleOpenCreate}>
                    <i className="fa-solid fa-plus me-2"></i> Add Category
                </button>
            </div>

            {error && (
                <div className="alert alert-danger d-flex align-items-center justify-content-between mb-4 animate__animated animate__shakeX" role="alert">
                    <div className="d-flex align-items-center">
                        <i className="fa-solid fa-circle-exclamation me-2"></i>
                        <div>{error}</div>
                    </div>
                    <button type="button" className="btn-close ms-2 flex-shrink-0" onClick={() => setError(null)} aria-label="Close"></button>
                </div>
            )}

            {success && (
                <div className="alert alert-success d-flex align-items-center justify-content-between mb-4 animate__animated animate__fadeIn" role="alert">
                    <div className="d-flex align-items-center">
                        <i className="fa-solid fa-circle-check me-2"></i>
                        <div>{success}</div>
                    </div>
                    <button type="button" className="btn-close ms-2 flex-shrink-0" onClick={() => setSuccess(null)} aria-label="Close"></button>
                </div>
            )}

            {/* Category Table Card */}
            <div className="card border-0 shadow-sm p-4" style={{ borderRadius: '12px' }}>
                {/* Search, Filter & Per-Page Controls */}
                <div className="row g-3 align-items-center mb-2">
                    <div className="col-md-5">
                        <div className="input-group">
                            <span className="input-group-text bg-white border-end-0 text-muted">
                                <i className="fa-solid fa-magnifying-glass"></i>
                            </span>
                            <input
                                type="text"
                                className="form-control border-start-0 ps-0"
                                placeholder="Search category, slug, units, parent..."
                                value={searchTerm}
                                onChange={(e) => {
                                    setSearchTerm(e.target.value);
                                    setCurrentPage(1);
                                }}
                            />
                            {searchTerm && (
                                <button 
                                    className="btn btn-outline-secondary border-start-0 bg-white text-muted"
                                    onClick={() => {
                                        setSearchTerm('');
                                        setCurrentPage(1);
                                    }}
                                    type="button"
                                >
                                    <i className="fa-solid fa-xmark"></i>
                                </button>
                            )}
                        </div>
                    </div>

                    <div className="col-md-3 col-6">
                        <select 
                            className="form-select"
                            value={statusFilter}
                            onChange={(e) => {
                                setStatusFilter(e.target.value);
                                setCurrentPage(1);
                            }}
                        >
                            <option value="all">All Statuses ({categories.length})</option>
                            <option value="active">Active Only ({categories.filter(c => c.is_active === 1 || c.is_active === true).length})</option>
                            <option value="inactive">Inactive Only ({categories.filter(c => c.is_active === 0 || c.is_active === false).length})</option>
                        </select>
                    </div>

                    <div className="col-md-2 col-6">
                        <select 
                            className="form-select"
                            value={perPage}
                            onChange={(e) => {
                                setPerPage(parseInt(e.target.value, 10));
                                setCurrentPage(1);
                            }}
                        >
                            <option value={10}>10 per page</option>
                            <option value={25}>25 per page</option>
                            <option value={50}>50 per page</option>
                            <option value={100}>100 per page</option>
                        </select>
                    </div>
                </div>

                {loading ? (
                    <div className="text-center py-5">
                        <div className="spinner-border text-primary" role="status"></div>
                        <span className="ms-2 font-monospace">Fetching categories catalog...</span>
                    </div>
                ) : (
                    <>
                        <div className="table-responsive">
                            <table className="table table-hover align-middle mb-0">
                                <thead>
                                    <tr className="text-secondary text-uppercase" style={{ fontSize: '0.75rem', letterSpacing: '0.04em' }}>
                                        <th style={{ width: '22%' }}>Category</th>
                                        <th style={{ width: '18%' }}>Parent Category</th>
                                        <th style={{ width: '32%' }}>
                                            Default Units (UOM)
                                            <span className="text-secondary font-monospace ms-1 fw-normal" style={{ fontSize: '0.68rem', textTransform: 'none' }}>
                                                [B: Base | P: Purchase | S: Sales]
                                            </span>
                                        </th>
                                        <th className="text-center" style={{ width: '8%' }}>Order</th>
                                        <th className="text-center" style={{ width: '10%' }}>Status</th>
                                        <th className="text-end" style={{ width: '10%' }}>Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="small">
                                    {paginatedCategories.map((c) => {
                                        const baseSym = getUnitSymbol(c.default_base_unit_id, c.default_base_unit);
                                        const purSym = getUnitSymbol(c.default_purchase_unit_id, c.default_purchase_unit);
                                        const saleSym = getUnitSymbol(c.default_sales_unit_id, c.default_sales_unit);
                                        const hasUnits = baseSym || purSym || saleSym;

                                        return (
                                            <tr key={c.id}>
                                                <td>
                                                    <div className="d-flex align-items-center">
                                                        <i className="fa-solid fa-folder text-primary me-2 opacity-75"></i>
                                                        <div>
                                                            <div className="fw-semibold text-dark">{c.name}</div>
                                                            <div className="font-monospace text-muted extra-small">{c.slug}</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td>
                                                    {c.parent ? (
                                                        <span className="badge bg-light text-dark border font-normal">
                                                            {c.parent.name}
                                                        </span>
                                                    ) : (
                                                        <span className="text-muted small italic opacity-60">Root Category</span>
                                                    )}
                                                </td>
                                                <td>
                                                    {hasUnits ? (
                                                        <div className="d-flex align-items-center gap-1 flex-wrap">
                                                            {baseSym && (
                                                                <span 
                                                                    className="badge bg-primary-subtle text-primary border border-primary-subtle font-monospace px-2 py-1"
                                                                    title={`Base Stock Unit: ${getUnitFullName(c.default_base_unit_id, c.default_base_unit)}`}
                                                                >
                                                                    <span className="text-secondary opacity-75 me-1" style={{ fontSize: '0.65rem' }}>B:</span>{baseSym}
                                                                </span>
                                                            )}
                                                            {purSym && (
                                                                <span 
                                                                    className="badge bg-info-subtle text-info border border-info-subtle font-monospace px-2 py-1"
                                                                    title={`Purchase Unit: ${getUnitFullName(c.default_purchase_unit_id, c.default_purchase_unit)}`}
                                                                >
                                                                    <span className="text-secondary opacity-75 me-1" style={{ fontSize: '0.65rem' }}>P:</span>{purSym}
                                                                </span>
                                                            )}
                                                            {saleSym && (
                                                                <span 
                                                                    className="badge bg-success-subtle text-success border border-success-subtle font-monospace px-2 py-1"
                                                                    title={`Sales Unit: ${getUnitFullName(c.default_sales_unit_id, c.default_sales_unit)}`}
                                                                >
                                                                    <span className="text-secondary opacity-75 me-1" style={{ fontSize: '0.65rem' }}>S:</span>{saleSym}
                                                                </span>
                                                            )}
                                                        </div>
                                                    ) : (
                                                        <span className="text-muted italic small opacity-50">-</span>
                                                    )}
                                                </td>
                                                <td className="text-center font-monospace text-secondary">{c.sort_order}</td>
                                                <td className="text-center">
                                                    {c.is_active === 1 || c.is_active === true ? (
                                                        <span className="badge bg-success-subtle text-success px-2 py-1">
                                                            <i className="fa-solid fa-circle me-1" style={{ fontSize: '0.45rem' }}></i> Active
                                                        </span>
                                                    ) : (
                                                        <span className="badge bg-secondary-subtle text-secondary px-2 py-1">
                                                            <i className="fa-solid fa-circle me-1" style={{ fontSize: '0.45rem' }}></i> Inactive
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="text-end">
                                                    <div className="btn-group btn-group-sm">
                                                        <button
                                                            className="btn btn-sm btn-light text-info border-0 px-2"
                                                            onClick={() => handleOpenAttributesModal(c)}
                                                            title="Configure Product Specification Attributes (Specs)"
                                                        >
                                                            <i className="fa-solid fa-sliders"></i>
                                                        </button>
                                                        <button
                                                            className="btn btn-sm btn-light text-primary border-0 px-2"
                                                            onClick={() => handleOpenEdit(c)}
                                                            title="Edit Category"
                                                        >
                                                            <i className="fa-solid fa-pen-to-square"></i>
                                                        </button>
                                                        {c.is_active === 1 || c.is_active === true ? (
                                                            <button
                                                                className="btn btn-sm btn-light text-warning border-0 px-2"
                                                                onClick={() => handleToggleStatus(c)}
                                                                title="Deactivate Category"
                                                            >
                                                                <i className="fa-solid fa-ban"></i>
                                                            </button>
                                                        ) : (
                                                            <button
                                                                className="btn btn-sm btn-light text-success border-0 px-2"
                                                                onClick={() => handleToggleStatus(c)}
                                                                title="Activate Category"
                                                            >
                                                                <i className="fa-solid fa-circle-check"></i>
                                                            </button>
                                                        )}
                                                        <button
                                                            className="btn btn-sm btn-light text-danger border-0 px-2"
                                                            onClick={() => handleDelete(c)}
                                                            title="Delete Category"
                                                        >
                                                            <i className="fa-solid fa-trash-can"></i>
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                    {filteredCategories.length === 0 && (
                                        <tr>
                                            <td colSpan="6" className="text-center py-5">
                                                <div className="text-muted mb-2">
                                                    <i className="fa-solid fa-filter-circle-xmark fs-2 opacity-50"></i>
                                                </div>
                                                <div className="fw-semibold text-secondary mb-1">No matching categories found</div>
                                                <p className="text-muted small mb-3">Try adjusting your search query or status filter.</p>
                                                {(searchTerm || statusFilter !== 'all') && (
                                                    <button 
                                                        className="btn btn-outline-primary btn-sm px-3"
                                                        onClick={() => {
                                                            setSearchTerm('');
                                                            setStatusFilter('all');
                                                            setCurrentPage(1);
                                                        }}
                                                    >
                                                        <i className="fa-solid fa-rotate-left me-1"></i> Clear Search Filters
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination & Summary Footer */}
                        {filteredCategories.length > 0 && (
                            <div className="d-flex flex-column flex-md-row align-items-center justify-content-between pt-3 border-top gap-3">
                                <div className="text-muted small">
                                    Showing <span className="fw-bold text-dark">{indexOfFirstItem + 1}</span> to <span className="fw-bold text-dark">{indexOfLastItem}</span> of <span className="fw-bold text-dark">{filteredCategories.length}</span> categories
                                    {categories.length !== filteredCategories.length && (
                                        <span className="ms-1 text-secondary">(filtered from {categories.length} total)</span>
                                    )}
                                </div>

                                <nav aria-label="Category pagination">
                                    <ul className="pagination pagination-sm mb-0">
                                        <li className={`page-item ${safeCurrentPage === 1 ? 'disabled' : ''}`}>
                                            <button className="page-link" onClick={() => setCurrentPage(1)} disabled={safeCurrentPage === 1} title="First Page">
                                                <i className="fa-solid fa-angles-left"></i>
                                            </button>
                                        </li>
                                        <li className={`page-item ${safeCurrentPage === 1 ? 'disabled' : ''}`}>
                                            <button className="page-link" onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} disabled={safeCurrentPage === 1}>
                                                Previous
                                            </button>
                                        </li>

                                        {Array.from({ length: totalPages }, (_, i) => i + 1)
                                            .filter(page => page === 1 || page === totalPages || Math.abs(page - safeCurrentPage) <= 1)
                                            .map((page, idx, arr) => {
                                                const prevPage = arr[idx - 1];
                                                const showEllipsis = prevPage && page - prevPage > 1;
                                                return (
                                                    <React.Fragment key={page}>
                                                        {showEllipsis && <li className="page-item disabled"><span className="page-link">...</span></li>}
                                                        <li className={`page-item ${safeCurrentPage === page ? 'active' : ''}`}>
                                                            <button className="page-link" onClick={() => setCurrentPage(page)}>
                                                                {page}
                                                            </button>
                                                        </li>
                                                    </React.Fragment>
                                                );
                                            })}

                                        <li className={`page-item ${safeCurrentPage === totalPages ? 'disabled' : ''}`}>
                                            <button className="page-link" onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} disabled={safeCurrentPage === totalPages}>
                                                Next
                                            </button>
                                        </li>
                                        <li className={`page-item ${safeCurrentPage === totalPages ? 'disabled' : ''}`}>
                                            <button className="page-link" onClick={() => setCurrentPage(totalPages)} disabled={safeCurrentPage === totalPages} title="Last Page">
                                                <i className="fa-solid fa-angles-right"></i>
                                            </button>
                                        </li>
                                    </ul>
                                </nav>
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* CREATE / EDIT MODAL */}
            {showModal && (
                <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)', zIndex: 1070 }}>
                    <div className="modal-dialog modal-dialog-centered">
                        <div className="modal-content border-0 shadow-lg" style={{ borderRadius: '16px' }}>
                            <div className="modal-header border-bottom-0 pb-0 pt-4 px-4">
                                <h5 className="modal-title fw-bold text-dark">
                                    <i className="fa-solid fa-folder-tree text-primary me-2"></i>
                                    {modalMode === 'create' ? 'Add Product Category' : 'Edit Product Category'}
                                </h5>
                                <button type="button" className="btn-close" onClick={() => setShowModal(false)} aria-label="Close"></button>
                            </div>
                            <form onSubmit={handleSubmit}>
                                <div className="modal-body px-4 py-3">
                                    <div className="mb-3">
                                        <label className="form-label small fw-semibold">Category Name *</label>
                                        <input
                                            type="text"
                                            className="form-control form-control-sm"
                                            value={form.name}
                                            onChange={(e) => handleChange('name', e.target.value)}
                                            placeholder="e.g. GVT Tiles, Bathware, Adhesive"
                                            required
                                        />
                                    </div>

                                    <div className="mb-3">
                                        <label className="form-label small fw-semibold">
                                            Slug {modalMode === 'edit' ? '(Permanent)' : '(Optional)'}
                                        </label>
                                        <input
                                            type="text"
                                            className="form-control form-control-sm font-monospace"
                                            value={form.slug}
                                            onChange={(e) => handleChange('slug', e.target.value.toLowerCase().replace(/[^a-z0-9-_]/g, '-'))}
                                            placeholder="e.g. gvt-tiles (auto-generated if left blank)"
                                            disabled={modalMode === 'edit'}
                                        />
                                        {modalMode === 'edit' && (
                                            <div className="form-text text-muted" style={{ fontSize: '0.72rem' }}>
                                                <i className="fa-solid fa-lock me-1"></i> Slug is permanent once created and cannot be modified.
                                            </div>
                                        )}
                                    </div>

                                    <div className="mb-3">
                                        <label className="form-label small fw-semibold">Parent Category</label>
                                        <select
                                            className="form-select form-select-sm"
                                            value={form.parent_id}
                                            onChange={(e) => handleChange('parent_id', e.target.value)}
                                        >
                                            <option value="">None (Top-Level Root)</option>
                                            {parentOptions.map(p => (
                                                <option key={p.id} value={p.id}>{p.name}</option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* Standard Category Units (UOM Defaults) */}
                                    <div className="card bg-light border-0 p-3 mb-3 rounded-3">
                                        <div className="fw-bold text-dark small mb-1 d-flex align-items-center">
                                            <i className="fa-solid fa-ruler-combined text-primary me-2"></i>
                                            Category Standard Units (UOM Defaults)
                                        </div>
                                        <div className="text-muted extra-small mb-2">
                                            {form.parent_id ? 'Optional: Override unit defaults inherited from parent category.' : 'Set standard unit defaults for product variants created under this root category.'}
                                        </div>
                                        <div className="row g-2">
                                            <div className="col-md-4">
                                                <label className="form-label extra-small fw-semibold text-secondary mb-1">Base Unit (Stock)</label>
                                                <select
                                                    className="form-select form-select-sm"
                                                    value={form.default_base_unit_id}
                                                    onChange={(e) => handleChange('default_base_unit_id', e.target.value)}
                                                >
                                                    <option value="">-- {form.parent_id ? 'Inherit' : 'Select Base Unit'} --</option>
                                                    {units.map(u => (
                                                        <option key={u.id} value={u.id}>{u.name} ({u.symbol})</option>
                                                    ))}
                                                </select>
                                            </div>
                                            <div className="col-md-4">
                                                <label className="form-label extra-small fw-semibold text-secondary mb-1">Default Purchase Unit</label>
                                                <select
                                                    className="form-select form-select-sm"
                                                    value={form.default_purchase_unit_id}
                                                    onChange={(e) => handleChange('default_purchase_unit_id', e.target.value)}
                                                >
                                                    <option value="">-- {form.parent_id ? 'Inherit' : 'Select Purchase Unit'} --</option>
                                                    {units.map(u => (
                                                        <option key={u.id} value={u.id}>{u.name} ({u.symbol})</option>
                                                    ))}
                                                </select>
                                            </div>
                                            <div className="col-md-4">
                                                <label className="form-label extra-small fw-semibold text-secondary mb-1">Default Sales Unit</label>
                                                <select
                                                    className="form-select form-select-sm"
                                                    value={form.default_sales_unit_id}
                                                    onChange={(e) => handleChange('default_sales_unit_id', e.target.value)}
                                                >
                                                    <option value="">-- {form.parent_id ? 'Inherit' : 'Select Sales Unit'} --</option>
                                                    {units.map(u => (
                                                        <option key={u.id} value={u.id}>{u.name} ({u.symbol})</option>
                                                    ))}
                                                </select>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="mb-3">
                                        <label className="form-label small fw-semibold">Description</label>
                                        <textarea
                                            className="form-control form-control-sm"
                                            value={form.description}
                                            onChange={(e) => handleChange('description', e.target.value)}
                                            placeholder="Brief description of the category..."
                                            rows="3"
                                        />
                                    </div>

                                    <div className="mb-3">
                                        <label className="form-label small fw-semibold">Sort Order</label>
                                        <input
                                            type="number"
                                            className="form-control form-control-sm font-monospace"
                                            value={form.sort_order}
                                            onChange={(e) => handleChange('sort_order', e.target.value)}
                                            min="0"
                                            required
                                        />
                                    </div>

                                    <div className="form-check form-switch">
                                        <input
                                            className="form-check-input"
                                            type="checkbox"
                                            id="managerCategoryIsActive"
                                            checked={form.is_active}
                                            onChange={(e) => handleChange('is_active', e.target.checked)}
                                        />
                                        <label className="form-check-label small text-muted" htmlFor="managerCategoryIsActive">
                                            Category is active for products
                                        </label>
                                    </div>
                                </div>
                                <div className="modal-footer border-top-0 pb-4 px-4">
                                    <button type="button" className="btn btn-outline-secondary me-2 px-3 btn-sm" onClick={() => setShowModal(false)}>
                                        Cancel
                                    </button>
                                    <button type="submit" className="btn btn-primary px-4 btn-sm">
                                        {modalMode === 'create' ? 'Save Category' : 'Update Category'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* CATEGORY ATTRIBUTES MANAGEMENT MODAL */}
            {showAttrModal && (
                <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0, 0, 0, 0.65)', zIndex: 1080 }}>
                    <div className="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
                        <div className="modal-content border-0 shadow-lg" style={{ borderRadius: '16px' }}>
                            <div className="modal-header border-bottom pb-3 pt-4 px-4 bg-light">
                                <div>
                                    <h5 className="modal-title fw-bold text-dark mb-0 d-flex align-items-center">
                                        <i className="fa-solid fa-sliders text-info me-2 fs-5"></i>
                                        Configure Specifications for "{selectedCategoryForAttrs?.name}"
                                    </h5>
                                    <small className="text-muted">
                                        Define required & optional product attributes for items created under this category.
                                    </small>
                                </div>
                                <button type="button" className="btn-close" onClick={() => setShowAttrModal(false)} aria-label="Close"></button>
                            </div>

                            <div className="modal-body px-4 py-4" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
                                {attrError && (
                                    <div className="alert alert-danger py-2 small mb-3 d-flex align-items-center justify-content-between">
                                        <div><i className="fa-solid fa-circle-exclamation me-2"></i>{attrError}</div>
                                        <button type="button" className="btn-close ms-2" onClick={() => setAttrError(null)}></button>
                                    </div>
                                )}
                                {attrSuccess && (
                                    <div className="alert alert-success py-2 small mb-3 d-flex align-items-center justify-content-between">
                                        <div><i className="fa-solid fa-circle-check me-2"></i>{attrSuccess}</div>
                                        <button type="button" className="btn-close ms-2" onClick={() => setAttrSuccess(null)}></button>
                                    </div>
                                )}

                                {attrLoading ? (
                                    <div className="text-center py-5">
                                        <div className="spinner-border text-info spinner-border-sm me-2"></div>
                                        <span className="small text-muted font-monospace">Loading category specifications...</span>
                                    </div>
                                ) : (
                                    <>
                                        {/* Status Header */}
                                        {directAttrs.length === 0 && inheritedFrom ? (
                                            <div className="alert alert-warning border-0 p-3 mb-4 small rounded-3">
                                                <i className="fa-solid fa-code-branch me-2 text-warning"></i>
                                                Currently inheriting specification attributes from parent category <strong>"{inheritedFrom.name}"</strong>:
                                                <ul className="mb-0 mt-2 ps-3 text-dark">
                                                    {inheritedAttrs.map(a => (
                                                        <li key={a.attribute_id}>
                                                            <strong>{a.name}</strong> {a.unit_symbol ? `(${a.unit_symbol})` : ''} {a.is_required ? <span className="badge bg-danger ms-1">Required</span> : ''}
                                                        </li>
                                                    ))}
                                                </ul>
                                                <div className="mt-2 text-muted extra-small">
                                                    Adding direct attributes below will override parent inheritance for this category.
                                                </div>
                                            </div>
                                        ) : directAttrs.length === 0 ? (
                                            <div className="alert alert-light border p-3 mb-4 small text-muted text-center rounded-3">
                                                <i className="fa-solid fa-info-circle me-1 text-info"></i>
                                                No direct attributes configured for this category yet. Add attributes below.
                                            </div>
                                        ) : (
                                            <div className="alert alert-info border-0 p-2 px-3 mb-4 small rounded-3">
                                                <i className="fa-solid fa-sliders me-2 text-info"></i>
                                                Configured with <strong>{directAttrs.length}</strong> direct specification attribute(s).
                                            </div>
                                        )}

                                        {/* Add New Attribute Control */}
                                        <div className="card bg-light border-0 p-3 mb-4 rounded-3">
                                            <label className="form-label small fw-bold text-dark mb-2">
                                                Add Product Specification Attribute
                                            </label>
                                            <div className="input-group input-group-sm">
                                                <select
                                                    className="form-select"
                                                    value={selectedNewAttrId}
                                                    onChange={(e) => setSelectedNewAttrId(e.target.value)}
                                                >
                                                    <option value="">-- Choose Attribute Definition --</option>
                                                    {availableSystemAttrs
                                                        .filter(sys => !directAttrs.some(d => d.attribute_id === sys.id))
                                                        .map(sys => (
                                                            <option key={sys.id} value={sys.id}>
                                                                {sys.name} {sys.unit_symbol ? `(${sys.unit_symbol})` : ''} [{sys.type}]
                                                            </option>
                                                        ))
                                                    }
                                                </select>
                                                <button
                                                    type="button"
                                                    className="btn btn-primary"
                                                    onClick={handleAddAttributeToCategory}
                                                    disabled={!selectedNewAttrId}
                                                >
                                                    <i className="fa-solid fa-plus me-1"></i> Attach Attribute
                                                </button>
                                            </div>
                                        </div>

                                        {/* Table of Direct Attributes */}
                                        <h6 className="fw-bold text-dark mb-3">Direct Category Attributes Configuration</h6>
                                        {directAttrs.length === 0 ? (
                                            <div className="text-center py-4 border rounded-3 bg-white text-muted small">
                                                No attributes assigned directly. Select an attribute above and click "Attach Attribute".
                                            </div>
                                        ) : (
                                            <div className="table-responsive bg-white border rounded-3">
                                                <table className="table table-hover align-middle mb-0 small">
                                                    <thead className="bg-light">
                                                        <tr className="text-muted font-monospace" style={{ fontSize: '0.75rem' }}>
                                                            <th style={{ width: '25%' }}>Attribute Name</th>
                                                            <th style={{ width: '15%' }}>Sort Order</th>
                                                            <th style={{ width: '15%' }}>Mandatory</th>
                                                            <th style={{ width: '35%' }}>Allowed Values (Optional)</th>
                                                            <th style={{ width: '10%' }} className="text-end">Action</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {directAttrs.map((attr, idx) => (
                                                            <tr key={attr.attribute_id}>
                                                                <td>
                                                                    <div className="fw-bold text-dark">{attr.name}</div>
                                                                    <small className="text-muted font-monospace">{attr.unit_symbol ? `Unit: ${attr.unit_symbol}` : `Type: ${attr.type}`}</small>
                                                                </td>
                                                                <td>
                                                                    <input
                                                                        type="number"
                                                                        className="form-control form-control-sm font-monospace"
                                                                        style={{ maxWidth: '80px' }}
                                                                        value={attr.sort_order}
                                                                        onChange={(e) => handleUpdateDirectAttrField(idx, 'sort_order', e.target.value)}
                                                                        min="0"
                                                                    />
                                                                </td>
                                                                <td>
                                                                    <div className="form-check form-switch">
                                                                        <input
                                                                            className="form-check-input"
                                                                            type="checkbox"
                                                                            checked={!!attr.is_required}
                                                                            onChange={(e) => handleUpdateDirectAttrField(idx, 'is_required', e.target.checked)}
                                                                            id={`req-check-${attr.attribute_id}`}
                                                                        />
                                                                        <label className="form-check-label extra-small text-muted" htmlFor={`req-check-${attr.attribute_id}`}>
                                                                            {attr.is_required ? <span className="text-danger fw-bold">Required</span> : 'Optional'}
                                                                        </label>
                                                                    </div>
                                                                </td>
                                                                <td>
                                                                    <input
                                                                        type="text"
                                                                        className="form-control form-control-sm"
                                                                        placeholder="e.g. Red, Blue, Green (comma-separated)"
                                                                        value={Array.isArray(attr.allowed_values) ? attr.allowed_values.join(', ') : (attr.allowed_values || '')}
                                                                        onChange={(e) => handleUpdateDirectAttrField(idx, 'allowed_values', e.target.value)}
                                                                    />
                                                                </td>
                                                                <td className="text-end">
                                                                    <button
                                                                        type="button"
                                                                        className="btn btn-xs btn-outline-danger"
                                                                        onClick={() => handleRemoveAttributeFromCategory(idx)}
                                                                        title="Remove attribute from category"
                                                                    >
                                                                        <i className="fa-solid fa-trash"></i>
                                                                    </button>
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>

                            <div className="modal-footer border-top pt-3 pb-4 px-4 bg-light">
                                <button type="button" className="btn btn-secondary px-3 btn-sm" onClick={() => setShowAttrModal(false)} disabled={attrSaving}>
                                    Cancel
                                </button>
                                <button type="button" className="btn btn-primary px-4 btn-sm" onClick={handleSaveCategoryAttributes} disabled={attrSaving || attrLoading}>
                                    {attrSaving ? <span className="spinner-border spinner-border-sm me-2"></span> : <i className="fa-solid fa-floppy-disk me-1"></i>}
                                    Save Category Attributes
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
