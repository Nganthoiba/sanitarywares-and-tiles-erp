import React from 'react';

export default function GRNSummary({ items = [], products = [], units = [] }) {
    // Group quantities by unit
    const unitTotalsMap = {};

    items.forEach(item => {
        const qty = parseFloat(item.quantity_received || 0);
        if (isNaN(qty) || qty <= 0) return;

        // Resolve unit object
        const unitObj = units.find(u => String(u.id) === String(item.unit_id))
            || item.unit
            || (item.product_variant_id ? (() => {
                const pv = products.find(p => String(p.id) === String(item.product_variant_id));
                const uId = pv?.purchase_unit_id || pv?.base_unit_id;
                return units.find(u => String(u.id) === String(uId));
            })() : null);

        const key = unitObj?.id ? `id_${unitObj.id}` : (item.unit_id ? `id_${item.unit_id}` : (item.unit_symbol || item.unit_name || 'default'));
        const label = unitObj?.symbol || unitObj?.name || item.unit_symbol || item.unit_name || 'Units';

        if (!unitTotalsMap[key]) {
            unitTotalsMap[key] = { qty: 0, label };
        }
        unitTotalsMap[key].qty += qty;
    });

    const unitEntries = Object.values(unitTotalsMap);

    const formattedSummary = unitEntries.length > 0
        ? unitEntries
            .map(e => `${Number(e.qty % 1 === 0 ? e.qty : e.qty.toFixed(2)).toLocaleString()} ${e.label}`)
            .join(', ')
        : '0';

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
                        <span className="text-muted small font-monospace d-block mb-1">Total Received Qty</span>
                        <strong className="fs-5 text-success font-monospace">{formattedSummary}</strong>
                    </div>
                </div>
            </div>
        </div>
    );
}

