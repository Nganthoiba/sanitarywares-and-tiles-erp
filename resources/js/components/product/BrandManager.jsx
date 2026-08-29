import React, { useState, useEffect } from 'react';
import axios from 'axios';

export default function BrandManager() {
    const [brands, setBrands] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);

    // Modal state
    const [showModal, setShowModal] = useState(false);
    const [modalMode, setModalMode] = useState('create'); // create, edit
    const [selectedBrand, setSelectedBrand] = useState(null);

    const [form, setForm] = useState({
        name: '',
        slug: '',
        description: '',
        is_active: true
    });

    const fetchBrands = async () => {
        setLoading(true);
        setError(null);
        try {
            const token = localStorage.getItem('auth_token');
            const res = await axios.get('/api/brands-crud', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setBrands(res.data || []);
        } catch (err) {
            setError('Failed to fetch brands registry list.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchBrands();
    }, []);

    const handleOpenCreate = () => {
        setModalMode('create');
        setSelectedBrand(null);
        setForm({
            name: '',
            slug: '',
            description: '',
            is_active: true
        });
        setError(null);
        setShowModal(true);
    };

    const handleOpenEdit = (brand) => {
        setModalMode('edit');
        setSelectedBrand(brand);
        setForm({
            name: brand.name || '',
            slug: brand.slug || '',
            description: brand.description || '',
            is_active: brand.is_active === 1 || brand.is_active === true
        });
        setError(null);
        setShowModal(true);
    };

    const handleDelete = async (brand) => {
        if (!confirm(`Are you sure you want to delete brand "${brand.name}"? This action cannot be undone.`)) {
            return;
        }
        setError(null);
        setSuccess(null);
        try {
            const token = localStorage.getItem('auth_token');
            await axios.delete(`/api/brands-crud/${brand.id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setSuccess('Brand successfully deleted.');
            fetchBrands();
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to delete brand.');
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setSuccess(null);

        try {
            const token = localStorage.getItem('auth_token');
            if (modalMode === 'create') {
                await axios.post('/api/brands-crud', form, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setSuccess('Brand created successfully.');
            } else {
                await axios.put(`/api/brands-crud/${selectedBrand.id}`, form, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setSuccess('Brand updated successfully.');
            }
            setShowModal(false);
            fetchBrands();
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to save brand.');
        }
    };

    const handleChange = (field, value) => {
        setForm(prev => ({ ...prev, [field]: value }));
    };

    return (
        <div className="animate__animated animate__fadeIn">
            {/* Header Banner */}
            <div className="d-flex align-items-center justify-content-between mb-4">
                <div>
                    <h3 className="fw-bold text-dark">
                        <i className="fa-solid fa-tags me-2 text-primary"></i>Brand Registry
                    </h3>
                    <p className="text-muted small mb-0">Define, edit, and manage brand labels for catalog products.</p>
                </div>
                <button className="btn btn-primary px-4 shadow-sm" onClick={handleOpenCreate}>
                    <i className="fa-solid fa-plus me-2"></i> Register Product Brand
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

            {/* Brand Table Card */}
            <div className="card border-0 shadow-sm p-4" style={{ borderRadius: '12px' }}>
                {loading ? (
                    <div className="text-center py-5">
                        <div className="spinner-border text-primary" role="status"></div>
                        <span className="ms-2 font-monospace">Fetching brands list...</span>
                    </div>
                ) : (
                    <div className="table-responsive">
                        <table className="table table-hover align-middle">
                            <thead>
                                <tr className="text-secondary font-monospace" style={{ fontSize: '0.8rem' }}>
                                    <th>Slug</th>
                                    <th>Brand Name</th>
                                    <th>Description</th>
                                    <th>Status</th>
                                    <th className="text-end">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {brands.map((b) => (
                                    <tr key={b.id}>
                                        <td className="font-monospace text-muted">{b.slug}</td>
                                        <td className="fw-bold text-dark">{b.name}</td>
                                        <td>{b.description || <span className="text-muted small italic">No description</span>}</td>
                                        <td>
                                            {b.is_active === 1 || b.is_active === true ? (
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
                                                    onClick={() => handleOpenEdit(b)}
                                                    style={{ fontSize: '0.75rem' }}
                                                >
                                                    <i className="fa-solid fa-pen me-1"></i> Edit
                                                </button>
                                                <button
                                                    className="btn btn-xs btn-outline-danger px-2"
                                                    onClick={() => handleDelete(b)}
                                                    style={{ fontSize: '0.75rem' }}
                                                >
                                                    <i className="fa-solid fa-trash me-1"></i> Delete
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {brands.length === 0 && (
                                    <tr>
                                        <td colSpan="5" className="text-center py-5 text-muted font-monospace">
                                            No brands registered. Click 'Register Product Brand' to add one.
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
                                    <i className="fa-solid fa-tags text-primary me-2"></i>
                                    {modalMode === 'create' ? 'Register Product Brand' : 'Edit Product Brand'}
                                </h5>
                                <button type="button" className="btn-close" onClick={() => setShowModal(false)} aria-label="Close"></button>
                            </div>
                            <form onSubmit={handleSubmit}>
                                <div className="modal-body px-4 py-3">
                                    <div className="mb-3">
                                        <label className="form-label small fw-semibold">Brand Name *</label>
                                        <input
                                            type="text"
                                            className="form-control form-control-sm"
                                            value={form.name}
                                            onChange={(e) => handleChange('name', e.target.value)}
                                            placeholder="e.g. Kajaria, Somany, Johnson"
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
                                            placeholder="e.g. kajaria (auto-generated if left blank)"
                                        />
                                    </div>

                                    <div className="mb-3">
                                        <label className="form-label small fw-semibold">Description</label>
                                        <textarea
                                            className="form-control form-control-sm"
                                            value={form.description}
                                            onChange={(e) => handleChange('description', e.target.value)}
                                            placeholder="Brief brand specifications or notes..."
                                            rows="3"
                                        />
                                    </div>

                                    <div className="form-check form-switch">
                                        <input
                                            className="form-check-input"
                                            type="checkbox"
                                            id="managerBrandIsActive"
                                            checked={form.is_active}
                                            onChange={(e) => handleChange('is_active', e.target.checked)}
                                        />
                                        <label className="form-check-label small text-muted" htmlFor="managerBrandIsActive">
                                            Brand is active for products
                                        </label>
                                    </div>
                                </div>
                                <div className="modal-footer border-top-0 pb-4 px-4">
                                    <button type="button" className="btn btn-outline-secondary me-2 px-3 btn-sm" onClick={() => setShowModal(false)}>
                                        Cancel
                                    </button>
                                    <button type="submit" className="btn btn-primary px-4 btn-sm">
                                        {modalMode === 'create' ? 'Save Brand' : 'Update Brand'}
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
