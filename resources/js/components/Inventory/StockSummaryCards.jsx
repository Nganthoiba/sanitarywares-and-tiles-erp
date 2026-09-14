import React from "react";

export default function StockSummaryCards({ summaryCards }) {
    return (
        <div className="row g-3 mb-4">
            <div className="col-12 col-sm-6 col-xl-3">
                <div className="card border-0 shadow-sm rounded-3 h-100 bg-white">
                    <div className="card-body p-3">
                        <div className="d-flex align-items-center justify-content-between">
                            <div>
                                <span className="text-secondary small fw-semibold text-uppercase tracking-wider">Total Products In Stock</span>
                                <h3 className="h2 fw-bold text-dark mb-0 mt-1">{summaryCards.total_stock}</h3>
                                <span className="text-muted fs-7">Unique stock entries</span>
                            </div>
                            <div className="p-3 bg-primary-subtle text-primary rounded-3 d-flex align-items-center justify-content-center" style={{ width: '48px', height: '48px' }}>
                                <i className="fa-solid fa-boxes-stacked fs-4"></i>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="col-12 col-sm-6 col-xl-3">
                <div className="card border-0 shadow-sm rounded-3 h-100 bg-white">
                    <div className="card-body p-3">
                        <div className="d-flex align-items-center justify-content-between">
                            <div>
                                <span className="text-secondary small fw-semibold text-uppercase tracking-wider">Available Stock</span>
                                <h3 className="h2 fw-bold text-success mb-0 mt-1">
                                    {Number(summaryCards.available_stock).toLocaleString()}
                                </h3>
                                <span className="text-muted fs-7">Ready for sale/dispatch</span>
                            </div>
                            <div className="p-3 bg-success-subtle text-success rounded-3 d-flex align-items-center justify-content-center" style={{ width: '48px', height: '48px' }}>
                                <i className="fa-solid fa-circle-check fs-4"></i>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="col-12 col-sm-6 col-xl-3">
                <div className="card border-0 shadow-sm rounded-3 h-100 bg-white">
                    <div className="card-body p-3">
                        <div className="d-flex align-items-center justify-content-between">
                            <div>
                                <span className="text-secondary small fw-semibold text-uppercase tracking-wider">Reserved Stock</span>
                                <h3 className="h2 fw-bold text-warning mb-0 mt-1">
                                    {Number(summaryCards.reserved_stock).toLocaleString()}
                                </h3>
                                <span className="text-muted fs-7">Committed to orders/quotes</span>
                            </div>
                            <div className="p-3 bg-warning-subtle text-warning rounded-3 d-flex align-items-center justify-content-center" style={{ width: '48px', height: '48px' }}>
                                <i className="fa-solid fa-lock fs-4"></i>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="col-12 col-sm-6 col-xl-3">
                <div className="card border-0 shadow-sm rounded-3 h-100 bg-white">
                    <div className="card-body p-3">
                        <div className="d-flex align-items-center justify-content-between">
                            <div>
                                <span className="text-secondary small fw-semibold text-uppercase tracking-wider">Low Stock Warning</span>
                                <h3 className="h2 fw-bold text-danger mb-0 mt-1">{summaryCards.low_stock_count}</h3>
                                <span className="text-muted fs-7">Products at/below warning level</span>
                            </div>
                            <div className="p-3 bg-danger-subtle text-danger rounded-3 d-flex align-items-center justify-content-center" style={{ width: '48px', height: '48px' }}>
                                <i className="fa-solid fa-triangle-exclamation fs-4"></i>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
