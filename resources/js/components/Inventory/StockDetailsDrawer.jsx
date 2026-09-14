import React from "react";

export default function StockDetailsDrawer({
    item,
    onClose,
    recentActivity,
    activityLoading,
    openReserveModal,
    openLowStockModal
}) {
    if (!item) return null;

    return (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
            <div className="modal-dialog modal-lg modal-dialog-scrollable">
                <div className="modal-content border-0 shadow-lg rounded-3">
                    <div className="modal-header border-bottom py-3">
                        <div>
                            <h5 className="modal-title fw-bold text-dark">{item.product_name}</h5>
                            <div className="small text-muted mt-0.5">
                                SKU: <span className="font-monospace text-dark fw-semibold">{item.sku}</span> | Category: {item.category_name}
                            </div>
                        </div>
                        <button type="button" className="btn-close" onClick={onClose}></button>
                    </div>
                    <div className="modal-body p-4">
                        {/* Stock Summary Header Cards */}
                        <div className="row g-2 mb-4">
                            <div className="col-6 col-md-3">
                                <div className="bg-light p-3 rounded-3 border text-center">
                                    <span className="text-secondary small fw-semibold text-uppercase">On Hand</span>
                                    <div className="h4 fw-bold text-dark mb-0 mt-1">
                                        {item.on_hand_qty} {item.unit_symbol}
                                    </div>
                                </div>
                            </div>
                            <div className="col-6 col-md-3">
                                <div className="bg-light p-3 rounded-3 border text-center">
                                    <span className="text-secondary small fw-semibold text-uppercase">Reserved</span>
                                    <div className="h4 fw-bold text-warning mb-0 mt-1">
                                        {item.reserved_qty} {item.unit_symbol}
                                    </div>
                                </div>
                            </div>
                            <div className="col-6 col-md-3">
                                <div className="bg-light p-3 rounded-3 border text-center">
                                    <span className="text-secondary small fw-semibold text-uppercase">Available</span>
                                    <div className="h4 fw-bold text-success mb-0 mt-1">
                                        {item.available_qty} {item.unit_symbol}
                                    </div>
                                </div>
                            </div>
                            <div className="col-6 col-md-3">
                                <div className="bg-light p-3 rounded-3 border text-center">
                                    <span className="text-secondary small fw-semibold text-uppercase">Low Stock Level</span>
                                    <div className="h4 fw-bold text-danger mb-0 mt-1">
                                        {item.low_stock_warning_level} {item.unit_symbol}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="d-flex align-items-center justify-content-between mb-3">
                            <h6 className="fw-bold text-dark mb-0">Warehouse & Storage Location</h6>
                            <div className="d-flex gap-2">
                                <button
                                    className="btn btn-sm btn-outline-primary"
                                    onClick={() => {
                                        const itemToReserve = item;
                                        onClose();
                                        openReserveModal(itemToReserve);
                                    }}
                                >
                                    <i className="bi bi-bookmark-plus me-1"></i> Reserve Stock
                                </button>
                                <button
                                    className="btn btn-sm btn-outline-warning"
                                    onClick={() => {
                                        const itemToEdit = item;
                                        onClose();
                                        openLowStockModal(itemToEdit);
                                    }}
                                >
                                    <i className="bi bi-sliders me-1"></i> Warning Level
                                </button>
                            </div>
                        </div>

                        <div className="card border rounded-3 p-3 mb-4 bg-light">
                            <div className="row g-2">
                                <div className="col-md-6">
                                    <span className="text-muted small d-block">Warehouse</span>
                                    <strong className="text-dark">{item.warehouse_name}</strong>
                                </div>
                                <div className="col-md-6">
                                    <span className="text-muted small d-block">Storage Location Code</span>
                                    <span className="badge bg-white text-dark border font-monospace ms-0">{item.storage_location_code}</span>
                                </div>
                            </div>
                        </div>

                        {/* Granite Slab Details */}
                        {item.is_slab && item.slabs?.length > 0 && (
                            <div className="mb-4">
                                <h6 className="fw-bold text-dark mb-2">Individual Slab Inventory ({item.slabs.length} Slabs)</h6>
                                <div className="table-responsive border rounded-3">
                                    <table className="table table-sm table-hover mb-0 align-middle">
                                        <thead className="bg-light">
                                            <tr>
                                                <th className="ps-3 py-2">Slab Code</th>
                                                <th className="py-2">Dimensions (L × W × T)</th>
                                                <th className="py-2 text-end">Area (sq.ft)</th>
                                                <th className="py-2">Finish</th>
                                                <th className="pe-3 py-2 text-center">Status</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {item.slabs.map(slab => (
                                                <tr key={slab.id}>
                                                    <td className="ps-3 py-2 font-monospace fw-bold">{slab.slab_code}</td>
                                                    <td className="py-2">{slab.length} × {slab.width} × {slab.thickness} mm</td>
                                                    <td className="py-2 text-end fw-semibold">{slab.area}</td>
                                                    <td className="py-2">{slab.finish}</td>
                                                    <td className="pe-3 py-2 text-center">
                                                        <span className={`badge ${slab.status === 'RESERVED' ? 'bg-warning text-dark' : 'bg-success'} px-2 py-1`}>
                                                            {slab.status}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}

                        {/* Recent Activity */}
                        <h6 className="fw-bold text-dark mb-2">Recent Stock Activity History</h6>
                        {activityLoading ? (
                            <div className="text-center py-3 text-muted">
                                <div className="spinner-border spinner-border-sm me-2" role="status"></div>
                                Loading audit history...
                            </div>
                        ) : recentActivity.length === 0 ? (
                            <div className="text-muted small py-2">No recent movement records found.</div>
                        ) : (
                            <div className="table-responsive border rounded-3">
                                <table className="table table-sm mb-0 align-middle">
                                    <thead className="bg-light">
                                        <tr>
                                            <th className="ps-3 py-2">Date</th>
                                            <th className="py-2">Movement</th>
                                            <th className="py-2 text-end">Change</th>
                                            <th className="pe-3 py-2">User</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {recentActivity.map(act => (
                                            <tr key={act.id}>
                                                <td className="ps-3 py-2 text-muted fs-7">{act.date}</td>
                                                <td className="py-2 fs-7 fw-medium">{act.movement_label}</td>
                                                <td className={`py-2 text-end fs-7 fw-bold ${act.quantity_delta > 0 ? 'text-success' : 'text-danger'}`}>
                                                    {act.quantity_delta > 0 ? `+${act.quantity_delta}` : act.quantity_delta} {act.unit_symbol}
                                                </td>
                                                <td className="pe-3 py-2 text-muted fs-7">{act.user_name}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                    <div className="modal-footer bg-light py-2">
                        <button type="button" className="btn btn-secondary btn-sm" onClick={onClose}>Close</button>
                    </div>
                </div>
            </div>
        </div>
    );
}
