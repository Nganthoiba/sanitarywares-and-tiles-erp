import React, { useState, useEffect } from 'react';
import axios from 'axios';

export default function ManufacturerManager() {
    const [manufacturers, setManufacturers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);

    // Modal state
    const [showModal, setShowModal] = useState(false);
    const [modalMode, setModalMode] = useState('create'); // create, edit
    const [selectedManufacturer, setSelectedManufacturer] = useState(null);

    const [form, setForm] = useState({
        name: '',
        address: '',
        phone: '',
        email: '',
        website: '',
        is_active: true
    });

    const fetchManufacturers = async () => {
        setLoading(true);
        setError(null);
        try {
            const token = localStorage.getItem('auth_token');
            const res = await axios.get('/api/manufacturers-crud', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setManufacturers(res.data || []);
        } catch (err) {
            setError('Failed to fetch manufacturers registry list.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchManufacturers();
    }, []);

    const handleOpenCreate = () => {
        setModalMode('create');
        setSelectedManufacturer(null);
        setForm({
            name: '',
            address: '',
            phone: '',
            email: '',
            website: '',
            is_active: true
        });
        setError(null);
        setShowModal(true);
    };

    const handleOpenEdit = (manufacturer) => {
        setModalMode('edit');
        setSelectedManufacturer(manufacturer);
        setForm({
            name: manufacturer.name || '',
            address: manufacturer.address || '',
            phone: manufacturer.phone || '',
            email: manufacturer.email || '',
            website: manufacturer.website || '',
            is_active: manufacturer.is_active === 1 || manufacturer.is_active === true
        });
        setError(null);
        setShowModal(true);
    };

    const handleDelete = async (manufacturer) => {
        if (!confirm(`Are you sure you want to delete manufacturer "${manufacturer.name}"? This action cannot be undone.`)) {
            return;
        }
        setError(null);
        setSuccess(null);
        try {
            const token = localStorage.getItem('auth_token');
            await axios.delete(`/api/manufacturers-crud/${manufacturer.id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setSuccess('Manufacturer successfully deleted.');
            fetchManufacturers();
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to delete manufacturer.');
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setSuccess(null);

        try {
            const token = localStorage.getItem('auth_token');
            if (modalMode === 'create') {
                await axios.post('/api/manufacturers-crud', form, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setSuccess('Manufacturer created successfully.');
            } else {
                await axios.put(`/api/manufacturers-crud/${selectedManufacturer.id}`, form, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setSuccess('Manufacturer updated successfully.');
            }
            setShowModal(false);
            fetchManufacturers();
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to save manufacturer.');
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
                        <i className="fa-solid fa-industry me-2 text-primary"></i>Manufacturer Registry
                    </h3>
                    <p className="text-muted small mb-0">Define, edit, and manage manufacturing firms and industrial suppliers of your inventory.</p>
                </div>
                <button className="btn btn-primary px-4 shadow-sm" onClick={handleOpenCreate}>
                    <i className="fa-solid fa-plus me-2"></i> Add Manufacturer
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

            {/* Manufacturer Table Card */}
            <div className="card border-0 shadow-sm p-4" style={{ borderRadius: '12px' }}>
                {loading ? (
                    <div className="text-center py-5">
                        <div className="spinner-border text-primary" role="status"></div>
                        <span className="ms-2 font-monospace">Fetching manufacturers directory...</span>
                    </div>
                ) : (
                    <div className="table-responsive">
                        <table className="table table-hover align-middle">
                            <thead>
                                <tr className="text-secondary font-monospace" style={{ fontSize: '0.8rem' }}>
                                    <th>Manufacturer Name</th>
                                    <th>Phone / Email</th>
                                    <th>Website</th>
                                    <th>Address</th>
                                    <th>Status</th>
                                    <th className="text-end">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {manufacturers.map((m) => (
                                    <tr key={m.id}>
                                        <td className="fw-bold text-dark">{m.name}</td>
                                        <td>
                                            <div className="small">{m.phone || <span className="text-muted small italic">-</span>}</div>
                                            <div className="text-secondary small">{m.email}</div>
                                        </td>
                                        <td>
                                            {m.website ? (
                                                <a href={m.website.startsWith('http') ? m.website : `https://${m.website}`} target="_blank" rel="noopener noreferrer" className="small text-decoration-none">
                                                    {m.website} <i className="fa-solid fa-up-right-from-square ms-1" style={{ fontSize: '0.7rem' }}></i>
                                                </a>
                                            ) : (
                                                <span className="text-muted small italic">-</span>
                                            )}
                                        </td>
                                        <td className="small text-muted">{m.address || <span className="text-muted small italic">-</span>}</td>
                                        <td>
                                            {m.is_active === 1 || m.is_active === true ? (
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
                                                    onClick={() => handleOpenEdit(m)}
                                                    style={{ fontSize: '0.75rem' }}
                                                >
                                                    <i className="fa-solid fa-pen me-1"></i> Edit
                                                </button>
                                                <button
                                                    className="btn btn-xs btn-outline-danger px-2"
                                                    onClick={() => handleDelete(m)}
                                                    style={{ fontSize: '0.75rem' }}
                                                >
                                                    <i className="fa-solid fa-trash me-1"></i> Delete
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {manufacturers.length === 0 && (
                                    <tr>
                                        <td colSpan="6" className="text-center py-5 text-muted font-monospace">
                                            No manufacturers registered. Click 'Add Manufacturer' to add one.
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
                                    <i className="fa-solid fa-industry text-primary me-2"></i>
                                    {modalMode === 'create' ? 'Add Manufacturer' : 'Edit Manufacturer'}
                                </h5>
                                <button type="button" className="btn-close" onClick={() => setShowModal(false)} aria-label="Close"></button>
                            </div>
                            <form onSubmit={handleSubmit}>
                                <div className="modal-body px-4 py-3">
                                    <div className="mb-3">
                                        <label className="form-label small fw-semibold">Manufacturer Name *</label>
                                        <input
                                            type="text"
                                            className="form-control form-control-sm"
                                            value={form.name}
                                            onChange={(e) => handleChange('name', e.target.value)}
                                            placeholder="e.g. Kajaria Ceramics Ltd, Somany Imp & Exp"
                                            required
                                        />
                                    </div>

                                    <div className="mb-3">
                                        <label className="form-label small fw-semibold">Phone Number</label>
                                        <input
                                            type="text"
                                            className="form-control form-control-sm font-monospace"
                                            value={form.phone}
                                            onChange={(e) => handleChange('phone', e.target.value)}
                                            placeholder="e.g. +91 98765 43210"
                                        />
                                    </div>

                                    <div className="mb-3">
                                        <label className="form-label small fw-semibold">Email Address</label>
                                        <input
                                            type="email"
                                            className="form-control form-control-sm"
                                            value={form.email}
                                            onChange={(e) => handleChange('email', e.target.value)}
                                            placeholder="e.g. sales@kajaria.com"
                                        />
                                    </div>

                                    <div className="mb-3">
                                        <label className="form-label small fw-semibold">Website URL</label>
                                        <input
                                            type="text"
                                            className="form-control form-control-sm font-monospace"
                                            value={form.website}
                                            onChange={(e) => handleChange('website', e.target.value)}
                                            placeholder="e.g. www.kajaria.com"
                                        />
                                    </div>

                                    <div className="mb-3">
                                        <label className="form-label small fw-semibold">Address Details</label>
                                        <textarea
                                            className="form-control form-control-sm"
                                            value={form.address}
                                            onChange={(e) => handleChange('address', e.target.value)}
                                            placeholder="Manufacturer warehouse/office address..."
                                            rows="3"
                                        />
                                    </div>

                                    <div className="form-check form-switch">
                                        <input
                                            className="form-check-input"
                                            type="checkbox"
                                            id="managerManufacturerIsActive"
                                            checked={form.is_active}
                                            onChange={(e) => handleChange('is_active', e.target.checked)}
                                        />
                                        <label className="form-check-label small text-muted" htmlFor="managerManufacturerIsActive">
                                            Manufacturer is active for products
                                        </label>
                                    </div>
                                </div>
                                <div className="modal-footer border-top-0 pb-4 px-4">
                                    <button type="button" className="btn btn-outline-secondary me-2 px-3 btn-sm" onClick={() => setShowModal(false)}>
                                        Cancel
                                    </button>
                                    <button type="submit" className="btn btn-primary px-4 btn-sm">
                                        {modalMode === 'create' ? 'Save Manufacturer' : 'Update Manufacturer'}
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
