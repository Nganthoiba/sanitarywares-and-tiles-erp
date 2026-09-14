import React from 'react';

export default function ProductInventorySummary({ selectedProduct, inventorySummary }) {
    if (!selectedProduct) return null;

    return (
        <div className="tab-pane fade" id="pane-inventory" role="tabpanel">
            <h5 className="fw-bold mb-4 text-dark">Calculated Stock Inventory</h5>
            
            {inventorySummary ? (
                <div>
                    {inventorySummary.is_measured ? (
                        // Measured (Granite / Marble)
                        <div className="row g-3">
                            <div className="col-md-4">
                                <div className="card border-light p-3 text-center rounded-3 bg-light">
                                    <span className="text-muted small d-block mb-1">Current Slabs Count</span>
                                    <h3 className="fw-bold text-dark">{inventorySummary.measured.current_slabs}</h3>
                                </div>
                            </div>
                            <div className="col-md-4">
                                <div className="card border-light p-3 text-center rounded-3 bg-success-subtle border-0">
                                    <span className="text-muted small d-block mb-1">Available Area</span>
                                    <h3 className="fw-bold text-success">{inventorySummary.measured.available_area.toFixed(2)} Sq.Ft</h3>
                                </div>
                            </div>
                            <div className="col-md-4">
                                <div className="card border-light p-3 text-center rounded-3 bg-warning-subtle border-0">
                                    <span className="text-muted small d-block mb-1">Reserved Area</span>
                                    <h3 className="fw-bold text-warning">{inventorySummary.measured.reserved_area.toFixed(2)} Sq.Ft</h3>
                                </div>
                            </div>
                            <div className="col-12 mt-3 text-center">
                                <strong className="text-dark small d-block">Total Measured Area On Hand: {inventorySummary.measured.total_area.toFixed(2)} SQFT</strong>
                            </div>
                        </div>
                    ) : (
                        // Standard (Tiles / Sanitaryware)
                        <div className="row g-3">
                            <div className="col-md-4">
                                <div className="card border-light p-3 text-center rounded-3 bg-light">
                                    <span className="text-muted small d-block mb-1">Current Stock On Hand</span>
                                    <h3 className="fw-bold text-dark">{inventorySummary.standard.current_stock}</h3>
                                    <small className="text-muted">{selectedProduct.base_unit?.symbol}</small>
                                </div>
                            </div>
                            <div className="col-md-4">
                                <div className="card border-light p-3 text-center rounded-3 bg-success-subtle border-0">
                                    <span className="text-muted small d-block mb-1">Available Stock</span>
                                    <h3 className="fw-bold text-success">{inventorySummary.standard.available_stock}</h3>
                                    <small className="text-muted">{selectedProduct.base_unit?.symbol}</small>
                                </div>
                            </div>
                            <div className="col-md-4">
                                <div className="card border-light p-3 text-center rounded-3 bg-warning-subtle border-0">
                                    <span className="text-muted small d-block mb-1">Reserved Stock</span>
                                    <h3 className="fw-bold text-warning">{inventorySummary.standard.reserved_stock}</h3>
                                    <small className="text-muted">{selectedProduct.base_unit?.symbol}</small>
                                </div>
                            </div>
                        </div>
                    )}
                    <div className="mt-4 p-3 bg-light rounded-3 border text-center small text-muted border-light">
                        <i className="fa-solid fa-circle-exclamation me-1"></i>
                        Physical slabs measurements & counts are updated live during receiving (GRN) and order allocations.
                    </div>
                </div>
            ) : (
                <div className="text-muted small py-4 text-center">No inventory snapshot details calculated for this product.</div>
            )}
        </div>
    );
}
