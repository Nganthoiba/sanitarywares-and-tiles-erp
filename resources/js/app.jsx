import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import SlabInventoryView from './components/SlabInventoryView';
import InventoryManager from './components/InventoryManager';
import WorkflowMonitor from './components/WorkflowMonitor';
import LedgerReports from './components/LedgerReports';
import ReportingHub from './components/ReportingHub';
import Login from './components/Login';
import RegisterOrganization from './components/RegisterOrganization';
import AcceptInvitation from './components/AcceptInvitation';
import UserManagement from './components/UserManagement';

import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.bundle.min.js';

function App() {
    const [view, setView] = useState('login'); // login, register, accept, dashboard
    const [activeTab, setActiveTab] = useState('slabs');
    const [user, setUser] = useState(null);

    useEffect(() => {
        // 1. Detect if invitation route is requested in URL
        if (window.location.pathname === '/accept-invitation' || window.location.search.includes('token=')) {
            setView('accept');
            return;
        }

        // 2. Check stored session credentials
        const token = localStorage.getItem('auth_token');
        if (token) {
            setUser({
                name: localStorage.getItem('user_name'),
                email: localStorage.getItem('user_email'),
                organizationName: localStorage.getItem('organization_name'),
                permissions: JSON.parse(localStorage.getItem('user_permissions') || '[]')
            });
            setView('dashboard');
        } else {
            setView('login');
        }
    }, []);

    const handleLoginSuccess = (data) => {
        setUser({
            name: data.user.name,
            email: data.user.email,
            organizationName: data.user.organization.name,
            permissions: data.user.permissions
        });
        setView('dashboard');
    };

    const handleLogout = () => {
        localStorage.clear();
        setUser(null);
        setView('login');
    };

    const hasPermission = (perm) => {
        return user?.permissions?.includes(perm) || user?.permissions?.includes('administrator');
    };

    if (view === 'login') {
        return <Login onLoginSuccess={handleLoginSuccess} onNavigateToRegister={() => setView('register')} />;
    }

    if (view === 'register') {
        return <RegisterOrganization onRegistrationSuccess={handleLoginSuccess} onNavigateToLogin={() => setView('login')} />;
    }

    if (view === 'accept') {
        return <AcceptInvitation onNavigateToLogin={() => setView('login')} />;
    }

    return (
        <div className="d-flex" style={{ minHeight: '100vh', backgroundColor: '#f8f9fc' }}>
            {/* Elegant Sidebar Navigation */}
            <div className="bg-dark text-white p-3 d-flex flex-column shadow-sm" style={{ width: '280px' }}>
                <div className="d-flex align-items-center mb-4 px-2">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#2af" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="me-2"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
                    <span className="fs-5 fw-bold tracking-tight">Antigravity ERP</span>
                </div>
                
                <small className="text-muted text-uppercase fw-bold px-2 mb-2 font-monospace" style={{ fontSize: '0.7rem' }}>Commercial Monolith</small>
                
                <ul className="nav nav-pills flex-column mb-auto">
                    <li className="nav-item mb-1">
                        <button className={`nav-link w-100 text-start d-flex align-items-center py-2 ${activeTab === 'slabs' ? 'active bg-primary' : 'text-white opacity-75'}`} onClick={() => setActiveTab('slabs')}>
                            <span className="me-3">📐</span>
                            Inventory Engine
                        </button>
                    </li>
                    <li className="nav-item mb-1">
                        <button className={`nav-link w-100 text-start d-flex align-items-center py-2 ${activeTab === 'workflows' ? 'active bg-primary' : 'text-white opacity-75'}`} onClick={() => setActiveTab('workflows')}>
                            <span className="me-3">⛓️</span>
                            BPM Workflows
                        </button>
                    </li>
                    <li className="nav-item mb-1">
                        <button className={`nav-link w-100 text-start d-flex align-items-center py-2 ${activeTab === 'bookkeeping' ? 'active bg-primary' : 'text-white opacity-75'}`} onClick={() => setActiveTab('bookkeeping')}>
                            <span className="me-3">📊</span>
                            General Bookkeeping
                        </button>
                    </li>
                    <li className="nav-item mb-1">
                        <button className={`nav-link w-100 text-start d-flex align-items-center py-2 ${activeTab === 'reporting' ? 'active bg-primary' : 'text-white opacity-75'}`} onClick={() => setActiveTab('reporting')}>
                            <span className="me-3">🏢</span>
                            Reporting & BI Hub
                        </button>
                    </li>
                    {hasPermission('master.users.manage') && (
                        <li className="nav-item mb-1">
                            <button className={`nav-link w-100 text-start d-flex align-items-center py-2 ${activeTab === 'users' ? 'active bg-primary' : 'text-white opacity-75'}`} onClick={() => setActiveTab('users')}>
                                <span className="me-3">👥</span>
                                User & Role Manager
                            </button>
                        </li>
                    )}
                </ul>

                <hr className="text-secondary" />

                <div className="dropdown px-2">
                    <div className="d-flex align-items-center text-white text-decoration-none justify-content-between">
                        <div className="d-flex align-items-center">
                            <div className="rounded-circle bg-secondary d-flex justify-content-center align-items-center me-2 text-white font-monospace fw-bold" style={{ width: '32px', height: '32px', fontSize: '0.85rem' }}>
                                {user?.name?.substring(0, 2).toUpperCase() || 'US'}
                            </div>
                            <div>
                                <div className="fw-bold" style={{ fontSize: '0.85rem' }}>{user?.name || 'Operator'}</div>
                                <span className="text-muted font-monospace" style={{ fontSize: '0.75rem' }}>{user?.organizationName || 'Acme'}</span>
                            </div>
                        </div>
                        <button className="btn btn-sm btn-outline-danger px-2 py-1 font-monospace" style={{ fontSize: '0.7rem' }} onClick={handleLogout}>
                            Exit
                        </button>
                    </div>
                </div>
            </div>

            {/* Main Application Window */}
            <div className="flex-grow-1 d-flex flex-column">
                {/* Navbar */}
                <nav className="navbar navbar-expand navbar-light bg-white py-3 px-4 border-bottom shadow-sm">
                    <span className="navbar-brand mb-0 h1 fs-5 fw-bold text-dark">Building Materials Core Manager</span>
                    <ul className="navbar-nav ms-auto">
                        <li className="nav-item">
                            <span className="nav-link font-monospace text-muted" style={{ fontSize: '0.85rem' }}>Status: Production API Connected</span>
                        </li>
                    </ul>
                </nav>

                {/* Dashboard Main Content */}
                <div className="container-fluid p-4">
                    {activeTab === 'slabs' ? <InventoryManager /> : 
                     activeTab === 'workflows' ? <WorkflowMonitor /> : 
                     activeTab === 'bookkeeping' ? <LedgerReports /> : 
                     activeTab === 'reporting' ? <ReportingHub /> : 
                     activeTab === 'users' ? <UserManagement /> : (
                        <div className="text-center py-5">
                            <h4 className="text-muted">Domain view under construction.</h4>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

const rootEl = document.getElementById('app');
if (rootEl) {
    ReactDOM.createRoot(rootEl).render(
        <React.StrictMode>
            <App />
        </React.StrictMode>
    );
}