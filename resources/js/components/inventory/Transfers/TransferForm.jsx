import React from "react";

export default function TransferForm({
    show,
    onClose,
    onSubmit,
    submitting,
    contexts,
    stockItems,
    transferForm,
    setTransferForm
}) {
    if (!show) return null;

    return (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
            <div className="modal-dialog">
                <div className="modal-content border-0 shadow-lg rounded-3">
                    <form onSubmit={onSubmit}>
                        <div className="modal-header border-bottom py-3">
                            <h5 className="modal-title fw-bold text-dark">
                                <i className="bi bi-arrow-left-right text-primary me-2"></i>
                                Initiate Warehouse Transfer
                            </h5>
                            <button type="button" className="btn-close" onClick={onClose}></button>
                        </div>
                        <div className="modal-body p-4">
                            <div className="mb-3">
                                <label className="form-label small fw-semibold text-secondary">Source Warehouse</label>
                                <select
                                    className="form-select"
                                    required
                                    value={transferForm.from_warehouse_id}
                                    onChange={e => setTransferForm(prev => ({ ...prev, from_warehouse_id: e.target.value }))}
                                >
                                    <option value="">Select From Warehouse</option>
                                    {(contexts.warehouses || []).map(w => (
                                        <option key={w.id} value={w.id}>{w.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="mb-3">
                                <label className="form-label small fw-semibold text-secondary">Destination Warehouse</label>
                                <select
                                    className="form-select"
                                    required
                                    value={transferForm.to_warehouse_id}
                                    onChange={e => setTransferForm(prev => ({ ...prev, to_warehouse_id: e.target.value }))}
                                >
                                    <option value="">Select To Warehouse</option>
                                    {(contexts.warehouses || [])
                                        .filter(w => String(w.id) !== String(transferForm.from_warehouse_id))
                                        .map(w => (
                                            <option key={w.id} value={w.id}>{w.name}</option>
                                        ))
                                    }
                                </select>
                            </div>

                            <div className="mb-3">
                                <label className="form-label small fw-semibold text-secondary">Product to Transfer</label>
                                <select
                                    className="form-select"
                                    required
                                    value={transferForm.product_variant_id}
                                    onChange={e => setTransferForm(prev => ({ ...prev, product_variant_id: e.target.value }))}
                                >
                                    <option value="">Select Product</option>
                                    {stockItems
                                        .filter(s => !transferForm.from_warehouse_id || String(s.warehouse_id) === String(transferForm.from_warehouse_id))
                                        .map(s => (
                                            <option key={s.id} value={s.product_variant_id}>
                                                {s.product_name} (Avail: {s.available_qty} {s.unit_symbol})
                                            </option>
                                        ))
                                    }
                                </select>
                            </div>

                            <div className="mb-3">
                                <label className="form-label small fw-semibold text-secondary">Quantity to Transfer</label>
                                <input
                                    type="number"
                                    step="0.0001"
                                    min="0.0001"
                                    className="form-control"
                                    required
                                    value={transferForm.quantity}
                                    onChange={e => setTransferForm(prev => ({ ...prev, quantity: e.target.value }))}
                                />
                            </div>

                            <div className="mb-3">
                                <label className="form-label small fw-semibold text-secondary">Remarks / Internal Note</label>
                                <input
                                    type="text"
                                    className="form-control"
                                    placeholder="Reason for transfer"
                                    value={transferForm.remarks}
                                    onChange={e => setTransferForm(prev => ({ ...prev, remarks: e.target.value }))}
                                />
                            </div>
                        </div>
                        <div className="modal-footer bg-light py-2">
                            <button type="button" className="btn btn-secondary btn-sm" onClick={onClose}>Cancel</button>
                            <button type="submit" className="btn btn-primary btn-sm px-4" disabled={submitting}>
                                {submitting ? "Transferring..." : "Confirm Transfer"}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
