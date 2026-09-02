import React from 'react';

export default function GRNSummary({ items = [] }) {
    const totalQty = items.reduce((sum, item) => sum + parseFloat(item.quantity_received || 0), 0);
    const integerTotalQty = Math.round(totalQty);

    return (
        <div className="card border-0 shadow-sm p-4 mb-4" style={{ borderRadius: '12px', background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)' }}>
            <h6 className="text-uppercase text-secondary font-monospace fw-bold mb-3" style={{ fontSize: '0.85rem', letterSpacing: '1px' }}>
                <i className="fa-solid fa-chart-pie me-2 text-primary"></i>Receipt Summary
            </h6>
            <div className="row g-3">
                <div className="col-md-6 col-6">
                    <div className="bg-white p-3 rounded-3 border-start border-primary border-4 shadow-xs">
                        <span className="text-muted small font-monospace d-block">Total Items</span>
                        <strong className="fs-4 text-dark font-monospace">{items.length}</strong>
                    </div>
                </div>
                <div className="col-md-6 col-6">
                    <div className="bg-white p-3 rounded-3 border-start border-success border-4 shadow-xs">
                        <span className="text-muted small font-monospace d-block">Total Received Qty</span>
                        <strong className="fs-4 text-success font-monospace">{integerTotalQty}</strong>
                    </div>
                </div>
            </div>
        </div>
    );
}
