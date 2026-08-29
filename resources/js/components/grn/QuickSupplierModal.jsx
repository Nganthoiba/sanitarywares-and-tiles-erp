import React, { useState, useEffect } from 'react';
import axios from 'axios';

export default function QuickSupplierModal({ show, onClose, onSave }) {
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);

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

    useEffect(() => {
        if (show) {
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
            const res = await axios.post('/api/suppliers-crud', form, {
                headers: { Authorization: `Bearer ${token}` }
            });
            onSave(res.data.supplier);
            onClose();
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to create supplier.');
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
                            <i className="fa-solid fa-truck-field text-primary me-2"></i>Quick Add Supplier
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
                                <label className="form-label small fw-semibold">Supplier Name</label>
                                <input
                                    type="text"
                                    className="form-control form-control-sm"
                                    value={form.name}
                                    onChange={(e) => handleChange('name', e.target.value)}
                                    placeholder="e.g. Somany Ceramics Ltd"
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
                                        placeholder="e.g. 24AAAFF1234A1Z1"
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
                                        placeholder="e.g. contact@somany.com"
                                    />
                                </div>
                                <div className="col-md-6">
                                    <label className="form-label small fw-semibold">Phone Number</label>
                                    <input
                                        type="text"
                                        className="form-control form-control-sm"
                                        value={form.phone}
                                        onChange={(e) => handleChange('phone', e.target.value)}
                                        placeholder="e.g. +919876543210"
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
                                    placeholder="Information, background, or specializations..."
                                ></textarea>
                            </div>

                            <div className="mb-3">
                                <label className="form-label small fw-semibold">Address</label>
                                <textarea
                                    className="form-control form-control-sm"
                                    rows="2"
                                    value={form.address}
                                    onChange={(e) => handleChange('address', e.target.value)}
                                    placeholder="Supplier headquarters or warehouse address..."
                                ></textarea>
                            </div>

                            <div className="form-check form-switch">
                                <input
                                    className="form-check-input"
                                    type="checkbox"
                                    id="quickSupplierIsActive"
                                    checked={form.is_active}
                                    onChange={(e) => handleChange('is_active', e.target.checked)}
                                />
                                <label className="form-check-label small text-muted" htmlFor="quickSupplierIsActive">
                                    Supplier is active for transactions
                                </label>
                            </div>
                        </div>
                        <div className="modal-footer border-top-0 pb-4 px-4">
                            <button type="button" className="btn btn-outline-secondary me-2 px-3 btn-sm" onClick={onClose} disabled={saving}>
                                Cancel
                            </button>
                            <button type="submit" className="btn btn-primary px-4 btn-sm" disabled={saving}>
                                {saving ? 'Adding...' : 'Add Supplier'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
