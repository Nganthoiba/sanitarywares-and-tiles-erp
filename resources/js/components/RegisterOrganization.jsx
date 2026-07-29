import React, { useState } from 'react';

export default function RegisterOrganization({ onRegistrationSuccess, onNavigateToLogin }) {
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Form states
    const [orgData, setOrgData] = useState({
        name: '',
        legal_name: '',
        business_type: 'Proprietorship',
        country: 'India',
        state: '',
        city: '',
        address: '',
        email: '',
        phone: '',
        gstin: '',
        pan: '',
        business_registration_number: '',
    });

    const [ownerData, setOwnerData] = useState({
        name: '',
        email: '',
        password: '',
        password_confirmation: '',
    });

    const handleOrgChange = (e) => {
        setOrgData({ ...orgData, [e.target.name]: e.target.value });
    };

    const handleOwnerChange = (e) => {
        setOwnerData({ ...ownerData, [e.target.name]: e.target.value });
    };

    const nextStep = () => {
        if (!orgData.name || !orgData.email) {
            setError('Organization Name and Contact Email are required.');
            return;
        }
        setError(null);
        setStep(2);
    };

    const prevStep = () => {
        setError(null);
        setStep(1);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);

        if (ownerData.password !== ownerData.password_confirmation) {
            setError('Passwords do not match.');
            return;
        }

        setLoading(true);

        try {
            const response = await fetch('/api/register-organization', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                },
                body: JSON.stringify({
                    organization: orgData,
                    owner: ownerData,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Registration failed');
            }

            // Save token and user details to localStorage
            localStorage.setItem('auth_token', data.access_token);
            localStorage.setItem('user_name', data.user.name);
            localStorage.setItem('user_email', data.user.email);
            localStorage.setItem('organization_name', data.organization.name);
            localStorage.setItem('user_permissions', JSON.stringify([
                'master.organizations.view',
                'master.organizations.update',
                'master.branches.manage',
                'master.warehouses.manage',
                'master.users.manage',
                'inventory.stock.view',
                'inventory.transfer.execute',
                'inventory.adjustment.approve',
                'inventory.count.manage',
                'purchase.requisitions.manage',
                'purchase.orders.create',
                'purchase.orders.approve',
                'sales.orders.manage',
                'sales.invoice.cancel',
                'accounting.accounts.manage',
                'accounting.journal.post',
                'workflow.definition.manage'
            ]));

            onRegistrationSuccess(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="d-flex align-items-center justify-content-center py-5" style={{ minHeight: '100vh', backgroundColor: '#f8fafc' }}>
            <div className="card shadow-sm border" style={{ width: '650px', borderRadius: '12px', backgroundColor: '#ffffff', borderColor: '#e2e8f0' }}>
                <div className="card-body p-5 text-dark">
                    <div className="text-center mb-4">
                        <h3 className="fw-bold text-dark mb-1">Register Your Organization</h3>
                        <p className="text-muted small">Establish your multi-tenant workspace</p>

                        <div className="d-flex justify-content-center align-items-center mt-3">
                            <span className={`badge px-3 py-2 ${step === 1 ? 'bg-primary' : 'bg-secondary'} me-2`} style={{ backgroundColor: step === 1 ? '#4f46e5' : '#64748b' }}>Phase 1: Organization</span>
                            <span className="text-muted">➔</span>
                            <span className={`badge px-3 py-2 ${step === 2 ? 'bg-primary' : 'bg-secondary'} ms-2`} style={{ backgroundColor: step === 2 ? '#4f46e5' : '#64748b' }}>Phase 2: Owner Account</span>
                        </div>
                    </div>

                    {error && (
                        <div className="alert alert-danger text-center py-2 border" style={{ backgroundColor: '#fef2f2', color: '#991b1b', borderColor: '#fca5a5', borderRadius: '8px', fontSize: '0.85rem' }}>
                            {error}
                        </div>
                    )}

                    {step === 1 ? (
                        <div>
                            <div className="row g-3">
                                <div className="col-md-6">
                                    <label className="form-label text-secondary small fw-semibold">Organization Name *</label>
                                    <input type="text" name="name" className="form-control" style={{ borderRadius: '8px', border: '1px solid #cbd5e1', backgroundColor: '#ffffff', color: '#1e293b' }} value={orgData.name} onChange={handleOrgChange} required />
                                </div>
                                <div className="col-md-6">
                                    <label className="form-label text-secondary small fw-semibold">Legal Name</label>
                                    <input type="text" name="legal_name" className="form-control" style={{ borderRadius: '8px', border: '1px solid #cbd5e1', backgroundColor: '#ffffff', color: '#1e293b' }} value={orgData.legal_name} onChange={handleOrgChange} />
                                </div>
                                <div className="col-md-6">
                                    <label className="form-label text-secondary small fw-semibold">Business Type</label>
                                    <select name="business_type" className="form-select" style={{ borderRadius: '8px', border: '1px solid #cbd5e1', backgroundColor: '#ffffff', color: '#1e293b' }} value={orgData.business_type} onChange={handleOrgChange}>
                                        <option value="Proprietorship">Proprietorship</option>
                                        <option value="Partnership">Partnership</option>
                                        <option value="Pvt Ltd">Private Limited</option>
                                        <option value="LLP">LLP</option>
                                    </select>
                                </div>
                                <div className="col-md-6">
                                    <label className="form-label text-secondary small fw-semibold">Contact Email *</label>
                                    <input type="email" name="email" className="form-control" style={{ borderRadius: '8px', border: '1px solid #cbd5e1', backgroundColor: '#ffffff', color: '#1e293b' }} value={orgData.email} onChange={handleOrgChange} required />
                                </div>
                                <div className="col-md-6">
                                    <label className="form-label text-secondary small fw-semibold">Phone Number</label>
                                    <input type="text" name="phone" className="form-control" style={{ borderRadius: '8px', border: '1px solid #cbd5e1', backgroundColor: '#ffffff', color: '#1e293b' }} value={orgData.phone} onChange={handleOrgChange} />
                                </div>
                                <div className="col-md-6">
                                    <label className="form-label text-secondary small fw-semibold">GSTIN</label>
                                    <input type="text" name="gstin" className="form-control" style={{ borderRadius: '8px', border: '1px solid #cbd5e1', backgroundColor: '#ffffff', color: '#1e293b' }} value={orgData.gstin} onChange={handleOrgChange} placeholder="e.g. 27AAACA1234A1Z1" />
                                </div>
                                <div className="col-md-6">
                                    <label className="form-label text-secondary small fw-semibold">City</label>
                                    <input type="text" name="city" className="form-control" style={{ borderRadius: '8px', border: '1px solid #cbd5e1', backgroundColor: '#ffffff', color: '#1e293b' }} value={orgData.city} onChange={handleOrgChange} />
                                </div>
                                <div className="col-md-6">
                                    <label className="form-label text-secondary small fw-semibold">State / Province</label>
                                    <input type="text" name="state" className="form-control" style={{ borderRadius: '8px', border: '1px solid #cbd5e1', backgroundColor: '#ffffff', color: '#1e293b' }} value={orgData.state} onChange={handleOrgChange} />
                                </div>
                                <div className="col-12">
                                    <label className="form-label text-secondary small fw-semibold">Address</label>
                                    <textarea name="address" rows="2" className="form-control" style={{ borderRadius: '8px', border: '1px solid #cbd5e1', backgroundColor: '#ffffff', color: '#1e293b' }} value={orgData.address} onChange={handleOrgChange}></textarea>
                                </div>
                            </div>

                            <button onClick={nextStep} className="btn btn-primary w-100 py-2.5 fw-bold mt-4" style={{ borderRadius: '8px', backgroundColor: '#4f46e5', border: 'none' }}>
                                Continue to Owner Account
                            </button>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit}>
                            <div className="row g-3">
                                <div className="col-12">
                                    <label className="form-label text-secondary small fw-semibold">Owner Full Name *</label>
                                    <input type="text" name="name" className="form-control" style={{ borderRadius: '8px', border: '1px solid #cbd5e1', backgroundColor: '#ffffff', color: '#1e293b' }} value={ownerData.name} onChange={handleOwnerChange} required />
                                </div>
                                <div className="col-12">
                                    <label className="form-label text-secondary small fw-semibold">Owner Email Address *</label>
                                    <input type="email" name="email" className="form-control" style={{ borderRadius: '8px', border: '1px solid #cbd5e1', backgroundColor: '#ffffff', color: '#1e293b' }} value={ownerData.email} onChange={handleOwnerChange} required />
                                </div>
                                <div className="col-md-6">
                                    <label className="form-label text-secondary small fw-semibold">Password *</label>
                                    <input type="password" name="password" className="form-control" style={{ borderRadius: '8px', border: '1px solid #cbd5e1', backgroundColor: '#ffffff', color: '#1e293b' }} value={ownerData.password} onChange={handleOwnerChange} required />
                                </div>
                                <div className="col-md-6">
                                    <label className="form-label text-secondary small fw-semibold">Confirm Password *</label>
                                    <input type="password" name="password_confirmation" className="form-control" style={{ borderRadius: '8px', border: '1px solid #cbd5e1', backgroundColor: '#ffffff', color: '#1e293b' }} value={ownerData.password_confirmation} onChange={handleOwnerChange} required />
                                </div>
                            </div>

                            <div className="d-flex gap-3 mt-4">
                                <button type="button" onClick={prevStep} className="btn btn-outline-secondary py-2.5 fw-bold text-dark w-50" style={{ borderRadius: '8px' }}>
                                    Back
                                </button>
                                <button type="submit" className="btn btn-primary py-2.5 fw-bold w-50" style={{ borderRadius: '8px', backgroundColor: '#4f46e5', border: 'none' }} disabled={loading}>
                                    {loading ? <span className="spinner-border spinner-border-sm me-2"></span> : null}
                                    Register Business
                                </button>
                            </div>
                        </form>
                    )}

                    <div className="text-center mt-4">
                        <span className="text-muted small">Already have an account? </span>
                        <button onClick={onNavigateToLogin} className="btn btn-link text-decoration-none p-0 small fw-bold" style={{ color: '#4f46e5' }}>
                            Sign In
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
