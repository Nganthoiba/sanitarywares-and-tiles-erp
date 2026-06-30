import React, { useState } from 'react';
import ReactDOM from 'react-dom/client';
import SlabInventoryView from './components/SlabInventoryView';
import InventoryManager from './components/InventoryManager';
import WorkflowMonitor from './components/WorkflowMonitor';
import LedgerReports from './components/LedgerReports';
import ReportingHub from './components/ReportingHub';

import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.bundle.min.js';

function App() {
    const [activeTab, setActiveTab] = useState('slabs');

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
                        <button className="nav-link text-white w-100 text-start d-flex align-items-center opacity-75 py-2">
                            <span className="me-3 opacity-75">🏢</span>
                            Master Configurations
                        </button>
                    </li>
                    <li className="nav-item mb-1">
                        <button className="nav-link text-white w-100 text-start d-flex align-items-center opacity-75 py-2">
                            <span className="me-3 opacity-75">📦</span>
                            Product Catalog
                        </button>
                    </li>
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
                        <button className="nav-link text-white w-100 text-start d-flex align-items-center opacity-75 py-2">
                            <span className="me-3 opacity-75">📥</span>
                            Purchase Inbound
                        </button>
                    </li>
                    <li className="nav-item mb-1">
                        <button className="nav-link text-white w-100 text-start d-flex align-items-center opacity-75 py-2">
                            <span className="me-3 opacity-75">📤</span>
                            Sales & Dispatches
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
                </ul>

                <hr className="text-secondary" />

                <div className="dropdown px-2">
                    <div className="d-flex align-items-center text-white text-decoration-none">
                        <div className="rounded-circle bg-secondary d-flex justify-content-center align-items-center me-2 text-white font-monospace fw-bold" style={{ width: '32px', height: '32px', fontSize: '0.85rem' }}>AG</div>
                        <div>
                            <div className="fw-bold" style={{ fontSize: '0.85rem' }}>Antigravity Operator</div>
                            <span className="text-muted font-monospace" style={{ fontSize: '0.75rem' }}>Org ID: #01</span>
                        </div>
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
                    {activeTab === 'slabs' ? <InventoryManager /> : activeTab === 'workflows' ? <WorkflowMonitor /> : activeTab === 'bookkeeping' ? <LedgerReports /> : activeTab === 'reporting' ? <ReportingHub /> : (
                        <div className="text-center py-5">
                            <h4 className="text-muted">Domain view under construction.</h4>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

ReactDOM.createRoot(
    document.getElementById('app')
).render(
    <React.StrictMode>
        <App />
    </React.StrictMode>
);