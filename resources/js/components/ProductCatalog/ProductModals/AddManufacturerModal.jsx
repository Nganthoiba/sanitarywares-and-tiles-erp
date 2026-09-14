import React from 'react';

export default function AddManufacturerModal({
    show,
    onClose,
    manufacturerForm,
    setManufacturerForm,
    onSubmit,
    loading,
    manufacturerModalError,
    manufacturerModalSuccess,
    setManufacturerModalError,
    setManufacturerModalSuccess
}) {
    if (!show) return null;

    return (
        <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: "rgba(0,0,0,0.5)", zIndex: 1100 }}>
            <div className="modal-dialog modal-dialog-centered">
                <div className="modal-content shadow-lg border-0" style={{ borderRadius: "12px" }}>
                    <div className="modal-header border-bottom-0 pt-4 px-4">
                        <h5 className="modal-title fw-bold fs-5">Quick Add Manufacturer</h5>
                        <button type="button" className="btn-close" onClick={onClose}></button>
                    </div>
                    <form onSubmit={onSubmit}>
                        <div className="modal-body px-4">
                            {manufacturerModalError && (
                                <div className="alert alert-danger border-0 shadow-sm d-flex align-items-center justify-content-between mb-3" role="alert">
                                    <div className="d-flex align-items-center">
                                        <i className="fa-solid fa-circle-exclamation me-2 fs-5 text-danger"></i>
                                        <div>{manufacturerModalError}</div>
                                    </div>
                                    <button type="button" className="btn-close ms-2 flex-shrink-0" onClick={() => setManufacturerModalError(null)} aria-label="Close"></button>
                                </div>
                            )}

                            {manufacturerModalSuccess && (
                                <div className="alert alert-success border-0 shadow-sm d-flex align-items-center justify-content-between mb-3" role="alert">
                                    <div className="d-flex align-items-center">
                                        <i className="fa-solid fa-circle-check me-2 fs-5 text-success"></i>
                                        <div>{manufacturerModalSuccess}</div>
                                    </div>
                                    <button type="button" className="btn-close ms-2 flex-shrink-0" onClick={() => setManufacturerModalSuccess(null)} aria-label="Close"></button>
                                </div>
                            )}

                            <div className="mb-3">
                                <label className="form-label small fw-semibold">Legal Name *</label>
                                <input 
                                    type="text" 
                                    className="form-control" 
                                    placeholder="e.g. Kajaria Ceramics Limited"
                                    value={manufacturerForm.legal_name || manufacturerForm.name || ""} 
                                    onChange={(e) => setManufacturerForm({ ...manufacturerForm, legal_name: e.target.value, name: e.target.value })} 
                                    required 
                                />
                            </div>
                            <div className="mb-3">
                                <label className="form-label small fw-semibold">Trade Name</label>
                                <input 
                                    type="text" 
                                    className="form-control" 
                                    placeholder="e.g. Kajaria"
                                    value={manufacturerForm.trade_name || ""} 
                                    onChange={(e) => setManufacturerForm({ ...manufacturerForm, trade_name: e.target.value })} 
                                />
                            </div>
                            <div className="mb-3">
                                <label className="form-label small fw-semibold">GSTIN</label>
                                <input 
                                    type="text" 
                                    className="form-control font-monospace" 
                                    placeholder="e.g. 27AAACK1234F1Z5"
                                    value={manufacturerForm.gstin || ""} 
                                    onChange={(e) => setManufacturerForm({ ...manufacturerForm, gstin: e.target.value })} 
                                />
                            </div>
                            <div className="mb-3">
                                <label className="form-label small fw-semibold">Phone Number</label>
                                <input 
                                    type="text" 
                                    className="form-control font-monospace" 
                                    value={manufacturerForm.phone} 
                                    onChange={(e) => setManufacturerForm({ ...manufacturerForm, phone: e.target.value })} 
                                />
                            </div>
                            <div className="mb-3">
                                <label className="form-label small fw-semibold">Email Address</label>
                                <input 
                                    type="email" 
                                    className="form-control" 
                                    value={manufacturerForm.email} 
                                    onChange={(e) => setManufacturerForm({ ...manufacturerForm, email: e.target.value })} 
                                />
                            </div>
                            <div className="mb-3">
                                <label className="form-label small fw-semibold">Website</label>
                                <input 
                                    type="text" 
                                    className="form-control font-monospace" 
                                    value={manufacturerForm.website} 
                                    onChange={(e) => setManufacturerForm({ ...manufacturerForm, website: e.target.value })} 
                                />
                            </div>
                            <div className="mb-3">
                                <label className="form-label small fw-semibold">Address</label>
                                <textarea 
                                    className="form-control" 
                                    rows="2"
                                    value={manufacturerForm.address}
                                    onChange={(e) => setManufacturerForm({ ...manufacturerForm, address: e.target.value })}
                                ></textarea>
                            </div>
                        </div>
                        <div className="modal-footer border-top-0 pb-4 px-4">
                            <button type="button" className="btn btn-secondary px-3" onClick={onClose}>Cancel</button>
                            <button type="submit" className="btn btn-primary px-4" disabled={loading}>
                                {loading ? <span className="spinner-border spinner-border-sm me-2"></span> : null}
                                Save Manufacturer
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
