import React, { useState, useEffect } from 'react';
import axios from 'axios';

export default function StorageLocationManager() {
    const [locations, setLocations] = useState([]);
    const [warehouses, setWarehouses] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);

    // Modal state
    const [showModal, setShowModal] = useState(false);
    const [modalMode, setModalMode] = useState('create'); // create, edit
    const [selectedLocation, setSelectedLocation] = useState(null);

    const [form, setForm] = useState({
        warehouse_id: '',
        name: '',
        location_type: 'RACK',
        code: ''
    });

    const fetchLocations = async () => {
        setLoading(true);
        setError(null);
        try {
            const token = localStorage.getItem('auth_token');
            const res = await axios.get('/api/storage-locations-crud', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setLocations(res.data || []);
        } catch (err) {
            setError('Failed to fetch storage locations list.');
        } finally {
            setLoading(false);
        }
    };

    const fetchWarehouses = async () => {
        try {
            const token = localStorage.getItem('auth_token');
            const res = await axios.get('/api/warehouses-crud', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setWarehouses(res.data || []);
        } catch (err) {
            console.error('Failed to load warehouses context.');
        }
    };

    useEffect(() => {
        fetchLocations();
        fetchWarehouses();
    }, []);

    const handleOpenCreate = () => {
        setModalMode('create');
        setSelectedLocation(null);
        setForm({
            warehouse_id: warehouses.length > 0 ? warehouses[0].id : '',
            name: '',
            location_type: 'RACK',
            code: ''
        });
        setError(null);
        setShowModal(true);
    };

    const handleOpenEdit = (loc) => {
        setModalMode('edit');
        setSelectedLocation(loc);
        setForm({
            warehouse_id: loc.warehouse_id || '',
            name: loc.name || '',
            location_type: loc.location_type || 'RACK',
            code: loc.code || ''
        });
        setError(null);
        setShowModal(true);
    };

    const handleDelete = async (loc) => {
        if (!confirm(`Are you sure you want to delete storage location "${loc.name}" (${loc.code})? This action cannot be undone.`)) {
            return;
        }
        setError(null);
        setSuccess(null);
        try {
            const token = localStorage.getItem('auth_token');
            await axios.delete(`/api/storage-locations-crud/${loc.id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setSuccess('Storage location successfully deleted.');
            fetchLocations();
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to delete storage location.');
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setSuccess(null);

        try {
            const token = localStorage.getItem('auth_token');
            if (modalMode === 'create') {
                await axios.post('/api/storage-locations-crud', form, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setSuccess('Storage location created successfully.');
            } else {
                await axios.put(`/api/storage-locations-crud/${selectedLocation.id}`, form, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setSuccess('Storage location updated successfully.');
            }
            setShowModal(false);
            fetchLocations();
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to save storage location.');
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
                        <i className="fa-solid fa-map-pin me-2 text-primary"></i>Storage Location Matrix
                    </h3>
                    <p className="text-muted small mb-0">Define specific zones, shelves, row ranks, and bins within your warehouses for inventory slotting.</p>
                </div>
                <button className="btn btn-primary px-4 shadow-sm" onClick={handleOpenCreate}>
                    <i className="fa-solid fa-plus me-2"></i> Define Storage Location
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

            {/* Storage Location Table Card */}
            <div className="card border-0 shadow-sm p-4" style={{ borderRadius: '12px' }}>
                {loading ? (
                    <div className="text-center py-5">
                        <div className="spinner-border text-primary" role="status"></div>
                        <span className="ms-2 font-monospace">Fetching warehouse slotting structures...</span>
                    </div>
                ) : (
                    <div className="table-responsive">
                        <table className="table table-hover align-middle">
                            <thead>
                                <tr className="text-secondary font-monospace" style={{ fontSize: '0.8rem' }}>
                                    <th>Location Code</th>
                                    <th>Location Name</th>
                                    <th>Warehouse</th>
                                    <th>Location Type</th>
                                    <th className="text-end">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {locations.map((loc) => (
                                    <tr key={loc.id}>
                                        <td className="fw-bold text-dark font-monospace">{loc.code}</td>
                                        <td>{loc.name}</td>
                                        <td>{loc.warehouse?.name || <span className="text-muted small">N/A</span>}</td>
                                        <td>
                                            <span className="badge bg-secondary-subtle text-secondary px-2">
                                                {loc.location_type}
                                            </span>
                                        </td>
                                        <td className="text-end">
                                            <div className="d-flex justify-content-end gap-1">
                                                <button
                                                    className="btn btn-xs btn-outline-primary px-2"
                                                    onClick={() => handleOpenEdit(loc)}
                                                    style={{ fontSize: '0.75rem' }}
                                                >
                                                    <i className="fa-solid fa-pen me-1"></i> Edit
                                                </button>
                                                <button
                                                    className="btn btn-xs btn-outline-danger px-2"
                                                    onClick={() => handleDelete(loc)}
                                                    style={{ fontSize: '0.75rem' }}
                                                >
                                                    <i className="fa-solid fa-trash me-1"></i> Delete
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {locations.length === 0 && (
                                    <tr>
                                        <td colSpan="5" className="text-center py-5 text-muted font-monospace">
                                            No storage locations configured. Click 'Define Storage Location' to add one.
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
                                    <i className="fa-solid fa-map-pin text-primary me-2"></i>
                                    {modalMode === 'create' ? 'Define Storage Location' : 'Edit Storage Location'}
                                </h5>
                                <button type="button" className="btn-close" onClick={() => setShowModal(false)} aria-label="Close"></button>
                            </div>
                            <form onSubmit={handleSubmit}>
                                <div className="modal-body px-4 py-3">
                                    <div className="mb-3">
                                        <label className="form-label small fw-semibold">Parent Warehouse</label>
                                        <select
                                            className="form-select form-select-sm"
                                            value={form.warehouse_id}
                                            onChange={(e) => handleChange('warehouse_id', e.target.value)}
                                            required
                                        >
                                            <option value="">-- Choose Warehouse --</option>
                                            {warehouses.map(w => (
                                                <option key={w.id} value={w.id}>{w.name} ({w.code})</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="mb-3">
                                        <label className="form-label small fw-semibold">Location Name</label>
                                        <input
                                            type="text"
                                            className="form-control form-control-sm"
                                            value={form.name}
                                            onChange={(e) => handleChange('name', e.target.value)}
                                            placeholder="e.g. Row A - Rack 3 - Bin B"
                                            required
                                        />
                                    </div>

                                    <div className="row mb-3">
                                        <div className="col-md-6">
                                            <label className="form-label small fw-semibold">Location Type</label>
                                            <select
                                                className="form-select form-select-sm"
                                                value={form.location_type}
                                                onChange={(e) => handleChange('location_type', e.target.value)}
                                                required
                                            >
                                                <option value="RACK">Rack</option>
                                                <option value="ROW">Row</option>
                                                <option value="BIN">Bin</option>
                                                <option value="SHELF">Shelf</option>
                                                <option value="AISLE">Aisle</option>
                                                <option value="YARD">Yard</option>
                                                <option value="STACK">Stack</option>
                                                <option value="FLOOR">Floor</option>
                                            </select>
                                        </div>
                                        <div className="col-md-6">
                                            <label className="form-label small fw-semibold">Location Code</label>
                                            <input
                                                type="text"
                                                className="form-control form-control-sm font-monospace"
                                                value={form.code}
                                                onChange={(e) => handleChange('code', e.target.value.toUpperCase())}
                                                placeholder="e.g. ROWA-R3-BB"
                                                required
                                            />
                                        </div>
                                    </div>
                                </div>
                                <div className="modal-footer border-top-0 pb-4 px-4">
                                    <button type="button" className="btn btn-outline-secondary me-2 px-3 btn-sm" onClick={() => setShowModal(false)}>
                                        Cancel
                                    </button>
                                    <button type="submit" className="btn btn-primary px-4 btn-sm">
                                        {modalMode === 'create' ? 'Save Location' : 'Update Location'}
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
