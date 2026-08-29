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

    const [form, setForm] = useState({
        name: '',
        slug: '',
        parent_id: '',
        description: '',
        sort_order: '0',
        is_active: true
    });

    const fetchCategories = async () => {
        setLoading(true);
        setError(null);
        try {
            const token = localStorage.getItem('auth_token');
            const res = await axios.get('/api/categories-crud', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setCategories(res.data || []);
        } catch (err) {
            setError('Failed to fetch categories list.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCategories();
    }, []);

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

        return nameMatch || slugMatch || parentMatch || descMatch;
    });

    const totalPages = Math.ceil(filteredCategories.length / perPage) || 1;
    const safeCurrentPage = Math.min(currentPage, totalPages);
    const indexOfFirstItem = (safeCurrentPage - 1) * perPage;
    const indexOfLastItem = Math.min(safeCurrentPage * perPage, filteredCategories.length);
    const paginatedCategories = filteredCategories.slice(indexOfFirstItem, indexOfLastItem);

    const handleOpenCreate = () => {
        setModalMode('create');
        setSelectedCategory(null);
        setForm({
            name: '',
            slug: '',
            parent_id: '',
            description: '',
            sort_order: '0',
            is_active: true
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
            is_active: category.is_active === 1 || category.is_active === true
        });
        setError(null);
        setShowModal(true);
    };

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
            parent_id: form.parent_id ? parseInt(form.parent_id, 10) : null
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

    // Filter out the selected category itself to prevent self-reference
    const parentOptions = categories.filter(c => !selectedCategory || c.id !== selectedCategory.id);

    return (
        <div className="animate__animated animate__fadeIn">
            {/* Header Banner */}
            <div className="d-flex align-items-center justify-content-between mb-4">
                <div>
                    <h3 className="fw-bold text-dark">
                        <i className="fa-solid fa-folder-tree me-2 text-primary"></i>Product Category Registry
                    </h3>
                    <p className="text-muted small mb-0">Define, edit, and group your catalog products by categories and subcategories.</p>
                </div>
                <button className="btn btn-primary px-4 shadow-sm" onClick={handleOpenCreate}>
                    <i className="fa-solid fa-plus me-2"></i> Add Product Category
                </button>
            </div>

            <div className="alert alert-primary text-dark border-0 p-3 mb-4 small animate__animated animate__fadeIn">
                <strong>What is a Product Category?</strong> Product categories organize your inventory hierarchically (e.g., <i>Tiles &gt; Ceramic Tiles</i>). Categories define logical classification, tax configurations, and properties structure, helping group similar items together for catalog browsing, sales analysis, and stock reporting.
            </div>

            {error && (
                <div className="alert alert-danger d-flex align-items-center mb-4 animate__animated animate__shakeX" role="alert">
                    <i className="fa-solid fa-circle-exclamation me-2"></i>
                    <div>{error}</div>
                </div>
            )}

            {success && (
                <div className="alert alert-success d-flex align-items-center mb-4 animate__animated animate__fadeIn" role="alert">
                    <i className="fa-solid fa-circle-check me-2"></i>
                    <div>{success}</div>
                </div>
            )}

            {/* Category Table Card */}
            <div className="card border-0 shadow-sm p-4" style={{ borderRadius: '12px' }}>
                {/* Search, Filter & Per-Page Controls */}
                <div className="row g-3 align-items-center mb-4">
                    <div className="col-md-5">
                        <div className="input-group">
                            <span className="input-group-text bg-white border-end-0 text-muted">
                                <i className="fa-solid fa-magnifying-glass"></i>
                            </span>
                            <input
                                type="text"
                                className="form-control border-start-0 ps-0"
                                placeholder="Search by category name, slug, parent..."
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
                            <table className="table table-hover align-middle">
                                <thead>
                                    <tr className="text-secondary font-monospace" style={{ fontSize: '0.8rem' }}>
                                        <th>Category Name</th>
                                        <th>Parent Category</th>
                                        <th>Sort Order</th>
                                        <th>Status</th>
                                        <th className="text-end">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="small">
                                    {paginatedCategories.map((c) => (
                                        <tr key={c.id}>
                                            <td>
                                                <div className="fw-bold text-dark small">{c.name}</div>
                                                <div className="font-monospace text-muted small" style={{ fontSize: '0.75rem' }}>{c.slug}</div>
                                            </td>
                                            <td>{c.parent ? c.parent.name : <span className="text-muted small italic">Root</span>}</td>
                                            <td className="font-monospace">{c.sort_order}</td>
                                            <td>
                                                {c.is_active === 1 || c.is_active === true ? (
                                                    <span className="badge bg-success-subtle text-success px-2 py-1">
                                                        <i className="fa-solid fa-circle-check me-1"></i> ACTIVE
                                                    </span>
                                                ) : (
                                                    <span className="badge bg-danger-subtle text-danger px-2 py-1">
                                                        <i className="fa-solid fa-circle-xmark me-1"></i> INACTIVE
                                                    </span>
                                                )}
                                            </td>
                                             <td className="text-end">
                                                <div className="d-flex justify-content-end gap-1">
                                                    <button
                                                        className="btn btn-xs btn-outline-primary px-2"
                                                        onClick={() => handleOpenEdit(c)}
                                                        style={{ fontSize: '0.75rem' }}
                                                    >
                                                        <i className="fa-solid fa-pen me-1"></i> Edit
                                                    </button>
                                                    {c.is_active === 1 || c.is_active === true ? (
                                                        <button
                                                            className="btn btn-xs btn-outline-warning px-2"
                                                            onClick={() => handleToggleStatus(c)}
                                                            style={{ fontSize: '0.75rem' }}
                                                            title="Deactivate category"
                                                        >
                                                            <i className="fa-solid fa-ban me-1"></i> Deactivate
                                                        </button>
                                                    ) : (
                                                        <button
                                                            className="btn btn-xs btn-outline-success px-2"
                                                            onClick={() => handleToggleStatus(c)}
                                                            style={{ fontSize: '0.75rem' }}
                                                            title="Activate category"
                                                        >
                                                            <i className="fa-solid fa-circle-check me-1"></i> Activate
                                                        </button>
                                                    )}
                                                    <button
                                                        className="btn btn-xs btn-outline-danger px-2"
                                                        onClick={() => handleDelete(c)}
                                                        style={{ fontSize: '0.75rem' }}
                                                    >
                                                        <i className="fa-solid fa-trash me-1"></i> Delete
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                    {filteredCategories.length === 0 && (
                                        <tr>
                                            <td colSpan="5" className="text-center py-5">
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
        </div>
    );
}
