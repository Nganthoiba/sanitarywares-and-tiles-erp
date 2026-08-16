import React, { useState, useEffect } from 'react';
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

function DashboardLayout({ user, handleLogout, hasPermission, fontSize, setFontSize, theme, toggleTheme, setShowSettingsModal, setShowLogoutModal }) {
    const location = useLocation();

    // Determine default menu open states based on the current path (for browser refresh / direct entry)
    const [grnMenuOpen, setGrnMenuOpen] = useState(() => location.pathname.startsWith('/grn'));
    const [poMenuOpen, setPoMenuOpen] = useState(() => location.pathname.startsWith('/purchase-orders'));
    const [productsMenuOpen, setProductsMenuOpen] = useState(() => location.pathname.startsWith('/products'));

    useEffect(() => {
        if (location.pathname.startsWith('/grn')) {
            setGrnMenuOpen(true);
        }
        if (location.pathname.startsWith('/purchase-orders')) {
            setPoMenuOpen(true);
        }
        if (location.pathname.startsWith('/products')) {
            setProductsMenuOpen(true);
        }
    }, [location.pathname]);

    return (
        <div className="d-flex" style={{ minHeight: '100vh' }}>
            {/* Elegant Sidebar Navigation */}
            <div className="sidebar-wrapper">
                <div className="sidebar-brand">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--accent-color)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="me-2"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
                    <span className="fs-6 text-uppercase fw-bold ls-tight sidebar-title">Tiles <span style={{color: 'var(--accent-color)'}}>ERP</span></span>
                </div>
                
                <ul className="sidebar-menu">
                    <li className="sidebar-menu-item">
                        <NavLink to="/inventory" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
                            <i className="fa-solid fa-boxes-stacked me-3"></i>
                            <span className="sidebar-text">Inventory Engine</span>
                        </NavLink>
                    </li>
                    <li className="sidebar-menu-item">
                        <button 
                            className={`sidebar-link d-flex justify-content-between align-items-center ${location.pathname.startsWith('/grn') ? 'active' : ''}`} 
                            onClick={() => setGrnMenuOpen(!grnMenuOpen)}
                        >
                            <span className="d-flex align-items-center">
                                <i className="fa-solid fa-file-invoice me-3"></i>
                                <span className="sidebar-text">Goods Receipt (GRN)</span>
                            </span>
                            <i className={`fa-solid fa-chevron-${grnMenuOpen ? 'down' : 'right'} ms-auto`} style={{ fontSize: '0.75rem', opacity: 0.7 }}></i>
                        </button>
                        {grnMenuOpen && (
                            <ul className="sidebar-submenu animate__animated animate__fadeIn">
                                <li>
                                    <NavLink 
                                        to="/grn" 
                                        end
                                        className={({ isActive }) => `sidebar-submenu-link ${isActive ? 'active' : ''}`}
                                    >
                                        <i className="fa-solid fa-list me-2" style={{ fontSize: '0.8rem' }}></i>
                                        Registry List
                                    </NavLink>
                                </li>
                                <li>
                                    <NavLink 
                                        to="/grn/new" 
                                        className={({ isActive }) => `sidebar-submenu-link ${isActive ? 'active' : ''}`}
                                    >
                                        <i className="fa-solid fa-plus me-2" style={{ fontSize: '0.8rem' }}></i>
                                        New GRN Note
                                    </NavLink>
                                </li>
                            </ul>
                        )}
                    </li>
                    <li className="sidebar-menu-item">
                        <button 
                            className={`sidebar-link d-flex justify-content-between align-items-center ${location.pathname.startsWith('/purchase-orders') ? 'active' : ''}`} 
                            onClick={() => setPoMenuOpen(!poMenuOpen)}
                        >
                            <span className="d-flex align-items-center">
                                <i className="fa-solid fa-cart-shopping me-3"></i>
                                <span className="sidebar-text">Purchase Orders</span>
                            </span>
                            <i className={`fa-solid fa-chevron-${poMenuOpen ? 'down' : 'right'} ms-auto`} style={{ fontSize: '0.75rem', opacity: 0.7 }}></i>
                        </button>
                        {poMenuOpen && (
                            <ul className="sidebar-submenu animate__animated animate__fadeIn">
                                <li>
                                    <NavLink 
                                        to="/purchase-orders" 
                                        end
                                        className={({ isActive }) => `sidebar-submenu-link ${isActive ? 'active' : ''}`}
                                    >
                                        <i className="fa-solid fa-list me-2" style={{ fontSize: '0.8rem' }}></i>
                                        PO Registry List
                                    </NavLink>
                                </li>
                                <li>
                                    <NavLink 
                                        to="/purchase-orders/new" 
                                        className={({ isActive }) => `sidebar-submenu-link ${isActive ? 'active' : ''}`}
                                    >
                                        <i className="fa-solid fa-plus me-2" style={{ fontSize: '0.8rem' }}></i>
                                        New Purchase Order
                                    </NavLink>
                                </li>
                            </ul>
                        )}
                    </li>
                    <li className="sidebar-menu-item">
                        <NavLink to="/branches" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
                            <i className="fa-solid fa-code-branch me-3"></i>
                            <span className="sidebar-text">Branch Locations</span>
                        </NavLink>
                    </li>
                    <li className="sidebar-menu-item">
                        <NavLink to="/warehouses" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
                            <i className="fa-solid fa-warehouse me-3"></i>
                            <span className="sidebar-text">Warehouses</span>
                        </NavLink>
                    </li>
                    <li className="sidebar-menu-item">
                        <NavLink to="/storage-locations" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
                            <i className="fa-solid fa-map-pin me-3"></i>
                            <span className="sidebar-text">Storage Locations</span>
                        </NavLink>
                    </li>
                    <li className="sidebar-menu-item">
                        <NavLink to="/suppliers" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
                            <i className="fa-solid fa-truck-field me-3"></i>
                            <span className="sidebar-text">Suppliers</span>
                        </NavLink>
                    </li>
                    <li className="sidebar-menu-item">
                        <button 
                            className={`sidebar-link d-flex justify-content-between align-items-center ${location.pathname.startsWith('/products') ? 'active' : ''}`} 
                            onClick={() => setProductsMenuOpen(!productsMenuOpen)}
                        >
                            <span className="d-flex align-items-center">
                                <i className="fa-solid fa-cube me-3"></i>
                                <span className="sidebar-text">Products</span>
                            </span>
                            <i className={`fa-solid fa-chevron-${productsMenuOpen ? 'down' : 'right'} ms-auto`} style={{ fontSize: '0.75rem', opacity: 0.7 }}></i>
                        </button>
                        {productsMenuOpen && (
                            <ul className="sidebar-submenu animate__animated animate__fadeIn">
                                <li>
                                    <NavLink 
                                        to="/products" 
                                        className={({ isActive }) => `sidebar-submenu-link ${isActive ? 'active' : ''}`}
                                    >
                                        <i className="fa-solid fa-list me-2" style={{ fontSize: '0.8rem' }}></i>
                                        All Products
                                    </NavLink>
                                </li>
                                <li>
                                    <NavLink 
                                        to="/products/categories" 
                                        className={({ isActive }) => `sidebar-submenu-link ${isActive ? 'active' : ''}`}
                                    >
                                        <i className="fa-solid fa-sitemap me-2" style={{ fontSize: '0.8rem' }}></i>
                                        Categories
                                    </NavLink>
                                </li>
                            </ul>
                        )}
                    </li>
                    <li className="sidebar-menu-item">
                        <NavLink to="/products/brands" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
                            <i className="fa-solid fa-tags me-3"></i>
                            <span className="sidebar-text">Brands</span>
                        </NavLink>
                    </li>
                    <li className="sidebar-menu-item">
                        <NavLink to="/products/manufacturers" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
                            <i className="fa-solid fa-industry me-3"></i>
                            <span className="sidebar-text">Manufacturers</span>
                        </NavLink>
                    </li>
                    <li className="sidebar-menu-item">
                        <NavLink to="/workflows" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
                            <i className="fa-solid fa-diagram-project me-3"></i>
                            <span className="sidebar-text">BPM Workflows</span>
                        </NavLink>
                    </li>
                    <li className="sidebar-menu-item">
                        <NavLink to="/bookkeeping" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
                            <i className="fa-solid fa-calculator me-3"></i>
                            <span className="sidebar-text">General Bookkeeping</span>
                        </NavLink>
                    </li>
                    <li className="sidebar-menu-item">
                        <NavLink to="/reporting" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
                            <i className="fa-solid fa-chart-line me-3"></i>
                            <span className="sidebar-text">Reporting & BI Hub</span>
                        </NavLink>
                    </li>
                    {hasPermission('master.users.manage') && (
                        <li className="sidebar-menu-item">
                            <NavLink to="/users" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
                                <i className="fa-solid fa-users-gear me-3"></i>
                                <span className="sidebar-text">User & Role Manager</span>
                            </NavLink>
                        </li>
                    )}
                </ul>

                <hr />

                <div className="sidebar-footer border-top p-3 mt-auto">
                    <div className="d-flex align-items-center justify-content-between">
                        <div className="d-flex align-items-center">
                            <div className="rounded-circle d-flex justify-content-center align-items-center me-2 font-monospace fw-bold" style={{ width: '32px', height: '32px', fontSize: '0.85rem', backgroundColor: 'var(--border-color)', color: 'var(--accent-color)' }}>
                                {user?.name?.substring(0, 2).toUpperCase() || 'US'}
                            </div>
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
                        <li className="nav-item d-flex align-items-center me-4">
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
                        <li className="nav-item">
                            <span className="d-none nav-link font-monospace text-muted" style={{ fontSize: '0.85rem' }}>Status: Production API Connected</span>
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
                    organizationName: localStorage.getItem('organization_name'),
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
        }
    }, [showSettingsModal, user]);

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
            const response = await fetch('/api/profile', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
                },
                body: JSON.stringify({
                    name: profileName,
                    email: profileEmail,
                    current_password: currentPassword || undefined,
                    new_password: newPassword || undefined,
                    new_password_confirmation: confirmPassword || undefined
                })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Failed to update profile.');
            }

            // Profile updated successfully
            // Update React state
            setUser(prev => ({
                ...prev,
                name: data.user.name,
                email: data.user.email
            }));

            // Update localStorage
            localStorage.setItem('user_name', data.user.name);
            localStorage.setItem('user_email', data.user.email);

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

    const handleLoginSuccess = (data) => {
        const orgName = data.organization?.name || data.user?.organization?.name || '';
        const permissions = data.user_permissions || data.user?.permissions || [];
        const roles = data.user_roles || data.user?.roles || (permissions.includes('master.users.manage') ? ['Administrator'] : []);
        setUser({
            name: data.user.name,
            email: data.user.email,
            organizationName: orgName,
            roles: roles,
            permissions: permissions
        });
        localStorage.setItem('auth_token', data.access_token);
        localStorage.setItem('user_name', data.user.name);
        localStorage.setItem('user_email', data.user.email);
        localStorage.setItem('organization_name', orgName);
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

                        <Route path="/products" element={<ProductEntry key="products" initialSubTab="list" />} />
                        <Route path="/products/categories" element={<CategoryManager />} />
                        <Route path="/products/brands" element={<BrandManager />} />
                        <Route path="/products/manufacturers" element={<ManufacturerManager />} />

                        <Route path="/workflows" element={<WorkflowMonitor />} />
                        <Route path="/bookkeeping" element={<LedgerReports />} />
                        <Route path="/reporting" element={<ReportingHub />} />
                        
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
                <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)', zIndex: 1050 }}>
                    <div className="modal-dialog modal-dialog-centered">
                        <div className="modal-content shadow-lg border-0" style={{ borderRadius: '12px' }}>
                            <div className="modal-header border-bottom-0 pt-4 px-4">
                                <h5 className="modal-title fw-bold fs-5">Account Settings</h5>
                                <button type="button" className="btn-close" onClick={() => setShowSettingsModal(false)} aria-label="Close"></button>
                            </div>
                            <form onSubmit={handleUpdateProfile}>
                                <div className="modal-body px-4">
                                    {settingsSuccess && (
                                        <div className="alert alert-success d-flex align-items-center py-2 animate__animated animate__fadeIn" role="alert">
                                            <i className="fa-solid fa-circle-check me-2"></i>
                                            <div>{settingsSuccess}</div>
                                        </div>
                                    )}
                                    {settingsError && (
                                        <div className="alert alert-danger d-flex align-items-center py-2 animate__animated animate__fadeIn" role="alert">
                                            <i className="fa-solid fa-circle-exclamation me-2"></i>
                                            <div>{settingsError}</div>
                                        </div>
                                    )}

                                    {/* User Details Read-only Context */}
                                    <div className="mb-4 p-3 bg-light rounded-3" style={{ fontSize: '0.85rem' }}>
                                        <div className="row g-2">
                                            <div className="col-6">
                                                <span className="text-muted d-block small uppercase font-monospace">Organization</span>
                                                <strong className="text-dark">{user?.organizationName || 'N/A'}</strong>
                                            </div>
                                            <div className="col-6">
                                                <span className="text-muted d-block small uppercase font-monospace">User Role</span>
                                                <strong className="text-dark">
                                                    {(user?.roles && user.roles.length > 0)
                                                        ? user.roles.join(', ')
                                                        : (user?.permissions?.includes('master.users.manage') ? 'Administrator' : 'Staff Member')}
                                                </strong>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Edit Details */}
                                    <div className="mb-3">
                                        <label className="form-label fw-semibold small">Full Name</label>
                                        <input 
                                            type="text" 
                                            className="form-control" 
                                            value={profileName} 
                                            onChange={(e) => setProfileName(e.target.value)} 
                                            required 
                                        />
                                    </div>
                                    <div className="mb-3">
                                        <label className="form-label fw-semibold small">Email Address</label>
                                        <input 
                                            type="email" 
                                            className="form-control" 
                                            value={profileEmail} 
                                            onChange={(e) => setProfileEmail(e.target.value)} 
                                            required 
                                        />
                                    </div>

                                    <hr className="my-4 text-muted opacity-25" />

                                    <h6 className="fw-bold mb-3" style={{ fontSize: '0.9rem' }}>
                                        <i className="fa-solid fa-key me-2 text-muted"></i>Change Password
                                    </h6>
                                    <div className="mb-3">
                                        <label className="form-label fw-semibold small">Current Password</label>
                                        <div className="input-group">
                                            <input 
                                                type={showCurrentPassword ? "text" : "password"} 
                                                className="form-control" 
                                                placeholder="Verify current password"
                                                value={currentPassword} 
                                                onChange={(e) => setCurrentPassword(e.target.value)} 
                                                required={!!newPassword || !!confirmPassword}
                                            />
                                            <button 
                                                type="button" 
                                                className="btn btn-outline-secondary"
                                                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                                                tabIndex="-1"
                                                title={showCurrentPassword ? "Hide password" : "Show password"}
                                            >
                                                <i className={`fa-solid ${showCurrentPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                                            </button>
                                        </div>
                                    </div>
                                    <div className="mb-3">
                                        <label className="form-label fw-semibold small">New Password</label>
                                        <div className="input-group">
                                            <input 
                                                type={showNewPassword ? "text" : "password"} 
                                                className="form-control" 
                                                placeholder="Min. 8 characters"
                                                value={newPassword} 
                                                onChange={(e) => setNewPassword(e.target.value)} 
                                            />
                                            <button 
                                                type="button" 
                                                className="btn btn-outline-secondary"
                                                onClick={() => setShowNewPassword(!showNewPassword)}
                                                tabIndex="-1"
                                                title={showNewPassword ? "Hide password" : "Show password"}
                                            >
                                                <i className={`fa-solid ${showNewPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                                            </button>
                                        </div>
                                    </div>
                                    <div className="mb-3">
                                        <label className="form-label fw-semibold small">Confirm New Password</label>
                                        <div className="input-group">
                                            <input 
                                                type={showConfirmPassword ? "text" : "password"} 
                                                className="form-control" 
                                                placeholder="Re-enter new password"
                                                value={confirmPassword} 
                                                onChange={(e) => setConfirmPassword(e.target.value)} 
                                            />
                                            <button 
                                                type="button" 
                                                className="btn btn-outline-secondary"
                                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                                tabIndex="-1"
                                                title={showConfirmPassword ? "Hide password" : "Show password"}
                                            >
                                                <i className={`fa-solid ${showConfirmPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                                <div className="modal-footer border-top-0 pb-4 px-4">
                                    <button type="button" className="btn btn-secondary px-3" onClick={() => setShowSettingsModal(false)}>Close</button>
                                    <button type="submit" className="btn btn-primary px-4" disabled={isUpdatingProfile}>
                                        {isUpdatingProfile ? (
                                            <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                        ) : null}
                                        Save Changes
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
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