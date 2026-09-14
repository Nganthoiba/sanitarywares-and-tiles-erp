import React from "react";

export default function AdjustmentForm({
    show,
    onClose,
    onSubmit,
    submitting,
    contexts,
    stockItems,
    adjustForm,
    setAdjustForm
}) {
    if (!show) return null;

    return (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
            <div className="modal-dialog">
                <div className="modal-content border-0 shadow-lg rounded-3">
                    <form onSubmit={onSubmit}>
                        <div className="modal-header border-bottom py-3">
                            <h5 className="modal-title fw-bold text-dark">
                                <i className="bi bi-sliders text-warning me-2"></i>
                                Stock Level Adjustment
                            </h5>
                            <button type="button" className="btn-close" onClick={onClose}></button>
                        </div>
                        <div className="modal-body p-4">
                            <div className="mb-3">
                                <label className="form-label small fw-semibold text-secondary">Warehouse</label>
                                <select
                                    className="form-select"
                                    required
                                    value={adjustForm.warehouse_id}
                                    onChange={e => setAdjustForm(prev => ({ ...prev, warehouse_id: e.target.value }))}
                                >
                                    <option value="">Select Warehouse</option>
                                    {(contexts.warehouses || []).map(w => (
                                        <option key={w.id} value={w.id}>{w.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="mb-3">
                                <label className="form-label small fw-semibold text-secondary">Product to Adjust</label>
                                <select
                                    className="form-select"
                                    required
                                    value={adjustForm.product_variant_id}
                                    onChange={e => setAdjustForm(prev => ({ ...prev, product_variant_id: e.target.value }))}
                                >
                                    <option value="">Select Product</option>
                                    {stockItems
                                        .filter(s => !adjustForm.warehouse_id || String(s.warehouse_id) === String(adjustForm.warehouse_id))
                                        .map(s => (
                                            <option key={s.id} value={s.product_variant_id}>
                                                {s.product_name} (On Hand: {s.on_hand_qty} {s.unit_symbol})
                                            </option>
                                        ))
                                    }
                                </select>
                            </div>

                            <div className="mb-3">
                                <label className="form-label small fw-semibold text-secondary">Adjustment Type</label>
                                <select
                                    className="form-select"
                                    value={adjustForm.adjustment_type}
                                    onChange={e => setAdjustForm(prev => ({ ...prev, adjustment_type: e.target.value }))}
                                >
                                    <option value="DAMAGE">Damage / Breakage (-)</option>
                                    <option value="THEFT">Loss / Theft (-)</option>
                                    <option value="CORRECTION">System Stock Correction (+/-)</option>
                                    <option value="FOUND">Found Extra Stock (+)</option>
                                </select>
                            </div>

                            <div className="mb-3">
                                <label className="form-label small fw-semibold text-secondary">Quantity Delta (+ or -)</label>
                                <input
                                    type="number"
                                    step="0.0001"
                                    className="form-control"
                                    required
                                    value={adjustForm.quantity_delta}
                                    onChange={e => setAdjustForm(prev => ({ ...prev, quantity_delta: e.target.value }))}
                                />
                                <div className="form-text small">Use negative values to deduct (e.g. -5), positive to add (e.g. 5).</div>
                            </div>

                            <div className="mb-3">
                                <label className="form-label small fw-semibold text-secondary">Reason / Explanation</label>
                                <input
                                    type="text"
                                    className="form-control"
                                    placeholder="Brief reason for stock change"
                                    value={adjustForm.reason}
                                    onChange={e => setAdjustForm(prev => ({ ...prev, reason: e.target.value }))}
                                />
                            </div>
                        </div>
                        <div className="modal-footer bg-light py-2">
                            <button type="button" className="btn btn-secondary btn-sm" onClick={onClose}>Cancel</button>
                            <button type="submit" className="btn btn-warning text-white btn-sm px-4" disabled={submitting}>
                                {submitting ? "Submitting..." : "Apply Adjustment"}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
