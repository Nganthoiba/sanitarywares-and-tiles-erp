import React, { useState } from 'react';
import { Link } from 'react-router-dom';

export default function HomePage() {
    const [hoveredCard, setHoveredCard] = useState(null);

    // Live Calculator State (Same as Landing Page)
    const [calcTab, setCalcTab] = useState('tiles');
    const [tileCalcMode, setTileCalcMode] = useState('forward'); // 'forward' | 'reverse'
    const [tileLength, setTileLength] = useState(600); // mm
    const [tileWidth, setTileWidth] = useState(600); // mm
    const [pcsPerBox, setPcsPerBox] = useState(4);
    const [boxCount, setBoxCount] = useState(50);
    const [tilePricePerPiece, setTilePricePerPiece] = useState(50); // ₹ per piece

    // Reverse Tile Calculation State
    const [targetAreaSqFt, setTargetAreaSqFt] = useState(500); // Target SQ.FT
    const [wastagePercent, setWastagePercent] = useState(5); // % Wastage

    // Granite Slab inputs
    const [slabLength, setSlabLength] = useState(10);
    const [slabLengthUnit, setSlabLengthUnit] = useState('FOOT'); // 'FOOT' or 'Inches'
    const [slabWidth, setSlabWidth] = useState(6);
    const [slabWidthUnit, setSlabWidthUnit] = useState('FOOT'); // 'FOOT' or 'Inches'
    const [ratePerSqft, setRatePerSqft] = useState(180); // ₹

    // Calculations for Forward Tiles
    const singleTileSqM = (tileLength / 1000) * (tileWidth / 1000);
    const coveragePerBoxSqM = singleTileSqM * pcsPerBox;
    const coveragePerBoxSqFt = coveragePerBoxSqM * 10.7639;
    const totalPieces = boxCount * pcsPerBox;
    const totalTileSqFt = boxCount * coveragePerBoxSqFt;
    const totalTileCost = totalPieces * tilePricePerPiece;

    // Calculations for Reverse Tiles (Area ➔ Boxes, Pieces & Cost)
    const effectiveAreaSqFt = targetAreaSqFt * (1 + (wastagePercent || 0) / 100);
    const requiredBoxes = coveragePerBoxSqFt > 0 ? Math.ceil(effectiveAreaSqFt / coveragePerBoxSqFt) : 0;
    const totalReversePieces = requiredBoxes * pcsPerBox;
    const actualDeliveredSqFt = requiredBoxes * coveragePerBoxSqFt;
    const totalReverseCost = totalReversePieces * tilePricePerPiece;

    // Calculations for Granite Slab
    const lengthInFeet = slabLengthUnit === 'Inches' ? slabLength / 12 : slabLength;
    const widthInFeet = slabWidthUnit === 'Inches' ? slabWidth / 12 : slabWidth;
    const slabSqFt = lengthInFeet * widthInFeet;
    const totalSlabValuation = slabSqFt * ratePerSqft;

    const modules = [
        {
            id: 'purchase',
            title: 'Purchase',
            tagline: 'Procurement & Vendor Supply Chain',
            icon: 'fa-cart-shopping',
            gradient: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
            bgGlow: 'rgba(16, 185, 129, 0.08)',
            borderColor: 'rgba(16, 185, 129, 0.25)',
            badgeBg: 'bg-emerald-subtle text-emerald',
            badgeText: 'Procurement Ready',
            description: 'Manage vendor procurement lifecycle, Purchase Orders (PO), Goods Receipt Notes (GRN), quality approvals, and supplier invoices.',
            features: ['Purchase Orders & PO Line Sync', 'Goods Receipt Notes (GRN)', 'Supplier Ledger & GST Tracking'],
            metrics: [
                { label: 'Active POs', value: '18' },
                { label: 'Pending GRNs', value: '4' }
            ],
            dummyLinkText: 'Explore Purchase Module',
            route: '/grn/new'
        },
        {
            id: 'sales',
            title: 'Sales',
            tagline: 'Billing, Quotations & Billing Allocation',
            icon: 'fa-cash-register',
            gradient: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
            bgGlow: 'rgba(99, 102, 241, 0.08)',
            borderColor: 'rgba(99, 102, 241, 0.25)',
            badgeBg: 'bg-indigo-subtle text-indigo',
            badgeText: 'Billing Active',
            description: 'Draft customer estimates, convert approved quotes into Tax Invoices, handle customer balances, and reserve stock in real-time.',
            features: ['Quotation to Invoice Pipeline', 'Instant Stock Allocation', 'Multi-Unit Pricing Engine'],
            metrics: [
                { label: 'Daily Quotes', value: '32' },
                { label: 'Invoices Issued', value: '142' }
            ],
            dummyLinkText: 'Launch Sales Console',
            route: '/product-variants'
        },
        {
            id: 'inventory',
            title: 'Inventory',
            tagline: 'Stock, Warehouse & Slab Measurement',
            icon: 'fa-boxes-stacked',
            gradient: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
            bgGlow: 'rgba(245, 158, 11, 0.08)',
            borderColor: 'rgba(245, 158, 11, 0.25)',
            badgeBg: 'bg-amber-subtle text-amber',
            badgeText: 'Multi-Warehouse',
            description: 'Real-time multi-branch stock levels, granite slab length x width physical dimensional tracking, and packaging box-to-sqft conversions.',
            features: ['Slab-by-Slab Measurement', 'Warehouse Rack & Shelf Mapping', 'UOM Unit Conversions'],
            metrics: [
                { label: 'Total Variants', value: '450+' },
                { label: 'Yards & Stores', value: '3' }
            ],
            dummyLinkText: 'Open Inventory Hub',
            route: '/inventory'
        },
        {
            id: 'reports',
            title: 'Reports',
            tagline: 'Financial Audits & Executive Analytics',
            icon: 'fa-chart-pie',
            gradient: 'linear-gradient(135deg, #06b6d4 0%, #0284c7 100%)',
            bgGlow: 'rgba(6, 182, 212, 0.08)',
            borderColor: 'rgba(6, 182, 212, 0.25)',
            badgeBg: 'bg-cyan-subtle text-cyan',
            badgeText: 'Real-time Analytics',
            description: 'Generate stock valuation statements, transactional audit trails, HSN tax summaries, and financial ledger reconciliation reports.',
            features: ['Financial Audit Log Engine', 'Stock Valuation & COGS', 'GST Tax Summary Export'],
            metrics: [
                { label: 'Audit Records', value: '100%' },
                { label: 'Ledger Status', value: 'Balanced' }
            ],
            dummyLinkText: 'View Analytics & Reports',
            route: '/reporting'
        }
    ];

    return (
        <div className="container-fluid py-4 px-4 animate__animated animate__fadeIn">
            {/* Header Hero Section */}
            <div 
                className="p-4 p-md-5 mb-5 rounded-4 shadow-sm text-white position-relative overflow-hidden"
                style={{
                    background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 50%, #0f172a 100%)',
                    border: '1px solid rgba(255, 255, 255, 0.1)'
                }}
            >
                {/* Decorative background ambient glows */}
                <div 
                    className="position-absolute rounded-circle" 
                    style={{ 
                        width: '350px', 
                        height: '350px', 
                        background: 'radial-gradient(circle, rgba(99,102,241,0.2) 0%, rgba(0,0,0,0) 70%)', 
                        top: '-100px', 
                        right: '-50px', 
                        pointerEvents: 'none' 
                    }} 
                />
                <div 
                    className="position-absolute rounded-circle" 
                    style={{ 
                        width: '300px', 
                        height: '300px', 
                        background: 'radial-gradient(circle, rgba(16,185,129,0.15) 0%, rgba(0,0,0,0) 70%)', 
                        bottom: '-100px', 
                        left: '20%', 
                        pointerEvents: 'none' 
                    }} 
                />

                <div className="row align-items-center position-relative" style={{ zIndex: 2 }}>
                    <div className="col-lg-8">
                        <div className="d-inline-flex align-items-center gap-2 px-3 py-1.5 mb-3 rounded-pill bg-white bg-opacity-10 border border-white border-opacity-10 backdrop-blur">
                            <span className="spinner-grow spinner-grow-sm text-emerald" style={{ width: '8px', height: '8px' }} />
                            <span className="small text-white-50 font-monospace text-uppercase" style={{ letterSpacing: '1px', fontSize: '0.75rem' }}>
                                Sanitarywares & Tiles ERP Management Hub
                            </span>
                        </div>
                        <h1 className="fw-extrabold display-6 text-white mb-2" style={{ letterSpacing: '-0.5px' }}>
                            Enterprise Resource Overview
                        </h1>
                        <p className="lead text-white-50 mb-4" style={{ maxWidth: '650px', fontSize: '1.05rem', lineHeight: '1.6' }}>
                            Seamless multi-branch operations for procurement, inventory conversions, sales invoicing, and compliance reporting.
                        </p>
                        
                        <div className="d-flex flex-wrap align-items-center gap-3">
                            <div className="d-flex align-items-center gap-2 px-3 py-2 bg-white bg-opacity-10 rounded-3 border border-white border-opacity-10">
                                <i className="fa-solid fa-building-circle-check text-emerald fs-5"></i>
                                <div>
                                    <div className="text-white-50 text-uppercase font-monospace" style={{ fontSize: '0.65rem' }}>Multi-Branch Status</div>
                                    <div className="fw-bold text-white small">All Systems Operational</div>
                                </div>
                            </div>
                            <div className="d-flex align-items-center gap-2 px-3 py-2 bg-white bg-opacity-10 rounded-3 border border-white border-opacity-10">
                                <i className="fa-solid fa-boxes-packing text-amber fs-5"></i>
                                <div>
                                    <div className="text-white-50 text-uppercase font-monospace" style={{ fontSize: '0.65rem' }}>Inventory Engine</div>
                                    <div className="fw-bold text-white small">Tiles & Slabs Active</div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="col-lg-4 d-none d-lg-block text-end">
                        <div 
                            className="p-4 rounded-4 bg-white bg-opacity-5 border border-white border-opacity-10 backdrop-blur text-start d-inline-block shadow-lg"
                            style={{ maxWidth: '320px' }}
                        >
                            <div className="text-emerald font-monospace fw-bold mb-1" style={{ fontSize: '0.8rem' }}>
                                <i className="fa-solid fa-shield-halved me-1"></i> ENTERPRISE SUITE
                            </div>
                            <div className="text-white fw-bold h5 mb-2">Sanitary & Tiles ERP</div>
                            <p className="text-white-50 small mb-0" style={{ fontSize: '0.82rem' }}>
                                Fully integrated multi-unit commercial engine with automated tax profile allocation and stock ledger auditing.
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Modules Grid Section Title */}
            <div className="d-flex align-items-center justify-content-between mb-4">
                <div>
                    <h4 className="fw-bold text-dark mb-1">Core Modules & Operations</h4>
                    <p className="text-muted small mb-0">Select an operational domain to launch console or view reports.</p>
                </div>
                <span className="badge bg-light text-secondary border px-3 py-2 font-monospace" style={{ fontSize: '0.75rem' }}>
                    4 Modules Configured
                </span>
            </div>

            {/* 4 Cards Grid */}
            <div className="row g-4 mb-5">
                {modules.map((mod) => {
                    const isHovered = hoveredCard === mod.id;
                    return (
                        <div key={mod.id} className="col-12 col-md-6 col-xl-3">
                            <div
                                className="card h-100 border-0 shadow-sm position-relative overflow-hidden"
                                onMouseEnter={() => setHoveredCard(mod.id)}
                                onMouseLeave={() => setHoveredCard(null)}
                                style={{
                                    borderRadius: '16px',
                                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                    transform: isHovered ? 'translateY(-6px)' : 'translateY(0)',
                                    boxShadow: isHovered 
                                        ? '0 20px 30px -10px rgba(0,0,0,0.12), 0 10px 15px -5px rgba(0,0,0,0.04)' 
                                        : '0 4px 12px rgba(0,0,0,0.05)',
                                    border: isHovered ? `1px solid ${mod.borderColor}` : '1px solid #e2e8f0',
                                    backgroundColor: '#ffffff'
                                }}
                            >
                                {/* Top Accent Gradient Bar */}
                                <div 
                                    style={{ 
                                        height: '5px', 
                                        background: mod.gradient,
                                        transition: 'height 0.3s ease'
                                    }} 
                                />

                                <div className="card-body p-4 d-flex flex-column justify-content-between">
                                    <div>
                                        {/* Card Header: Icon & Badge */}
                                        <div className="d-flex align-items-center justify-content-between mb-3">
                                            <div
                                                className="d-flex align-items-center justify-content-center text-white shadow-sm"
                                                style={{
                                                    width: '52px',
                                                    height: '52px',
                                                    borderRadius: '14px',
                                                    background: mod.gradient,
                                                    fontSize: '1.35rem',
                                                    transition: 'transform 0.3s ease',
                                                    transform: isHovered ? 'scale(1.08)' : 'scale(1)'
                                                }}
                                            >
                                                <i className={`fa-solid ${mod.icon}`}></i>
                                            </div>
                                            <span 
                                                className="badge px-2.5 py-1.5 rounded-pill font-monospace"
                                                style={{ 
                                                    backgroundColor: mod.bgGlow, 
                                                    color: mod.borderColor.replace('0.25', '1'),
                                                    border: `1px solid ${mod.borderColor}`,
                                                    fontSize: '0.7rem'
                                                }}
                                            >
                                                {mod.badgeText}
                                            </span>
                                        </div>

                                        {/* Module Title & Tagline */}
                                        <h4 className="fw-bold text-dark mb-1 d-flex align-items-center justify-content-between">
                                            <span>{mod.title}</span>
                                            <i 
                                                className="fa-solid fa-chevron-right text-muted fs-6" 
                                                style={{ 
                                                    transition: 'transform 0.3s ease',
                                                    transform: isHovered ? 'translateX(4px)' : 'translateX(0)',
                                                    opacity: isHovered ? 1 : 0.4
                                                }}
                                            />
                                        </h4>
                                        <p className="text-primary fw-semibold small mb-2" style={{ fontSize: '0.82rem' }}>
                                            {mod.tagline}
                                        </p>

                                        {/* Description */}
                                        <p className="text-muted small mb-3" style={{ fontSize: '0.84rem', lineHeight: '1.5' }}>
                                            {mod.description}
                                        </p>

                                        {/* Key Features List */}
                                        <div className="mb-4 pt-2 border-top">
                                            {mod.features.map((feat, idx) => (
                                                <div key={idx} className="d-flex align-items-center text-secondary mb-1.5" style={{ fontSize: '0.78rem' }}>
                                                    <i className="fa-solid fa-circle-check text-emerald me-2" style={{ fontSize: '0.7rem' }}></i>
                                                    <span>{feat}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Footer Section: Dummy Link */}
                                    <div className="pt-3 border-top">
                                        <Link 
                                            to={mod.route}
                                            className="d-flex align-items-center justify-content-between text-decoration-none fw-bold small p-2.5 rounded-3"
                                            style={{
                                                backgroundColor: isHovered ? mod.bgGlow : '#f8fafc',
                                                color: isHovered ? '#0f172a' : '#475569',
                                                transition: 'all 0.2s ease',
                                                fontSize: '0.85rem'
                                            }}
                                            onClick={(e) => {
                                                if (mod.route === '#') e.preventDefault();
                                            }}
                                        >
                                            <span className="d-flex align-items-center gap-1.5">
                                                <i className={`fa-solid ${mod.icon} opacity-75 me-1`}></i>
                                                {mod.dummyLinkText}
                                            </span>
                                            <i 
                                                className="fa-solid fa-arrow-right"
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

            {/* Interactive Tile & Granite/Marble Calculator Section */}
            <div className="card border-0 shadow-sm p-4 p-md-5 mb-5 rounded-4" style={{ borderRadius: '16px' }}>
                <div className="d-flex flex-wrap align-items-center justify-content-between mb-4 pb-3 border-bottom">
                    <div>
                        <h4 className="fw-bold text-dark mb-1 d-flex align-items-center">
                            <i className="fa-solid fa-calculator text-primary me-2.5"></i>
                            Tile & Granite/Marble Calculator
                        </h4>
                        <p className="text-muted small mb-0">Calculate real-world inventory coverage, box conversions, slab area, and total cost estimation.</p>
                    </div>
                    <span className="badge bg-success-subtle text-success border border-success px-3 py-2 rounded-pill font-monospace" style={{ fontSize: '0.78rem' }}>
                        <i className="fa-solid fa-bolt me-1"></i>Real-Time Math Engine
                    </span>
                </div>

                {/* Tab selector */}
                <ul className="nav nav-pills mb-4 gap-2 border-bottom pb-3">
                    <li className="nav-item">
                        <button 
                            className={`nav-link px-4 py-2 fw-bold ${calcTab === 'tiles' ? 'active bg-primary' : 'bg-light text-secondary'}`} 
                            onClick={() => setCalcTab('tiles')}
                            style={{ borderRadius: '10px' }}
                        >
                            <i className="fa-solid fa-boxes-stacked me-2"></i>Tiles (Box / SQFT)
                        </button>
                    </li>
                    <li className="nav-item">
                        <button 
                            className={`nav-link px-4 py-2 fw-bold ${calcTab === 'granite' ? 'active bg-primary' : 'bg-light text-secondary'}`} 
                            onClick={() => setCalcTab('granite')}
                            style={{ borderRadius: '10px' }}
                        >
                            <i className="fa-solid fa-ruler-combined me-2"></i>Granite & Marble Slab Area
                        </button>
                    </li>
                </ul>

                {calcTab === 'tiles' ? (
                    <div className="animate__animated animate__fadeIn">
                        {/* Sub-mode switcher */}
                        <div className="d-flex justify-content-between align-items-center mb-4 p-2 bg-light rounded-3 border">
                            <span className="small fw-semibold text-secondary ms-2" style={{ fontSize: '0.82rem' }}>
                                <i className="fa-solid fa-sliders text-primary me-1.5"></i>Calculation Direction:
                            </span>
                            <div className="btn-group btn-group-sm" role="group">
                                <button 
                                    type="button" 
                                    className={`btn px-3 ${tileCalcMode === 'forward' ? 'btn-primary active fw-bold' : 'btn-outline-secondary'}`} 
                                    onClick={() => setTileCalcMode('forward')}
                                    style={{ fontSize: '0.8rem', borderRadius: '8px 0 0 8px' }}
                                >
                                    <i className="fa-solid fa-boxes-packing me-1.5"></i>Box ➔ SQ.FT & Cost
                                </button>
                                <button 
                                    type="button" 
                                    className={`btn px-3 ${tileCalcMode === 'reverse' ? 'btn-primary active fw-bold' : 'btn-outline-secondary'}`} 
                                    onClick={() => setTileCalcMode('reverse')}
                                    style={{ fontSize: '0.8rem', borderRadius: '0 8px 8px 0' }}
                                >
                                    <i className="fa-solid fa-calculator me-1.5"></i>SQ.FT ➔ Boxes & Cost
                                </button>
                            </div>
                        </div>

                        {tileCalcMode === 'forward' ? (
                            <div>
                                <div className="row g-3 mb-4">
                                    <div className="col-12 col-md-4">
                                        <label className="form-label small fw-bold text-secondary">Tile Size (mm)</label>
                                        <div className="input-group input-group-sm">
                                            <input type="number" className="form-control fw-bold" value={tileLength} onChange={(e) => setTileLength(Number(e.target.value))} />
                                            <span className="input-group-text">×</span>
                                            <input type="number" className="form-control fw-bold" value={tileWidth} onChange={(e) => setTileWidth(Number(e.target.value))} />
                                        </div>
                                    </div>
                                    <div className="col-6 col-md-2">
                                        <label className="form-label small fw-bold text-secondary">Pcs/Box</label>
                                        <input type="number" className="form-control form-control-sm fw-bold" value={pcsPerBox} onChange={(e) => setPcsPerBox(Number(e.target.value))} />
                                    </div>
                                    <div className="col-6 col-md-3">
                                        <label className="form-label small fw-bold text-secondary">Box Count</label>
                                        <input type="number" className="form-control form-control-sm fw-bold text-primary" value={boxCount} onChange={(e) => setBoxCount(Number(e.target.value))} />
                                    </div>
                                    <div className="col-12 col-md-3">
                                        <label className="form-label small fw-bold text-secondary">Price/Piece (₹)</label>
                                        <input type="number" className="form-control form-control-sm fw-bold text-success" value={tilePricePerPiece} onChange={(e) => setTilePricePerPiece(Number(e.target.value))} />
                                    </div>
                                </div>

                                <div className="p-4 bg-light rounded-3 border">
                                    <div className="row g-3 text-center">
                                        <div className="col-6 col-md-3 border-end">
                                            <small className="text-muted d-block text-uppercase fw-semibold" style={{ fontSize: '0.72rem' }}>Coverage / Box</small>
                                            <span className="fs-5 fw-extrabold text-dark">{coveragePerBoxSqFt.toFixed(2)} SQ.FT</span>
                                            <small className="d-block text-secondary">({coveragePerBoxSqM.toFixed(2)} SQ.M)</small>
                                        </div>
                                        <div className="col-6 col-md-3 border-end">
                                            <small className="text-muted d-block text-uppercase fw-semibold" style={{ fontSize: '0.72rem' }}>Total Stock Pcs</small>
                                            <span className="fs-5 fw-extrabold text-info">{totalPieces} PCS</span>
                                            <small className="d-block text-secondary">({boxCount} Boxes)</small>
                                        </div>
                                        <div className="col-6 col-md-3 border-end">
                                            <small className="text-muted d-block text-uppercase fw-semibold" style={{ fontSize: '0.72rem' }}>Total Coverage</small>
                                            <span className="fs-5 fw-extrabold text-primary">{totalTileSqFt.toFixed(1)} SQ.FT</span>
                                            <small className="d-block text-primary">Auto-Converted</small>
                                        </div>
                                        <div className="col-6 col-md-3">
                                            <small className="text-muted d-block text-uppercase fw-semibold" style={{ fontSize: '0.72rem' }}>Total Cost</small>
                                            <span className="fs-5 fw-extrabold text-success">₹{Math.round(totalTileCost).toLocaleString()}</span>
                                            <small className="d-block text-success">({(tilePricePerPiece * pcsPerBox).toFixed(0)} ₹/Box)</small>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div>
                                <div className="row g-3 mb-4">
                                    <div className="col-12 col-md-3">
                                        <label className="form-label small fw-bold text-secondary">Target Area (SQ.FT)</label>
                                        <input type="number" className="form-control form-control-sm fw-bold text-primary" value={targetAreaSqFt} onChange={(e) => setTargetAreaSqFt(Number(e.target.value))} />
                                    </div>
                                    <div className="col-12 col-md-4">
                                        <label className="form-label small fw-bold text-secondary">Tile Size (mm)</label>
                                        <div className="input-group input-group-sm">
                                            <input type="number" className="form-control fw-bold" value={tileLength} onChange={(e) => setTileLength(Number(e.target.value))} />
                                            <span className="input-group-text">×</span>
                                            <input type="number" className="form-control fw-bold" value={tileWidth} onChange={(e) => setTileWidth(Number(e.target.value))} />
                                        </div>
                                    </div>
                                    <div className="col-4 col-md-2">
                                        <label className="form-label small fw-bold text-secondary">Pcs/Box</label>
                                        <input type="number" className="form-control form-control-sm fw-bold" value={pcsPerBox} onChange={(e) => setPcsPerBox(Number(e.target.value))} />
                                    </div>
                                    <div className="col-4 col-md-1.5">
                                        <label className="form-label small fw-bold text-secondary">Wastage %</label>
                                        <input type="number" className="form-control form-control-sm fw-bold text-warning" value={wastagePercent} onChange={(e) => setWastagePercent(Number(e.target.value))} />
                                    </div>
                                    <div className="col-4 col-md-1.5">
                                        <label className="form-label small fw-bold text-secondary">Price/Piece (₹)</label>
                                        <input type="number" className="form-control form-control-sm fw-bold text-success" value={tilePricePerPiece} onChange={(e) => setTilePricePerPiece(Number(e.target.value))} />
                                    </div>
                                </div>

                                <div className="p-4 bg-light rounded-3 border">
                                    <div className="row g-3 text-center">
                                        <div className="col-6 col-md-3 border-end">
                                            <small className="text-muted d-block text-uppercase fw-semibold" style={{ fontSize: '0.72rem' }}>Required Boxes</small>
                                            <span className="fs-5 fw-extrabold text-primary">{requiredBoxes} BOXES</span>
                                            <small className="d-block text-secondary">({coveragePerBoxSqFt.toFixed(2)} SQ.FT/Box)</small>
                                        </div>
                                        <div className="col-6 col-md-3 border-end">
                                            <small className="text-muted d-block text-uppercase fw-semibold" style={{ fontSize: '0.72rem' }}>Total Tiles Pcs</small>
                                            <span className="fs-5 fw-extrabold text-info">{totalReversePieces} PCS</span>
                                            <small className="d-block text-secondary">({pcsPerBox} Pcs/Box)</small>
                                        </div>
                                        <div className="col-6 col-md-3 border-end">
                                            <small className="text-muted d-block text-uppercase fw-semibold" style={{ fontSize: '0.72rem' }}>Delivered Coverage</small>
                                            <span className="fs-5 fw-extrabold text-dark">{actualDeliveredSqFt.toFixed(1)} SQ.FT</span>
                                            <small className="d-block text-warning">({wastagePercent}% Wastage Incl.)</small>
                                        </div>
                                        <div className="col-6 col-md-3">
                                            <small className="text-muted d-block text-uppercase fw-semibold" style={{ fontSize: '0.72rem' }}>Total Estimated Cost</small>
                                            <span className="fs-5 fw-extrabold text-success">₹{Math.round(totalReverseCost).toLocaleString()}</span>
                                            <small className="d-block text-success">({(tilePricePerPiece * pcsPerBox).toFixed(0)} ₹/Box)</small>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="animate__animated animate__fadeIn">
                        <div className="row g-3 mb-4">
                            <div className="col-md-6">
                                <label className="form-label small fw-bold text-secondary">Slab Length</label>
                                <div className="input-group input-group-sm">
                                    <input type="number" className="form-control fw-bold" value={slabLength} onChange={(e) => setSlabLength(Number(e.target.value))} />
                                    <select className="form-select form-select-sm fw-bold border-secondary-subtle" value={slabLengthUnit} onChange={(e) => setSlabLengthUnit(e.target.value)} style={{ maxWidth: '105px' }}>
                                        <option value="FOOT">FOOT</option>
                                        <option value="Inches">Inches</option>
                                    </select>
                                </div>
                            </div>
                            <div className="col-md-6">
                                <label className="form-label small fw-bold text-secondary">Slab Width</label>
                                <div className="input-group input-group-sm">
                                    <input type="number" className="form-control fw-bold" value={slabWidth} onChange={(e) => setSlabWidth(Number(e.target.value))} />
                                    <select className="form-select form-select-sm fw-bold border-secondary-subtle" value={slabWidthUnit} onChange={(e) => setSlabWidthUnit(e.target.value)} style={{ maxWidth: '105px' }}>
                                        <option value="FOOT">FOOT</option>
                                        <option value="Inches">Inches</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        <div className="mb-4">
                            <label className="form-label small fw-bold text-secondary">Commercial Rate (₹ / SQ.FT)</label>
                            <input type="number" className="form-control form-control-sm fw-bold text-warning" value={ratePerSqft} onChange={(e) => setRatePerSqft(Number(e.target.value))} />
                        </div>

                        <div className="p-4 bg-light rounded-3 border">
                            <div className="row g-3 text-center">
                                <div className="col-md-4 border-end">
                                    <small className="text-muted d-block text-uppercase fw-semibold" style={{ fontSize: '0.72rem' }}>Dimensions</small>
                                    <span className="fs-5 fw-bold text-dark">{slabLength} {slabLengthUnit} × {slabWidth} {slabWidthUnit}</span>
                                </div>
                                <div className="col-md-4 border-end">
                                    <small className="text-muted d-block text-uppercase fw-semibold" style={{ fontSize: '0.72rem' }}>Total Stone Area</small>
                                    <span className="fs-5 fw-extrabold text-primary">{slabSqFt.toFixed(2)} SQ.FT</span>
                                </div>
                                <div className="col-md-4">
                                    <small className="text-muted d-block text-uppercase fw-semibold" style={{ fontSize: '0.72rem' }}>Total Valuation</small>
                                    <span className="fs-5 fw-extrabold text-success">₹{Math.round(totalSlabValuation).toLocaleString()}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Quick Workflow Stepper Footer Banner */}
            <div className="p-4 rounded-4 bg-white border shadow-sm mb-4">
                <div className="row align-items-center">
                    <div className="col-md-8">
                        <div className="d-flex align-items-center gap-3">
                            <div className="p-3 bg-primary-subtle text-primary rounded-3">
                                <i className="fa-solid fa-diagram-project fs-3"></i>
                            </div>
                            <div>
                                <h6 className="fw-bold text-dark mb-1">Integrated Supply Chain Workflow</h6>
                                <p className="text-muted small mb-0">
                                    From Purchase Order (PO) ➔ Goods Receipt Note (GRN) ➔ Multi-Warehouse Inventory ➔ Sales Billing & Audit.
                                </p>
                            </div>
                        </div>
                    </div>
                    <div className="col-md-4 text-md-end mt-3 mt-md-0">
                        <Link to="/grn/new" className="btn btn-sm btn-outline-primary px-3 me-2">
                            <i className="fa-solid fa-file-invoice me-1"></i> New GRN Receipt
                        </Link>
                        <Link to="/inventory" className="btn btn-sm btn-primary px-3 text-white">
                            <i className="fa-solid fa-boxes-stacked me-1"></i> View Inventory
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
