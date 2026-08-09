import React, { useState, useEffect } from 'react';
import axios from 'axios';

export default function QuickWarehouseModal({ show, onClose, onSave }) {
    const [branches, setBranches] = useState([]);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);

    const [form, setForm] = useState({
        name: '',
        code: '',
        branch_id: '',
        type: 'MAIN',
        address: '',
        is_active: true
    });

    useEffect(() => {
        if (show) {
            const fetchBranches = async () => {
                setLoading(true);
                try {
                    const token = localStorage.getItem('auth_token');
                    const res = await axios.get('/api/branches', {
                        headers: { Authorization: `Bearer ${token}` }
                    });
                    setBranches(res.data || []);
                    if (res.data.length > 0) {
                        setForm(prev => ({ ...prev, branch_id: res.data[0].id }));
                    }
                } catch (err) {
                    setError('Failed to load branches context.');
                } finally {
                    setLoading(false);
                }
            };
            fetchBranches();
            
            setForm({
                name: '',
                code: '',
                branch_id: '',
                type: 'MAIN',
                address: '',
                is_active: true
            });
            setError(null);
        }
    }, [show]);

    if (!show) return null;

    const handleChange = (field, value) => {
        setForm(prev => ({ ...prev, [field]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        setError(null);

        try {
            const token = localStorage.getItem('auth_token');
            const res = await axios.post('/api/warehouses-crud', form, {
                headers: { Authorization: `Bearer ${token}` }
            });
            onSave(res.data.warehouse);
            onClose();
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to create warehouse.');
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
                            <i className="fa-solid fa-warehouse text-primary me-2"></i>Quick Add Warehouse
                        </h5>
                        <button type="button" className="btn-close" onClick={onClose} aria-label="Close"></button>
                    </div>
                    <form onSubmit={handleSubmit}>
                        <div className="modal-body px-4 py-3">
                            {error && (
                                <div className="alert alert-danger py-2 small" role="alert">
                                    {error}
                                </div>
                            )}

                            <div className="mb-3">
                                <label className="form-label small fw-semibold">Branch Location</label>
                                <select
                                    className="form-select form-select-sm"
                                    value={form.branch_id}
                                    onChange={(e) => handleChange('branch_id', e.target.value)}
                                    required
                                    disabled={loading}
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
                                    id="quickWHIsActive"
                                    checked={form.is_active}
                                    onChange={(e) => handleChange('is_active', e.target.checked)}
                                />
                                <label className="form-check-label small text-muted" htmlFor="quickWHIsActive">
                                    Warehouse is active for transactions
                                </label>
                            </div>
                        </div>
                        <div className="modal-footer border-top-0 pb-4 px-4">
                            <button type="button" className="btn btn-outline-secondary me-2 px-3 btn-sm" onClick={onClose} disabled={saving}>
                                Cancel
                            </button>
                            <button type="submit" className="btn btn-primary px-4 btn-sm" disabled={saving || loading}>
                                {saving ? 'Adding...' : 'Add Warehouse'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
