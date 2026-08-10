import React from 'react';

export default function LandingPage({ onNavigateToLogin, onNavigateToRegister }) {
  return (
    <div className="min-vh-100 d-flex flex-column bg-light font-sans">
      {/* Navbar */}
      <nav className="navbar navbar-expand-lg navbar-light bg-white border-bottom py-3 shadow-sm">
        <div className="container">
          <a className="navbar-brand d-flex align-items-center gap-2 fw-bold text-primary" href="#" onClick={(e) => { e.preventDefault(); }}>
            <svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="me-1"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
            <span className="fs-4">Tiles & Sanitary Portal</span>
          </a>
          <div className="ms-auto flex-row d-flex">
            <button onClick={onNavigateToLogin} className="btn btn-outline-primary px-4 fw-medium rounded-pill me-2">Log In</button>
            <button onClick={onNavigateToRegister} className="btn btn-primary px-4 fw-medium rounded-pill shadow-sm">Get Started</button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="flex-grow-1">
        <section className="py-5 bg-white text-center position-relative overflow-hidden">
          <div className="position-absolute top-0 start-50 translate-middle-x w-100 h-100" style={{ background: 'radial-gradient(circle at center, #e0e7ff 0%, transparent 70%)', opacity: 0.5, zIndex: 0 }}></div>
          <div className="container py-xl-5 position-relative z-1">
            <div className="row justify-content-center">
              <div className="col-lg-8">                
                <h1 className="display-4 fw-bolder text-dark mb-4" style={{ letterSpacing: '-1px' }}>
                  Manage Your Tiles, Sanitary & Granite Business<br className="d-none d-md-block" />
                  <span className="text-primary">All in One Smart ERP</span>
                </h1>
                <p className="lead text-secondary mb-5 px-md-5">
                  Streamline your inventory, manage multi-unit conversions effortlessly (Box, Piece, SQFT), and accelerate your sales cycle with our industry-tailored platform.
                </p>
                <div className="d-flex justify-content-center gap-3">
                  <button onClick={onNavigateToLogin} className="btn btn-primary btn-lg px-5 rounded-pill shadow d-flex align-items-center gap-2">
                    Enter Application <i className="fa-solid fa-arrow-right"></i>
                  </button>
                </div>
              </div>
            </div>            
          </div>
        </section>

        {/* Features Section */}
        <section className="py-5 bg-light">
          <div className="container py-5">
            <div className="text-center mb-5">
              <h2 className="fw-bolder" style={{ letterSpacing: '-0.5px' }}>Built for Your Industry</h2>
              <p className="text-secondary">Everything you need to run your tiles and sanitaryware business efficiently.</p>
            </div>
            <div className="row g-4">
              <div className="col-md-6 col-lg-3">
                <div className="card h-100 border-0 shadow-sm rounded-4 p-4 border-top border-4 border-primary">
                  <div className="bg-primary-subtle text-primary rounded-circle d-flex align-items-center justify-content-center mb-3" style={{ width: '60px', height: '60px' }}>
                    <i className="fa-solid fa-box fs-4"></i>
                  </div>
                  <h5 className="fw-bold mt-2">Multi-Unit Inventory</h5>
                  <p className="text-secondary small mb-0">Track stock flawlessly across Boxes, Pieces, and Square Feet with our advanced conversion engine.</p>
                </div>
              </div>
              <div className="col-md-6 col-lg-3">
                <div className="card h-100 border-0 shadow-sm rounded-4 p-4 border-top border-4 border-success">
                  <div className="bg-success-subtle text-success rounded-circle d-flex align-items-center justify-content-center mb-3" style={{ width: '60px', height: '60px' }}>
                    <i className="fa-solid fa-chart-line fs-4"></i>
                  </div>
                  <h5 className="fw-bold mt-2">Smart Sales & Billing</h5>
                  <p className="text-secondary small mb-0">Generate quotations instantly and convert them to invoices with automated stock deduction.</p>
                </div>
              </div>
              <div className="col-md-6 col-lg-3">
                <div className="card h-100 border-0 shadow-sm rounded-4 p-4 border-top border-4 border-warning">
                  <div className="bg-warning-subtle text-warning rounded-circle d-flex align-items-center justify-content-center mb-3" style={{ width: '60px', height: '60px' }}>
                    <i className="fa-solid fa-truck fs-4"></i>
                  </div>
                  <h5 className="fw-bold mt-2">Logistics Tracking</h5>
                  <p className="text-secondary small mb-0">Print delivery slips and track dispatch status from warehouse to customer destination.</p>
                </div>
              </div>
              <div className="col-md-6 col-lg-3">
                <div className="card h-100 border-0 shadow-sm rounded-4 p-4 border-top border-4 border-info">
                  <div className="bg-info-subtle text-info rounded-circle d-flex align-items-center justify-content-center mb-3" style={{ width: '60px', height: '60px' }}>
                    <i className="fa-solid fa-mobile-screen-button fs-4"></i>
                  </div>
                  <h5 className="fw-bold mt-2">Mobile Optimized</h5>
                  <p className="text-secondary small mb-0">PWA-ready design ensures you can manage your operations from the showroom floor or on the go.</p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-dark text-white py-4 mt-auto">
        <div className="container d-flex flex-column flex-md-row justify-content-between align-items-center">
          <div className="d-flex align-items-center gap-2 mb-3 mb-md-0">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="me-1 opacity-75"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
            <span className="fw-bold">Tiles & Sanitary Portal</span>
          </div>
          <p className="mb-0 text-white-50 small">© {new Date().getFullYear()} Tiles & Sanitary Portal. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
