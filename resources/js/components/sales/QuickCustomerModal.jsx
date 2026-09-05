import React, { useState } from 'react';
import axios from 'axios';

export default function QuickCustomerModal({ show, onClose, onCustomerCreated }) {
    if (!show) return null;

    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        email: '',
        gstin: '',
        address: '',
        state: 'Manipur',
        city: 'Imphal',
        pincode: ''
    });

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.name.trim()) {
            setError('Customer name is required.');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const token = localStorage.getItem('auth_token');
            const res = await axios.post('/api/customers-crud', formData, {
                headers: { Authorization: `Bearer ${token}` }
            });

            onCustomerCreated(res.data);
            onClose();
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to create customer.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
            <div className="modal-dialog modal-dialog-centered modal-lg">
                <div className="modal-content shadow-lg border-0">
                    <div className="modal-header bg-primary text-white py-3">
                        <h5 className="modal-title font-weight-bold">
                            <i className="fa-solid fa-user-plus me-2"></i>Quick Add New Customer
                        </h5>
                        <button type="button" className="btn-close btn-close-white" onClick={onClose}></button>
                    </div>
                    <form onSubmit={handleSubmit}>
                        <div className="modal-body p-4">
                            {error && <div className="alert alert-danger py-2">{error}</div>}

                            <div className="row g-3">
                                <div className="col-md-6">
                                    <label className="form-label fw-semibold">Customer Name *</label>
                                    <input
                                        type="text"
                                        name="name"
                                        className="form-control"
                                        value={formData.name}
                                        onChange={handleChange}
                                        placeholder="e.g. Ramesh Kumar / ABC Traders"
                                        required
                                    />
                                </div>
                                <div className="col-md-6">
                                    <label className="form-label fw-semibold">Phone Number</label>
                                    <input
                                        type="text"
                                        name="phone"
                                        className="form-control"
                                        value={formData.phone}
                                        onChange={handleChange}
                                        placeholder="Mobile / Phone number"
                                    />
                                </div>
                                <div className="col-md-6">
                                    <label className="form-label fw-semibold">GSTIN (Optional)</label>
                                    <input
                                        type="text"
                                        name="gstin"
                                        className="form-control text-uppercase"
                                        value={formData.gstin}
                                        onChange={handleChange}
                                        placeholder="15-digit GST Number"
                                        maxLength="15"
                                    />
                                </div>
                                <div className="col-md-6">
                                    <label className="form-label fw-semibold">Email (Optional)</label>
                                    <input
                                        type="email"
                                        name="email"
                                        className="form-control"
                                        value={formData.email}
                                        onChange={handleChange}
                                        placeholder="customer@example.com"
                                    />
                                </div>
                                <div className="col-md-12">
                                    <label className="form-label fw-semibold">Address</label>
                                    <textarea
                                        name="address"
                                        className="form-control"
                                        rows="2"
                                        value={formData.address}
                                        onChange={handleChange}
                                        placeholder="Shop / House Address"
                                    ></textarea>
                                </div>
                                <div className="col-md-4">
                                    <label className="form-label fw-semibold">State</label>
                                    <input
                                        type="text"
                                        name="state"
                                        className="form-control"
                                        value={formData.state}
                                        onChange={handleChange}
                                        placeholder="State name"
                                    />
                                </div>
                                <div className="col-md-4">
                                    <label className="form-label fw-semibold">City</label>
                                    <input
                                        type="text"
                                        name="city"
                                        className="form-control"
                                        value={formData.city}
                                        onChange={handleChange}
                                        placeholder="City name"
                                    />
                                </div>
                                <div className="col-md-4">
                                    <label className="form-label fw-semibold">Pincode</label>
                                    <input
                                        type="text"
                                        name="pincode"
                                        className="form-control"
                                        value={formData.pincode}
                                        onChange={handleChange}
                                        placeholder="Postal Pincode"
                                    />
                                </div>
                            </div>
                        </div>
                        <div className="modal-footer bg-light">
                            <button type="button" className="btn btn-secondary px-4" onClick={onClose}>Cancel</button>
                            <button type="submit" className="btn btn-primary px-4" disabled={loading}>
                                {loading ? <span className="spinner-border spinner-border-sm me-2"></span> : <i className="fa-solid fa-check me-2"></i>}
                                Save Customer
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
