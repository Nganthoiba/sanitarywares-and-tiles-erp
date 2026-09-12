import React, { useState } from 'react';
import { Link } from 'react-router-dom';

export default function Login({ onLoginSuccess, onNavigateToRegister, onNavigateToHome }) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState(null);
    const [successMessage, setSuccessMessage] = useState(null);
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    // Forgot Password Modal State
    const [showForgotModal, setShowForgotModal] = useState(false);
    const [forgotStep, setForgotStep] = useState(1); // 1: Request Code, 2: Reset Password
    const [forgotEmail, setForgotEmail] = useState('');
    const [forgotToken, setForgotToken] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [newPasswordConfirm, setNewPasswordConfirm] = useState('');
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [forgotLoading, setForgotLoading] = useState(false);
    const [forgotError, setForgotError] = useState(null);
    const [forgotSuccess, setForgotSuccess] = useState(null);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setSuccessMessage(null);
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

    const handleOpenForgotModal = () => {
        setForgotEmail(email); // Pre-fill with login email if present
        setForgotToken('');
        setNewPassword('');
        setNewPasswordConfirm('');
        setForgotError(null);
        setForgotSuccess(null);
        setForgotStep(1);
        setShowForgotModal(true);
    };

    const handleRequestResetCode = async (e) => {
        e.preventDefault();
        setForgotError(null);
        setForgotSuccess(null);
        setForgotLoading(true);

        try {
            const response = await fetch('/api/forgot-password', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                },
                body: JSON.stringify({ email: forgotEmail }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Failed to send reset code.');
            }

            setForgotSuccess(data.message);
            setForgotToken(''); // User must type reset code received via email
            setForgotStep(2);
        } catch (err) {
            setForgotError(err.message);
        } finally {
            setForgotLoading(false);
        }
    };

    const handleResetPassword = async (e) => {
        e.preventDefault();
        setForgotError(null);
        setForgotSuccess(null);

        if (newPassword !== newPasswordConfirm) {
            setForgotError('New password and confirmation password do not match.');
            return;
        }

        setForgotLoading(true);

        try {
            const response = await fetch('/api/reset-password', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                },
                body: JSON.stringify({
                    email: forgotEmail,
                    token: forgotToken,
                    password: newPassword,
                    password_confirmation: newPasswordConfirm,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Failed to reset password.');
            }

            setShowForgotModal(false);
            setSuccessMessage(data.message || 'Password has been reset successfully. You can now log in.');
            setEmail(forgotEmail);
            setPassword('');
        } catch (err) {
            setForgotError(err.message);
        } finally {
            setForgotLoading(false);
        }
    };

    return (
        <div className="min-vh-100 d-flex align-items-center justify-content-center bg-light font-sans py-5">
            <div className="container">
                <div className="card border-0 shadow-lg overflow-hidden" style={{ borderRadius: '1.5rem', maxWidth: '1000px', margin: '0 auto' }}>
                    <div className="row g-0">
                        {/* Branding Side */}
                        <div className="col-lg-6 d-none d-lg-flex flex-column justify-content-center align-items-center p-5 position-relative" style={{ background: 'linear-gradient(135deg, #4f46e5 0%, #3730a3 100%)', color: '#fff' }}>
                            <div className="position-absolute top-0 start-0 w-100 h-100" style={{ background: 'radial-gradient(circle at top left, rgba(255,255,255,0.1), transparent 50%)' }}></div>
                            <svg xmlns="http://www.w3.org/2000/svg" width="90" height="90" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mb-4 shadow rounded-4 bg-white p-3 text-primary position-relative z-1"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
                            <h2 className="fw-bolder mb-3 text-center position-relative z-1" style={{ letterSpacing: '-0.5px' }}>Tiles & Sanitary Portal</h2>
                            <p className="lead text-center opacity-75 position-relative z-1 mb-0 px-4">The industry standard for Tiles & Sanitaryware operations.</p>
                        </div>

                        {/* Login Form Side */}
                        <div className="col-lg-6 d-flex align-items-center bg-white p-4 p-sm-5">
                            <div className="w-100" style={{ maxWidth: '400px', margin: '0 auto' }}>
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

                                <div className="text-center mb-5 d-lg-none">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#4f46e5" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="mb-3"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
                                    <h3 className="fw-bolder text-primary">CeramaFlow</h3>
                                </div>

                                <h3 className="fw-bold mb-1">Welcome back</h3>
                                <p className="text-secondary mb-4">Please enter your details to sign in.</p>

                                {successMessage && (
                                    <div className="alert alert-success rounded-3 border-0 bg-success-subtle text-success py-2 mb-4 d-flex align-items-center justify-content-between">
                                        <div><i className="fa-solid fa-circle-check me-2"></i>{successMessage}</div>
                                        <button type="button" className="btn-close ms-2 flex-shrink-0" onClick={() => setSuccessMessage(null)} aria-label="Close"></button>
                                    </div>
                                )}

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

                                    <div className="form-floating mb-2 position-relative">
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

                                    <div className="text-end mb-4">
                                        <button
                                            type="button"
                                            onClick={handleOpenForgotModal}
                                            className="btn btn-link p-0 text-decoration-none small fw-semibold border-0 bg-transparent"
                                            style={{ color: '#4f46e5', fontSize: '0.875rem' }}
                                        >
                                            Forgot Password?
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

            {/* Forgot Password Modal */}
            {showForgotModal && (
                <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }} tabIndex="-1">
                    <div className="modal-dialog modal-dialog-centered">
                        <div className="modal-content border-0 shadow-lg" style={{ borderRadius: '1.25rem' }}>
                            <div className="modal-header border-0 pb-0 px-4 pt-4 d-flex justify-content-between align-items-center">
                                <div>
                                    <h5 className="modal-title fw-bold text-dark mb-1">
                                        {forgotStep === 1 ? 'Forgot Password' : 'Reset Your Password'}
                                    </h5>
                                    <p className="text-muted small mb-0">
                                        {forgotStep === 1 
                                            ? 'Enter your email address to receive password reset instructions.' 
                                            : 'Enter the reset code sent to your email along with your new password.'}
                                    </p>
                                </div>
                                <button type="button" className="btn-close" onClick={() => setShowForgotModal(false)} aria-label="Close"></button>
                            </div>

                            <div className="modal-body px-4 py-3">
                                {forgotSuccess && (
                                    <div className="alert alert-success rounded-3 border-0 bg-success-subtle text-success py-2 mb-3 d-flex align-items-center justify-content-between">
                                        <div><i className="fa-solid fa-circle-check me-2"></i>{forgotSuccess}</div>
                                        <button type="button" className="btn-close ms-2 flex-shrink-0" onClick={() => setForgotSuccess(null)} aria-label="Close"></button>
                                    </div>
                                )}

                                {forgotError && (
                                    <div className="alert alert-danger rounded-3 border-0 bg-danger-subtle text-danger py-2 mb-3 d-flex align-items-center justify-content-between">
                                        <div><i className="fa-solid fa-circle-exclamation me-2"></i>{forgotError}</div>
                                        <button type="button" className="btn-close ms-2 flex-shrink-0" onClick={() => setForgotError(null)} aria-label="Close"></button>
                                    </div>
                                )}

                                {forgotStep === 1 ? (
                                    <form onSubmit={handleRequestResetCode}>
                                        <div className="form-floating mb-3">
                                            <input
                                                type="email"
                                                className="form-control border-light-subtle"
                                                id="forgotEmailInput"
                                                placeholder="name@example.com"
                                                value={forgotEmail}
                                                onChange={(e) => setForgotEmail(e.target.value)}
                                                required
                                                style={{ borderRadius: '8px' }}
                                            />
                                            <label htmlFor="forgotEmailInput" className="text-secondary">Registered Email Address</label>
                                        </div>

                                        <div className="d-flex justify-content-end gap-2 mt-4">
                                            <button 
                                                type="button" 
                                                className="btn btn-light px-4 fw-semibold rounded-3" 
                                                onClick={() => setShowForgotModal(false)}
                                            >
                                                Cancel
                                            </button>
                                            <button 
                                                type="submit" 
                                                className="btn btn-primary px-4 fw-bold rounded-3" 
                                                style={{ backgroundColor: '#4f46e5', border: 'none' }}
                                                disabled={forgotLoading}
                                            >
                                                {forgotLoading && <span className="spinner-border spinner-border-sm me-2" role="status"></span>}
                                                Send Reset Code
                                            </button>
                                        </div>
                                    </form>
                                ) : (
                                    <form onSubmit={handleResetPassword}>
                                        <div className="form-floating mb-3">
                                            <input
                                                type="email"
                                                className="form-control border-light-subtle"
                                                id="forgotEmailConfirmInput"
                                                value={forgotEmail}
                                                onChange={(e) => setForgotEmail(e.target.value)}
                                                required
                                                style={{ borderRadius: '8px' }}
                                            />
                                            <label htmlFor="forgotEmailConfirmInput" className="text-secondary">Email Address</label>
                                        </div>

                                        <div className="form-floating mb-3">
                                            <input
                                                type="text"
                                                className="form-control border-light-subtle"
                                                id="forgotTokenInput"
                                                placeholder="6-digit code"
                                                value={forgotToken}
                                                onChange={(e) => setForgotToken(e.target.value)}
                                                required
                                                style={{ borderRadius: '8px' }}
                                            />
                                            <label htmlFor="forgotTokenInput" className="text-secondary">Reset Code / Token</label>
                                        </div>

                                        <div className="form-floating mb-3 position-relative">
                                            <input
                                                type={showNewPassword ? "text" : "password"}
                                                className="form-control border-light-subtle"
                                                id="newPasswordInput"
                                                placeholder="New Password"
                                                value={newPassword}
                                                onChange={(e) => setNewPassword(e.target.value)}
                                                required
                                                minLength={8}
                                                style={{ borderRadius: '8px', paddingRight: '45px' }}
                                            />
                                            <label htmlFor="newPasswordInput" className="text-secondary">New Password</label>
                                            <button
                                                type="button"
                                                className="btn position-absolute end-0 top-50 translate-middle-y border-0 text-secondary me-2 shadow-none bg-transparent"
                                                onClick={() => setShowNewPassword(!showNewPassword)}
                                                style={{ zIndex: 5 }}
                                            >
                                                {showNewPassword ? <i className="fa-solid fa-eye-slash fs-5"></i> : <i className="fa-solid fa-eye fs-5"></i>}
                                            </button>
                                        </div>

                                        <div className="form-floating mb-3">
                                            <input
                                                type={showNewPassword ? "text" : "password"}
                                                className="form-control border-light-subtle"
                                                id="newPasswordConfirmInput"
                                                placeholder="Confirm New Password"
                                                value={newPasswordConfirm}
                                                onChange={(e) => setNewPasswordConfirm(e.target.value)}
                                                required
                                                minLength={8}
                                                style={{ borderRadius: '8px' }}
                                            />
                                            <label htmlFor="newPasswordConfirmInput" className="text-secondary">Confirm New Password</label>
                                        </div>

                                        <div className="d-flex justify-content-between align-items-center mt-4">
                                            <button 
                                                type="button" 
                                                className="btn btn-link text-decoration-none p-0 text-secondary small fw-semibold border-0 bg-transparent" 
                                                onClick={() => setForgotStep(1)}
                                            >
                                                <i className="fa-solid fa-arrow-left me-1"></i> Back to Step 1
                                            </button>
                                            <div className="d-flex gap-2">
                                                <button 
                                                    type="button" 
                                                    className="btn btn-light px-3 fw-semibold rounded-3" 
                                                    onClick={() => setShowForgotModal(false)}
                                                >
                                                    Cancel
                                                </button>
                                                <button 
                                                    type="submit" 
                                                    className="btn btn-primary px-4 fw-bold rounded-3" 
                                                    style={{ backgroundColor: '#4f46e5', border: 'none' }}
                                                    disabled={forgotLoading}
                                                >
                                                    {forgotLoading && <span className="spinner-border spinner-border-sm me-2" role="status"></span>}
                                                    Reset Password
                                                </button>
                                            </div>
                                        </div>
                                    </form>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
