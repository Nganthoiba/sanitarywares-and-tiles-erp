import React from "react";

export default function StockTable({
    stockItems,
    loading,
    stockPage,
    stockPerPage,
    setStockPage,
    openReserveModal,
    openLowStockModal,
    handleOpenDetails
}) {
    return (
        <div className="card border-0 shadow-sm rounded-3 mb-4 bg-white overflow-hidden">
            <div className="card-body p-0">
                <div className="table-responsive">
                    <table id="stock_table" className="table table-hover table-borderless align-middle mb-0">
                        <thead className="bg-light border-bottom">
                            <tr>
                                <th className="ps-4 py-3 text-secondary text-uppercase fs-7 fw-bold">Product</th>
                                <th className="py-3 text-secondary text-uppercase fs-7 fw-bold">Warehouse / Location</th>
                                <th className="py-3 text-end text-secondary text-uppercase fs-7 fw-bold">On Hand</th>
                                <th className="py-3 text-end text-secondary text-uppercase fs-7 fw-bold">Reserved</th>
                                <th className="py-3 text-end text-secondary text-uppercase fs-7 fw-bold">Available</th>
                                <th className="py-3 text-center text-secondary text-uppercase fs-7 fw-bold">Status</th>
                                <th className="pe-4 py-3 text-end text-secondary text-uppercase fs-7 fw-bold">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {loading ? (
                                <tr>
                                    <td colSpan="7" className="text-center py-5 text-muted">
                                        <div className="spinner-border spinner-border-sm me-2 text-primary" role="status"></div>
                                        Loading stock records...
                                    </td>
                                </tr>
                            ) : stockItems.length === 0 ? (
                                <tr>
                                    <td colSpan="7" className="text-center py-5 text-muted">
                                        <i className="bi bi-inbox fs-2 d-block mb-2 text-secondary"></i>
                                        No stock items match your search or filters.
                                    </td>
                                </tr>
                            ) : (
                                stockItems.slice((stockPage - 1) * stockPerPage, stockPage * stockPerPage).map((item) => (
                                    <tr key={item.id}>
                                        <td className="ps-4 py-3">
                                            <div className="d-flex align-items-center">
                                                <div>
                                                    <div className="fw-semibold text-dark fs-6">{item.product_name}</div>
                                                    <div className="d-flex align-items-center gap-2 mt-1">
                                                        <span className="badge bg-light text-secondary border font-monospace">
                                                            SKU: {item.sku || 'N/A'}
                                                        </span>
                                                        {item.product_specs && (
                                                            <span className="text-secondary small">{item.product_specs}</span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>

                                        <td className="py-3">
                                            <div className="fw-medium text-dark">{item.warehouse_name}</div>
                                            <div className="text-muted small">
                                                Location: <span className="badge bg-light text-dark border ms-1">{item.storage_location_code}</span>
                                            </div>
                                        </td>

                                        <td className="py-3 text-end fw-semibold text-dark">
                                            {item.is_slab ? (
                                                <div>
                                                    <div>{item.on_hand_qty} Slabs</div>
                                                    <div className="text-muted fs-7 font-normal">{Number(item.on_hand_area).toFixed(2)} sq.ft.</div>
                                                </div>
                                            ) : (
                                                <div>{Number(item.on_hand_qty).toLocaleString()} {item.unit_symbol}</div>
                                            )}
                                        </td>

                                        <td className="py-3 text-end text-warning fw-medium">
                                            {item.is_slab ? (
                                                <div>{item.reserved_qty} Slabs</div>
                                            ) : (
                                                <div>{Number(item.reserved_qty).toLocaleString()} {item.unit_symbol}</div>
                                            )}
                                        </td>

                                        <td className="py-3 text-end fw-bold text-success">
                                            {item.is_slab ? (
                                                <div>
                                                    <div>{item.available_qty} Slabs</div>
                                                    <div className="text-muted fs-7 font-normal">{Number(item.available_area).toFixed(2)} sq.ft.</div>
                                                </div>
                                            ) : (
                                                <div>{Number(item.available_qty).toLocaleString()} {item.unit_symbol}</div>
                                            )}
                                        </td>

                                        <td className="py-3 text-center">
                                            {item.status === "NORMAL" ? (
                                                <span className="badge bg-success-subtle text-success border border-success-subtle fw-semibold px-2.5 py-1">In Stock</span>
                                            ) : item.status === "LOW_STOCK" ? (
                                                <span className="badge bg-warning-subtle text-dark border border-warning-subtle fw-semibold px-2.5 py-1" title={`Low Stock Warning (Level: ${item.low_stock_warning_level} ${item.unit_symbol})`}>
                                                    <i className="bi bi-exclamation-triangle-fill me-1 text-warning"></i>Low Stock
                                                </span>
                                            ) : (
                                                <span className="badge bg-danger-subtle text-danger border border-danger-subtle fw-semibold px-2.5 py-1">
                                                    <i className="bi bi-x-circle-fill me-1"></i>Out of Stock
                                                </span>
                                            )}
                                        </td>

                                        <td className="pe-4 py-3 text-end">
                                            <div className="btn-group">
                                                <button
                                                    className="btn btn-outline-primary btn-sm fw-medium px-2"
                                                    onClick={() => openReserveModal(item)}
                                                    title="Reserve Stock"
                                                >
                                                    <i className="bi bi-bookmark-plus me-1"></i> Reserve
                                                </button>
                                                <button
                                                    type="button"
                                                    className="btn btn-outline-secondary btn-sm dropdown-toggle dropdown-toggle-split"
                                                    data-bs-toggle="dropdown"
                                                    aria-expanded="false"
                                                ></button>
                                                <ul className="dropdown-menu dropdown-menu-end shadow-sm border-0">
                                                    <li>
                                                        <button className="dropdown-item py-1.5 fs-7" onClick={() => handleOpenDetails(item)}>
                                                            <i className="bi bi-eye text-info me-2"></i> View Details
                                                        </button>
                                                    </li>
                                                    <li>
                                                        <button className="dropdown-item py-1.5 fs-7" onClick={() => openLowStockModal(item)}>
                                                            <i className="bi bi-sliders text-warning me-2"></i> Low Stock Warning Level
                                                        </button>
                                                    </li>
                                                </ul>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Pagination Bar */}
            {!loading && stockItems.length > 0 && (
                <div className="card-footer bg-white border-top py-2 px-4 d-flex flex-column flex-md-row align-items-center justify-content-between gap-3">
                    <span className="text-secondary small">
                        Showing <strong>{((stockPage - 1) * stockPerPage) + 1}</strong> to <strong>{Math.min(stockPage * stockPerPage, stockItems.length)}</strong> of <strong>{stockItems.length}</strong> stock items
                    </span>
                    <nav aria-label="Stock Pagination">
                        <ul className="pagination pagination-sm mb-0">
                            <li className={`page-item ${stockPage === 1 ? 'disabled' : ''}`}>
                                <button className="page-link" onClick={() => setStockPage(1)} disabled={stockPage === 1}>
                                    <i className="bi bi-chevron-double-left"></i>
                                </button>
                            </li>
                            <li className={`page-item ${stockPage === 1 ? 'disabled' : ''}`}>
                                <button className="page-link" onClick={() => setStockPage(p => Math.max(1, p - 1))} disabled={stockPage === 1}>
                                    Prev
                                </button>
                            </li>
                            <li className="page-item active">
                                <span className="page-link">{stockPage}</span>
                            </li>
                            <li className={`page-item ${stockPage >= Math.ceil(stockItems.length / stockPerPage) ? 'disabled' : ''}`}>
                                <button className="page-link" onClick={() => setStockPage(p => p + 1)} disabled={stockPage >= Math.ceil(stockItems.length / stockPerPage)}>
                                    Next
                                </button>
                            </li>
                        </ul>
                    </nav>
                </div>
            )}
        </div>
    );
}
