import React from 'react';

export default function ProductAttributes({
    units,
    attributes,
    assignedAttributeIds,
    showAttrModal,
    setShowAttrModal,
    showAddExistingAttrModal,
    setShowAddExistingAttrModal,
    selectedExistingAttrId,
    setSelectedExistingAttrId,
    attrToRemove,
    setAttrToRemove,
    attributeForm,
    setAttributeForm,
    handleAttributeSubmit,
    handleAddExistingAttributeSubmit,
    confirmRemoveAttribute,
    loadFormData,
    loading,
    productForm,
    setProductForm
}) {
    return (
        <>
            {/* MODAL: DEFINE CUSTOM SPECIFICATION ATTRIBUTE */}
            {showAttrModal && (
                <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: "rgba(0,0,0,0.5)", zIndex: 1100 }}>
                    <div className="modal-dialog modal-dialog-centered modal-sm">
                        <div className="modal-content shadow-lg border-0" style={{ borderRadius: "12px" }}>
                            <div className="modal-header border-bottom-0 pt-4 px-4">
                                <h5 className="modal-title fw-bold fs-5">Define Specification Attribute</h5>
                                <button type="button" className="btn-close" onClick={() => setShowAttrModal(false)}></button>
                            </div>
                            <form onSubmit={(e) => handleAttributeSubmit(e, loadFormData)}>
                                <div className="modal-body px-4">
                                    <div className="mb-3">
                                        <label className="form-label small fw-semibold">Attribute Name *</label>
                                        <input 
                                            type="text" 
                                            className="form-control" 
                                            placeholder="e.g. Size, Color, Thickness" 
                                            value={attributeForm.name} 
                                            onChange={(e) => setAttributeForm({ ...attributeForm, name: e.target.value })} 
                                            required 
                                        />
                                    </div>
                                    <div className="mb-3">
                                        <label className="form-label small fw-semibold">Value Type *</label>
                                        <select 
                                            className="form-select" 
                                            value={attributeForm.type} 
                                            onChange={(e) => setAttributeForm({ ...attributeForm, type: e.target.value })} 
                                            required
                                        >
                                            <option value="string">String / Text</option>
                                            <option value="number">Numeric</option>
                                            <option value="list">List / Collection</option>
                                        </select>
                                    </div>
                                    <div className="mb-3">
                                        <label className="form-label small fw-semibold">Specification Unit</label>
                                        <select 
                                            className="form-select" 
                                            value={attributeForm.unit_id} 
                                            onChange={(e) => setAttributeForm({ ...attributeForm, unit_id: e.target.value })} 
                                        >
                                            <option value="">NO UNIT</option>
                                            <optgroup label="Length Dimensions">
                                                {units.filter(u => (u.dimension_category || u.type) === 'LENGTH' || ['MM', 'CM', 'M', 'IN', 'FT'].includes(u.symbol?.toUpperCase())).map(u => (
                                                    <option key={u.id} value={u.id}>{u.name} ({u.symbol})</option>
                                                ))}
                                            </optgroup>
                                            <optgroup label="Area Dimensions">
                                                {units.filter(u => (u.dimension_category || u.type) === 'AREA' || ['SQ.MM', 'SQ.CM', 'SQ.M', 'SQ.IN', 'SQ.FT', 'SQFT', 'SQ.FT.'].includes(u.symbol?.toUpperCase())).map(u => (
                                                    <option key={u.id} value={u.id}>{u.name} ({u.symbol})</option>
                                                ))}
                                            </optgroup>
                                            <optgroup label="Volume Dimensions">
                                                {units.filter(u => (u.dimension_category || u.type) === 'VOLUME' || ['L', 'LTR', 'LITRE', 'LITER', 'CU.MM', 'CU.CM', 'CU.M', 'CU.FT'].includes(u.symbol?.toUpperCase())).map(u => (
                                                    <option key={u.id} value={u.id}>{u.name} ({u.symbol})</option>
                                                ))}
                                            </optgroup>
                                            <optgroup label="Mass / Weight Dimensions">
                                                {units.filter(u => (u.dimension_category || u.type) === 'MASS' || ['G', 'GM', 'GRAM', 'KG', 'TON', 'MT'].includes(u.symbol?.toUpperCase())).map(u => (
                                                    <option key={u.id} value={u.id}>{u.name} ({u.symbol})</option>
                                                ))}
                                            </optgroup>
                                        </select>
                                        <small className="text-muted extra-small d-block mt-1">Select physical measurement unit (e.g., Millimeter, Foot, Square Foot, Cubic Meter) or leave as NO UNIT.</small>
                                    </div>
                                </div>
                                <div className="modal-footer border-top-0 pb-4 px-4">
                                    <button type="button" className="btn btn-secondary px-3" onClick={() => setShowAttrModal(false)}>Cancel</button>
                                    <button type="submit" className="btn btn-primary px-4" disabled={loading}>
                                        {loading ? <span className="spinner-border spinner-border-sm me-2"></span> : null}
                                        Define & Add
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL: ADD EXISTING ATTRIBUTE TO PRODUCT */}
            {showAddExistingAttrModal && (
                <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: "rgba(0,0,0,0.5)", zIndex: 1110 }}>
                    <div className="modal-dialog modal-dialog-centered modal-sm">
                        <div className="modal-content shadow-lg border-0" style={{ borderRadius: "12px" }}>
                            <div className="modal-header border-bottom-0 pt-4 px-4">
                                <h5 className="modal-title fw-bold fs-5">Add Existing Attribute</h5>
                                <button type="button" className="btn-close" onClick={() => setShowAddExistingAttrModal(false)}></button>
                            </div>
                            {attributes.filter(a => !assignedAttributeIds.includes(a.id)).length === 0 ? (
                                <div className="modal-body px-4 py-3 text-center">
                                    <p className="text-muted small mb-3">All registered attribute definitions are already assigned to this product, or none exist yet.</p>
                                    <button 
                                        type="button" 
                                        className="btn btn-sm btn-primary px-3"
                                        onClick={() => {
                                            setShowAddExistingAttrModal(false);
                                            setShowAttrModal(true);
                                        }}
                                    >
                                        <i className="fa-solid fa-plus me-1"></i> Define New Attribute
                                    </button>
                                </div>
                            ) : (
                                <form onSubmit={handleAddExistingAttributeSubmit}>
                                    <div className="modal-body px-4">
                                        <div className="mb-3">
                                            <label className="form-label small fw-semibold">Select Organization Attribute *</label>
                                            <select 
                                                className="form-select" 
                                                value={selectedExistingAttrId} 
                                                onChange={(e) => setSelectedExistingAttrId(e.target.value)} 
                                                required
                                            >
                                                <option value="">Choose Attribute...</option>
                                                {attributes.filter(a => !assignedAttributeIds.includes(a.id)).map(a => (
                                                    <option key={a.id} value={a.id}>
                                                        {a.name} ({a.unit ? `${a.unit.name} (${a.unit.symbol})` : "NO UNIT"})
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                    <div className="modal-footer border-top-0 pb-4 px-4">
                                        <button type="button" className="btn btn-secondary px-3" onClick={() => setShowAddExistingAttrModal(false)}>Cancel</button>
                                        <button type="submit" className="btn btn-primary px-4" disabled={!selectedExistingAttrId}>
                                            Add Specification
                                        </button>
                                    </div>
                                </form>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL: REMOVE ATTRIBUTE CONFIRMATION */}
            {attrToRemove && (
                <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: "rgba(0,0,0,0.5)", zIndex: 1150 }}>
                    <div className="modal-dialog modal-dialog-centered modal-sm">
                        <div className="modal-content shadow-lg border-0" style={{ borderRadius: "12px" }}>
                            <div className="modal-header border-bottom-0 pt-4 px-4">
                                <h5 className="modal-title fw-bold fs-6 text-danger d-flex align-items-center gap-2">
                                    <i className="fa-solid fa-triangle-exclamation"></i> Remove Specification?
                                </h5>
                                <button type="button" className="btn-close" onClick={() => setAttrToRemove(null)}></button>
                            </div>
                            <div className="modal-body px-4 py-2">
                                <p className="small mb-2">Remove <strong>"{attrToRemove.name}"</strong> from this product?</p>
                                <p className="text-muted small mb-0" style={{ fontSize: "0.75rem" }}>
                                    This will remove the specification from this product. It will not delete the Attribute Definition.
                                </p>
                            </div>
                            <div className="modal-footer border-top-0 pb-4 px-4 pt-3">
                                <button type="button" className="btn btn-sm btn-secondary px-3" onClick={() => setAttrToRemove(null)}>Cancel</button>
                                <button type="button" className="btn btn-sm btn-danger px-3" onClick={() => confirmRemoveAttribute(productForm?.id, productForm, setProductForm)}>Remove</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
