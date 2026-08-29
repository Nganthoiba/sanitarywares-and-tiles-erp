import React, { useState, useEffect } from 'react';
import axios from 'axios';

export default function QuickStorageLocationModal({ show, onClose, onSave, warehouseId, warehouses = [] }) {
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);

    const [form, setForm] = useState({
        warehouse_id: '',
        name: '',
        location_type: 'RACK',
        code: ''
    });

    useEffect(() => {
        if (show) {
            setForm({
                warehouse_id: warehouseId || (warehouses.length > 0 ? warehouses[0].id : ''),
                name: '',
                location_type: 'RACK',
                code: ''
            });
            setError(null);
        }
    }, [show, warehouseId, warehouses]);

    if (!show) return null;

    const handleChange = (field, value) => {
        setForm(prev => ({ ...prev, [field]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        setError(null);

        if (!form.warehouse_id) {
            setError('Please select a parent warehouse.');
            setSaving(false);
            return;
        }

        try {
            const token = localStorage.getItem('auth_token');
            const res = await axios.post('/api/storage-locations-crud', form, {
                headers: { Authorization: `Bearer ${token}` }
            });
            onSave(res.data.storage_location);
            onClose();
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to create storage location.');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)', zIndex: 1070 }}>
            <div className="modal-dialog modal-dialog-centered">
                <div className="modal-content border-0 shadow-lg" style={{ borderRadius: '16px' }}>
                    <div className="modal-header border-bottom-0 pb-0 pt-4 px-4">
                        <h5 className="modal-title fw-bold text-dark">
                            <i className="fa-solid fa-map-pin text-primary me-2"></i>Quick Add Storage Location
                        </h5>
                        <button type="button" className="btn-close" onClick={onClose} aria-label="Close"></button>
                    </div>
                    <form onSubmit={handleSubmit}>
                        <div className="modal-body px-4 py-3">
                            {error && (
                                <div className="alert alert-danger py-2 small d-flex align-items-center justify-content-between" role="alert">
                                    <div>{error}</div>
                                    <button type="button" className="btn-close ms-2 flex-shrink-0" onClick={() => setError(null)} aria-label="Close"></button>
                                </div>
                            )}

                            <div className="mb-3">
                                <label className="form-label small fw-semibold">Parent Warehouse</label>
                                {warehouseId ? (
                                    <input
                                        type="text"
                                        className="form-control form-control-sm bg-light font-monospace"
                                        value={warehouses.find(w => w.id === parseInt(warehouseId))?.name || 'Selected Warehouse'}
                                        disabled
                                    />
                                ) : (
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
                                )}
                            </div>

                            <div className="mb-3">
                                <label className="form-label small fw-semibold">Location Name</label>
                                <input
                                    type="text"
                                    className="form-control form-control-sm"
                                    value={form.name}
                                    onChange={(e) => handleChange('name', e.target.value)}
                                    placeholder="e.g. Rack A - Shelf 2"
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
                                    <label className="form-label small fw-semibold">Identifier Code</label>
                                    <input
                                        type="text"
                                        className="form-control form-control-sm font-monospace"
                                        value={form.code}
                                        onChange={(e) => handleChange('code', e.target.value.toUpperCase())}
                                        placeholder="e.g. RACK-A-S2"
                                        required
                                    />
                                </div>
                            </div>
                        </div>
                        <div className="modal-footer border-top-0 pb-4 px-4">
                            <button type="button" className="btn btn-outline-secondary me-2 px-3 btn-sm" onClick={onClose} disabled={saving}>
                                Cancel
                            </button>
                            <button type="submit" className="btn btn-primary px-4 btn-sm" disabled={saving}>
                                {saving ? 'Adding...' : 'Add Storage Location'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
