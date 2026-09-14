import React from 'react';

export default function ReservationList({
    reservations = [],
    loading,
    reservationsLoading,
    pagination,
    reservationsPagination,
    filter,
    reservationsFilter,
    setFilter,
    setReservationsFilter,
    onPageChange,
    loadReservations,
    onFulfill,
    handleFulfillReservation,
    onCancel,
    handleCancelReservation,
    openReserveModal,
    contexts = {}
}) {
    const isLoading = loading ?? reservationsLoading ?? false;
    const pag = pagination || reservationsPagination || { current_page: 1, last_page: 1, total: 0 };
    const flt = filter || reservationsFilter || { search: '', status: 'ALL', warehouse_id: '' };
    const updateFilter = setFilter || setReservationsFilter || (() => {});
    const changePage = onPageChange || loadReservations || (() => {});
    const fulfillAction = onFulfill || handleFulfillReservation || (() => {});
    const cancelAction = onCancel || handleCancelReservation || (() => {});

    return (
        <div className="card border-0 shadow-sm">
            <div className="card-header bg-white py-3">
                <div className="d-flex flex-wrap align-items-center justify-content-between gap-3">
                    <div className="d-flex align-items-center gap-2">
                        <span className="fw-bold fs-5 text-dark">Active & Historical Reservations</span>
                        <span className="badge bg-secondary-subtle text-secondary font-monospace ms-2">
                            {pag.total || 0} Total
                        </span>
                    </div>

                    {openReserveModal && (
                        <button className="btn btn-primary btn-sm d-flex align-items-center gap-1" onClick={openReserveModal}>
                            <i className="bi bi-bookmark-plus me-1"></i> Reserve Stock
                        </button>
                    )}
                </div>

                {/* Filter bar */}
                <div className="row g-2 mt-2 align-items-center">
                    <div className="col-md-4">
                        <div className="input-group input-group-sm">
                            <span className="input-group-text bg-light border-end-0">
                                <i className="fa-solid fa-magnifying-glass text-muted"></i>
                            </span>
                            <input
                                type="text"
                                className="form-control border-start-0"
                                placeholder="Search reservation #, reference, product..."
                                value={flt.search || ''}
                                onChange={e => updateFilter({ ...flt, search: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="col-md-3">
                        <select
                            className="form-select form-select-sm"
                            value={flt.status || 'ALL'}
                            onChange={e => updateFilter({ ...flt, status: e.target.value })}
                        >
                            <option value="ALL">All Statuses</option>
                            <option value="ACTIVE">Active Only</option>
                            <option value="PARTIALLY_FULFILLED">Partially Fulfilled</option>
                            <option value="FULFILLED">Fulfilled</option>
                            <option value="CANCELLED">Cancelled</option>
                            <option value="EXPIRED">Expired</option>
                        </select>
                    </div>

                    <div className="col-md-3">
                        <select
                            className="form-select form-select-sm"
                            value={flt.warehouse_id || ''}
                            onChange={e => updateFilter({ ...flt, warehouse_id: e.target.value })}
                        >
                            <option value="">All Warehouses</option>
                            {(contexts?.warehouses || []).map(w => (
                                <option key={w.id} value={w.id}>{w.name}</option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            <div className="card-body p-0">
                <div className="table-responsive">
                    <table className="table table-hover align-middle mb-0">
                        <thead className="bg-light border-bottom">
                            <tr>
                                <th className="ps-4 py-3 text-secondary text-uppercase fs-7 fw-bold">Reservation #</th>
                                <th className="py-3 text-secondary text-uppercase fs-7 fw-bold">Product</th>
                                <th className="py-3 text-secondary text-uppercase fs-7 fw-bold">Customer</th>
                                <th className="py-3 text-secondary text-uppercase fs-7 fw-bold">Reserved Qty</th>
                                <th className="py-3 text-secondary text-uppercase fs-7 fw-bold">Fulfilled Qty</th>
                                <th className="py-3 text-secondary text-uppercase fs-7 fw-bold">Status</th>
                                <th className="py-3 text-secondary text-uppercase fs-7 fw-bold">Expires</th>
                                <th className="pe-4 py-3 text-end text-secondary text-uppercase fs-7 fw-bold">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {isLoading ? (
                                <tr>
                                    <td colSpan="8" className="text-center py-5 text-muted">
                                        <div className="spinner-border spinner-border-sm me-2 text-primary" role="status"></div>
                                        Loading reservations...
                                    </td>
                                </tr>
                            ) : (reservations || []).length === 0 ? (
                                <tr>
                                    <td colSpan="8" className="text-center py-5 text-muted">
                                        No reservations found matching filters.
                                    </td>
                                </tr>
                            ) : (
                                reservations.map(res => {
                                    const isExpired = res.status === 'EXPIRED' || (res.expires_at && new Date(res.expires_at) < new Date() && res.status === 'ACTIVE');
                                    const badgeClass = res.status === 'FULFILLED' ? 'bg-success-subtle text-success border border-success-subtle'
                                        : res.status === 'PARTIALLY_FULFILLED' ? 'bg-info-subtle text-info border border-info-subtle'
                                        : res.status === 'CANCELLED' ? 'bg-secondary-subtle text-secondary border'
                                        : isExpired ? 'bg-warning-subtle text-warning border border-warning-subtle'
                                        : 'bg-primary-subtle text-primary border border-primary-subtle';

                                    return (
                                        <tr key={res.id}>
                                            <td className="ps-4 py-3">
                                                <div className="fw-bold font-monospace text-dark">{res.reservation_number}</div>
                                                {res.reference_number && (
                                                    <div className="text-muted fs-7">Ref: {res.reference_number}</div>
                                                )}
                                            </td>
                                            <td className="py-3">
                                                <div className="fw-semibold text-dark">{res.product?.name || 'Unknown Product'}</div>
                                                <div className="text-muted fs-7">SKU: {res.product?.sku || '-'}</div>
                                            </td>
                                            <td className="py-3">
                                                <div className="text-dark">{res.customer?.name || 'Walk-in / Unassigned'}</div>
                                                {res.customer?.phone && <div className="text-muted fs-7">{res.customer.phone}</div>}
                                            </td>
                                            <td className="py-3 fw-bold text-dark">
                                                {parseFloat(res.quantity)} {res.product?.base_unit?.symbol || 'Units'}
                                                {res.area > 0 && <div className="text-muted fs-7 fw-normal">({parseFloat(res.area).toFixed(2)} SQFT)</div>}
                                            </td>
                                            <td className="py-3 text-dark font-monospace">
                                                {parseFloat(res.fulfilled_quantity || 0)} {res.product?.base_unit?.symbol || 'Units'}
                                                {res.remaining_quantity !== undefined && (
                                                    <div className="text-muted fs-7">Remaining: {parseFloat(res.remaining_quantity)}</div>
                                                )}
                                            </td>
                                            <td className="py-3">
                                                <span className={`badge ${badgeClass}`}>
                                                    {res.status}
                                                </span>
                                            </td>
                                            <td className="py-3 text-muted fs-7">
                                                {res.expires_at ? (
                                                    <span className={isExpired ? 'text-danger fw-semibold' : ''}>
                                                        {new Date(res.expires_at).toLocaleDateString()}
                                                    </span>
                                                ) : (
                                                    <span className="text-muted">Never</span>
                                                )}
                                            </td>
                                            <td className="pe-4 py-3 text-end">
                                                {(res.status === 'ACTIVE' || res.status === 'PARTIALLY_FULFILLED') && (
                                                    <div className="btn-group btn-group-sm">
                                                        <button
                                                            className="btn btn-sm btn-light text-success border-0 px-2"
                                                            onClick={() => fulfillAction(res)}
                                                            title="Fulfill Reservation"
                                                        >
                                                            <i className="fa-solid fa-circle-check me-1"></i> Fulfill
                                                        </button>
                                                        <button
                                                            className="btn btn-sm btn-light text-danger border-0 px-2"
                                                            onClick={() => cancelAction(res.id)}
                                                            title="Cancel Reservation"
                                                        >
                                                            <i className="fa-solid fa-ban me-1"></i> Cancel
                                                        </button>
                                                    </div>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Pagination Footer */}
            {(pag.last_page || 1) > 1 && (
                <div className="card-footer bg-white border-top py-2 px-4 d-flex justify-content-between align-items-center">
                    <span className="small text-muted">
                        Page {pag.current_page || 1} of {pag.last_page || 1} ({pag.total || 0} total items)
                    </span>
                    <div className="btn-group btn-group-sm">
                        <button
                            className="btn btn-outline-secondary"
                            disabled={(pag.current_page || 1) === 1 || isLoading}
                            onClick={() => changePage((pag.current_page || 1) - 1)}
                        >
                            <i className="bi bi-chevron-left"></i> Previous
                        </button>
                        <button
                            className="btn btn-outline-secondary"
                            disabled={(pag.current_page || 1) === (pag.last_page || 1) || isLoading}
                            onClick={() => changePage((pag.current_page || 1) + 1)}
                        >
                            Next <i className="bi bi-chevron-right"></i>
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
