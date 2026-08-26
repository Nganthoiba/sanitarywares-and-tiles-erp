import React, { useState, useEffect } from 'react';
import axios from 'axios';

export default function SupplierManager() {
    const [suppliers, setSuppliers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);

    // Modal state
    const [showModal, setShowModal] = useState(false);
    const [modalMode, setModalMode] = useState('create'); // create, edit
    const [selectedSupplier, setSelectedSupplier] = useState(null);

    const [form, setForm] = useState({
        name: '',
        code: '',
        email: '',
        phone: '',
        gstin: '',
        address: '',
        about_supplier: '',
        is_active: true
    });

    const fetchSuppliers = async () => {
        setLoading(true);
        setError(null);
        try {
            const token = localStorage.getItem('auth_token');
            const res = await axios.get('/api/suppliers-crud', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setSuppliers(res.data || []);
        } catch (err) {
            setError('Failed to fetch suppliers registry.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSuppliers();
    }, []);

    const handleOpenCreate = () => {
        setModalMode('create');
        setSelectedSupplier(null);
        setForm({
            name: '',
            code: '',
            email: '',
            phone: '',
            gstin: '',
            address: '',
            about_supplier: '',
            is_active: true
        });
        setError(null);
        setShowModal(true);
    };

    const handleOpenEdit = (supplier) => {
        setModalMode('edit');
        setSelectedSupplier(supplier);
        setForm({
            name: supplier.name || '',
            code: supplier.code || '',
            email: supplier.email || '',
            phone: supplier.phone || '',
            gstin: supplier.gstin || '',
            address: supplier.address || '',
            about_supplier: supplier.about_supplier || '',
            is_active: supplier.is_active === 1 || supplier.is_active === true
        });
        setError(null);
        setShowModal(true);
    };

    const handleDelete = async (supplier) => {
        if (!confirm(`Are you sure you want to delete supplier "${supplier.name}"? This action cannot be undone.`)) {
            return;
        }
        setError(null);
        setSuccess(null);
        try {
            const token = localStorage.getItem('auth_token');
            await axios.delete(`/api/suppliers-crud/${supplier.id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setSuccess('Supplier successfully deleted.');
            fetchSuppliers();
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to delete supplier.');
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setSuccess(null);

        try {
            const token = localStorage.getItem('auth_token');
            if (modalMode === 'create') {
                await axios.post('/api/suppliers-crud', form, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setSuccess('Supplier registered successfully.');
            } else {
                await axios.put(`/api/suppliers-crud/${selectedSupplier.id}`, form, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setSuccess('Supplier profile updated successfully.');
            }
            setShowModal(false);
            fetchSuppliers();
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to save supplier details.');
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
                        <i className="fa-solid fa-truck-field me-2 text-primary"></i>Supplier Management
                    </h3>
                    <p className="text-muted small mb-0">Manage external suppliers, vendors, and material source profiles for your supply chain.</p>
                </div>
                <button className="btn btn-primary px-4 shadow-sm" onClick={handleOpenCreate}>
                    <i className="fa-solid fa-plus me-2"></i> Register New Supplier
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

            {/* Supplier Table Card */}
            <div className="card border-0 shadow-sm p-4" style={{ borderRadius: '12px' }}>
                {loading ? (
                    <div className="text-center py-5">
                        <div className="spinner-border text-primary" role="status"></div>
                        <span className="ms-2 font-monospace">Loading suppliers database...</span>
                    </div>
                ) : (
                    <div className="table-responsive">
                        <table className="table table-hover align-middle">
                            <thead>
                                <tr className="text-secondary font-monospace" style={{ fontSize: '0.8rem' }}>
                                    <th>Supplier Code</th>
                                    <th>Supplier Name</th>
                                    <th>GSTIN</th>
                                    <th>Contact Details</th>
                                    <th>About Supplier / Address</th>
                                    <th>Status</th>
                                    <th className="text-end">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {suppliers.map((s) => (
                                    <tr key={s.id}>
                                        <td className="fw-bold text-dark font-monospace">{s.code}</td>
                                        <td>
                                            <div className="fw-bold text-dark">{s.name}</div>
                                        </td>
                                        <td className="font-monospace text-secondary">{s.gstin || 'N/A'}</td>
                                        <td>
                                            <div style={{ fontSize: '0.85rem' }}>
                                                {s.email && <div className="text-muted"><i className="fa-regular fa-envelope me-1"></i>{s.email}</div>}
                                                {s.phone && <div className="text-muted"><i className="fa-solid fa-phone me-1"></i>{s.phone}</div>}
                                                {!s.email && !s.phone && <span className="text-muted small">No contact provided</span>}
                                            </div>
                                        </td>
                                        <td style={{ maxWidth: '240px' }}>
                                            {s.about_supplier && (
                                                <div className="text-dark small mb-1" style={{ fontSize: '0.82rem' }}>
                                                    <i className="fa-solid fa-info-circle text-primary me-1"></i>{s.about_supplier}
                                                </div>
                                            )}
                                            {s.address ? (
                                                <div className="text-muted small" style={{ fontSize: '0.78rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                    <i className="fa-solid fa-location-dot me-1"></i>{s.address}
                                                </div>
                                            ) : (
                                                !s.about_supplier && <span className="text-muted small">N/A</span>
                                            )}
                                        </td>
                                        <td>
                                            {s.is_active === 1 || s.is_active === true ? (
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
                                                    onClick={() => handleOpenEdit(s)}
                                                    style={{ fontSize: '0.75rem' }}
                                                >
                                                    <i className="fa-solid fa-pen me-1"></i> Edit
                                                </button>
                                                <button
                                                    className="btn btn-xs btn-outline-danger px-2"
                                                    onClick={() => handleDelete(s)}
                                                    style={{ fontSize: '0.75rem' }}
                                                >
                                                    <i className="fa-solid fa-trash me-1"></i> Delete
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {suppliers.length === 0 && (
                                    <tr>
                                        <td colSpan="7" className="text-center py-5 text-muted font-monospace">
                                            No suppliers registered. Click 'Register New Supplier' to add one.
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
                                    <i className="fa-solid fa-truck-field text-primary me-2"></i>
                                    {modalMode === 'create' ? 'Register New Supplier' : 'Edit Supplier Details'}
                                </h5>
                                <button type="button" className="btn-close" onClick={() => setShowModal(false)} aria-label="Close"></button>
                            </div>
                            <form onSubmit={handleSubmit}>
                                <div className="modal-body px-4 py-3">
                                    <div className="mb-3">
                                        <label className="form-label small fw-semibold">Supplier Name</label>
                                        <input
                                            type="text"
                                            className="form-control form-control-sm"
                                            value={form.name}
                                            onChange={(e) => handleChange('name', e.target.value)}
                                            placeholder="e.g. Kajaria Ceramics"
                                            required
                                        />
                                    </div>

                                    <div className="row mb-3">
                                        <div className="col-md-6">
                                            <label className="form-label small fw-semibold">Supplier Code (Optional)</label>
                                            <input
                                                type="text"
                                                className="form-control form-control-sm font-monospace"
                                                value={form.code}
                                                onChange={(e) => handleChange('code', e.target.value.toUpperCase())}
                                                placeholder="Auto-generated if empty"
                                            />
                                            <span className="form-text text-muted" style={{ fontSize: '0.7rem' }}>
                                                Leave empty to autogenerate code (e.g. SUP-00001)
                                            </span>
                                        </div>
                                        <div className="col-md-6">
                                            <label className="form-label small fw-semibold">GSTIN</label>
                                            <input
                                                type="text"
                                                className="form-control form-control-sm font-monospace"
                                                value={form.gstin}
                                                onChange={(e) => handleChange('gstin', e.target.value.toUpperCase())}
                                                placeholder="e.g. 24KAAFJ1294K1Z2"
                                                maxLength="15"
                                            />
                                        </div>
                                    </div>

                                    <div className="row mb-3">
                                        <div className="col-md-6">
                                            <label className="form-label small fw-semibold">Email Address</label>
                                            <input
                                                type="email"
                                                className="form-control form-control-sm"
                                                value={form.email}
                                                onChange={(e) => handleChange('email', e.target.value)}
                                                placeholder="e.g. sales@kajaria.com"
                                            />
                                        </div>
                                        <div className="col-md-6">
                                            <label className="form-label small fw-semibold">Phone Number</label>
                                            <input
                                                type="text"
                                                className="form-control form-control-sm"
                                                value={form.phone}
                                                onChange={(e) => handleChange('phone', e.target.value)}
                                                placeholder="e.g. +91228493028"
                                            />
                                        </div>
                                    </div>

                                    <div className="mb-3">
                                        <label className="form-label small fw-semibold">About Supplier</label>
                                        <textarea
                                            className="form-control form-control-sm"
                                            rows="2"
                                            value={form.about_supplier}
                                            onChange={(e) => handleChange('about_supplier', e.target.value)}
                                            placeholder="Information, background, product specializations, or trade terms..."
                                        ></textarea>
                                    </div>

                                    <div className="mb-3">
                                        <label className="form-label small fw-semibold">Physical Address</label>
                                        <textarea
                                            className="form-control form-control-sm"
                                            rows="2"
                                            value={form.address}
                                            onChange={(e) => handleChange('address', e.target.value)}
                                            placeholder="Supplier headquarters or primary distribution warehouse address..."
                                        ></textarea>
                                    </div>

                                    <div className="form-check form-switch">
                                        <input
                                            className="form-check-input"
                                            type="checkbox"
                                            id="managerSupplierIsActive"
                                            checked={form.is_active}
                                            onChange={(e) => handleChange('is_active', e.target.checked)}
                                        />
                                        <label className="form-check-label small text-muted" htmlFor="managerSupplierIsActive">
                                            Supplier is active for transactions
                                        </label>
                                    </div>
                                </div>
                                <div className="modal-footer border-top-0 pb-4 px-4">
                                    <button type="button" className="btn btn-outline-secondary me-2 px-3 btn-sm" onClick={() => setShowModal(false)}>
                                        Cancel
                                    </button>
                                    <button type="submit" className="btn btn-primary px-4 btn-sm">
                                        {modalMode === 'create' ? 'Save Supplier' : 'Update Supplier'}
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
