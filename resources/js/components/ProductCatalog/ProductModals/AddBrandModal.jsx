import React from 'react';

export default function AddBrandModal({
    show,
    onClose,
    brandForm,
    setBrandForm,
    onSubmit,
    loading
}) {
    if (!show) return null;

    return (
        <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: "rgba(0,0,0,0.5)", zIndex: 1100 }}>
            <div className="modal-dialog modal-dialog-centered">
                <div className="modal-content shadow-lg border-0" style={{ borderRadius: "12px" }}>
                    <div className="modal-header border-bottom-0 pt-4 px-4">
                        <h5 className="modal-title fw-bold fs-5">Quick Add Brand</h5>
                        <button type="button" className="btn-close" onClick={onClose}></button>
                    </div>
                    <form onSubmit={onSubmit}>
                        <div className="modal-body px-4">
                            <div className="mb-3">
                                <label className="form-label small fw-semibold">Brand Name *</label>
                                <input 
                                    type="text" 
                                    className="form-control" 
                                    value={brandForm.name} 
                                    onChange={(e) => setBrandForm({ ...brandForm, name: e.target.value })} 
                                    required 
                                />
                            </div>
                            <div className="mb-3">
                                <label className="form-label small fw-semibold">Description</label>
                                <textarea 
                                    className="form-control" 
                                    rows="3"
                                    value={brandForm.description}
                                    onChange={(e) => setBrandForm({ ...brandForm, description: e.target.value })}
                                ></textarea>
                            </div>
                        </div>
                        <div className="modal-footer border-top-0 pb-4 px-4">
                            <button type="button" className="btn btn-secondary px-3" onClick={onClose}>Cancel</button>
                            <button type="submit" className="btn btn-primary px-4" disabled={loading}>
                                {loading ? <span className="spinner-border spinner-border-sm me-2"></span> : null}
                                Save Brand
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
