import './bootstrap';
import React, { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate, NavLink, useNavigate, useLocation, Outlet } from 'react-router-dom';
import SlabInventoryView from './components/inventory/SlabInventoryView';
import InventoryManager from './components/inventory/InventoryManager';
import HomePage from './components/home/HomePage';
import LedgerReports from './components/accounting/LedgerReports';
import ReportingHub from './components/reporting/ReportingHub';
import Login from './components/auth/Login';
import RegisterOrganization from './components/auth/RegisterOrganization';
import AcceptInvitation from './components/auth/AcceptInvitation';
import UserManagement from './components/auth/UserManagement';
import RoleManagement from './components/auth/RoleManagement';
import ProductEntry from './components/product/ProductEntry';
import ProductPricingPackagingManager from './components/product/ProductPricingPackagingManager';
import GRNList from './components/grn/GRNList';
import CategoryManager from './components/product/CategoryManager';
import BrandManager from './components/product/BrandManager';
import ManufacturerManager from './components/product/ManufacturerManager';
import WarehouseManager from './components/inventory/WarehouseManager';
import BranchManager from './components/inventory/BranchManager';
import SupplierManager from './components/grn/SupplierManager';
import StorageLocationManager from './components/inventory/StorageLocationManager';
import LandingPage from './components/auth/LandingPage';
import PurchaseOrderList from './components/purchase/PurchaseOrderList';
import MenuManagement from './components/platform/MenuManagement';
import OrganizationManagement from './components/platform/OrganizationManagement';
import PermissionManagement from './components/platform/PermissionManagement';
import ImageCropperModal from './components/common/ImageCropperModal';
import NavigationLayout from './components/layouts/NavigationLayout';
import SalesManager from './components/sales/SalesManager';

import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.bundle.min.js';

function ProtectedRoute({ user }) {
    if (!user) {
        return <Navigate to="/login" replace />;
    }
    return <Outlet />;
}

function GuestRoute({ user }) {
    if (user) {
        return <Navigate to="/home" replace />;
    }
    return <Outlet />;
}

function App() {
    const navigate = useNavigate();

    // Check stored session credentials synchronously on initialization to avoid flash of guest layout
    const [user, setUser] = useState(() => {
        const token = localStorage.getItem('auth_token');
        if (token) {
            try {
                return {
                    name: localStorage.getItem('user_name'),
                    email: localStorage.getItem('user_email'),
                    profile_photo_url: localStorage.getItem('user_profile_photo_url') || null,
                    organizationName: localStorage.getItem('organization_name'),
                    default_role_id: localStorage.getItem('default_role_id') ? parseInt(localStorage.getItem('default_role_id')) : null,
                    activeRole: JSON.parse(localStorage.getItem('user_active_role') || 'null'),
                    roles: JSON.parse(localStorage.getItem('user_roles') || '[]'),
                    permissions: JSON.parse(localStorage.getItem('user_permissions') || '[]')
                };
            } catch (e) {
                console.error("Failed to parse user permissions:", e);
                return null;
            }
        }
        return null;
    });

    // Font size state
    const [fontSize, setFontSize] = useState(() => {
        const stored = localStorage.getItem('app_font_size');
        if (stored) return parseFloat(stored);
        if (typeof window !== 'undefined') {
            if (window.innerWidth >= 1920 && window.innerHeight >= 1080) {
                return 14.5;
            }
            if (window.innerWidth <= 1440 || window.innerHeight <= 900) {
                return 11;
            }
        }
        return 13.5;
    });

    // Theme state
    const [theme, setTheme] = useState(() => {
        return localStorage.getItem('app_theme') || 'light';
    });

    useEffect(() => {
        document.documentElement.style.setProperty('--app-font-size', `${fontSize}px`);
        localStorage.setItem('app_font_size', fontSize.toString());
    }, [fontSize]);

    const fetchCurrentUser = () => {
        const token = localStorage.getItem('auth_token');
        if (token) {
            fetch('/api/user', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json',
                    'Cache-Control': 'no-cache'
                }
            })
            .then(async (res) => {
                const data = await res.json().catch(() => null);
                if (res.status === 401 || (data && data.message === 'Unauthenticated.')) {
                    localStorage.clear();
                    setUser(null);
                    navigate('/login');
                    return null;
                }
                return res.ok ? data : null;
            })
            .then(userData => {
                if (userData) {
                    const orgName = userData.organization?.name || 'Platform Administration';
                    const permissions = userData.permissions || [];
                    const roles = userData.roles || [];
                    const activeRole = userData.active_role || (roles.length > 0 ? roles[0] : null);

                    setUser({
                        name: userData.name,
                        email: userData.email,
                        profile_photo_url: userData.profile_photo_url || null,
                        organizationName: orgName,
                        default_role_id: userData.default_role_id,
                        activeRole: activeRole,
                        roles: roles,
                        permissions: permissions
                    });

                    localStorage.setItem('user_name', userData.name);
                    localStorage.setItem('user_email', userData.email);
                    localStorage.setItem('organization_name', orgName);
                    if (userData.profile_photo_url) {
                        localStorage.setItem('user_profile_photo_url', userData.profile_photo_url);
                    } else {
                        localStorage.removeItem('user_profile_photo_url');
                    }
                    if (userData.default_role_id) localStorage.setItem('default_role_id', userData.default_role_id.toString());
                    if (activeRole) localStorage.setItem('user_active_role', JSON.stringify(activeRole));
                    localStorage.setItem('user_roles', JSON.stringify(roles));
                    localStorage.setItem('user_permissions', JSON.stringify(permissions));
                }
            })
            .catch(() => {});
        }
    };


    // Refresh user context on mount (web page refresh) and when role permissions are updated
    useEffect(() => {
        fetchCurrentUser();

        const handleUserUpdate = () => {
            fetchCurrentUser();
        };

        window.addEventListener('role-permissions-updated', handleUserUpdate);
        return () => {
            window.removeEventListener('role-permissions-updated', handleUserUpdate);
        };
    }, []);

    useEffect(() => {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('app_theme', theme);
    }, [theme]);

    const toggleTheme = () => {
        setTheme(prev => prev === 'light' ? 'dark' : 'light');
    };

    // Settings modal states
    const [showSettingsModal, setShowSettingsModal] = useState(false);
    const [profileName, setProfileName] = useState('');
    const [profileEmail, setProfileEmail] = useState('');
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [settingsSuccess, setSettingsSuccess] = useState('');
    const [settingsError, setSettingsError] = useState('');
    const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
    const [showLogoutModal, setShowLogoutModal] = useState(false);
    const [isLoggingOut, setIsLoggingOut] = useState(false);

    // Profile photo upload & cropper states
    const [croppedPhoto, setCroppedPhoto] = useState(null);
    const [rawImageSrc, setRawImageSrc] = useState(null);
    const [showCropper, setShowCropper] = useState(false);
    const [removePhoto, setRemovePhoto] = useState(false);
    const fileInputRef = useRef(null);

    const handleFileSelect = (e) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > 10 * 1024 * 1024) {
                setSettingsError('Selected image file size exceeds 10MB limit.');
                return;
            }
            const reader = new FileReader();
            reader.onload = () => {
                setRawImageSrc(reader.result);
                setShowCropper(true);
            };
            reader.readAsDataURL(file);
        }
        e.target.value = '';
    };

    const handleCropComplete = (croppedDataUrl) => {
        setCroppedPhoto(croppedDataUrl);
        setRemovePhoto(false);
        setShowCropper(false);
        setRawImageSrc(null);
    };

    const handleRemovePhoto = () => {
        setCroppedPhoto(null);
        setRemovePhoto(true);
    };

    let previewPhotoUrl = null;
    if (!removePhoto) {
        previewPhotoUrl = croppedPhoto || user?.profile_photo_url || null;
    }

    useEffect(() => {
        if (showSettingsModal && user) {
            setProfileName(user.name || '');
            setProfileEmail(user.email || '');
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
            setShowCurrentPassword(false);
            setShowNewPassword(false);
            setShowConfirmPassword(false);
            setSettingsSuccess('');
            setSettingsError('');
            setCroppedPhoto(null);
            setRemovePhoto(false);
            setRawImageSrc(null);
            setShowCropper(false);
        }
    }, [showSettingsModal]);

    const handleUpdateProfile = async (e) => {
        e.preventDefault();
        setSettingsError('');
        setSettingsSuccess('');

        if (newPassword || confirmPassword) {
            if (!currentPassword) {
                setSettingsError('Please enter your current password to change password.');
                return;
            }
            if (newPassword !== confirmPassword) {
                setSettingsError('New password and confirm password do not match.');
                return;
            }
            if (newPassword.length < 8) {
                setSettingsError('New password must be at least 8 characters long.');
                return;
            }
        }

        setIsUpdatingProfile(true);

        try {
            const bodyPayload = {
                name: profileName,
                email: profileEmail,
                current_password: currentPassword || undefined,
                new_password: newPassword || undefined,
                new_password_confirmation: confirmPassword || undefined
            };

            if (croppedPhoto) {
                bodyPayload.profile_photo = croppedPhoto;
            } else if (removePhoto) {
                bodyPayload.remove_photo = true;
            }

            const response = await fetch('/api/profile', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
                },
                body: JSON.stringify(bodyPayload)
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Failed to update profile.');
            }

            // Profile updated successfully
            // Update React state
            setUser(prev => ({
                ...prev,
                ...data.user
            }));

            // Update localStorage
            localStorage.setItem('user_name', data.user.name);
            localStorage.setItem('user_email', data.user.email);
            if (data.user.profile_photo_url) {
                localStorage.setItem('user_profile_photo_url', data.user.profile_photo_url);
            } else {
                localStorage.removeItem('user_profile_photo_url');
            }

            setCroppedPhoto(null);
            setRemovePhoto(false);

            setSettingsSuccess(data.message || 'Profile updated successfully!');
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
            setShowCurrentPassword(false);
            setShowNewPassword(false);
            setShowConfirmPassword(false);
        } catch (err) {
            setSettingsError(err.message);
        } finally {
            setIsUpdatingProfile(false);
        }
    };

    const handleSwitchRole = async (roleId) => {
        try {
            const response = await fetch('/api/switch-role', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
                },
                body: JSON.stringify({ role_id: roleId })
            });

            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.message || 'Failed to switch role.');
            }

            setUser(prev => ({
                ...prev,
                default_role_id: data.user.default_role_id,
                activeRole: data.user.active_role,
                roles: data.user.roles,
                permissions: data.user.permissions
            }));

            if (data.user.default_role_id) localStorage.setItem('default_role_id', data.user.default_role_id.toString());
            if (data.user.active_role) localStorage.setItem('user_active_role', JSON.stringify(data.user.active_role));
            localStorage.setItem('user_roles', JSON.stringify(data.user.roles));
            localStorage.setItem('user_permissions', JSON.stringify(data.user.permissions));
        } catch (err) {
            console.error("Error switching role:", err);
        }
    };

    const handleLoginSuccess = (data) => {
        const orgName = data.organization?.name || data.user?.organization?.name || 'Platform Administration';
        const permissions = data.user_permissions || data.user?.permissions || [];
        const roles = data.user?.roles || data.user_roles || (permissions.includes('master.users.manage') ? [{ id: 1, name: 'Administrator', slug: 'administrator' }] : []);
        const activeRole = data.user?.active_role || (roles.length > 0 ? (typeof roles[0] === 'object' ? roles[0] : { id: 1, name: roles[0] }) : null);

        setUser({
            name: data.user.name,
            email: data.user.email,
            organizationName: orgName,
            default_role_id: data.user.default_role_id,
            activeRole: activeRole,
            roles: roles,
            permissions: permissions
        });
        localStorage.setItem('auth_token', data.access_token);
        localStorage.setItem('user_name', data.user.name);
        localStorage.setItem('user_email', data.user.email);
        localStorage.setItem('organization_name', orgName);
        if (data.user.default_role_id) localStorage.setItem('default_role_id', data.user.default_role_id.toString());
        if (activeRole) localStorage.setItem('user_active_role', JSON.stringify(activeRole));
        localStorage.setItem('user_roles', JSON.stringify(roles));
        localStorage.setItem('user_permissions', JSON.stringify(permissions));
        navigate('/home');
    };

    const handleLogout = () => {
        setIsLoggingOut(true);
        localStorage.clear();
        setUser(null);
        setShowLogoutModal(false);
        setIsLoggingOut(false);
        navigate('/login');
    };

    const hasPermission = (perm) => {
        return user?.permissions?.includes(perm); // || user?.permissions?.includes('administrator');
    };

    return (
        <>
            <Routes>
                {/* Guest-only routes */}
                <Route element={<GuestRoute user={user} />}>
                    <Route path="/" element={<LandingPage onNavigateToLogin={() => navigate('/login')} onNavigateToRegister={() => navigate('/register')} />} />
                    <Route path="/login" element={<Login onLoginSuccess={handleLoginSuccess} onNavigateToRegister={() => navigate('/register')} onNavigateToHome={() => navigate('/')} />} />
                    <Route path="/register" element={<RegisterOrganization onRegistrationSuccess={handleLoginSuccess} onNavigateToLogin={() => navigate('/login')} onNavigateToHome={() => navigate('/')} />} />
                    <Route path="/accept-invitation" element={<AcceptInvitation onNavigateToLogin={() => navigate('/login')} />} />
                </Route>

                {/* Protected routes */}
                <Route element={<ProtectedRoute user={user} />}>
                    <Route element={
                        <NavigationLayout 
                            user={user} 
                            handleLogout={handleLogout} 
                            hasPermission={hasPermission} 
                            fontSize={fontSize} 
                            setFontSize={setFontSize} 
                            theme={theme} 
                            toggleTheme={toggleTheme} 
                            setShowSettingsModal={setShowSettingsModal} 
                            setShowLogoutModal={setShowLogoutModal}
                            handleSwitchRole={handleSwitchRole}
                        />
                    }>
                        <Route path="/home" element={<HomePage />} />
                        <Route path="/dashboard" element={<Navigate to="/home" replace />} />
                        <Route path="/inventory" element={<InventoryManager />} />
                        
                        <Route path="/grn" element={
                            <GRNList 
                                key="grn-list" 
                                initialViewMode="list" 
                                onViewModeChange={(mode) => {
                                    if (mode === 'create') navigate('/grn/new');
                                }} 
                            />
                        } />
                        <Route path="/grn/new" element={
                            <GRNList 
                                key="grn-new" 
                                initialViewMode="create" 
                                onViewModeChange={(mode) => {
                                    if (mode === 'list') navigate('/grn');
                                }} 
                            />
                        } />

                        <Route path="/purchase-orders/index" element={
                            <PurchaseOrderList 
                                key="po-list" 
                                initialViewMode="list" 
                                onViewModeChange={(mode) => {
                                    if (mode === 'create') navigate('/purchase-orders/new');
                                }} 
                                userPermissions={user?.permissions || []}
                            />
                        } />
                        <Route path="/purchase-orders/new" element={
                            <PurchaseOrderList 
                                key="po-new" 
                                initialViewMode="create" 
                                onViewModeChange={(mode) => {
                                    if (mode === 'list') navigate('/purchase-orders/index');
                                }} 
                                userPermissions={user?.permissions || []}
                            />
                        } />

                        <Route path="/branches" element={<BranchManager />} />
                        <Route path="/warehouses" element={<WarehouseManager />} />
                        <Route path="/storage-locations" element={<StorageLocationManager />} />
                        <Route path="/suppliers" element={<SupplierManager />} />

                        <Route path="/products/catalog" element={<ProductEntry key="products" initialSubTab="list" />} />
                        <Route path="/products/categories" element={<CategoryManager />} />
                        <Route path="/products/pricing-packaging" element={<ProductPricingPackagingManager />} />
                        <Route path="/products/brands" element={<BrandManager />} />
                        <Route path="/products/manufacturers" element={<ManufacturerManager />} />

                        <Route path="/bookkeeping" element={<LedgerReports />} />
                        <Route path="/reporting" element={<ReportingHub />} />

                        {/* Sales & Billing Routes */}
                        <Route path="/sales" element={<SalesManager key="sales-list" initialTab="invoices" />} />
                        <Route path="/sales/new" element={<SalesManager key="sales-new" initialTab="new-sale" />} />
                        <Route path="/customers" element={<SalesManager key="sales-cust" initialTab="invoices" />} />
                            
                        <Route path="/platform/menus" element={
                            hasPermission('platform.menus.manage') ? (
                                <MenuManagement />
                            ) : (
                                <Navigate to="/home" replace />
                            )
                        } />

                        <Route path="/platform/organizations" element={
                            hasPermission('platform.organizations.manage') ? (
                                <OrganizationManagement />
                            ) : (
                                <Navigate to="/home" replace />
                            )
                        } />

                        <Route path="/platform/permissions" element={
                            hasPermission('platform.permissions.manage') ? (
                                <PermissionManagement />
                            ) : (
                                <Navigate to="/home" replace />
                            )
                        } />

                        <Route path="/users" element={
                            hasPermission('master.users.manage') ? (
                                <UserManagement />
                            ) : (
                                <Navigate to="/home" replace />
                            )
                        } />

                        <Route path="/roles" element={
                            hasPermission('master.users.manage') ? (
                                <RoleManagement />
                            ) : (
                                <Navigate to="/home" replace />
                            )
                        } />
                    </Route>
                </Route>

                {/* Catch-all fallback */}
                <Route path="*" element={<Navigate to={user ? "/home" : "/"} replace />} />
            </Routes>
            {/* Enhanced Logout Confirmation Modal */}
            {showLogoutModal && (
                <div 
                    className="modal fade show d-block" 
                    tabIndex="-1" 
                    style={{ backgroundColor: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(4px)', zIndex: 1055 }}
                    onClick={(e) => {
                        if (e.target === e.currentTarget) setShowLogoutModal(false);
                    }}
                >
                    <div className="modal-dialog modal-dialog-centered" style={{ maxWidth: '420px' }}>
                        <div className="modal-content border-0 shadow-lg overflow-hidden animate__animated animate__fadeInUp animate__faster" style={{ borderRadius: '20px' }}>
                            {/* Modal Header & Icon */}
                            <div className="p-4 text-center border-bottom bg-light bg-gradient position-relative">
                                <button 
                                    type="button" 
                                    className="btn-close position-absolute top-0 end-0 m-3 shadow-none" 
                                    onClick={() => setShowLogoutModal(false)} 
                                    aria-label="Close"
                                ></button>

                                <div 
                                    className="mx-auto rounded-circle d-flex align-items-center justify-content-center shadow-sm mb-3" 
                                    style={{ 
                                        width: '64px', 
                                        height: '64px', 
                                        background: 'linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)',
                                        color: '#dc2626'
                                    }}
                                >
                                    <i className="fa-solid fa-right-from-bracket fs-3"></i>
                                </div>

                                <h5 className="fw-bold text-dark mb-1 fs-5">Confirm Sign Out</h5>
                                <p className="text-muted small mb-0">Are you sure you want to log out of your session?</p>
                            </div>

                            {/* User Account Context Card */}
                            {user && (
                                <div className="px-4 pt-3.5 pb-1">
                                    <div className="p-3 rounded-3 bg-light border d-flex align-items-center gap-3">
                                        <div 
                                            className="rounded-circle bg-primary text-white d-flex align-items-center justify-content-center fw-bold shadow-sm flex-shrink-0"
                                            style={{ width: '42px', height: '42px', fontSize: '1rem' }}
                                        >
                                            {user.profile_photo_url ? (
                                                <img src={user.profile_photo_url} alt={user.name} className="w-100 h-100 rounded-circle object-fit-cover" />
                                            ) : (
                                                (user.name || 'U').charAt(0).toUpperCase()
                                            )}
                                        </div>
                                        <div className="overflow-hidden flex-grow-1">
                                            <div className="fw-semibold text-dark text-truncate small">{user.name || 'Current User'}</div>
                                            <div className="text-muted text-truncate" style={{ fontSize: '0.78rem' }}>{user.email}</div>
                                        </div>
                                        {user.active_role && (
                                            <span className="badge bg-secondary-subtle text-secondary-emphasis text-uppercase" style={{ fontSize: '0.68rem' }}>
                                                {user.active_role}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Action Buttons */}
                            <form onSubmit={(e) => {
                                e.preventDefault();
                                handleLogout();
                            }}>
                                <div className="modal-footer border-top-0 p-4 pt-3 d-flex gap-2">
                                    <button 
                                        type="button" 
                                        className="btn btn-outline-secondary flex-fill py-2.5 rounded-3 fw-semibold" 
                                        onClick={() => setShowLogoutModal(false)}
                                        disabled={isLoggingOut}
                                    >
                                        Cancel
                                    </button>
                                    <button 
                                        type="submit" 
                                        className="btn btn-danger flex-fill py-2.5 rounded-3 fw-semibold shadow-sm d-flex align-items-center justify-content-center gap-2" 
                                        disabled={isLoggingOut}
                                    >
                                        {isLoggingOut ? (
                                            <>
                                                <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                                                Logging out...
                                            </>
                                        ) : (
                                            <>
                                                <i className="fa-solid fa-right-from-bracket"></i>
                                                Sign Out
                                            </>
                                        )}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* User Profile & Settings Modal */}
            {showSettingsModal && (
                <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(4px)', zIndex: 1050 }}>
                    <div className="modal-dialog modal-xl modal-dialog-centered">
                        <div className="modal-content shadow-lg border-0" style={{ borderRadius: '16px', overflow: 'hidden' }}>
                            {/* Modal Header */}
                            <div className="modal-header border-bottom bg-gradient p-4" style={{ background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)' }}>
                                <div className="d-flex align-items-center gap-3">
                                    {previewPhotoUrl ? (
                                        <img 
                                            src={previewPhotoUrl} 
                                            alt={user?.name} 
                                            className="rounded-circle object-fit-cover shadow-sm" 
                                            style={{ width: '48px', height: '48px', border: '2px solid rgba(255,255,255,0.2)' }} 
                                        />
                                    ) : (
                                        <div className="rounded-circle d-flex justify-content-center align-items-center font-monospace fw-bold shadow-sm" style={{ width: '48px', height: '48px', fontSize: '1.2rem', backgroundColor: 'var(--accent-color, #3b82f6)', color: '#ffffff', border: '2px solid rgba(255,255,255,0.2)' }}>
                                            {user?.name?.substring(0, 2).toUpperCase() || 'US'}
                                        </div>
                                    )}
                                    <div>
                                        <h5 className="modal-title fw-bold mb-0 text-gray" style={{ fontSize: '1.15rem' }}>Account Settings</h5>
                                        <div className="text-gray-50 small" style={{ fontSize: '0.8rem' }}>Manage your profile information, picture, and credentials</div>
                                    </div>
                                </div>
                                <button type="button" className="btn-close" onClick={() => setShowSettingsModal(false)} aria-label="Close"></button>
                            </div>

                            <form onSubmit={handleUpdateProfile}>
                                <div className="modal-body p-4 bg-light-subtle">
                                    {settingsSuccess && (
                                        <div className="alert alert-success d-flex align-items-center justify-content-between py-2.5 px-3 mb-4 shadow-sm border-0 rounded-3 animate__animated animate__fadeIn" role="alert">
                                            <div className="d-flex align-items-center">
                                                <i className="fa-solid fa-circle-check fs-5 me-2 text-success"></i>
                                                <div className="fw-medium">{settingsSuccess}</div>
                                            </div>
                                            <button type="button" className="btn-close ms-2 flex-shrink-0" onClick={() => setSettingsSuccess(null)} aria-label="Close"></button>
                                        </div>
                                    )}
                                    {settingsError && (
                                        <div className="alert alert-danger d-flex align-items-center justify-content-between py-2.5 px-3 mb-4 shadow-sm border-0 rounded-3 animate__animated animate__fadeIn" role="alert">
                                            <div className="d-flex align-items-center">
                                                <i className="fa-solid fa-circle-exclamation fs-5 me-2 text-danger"></i>
                                                <div className="fw-medium">{settingsError}</div>
                                            </div>
                                            <button type="button" className="btn-close ms-2 flex-shrink-0" onClick={() => setSettingsError(null)} aria-label="Close"></button>
                                        </div>
                                    )}

                                    <div className="row g-4">
                                        {/* Left Column: User Card & Profile Photo Upload */}
                                        <div className="col-md-4">
                                            <div className="card border-0 shadow-sm rounded-3 h-100 bg-white">
                                                <div className="card-body p-3.5 text-center">
                                                    <input 
                                                        type="file" 
                                                        ref={fileInputRef} 
                                                        accept="image/png, image/jpeg, image/webp" 
                                                        className="d-none" 
                                                        onChange={handleFileSelect} 
                                                    />

                                                    <div 
                                                        className="mx-auto rounded-circle d-flex justify-content-center align-items-center mb-3 font-monospace fw-bold shadow-sm position-relative avatar-hover-container" 
                                                        style={{ 
                                                            width: '84px', 
                                                            height: '84px', 
                                                            fontSize: '1.8rem', 
                                                            background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)', 
                                                            color: '#fff',
                                                            cursor: 'pointer'
                                                        }}
                                                        onClick={() => fileInputRef.current?.click()}
                                                        title="Click to change profile picture"
                                                    >
                                                        {previewPhotoUrl ? (
                                                            <img 
                                                                src={previewPhotoUrl} 
                                                                alt={user?.name} 
                                                                className="w-100 h-100 rounded-circle object-fit-cover" 
                                                            />
                                                        ) : (
                                                            user?.name?.substring(0, 2).toUpperCase() || 'US'
                                                        )}
                                                        <div className="avatar-hover-overlay rounded-circle d-flex align-items-center justify-content-center position-absolute top-0 start-0 w-100 h-100">
                                                            <i className="fa-solid fa-camera text-white fs-5"></i>
                                                        </div>
                                                    </div>

                                                    <div className="d-flex justify-content-center gap-1 mb-3">
                                                        <button 
                                                            type="button" 
                                                            className="btn btn-xs btn-outline-primary py-1 px-2.5 rounded-pill fw-medium" 
                                                            style={{ fontSize: '0.75rem' }}
                                                            onClick={() => fileInputRef.current?.click()}
                                                        >
                                                            <i className="fa-solid fa-cloud-arrow-up me-1"></i> Upload Photo
                                                        </button>
                                                        {previewPhotoUrl && (
                                                            <button 
                                                                type="button" 
                                                                className="btn btn-xs btn-outline-danger py-1 px-2 rounded-pill" 
                                                                style={{ fontSize: '0.75rem' }}
                                                                onClick={handleRemovePhoto}
                                                                title="Remove Photo"
                                                            >
                                                                <i className="fa-solid fa-trash me-1"></i> Remove
                                                            </button>
                                                        )}
                                                    </div>

                                                    <h6 className="fw-bold text-dark mb-1" style={{ fontSize: '0.95rem' }}>{user?.name}</h6>
                                                    <div className="text-muted small text-break mb-3" style={{ fontSize: '0.78rem' }}>{user?.email}</div>
                                                    
                                                    <div className="p-2.5 bg-light rounded-3 text-start mb-3" style={{ fontSize: '0.8rem' }}>
                                                        <div className="text-muted small uppercase font-monospace mb-1" style={{ fontSize: '0.68rem', letterSpacing: '0.5px' }}>Organization</div>
                                                        <div className="fw-bold text-dark">{user?.organizationName || 'N/A'}</div>
                                                    </div>

                                                    <div className="p-2.5 bg-light rounded-3 text-start" style={{ fontSize: '0.8rem' }}>
                                                        <div className="text-muted small uppercase font-monospace mb-1" style={{ fontSize: '0.68rem', letterSpacing: '0.5px' }}>Active Role</div>
                                                        <span className="badge bg-primary-subtle text-primary border border-primary-subtle rounded-pill py-1 px-2.5" style={{ fontSize: '0.75rem' }}>
                                                            <i className="fa-solid fa-user-shield me-1"></i>
                                                            {user?.activeRole?.name || (user?.roles && user.roles.length > 0
                                                                ? (typeof user.roles[0] === 'object' ? user.roles[0].name : user.roles[0])
                                                                : (user?.permissions?.includes('master.users.manage') ? 'Administrator' : 'Staff Member'))}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Right Column: Edit Profile & Password Form */}
                                        <div className="col-md-8">
                                            <div className="card border-0 shadow-sm rounded-3 bg-white p-3">
                                                {/* Profile Details Section */}
                                                <div className="d-flex align-items-center mb-3 pb-2 border-bottom">
                                                    <i className="fa-solid fa-id-card me-2 text-primary"></i>
                                                    <h6 className="fw-bold mb-0 text-dark" style={{ fontSize: '0.9rem' }}>Profile Information</h6>
                                                </div>

                                                <div className="mb-3">
                                                    <label className="form-label fw-semibold small text-secondary">Full Name</label>
                                                    <div className="input-group">
                                                        <span className="input-group-text bg-light border-end-0 text-muted"><i className="fa-solid fa-user"></i></span>
                                                        <input 
                                                            type="text" 
                                                            className="form-control border-start-0" 
                                                            value={profileName} 
                                                            onChange={(e) => setProfileName(e.target.value)} 
                                                            required 
                                                        />
                                                    </div>
                                                </div>

                                                <div className="mb-3">
                                                    <label className="form-label fw-semibold small text-secondary">Email Address</label>
                                                    <div className="input-group">
                                                        <span className="input-group-text bg-light border-end-0 text-muted"><i className="fa-solid fa-envelope"></i></span>
                                                        <input 
                                                            type="email" 
                                                            className="form-control border-start-0" 
                                                            value={profileEmail} 
                                                            onChange={(e) => setProfileEmail(e.target.value)} 
                                                            required 
                                                        />
                                                    </div>
                                                </div>

                                                {/* Password Change Section */}
                                                <div className="d-flex align-items-center mt-4 mb-3 pb-2 border-bottom">
                                                    <i className="fa-solid fa-key me-2 text-primary"></i>
                                                    <h6 className="fw-bold mb-0 text-dark" style={{ fontSize: '0.9rem' }}>Security & Password</h6>
                                                </div>

                                                <div className="mb-3">
                                                    <label className="form-label fw-semibold small text-secondary">Current Password</label>
                                                    <div className="input-group">
                                                        <span className="input-group-text bg-light border-end-0 text-muted"><i className="fa-solid fa-lock"></i></span>
                                                        <input 
                                                            type={showCurrentPassword ? "text" : "password"} 
                                                            className="form-control border-start-0 border-end-0" 
                                                            placeholder="Verify current password"
                                                            value={currentPassword} 
                                                            onChange={(e) => setCurrentPassword(e.target.value)} 
                                                            required={!!newPassword || !!confirmPassword}
                                                        />
                                                        <button 
                                                            type="button" 
                                                            className="btn btn-outline-secondary border-start-0"
                                                            onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                                                            tabIndex="-1"
                                                            title={showCurrentPassword ? "Hide password" : "Show password"}
                                                        >
                                                            <i className={`fa-solid ${showCurrentPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                                                        </button>
                                                    </div>
                                                </div>

                                                <div className="row g-3">
                                                    <div className="col-md-6">
                                                        <label className="form-label fw-semibold small text-secondary">New Password</label>
                                                        <div className="input-group">
                                                            <span className="input-group-text bg-light border-end-0 text-muted"><i className="fa-solid fa-key"></i></span>
                                                            <input 
                                                                type={showNewPassword ? "text" : "password"} 
                                                                className="form-control border-start-0 border-end-0" 
                                                                placeholder="Min. 8 chars"
                                                                value={newPassword} 
                                                                onChange={(e) => setNewPassword(e.target.value)} 
                                                            />
                                                            <button 
                                                                type="button" 
                                                                className="btn btn-outline-secondary border-start-0"
                                                                onClick={() => setShowNewPassword(!showNewPassword)}
                                                                tabIndex="-1"
                                                                title={showNewPassword ? "Hide password" : "Show password"}
                                                            >
                                                                <i className={`fa-solid ${showNewPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                                                            </button>
                                                        </div>
                                                    </div>

                                                    <div className="col-md-6">
                                                        <label className="form-label fw-semibold small text-secondary">Confirm New Password</label>
                                                        <div className="input-group">
                                                            <span className="input-group-text bg-light border-end-0 text-muted"><i className="fa-solid fa-check-double"></i></span>
                                                            <input 
                                                                type={showConfirmPassword ? "text" : "password"} 
                                                                className="form-control border-start-0 border-end-0" 
                                                                placeholder="Re-enter new password"
                                                                value={confirmPassword} 
                                                                onChange={(e) => setConfirmPassword(e.target.value)} 
                                                            />
                                                            <button 
                                                                type="button" 
                                                                className="btn btn-outline-secondary border-start-0"
                                                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                                                tabIndex="-1"
                                                                title={showConfirmPassword ? "Hide password" : "Show password"}
                                                            >
                                                                <i className={`fa-solid ${showConfirmPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="modal-footer border-top bg-light px-4 py-3">
                                    <button type="button" className="btn btn-secondary px-4 fw-medium text-white" onClick={() => setShowSettingsModal(false)}>
                                        Close
                                    </button>
                                    <button type="submit" className="btn btn-primary px-4 fw-medium d-flex align-items-center shadow-sm" disabled={isUpdatingProfile}>
                                        {isUpdatingProfile ? (
                                            <>
                                                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                                Saving...
                                            </>
                                        ) : (
                                            <>
                                                <i className="fa-solid fa-floppy-disk me-2"></i>
                                                Save Changes
                                            </>
                                        )}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* Profile Image Cropper Modal */}
            <ImageCropperModal
                isOpen={showCropper}
                imageSrc={rawImageSrc}
                onClose={() => {
                    setShowCropper(false);
                    setRawImageSrc(null);
                }}
                onCropComplete={handleCropComplete}
            />
        </>
    );
}

const rootEl = document.getElementById('app');
if (rootEl) {
    ReactDOM.createRoot(rootEl).render(
        <React.StrictMode>
            <BrowserRouter>
                <App />
            </BrowserRouter>
        </React.StrictMode>
    );
}