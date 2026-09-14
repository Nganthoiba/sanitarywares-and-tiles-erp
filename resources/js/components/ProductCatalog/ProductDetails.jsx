import React from 'react';
import ProductDetailsForm from './ProductDetailsForm';
import ProductSpecifications from './ProductSpecifications';
import ProductInventorySummary from './ProductInventorySummary';

export default function ProductDetails({
    selectedProduct,
    detailLoading,
    navigateToList,
    setupEditProduct,
    units,
    conversions,
    conversionForm,
    setConversionForm,
    handleAddConversion,
    handleDeleteConversion,
    inventorySummary
}) {
    if (detailLoading || !selectedProduct) {
        return (
            <div className="text-center py-5">
                <span className="spinner-border spinner-border-sm text-primary me-2"></span> Retrieving product profile details...
            </div>
        );
    }

    return (
        <div>
            {/* Profile Header Card */}
            <div className="card border-0 bg-white p-4 rounded-3 mb-4 shadow-sm border border-light">
                <div className="d-flex justify-content-between align-items-start flex-wrap gap-3">
                    <div>
                        <span className="badge bg-primary text-uppercase mb-2" style={{ fontSize: "0.7rem" }}>
                            {selectedProduct.inventory_behavior === 'SLAB' ? 'Measured Material (Slab)' : 'Standard Product'}
                        </span>
                        <h3 className="fw-bold mb-1 text-dark">{selectedProduct.name}</h3>
                        <div className="text-muted d-flex gap-3 flex-wrap small">
                            <span><strong className="text-dark">SKU:</strong> {selectedProduct.sku}</span>
                            {selectedProduct.brand && <span><strong className="text-dark">Brand:</strong> {selectedProduct.brand.name}</span>}
                            <span>
                                <strong className="text-dark">Status:</strong> {selectedProduct.is_active ? (
                                    <span className="badge bg-success-subtle text-success">Active</span>
                                ) : (
                                    <span className="badge bg-danger-subtle text-danger">Inactive</span>
                                )}
                            </span>
                        </div>
                    </div>
                    <div className="d-flex gap-2">
                        <button className="btn btn-sm btn-secondary px-3" onClick={navigateToList}>
                            <i className="fa-solid fa-arrow-left me-1"></i> Back
                        </button>
                        <button className="btn btn-sm btn-primary px-3" onClick={() => setupEditProduct(selectedProduct.id)}>
                            <i className="fa-solid fa-pen me-1"></i> Edit Product
                        </button>
                    </div>
                </div>
            </div>

            {/* Tab Panels for Details */}
            <div className="row">
                <div className="col-lg-3 mb-4">
                    <div className="nav flex-column nav-pills bg-white p-2 rounded-3 shadow-sm border" role="tablist">
                        <button className="nav-link active text-start fw-semibold py-2.5 px-3 mb-1" id="tab-overview" data-bs-toggle="pill" data-bs-target="#pane-overview" type="button">
                            <i className="fa-solid fa-circle-info me-2 text-primary"></i> Overview
                        </button>
                        <button className="nav-link text-start fw-semibold py-2.5 px-3 mb-1" id="tab-specifications" data-bs-toggle="pill" data-bs-target="#pane-specifications" type="button">
                            <i className="fa-solid fa-sliders me-2 text-primary"></i> Specifications
                        </button>
                        <button className="nav-link text-start fw-semibold py-2.5 px-3 mb-1" id="tab-units" data-bs-toggle="pill" data-bs-target="#pane-units" type="button">
                            <i className="fa-solid fa-calculator me-2 text-primary"></i> Units & Conversions
                        </button>
                        <button className="nav-link text-start fw-semibold py-2.5 px-3 mb-1" id="tab-pricing" data-bs-toggle="pill" data-bs-target="#pane-pricing" type="button">
                            <i className="fa-solid fa-indian-rupee-sign me-2 text-primary"></i> Pricing Profiles
                        </button>
                        <button className="nav-link text-start fw-semibold py-2.5 px-3" id="tab-inventory" data-bs-toggle="pill" data-bs-target="#pane-inventory" type="button">
                            <i className="fa-solid fa-warehouse me-2 text-primary"></i> Stock Inventory
                        </button>
                    </div>
                </div>

                <div className="col-lg-9">
                    <div className="tab-content card border-0 p-4 rounded-3 shadow-sm bg-white border border-light">
                        
                        {/* Overview Pane */}
                        <ProductDetailsForm selectedProduct={selectedProduct} />

                        {/* Specifications Pane */}
                        <ProductSpecifications selectedProduct={selectedProduct} />

                        {/* Units Pane */}
                        <div className="tab-pane fade" id="pane-units" role="tabpanel">
                            <h5 className="fw-bold mb-4 text-dark">Product Units Configuration</h5>
                            <div className="row mb-4">
                                <div className="col-md-4">
                                    <div className="p-3 bg-light rounded-3 border-light text-center">
                                        <span className="text-muted small d-block mb-1">Primary Inventory / Base Unit</span>
                                        <strong className="fs-5 text-primary">{selectedProduct.base_unit?.name} ({selectedProduct.base_unit?.symbol})</strong>
                                    </div>
                                </div>
                                <div className="col-md-4">
                                    <div className="p-3 bg-light rounded-3 border-light text-center">
                                        <span className="text-muted small d-block mb-1">Default Purchase Unit</span>
                                        <strong className="fs-5 text-dark">{selectedProduct.purchase_unit?.name} ({selectedProduct.purchase_unit?.symbol})</strong>
                                    </div>
                                </div>
                                <div className="col-md-4">
                                    <div className="p-3 bg-light rounded-3 border-light text-center">
                                        <span className="text-muted small d-block mb-1">Default Sales Unit</span>
                                        <strong className="fs-5 text-dark">{selectedProduct.sales_unit?.name} ({selectedProduct.sales_unit?.symbol})</strong>
                                    </div>
                                </div>
                            </div>

                            <h6 className="fw-bold border-bottom pb-2 mb-3 text-dark">Unit Conversion Relations</h6>
                            <div className="table-responsive mb-4">
                                <table className="table align-middle border-light">
                                    <thead>
                                        <tr>
                                            <th>From Unit</th>
                                            <th>To Unit (Base)</th>
                                            <th>Conversion Multiplier</th>
                                            <th>Relationship Formula</th>
                                            <th className="text-end">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {conversions.length === 0 ? (
                                            <tr>
                                                <td colSpan="5" className="text-center text-muted small py-3">
                                                    No custom unit conversions defined. Add box-to-pieces or bulk-to-unit ratios below.
                                                </td>
                                            </tr>
                                        ) : (
                                            conversions.map(conv => (
                                                <tr key={conv.id}>
                                                    <td><strong>{conv.from_unit?.symbol}</strong></td>
                                                    <td>{conv.to_unit?.symbol}</td>
                                                    <td><strong className="text-primary">{parseFloat(conv.multiplier)}</strong></td>
                                                    <td className="font-monospace small">1 {conv.from_unit?.symbol} = {parseFloat(conv.multiplier)} {conv.to_unit?.symbol}</td>
                                                    <td className="text-end">
                                                        <button className="btn btn-xs btn-link text-danger" onClick={() => handleDeleteConversion(conv.id)}>
                                                            <i className="fa-solid fa-trash-can me-1"></i> Remove
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>

                            <form onSubmit={handleAddConversion} className="bg-light p-3 rounded-3 border border-light">
                                <h6 className="fw-bold mb-3 small text-uppercase text-muted">Add Conversion Relationship</h6>
                                <div className="row g-2 align-items-end">
                                    <div className="col-md-3">
                                        <label className="form-label small mb-1">From Unit</label>
                                        <select 
                                            className="form-select form-select-sm" 
                                            value={conversionForm.from_unit_id} 
                                            onChange={(e) => setConversionForm({ ...conversionForm, from_unit_id: e.target.value })}
                                            required
                                        >
                                            <option value="">Select Unit</option>
                                            {units.filter(u => u.id !== selectedProduct.base_unit_id).map(u => (
                                                <option key={u.id} value={u.id}>{u.name} ({u.symbol})</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="col-md-3">
                                        <label className="form-label small mb-1">To Base Unit</label>
                                        <input type="text" className="form-control form-control-sm" value={`${selectedProduct.base_unit?.name} (${selectedProduct.base_unit?.symbol})`} disabled readOnly />
                                    </div>
                                    <div className="col-md-3">
                                        <label className="form-label small mb-1">Multiplier Quantity</label>
                                        <input 
                                            type="number" 
                                            step="0.000001" 
                                            className="form-control form-control-sm" 
                                            placeholder="e.g. 1 Box = X pcs"
                                            value={conversionForm.multiplier} 
                                            onChange={(e) => setConversionForm({ ...conversionForm, multiplier: e.target.value })}
                                            required 
                                        />
                                    </div>
                                    <div className="col-md-3">
                                        <button type="submit" className="btn btn-sm btn-primary w-100">
                                            <i className="fa-solid fa-plus me-1"></i> Register Ratio
                                        </button>
                                    </div>
                                </div>
                            </form>
                        </div>

                        {/* Pricing Pane */}
                        <div className="tab-pane fade" id="pane-pricing" role="tabpanel">
                            <h5 className="fw-bold mb-4 text-dark">Pricing & Valuation Profile</h5>
                            <div className="alert alert-info border-0 rounded-3 mb-4 d-flex align-items-center justify-content-between">
                                 <div>
                                     <i className="fa-solid fa-circle-info me-2"></i>
                                     <strong>Batch-Based Dynamic Pricing:</strong> Purchase prices (cost price) and sale prices are tracked per inventory batch number upon goods receipt at the warehouse, rather than set statically at the product level.
                                 </div>
                                 <button type="button" className="btn-close ms-2 flex-shrink-0" onClick={(e) => { e.currentTarget.closest('.alert').style.display = 'none'; }} aria-label="Close"></button>
                             </div>
                            <div className="p-3 bg-light rounded-3">
                                <h6 className="fw-bold mb-3 small text-uppercase text-muted">Tax & Commercial Profile</h6>
                                <div className="row">
                                    <div className="col-md-6">
                                        <span className="text-muted d-block small">GST Tax Profile</span>
                                        <strong className="text-dark">{selectedProduct.tax_profile?.name || "None"}</strong>
                                    </div>
                                    <div className="col-md-6">
                                        <span className="text-muted d-block small">IGST Tax Rate</span>
                                        <strong className="text-dark">{selectedProduct.tax_profile?.igst_rate || 0}%</strong>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Inventory Pane */}
                        <ProductInventorySummary selectedProduct={selectedProduct} inventorySummary={inventorySummary} />

                    </div>
                </div>
            </div>
        </div>
    );
}
