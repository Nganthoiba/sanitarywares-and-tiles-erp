import React, { useState } from 'react';

export default function LandingPage({ onNavigateToLogin, onNavigateToRegister }) {
  // Live Sandbox state
  const [calcTab, setCalcTab] = useState('tiles');
  const [tileLength, setTileLength] = useState(600); // mm
  const [tileWidth, setTileWidth] = useState(600); // mm
  const [pcsPerBox, setPcsPerBox] = useState(4);
  const [boxCount, setBoxCount] = useState(50);

  // Granite Slab inputs
  const [slab1Length, setSlab1Length] = useState(120); // in
  const [slab1Width, setSlab1Width] = useState(72); // in
  const [slab2Length, setSlab2Length] = useState(118); // in
  const [slab2Width, setSlab2Width] = useState(70); // in
  const [ratePerSqft, setRatePerSqft] = useState(180); // ₹

  // Calculations for Sandbox
  const singleTileSqM = (tileLength / 1000) * (tileWidth / 1000);
  const coveragePerBoxSqM = singleTileSqM * pcsPerBox;
  const coveragePerBoxSqFt = coveragePerBoxSqM * 10.7639;
  const totalPieces = boxCount * pcsPerBox;
  const totalTileSqFt = boxCount * coveragePerBoxSqFt;

  const slab1SqFt = (slab1Length * slab1Width) / 144;
  const slab2SqFt = (slab2Length * slab2Width) / 144;
  const totalSlabSqFt = slab1SqFt + slab2SqFt;
  const totalSlabValuation = totalSlabSqFt * ratePerSqft;

  // Pipeline Stepper state
  const [activeStep, setActiveStep] = useState(0);

  // Role Persona Switcher state
  const [activeRole, setActiveRole] = useState('store-admin');

  // FAQ Accordion state
  const [openFaq, setOpenFaq] = useState(0);

  const pipelineSteps = [
    {
      id: 'po',
      title: 'Supplier Purchase Order',
      statusBadge: 'PO Lifecycle: DRAFT ➔ APPROVED ➔ SENT',
      badgeColor: 'bg-primary-subtle text-primary border-primary',
      icon: 'fa-file-signature',
      description: 'Formal commercial request capturing vendor rates, CGST/SGST/IGST tax profiles, item line discounts, and target branch dispatch schedules.',
      highlights: ['Line-item GST auto-splitting', 'Multi-level PO authorization', 'Expected delivery tracking']
    },
    {
      id: 'grn',
      title: 'Goods Receipt Note (GRN)',
      statusBadge: 'GRN Status: PARTIALLY / FULLY RECEIVED',
      badgeColor: 'bg-info-subtle text-info border-info',
      icon: 'fa-truck-ramp-box',
      description: 'Records actual physical warehouse arrivals. Automatically correlates received counts against PO line items to update remaining balance.',
      highlights: ['PO vs Received balance calculation', 'Direct GRN for emergency cash stock', 'Quality inspection flags']
    },
    {
      id: 'inventory',
      title: 'Multi-Unit Inventory Engine',
      statusBadge: 'UOM Engine: BOX / PCS / SQFT / SLABS',
      badgeColor: 'bg-success-subtle text-success border-success',
      icon: 'fa-boxes-stacked',
      description: 'Real-time multi-branch inventory updates with cross-dimension commercial conversions (Box to Sq.Ft) and slab-by-slab stone dimensional tracking.',
      highlights: ['Automatic box coverage math', 'Rack & Shelf storage mapping', 'Multi-warehouse stock transfers']
    },
    {
      id: 'sales',
      title: 'Sales & Billing Allocation',
      statusBadge: 'Real-Time Stock Deduction',
      badgeColor: 'bg-warning-subtle text-warning border-warning',
      icon: 'fa-receipt',
      description: 'Instant quotation-to-invoice pipeline with real-time stock allocation. Price in Sq.Ft while storing in Boxes seamlessly.',
      highlights: ['Decoupled pricing & storage UOMs', 'Customer ledger balance', 'GST e-Invoice compliance ready']
    },
    {
      id: 'audit',
      title: '360° Unalterable Audit Log',
      statusBadge: 'Complete Chain Traceability',
      badgeColor: 'bg-danger-subtle text-danger border-danger',
      icon: 'fa-shield-halved',
      description: 'Every physical movement of goods creates an immutable transactional audit record linked directly to POs, GRNs, or Sales Invoices.',
      highlights: ['Reason-coded stock adjustments', 'Multi-tenant data isolation', 'Financial ledger reconciliation']
    }
  ];

  const roles = [
    {
      id: 'super-admin',
      title: 'Super Administrator',
      icon: 'fa-user-shield',
      tagline: 'Platform-wide Governance & Global Registry Master',
      features: [
        'Manage Global Manufacturer Master Registry (Kajaria, Somany, Jaquar)',
        'Verify or Reject contributed manufacturer GSTIN profiles',
        'Monitor tenant organization quotas and multi-tenant security',
        'Execute automated platform seeders and system audits'
      ]
    },
    {
      id: 'store-admin',
      title: 'Organization Administrator',
      icon: 'fa-user-gear',
      tagline: 'Complete Store, Branch & Enterprise Operations Management',
      features: [
        'Configure multi-branch locations, showrooms, and warehouses',
        'Assign role-based access permissions (RBAC) to store staff',
        'Approve Purchase Orders and oversee financial ledger reports',
        'Manage custom product attributes and supplier commercial terms'
      ]
    },
    {
      id: 'warehouse-mgr',
      title: 'Warehouse Supervisor',
      icon: 'fa-warehouse',
      tagline: 'Logistics, Goods Receiving & Stock Allocation',
      features: [
        'Process Goods Receipt Notes (GRN) tied to active POs',
        'Authorize Direct GRN emergency arrivals with mandatory audit logging',
        'Perform rack-and-shelf location mapping for tiles & sanitaryware',
        'Log individual granite slab length x width physical dimensions'
      ]
    },
    {
      id: 'sales-op',
      title: 'Showroom Sales Specialist',
      icon: 'fa-cash-register',
      tagline: 'Customer Quotations, Billing & Instant Stock Reservation',
      features: [
        'Generate instant customer estimates in SQ.FT or BOX counts',
        'Convert approved quotes to Tax Invoices with auto stock deduction',
        'Apply customer-specific discount tiers and HSN tax rules',
        'Print delivery dispatch notes for warehouse pickup'
      ]
    }
  ];

  const faqs = [
    {
      q: 'How does the ERP handle tile coverage conversions (Boxes vs SQFT)?',
      a: 'The system includes a native Product-Specific Conversion Engine. When defining a tile product, you specify its physical dimensions (e.g., 600x600mm) and box packing (e.g., 4 PCS/BOX). The ERP automatically calculates that 1 Box equals 1.44 SQ.M (15.5 SQ.FT). Sales operators can enter orders in Boxes, Pieces, or Square Feet, and the inventory deducts with 100% mathematical precision.'
    },
    {
      q: 'Can we track individual granite and marble slabs with varying dimensions?',
      a: 'Yes! The ERP explicitly supports a MEASURED_MATERIAL product model designed for natural stone yards. Each slab within a bundle is recorded with its unique Length x Width measurements (e.g. 120 in x 72 in = 60.00 Sq.Ft). The system prices by surface area while maintaining exact piece-level physical stock tracking.'
    },
    {
      q: 'What is the Global Manufacturer Master vs Tenant Supplier distinction?',
      a: 'Real-world manufacturers like Kajaria, Somany, or Jaquar exist in a shared, verified Global Master Registry. Organization Admins can select existing manufacturers or contribute new ones. Meanwhile, Suppliers are tenant-scoped commercial vendor entities registered per organization for purchasing transactions.'
    },
    {
      q: 'How does partial delivery receiving (PO to GRN balance) work?',
      a: 'When a supplier delivers a partial shipment (e.g., 60 boxes out of 100 ordered), the warehouse logs a Goods Receipt Note (GRN). The PO status updates to PARTIALLY_RECEIVED, and the remaining 40-box balance stays open. Once the supplier delivers the remaining balance, the PO automatically transitions to FULLY_RECEIVED.'
    },
    {
      q: 'Is the platform built for multi-branch and multi-warehouse enterprises?',
      a: 'Absolutely. An organization can configure multiple operational locations (Main Showroom HQ, Regional Warehouses, Display Outlets). Stock transfers between locations generate formal Stock Transfer Notes to guarantee zero stock leakage.'
    }
  ];

  return (
    <div className="landing-wrapper min-vh-100 d-flex flex-column">
      {/* Top Glass Navigation Bar */}
      <nav className="landing-nav py-3">
        <div className="container d-flex align-items-center justify-content-between">
          <a className="navbar-brand d-flex align-items-center gap-2 fw-bold text-decoration-none" href="#" onClick={(e) => e.preventDefault()}>
            <div className="bg-primary text-white rounded-3 p-2 d-flex align-items-center justify-content-center shadow-sm" style={{ width: '40px', height: '40px' }}>
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
            </div>
            <div>
              <span className="fs-5 fw-extrabold text-dark d-block leading-none">Tiles & Sanitary <span className="text-primary">ERP</span></span>
              <small className="text-muted fw-semibold" style={{ fontSize: '0.7rem', letterSpacing: '0.5px' }}>ENTERPRISE RESOURCE PLATFORM</small>
            </div>
          </a>

          <div className="d-none d-md-flex align-items-center gap-4">
            <a href="#features" className="nav-link">Features</a>
            <a href="#sandbox" className="nav-link">Unit Engine</a>
            <a href="#pipeline" className="nav-link">Workflow</a>
            <a href="#roles" className="nav-link">Role Matrix</a>
            <a href="#faq" className="nav-link">FAQ</a>
          </div>

          <div className="d-flex align-items-center gap-2">
            <button onClick={onNavigateToLogin} className="btn btn-outline-primary px-4 fw-bold rounded-pill">
              <i className="fa-solid fa-right-to-bracket me-2"></i>Log In
            </button>
            <button onClick={onNavigateToRegister} className="btn btn-primary px-4 fw-bold rounded-pill shadow-sm">
              Register Store <i className="fa-solid fa-arrow-right ms-1"></i>
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="py-5 position-relative overflow-hidden">
        <div className="hero-mesh-bg"></div>
        <div className="hero-grid-pattern"></div>

        <div className="container py-lg-4 position-relative z-1">
          <div className="row align-items-center g-5">
            {/* Left Hero Column */}
            <div className="col-lg-6">
              <div className="hero-pill-badge mb-3">
                <i className="fa-solid fa-sparkles text-warning"></i> Purpose-Built for Building Material Dealers
              </div>
              <h1 className="display-4 fw-black text-dark mb-4 lh-sm">
                Next-Gen ERP for <br />
                <span className="gradient-text-primary">Tiles, Sanitaryware & Granite</span>
              </h1>
              <p className="lead text-secondary mb-4 pe-lg-3">
                Unify procurement, automated multi-unit conversions (<strong className="text-dark">Box ↔ Piece ↔ SQFT</strong>), granite slab dimensional tracking, and real-time sales invoicing in one stateful digital ecosystem.
              </p>

              {/* Action Buttons */}
              <div className="d-flex flex-wrap align-items-center gap-3 mb-4">
                <button onClick={onNavigateToRegister} className="btn btn-primary btn-lg px-4 py-3 rounded-pill fw-bold shadow-lg d-inline-flex align-items-center gap-2">
                  <span>Start Free Store Setup</span>
                  <i className="fa-solid fa-circle-arrow-right fs-5"></i>
                </button>
                <button onClick={onNavigateToLogin} className="btn btn-light btn-lg px-4 py-3 rounded-pill fw-bold border text-dark shadow-sm d-inline-flex align-items-center gap-2">
                  <i className="fa-solid fa-play text-primary"></i>
                  <span>Live App Portal</span>
                </button>
              </div>

              {/* Industry Badges */}
              <div className="d-flex flex-wrap gap-2 pt-2 border-top">
                <span className="industry-chip"><i className="fa-solid fa-cubes text-primary"></i> Vitrified & Ceramic Tiles</span>
                <span className="industry-chip"><i className="fa-solid fa-toilet text-info"></i> Sanitaryware & Fixtures</span>
                <span className="industry-chip"><i className="fa-solid fa-layer-group text-warning"></i> Granite & Marble Slabs</span>
                <span className="industry-chip"><i className="fa-solid fa-faucet text-emerald"></i> CP Plumbing Hardware</span>
              </div>
            </div>

            {/* Right Hero Column: Interactive Sandbox Calculator */}
            <div className="col-lg-6">
              <div id="sandbox" className="sandbox-wrapper">
                <div className="d-flex align-items-center justify-content-between mb-3 pb-2 border-bottom">
                  <div>
                    <h5 className="fw-bold mb-0 text-dark">
                      <i className="fa-solid fa-calculator text-primary me-2"></i>Live Multi-Unit Sandbox
                    </h5>
                    <small className="text-muted">Test how our engine calculates real-world inventory</small>
                  </div>
                  <span className="badge bg-success-subtle text-success border border-success px-2 py-1 rounded-pill small">
                    <i className="fa-solid fa-bolt me-1"></i>Real-Time Math
                  </span>
                </div>

                {/* Tab selector */}
                <ul className="nav nav-pills sandbox-nav-pills mb-3 gap-2">
                  <li className="nav-item">
                    <button className={`nav-link ${calcTab === 'tiles' ? 'active' : ''}`} onClick={() => setCalcTab('tiles')}>
                      <i className="fa-solid fa-boxes-stacked me-2"></i>Tiles (Box/SQFT)
                    </button>
                  </li>
                  <li className="nav-item">
                    <button className={`nav-link ${calcTab === 'granite' ? 'active' : ''}`} onClick={() => setCalcTab('granite')}>
                      <i className="fa-solid fa-ruler-combined me-2"></i>Granite Slab Area
                    </button>
                  </li>
                </ul>

                {calcTab === 'tiles' ? (
                  <div className="animate__animated animate__fadeIn">
                    <div className="row g-2 mb-3">
                      <div className="col-6">
                        <label className="form-label small fw-bold text-secondary">Tile Size (mm)</label>
                        <div className="input-group input-group-sm">
                          <input type="number" className="form-control fw-bold" value={tileLength} onChange={(e) => setTileLength(Number(e.target.value))} />
                          <span className="input-group-text">x</span>
                          <input type="number" className="form-control fw-bold" value={tileWidth} onChange={(e) => setTileWidth(Number(e.target.value))} />
                        </div>
                      </div>
                      <div className="col-3">
                        <label className="form-label small fw-bold text-secondary">Pcs/Box</label>
                        <input type="number" className="form-control form-control-sm fw-bold" value={pcsPerBox} onChange={(e) => setPcsPerBox(Number(e.target.value))} />
                      </div>
                      <div className="col-3">
                        <label className="form-label small fw-bold text-secondary">Box Count</label>
                        <input type="number" className="form-control form-control-sm fw-bold text-primary" value={boxCount} onChange={(e) => setBoxCount(Number(e.target.value))} />
                      </div>
                    </div>

                    <div className="sandbox-result-box">
                      <div className="row g-2 text-center">
                        <div className="col-4 border-end">
                          <small className="text-muted d-block uppercase fw-semibold">Coverage / Box</small>
                          <span className="fs-6 fw-extrabold text-dark">{coveragePerBoxSqFt.toFixed(2)} SQ.FT</span>
                          <small className="d-block text-secondary">({coveragePerBoxSqM.toFixed(2)} SQ.M)</small>
                        </div>
                        <div className="col-4 border-end">
                          <small className="text-muted d-block uppercase fw-semibold">Total Stock Pcs</small>
                          <span className="fs-6 fw-extrabold text-info">{totalPieces} PCS</span>
                          <small className="d-block text-secondary">({boxCount} Boxes)</small>
                        </div>
                        <div className="col-4">
                          <small className="text-muted d-block uppercase fw-semibold">Total Coverage</small>
                          <span className="fs-6 fw-extrabold text-success">{totalTileSqFt.toFixed(1)} SQ.FT</span>
                          <small className="d-block text-success">Auto-Converted</small>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="animate__animated animate__fadeIn">
                    <div className="row g-2 mb-2">
                      <div className="col-6">
                        <label className="form-label small fw-bold text-secondary">Slab #1 (L x W inches)</label>
                        <div className="input-group input-group-sm">
                          <input type="number" className="form-control fw-bold" value={slab1Length} onChange={(e) => setSlab1Length(Number(e.target.value))} />
                          <span className="input-group-text">x</span>
                          <input type="number" className="form-control fw-bold" value={slab1Width} onChange={(e) => setSlab1Width(Number(e.target.value))} />
                        </div>
                      </div>
                      <div className="col-6">
                        <label className="form-label small fw-bold text-secondary">Slab #2 (L x W inches)</label>
                        <div className="input-group input-group-sm">
                          <input type="number" className="form-control fw-bold" value={slab2Length} onChange={(e) => setSlab2Length(Number(e.target.value))} />
                          <span className="input-group-text">x</span>
                          <input type="number" className="form-control fw-bold" value={slab2Width} onChange={(e) => setSlab2Width(Number(e.target.value))} />
                        </div>
                      </div>
                    </div>

                    <div className="mb-3">
                      <label className="form-label small fw-bold text-secondary">Commercial Rate (₹ / SQ.FT)</label>
                      <input type="number" className="form-control form-control-sm fw-bold text-warning" value={ratePerSqft} onChange={(e) => setRatePerSqft(Number(e.target.value))} />
                    </div>

                    <div className="sandbox-result-box">
                      <div className="row g-2 text-center">
                        <div className="col-4 border-end">
                          <small className="text-muted d-block uppercase fw-semibold">Slab #1 Area</small>
                          <span className="fs-6 fw-bold text-dark">{slab1SqFt.toFixed(2)} SQ.FT</span>
                        </div>
                        <div className="col-4 border-end">
                          <small className="text-muted d-block uppercase fw-semibold">Total Stone Area</small>
                          <span className="fs-6 fw-extrabold text-primary">{totalSlabSqFt.toFixed(2)} SQ.FT</span>
                        </div>
                        <div className="col-4">
                          <small className="text-muted d-block uppercase fw-semibold">Total Valuation</small>
                          <span className="fs-6 fw-extrabold text-success">₹{totalSlabValuation.toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                <div className="mt-3 text-center">
                  <small className="text-muted">
                    <i className="fa-solid fa-circle-check text-primary me-1"></i>
                    Engine embedded across Purchasing, Stock Transfers & Customer Invoices.
                  </small>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Counter Section */}
      <section className="py-4 bg-white border-y">
        <div className="container">
          <div className="row g-4">
            <div className="col-6 col-md-3">
              <div className="stat-counter-card">
                <div className="stat-number text-primary">100%</div>
                <div className="fw-bold text-dark mb-1">UOM Conversion Precision</div>
                <small className="text-muted">Box, Piece & SQFT Math</small>
              </div>
            </div>
            <div className="col-6 col-md-3">
              <div className="stat-counter-card">
                <div className="stat-number text-emerald">0%</div>
                <div className="fw-bold text-dark mb-1">Stock Leakage</div>
                <small className="text-muted">Strict Audit Trail</small>
              </div>
            </div>
            <div className="col-6 col-md-3">
              <div className="stat-counter-card">
                <div className="stat-number text-amber">3x</div>
                <div className="fw-bold text-dark mb-1">Faster Billing</div>
                <small className="text-muted">Instant Quotation to Bill</small>
              </div>
            </div>
            <div className="col-6 col-md-3">
              <div className="stat-counter-card">
                <div className="stat-number text-purple">360°</div>
                <div className="fw-bold text-dark mb-1">Traceable PO ➔ GRN</div>
                <small className="text-muted">Partial Delivery Balance</small>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Connected Workflow Stepper Section */}
      <section id="pipeline" className="py-5 bg-light position-relative">
        <div className="container py-lg-4">
          <div className="text-center max-w-2xl mx-auto mb-5">
            <span className="badge bg-primary-subtle text-primary fw-bold px-3 py-2 rounded-pill mb-2">Connected Transaction Chain</span>
            <h2 className="display-6 fw-black text-dark">One Seamless Pipeline: Supplier to Customer</h2>
            <p className="text-secondary">Every goods movement is backed by an unalterable, stateful business transaction.</p>
          </div>

          {/* Stepper buttons */}
          <div className="row g-3 mb-4">
            {pipelineSteps.map((step, idx) => (
              <div className="col-md" key={step.id}>
                <div 
                  className={`pipeline-step-card h-100 ${activeStep === idx ? 'active' : ''}`}
                  onClick={() => setActiveStep(idx)}
                >
                  <div className="d-flex align-items-center justify-content-between mb-2">
                    <span className="step-num-pill">{idx + 1}</span>
                    <i className={`fa-solid ${step.icon} fs-5 ${activeStep === idx ? 'text-primary' : 'text-muted'}`}></i>
                  </div>
                  <h6 className="fw-bold mb-1">{step.title}</h6>
                  <span className={`badge ${step.badgeColor} small`} style={{ fontSize: '0.68rem' }}>
                    {step.statusBadge}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Active Step Details Banner */}
          <div className="card border-0 shadow-sm rounded-4 p-4 bg-white animate__animated animate__fadeIn">
            <div className="row align-items-center g-4">
              <div className="col-lg-7">
                <div className="d-flex align-items-center gap-3 mb-3">
                  <div className="icon-badge-lg icon-badge-blue mb-0">
                    <i className={`fa-solid ${pipelineSteps[activeStep].icon}`}></i>
                  </div>
                  <div>
                    <span className="text-uppercase fw-bold text-primary small" style={{ letterSpacing: '1px' }}>Operational Stage {activeStep + 1}</span>
                    <h4 className="fw-bold text-dark mb-0">{pipelineSteps[activeStep].title}</h4>
                  </div>
                </div>
                <p className="text-secondary lead fs-6 mb-3">{pipelineSteps[activeStep].description}</p>
                <div className="d-flex flex-wrap gap-2">
                  {pipelineSteps[activeStep].highlights.map((h, i) => (
                    <span key={i} className="badge bg-light text-dark border px-3 py-2 rounded-pill fw-semibold">
                      <i className="fa-solid fa-check text-success me-2"></i>{h}
                    </span>
                  ))}
                </div>
              </div>
              <div className="col-lg-5">
                <div className="bg-dark text-white rounded-4 p-4 position-relative overflow-hidden">
                  <div className="d-flex justify-content-between align-items-center mb-3 pb-2 border-bottom border-secondary">
                    <span className="fw-bold text-info small"><i className="fa-solid fa-terminal me-2"></i>STATE MACHINE SIMULATION</span>
                    <span className="badge bg-success small">ACTIVE TRANSACTION</span>
                  </div>
                  <pre className="text-light mb-0" style={{ fontSize: '0.825rem', fontFamily: 'var(--mono-font)' }}>
{activeStep === 0 && `PO #PO-2026-0042
Supplier: Kajaria Direct Logistics
Status: SUBMITTED ➔ APPROVED
Items: 400 Box (Vitrified 600x600)
Tax: CGST (9%) + SGST (9%)
Dispatch: Scheduled`}
{activeStep === 1 && `GRN #GRN-2026-018
Ref PO: #PO-2026-0042
Ordered: 400 Box | Received: 250 Box
PO Balance: 150 Box
Status: PARTIALLY_RECEIVED
Warehouse: Central WH-01`}
{activeStep === 2 && `Inventory Engine Update:
+250 BOX (Vitrified 600x600)
Coverage Math: 250 x 15.5 SQFT
Total Added: +3,875 SQ.FT
Rack Location: R2-C1-S4
Branch Isolation: Verified`}
{activeStep === 3 && `Sales Invoice #INV-2026-089
Customer: Apex Constructions
Sold: 120 BOX (1,860 SQ.FT)
Stock Deduction: Real-Time
Payment: Split Ledger
Invoice Status: ISSUED`}
{activeStep === 4 && `AUDIT LOG #AUD-9941
Timestamp: ${new Date().toISOString().split('T')[0]}
User: Store Manager
Action: Stock Deduct (-120 Box)
Trace: INV-2026-089 ➔ GRN-018
Security Integrity: VALIDATED`}
                  </pre>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Grid Showcase */}
      <section id="features" className="py-5 bg-white">
        <div className="container py-lg-4">
          <div className="text-center max-w-2xl mx-auto mb-5">
            <span className="badge bg-success-subtle text-success fw-bold px-3 py-2 rounded-pill mb-2">Architected for Your Store</span>
            <h2 className="display-6 fw-black text-dark">Built Exclusively for Building Materials</h2>
            <p className="text-secondary">Generic ERPs fail at box coverage and slab sizes. Our platform was designed from the ground up for tiles and sanitaryware.</p>
          </div>

          <div className="row g-4">
            <div className="col-md-6 col-lg-4">
              <div className="landing-glass-card p-4 h-100">
                <div className="icon-badge-lg icon-badge-blue">
                  <i className="fa-solid fa-boxes-stacked"></i>
                </div>
                <h5 className="fw-bold mb-2">Tile Box & SQFT Dynamics</h5>
                <p className="text-secondary small mb-3">
                  Automatic mathematical correlation between piece counts, box coverage, and square feet. Enter sales in any unit while stock deducts accurately.
                </p>
                <ul className="list-unstyled small text-secondary mb-0 gap-1 d-flex flex-column">
                  <li><i className="fa-solid fa-circle-check text-primary me-2"></i>Per-product packaging specs</li>
                  <li><i className="fa-solid fa-circle-check text-primary me-2"></i>Coverage per box math</li>
                  <li><i className="fa-solid fa-circle-check text-primary me-2"></i>Zero rounding error tolerance</li>
                </ul>
              </div>
            </div>

            <div className="col-md-6 col-lg-4">
              <div className="landing-glass-card p-4 h-100">
                <div className="icon-badge-lg icon-badge-amber">
                  <i className="fa-solid fa-layer-group"></i>
                </div>
                <h5 className="fw-bold mb-2">Granite & Marble Slab Engine</h5>
                <p className="text-secondary small mb-3">
                  Track individual natural stone slabs with exact length x width measurements. Price per surface area with precise slab inventory valuation.
                </p>
                <ul className="list-unstyled small text-secondary mb-0 gap-1 d-flex flex-column">
                  <li><i className="fa-solid fa-circle-check text-amber me-2"></i>Piece-level slab dimensions</li>
                  <li><i className="fa-solid fa-circle-check text-amber me-2"></i>Bundle & block grouping</li>
                  <li><i className="fa-solid fa-circle-check text-amber me-2"></i>Area-based dynamic pricing</li>
                </ul>
              </div>
            </div>

            <div className="col-md-6 col-lg-4">
              <div className="landing-glass-card p-4 h-100">
                <div className="icon-badge-lg icon-badge-emerald">
                  <i className="fa-solid fa-industry"></i>
                </div>
                <h5 className="fw-bold mb-2">Global Manufacturer Master</h5>
                <p className="text-secondary small mb-3">
                  Shared registry for global brands (Kajaria, Somany, Jaquar) with duplicate GSTIN detection and Super Admin verification status control.
                </p>
                <ul className="list-unstyled small text-secondary mb-0 gap-1 d-flex flex-column">
                  <li><i className="fa-solid fa-circle-check text-emerald me-2"></i>Verified manufacturer master</li>
                  <li><i className="fa-solid fa-circle-check text-emerald me-2"></i>Tenant supplier separation</li>
                  <li><i className="fa-solid fa-circle-check text-emerald me-2"></i>GSTIN duplicate shield</li>
                </ul>
              </div>
            </div>

            <div className="col-md-6 col-lg-4">
              <div className="landing-glass-card p-4 h-100">
                <div className="icon-badge-lg icon-badge-purple">
                  <i className="fa-solid fa-diagram-project"></i>
                </div>
                <h5 className="fw-bold mb-2">Multi-Branch & Warehouse</h5>
                <p className="text-secondary small mb-3">
                  Isolate stock across HQ showrooms, regional warehouses, and display yards. Transfer inventory seamlessly with formal transfer notes.
                </p>
                <ul className="list-unstyled small text-secondary mb-0 gap-1 d-flex flex-column">
                  <li><i className="fa-solid fa-circle-check text-purple me-2"></i>Rack & Shelf location tagging</li>
                  <li><i className="fa-solid fa-circle-check text-purple me-2"></i>Showroom display stock tracking</li>
                  <li><i className="fa-solid fa-circle-check text-purple me-2"></i>Inter-branch stock reconciliation</li>
                </ul>
              </div>
            </div>

            <div className="col-md-6 col-lg-4">
              <div className="landing-glass-card p-4 h-100">
                <div className="icon-badge-lg icon-badge-rose">
                  <i className="fa-solid fa-file-invoice-dollar"></i>
                </div>
                <h5 className="fw-bold mb-2">Stateful Procurement (PO ➔ GRN)</h5>
                <p className="text-secondary small mb-3">
                  Manage binding purchase orders through multi-level approvals. Receive goods in full or partial batches with automatic PO balance tracking.
                </p>
                <ul className="list-unstyled small text-secondary mb-0 gap-1 d-flex flex-column">
                  <li><i className="fa-solid fa-circle-check text-rose me-2"></i>PO lifecycle state machine</li>
                  <li><i className="fa-solid fa-circle-check text-rose me-2"></i>Direct GRN audit exception mode</li>
                  <li><i className="fa-solid fa-circle-check text-rose me-2"></i>Outstanding delivery balances</li>
                </ul>
              </div>
            </div>

            <div className="col-md-6 col-lg-4">
              <div className="landing-glass-card p-4 h-100">
                <div className="icon-badge-lg icon-badge-cyan">
                  <i className="fa-solid fa-shield-cat"></i>
                </div>
                <h5 className="fw-bold mb-2">Multi-Tenant RBAC & Audit</h5>
                <p className="text-secondary small mb-3">
                  Strict tenant data isolation with fine-grained role-based permissions. Every physical stock movement records an unalterable audit log.
                </p>
                <ul className="list-unstyled small text-secondary mb-0 gap-1 d-flex flex-column">
                  <li><i className="fa-solid fa-circle-check text-cyan me-2"></i>Tenant Context isolation</li>
                  <li><i className="fa-solid fa-circle-check text-cyan me-2"></i>Role switcher & permissions</li>
                  <li><i className="fa-solid fa-circle-check text-cyan me-2"></i>Mandatory reason-coded adjustments</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Role Persona Matrix Simulator */}
      <section id="roles" className="py-5 bg-light border-y">
        <div className="container py-lg-4">
          <div className="text-center max-w-2xl mx-auto mb-5">
            <span className="badge bg-purple-subtle text-purple fw-bold px-3 py-2 rounded-pill mb-2">Role-Based Access Control</span>
            <h2 className="display-6 fw-black text-dark">Tailored Interfaces for Every Persona</h2>
            <p className="text-secondary">From Super Admins overseeing global manufacturers to Showroom Sales Staff billing customers.</p>
          </div>

          <div className="row g-4 align-items-center">
            <div className="col-lg-4">
              <div className="d-flex flex-column gap-2">
                {roles.map((r) => (
                  <button
                    key={r.id}
                    className={`role-persona-btn ${activeRole === r.id ? 'active' : ''}`}
                    onClick={() => setActiveRole(r.id)}
                  >
                    <div className="d-flex align-items-center gap-3">
                      <i className={`fa-solid ${r.icon} fs-4`}></i>
                      <div>
                        <div className="fw-bold">{r.title}</div>
                        <small className="opacity-75 d-block" style={{ fontSize: '0.75rem' }}>{r.tagline.split('&')[0]}</small>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className="col-lg-8">
              {roles.map((r) => r.id === activeRole && (
                <div key={r.id} className="card border-0 shadow-md rounded-4 p-4 bg-white animate__animated animate__fadeIn">
                  <div className="d-flex align-items-center gap-3 mb-3 pb-3 border-bottom">
                    <div className="bg-primary text-white rounded-circle p-3 d-flex align-items-center justify-content-center" style={{ width: '56px', height: '56px' }}>
                      <i className={`fa-solid ${r.icon} fs-4`}></i>
                    </div>
                    <div>
                      <h4 className="fw-bold text-dark mb-1">{r.title}</h4>
                      <p className="text-muted mb-0 small">{r.tagline}</p>
                    </div>
                  </div>

                  <h6 className="fw-bold text-dark mb-3">Key Capabilities & Operational Tools:</h6>
                  <div className="row g-3">
                    {r.features.map((f, idx) => (
                      <div className="col-md-6" key={idx}>
                        <div className="p-3 rounded-3 bg-light border d-flex align-items-start gap-2">
                          <i className="fa-solid fa-circle-check text-primary mt-1"></i>
                          <span className="small text-dark fw-medium">{f}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Accordion Section */}
      <section id="faq" className="py-5 bg-white">
        <div className="container py-lg-4">
          <div className="text-center max-w-2xl mx-auto mb-5">
            <span className="badge bg-info-subtle text-info fw-bold px-3 py-2 rounded-pill mb-2">Industry Knowledge</span>
            <h2 className="display-6 fw-black text-dark">Frequently Asked Questions</h2>
            <p className="text-secondary">Common queries from tile dealers, sanitaryware distributors, and granite yard owners.</p>
          </div>

          <div className="row justify-content-center">
            <div className="col-lg-9">
              <div className="accordion gap-3 d-flex flex-column" id="faqAccordion">
                {faqs.map((faq, idx) => (
                  <div className="accordion-item border rounded-3 overflow-hidden shadow-sm" key={idx}>
                    <h2 className="accordion-header">
                      <button 
                        className={`accordion-button fw-bold ${openFaq === idx ? '' : 'collapsed'}`} 
                        type="button"
                        onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                      >
                        <i className="fa-solid fa-circle-question text-primary me-2"></i>
                        {faq.q}
                      </button>
                    </h2>
                    {openFaq === idx && (
                      <div className="accordion-collapse collapse show">
                        <div className="accordion-body text-secondary lh-relaxed">
                          {faq.a}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Bottom CTA Banner */}
      <section className="py-5 bg-light">
        <div className="container">
          <div className="cta-banner-bg text-white p-5 text-center position-relative">
            <div className="position-relative z-1 max-w-2xl mx-auto">
              <span className="badge bg-white text-primary fw-extrabold px-3 py-2 rounded-pill mb-3">Transform Your Store Today</span>
              <h2 className="display-5 fw-black mb-3">Ready to Streamline Your Tiles & Sanitary Enterprise?</h2>
              <p className="lead mb-4 text-white-50">
                Eliminate inventory confusion, automate multi-unit tile billing, and gain 100% control over your supplier procurement and natural stone yard.
              </p>
              <div className="d-flex justify-content-center gap-3 flex-wrap">
                <button onClick={onNavigateToRegister} className="btn btn-light btn-lg px-5 py-3 rounded-pill fw-bold text-primary shadow-lg">
                  Create Organization Account <i className="fa-solid fa-arrow-right ms-2"></i>
                </button>
                <button onClick={onNavigateToLogin} className="btn btn-outline-light btn-lg px-4 py-3 rounded-pill fw-bold">
                  Sign In to Existing Portal
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-dark text-white py-5 mt-auto border-top border-secondary">
        <div className="container">
          <div className="row g-4 mb-4">
            <div className="col-lg-4">
              <div className="d-flex align-items-center gap-2 mb-3">
                <div className="bg-primary text-white rounded-3 p-2 d-flex align-items-center justify-content-center" style={{ width: '36px', height: '36px' }}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
                </div>
                <span className="fs-5 fw-bold">Tiles & Sanitary <span className="text-primary">ERP</span></span>
              </div>
              <p className="text-white-50 small pe-lg-4">
                A multi-tenant Enterprise Resource Planning platform engineered specifically for businesses trading in Ceramic Tiles, Vitrified Tiles, Sanitaryware, Granite, Marble Slabs, and CP Fittings.
              </p>
            </div>

            <div className="col-6 col-lg-2">
              <h6 className="fw-bold text-white mb-3">Product Domain</h6>
              <ul className="list-unstyled small text-white-50 d-flex flex-column gap-2">
                <li><a href="#sandbox" className="text-white-50 text-decoration-none">Box & SQFT Engine</a></li>
                <li><a href="#sandbox" className="text-white-50 text-decoration-none">Slab Area Calculator</a></li>
                <li><a href="#pipeline" className="text-white-50 text-decoration-none">PO & GRN Pipeline</a></li>
                <li><a href="#features" className="text-white-50 text-decoration-none">Manufacturer Master</a></li>
              </ul>
            </div>

            <div className="col-6 col-lg-2">
              <h6 className="fw-bold text-white mb-3">Target Formats</h6>
              <ul className="list-unstyled small text-white-50 d-flex flex-column gap-2">
                <li><span className="text-white-50">Retail Showrooms</span></li>
                <li><span className="text-white-50">Wholesale Distributors</span></li>
                <li><span className="text-white-50">Natural Stone Yards</span></li>
                <li><span className="text-white-50">Multi-Warehouse Chains</span></li>
              </ul>
            </div>

            <div className="col-lg-4">
              <h6 className="fw-bold text-white mb-3">Technical Stack</h6>
              <p className="text-white-50 small mb-2">Powered by Laravel 11, React 18, Bootstrap 5, and MySQL with unalterable audit trails.</p>
              <div className="d-flex gap-2">
                <span className="badge bg-secondary text-light">PHP 8.3</span>
                <span className="badge bg-secondary text-light">Laravel 11</span>
                <span className="badge bg-secondary text-light">React 18</span>
                <span className="badge bg-secondary text-light">Multi-Tenant RBAC</span>
              </div>
            </div>
          </div>

          <div className="pt-4 border-top border-secondary d-flex flex-column flex-md-row justify-content-between align-items-center gap-2">
            <p className="mb-0 text-white-50 small">
              © {new Date().getFullYear()} Tiles & Sanitaryware ERP System. All rights reserved.
            </p>
            <div className="d-flex gap-3 small text-white-50">
              <a href="#" onClick={(e) => { e.preventDefault(); onNavigateToLogin(); }} className="text-white-50 text-decoration-none">Portal Sign In</a>
              <span>•</span>
              <a href="#" onClick={(e) => { e.preventDefault(); onNavigateToRegister(); }} className="text-white-50 text-decoration-none">Store Registration</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
