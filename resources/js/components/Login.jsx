import React, { useState } from 'react';

export default function Login({ onLoginSuccess, onNavigateToRegister }) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setLoading(true);

        try {
            const response = await fetch('/api/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                },
                body: JSON.stringify({ email, password }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Login failed');
            }

            // Save token and user details to localStorage
            localStorage.setItem('auth_token', data.access_token);
            localStorage.setItem('user_name', data.user.name);
            localStorage.setItem('user_email', data.user.email);
            localStorage.setItem('organization_name', data.user.organization.name);
            localStorage.setItem('user_permissions', JSON.stringify(data.user.permissions));

            onLoginSuccess(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="d-flex align-items-center justify-content-center" style={{ minHeight: '100vh', backgroundColor: '#f8fafc' }}>
            <div className="card shadow-sm border" style={{ width: '420px', borderRadius: '12px', backgroundColor: '#ffffff', borderColor: '#e2e8f0' }}>
                <div className="card-body p-5 text-dark">
                    <div className="text-center mb-4">
                        <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#4f46e5" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="mb-3"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
                        <h3 className="fw-bold tracking-tight text-dark mb-1">Welcome back</h3>
                        <p className="text-muted small">Sign in to your organization account</p>
                    </div>

                    {error && (
                        <div className="alert alert-danger text-center py-2 border" style={{ backgroundColor: '#fef2f2', color: '#991b1b', borderColor: '#fca5a5', borderRadius: '8px', fontSize: '0.85rem' }}>
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit}>
                        <div className="mb-3">
                            <label className="form-label text-secondary small fw-semibold">Email address</label>
                            <input
                                type="email"
                                className="form-control py-2"
                                style={{ borderRadius: '8px', border: '1px solid #cbd5e1', backgroundColor: '#ffffff', color: '#1e293b' }}
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="name@company.com"
                                required
                            />
                        </div>

                        <div className="mb-4">
                            <label className="form-label text-secondary small fw-semibold">Password</label>
                            <input
                                type="password"
                                className="form-control py-2"
                                style={{ borderRadius: '8px', border: '1px solid #cbd5e1', backgroundColor: '#ffffff', color: '#1e293b' }}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••"
                                required
                            />
                        </div>

                        <button
                            type="submit"
                            className="btn btn-primary w-100 py-2.5 fw-bold mb-3 d-flex align-items-center justify-content-center"
                            style={{ borderRadius: '8px', backgroundColor: '#4f46e5', border: 'none' }}
                            disabled={loading}
                        >
                            {loading ? (
                                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                            ) : null}
                            Sign In
                        </button>
                    </form>

                    <div className="text-center mt-4">
                        <span className="text-muted small">Need an organization account? </span>
                        <button
                            onClick={onNavigateToRegister}
                            className="btn btn-link text-decoration-none p-0 small fw-bold"
                            style={{ color: '#4f46e5' }}
                        >
                            Register Business
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
