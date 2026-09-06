import React, { useState, useEffect } from 'react';
import axios from 'axios';

export default function BranchManager() {
    const [branches, setBranches] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);

    // Modal state
    const [showModal, setShowModal] = useState(false);
    const [modalMode, setModalMode] = useState('create'); // create, edit
    const [selectedBranch, setSelectedBranch] = useState(null);

    const [form, setForm] = useState({
        name: '',
        code: '',
        email: '',
        phone: '',
        address: '',
        is_active: true
    });

    const fetchBranches = async () => {
        setLoading(true);
        setError(null);
        try {
            const token = localStorage.getItem('auth_token');
            const res = await axios.get('/api/branches-crud', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setBranches(res.data || []);
        } catch (err) {
            setError('Failed to fetch branch locations list.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchBranches();
    }, []);

    const handleOpenCreate = () => {
        setModalMode('create');
        setSelectedBranch(null);
        setForm({
            name: '',
            code: '',
            email: '',
            phone: '',
            address: '',
            is_active: true
        });
        setError(null);
        setShowModal(true);
    };

    const handleOpenEdit = (branch) => {
        setModalMode('edit');
        setSelectedBranch(branch);
        setForm({
            name: branch.name || '',
            code: branch.code || '',
            email: branch.email || '',
            phone: branch.phone || '',
            address: branch.address || '',
            is_active: branch.is_active === 1 || branch.is_active === true
        });
        setError(null);
        setShowModal(true);
    };

    const handleDelete = async (branch) => {
        if (!confirm(`Are you sure you want to delete branch location "${branch.name}"? This action cannot be undone.`)) {
            return;
        }
        setError(null);
        setSuccess(null);
        try {
            const token = localStorage.getItem('auth_token');
            await axios.delete(`/api/branches-crud/${branch.id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setSuccess('Branch location successfully deleted.');
            fetchBranches();
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to delete branch location.');
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setSuccess(null);

        try {
            const token = localStorage.getItem('auth_token');
            if (modalMode === 'create') {
                await axios.post('/api/branches-crud', form, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setSuccess('Branch location created successfully.');
            } else {
                await axios.put(`/api/branches-crud/${selectedBranch.id}`, form, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setSuccess('Branch location updated successfully.');
            }
            setShowModal(false);
            fetchBranches();
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to save branch location.');
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
                        <i className="fa-solid fa-code-branch me-2 text-primary"></i>Branch Location Registry
                    </h3>
                    <p className="text-muted small mb-0">Define, edit, and manage branch office locations and sales outlets for your organization.</p>
                </div>
                <button className="btn btn-primary px-4 shadow-sm" onClick={handleOpenCreate}>
                    <i className="fa-solid fa-plus me-2"></i> Define Your Branch Location
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

            {/* Branch Table Card */}
            <div className="card border-0 shadow-sm p-4" style={{ borderRadius: '12px' }}>
                {loading ? (
                    <div className="text-center py-5">
                        <div className="spinner-border text-primary" role="status"></div>
                        <span className="ms-2 font-monospace">Fetching branch locations ledger...</span>
                    </div>
                ) : (
                    <div className="table-responsive">
                        <table className="table table-hover align-middle">
                            <thead>
                                <tr className="text-secondary font-monospace" style={{ fontSize: '0.8rem' }}>
                                    <th>Code</th>
                                    <th>Branch Location Name</th>
                                    <th>Contact Info</th>
                                    <th>Address</th>
                                    <th>Warehouses</th>
                                    <th>Status</th>
                                    <th className="text-end">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {branches.map((b) => (
                                    <tr key={b.id}>
                                        <td className="fw-bold text-dark font-monospace">{b.code}</td>
                                        <td className="fw-semibold">{b.name}</td>
                                        <td>
                                            <div className="small">
                                                {b.email && (
                                                    <div>
                                                        <i className="fa-solid fa-envelope me-1 text-muted"></i>{b.email}
                                                    </div>
                                                )}
                                                {b.phone && (
                                                    <div>
                                                        <i className="fa-solid fa-phone me-1 text-muted"></i>{b.phone}
                                                    </div>
                                                )}
                                                {!b.email && !b.phone && (
                                                    <span className="text-muted font-monospace small">N/A</span>
                                                )}
                                            </div>
                                        </td>
                                        <td>
                                            {b.address ? (
                                                <div className="small text-truncate" style={{ maxWidth: '220px' }} title={b.address}>
                                                    <i className="fa-solid fa-location-dot me-1 text-muted"></i>{b.address}
                                                </div>
                                            ) : (
                                                <span className="text-muted font-monospace small">N/A</span>
                                            )}
                                        </td>
                                        <td>
                                            <span className="badge bg-light text-dark border font-monospace">
                                                <i className="fa-solid fa-warehouse me-1 text-secondary"></i>
                                                {b.warehouses_count ?? 0} Warehouse{(b.warehouses_count !== 1) ? 's' : ''}
                                            </span>
                                        </td>
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
                                {branches.length === 0 && (
                                    <tr>
                                        <td colSpan="7" className="text-center py-5 text-muted font-monospace">
                                            No branch locations configured. Click 'Define Your Branch Location' to add one.
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
                    <div className="modal-dialog modal-dialog-centered modal-lg">
                        <div className="modal-content border-0 shadow-lg" style={{ borderRadius: '16px' }}>
                            <div className="modal-header border-bottom-0 pb-0 pt-4 px-4">
                                <h5 className="modal-title fw-bold text-dark">
                                    <i className="fa-solid fa-code-branch text-primary me-2"></i>
                                    {modalMode === 'create' ? 'Define Your Branch Location' : 'Edit Your Branch Location'}
                                </h5>
                                <button type="button" className="btn-close" onClick={() => setShowModal(false)} aria-label="Close"></button>
                            </div>
                            <form onSubmit={handleSubmit}>
                                <div className="modal-body px-4 py-3">
                                    <div className="row g-3 mb-3">
                                        <div className="col-md-6">
                                            <label className="form-label small fw-semibold">Branch Location Name <span className="text-danger">*</span></label>
                                            <input
                                                type="text"
                                                className="form-control form-control-sm"
                                                value={form.name}
                                                onChange={(e) => handleChange('name', e.target.value)}
                                                placeholder="e.g. Kodompokpi Lamkhai, Imphal Location"
                                                required
                                            />
                                        </div>
                                        <div className="col-md-6">
                                            <label className="form-label small fw-semibold">Branch Location Code <span className="text-danger">*</span></label>
                                            <input
                                                type="text"
                                                className="form-control form-control-sm font-monospace"
                                                value={form.code}
                                                onChange={(e) => handleChange('code', e.target.value.toUpperCase())}
                                                placeholder="e.g. BR-GUJ-MRB"
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div className="row g-3 mb-3">
                                        <div className="col-md-6">
                                            <label className="form-label small fw-semibold">Contact Email</label>
                                            <input
                                                type="email"
                                                className="form-control form-control-sm"
                                                value={form.email}
                                                onChange={(e) => handleChange('email', e.target.value)}
                                                placeholder="e.g. branch.imphal@company.com"
                                            />
                                        </div>
                                        <div className="col-md-6">
                                            <label className="form-label small fw-semibold">Phone Number</label>
                                            <input
                                                type="text"
                                                className="form-control form-control-sm"
                                                value={form.phone}
                                                onChange={(e) => handleChange('phone', e.target.value)}
                                                placeholder="e.g. +91 9876543210"
                                            />
                                        </div>
                                    </div>

                                    <div className="mb-3">
                                        <label className="form-label small fw-semibold">Physical Address</label>
                                        <textarea
                                            className="form-control form-control-sm"
                                            rows="2"
                                            value={form.address}
                                            onChange={(e) => handleChange('address', e.target.value)}
                                            placeholder="Full street address, city, state & postal code..."
                                        ></textarea>
                                    </div>

                                    <div className="form-check form-switch">
                                        <input
                                            className="form-check-input"
                                            type="checkbox"
                                            id="managerBranchIsActive"
                                            checked={form.is_active}
                                            onChange={(e) => handleChange('is_active', e.target.checked)}
                                        />
                                        <label className="form-check-label small text-muted" htmlFor="managerBranchIsActive">
                                            Branch location is active for transactions
                                        </label>
                                    </div>
                                </div>
                                <div className="modal-footer border-top-0 pb-4 px-4">
                                    <button type="button" className="btn btn-outline-secondary me-2 px-3 btn-sm" onClick={() => setShowModal(false)}>
                                        Cancel
                                    </button>
                                    <button type="submit" className="btn btn-primary px-4 btn-sm">
                                        {modalMode === 'create' ? 'Save Branch Location' : 'Update Branch Location'}
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
