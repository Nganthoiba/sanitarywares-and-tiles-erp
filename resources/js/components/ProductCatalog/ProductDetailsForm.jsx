import React from 'react';

export default function ProductDetailsForm({ selectedProduct }) {
    if (!selectedProduct) return null;

    return (
        <div className="tab-pane fade show active" id="pane-overview" role="tabpanel">
            <h5 className="fw-bold mb-4 text-dark">Product Overview</h5>
            <div className="row g-3">
                <div className="col-md-6 border-bottom pb-2">
                    <span className="text-muted d-block small">Product Name</span>
                    <strong className="text-dark">{selectedProduct.name}</strong>
                </div>
                <div className="col-md-6 border-bottom pb-2">
                    <span className="text-muted d-block small">Category</span>
                    <strong className="text-dark">{selectedProduct.category?.name || "N/A"}</strong>
                </div>
                <div className="col-md-6 border-bottom pb-2">
                    <span className="text-muted d-block small">Brand</span>
                    <strong className="text-dark">{selectedProduct.brand?.name || "N/A"}</strong>
                </div>
                <div className="col-md-6 border-bottom pb-2">
                    <span className="text-muted d-block small">Manufacturer</span>
                    <strong className="text-dark">{selectedProduct.manufacturer?.name || "N/A"}</strong>
                </div>
                <div className="col-md-6 border-bottom pb-2">
                    <span className="text-muted d-block small">SKU Code</span>
                    <strong className="text-dark font-monospace">{selectedProduct.sku}</strong>
                </div>
                <div className="col-md-6 border-bottom pb-2">
                    <span className="text-muted d-block small">GTIN / EAN</span>
                    <strong className="text-dark font-monospace">{selectedProduct.gtin || "-"}</strong>
                </div>
                <div className="col-md-6 border-bottom pb-2">
                    <span className="text-muted d-block small">Barcode Scan Code</span>
                    <strong className="text-dark font-monospace">{selectedProduct.barcode || "-"}</strong>
                </div>
                <div className="col-md-6 border-bottom pb-2">
                    <span className="text-muted d-block small">Product Type</span>
                    <strong className="text-dark">{selectedProduct.inventory_behavior === 'SLAB' ? 'Measured Material' : 'Standard Product'}</strong>
                </div>
                <div className="col-md-6 border-bottom pb-2">
                    <span className="text-muted d-block small">Inventory Engine Behavior</span>
                    <strong className="text-dark font-monospace">{selectedProduct.inventory_behavior}</strong>
                </div>
            </div>
        </div>
    );
}
