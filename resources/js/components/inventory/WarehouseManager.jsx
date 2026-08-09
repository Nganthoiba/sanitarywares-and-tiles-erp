import React, { useState, useEffect } from 'react';
import axios from 'axios';
import QuickBranchModal from '../grn/QuickBranchModal';

export default function WarehouseManager() {
    const [warehouses, setWarehouses] = useState([]);
    const [branches, setBranches] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);

    // Modal state
    const [showModal, setShowModal] = useState(false);
    const [modalMode, setModalMode] = useState('create'); // create, edit
    const [selectedWH, setSelectedWH] = useState(null);
    const [showQuickBranchModal, setShowQuickBranchModal] = useState(false);

    const [form, setForm] = useState({
        branch_id: '',
        name: '',
        code: '',
        type: 'MAIN',
        address: '',
        is_active: true
    });

    const fetchWarehouses = async () => {
        setLoading(true);
        setError(null);
        try {
            const token = localStorage.getItem('auth_token');
            const res = await axios.get('/api/warehouses-crud', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setWarehouses(res.data || []);
        } catch (err) {
            setError('Failed to fetch warehouses list.');
        } finally {
            setLoading(false);
        }
    };

    const fetchBranches = async () => {
        try {
            const token = localStorage.getItem('auth_token');
            const res = await axios.get('/api/branches', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setBranches(res.data || []);
        } catch (err) {
            console.error('Failed to load branches.');
        }
    };

    useEffect(() => {
        fetchWarehouses();
        fetchBranches();
    }, []);

    const handleOpenCreate = () => {
        setModalMode('create');
        setSelectedWH(null);
        setForm({
            branch_id: branches.length > 0 ? branches[0].id : '',
            name: '',
            code: '',
            type: 'MAIN',
            address: '',
            is_active: true
        });
        setError(null);
        setShowModal(true);
    };

    const handleOpenEdit = (wh) => {
        setModalMode('edit');
        setSelectedWH(wh);
        setForm({
            branch_id: wh.branch_id || '',
            name: wh.name || '',
            code: wh.code || '',
            type: wh.type || 'MAIN',
            address: wh.address || '',
            is_active: wh.is_active === 1 || wh.is_active === true
        });
        setError(null);
        setShowModal(true);
    };

    const handleDelete = async (wh) => {
        if (!confirm(`Are you sure you want to delete warehouse "${wh.name}"? This action cannot be undone.`)) {
            return;
        }
        setError(null);
        setSuccess(null);
        try {
            const token = localStorage.getItem('auth_token');
            await axios.delete(`/api/warehouses-crud/${wh.id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setSuccess('Warehouse successfully deleted.');
            fetchWarehouses();
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to delete warehouse.');
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setSuccess(null);

        try {
            const token = localStorage.getItem('auth_token');
            if (modalMode === 'create') {
                await axios.post('/api/warehouses-crud', form, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setSuccess('Warehouse created successfully.');
            } else {
                await axios.put(`/api/warehouses-crud/${selectedWH.id}`, form, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setSuccess('Warehouse updated successfully.');
            }
            setShowModal(false);
            fetchWarehouses();
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to save warehouse.');
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
                        <i className="fa-solid fa-warehouse me-2 text-primary"></i>Warehouse Registry
                    </h3>
                    <p className="text-muted small mb-0">Define, edit, and manage storage yards, yards, and stores for your organization.</p>
                </div>
                <button className="btn btn-primary px-4 shadow-sm" onClick={handleOpenCreate}>
                    <i className="fa-solid fa-plus me-2"></i> Define Warehouse
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

            {/* Warehouse Table Card */}
            <div className="card border-0 shadow-sm p-4" style={{ borderRadius: '12px' }}>
                {loading ? (
                    <div className="text-center py-5">
                        <div className="spinner-border text-primary" role="status"></div>
                        <span className="ms-2 font-monospace">Fetching locations matrix...</span>
                    </div>
                ) : (
                    <div className="table-responsive">
                        <table className="table table-hover align-middle">
                            <thead>
                                <tr className="text-secondary font-monospace" style={{ fontSize: '0.8rem' }}>
                                    <th>Warehouse Code</th>
                                    <th>Warehouse Name</th>
                                    <th>Branch Location</th>
                                    <th>Type</th>
                                    <th>Status</th>
                                    <th className="text-end">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {warehouses.map((wh) => (
                                    <tr key={wh.id}>
                                        <td className="fw-bold text-dark font-monospace">{wh.code}</td>
                                        <td>{wh.name}</td>
                                        <td>{wh.branch?.name || <span className="text-muted small">N/A</span>}</td>
                                        <td>
                                            <span className="badge bg-secondary-subtle text-secondary px-2">
                                                {wh.type}
                                            </span>
                                        </td>
                                        <td>
                                            {wh.is_active === 1 || wh.is_active === true ? (
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
                                                    onClick={() => handleOpenEdit(wh)}
                                                    style={{ fontSize: '0.75rem' }}
                                                >
                                                    <i className="fa-solid fa-pen me-1"></i> Edit
                                                </button>
                                                <button
                                                    className="btn btn-xs btn-outline-danger px-2"
                                                    onClick={() => handleDelete(wh)}
                                                    style={{ fontSize: '0.75rem' }}
                                                >
                                                    <i className="fa-solid fa-trash me-1"></i> Delete
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {warehouses.length === 0 && (
                                    <tr>
                                        <td colSpan="6" className="text-center py-5 text-muted font-monospace">
                                            No warehouses configured. Click 'Define Warehouse' to add one.
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
                                    <i className="fa-solid fa-warehouse text-primary me-2"></i>
                                    {modalMode === 'create' ? 'Define Warehouse' : 'Edit Warehouse'}
                                </h5>
                                <button type="button" className="btn-close" onClick={() => setShowModal(false)} aria-label="Close"></button>
                            </div>
                            <form onSubmit={handleSubmit}>
                                <div className="modal-body px-4 py-3">
                                    <div className="mb-3">
                                        <div className="d-flex justify-content-between align-items-center mb-1">
                                            <label className="form-label small fw-semibold mb-0">Branch Location</label>
                                            <button
                                                type="button"
                                                className="btn btn-link p-0 text-primary small text-decoration-none fw-semibold"
                                                onClick={() => setShowQuickBranchModal(true)}
                                                style={{ fontSize: '0.75rem' }}
                                            >
                                                <i className="fa-solid fa-plus me-1"></i> Add New
                                            </button>
                                        </div>
                                        <select
                                            className="form-select form-select-sm"
                                            value={form.branch_id}
                                            onChange={(e) => handleChange('branch_id', e.target.value)}
                                            required
                                        >
                                            <option value="">-- Choose Branch --</option>
                                            {branches.map(b => (
                                                <option key={b.id} value={b.id}>{b.name}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="mb-3">
                                        <label className="form-label small fw-semibold">Warehouse Name</label>
                                        <input
                                            type="text"
                                            className="form-control form-control-sm"
                                            value={form.name}
                                            onChange={(e) => handleChange('name', e.target.value)}
                                            placeholder="e.g. Morbi Yard 2"
                                            required
                                        />
                                    </div>

                                    <div className="row mb-3">
                                        <div className="col-md-6">
                                            <label className="form-label small fw-semibold">Identifier Code</label>
                                            <input
                                                type="text"
                                                className="form-control form-control-sm font-monospace"
                                                value={form.code}
                                                onChange={(e) => handleChange('code', e.target.value.toUpperCase())}
                                                placeholder="e.g. WH-MRB2"
                                                required
                                            />
                                        </div>
                                        <div className="col-md-6">
                                            <label className="form-label small fw-semibold">Warehouse Type</label>
                                            <select
                                                className="form-select form-select-sm"
                                                value={form.type}
                                                onChange={(e) => handleChange('type', e.target.value)}
                                                required
                                            >
                                                <option value="MAIN">Main</option>
                                                <option value="GRANITE_YARD">Granite Yard</option>
                                                <option value="TILE_STORE">Tile Store</option>
                                                <option value="SANITARY_STORE">Sanitary Store</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div className="mb-3">
                                        <label className="form-label small fw-semibold">Physical Address</label>
                                        <textarea
                                            className="form-control form-control-sm"
                                            rows="2"
                                            value={form.address}
                                            onChange={(e) => handleChange('address', e.target.value)}
                                            placeholder="Street, City, State details..."
                                        ></textarea>
                                    </div>

                                    <div className="form-check form-switch">
                                        <input
                                            className="form-check-input"
                                            type="checkbox"
                                            id="managerWHIsActive"
                                            checked={form.is_active}
                                            onChange={(e) => handleChange('is_active', e.target.checked)}
                                        />
                                        <label className="form-check-label small text-muted" htmlFor="managerWHIsActive">
                                            Warehouse is active for transactions
                                        </label>
                                    </div>
                                </div>
                                <div className="modal-footer border-top-0 pb-4 px-4">
                                    <button type="button" className="btn btn-outline-secondary me-2 px-3 btn-sm" onClick={() => setShowModal(false)}>
                                        Cancel
                                    </button>
                                    <button type="submit" className="btn btn-primary px-4 btn-sm">
                                        {modalMode === 'create' ? 'Save Warehouse' : 'Update Warehouse'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            <QuickBranchModal
                show={showQuickBranchModal}
                onClose={() => setShowQuickBranchModal(false)}
                onSave={(newBranch) => {
                    setBranches(prev => [...prev, newBranch]);
                    handleChange('branch_id', newBranch.id);
                }}
            />
        </div>
    );
}
