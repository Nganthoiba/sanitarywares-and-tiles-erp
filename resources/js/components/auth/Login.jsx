import React, { useState } from 'react';
import { Link } from 'react-router-dom';

export default function Login({ onLoginSuccess, onNavigateToRegister, onNavigateToHome }) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

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
            localStorage.setItem('organization_name', data.user.organization?.name || 'Platform Administration');
            localStorage.setItem('user_roles', JSON.stringify(data.user.roles || []));
            localStorage.setItem('user_permissions', JSON.stringify(data.user.permissions || []));

            onLoginSuccess(data);
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
                        <div className="col-lg-6 d-none d-lg-flex flex-column justify-content-center align-items-center p-5 position-relative" style={{ background: 'linear-gradient(135deg, #4f46e5 0%, #3730a3 100%)', color: '#fff' }}>
                            <Link to="/" onClick={onNavigateToHome} className="position-absolute top-0 start-0 m-4 text-white text-decoration-none small opacity-75 hover-opacity-100 d-inline-flex align-items-center gap-2 z-2">
                                <i className="fa-solid fa-arrow-left"></i> Back to Home
                            </Link>
                            <div className="position-absolute top-0 start-0 w-100 h-100" style={{ background: 'radial-gradient(circle at top left, rgba(255,255,255,0.1), transparent 50%)' }}></div>
                            <svg xmlns="http://www.w3.org/2000/svg" width="90" height="90" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mb-4 shadow rounded-4 bg-white p-3 text-primary position-relative z-1"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
                            <h2 className="fw-bolder mb-3 text-center position-relative z-1" style={{ letterSpacing: '-0.5px' }}>Tiles & Sanitary Portal</h2>
                            <p className="lead text-center opacity-75 position-relative z-1 mb-0 px-4">The industry standard for Tiles & Sanitaryware operations.</p>
                        </div>

                        {/* Login Form Side */}
                        <div className="col-lg-6 d-flex align-items-center bg-white p-4 p-sm-5">
                            <div className="w-100" style={{ maxWidth: '400px', margin: '0 auto' }}>
                                <div className="mb-4">
                                    <Link to="/" onClick={onNavigateToHome} className="text-decoration-none text-secondary d-inline-flex align-items-center gap-2 small fw-semibold">
                                        <i className="fa-solid fa-arrow-left"></i> Back to Home
                                    </Link>
                                </div>

                                <div className="text-center mb-5 d-lg-none">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#4f46e5" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="mb-3"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
                                    <h3 className="fw-bolder text-primary">CeramaFlow</h3>
                                </div>

                                <h3 className="fw-bold mb-1">Welcome back</h3>
                                <p className="text-secondary mb-4">Please enter your details to sign in.</p>

                                {error && (
                                    <div className="alert alert-danger rounded-3 border-0 bg-danger-subtle text-danger py-2 mb-4 d-flex align-items-center justify-content-between">
                                        <div>{error}</div>
                                        <button type="button" className="btn-close ms-2 flex-shrink-0" onClick={() => setError('')} aria-label="Close"></button>
                                    </div>
                                )}

                                <form onSubmit={handleSubmit}>
                                    <div className="form-floating mb-3">
                                        <input
                                            type="email"
                                            className="form-control border-light-subtle"
                                            id="floatingEmail"
                                            placeholder="name@example.com"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            required
                                            style={{ borderRadius: '8px' }}
                                        />
                                        <label htmlFor="floatingEmail" className="text-secondary">Email address</label>
                                    </div>

                                    <div className="form-floating mb-4 position-relative">
                                        <input
                                            type={showPassword ? "text" : "password"}
                                            className="form-control border-light-subtle"
                                            id="floatingPassword"
                                            placeholder="Password"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            required
                                            style={{ borderRadius: '8px', paddingRight: '45px' }}
                                        />
                                        <label htmlFor="floatingPassword" className="text-secondary">Password</label>
                                        <button
                                            type="button"
                                            className="btn position-absolute end-0 top-50 translate-middle-y border-0 text-secondary me-2 shadow-none bg-transparent"
                                            onClick={() => setShowPassword(!showPassword)}
                                            style={{ zIndex: 5 }}
                                        >
                                            {showPassword ? <i className="fa-solid fa-eye-slash fs-5"></i> : <i className="fa-solid fa-eye fs-5"></i>}
                                        </button>
                                    </div>

                                    <button className="btn btn-primary w-100 py-3 fw-bold rounded-3 shadow-sm mb-3" style={{ backgroundColor: '#4f46e5', border: 'none' }} disabled={loading}>
                                        {loading ? (
                                            <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                        ) : null}
                                        Sign In
                                    </button>
                                </form>

                                <div className="text-center mb-0 mt-4">
                                    <span className="text-secondary">Need an organization account? </span>
                                    <button onClick={onNavigateToRegister} className="btn btn-link text-decoration-none p-0 fw-bold bg-transparent border-0" style={{ color: '#4f46e5' }}>
                                        Sign up
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
