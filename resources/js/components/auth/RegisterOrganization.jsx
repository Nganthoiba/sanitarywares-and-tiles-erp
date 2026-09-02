import React, { useState } from 'react';
import { Link } from 'react-router-dom';

export default function RegisterOrganization({ onRegistrationSuccess, onNavigateToLogin, onNavigateToHome }) {
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

            console.log(data);

            // Save token and user details to localStorage
            localStorage.setItem('auth_token', data.access_token);
            localStorage.setItem('user_name', data.user.name);
            localStorage.setItem('user_email', data.user.email);
            localStorage.setItem('organization_name', data.organization.name);
            localStorage.setItem('user_roles', JSON.stringify(data.user_roles || data.user?.roles || ['Administrator']));
            localStorage.setItem('user_permissions', JSON.stringify(data.user_permissions));

            onRegistrationSuccess(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-vh-100 d-flex align-items-center justify-content-center bg-light font-sans py-5">
            <div className="container">
                <div className="card border-0 shadow-lg overflow-hidden" style={{ borderRadius: '1.5rem', maxWidth: '1000px', margin: '0 auto' }}>
                    <div className="row g-0">
                        {/* Branding Side */}
                        <div className="col-lg-5 d-none d-lg-flex flex-column justify-content-center align-items-center p-5 position-relative" style={{ background: 'linear-gradient(135deg, #4f46e5 0%, #3730a3 100%)', color: '#fff' }}>
                            <div className="position-absolute top-0 start-0 w-100 h-100" style={{ background: 'radial-gradient(circle at top left, rgba(255,255,255,0.1), transparent 50%)' }}></div>
                            <svg xmlns="http://www.w3.org/2000/svg" width="90" height="90" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mb-4 shadow rounded-4 bg-white p-3 text-primary position-relative z-1"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
                            <h2 className="fw-bolder mb-3 text-center position-relative z-1" style={{ letterSpacing: '-0.5px' }}>Tiles & Sanitary Portal</h2>
                            <p className="lead text-center opacity-75 position-relative z-1 mb-0 px-4">Establish your multi-tenant workspace with our platform.</p>
                        </div>

                        {/* Registration Form Side */}
                        <div className="col-lg-7 d-flex align-items-center bg-white p-4 p-sm-5">
                            <div className="w-100">
                                <div className="mb-4">
                                    <Link 
                                        to="/" 
                                        onClick={onNavigateToHome} 
                                        className="btn btn-sm text-indigo border rounded-pill px-3 py-1.5 fw-bold d-inline-flex align-items-center gap-2 shadow-sm"
                                        style={{ color: '#4f46e5', backgroundColor: '#eef2ff', borderColor: '#c7d2fe' }}
                                    >
                                        <i className="fa-solid fa-arrow-left"></i>
                                        <span>Back to Home</span>
                                    </Link>
                                </div>

                                <div className="text-center mb-4 d-lg-none">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#4f46e5" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="mb-3"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
                                    <h3 className="fw-bolder text-primary">CeramaFlow</h3>
                                </div>

                                <h3 className="fw-bold mb-1">Create organization account</h3>
                                <p className="text-secondary mb-4">Set up your business profile to get started.</p>

                                <div className="d-flex align-items-center mb-4">
                                    <span className={`badge px-3 py-2 rounded-pill ${step === 1 ? 'bg-primary text-white' : 'bg-secondary text-white-50'} me-2`} style={{ backgroundColor: step === 1 ? '#4f46e5' : '#64748b' }}>1. Business details</span>
                                    <span className="text-muted font-monospace">&rarr;</span>
                                    <span className={`badge px-3 py-2 rounded-pill ${step === 2 ? 'bg-primary text-white' : 'bg-secondary text-white-50'} ms-2`} style={{ backgroundColor: step === 2 ? '#4f46e5' : '#64748b' }}>2. Owner profile</span>
                                </div>

                                {error && (
                                    <div className="alert alert-danger rounded-3 border-0 bg-danger-subtle text-danger py-2 mb-4 d-flex align-items-center justify-content-between">
                                        <div>{error}</div>
                                        <button type="button" className="btn-close ms-2 flex-shrink-0" onClick={() => setError('')} aria-label="Close"></button>
                                    </div>
                                )}

                                {step === 1 ? (
                                    <div>
                                        <div className="row g-3">
                                            <div className="col-md-6">
                                                <label className="form-label text-secondary small fw-semibold">Organization Name *</label>
                                                <input type="text" name="name" className="form-control" style={{ borderRadius: '8px', border: '1px solid #cbd5e1' }} value={orgData.name} onChange={handleOrgChange} required />
                                            </div>
                                            <div className="col-md-6">
                                                <label className="form-label text-secondary small fw-semibold">Legal Entity Name</label>
                                                <input type="text" name="legal_name" className="form-control" style={{ borderRadius: '8px', border: '1px solid #cbd5e1' }} value={orgData.legal_name} onChange={handleOrgChange} />
                                            </div>
                                            <div className="col-md-6">
                                                <label className="form-label text-secondary small fw-semibold">Business Type</label>
                                                <select name="business_type" className="form-select" style={{ borderRadius: '8px', border: '1px solid #cbd5e1' }} value={orgData.business_type} onChange={handleOrgChange}>
                                                    <option value="Proprietorship">Proprietorship</option>
                                                    <option value="Partnership">Partnership</option>
                                                    <option value="Pvt Ltd">Private Limited</option>
                                                    <option value="LLP">LLP</option>
                                                </select>
                                            </div>
                                            <div className="col-md-6">
                                                <label className="form-label text-secondary small fw-semibold">Contact Email Address *</label>
                                                <input type="email" name="email" className="form-control" style={{ borderRadius: '8px', border: '1px solid #cbd5e1' }} value={orgData.email} onChange={handleOrgChange} required />
                                            </div>
                                            <div className="col-md-6">
                                                <label className="form-label text-secondary small fw-semibold">Phone Number</label>
                                                <input type="text" name="phone" className="form-control" style={{ borderRadius: '8px', border: '1px solid #cbd5e1' }} value={orgData.phone} onChange={handleOrgChange} />
                                            </div>
                                            <div className="col-md-6">
                                                <label className="form-label text-secondary small fw-semibold">GSTIN</label>
                                                <input type="text" name="gstin" className="form-control" style={{ borderRadius: '8px', border: '1px solid #cbd5e1' }} value={orgData.gstin} onChange={handleOrgChange} placeholder="e.g. 27AAACA1234A1Z1" />
                                            </div>
                                            <div className="col-md-6">
                                                <label className="form-label text-secondary small fw-semibold">City</label>
                                                <input type="text" name="city" className="form-control" style={{ borderRadius: '8px', border: '1px solid #cbd5e1' }} value={orgData.city} onChange={handleOrgChange} />
                                            </div>
                                            <div className="col-md-6">
                                                <label className="form-label text-secondary small fw-semibold">State</label>
                                                <input type="text" name="state" className="form-control" style={{ borderRadius: '8px', border: '1px solid #cbd5e1' }} value={orgData.state} onChange={handleOrgChange} />
                                            </div>
                                            <div className="col-12">
                                                <label className="form-label text-secondary small fw-semibold">Office Address</label>
                                                <textarea name="address" rows="2" className="form-control" style={{ borderRadius: '8px', border: '1px solid #cbd5e1' }} value={orgData.address} onChange={handleOrgChange}></textarea>
                                            </div>
                                        </div>

                                        <button onClick={nextStep} className="btn btn-primary w-100 py-3 fw-bold mt-4" style={{ borderRadius: '8px', backgroundColor: '#4f46e5', border: 'none' }}>
                                            Continue to Owner Profile
                                        </button>
                                    </div>
                                ) : (
                                    <form onSubmit={handleSubmit}>
                                        <div className="row g-3">
                                            <div className="col-12">
                                                <label className="form-label text-secondary small fw-semibold">Owner Full Name *</label>
                                                <input type="text" name="name" className="form-control" style={{ borderRadius: '8px', border: '1px solid #cbd5e1' }} value={ownerData.name} onChange={handleOwnerChange} required />
                                            </div>
                                            <div className="col-12">
                                                <label className="form-label text-secondary small fw-semibold">Owner Email Address *</label>
                                                <input type="email" name="email" className="form-control" style={{ borderRadius: '8px', border: '1px solid #cbd5e1' }} value={ownerData.email} onChange={handleOwnerChange} required />
                                            </div>
                                            <div className="col-md-6">
                                                <label className="form-label text-secondary small fw-semibold">Password *</label>
                                                <input type="password" name="password" className="form-control" style={{ borderRadius: '8px', border: '1px solid #cbd5e1' }} value={ownerData.password} onChange={handleOwnerChange} required />
                                            </div>
                                            <div className="col-md-6">
                                                <label className="form-label text-secondary small fw-semibold">Confirm Password *</label>
                                                <input type="password" name="password_confirmation" className="form-control" style={{ borderRadius: '8px', border: '1px solid #cbd5e1' }} value={ownerData.password_confirmation} onChange={handleOwnerChange} required />
                                            </div>
                                        </div>

                                        <div className="d-flex gap-3 mt-4">
                                            <button type="button" onClick={prevStep} className="btn btn-outline-secondary py-3 fw-bold text-dark w-50" style={{ borderRadius: '8px' }}>
                                                Back
                                            </button>
                                            <button type="submit" className="btn btn-primary py-3 fw-bold w-50" style={{ borderRadius: '8px', backgroundColor: '#4f46e5', border: 'none' }} disabled={loading}>
                                                {loading ? <span className="spinner-border spinner-border-sm me-2"></span> : null}
                                                Register
                                            </button>
                                        </div>
                                    </form>
                                )}

                                <div className="text-center mt-4">
                                    <span className="text-secondary">Already have an account? </span>
                                    <button onClick={onNavigateToLogin} className="btn btn-link text-decoration-none p-0 fw-bold bg-transparent border-0" style={{ color: '#4f46e5' }}>
                                        Sign In
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
