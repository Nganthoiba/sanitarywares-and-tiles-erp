import React, { useState, useEffect } from 'react';
import axios from 'axios';

export default function CategoryManager() {
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);

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
        setForm(prev => ({ ...prev, [field]: value }));
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
                {loading ? (
                    <div className="text-center py-5">
                        <div className="spinner-border text-primary" role="status"></div>
                        <span className="ms-2 font-monospace">Fetching categories catalog...</span>
                    </div>
                ) : (
                    <div className="table-responsive">
                        <table className="table table-hover align-middle">
                            <thead>
                                <tr className="text-secondary font-monospace" style={{ fontSize: '0.8rem' }}>
                                    <th>Slug</th>
                                    <th>Category Name</th>
                                    <th>Parent Category</th>
                                    <th>Sort Order</th>
                                    <th>Status</th>
                                    <th className="text-end">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {categories.map((c) => (
                                    <tr key={c.id}>
                                        <td className="font-monospace text-muted">{c.slug}</td>
                                        <td className="fw-bold text-dark">{c.name}</td>
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
                                {categories.length === 0 && (
                                    <tr>
                                        <td colSpan="6" className="text-center py-5 text-muted font-monospace">
                                            No categories configured. Click 'Add Product Category' to add one.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
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
                                        <label className="form-label small fw-semibold">Slug (Optional)</label>
                                        <input
                                            type="text"
                                            className="form-control form-control-sm font-monospace"
                                            value={form.slug}
                                            onChange={(e) => handleChange('slug', e.target.value.toLowerCase().replace(/[^a-z0-9-_]/g, '-'))}
                                            placeholder="e.g. gvt-tiles (auto-generated if left blank)"
                                        />
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
