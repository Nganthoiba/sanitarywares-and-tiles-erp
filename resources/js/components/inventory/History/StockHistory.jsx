import React from "react";

export default function StockHistory({
    movements,
    loading,
    pagination,
    perPage,
    filter,
    setFilter,
    onPageChange,
    onPerPageChange,
    contexts
}) {
    const handleMovementsPerPageChange = (e) => {
        const val = parseInt(e.target.value, 10);
        onPerPageChange(val);
    };

    return (
        <div className="card border-0 shadow-sm rounded-4 mb-4 bg-white overflow-hidden" style={{ border: '1px solid #e2e8f0' }}>
            <div className="card-header bg-white border-bottom p-4">
                <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-3">
                    <div className="d-flex align-items-center gap-3">
                        <div className="d-flex align-items-center justify-content-center bg-primary-subtle text-primary rounded-3 p-3" style={{ width: '48px', height: '48px' }}>
                            <i className="fa-solid fa-clock-rotate-left fs-4"></i>
                        </div>
                        <div>
                            <h5 className="fw-bold text-dark mb-1 d-flex align-items-center gap-2">
                                Append-Only Stock Audit Ledger
                            </h5>
                            <p className="text-secondary small mb-0">
                                Immutable, tenant-scoped audit trail tracking all physical stock receipts, sales, transfers & adjustments.
                            </p>
                        </div>
                    </div>
                    <div className="d-flex align-items-center gap-2">
                        {pagination.total > 0 && (
                            <span className="badge bg-primary-subtle text-primary border border-primary-subtle font-monospace px-3 py-2 rounded-pill" style={{ fontSize: '0.8rem' }}>
                                <i className="fa-solid fa-list-check me-1.5"></i>{pagination.total} Movements Recorded
                            </span>
                        )}
                    </div>
                </div>

                {/* Filter Section Box */}
                <div className="p-4 rounded-3 border bg-light">
                    {/* Line 1: Search Product / SKU, Warehouse, Storage Location, Movement Type */}
                    <div className="row g-3 align-items-end mb-1">
                        {/* Search / Product Keyword */}
                        <div className="col-xl-3 col-md-6">
                            <label className="form-label text-secondary small fw-semibold mb-2">
                                <i className="fa-solid fa-magnifying-glass me-2 text-primary"></i>Search Product / SKU
                            </label>
                            <div className="input-group">
                                <span className="input-group-text bg-white border-end-0 text-muted">
                                    <i className="fa-solid fa-search"></i>
                                </span>
                                <input
                                    type="text"
                                    className="form-control border-start-0 ps-0 fw-medium"
                                    placeholder="Search product name or SKU..."
                                    value={filter.search}
                                    onChange={(e) => setFilter(prev => ({ ...prev, search: e.target.value }))}
                                />
                                {filter.search && (
                                    <button
                                        className="btn btn-outline-secondary border-start-0 bg-white text-muted"
                                        type="button"
                                        onClick={() => setFilter(prev => ({ ...prev, search: '' }))}
                                    >
                                        <i className="fa-solid fa-xmark"></i>
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Warehouse Filter */}
                        <div className="col-xl-3 col-md-6">
                            <label className="form-label text-secondary small fw-semibold mb-2">
                                <i className="fa-solid fa-warehouse me-2 text-primary"></i>Warehouse
                            </label>
                            <select
                                className="form-select fw-medium"
                                value={filter.warehouse_id}
                                onChange={(e) => setFilter(prev => ({ ...prev, warehouse_id: e.target.value }))}
                            >
                                <option value="">All Warehouses</option>
                                {(contexts?.warehouses || []).map(w => (
                                    <option key={w.id} value={w.id}>{w.name}</option>
                                ))}
                            </select>
                        </div>

                        {/* Location Filter */}
                        <div className="col-xl-3 col-md-6">
                            <label className="form-label text-secondary small fw-semibold mb-2">
                                <i className="fa-solid fa-location-dot me-2 text-primary"></i>Storage Location
                            </label>
                            <select
                                className="form-select fw-medium"
                                value={filter.storage_location_id}
                                onChange={(e) => setFilter(prev => ({ ...prev, storage_location_id: e.target.value }))}
                            >
                                <option value="">All Storage Locations</option>
                                {(contexts?.storage_locations || [])
                                    .filter(loc => !filter.warehouse_id || String(loc.warehouse_id) === String(filter.warehouse_id))
                                    .map(loc => (
                                        <option key={loc.id} value={loc.id}>
                                            {loc.code} {loc.name ? `(${loc.name})` : ''}
                                        </option>
                                    ))
                                }
                            </select>
                        </div>

                        {/* Movement Type */}
                        <div className="col-xl-3 col-md-6">
                            <label className="form-label text-secondary small fw-semibold mb-2">
                                <i className="fa-solid fa-filter me-2 text-primary"></i>Movement Type
                            </label>
                            <select
                                className="form-select fw-medium"
                                value={filter.movement_type}
                                onChange={(e) => setFilter(prev => ({ ...prev, movement_type: e.target.value }))}
                            >
                                <option value="">All Movement Types</option>
                                <option value="PURCHASE">Receipt / Purchase</option>
                                <option value="SALE">Sale</option>
                                <option value="TRANSFER">Transfer</option>
                                <option value="RETURN">Return</option>
                                <option value="ADJUSTMENT">Adjustment</option>
                                <option value="DAMAGE">Damage</option>
                                <option value="RESERVATION">Reservation</option>
                            </select>
                        </div>
                    </div>

                    {/* Line 2: Date Related Filters (From/To Date, Presets, Reset) */}
                    <div className="row g-3 align-items-end pt-1">
                        {/* Date Range: From & To */}
                        <div className="col-lg-6 col-md-12">
                            <label className="form-label text-secondary small fw-semibold mb-2">
                                <i className="fa-solid fa-calendar-days me-2 text-primary"></i>Date Range
                            </label>
                            <div className="d-flex align-items-center gap-2">
                                <input
                                    type="date"
                                    className="form-control fw-medium"
                                    value={filter.start_date}
                                    onChange={(e) => setFilter(prev => ({ ...prev, start_date: e.target.value }))}
                                    title="From Date"
                                />
                                <span className="text-muted small fw-semibold px-1">to</span>
                                <input
                                    type="date"
                                    className="form-control fw-medium"
                                    value={filter.end_date}
                                    onChange={(e) => setFilter(prev => ({ ...prev, end_date: e.target.value }))}
                                    title="To Date"
                                />
                            </div>
                        </div>

                        {/* Presets & Action Bar */}
                        <div className="col-lg-6 col-md-12 d-flex align-items-center justify-content-between flex-wrap gap-2 pt-1">
                            <div className="d-flex align-items-center gap-3 flex-wrap">
                                <span className="text-muted small fw-semibold me-2 d-none d-sm-inline">Quick:</span>
                                <button
                                    type="button"
                                    className={`btn btn-sm ${filter.start_date === new Date().toISOString().split('T')[0] && filter.end_date === new Date().toISOString().split('T')[0] ? 'btn-primary' : 'btn-outline-secondary'} px-3 py-1 rounded-pill`}
                                    onClick={() => {
                                        const today = new Date().toISOString().split('T')[0];
                                        setFilter(prev => ({ ...prev, start_date: today, end_date: today }));
                                    }}
                                    style={{ fontSize: '0.8rem' }}
                                >
                                    Today
                                </button>
                                <button
                                    type="button"
                                    className="btn btn-sm btn-outline-secondary px-3 py-1 rounded-pill"
                                    onClick={() => {
                                        const now = new Date();
                                        const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
                                        const today = now.toISOString().split('T')[0];
                                        setFilter(prev => ({ ...prev, start_date: firstDay, end_date: today }));
                                    }}
                                    style={{ fontSize: '0.8rem' }}
                                >
                                    This Month
                                </button>
                                <button
                                    type="button"
                                    className="btn btn-sm btn-outline-secondary px-3 py-1 rounded-pill"
                                    onClick={() => {
                                        const now = new Date();
                                        const thirtyDaysAgo = new Date(now.setDate(now.getDate() - 30)).toISOString().split('T')[0];
                                        const today = new Date().toISOString().split('T')[0];
                                        setFilter(prev => ({ ...prev, start_date: thirtyDaysAgo, end_date: today }));
                                    }}
                                    style={{ fontSize: '0.8rem' }}
                                >
                                    Last 30 Days
                                </button>
                            </div>

                            {(filter.search || filter.start_date || filter.end_date || filter.warehouse_id || filter.storage_location_id || filter.product_variant_id || filter.movement_type) && (
                                <button
                                    type="button"
                                    className="btn btn-sm btn-link text-danger text-decoration-none p-0 fw-semibold"
                                    onClick={() => setFilter({
                                        start_date: '',
                                        end_date: '',
                                        product_variant_id: '',
                                        search: '',
                                        warehouse_id: '',
                                        storage_location_id: '',
                                        movement_type: ''
                                    })}
                                    style={{ fontSize: '0.82rem' }}
                                >
                                    <i className="fa-solid fa-rotate-left me-2"></i>Reset Filters
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <div className="card-body p-0">
                {/* Top Pagination Summary Bar */}
                <div className="bg-white px-4 py-2 border-bottom d-flex flex-wrap align-items-center justify-content-between gap-2">
                    <div className="d-flex align-items-center gap-2 text-muted small">
                        <span className="ms-1 fw-semibold text-secondary">Select number of records per page:</span>
                        <select
                            className="form-select form-select-sm py-0 border-secondary-subtle font-monospace"
                            style={{ width: "80px", height: "28px", fontSize: "0.8rem" }}
                            value={perPage}
                            onChange={handleMovementsPerPageChange}
                            title="Records per page"
                        >
                            <option value={10}>10</option>
                            <option value={15}>15</option>
                            <option value={20}>20</option>
                            <option value={25}>25</option>
                            <option value={50}>50</option>
                            <option value={100}>100</option>
                        </select>
                    </div>
                </div>

                <div className="table-responsive">
                    <table id="stock-history-table" className="table table-hover table-border align-middle mb-0">
                        <thead className="bg-light border-bottom">
                            <tr>
                                <th className="ps-4 py-3 text-secondary text-uppercase fs-7 fw-bold">Date & Time</th>
                                <th className="py-3 text-secondary text-uppercase fs-7 fw-bold">Product</th>
                                <th className="py-3 text-secondary text-uppercase fs-7 fw-bold">Type</th>
                                <th className="py-3 text-secondary text-uppercase fs-7 fw-bold">Warehouse / Location</th>
                                <th className="py-3 text-end text-secondary text-uppercase fs-7 fw-bold">Quantity Change</th>
                                <th className="py-3 text-secondary text-uppercase fs-7 fw-bold">Reference</th>
                                <th className="pe-4 py-3 text-secondary text-uppercase fs-7 fw-bold">User</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {loading ? (
                                <tr>
                                    <td colSpan="7" className="text-center py-5 text-muted">
                                        <div className="spinner-border spinner-border-sm me-2 text-primary" role="status"></div>
                                        Loading stock audit movements...
                                    </td>
                                </tr>
                            ) : movements.length === 0 ? (
                                <tr>
                                    <td colSpan="7" className="text-center py-5 text-muted">
                                        No stock movements recorded matching current filters.
                                    </td>
                                </tr>
                            ) : (
                                movements.map((m) => (
                                    <tr key={m.id}>
                                        <td className="ps-4 py-3 text-muted fs-7">{m.date}</td>
                                        <td className="py-3">
                                            <div className="fw-semibold text-dark">{m.product_name}</div>
                                            <div className="text-muted fs-7">SKU: {m.sku}</div>
                                        </td>
                                        <td className="py-3">
                                            <span className={`badge ${
                                                m.quantity_delta > 0 ? "bg-success-subtle text-success" : "bg-danger-subtle text-danger"
                                            } border`}>
                                                {m.movement_label}
                                            </span>
                                        </td>
                                        <td className="py-3">
                                            <div className="fw-medium text-dark">{m.warehouse_name}</div>
                                            <div className="text-muted fs-7">Location: {m.location_code}</div>
                                        </td>
                                        <td className={`py-3 text-end fw-bold ${m.quantity_delta > 0 ? "text-success" : "text-danger"}`}>
                                            {m.quantity_delta > 0 ? `+${m.quantity_delta}` : m.quantity_delta} {m.unit_symbol}
                                        </td>
                                        <td className="py-3">
                                            {m.reference_number && m.reference_number !== '-' ? (
                                                <>
                                                    <div className="fw-semibold text-dark font-monospace" style={{ fontSize: "0.82rem" }}>
                                                        {m.reference_number}
                                                    </div>
                                                    <div className="text-muted fs-7">
                                                        ({m.reference_type_label || m.reference_type})
                                                    </div>
                                                </>
                                            ) : (
                                                <span className="text-muted fs-7">{m.reference_label || '-'}</span>
                                            )}
                                        </td>
                                        <td className="pe-4 py-3 text-muted fs-7">{m.user_name}</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Pagination Footer for Movements */}
            {!loading && pagination.total > 0 && (
                <div className="card-footer bg-white border-top py-3 px-4 d-flex flex-wrap align-items-center justify-content-between gap-2">
                    <div className="d-flex align-items-center gap-2 text-muted small">
                        <span>
                            Showing <strong>{pagination.total > 0 ? (pagination.current_page - 1) * perPage + 1 : 0}</strong> to <strong>{Math.min(pagination.current_page * perPage, pagination.total)}</strong> of <strong>{pagination.total}</strong> stock movements
                        </span>
                    </div>

                    {pagination.last_page > 1 && (
                        <nav aria-label="Stock history pagination">
                            <ul className="pagination pagination-sm mb-0">
                                <li className={`page-item ${pagination.current_page === 1 ? 'disabled' : ''}`}>
                                    <button
                                        className="page-link"
                                        onClick={() => onPageChange(1)}
                                        disabled={pagination.current_page === 1 || loading}
                                        title="First Page"
                                    >
                                        <i className="fa-solid fa-angles-left"></i>
                                    </button>
                                </li>
                                <li className={`page-item ${pagination.current_page === 1 ? 'disabled' : ''}`}>
                                    <button
                                        className="page-link"
                                        onClick={() => onPageChange(pagination.current_page - 1)}
                                        disabled={pagination.current_page === 1 || loading}
                                    >
                                        Prev
                                    </button>
                                </li>

                                {Array.from({ length: pagination.last_page }, (_, i) => i + 1)
                                    .filter(p => p === 1 || p === pagination.last_page || Math.abs(p - pagination.current_page) <= 1)
                                    .reduce((acc, p, idx, arr) => {
                                        if (idx > 0 && p - arr[idx - 1] > 1) {
                                            acc.push('...');
                                        }
                                        acc.push(p);
                                        return acc;
                                    }, [])
                                    .map((item, idx) => {
                                        if (item === '...') {
                                            return (
                                                <li key={`ellipsis-${idx}`} className="page-item disabled">
                                                    <span className="page-link">...</span>
                                                </li>
                                            );
                                        }
                                        return (
                                            <li key={item} className={`page-item ${pagination.current_page === item ? 'active' : ''}`}>
                                                <button
                                                    className="page-link"
                                                    onClick={() => onPageChange(item)}
                                                    disabled={loading}
                                                >
                                                    {item}
                                                </button>
                                            </li>
                                        );
                                    })}

                                <li className={`page-item ${pagination.current_page === pagination.last_page ? 'disabled' : ''}`}>
                                    <button
                                        className="page-link"
                                        onClick={() => onPageChange(pagination.current_page + 1)}
                                        disabled={pagination.current_page === pagination.last_page || loading}
                                    >
                                        Next
                                    </button>
                                </li>
                                <li className={`page-item ${pagination.current_page === pagination.last_page ? 'disabled' : ''}`}>
                                    <button
                                        className="page-link"
                                        onClick={() => onPageChange(pagination.last_page)}
                                        disabled={pagination.current_page === pagination.last_page || loading}
                                        title="Last Page"
                                    >
                                        <i className="fa-solid fa-angles-right"></i>
                                    </button>
                                </li>
                            </ul>
                        </nav>
                    )}
                </div>
            )}
        </div>
    );
}
