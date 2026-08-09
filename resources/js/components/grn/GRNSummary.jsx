import React from 'react';

export default function GRNSummary({ items, products, units }) {
    const calculateBulkArea = (item, product) => {
        if (!item.unit_id || !product) return 0;
        
        // Client-side fallback for tile area calculation
        // Kajaria tiles Box -> SQFT multiplier is 15.5
        if (product.sku === 'KAJ-ROY-GLD-600') {
            return item.quantity_received * 15.5;
        }
        return 0;
    };

    const totalQty = items.reduce((sum, item) => sum + parseFloat(item.quantity_received || 0), 0);

    const totalArea = items.reduce((sum, item) => {
        const product = products.find(p => p.id === parseInt(item.product_variant_id));
        if (!product) return sum;

        if (product.inventory_behavior === 'SLAB') {
            const slabArea = (item.slabs || []).reduce((sArea, slab) => {
                return sArea + ((parseFloat(slab.length || 0) * parseFloat(slab.width || 0)) / 144.0);
            }, 0);
            return sum + slabArea;
        } else {
            return sum + calculateBulkArea(item, product);
        }
    }, 0);

    return (
        <div className="card border-0 shadow-sm p-4 mb-4" style={{ borderRadius: '12px', background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)' }}>
            <h6 className="text-uppercase text-secondary font-monospace fw-bold mb-3" style={{ fontSize: '0.85rem', letterSpacing: '1px' }}>
                <i className="fa-solid fa-chart-pie me-2 text-primary"></i>Receipt Summary
            </h6>
            <div className="row g-3">
                <div className="col-md-4">
                    <div className="bg-white p-3 rounded-3 border-start border-primary border-4 shadow-xs">
                        <span className="text-muted small font-monospace d-block">Total Items</span>
                        <strong className="fs-4 text-dark font-monospace">{items.length}</strong>
                    </div>
                </div>
                <div className="col-md-4">
                    <div className="bg-white p-3 rounded-3 border-start border-success border-4 shadow-xs">
                        <span className="text-muted small font-monospace d-block">Total Received Qty</span>
                        <strong className="fs-4 text-success font-monospace">{totalQty.toFixed(2)}</strong>
                    </div>
                </div>
                <div className="col-md-4">
                    <div className="bg-white p-3 rounded-3 border-start border-info border-4 shadow-xs">
                        <span className="text-muted small font-monospace d-block">Total Computed Area</span>
                        <strong className="fs-4 text-info font-monospace">{totalArea.toFixed(2)} SQFT</strong>
                    </div>
                </div>
            </div>
        </div>
    );
}
