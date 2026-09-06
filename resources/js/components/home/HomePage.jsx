import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import TileGraniteCalculator from './TileGraniteCalculator';

export default function HomePage() {
    const [hoveredCard, setHoveredCard] = useState(null);

    const modules = [
        {
            id: 'purchase',
            title: 'Purchase & GRN',
            tagline: 'Procurement & Vendor Supply Chain',
            icon: 'fa-cart-shopping',
            accentColor: '#10b981',
            bgSubtle: '#ecfdf5',
            badgeText: 'Procurement',
            description: 'Streamline vendor POs, Goods Receipt Notes (GRN), item quality inspection, and supplier ledgers.',
            features: [], //['Purchase Orders & Line Sync', 'Goods Receipt Notes (GRN)', 'Supplier Ledger & GST'],
            route: '/grn/new',
            linkText: 'New GRN Receipt'
        },
        {
            id: 'sales',
            title: 'Sales & Billing',
            tagline: 'Quotations, Estimates & Invoicing',
            icon: 'fa-cash-register',
            accentColor: '#6366f1',
            bgSubtle: '#eef2ff',
            badgeText: 'Billing Active',
            description: 'Generate estimates, convert quotes into Tax Invoices, manage customer balances, and reserve stock.',
            features: [],//['Quotation to Invoice Pipeline', 'Instant Stock Allocation', 'Multi-Unit Pricing Engine'],
            route: '/sales',
            linkText: 'Launch Sales Console'
        },
        {
            id: 'inventory',
            title: 'Inventory Hub',
            tagline: 'Stock, Warehouse & Slab Tracking',
            icon: 'fa-boxes-stacked',
            accentColor: '#f59e0b',
            bgSubtle: '#fffbeb',
            badgeText: 'Multi-Warehouse',
            description: 'Real-time stock monitoring, granite slab physical dimensions (L x W), and box-to-sqft unit conversions.',
            features: [],//['Slab-by-Slab Measurement', 'Warehouse Rack & Location', 'UOM Unit Conversions'],
            route: '/inventory',
            linkText: 'View Inventory Stock'
        },
        {
            id: 'reports',
            title: 'Reports & Audit',
            tagline: 'Financial Audits & Executive BI',
            icon: 'fa-chart-pie',
            accentColor: '#06b6d4',
            bgSubtle: '#ecfeff',
            badgeText: 'Real-Time BI',
            description: 'Generate stock valuation, transactional audit trails, HSN tax summaries, and financial ledger reports.',
            features: [], //['Financial Audit Log Engine', 'Stock Valuation & COGS', 'GST Tax Summary Export'],
            route: '/reporting',
            linkText: 'Open BI Reporting'
        }
    ];

    return (
        <div className="container-fluid py-4 px-3 px-md-4 animate__animated animate__fadeIn" style={{ maxWidth: '1440px' }}>            {/* Section Header */}
            <div className="d-flex align-items-center justify-content-between mb-3 px-1">
                <div>
                    <h5 className="fw-bold text-dark mb-0 d-flex align-items-center gap-2">
                        <i className="fa-solid fa-grid-2 text-primary" style={{ fontSize: '0.95rem' }}></i>
                        Operational Modules
                    </h5>
                    <p className="text-muted small mb-0" style={{ fontSize: '0.82rem' }}>Quick navigation across core business functions</p>
                </div>
                <span className="badge bg-light text-secondary border fw-medium px-2.5 py-1.5 font-monospace" style={{ fontSize: '0.72rem' }}>
                    4 Core Modules
                </span>
            </div>

            {/* Minimalist 4 Modules Cards Grid */}
            <div className="row g-3 mb-4">
                {modules.map((mod) => {
                    const isHovered = hoveredCard === mod.id;
                    return (
                        <div key={mod.id} className="col-12 col-md-6 col-xl-3">
                            <div
                                className="card h-100 border-0 shadow-sm position-relative"
                                onMouseEnter={() => setHoveredCard(mod.id)}
                                onMouseLeave={() => setHoveredCard(null)}
                                style={{
                                    borderRadius: '14px',
                                    transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                                    transform: isHovered ? 'translateY(-4px)' : 'translateY(0)',
                                    backgroundColor: '#ffffff',
                                    border: isHovered ? `1px solid ${mod.accentColor}` : '1px solid #e2e8f0',
                                    boxShadow: isHovered 
                                        ? '0 12px 24px -8px rgba(0,0,0,0.08)' 
                                        : '0 2px 6px rgba(0,0,0,0.03)'
                                }}
                            >
                                <div className="card-body p-4 d-flex flex-column justify-content-between">
                                    <div>
                                        {/* Card Header: Icon & Badge */}
                                        <div className="d-flex align-items-center justify-content-between mb-3">
                                            <div
                                                className="d-flex align-items-center justify-content-center rounded-3"
                                                style={{
                                                    width: '46px',
                                                    height: '46px',
                                                    backgroundColor: mod.bgSubtle,
                                                    color: mod.accentColor,
                                                    fontSize: '1.2rem',
                                                    transition: 'transform 0.25s ease',
                                                    transform: isHovered ? 'scale(1.06)' : 'scale(1)'
                                                }}
                                            >
                                                <i className={`fa-solid ${mod.icon}`}></i>
                                            </div>
                                            <span 
                                                className="badge px-2.5 py-1 rounded-pill font-monospace"
                                                style={{ 
                                                    backgroundColor: mod.bgSubtle, 
                                                    color: mod.accentColor,
                                                    fontSize: '0.68rem',
                                                    fontWeight: 600
                                                }}
                                            >
                                                {mod.badgeText}
                                            </span>
                                        </div>

                                        {/* Module Title & Tagline */}
                                        <h5 className="fw-bold text-dark mb-1" style={{ fontSize: '1.05rem' }}>
                                            {mod.title}
                                        </h5>
                                        <p className="fw-medium small mb-2" style={{ color: mod.accentColor, fontSize: '0.78rem' }}>
                                            {mod.tagline}
                                        </p>

                                        {/* Description */}
                                        <p className="text-secondary small mb-3" style={{ fontSize: '0.82rem', lineHeight: '1.5' }}>
                                            {mod.description}
                                        </p>

                                        {/* Features List */}
                                        {/* <div className="pt-2 border-top mb-3">
                                            {mod.features.map((feat, idx) => (
                                                <div key={idx} className="d-flex align-items-center text-muted mb-1" style={{ fontSize: '0.76rem' }}>
                                                    <i className="fa-solid fa-check text-success me-2" style={{ fontSize: '0.65rem' }}></i>
                                                    <span>{feat}</span>
                                                </div>
                                            ))}
                                        </div> */}
                                    </div>

                                    {/* Action Link Button */}
                                    <div className="pt-2">
                                        <Link 
                                            to={mod.route}
                                            className="btn w-100 btn-sm d-flex align-items-center justify-content-between fw-semibold px-3 py-2 rounded-3 text-decoration-none"
                                            style={{
                                                backgroundColor: isHovered ? mod.bgSubtle : '#f8fafc',
                                                color: isHovered ? mod.accentColor : '#475569',
                                                border: `1px solid ${isHovered ? mod.accentColor + '40' : '#e2e8f0'}`,
                                                transition: 'all 0.2s ease',
                                                fontSize: '0.8rem'
                                            }}
                                        >
                                            <span>{mod.linkText}</span>
                                            <i 
                                                className="fa-solid fa-arrow-right-long"
                                                style={{
                                                    transition: 'transform 0.2s ease',
                                                    transform: isHovered ? 'translateX(3px)' : 'translateX(0)'
                                                }}
                                            />
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Standalone Calculator Section */}
            <div className="mb-4">
                <TileGraniteCalculator />
            </div>

            {/* Minimalist Workflow Stepper Banner */}
            <div className="p-4 rounded-4 bg-white border shadow-sm">
                <div className="row align-items-center">
                    <div className="col-md-8">
                        <div className="d-flex align-items-center gap-3">
                            <div className="p-3 bg-light text-primary rounded-3 border">
                                <i className="fa-solid fa-diagram-project fs-4"></i>
                            </div>
                            <div>
                                <h6 className="fw-bold text-dark mb-1">Integrated Supply Chain Workflow</h6>
                                <p className="text-secondary small mb-0" style={{ fontSize: '0.82rem' }}>
                                    Purchase Orders ➔ GRN Verification ➔ Multi-Warehouse Inventory ➔ Sales & Tax Invoices
                                </p>
                            </div>
                        </div>
                    </div>
                    <div className="col-md-4 text-md-end mt-3 mt-md-0">
                        <Link to="/grn/new" className="btn btn-sm btn-outline-secondary rounded-pill px-3 me-2 fw-medium" style={{ fontSize: '0.8rem' }}>
                            <i className="fa-solid fa-plus me-1"></i> New GRN
                        </Link>
                        <Link to="/inventory" className="btn btn-sm btn-primary rounded-pill px-3 text-white fw-medium" style={{ fontSize: '0.8rem' }}>
                            <i className="fa-solid fa-boxes-stacked me-1"></i> View Inventory
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
