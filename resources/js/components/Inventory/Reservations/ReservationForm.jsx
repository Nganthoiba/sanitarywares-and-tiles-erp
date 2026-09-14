import React from "react";
import QuickCustomerModal from "../../sales/QuickCustomerModal";

export default function ReservationForm({
    show,
    onClose,
    onSubmit,
    submitting,
    contexts,
    reserveForm,
    setReserveForm,
    selectedReserveProduct,
    matchingStockEntry,
    currentOnHand,
    currentReserved,
    currentAvailable,
    selectedUnitSymbol,
    isExceedingAvailable,
    showCustomerModal,
    setShowCustomerModal,
    handleCustomerCreated
}) {
    if (!show) return null;

    return (
        <>
            <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
                <div className="modal-dialog modal-lg">
                    <div className="modal-content border-0 shadow-lg rounded-3">
                        <form onSubmit={onSubmit}>
                            <div className="modal-header border-bottom py-3">
                                <h5 className="modal-title fw-bold text-dark">
                                    <i className="bi bi-bookmark-plus text-primary me-2"></i>
                                    Reserve Stock
                                </h5>
                                <button type="button" className="btn-close" onClick={onClose}></button>
                            </div>
                            <div className="modal-body p-4">
                                {/* Availability Live Context Banner */}
                                {reserveForm.product_variant_id && (
                                    <div className="card border-0 bg-primary-subtle rounded-3 mb-3 p-3">
                                        <div className="d-flex align-items-center justify-content-between">
                                            <div>
                                                <div className="fw-bold text-dark">
                                                    {selectedReserveProduct?.name || 'Selected Product'}
                                                </div>
                                                <div className="small text-muted">
                                                    SKU: {selectedReserveProduct?.sku || '-'}
                                                </div>
                                            </div>
                                            <div className="d-flex gap-3 text-end">
                                                <div>
                                                    <span className="small text-secondary d-block">On Hand</span>
                                                    <strong className="text-dark">{currentOnHand} {selectedUnitSymbol}</strong>
                                                </div>
                                                <div>
                                                    <span className="small text-secondary d-block">Reserved</span>
                                                    <strong className="text-warning">{currentReserved} {selectedUnitSymbol}</strong>
                                                </div>
                                                <div>
                                                    <span className="small text-secondary d-block">Available</span>
                                                    <strong className="text-success">{currentAvailable} {selectedUnitSymbol}</strong>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {isExceedingAvailable && (
                                    <div className="alert alert-danger p-2.5 small mb-3">
                                        <i className="bi bi-exclamation-triangle-fill me-1"></i>
                                        Cannot reserve {reserveForm.quantity} {selectedUnitSymbol} because only {currentAvailable} {selectedUnitSymbol} is available.
                                    </div>
                                )}

                                <div className="row g-3">
                                    <div className="col-12 col-md-6">
                                        <label className="form-label small fw-semibold text-secondary">Product <span className="text-danger">*</span></label>
                                        <select
                                            className="form-select"
                                            required
                                            value={reserveForm.product_variant_id}
                                            onChange={e => setReserveForm(prev => ({ ...prev, product_variant_id: e.target.value }))}
                                        >
                                            <option value="">Select Product</option>
                                            {(contexts.product_variants || []).map(p => (
                                                <option key={p.id} value={p.id}>
                                                    {p.name} ({p.sku})
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="col-12 col-md-6">
                                        <label className="form-label small fw-semibold text-secondary">Warehouse <span className="text-danger">*</span></label>
                                        <select
                                            className="form-select"
                                            required
                                            value={reserveForm.warehouse_id}
                                            onChange={e => setReserveForm(prev => ({ ...prev, warehouse_id: e.target.value }))}
                                        >
                                            <option value="">Select Warehouse</option>
                                            {(contexts.warehouses || []).map(w => (
                                                <option key={w.id} value={w.id}>{w.name}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="col-12 col-md-6">
                                        <label className="form-label small fw-semibold text-secondary">Storage Location (Optional)</label>
                                        <select
                                            className="form-select"
                                            value={reserveForm.storage_location_id}
                                            onChange={e => setReserveForm(prev => ({ ...prev, storage_location_id: e.target.value }))}
                                        >
                                            <option value="">All / Any Location</option>
                                            {(contexts.storage_locations || [])
                                                .filter(l => !reserveForm.warehouse_id || String(l.warehouse_id) === String(reserveForm.warehouse_id))
                                                .map(l => (
                                                    <option key={l.id} value={l.id}>{l.name} ({l.code})</option>
                                                ))
                                            }
                                        </select>
                                    </div>

                                    <div className="col-12 col-md-6">
                                        <label className="form-label small fw-semibold text-secondary">Customer (Optional)</label>
                                        <div className="input-group">
                                            <select
                                                className="form-select"
                                                value={reserveForm.customer_id}
                                                onChange={e => setReserveForm(prev => ({ ...prev, customer_id: e.target.value }))}
                                            >
                                                <option value="">Select Customer</option>
                                                {(contexts.customers || []).map(c => (
                                                    <option key={c.id} value={c.id}>{c.name}</option>
                                                ))}
                                            </select>
                                            <button
                                                type="button"
                                                className="btn btn-outline-primary"
                                                title="Add a new customer quickly"
                                                onClick={() => setShowCustomerModal(true)}
                                            >
                                                <i className="fa fa-plus"></i>
                                            </button>
                                        </div>
                                    </div>

                                    <div className="col-12 col-md-4">
                                        <label className="form-label small fw-semibold text-secondary">Quantity to Reserve <span className="text-danger">*</span></label>
                                        <div className="input-group">
                                            <input
                                                type="number"
                                                step="0.0001"
                                                min="0.0001"
                                                className={`form-control ${isExceedingAvailable ? 'is-invalid' : ''}`}
                                                required
                                                value={reserveForm.quantity}
                                                onChange={e => setReserveForm(prev => ({ ...prev, quantity: e.target.value }))}
                                            />
                                            <span className="input-group-text bg-light">{selectedUnitSymbol}</span>
                                        </div>
                                    </div>

                                    <div className="col-12 col-md-4">
                                        <label className="form-label small fw-semibold text-secondary">Reservation Date</label>
                                        <input
                                            type="date"
                                            className="form-control"
                                            value={reserveForm.reservation_date}
                                            onChange={e => setReserveForm(prev => ({ ...prev, reservation_date: e.target.value }))}
                                        />
                                    </div>

                                    <div className="col-12 col-md-4">
                                        <label className="form-label small fw-semibold text-secondary">Expiry Date (Optional)</label>
                                        <input
                                            type="date"
                                            className="form-control"
                                            value={reserveForm.expires_at}
                                            onChange={e => setReserveForm(prev => ({ ...prev, expires_at: e.target.value }))}
                                        />
                                        <div className="form-text text-muted" style={{ fontSize: '0.75rem' }}>Leave blank for indefinite hold (Never Expires).</div>
                                    </div>

                                    <div className="col-12 col-md-6">
                                        <label className="form-label small fw-semibold text-secondary">Quotation / Sales Order Ref (Optional)</label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            placeholder="e.g. SO-2026-0042 or QUOTE-88"
                                            value={reserveForm.reference_number}
                                            onChange={e => setReserveForm(prev => ({ ...prev, reference_number: e.target.value }))}
                                        />
                                    </div>

                                    <div className="col-12 col-md-6">
                                        <label className="form-label small fw-semibold text-secondary">Remarks (Optional)</label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            placeholder="Customer hold request notes..."
                                            value={reserveForm.remarks}
                                            onChange={e => setReserveForm(prev => ({ ...prev, remarks: e.target.value }))}
                                        />
                                    </div>
                                </div>
                            </div>
                            <div className="modal-footer bg-light py-2">
                                <button type="button" className="btn btn-secondary btn-sm" onClick={onClose}>Cancel</button>
                                <button
                                    type="submit"
                                    className="btn btn-primary btn-sm px-4"
                                    disabled={submitting || isExceedingAvailable}
                                >
                                    {submitting ? "Reserving..." : "Confirm Reservation"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>

            {/* Quick Add Customer Modal */}
            <QuickCustomerModal
                show={showCustomerModal}
                onClose={() => setShowCustomerModal(false)}
                onCustomerCreated={handleCustomerCreated}
            />
        </>
    );
}
