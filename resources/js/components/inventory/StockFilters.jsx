import React from "react";

export default function StockFilters({ filters, setFilters, contexts }) {
    return (
        <div className="card border-0 shadow-sm rounded-3 mb-3 bg-white">
            <div className="card-body p-3">
                <div className="row g-2 align-items-center">
                    <div className="col-12 col-md-3">
                        <label className="form-label small text-secondary mb-1">Warehouse</label>
                        <select
                            className="form-select form-select-sm"
                            value={filters.warehouse_id}
                            onChange={(e) => setFilters(prev => ({ ...prev, warehouse_id: e.target.value }))}
                        >
                            <option value="">All Warehouses</option>
                            {(contexts.warehouses || []).map(w => (
                                <option key={w.id} value={w.id}>{w.name}</option>
                            ))}
                        </select>
                    </div>

                    <div className="col-12 col-md-3">
                        <label className="form-label small text-secondary mb-1">Category</label>
                        <select
                            className="form-select form-select-sm"
                            value={filters.category_id}
                            onChange={(e) => setFilters(prev => ({ ...prev, category_id: e.target.value }))}
                        >
                            <option value="">All Categories</option>
                            {(contexts?.categories || []).map(c => (
                                <option key={c.id} value={c.id}>{c.name}</option>
                            ))}
                        </select>
                    </div>

                    <div className="col-12 col-md-2">
                        <label className="form-label small text-secondary mb-1">Stock Status</label>
                        <select
                            className="form-select form-select-sm"
                            value={filters.status}
                            onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                        >
                            <option value="ALL">All Statuses</option>
                            <option value="IN_STOCK">Normal Stock</option>
                            <option value="LOW_STOCK">Low Stock Warning</option>
                            <option value="OUT_OF_STOCK">Out of Stock</option>
                        </select>
                    </div>

                    <div className="col-12 col-md-4">
                        <label className="form-label small text-secondary mb-1">Search</label>
                        <div className="input-group input-group-sm">
                            <span className="input-group-text bg-white border-end-0">
                                <i className="bi bi-search text-secondary"></i>
                            </span>
                            <input
                                type="text"
                                className="form-control border-start-0 ps-0"
                                placeholder="Search product, SKU, barcode..."
                                value={filters.search}
                                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                            />
                            {filters.search && (
                                <button
                                    className="btn btn-outline-secondary"
                                    type="button"
                                    onClick={() => setFilters(prev => ({ ...prev, search: "" }))}
                                >
                                    Clear
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
