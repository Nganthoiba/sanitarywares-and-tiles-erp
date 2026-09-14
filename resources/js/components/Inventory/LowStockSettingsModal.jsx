import React from 'react';

export default function LowStockSettingsModal({
    show,
    onClose,
    lowStockForm,
    setLowStockForm,
    onSubmit,
    submitting
}) {
    if (!show) return null;

    return (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
            <div className="modal-dialog modal-dialog-centered">
                <div className="modal-content shadow">
                    <div className="modal-header">
                        <h5 className="modal-title fw-bold">
                            <i className="bi bi-bell-fill text-warning me-2"></i> Low Stock Threshold Settings
                        </h5>
                        <button type="button" className="btn-close" onClick={onClose}></button>
                    </div>
                    <form onSubmit={onSubmit}>
                        <div className="modal-body">
                            <div className="mb-3">
                                <label className="form-label text-muted small fw-semibold">Product Variant</label>
                                <input type="text" className="form-control" value={lowStockForm.product_name} disabled readOnly />
                            </div>
                            <div className="mb-3">
                                <label className="form-label text-secondary small fw-semibold">Warning Threshold Level ({lowStockForm.unit_symbol})</label>
                                <input 
                                    type="number" 
                                    step="0.0001" 
                                    className="form-control" 
                                    value={lowStockForm.low_stock_warning_level} 
                                    onChange={e => setLowStockForm({ ...lowStockForm, low_stock_warning_level: e.target.value })} 
                                    placeholder="Enter threshold quantity (e.g. 10)" 
                                    required 
                                />
                                <div className="form-text fs-7">
                                    When available stock falls below this quantity, a low-stock warning badge will be displayed.
                                </div>
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button type="button" className="btn btn-secondary btn-sm" onClick={onClose}>Cancel</button>
                            <button type="submit" className="btn btn-primary btn-sm" disabled={submitting}>
                                {submitting ? <span className="spinner-border spinner-border-sm me-1"></span> : <i className="bi bi-check-lg me-1"></i>} Save Threshold
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
