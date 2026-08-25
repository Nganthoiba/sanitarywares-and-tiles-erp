import React, { useState, useEffect } from 'react';
import { useLocation, NavLink, Outlet } from 'react-router-dom';

function NavigationLayout({ user, handleLogout, hasPermission, fontSize, setFontSize, theme, toggleTheme, setShowSettingsModal, setShowLogoutModal, handleSwitchRole }) {
    const location = useLocation();
    const [navItems, setNavItems] = useState([]);
    const [openMenuId, setOpenMenuId] = useState(null);

    const fetchNavigation = () => {
        const token = localStorage.getItem('auth_token');
        if (token) {
            fetch('/api/navigation', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json',
                    'Cache-Control': 'no-cache',
                }
            })
            .then(res => res.ok ? res.json() : [])
            .then(data => {
                if (Array.isArray(data)) {
                    setNavItems(data);
                }
            })
            .catch(() => {});
        }
    };

    useEffect(() => {
        fetchNavigation();

        const handleRefresh = () => {
            fetchNavigation();
        };

        window.addEventListener('navigation-refresh', handleRefresh);
        window.addEventListener('role-permissions-updated', handleRefresh);

        return () => {
            window.removeEventListener('navigation-refresh', handleRefresh);
            window.removeEventListener('role-permissions-updated', handleRefresh);
        };
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
            <div className="flex-grow-1 d-flex flex-column main-window">
                {/* Navbar */}
                <nav className="navbar navbar-expand navbar-light bg-white py-3 px-4 border-bottom shadow-sm">
                    <span className="navbar-brand mb-0 h1 fs-5 fw-bold text-dark">Sanitary Wares & Tiles Core Manager</span>
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

export default NavigationLayout;
