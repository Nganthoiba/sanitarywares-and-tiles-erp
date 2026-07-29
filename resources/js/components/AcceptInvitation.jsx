import React, { useState, useEffect } from 'react';

export default function AcceptInvitation({ onNavigateToLogin }) {
    const [token, setToken] = useState('');
    const [password, setPassword] = useState('');
    const [passwordConfirmation, setPasswordConfirmation] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);

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
                throw new Error(data.message || 'Failed to accept invitation');
            }

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
                        <div className="alert alert-danger text-center py-2 border mb-3" style={{ backgroundColor: '#fef2f2', color: '#991b1b', borderColor: '#fca5a5', borderRadius: '8px', fontSize: '0.85rem' }}>
                            {error}
                        </div>
                    )}

                    {success ? (
                        <div className="text-center">
                            <div className="alert alert-success text-center py-3 border mb-4" style={{ backgroundColor: '#ecfdf5', color: '#065f46', borderColor: '#a7f3d0', borderRadius: '8px' }}>
                                Account activated successfully! You can now access your workspace.
                            </div>
                            <button onClick={onNavigateToLogin} className="btn btn-primary w-100 py-2.5 fw-bold" style={{ borderRadius: '8px', backgroundColor: '#4f46e5', border: 'none' }}>
                                Back to Login
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
