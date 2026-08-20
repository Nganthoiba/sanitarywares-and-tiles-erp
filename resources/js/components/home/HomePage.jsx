import React from 'react';

export default function HomePage() {
    return (
        <div className="d-flex align-items-center justify-content-center p-5" style={{ minHeight: '70vh' }}>
            <div className="text-center p-5 bg-white rounded-4 shadow-sm border" style={{ maxWidth: '450px' }}>
                <div className="mb-3 text-warning">
                    <i className="fa-solid fa-person-digging display-4"></i>
                </div>
                <h3 className="fw-bold text-dark mb-2">Under Development</h3>
                <p className="text-muted mb-0">This section is currently under development.</p>
            </div>
        </div>
    );
}
