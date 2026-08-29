import React, { useState, useEffect } from 'react';

export default function AcceptInvitation({ onNavigateToLogin }) {
    const [token, setToken] = useState('');
    const [password, setPassword] = useState('');
    const [passwordConfirmation, setPasswordConfirmation] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);
    const [serverMessage, setServerMessage] = useState('');

    useEffect(() => {
        // Parse token from query parameter
        const params = new URLSearchParams(window.location.search);
        const t = params.get('token');
        if (t) {
            setToken(t);
        } else {
            setError('Invitation token is missing in the URL.');
        }
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setSuccess(false);

        if (password !== passwordConfirmation) {
            setError('Passwords do not match.');
            return;
        }

        setLoading(true);

        try {
            const response = await fetch('/api/accept-invitation', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                },
                body: JSON.stringify({
                    token: token,
                    password: password,
                    password_confirmation: passwordConfirmation,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                if (data.errors) {
                    const firstErr = Object.values(data.errors).flat()[0];
                    throw new Error(firstErr || data.message || 'Failed to accept invitation');
                }
                throw new Error(data.message || 'Failed to accept invitation');
            }

            setServerMessage(data.message || 'Invitation accepted. You can now login to the ERP.');
            setSuccess(true);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="d-flex align-items-center justify-content-center" style={{ minHeight: '100vh', backgroundColor: '#f8fafc' }}>
            <div className="card shadow-sm border" style={{ width: '450px', borderRadius: '12px', backgroundColor: '#ffffff', borderColor: '#e2e8f0' }}>
                <div className="card-body p-5 text-dark">
                    <div className="text-center mb-4">
                        <h3 className="fw-bold text-dark mb-1">Accept Invitation</h3>
                        <p className="text-muted small">Complete your account activation</p>
                    </div>

                    {error && (
                        <div className="alert alert-danger text-center py-2 border mb-3 d-flex align-items-center justify-content-between" style={{ backgroundColor: '#fef2f2', color: '#991b1b', borderColor: '#fca5a5', borderRadius: '8px', fontSize: '0.85rem' }}>
                            <div>{error}</div>
                            <button type="button" className="btn-close ms-2 flex-shrink-0" onClick={() => setError('')} aria-label="Close"></button>
                        </div>
                    )}

                    {success ? (
                        <div className="text-center py-2">
                            <div className="mb-3 text-success">
                                <i className="fa-solid fa-circle-check" style={{ fontSize: '3rem' }}></i>
                            </div>
                            <h5 className="fw-bold text-dark mb-2">Account Activated Successfully!</h5>
                            <div className="alert alert-success text-center py-2.5 border mb-4 d-flex align-items-center justify-content-between" style={{ backgroundColor: '#ecfdf5', color: '#065f46', borderColor: '#a7f3d0', borderRadius: '8px', fontSize: '0.88rem' }}>
                                <div>{serverMessage || 'Invitation accepted. You can now login to the ERP.'}</div>
                                <button type="button" className="btn-close ms-2 flex-shrink-0" onClick={(e) => { e.currentTarget.closest('.alert').style.display = 'none'; }} aria-label="Close"></button>
                            </div>
                            <button 
                                onClick={onNavigateToLogin} 
                                className="btn btn-primary w-100 py-2.5 fw-bold shadow-sm d-flex align-items-center justify-content-center gap-2" 
                                style={{ borderRadius: '8px', backgroundColor: '#4f46e5', border: 'none' }}
                            >
                                <i className="fa-solid fa-right-to-bracket"></i> Proceed to Login
                            </button>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit}>
                            <div className="mb-3">
                                <label className="form-label text-secondary small fw-semibold">Choose Password</label>
                                <input
                                    type="password"
                                    className="form-control py-2"
                                    style={{ borderRadius: '8px', border: '1px solid #cbd5e1', backgroundColor: '#ffffff', color: '#1e293b' }}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    required
                                    disabled={!token}
                                />
                            </div>

                            <div className="mb-4">
                                <label className="form-label text-secondary small fw-semibold">Confirm Password</label>
                                <input
                                    type="password"
                                    className="form-control py-2"
                                    style={{ borderRadius: '8px', border: '1px solid #cbd5e1', backgroundColor: '#ffffff', color: '#1e293b' }}
                                    value={passwordConfirmation}
                                    onChange={(e) => setPasswordConfirmation(e.target.value)}
                                    placeholder="••••••••"
                                    required
                                    disabled={!token}
                                />
                            </div>

                            <button
                                type="submit"
                                className="btn btn-primary w-100 py-2.5 fw-bold d-flex align-items-center justify-content-center"
                                style={{ borderRadius: '8px', backgroundColor: '#4f46e5', border: 'none' }}
                                disabled={loading || !token}
                            >
                                {loading ? <span className="spinner-border spinner-border-sm me-2"></span> : null}
                                Activate Account
                            </button>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
}
