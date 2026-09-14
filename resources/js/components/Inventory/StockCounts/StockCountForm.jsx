import React from "react";

export default function StockCountForm({
    show,
    onClose,
    onSubmit,
    submitting,
    contexts,
    stockItems,
    countForm,
    setCountForm
}) {
    if (!show) return null;

    return (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
            <div className="modal-dialog">
                <div className="modal-content border-0 shadow-lg rounded-3">
                    <form onSubmit={onSubmit}>
                        <div className="modal-header border-bottom py-3">
                            <h5 className="modal-title fw-bold text-dark">
                                <i className="bi bi-clipboard-check text-success me-2"></i>
                                Stock Count Reconciliation
                            </h5>
                            <button type="button" className="btn-close" onClick={onClose}></button>
                        </div>
                        <div className="modal-body p-4">
                            <div className="mb-3">
                                <label className="form-label small fw-semibold text-secondary">Warehouse</label>
                                <select
                                    className="form-select"
                                    required
                                    value={countForm.warehouse_id}
                                    onChange={e => setCountForm(prev => ({ ...prev, warehouse_id: e.target.value }))}
                                >
                                    <option value="">Select Warehouse</option>
                                    {(contexts.warehouses || []).map(w => (
                                        <option key={w.id} value={w.id}>{w.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="mb-3">
                                <label className="form-label small fw-semibold text-secondary">Count Type</label>
                                <select
                                    className="form-select"
                                    value={countForm.count_type}
                                    onChange={e => setCountForm(prev => ({ ...prev, count_type: e.target.value }))}
                                >
                                    <option value="SPOT">Spot Count</option>
                                    <option value="CYCLE">Cycle Count</option>
                                    <option value="ANNUAL">Annual Physical Audit</option>
                                </select>
                            </div>

                            <div className="mb-3">
                                <label className="form-label small fw-semibold text-secondary">Product to Audit</label>
                                <select
                                    className="form-select"
                                    value={countForm.product_variant_id || ""}
                                    onChange={e => setCountForm(prev => ({ ...prev, product_variant_id: e.target.value }))}
                                >
                                    <option value="">Select Product (or Audit All)</option>
                                    {stockItems
                                        .filter(s => !countForm.warehouse_id || String(s.warehouse_id) === String(countForm.warehouse_id))
                                        .map(s => (
                                            <option key={s.id} value={s.product_variant_id}>
                                                {s.product_name} (System On Hand: {s.on_hand_qty} {s.unit_symbol})
                                            </option>
                                        ))
                                    }
                                </select>
                            </div>

                            <div className="mb-3">
                                <label className="form-label small fw-semibold text-secondary">Audit Remarks</label>
                                <input
                                    type="text"
                                    className="form-control"
                                    placeholder="Physical count verification notes"
                                    value={countForm.remarks}
                                    onChange={e => setCountForm(prev => ({ ...prev, remarks: e.target.value }))}
                                />
                            </div>
                        </div>
                        <div className="modal-footer bg-light py-2">
                            <button type="button" className="btn btn-secondary btn-sm" onClick={onClose}>Cancel</button>
                            <button type="submit" className="btn btn-success btn-sm px-4" disabled={submitting}>
                                {submitting ? "Processing..." : "Reconcile Count"}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
