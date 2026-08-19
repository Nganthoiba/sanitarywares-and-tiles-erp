import React, { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate, NavLink, useNavigate, useLocation, Outlet } from 'react-router-dom';
import SlabInventoryView from './components/inventory/SlabInventoryView';
import InventoryManager from './components/inventory/InventoryManager';
import WorkflowMonitor from './components/workflow/WorkflowMonitor';
import LedgerReports from './components/accounting/LedgerReports';
import ReportingHub from './components/reporting/ReportingHub';
import Login from './components/auth/Login';
import RegisterOrganization from './components/auth/RegisterOrganization';
import AcceptInvitation from './components/auth/AcceptInvitation';
import UserManagement from './components/auth/UserManagement';
import ProductEntry from './components/product/ProductEntry';
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
        return <Navigate to="/inventory" replace />;
    }
    return <Outlet />;
}

function DashboardLayout({ user, handleLogout, hasPermission, fontSize, setFontSize, theme, toggleTheme, setShowSettingsModal, setShowLogoutModal, handleSwitchRole }) {
    const location = useLocation();
    const [navItems, setNavItems] = useState([]);
    const [openMenuId, setOpenMenuId] = useState(null);

    useEffect(() => {
        const token = localStorage.getItem('auth_token');
        if (token) {
            fetch('/api/navigation', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json',
                }
            })
            .then(res => res.ok ? res.json() : [])
            .then(data => {
                console.log(data);
                if (Array.isArray(data) && data.length > 0) {
                    setNavItems(data);
                }
            })
            .catch(() => {});
        }
    }, [user]);

    // Helper to find which parent group owns the active route
    const getActiveParentId = (items, pathname) => {
        for (const item of items) {
            if (item.children && item.children.length > 0) {
                if (item.children.some(child => child.route_uri && (pathname === child.route_uri || pathname.startsWith(child.route_uri + '/')))) {
                    return item.id;
                }
            }
        }
        return null;
    };

    // Automatically expand the parent group of the current active route on route change
    useEffect(() => {
        if (navItems.length > 0) {
            const activeParentId = getActiveParentId(navItems, location.pathname);
            if (activeParentId) {
                setOpenMenuId(activeParentId);
            }
        }
    }, [location.pathname, navItems]);

    // Accordion toggle: opening a new parent group collapses all other parent groups
    const toggleSubmenu = (id) => {
        setOpenMenuId(prevId => prevId === id ? null : id);
    };

    const isSubmenuActive = (item) => {
        if (!item.children || item.children.length === 0) return false;
        return item.children.some(child => child.route_uri && (location.pathname === child.route_uri || location.pathname.startsWith(child.route_uri + '/')));
    };

    return (
        <div className="d-flex" style={{ minHeight: '100vh' }}>
            {/* Dynamic Database-Driven Sidebar Navigation */}
            <div className="sidebar-wrapper">
                <div className="sidebar-brand">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--accent-color)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="me-2"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
                    <span className="fs-6 text-uppercase fw-bold ls-tight sidebar-title">Tiles <span style={{color: 'var(--accent-color)'}}>ERP</span></span>
                </div>
                
                <ul className="sidebar-menu">
                    {navItems.map((item) => {
                        const hasChildren = item.children && item.children.length > 0;
                        const isOpen = openMenuId === item.id;

                        if (hasChildren) {
                            return (
                                <li className="sidebar-menu-item" key={item.id}>
                                    <button 
                                        className={`sidebar-link d-flex justify-content-between align-items-center ${(isOpen && isSubmenuActive(item)) ? 'active' : ''}`}
                                        onClick={() => toggleSubmenu(item.id)}
                                    >
                                        <span className="d-flex align-items-center">
                                            <i className={`${item.icon || 'fa-solid fa-folder'} me-3`}></i>
                                            <span className="sidebar-text">{item.menu_name}</span>
                                        </span>
                                        <i className={`fa-solid fa-chevron-${isOpen ? 'down' : 'right'} ms-auto`} style={{ fontSize: '0.75rem', opacity: 0.7 }}></i>
                                    </button>
                                    {isOpen && (
                                        <ul className="sidebar-submenu animate__animated animate__fadeIn">
                                            {item.children.map(child => (
                                                <li key={child.id}>
                                                    <NavLink 
                                                        to={child.route_uri}
                                                        end={child.route_uri === item.route_uri}
                                                        className={({ isActive }) => `sidebar-submenu-link ${isActive ? 'active' : ''}`}
                                                    >
                                                        <i className={`${child.icon || 'fa-solid fa-angle-right'} me-2`} style={{ fontSize: '0.8rem' }}></i>
                                                        {child.menu_name}
                                                    </NavLink>
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                </li>
                            );
                        }

                        return (
                            <li className="sidebar-menu-item" key={item.id}>
                                <NavLink to={item.route_uri} className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
                                    <i className={`${item.icon || 'fa-solid fa-circle-dot'} me-3`}></i>
                                    <span className="sidebar-text">{item.menu_name}</span>
                                </NavLink>
                            </li>
                        );
                    })}
                </ul>

                <div className="sidebar-footer border-top p-3">
                    <div className="d-flex align-items-center justify-content-between">
                        <div className="d-flex align-items-center">
                            {user?.profile_photo_url ? (
                                <img 
                                    src={user.profile_photo_url} 
                                    alt={user.name} 
                                    className="rounded-circle me-2 object-fit-cover shadow-sm border" 
                                    style={{ width: '32px', height: '32px' }} 
                                />
                            ) : (
                                <div className="rounded-circle d-flex justify-content-center align-items-center me-2 font-monospace fw-bold" style={{ width: '32px', height: '32px', fontSize: '0.85rem', backgroundColor: 'var(--border-color)', color: 'var(--accent-color)' }}>
                                    {user?.name?.substring(0, 2).toUpperCase() || 'US'}
                                </div>
                            )}
                            <div style={{ maxWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                <div className="fw-bold" style={{ fontSize: '0.85rem' }}>{user?.name || 'Operator'}</div>
                                <span className="text-muted font-monospace" style={{ fontSize: '0.75rem' }}>{user?.organizationName || 'Acme'}</span>
                            </div>
                        </div>
                        <div className="d-flex gap-1">
                            <button className="btn btn-xs btn-link text-secondary p-1 shadow-none border-0 bg-transparent" onClick={() => setShowSettingsModal(true)} title="Profile Settings">
                                <i className="fa-solid fa-gear"></i>
                            </button>
                            <button className="btn btn-xs btn-link text-danger p-1 shadow-none border-0 bg-transparent" onClick={() => setShowLogoutModal(true)} title="Logout">
                                <i className="fa-solid fa-right-from-bracket"></i>
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Application Window */}
            <div className="flex-grow-1 d-flex flex-column">
                {/* Navbar */}
                <nav className="navbar navbar-expand navbar-light bg-white py-3 px-4 border-bottom shadow-sm">
                    <span className="navbar-brand mb-0 h1 fs-5 fw-bold text-dark">Building Materials Core Manager</span>
                    <ul className="navbar-nav ms-auto align-items-center">
                        <li className="nav-item d-flex align-items-center me-4">
                            <span className="text-muted small me-2" style={{ fontSize: '0.8rem' }}>Aa:</span>
                            <div className="btn-group btn-group-sm" role="group" aria-label="Font size selector">
                                <button type="button" className={`btn btn-outline-secondary py-0.5 px-2 ${fontSize === 12 ? 'active' : ''}`} onClick={() => setFontSize(12)} style={{ fontSize: '11px' }}>XS</button>
                                <button type="button" className={`btn btn-outline-secondary py-0.5 px-2 ${fontSize === 13.5 ? 'active' : ''}`} onClick={() => setFontSize(13.5)} style={{ fontSize: '11px' }}>S</button>
                                <button type="button" className={`btn btn-outline-secondary py-0.5 px-2 ${fontSize === 15 ? 'active' : ''}`} onClick={() => setFontSize(15)} style={{ fontSize: '11px' }}>M</button>
                                <button type="button" className={`btn btn-outline-secondary py-0.5 px-2 ${fontSize === 16.5 ? 'active' : ''}`} onClick={() => setFontSize(16.5)} style={{ fontSize: '11px' }}>L</button>
                            </div>
                        </li>
                        <li className="nav-item d-flex align-items-center me-3">
                            <button 
                                className="btn btn-sm btn-outline-secondary d-flex align-items-center gap-1 py-1 px-3" 
                                onClick={toggleTheme}
                                style={{ fontSize: '0.8rem', borderRadius: '20px' }}
                            >
                                {theme === 'light' ? (
                                    <><i className="fa-solid fa-moon me-1"></i> Dark</>
                                ) : (
                                    <><i className="fa-solid fa-sun me-1"></i> Light</>
                                )}
                            </button>
                        </li>

                        {/* User & Role Switcher Button */}
                        <li className="nav-item dropdown">
                            <button 
                                className="btn btn-sm btn-outline-primary dropdown-toggle d-flex align-items-center gap-2 py-1 px-2.5 shadow-sm"
                                type="button"
                                id="userRoleDropdown"
                                data-bs-toggle="dropdown"
                                aria-expanded="false"
                                style={{ fontSize: '0.8rem', borderRadius: '20px' }}
                            >
                                {user?.profile_photo_url ? (
                                    <img 
                                        src={user.profile_photo_url} 
                                        alt={user.name} 
                                        className="rounded-circle object-fit-cover shadow-sm border" 
                                        style={{ width: '22px', height: '22px' }} 
                                    />
                                ) : (
                                    <i className="fa-solid fa-user-gear text-primary"></i>
                                )}
                                <span className="fw-semibold">{user?.name || 'User'}</span>
                                <span className="badge bg-warning-subtle text-warning border border-warning-subtle rounded-pill ms-1" style={{ fontSize: '0.7rem' }}>
                                    {user?.activeRole?.name || (typeof user?.roles?.[0] === 'object' ? user?.roles?.[0]?.name : (user?.roles?.[0] || 'Role'))}
                                </span>
                            </button>
                            
                            <ul className="dropdown-menu dropdown-menu-end shadow-lg border-0 mt-2 p-2" aria-labelledby="userRoleDropdown" style={{ minWidth: '260px', borderRadius: '12px', zIndex: 1060 }}>
                                <li className="px-3 py-2 bg-light rounded-3 mb-2 d-flex align-items-center gap-2">
                                    {user?.profile_photo_url ? (
                                        <img 
                                            src={user.profile_photo_url} 
                                            alt={user.name} 
                                            className="rounded-circle object-fit-cover shadow-sm border" 
                                            style={{ width: '36px', height: '36px' }} 
                                        />
                                    ) : (
                                        <div className="rounded-circle d-flex justify-content-center align-items-center font-monospace fw-bold me-1" style={{ width: '36px', height: '36px', fontSize: '0.9rem', backgroundColor: 'var(--border-color)', color: 'var(--accent-color)' }}>
                                            {user?.name?.substring(0, 2).toUpperCase() || 'US'}
                                        </div>
                                    )}
                                    <div className="overflow-hidden">
                                        <div className="fw-bold text-dark text-truncate" style={{ fontSize: '0.85rem' }}>{user?.name}</div>
                                        <div className="text-muted small text-truncate" style={{ fontSize: '0.75rem' }}>{user?.email}</div>
                                        <div className="text-muted small font-monospace mt-0.5" style={{ fontSize: '0.7rem' }}>Org: {user?.organizationName || 'N/A'}</div>
                                    </div>
                                </li>

                                <li><hr className="dropdown-divider my-1" /></li>

                                <li className="dropdown-header text-uppercase font-monospace fw-bold text-muted" style={{ fontSize: '0.68rem', letterSpacing: '0.5px' }}>
                                    Switch Role
                                </li>

                                {user?.roles && user.roles.length > 0 ? (
                                    user.roles.map((r, index) => {
                                        const roleObj = typeof r === 'object' ? r : { id: index + 1, name: r };
                                        const isActive = (user?.activeRole?.id === roleObj.id) || (user?.default_role_id === roleObj.id) || (roleObj.is_default);
                                        return (
                                            <li key={roleObj.id || index}>
                                                <button 
                                                    className={`dropdown-item d-flex align-items-center justify-content-between rounded-2 py-2 px-3 ${isActive ? 'active bg-primary text-white' : ''}`}
                                                    onClick={() => roleObj.id && handleSwitchRole && handleSwitchRole(roleObj.id)}
                                                    disabled={isActive}
                                                    style={{ fontSize: '0.82rem' }}
                                                >
                                                    <span>
                                                        <i className={`fa-solid ${isActive ? 'fa-circle-check me-2' : 'fa-user-tag me-2 opacity-50'}`}></i>
                                                        {roleObj.name}
                                                    </span>
                                                    {isActive && <span className="badge bg-white text-primary rounded-pill ms-2" style={{ fontSize: '0.65rem' }}>Active</span>}
                                                </button>
                                            </li>
                                        );
                                    })
                                ) : (
                                    <li className="px-3 py-1 text-muted small">No assigned roles</li>
                                )}

                                <li><hr className="dropdown-divider my-1" /></li>

                                <li>
                                    <button className="dropdown-item text-secondary py-1.5 px-3 rounded-2" onClick={() => setShowSettingsModal(true)} style={{ fontSize: '0.82rem' }}>
                                        <i className="fa-solid fa-gear me-2"></i> Account Settings
                                    </button>
                                </li>
                                <li>
                                    <button className="dropdown-item text-danger py-1.5 px-3 rounded-2" onClick={() => setShowLogoutModal(true)} style={{ fontSize: '0.82rem' }}>
                                        <i className="fa-solid fa-right-from-bracket me-2"></i> Logout
                                    </button>
                                </li>
                            </ul>
                        </li>
                    </ul>
                </nav>

                {/* Dashboard Main Content */}
                <div className="container-fluid p-4">
                    <Outlet />
                </div>
            </div>
        </div>
    );
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
        return parseFloat(localStorage.getItem('app_font_size') || '13.5');
    });

    // Theme state
    const [theme, setTheme] = useState(() => {
        return localStorage.getItem('app_theme') || 'light';
    });

    useEffect(() => {
        document.documentElement.style.setProperty('--app-font-size', `${fontSize}px`);
        localStorage.setItem('app_font_size', fontSize.toString());
    }, [fontSize]);

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
        navigate('/inventory');
    };

    const handleLogout = () => {
        setIsLoggingOut(true);
        localStorage.clear();
        setUser(null);
        navigate('/login');
    };

    const hasPermission = (perm) => {
        return user?.permissions?.includes(perm) || user?.permissions?.includes('administrator');
    };

    return (
        <>
            <Routes>
                {/* Guest-only routes */}
                <Route element={<GuestRoute user={user} />}>
                    <Route path="/" element={<LandingPage onNavigateToLogin={() => navigate('/login')} onNavigateToRegister={() => navigate('/register')} />} />
                    <Route path="/login" element={<Login onLoginSuccess={handleLoginSuccess} onNavigateToRegister={() => navigate('/register')} />} />
                    <Route path="/register" element={<RegisterOrganization onRegistrationSuccess={handleLoginSuccess} onNavigateToLogin={() => navigate('/login')} />} />
                    <Route path="/accept-invitation" element={<AcceptInvitation onNavigateToLogin={() => navigate('/login')} />} />
                </Route>

                {/* Protected routes */}
                <Route element={<ProtectedRoute user={user} />}>
                    <Route element={
                        <DashboardLayout 
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
                        <Route path="/dashboard" element={<Navigate to="/inventory" replace />} />
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

                        <Route path="/purchase-orders" element={
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
                                    if (mode === 'list') navigate('/purchase-orders');
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
                        <Route path="/products/brands" element={<BrandManager />} />
                        <Route path="/products/manufacturers" element={<ManufacturerManager />} />

                        <Route path="/workflows" element={<WorkflowMonitor />} />
                        <Route path="/bookkeeping" element={<LedgerReports />} />
                        <Route path="/reporting" element={<ReportingHub />} />
                        
                        <Route path="/platform/menus" element={
                            hasPermission('platform.menus.manage') ? (
                                <MenuManagement />
                            ) : (
                                <Navigate to="/inventory" replace />
                            )
                        } />

                        <Route path="/platform/organizations" element={
                            hasPermission('platform.organizations.manage') ? (
                                <OrganizationManagement />
                            ) : (
                                <Navigate to="/inventory" replace />
                            )
                        } />

                        <Route path="/platform/permissions" element={
                            hasPermission('platform.permissions.manage') ? (
                                <PermissionManagement />
                            ) : (
                                <Navigate to="/inventory" replace />
                            )
                        } />

                        <Route path="/users" element={
                            hasPermission('master.users.manage') ? (
                                <UserManagement />
                            ) : (
                                <Navigate to="/inventory" replace />
                            )
                        } />
                    </Route>
                </Route>

                {/* Catch-all fallback */}
                <Route path="*" element={<Navigate to={user ? "/inventory" : "/"} replace />} />
            </Routes>
            {/* Showing logout confirmation modal */}
            {showLogoutModal && (
                <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)', zIndex: 1050 }}>
                    <div className="modal-dialog modal-dialog-centered">
                        <div className="modal-content shadow-lg border-0" style={{ borderRadius: '12px' }}>
                            <div className="modal-header border-bottom-0 pt-4 px-4">
                                <h5 className="modal-title fw-bold fs-5">Logout Confirmation</h5>
                                <button type="button" className="btn-close" onClick={() => setShowLogoutModal(false)} aria-label="Close"></button>
                            </div>
                            <form onSubmit={handleLogout}>
                                <div className="modal-body px-4"> 
                                    <h6 className="fw-bold mb-3" style={{ fontSize: '0.9rem' }}>
                                        <i className="fa-solid fa-right-from-bracket me-2 text-muted"></i>Are you sure to logout?
                                    </h6>
                                </div>
                                <div className="modal-footer border-top-0 pb-4 px-4">
                                    <button type="button" className="btn btn-secondary px-3" onClick={() => setShowLogoutModal(false)}>Cancel</button>
                                    <button type="submit" className="btn btn-danger px-4" disabled={isLoggingOut}>
                                        {isUpdatingProfile ? (
                                            <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                        ) : null}
                                        Logout
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
                                        <div className="alert alert-success d-flex align-items-center py-2.5 px-3 mb-4 shadow-sm border-0 rounded-3 animate__animated animate__fadeIn" role="alert">
                                            <i className="fa-solid fa-circle-check fs-5 me-2 text-success"></i>
                                            <div className="fw-medium">{settingsSuccess}</div>
                                        </div>
                                    )}
                                    {settingsError && (
                                        <div className="alert alert-danger d-flex align-items-center py-2.5 px-3 mb-4 shadow-sm border-0 rounded-3 animate__animated animate__fadeIn" role="alert">
                                            <i className="fa-solid fa-circle-exclamation fs-5 me-2 text-danger"></i>
                                            <div className="fw-medium">{settingsError}</div>
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