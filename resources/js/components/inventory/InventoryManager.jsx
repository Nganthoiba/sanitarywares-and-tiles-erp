import React, { useState, useEffect } from "react";
import axios from "axios";

export default function InventoryManager() {
    const [viewMode, setViewMode] = useState("stock"); // 'stock' | 'history'
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [successMessage, setSuccessMessage] = useState(null);

    // Stock Data & Summary Cards
    const [stockItems, setStockItems] = useState([]);
    const [summaryCards, setSummaryCards] = useState({
        total_stock: 0,
        total_on_hand_qty: 0,
        available_stock: 0,
        reserved_stock: 0,
        low_stock_count: 0
    });

    // Options & References
    const [contexts, setContexts] = useState({
        warehouses: [],
        categories: [],
        storage_locations: [],
        product_variants: []
    });

    // Filter state
    const [filters, setFilters] = useState({
        warehouse_id: "",
        category_id: "",
        status: "ALL",
        search: ""
    });

    // History Ledger state
    const [movements, setMovements] = useState([]);
    const [movementsLoading, setMovementsLoading] = useState(false);
    const [movementsPagination, setMovementsPagination] = useState({
        current_page: 1,
        last_page: 1,
        total: 0
    });

    // Item details modal/drawer state
    const [selectedItem, setSelectedItem] = useState(null);
    const [recentActivity, setRecentActivity] = useState([]);
    const [activityLoading, setActivityLoading] = useState(false);

    // Action Modals State
    const [activeModal, setActiveModal] = useState(null); // 'transfer' | 'adjust' | 'count' | null
    const [submittingAction, setSubmittingAction] = useState(false);

    // Transfer Form
    const [transferForm, setTransferForm] = useState({
        from_warehouse_id: "",
        to_warehouse_id: "",
        product_variant_id: "",
        inventory_object_id: "",
        quantity: 1,
        destination_location_id: "",
        remarks: ""
    });

    // Adjust Form
    const [adjustForm, setAdjustForm] = useState({
        warehouse_id: "",
        product_variant_id: "",
        inventory_object_id: "",
        adjustment_type: "DAMAGE",
        quantity_delta: -1,
        reason: "",
        remarks: ""
    });

    // Stock Count Form
    const [countForm, setCountForm] = useState({
        warehouse_id: "",
        count_type: "SPOT",
        remarks: "",
        items: []
    });

    const getAuthHeaders = () => {
        const token = localStorage.getItem("auth_token");
        return token ? { Authorization: `Bearer ${token}` } : {};
    };

    // Load Stock Summary & Data
    const loadStockData = async () => {
        setLoading(true);
        setError(null);
        try {
            const params = {};
            if (filters.warehouse_id) params.warehouse_id = filters.warehouse_id;
            if (filters.category_id) params.category_id = filters.category_id;
            if (filters.status !== "ALL") params.status = filters.status;
            if (filters.search) params.search = filters.search;

            const res = await axios.get("/api/inventory", {
                headers: getAuthHeaders(),
                params
            });

            if (res.data.success) {
                setStockItems(res.data.data || []);
                if (res.data.summary_cards) {
                    setSummaryCards(res.data.summary_cards);
                }
            }
        } catch (err) {
            setError("Failed to fetch inventory stock records.");
        } finally {
            setLoading(false);
        }
    };

    // Load Form Options (Warehouses, Categories, Locations, Products)
    const loadContexts = async () => {
        try {
            const res = await axios.get("/api/inventory/form-data", {
                headers: getAuthHeaders()
            });
            if (res.data.success) {
                setContexts({
                    warehouses: res.data.warehouses || [],
                    categories: res.data.categories || [],
                    storage_locations: res.data.storage_locations || [],
                    product_variants: res.data.product_variants || []
                });

                if (res.data.warehouses?.length > 0) {
                    const firstWhId = String(res.data.warehouses[0].id);
                    setTransferForm(prev => ({ ...prev, from_warehouse_id: firstWhId }));
                    setAdjustForm(prev => ({ ...prev, warehouse_id: firstWhId }));
                    setCountForm(prev => ({ ...prev, warehouse_id: firstWhId }));
                }
            }
        } catch (err) {
            console.error("Failed to load inventory options context", err);
        }
    };

    // Load Movements Ledger
    const loadMovements = async (page = 1) => {
        setMovementsLoading(true);
        try {
            const res = await axios.get("/api/inventory/movements", {
                headers: getAuthHeaders(),
                params: { page, per_page: 25 }
            });
            if (res.data.success) {
                setMovements(res.data.data || []);
                if (res.data.pagination) {
                    setMovementsPagination(res.data.pagination);
                }
            }
        } catch (err) {
            console.error("Failed to fetch stock movements ledger", err);
        } finally {
            setMovementsLoading(false);
        }
    };

    useEffect(() => {
        loadContexts();
        loadStockData();
    }, []);

    useEffect(() => {
        loadStockData();
    }, [filters.warehouse_id, filters.category_id, filters.status]);

    useEffect(() => {
        if (viewMode === "history") {
            loadMovements(1);
        }
    }, [viewMode]);

    // Handle Open Stock Details
    const handleOpenDetails = async (item) => {
        setSelectedItem(item);
        setActivityLoading(true);
        try {
            const res = await axios.get("/api/inventory/movements", {
                headers: getAuthHeaders(),
                params: {
                    product_variant_id: item.product_variant_id,
                    per_page: 10
                }
            });
            if (res.data.success) {
                setRecentActivity(res.data.data || []);
            }
        } catch (err) {
            setRecentActivity([]);
        } finally {
            setActivityLoading(false);
        }
    };

    // 1. Submit Transfer
    const handleTransferSubmit = async (e) => {
        e.preventDefault();
        setSubmittingAction(true);
        setError(null);
        try {
            let objId = transferForm.inventory_object_id;
            if (!objId) {
                const targetStock = stockItems.find(
                    s => String(s.product_variant_id) === String(transferForm.product_variant_id) &&
                         String(s.warehouse_id) === String(transferForm.from_warehouse_id)
                );
                if (targetStock && targetStock.inventory_object_ids?.length > 0) {
                    objId = targetStock.inventory_object_ids[0];
                }
            }

            if (!objId) {
                alert("Please select a valid product with active stock in the source warehouse.");
                setSubmittingAction(false);
                return;
            }

            const payload = {
                from_warehouse_id: parseInt(transferForm.from_warehouse_id),
                to_warehouse_id: parseInt(transferForm.to_warehouse_id),
                items: [
                    {
                        inventory_object_id: parseInt(objId),
                        quantity: parseFloat(transferForm.quantity)
                    }
                ],
                remarks: transferForm.remarks
            };

            const res = await axios.post("/api/inventory/transfers", payload, {
                headers: getAuthHeaders()
            });

            if (res.data.success) {
                setSuccessMessage("Stock transfer initiated successfully.");
                setActiveModal(null);
                loadStockData();
                setTimeout(() => setSuccessMessage(null), 4000);
            }
        } catch (err) {
            alert(err.response?.data?.message || "Failed to initiate stock transfer.");
        } finally {
            setSubmittingAction(false);
        }
    };

    // 2. Submit Adjustment
    const handleAdjustSubmit = async (e) => {
        e.preventDefault();
        setSubmittingAction(true);
        setError(null);
        try {
            let objId = adjustForm.inventory_object_id;
            if (!objId) {
                const targetStock = stockItems.find(
                    s => String(s.product_variant_id) === String(adjustForm.product_variant_id) &&
                         String(s.warehouse_id) === String(adjustForm.warehouse_id)
                );
                if (targetStock && targetStock.inventory_object_ids?.length > 0) {
                    objId = targetStock.inventory_object_ids[0];
                }
            }

            if (!objId) {
                alert("Please select a product with valid stock in the selected warehouse.");
                setSubmittingAction(false);
                return;
            }

            const payload = {
                warehouse_id: parseInt(adjustForm.warehouse_id),
                adjustment_type: adjustForm.adjustment_type,
                reason: adjustForm.reason || "Manual stock adjustment",
                items: [
                    {
                        inventory_object_id: parseInt(objId),
                        quantity_delta: parseFloat(adjustForm.quantity_delta),
                        area_delta: 0
                    }
                ]
            };

            const res = await axios.post("/api/inventory/adjustments", payload, {
                headers: getAuthHeaders()
            });

            if (res.data.success) {
                const adjId = res.data.data?.id;
                if (adjId) {
                    // Automatically approve adjustment to finalize stock update
                    await axios.post(`/api/inventory/adjustments/${adjId}/approve`, {}, { headers: getAuthHeaders() });
                }
                setSuccessMessage("Stock adjustment submitted and posted successfully.");
                setActiveModal(null);
                loadStockData();
                setTimeout(() => setSuccessMessage(null), 4000);
            }
        } catch (err) {
            alert(err.response?.data?.message || "Failed to complete stock adjustment.");
        } finally {
            setSubmittingAction(false);
        }
    };

    // 3. Submit Stock Count
    const handleCountSubmit = async (e) => {
        e.preventDefault();
        setSubmittingAction(true);
        setError(null);
        try {
            const payload = {
                warehouse_id: parseInt(countForm.warehouse_id),
                count_type: countForm.count_type,
                remarks: countForm.remarks || "Physical stock count reconciliation"
            };

            const res = await axios.post("/api/inventory/counts", payload, {
                headers: getAuthHeaders()
            });

            if (res.data.success) {
                const countId = res.data.data?.id;
                if (countId && countForm.product_variant_id) {
                    // Update counted quantity on generated count items if applicable
                    const countItems = res.data.data?.items || [];
                    const targetItem = countItems.find(
                        ci => String(ci.inventory_object?.product_variant_id) === String(countForm.product_variant_id)
                    );
                    if (targetItem) {
                        await axios.post(
                            `/api/inventory/counts/items/${targetItem.id}`,
                            { counted_quantity: parseFloat(countForm.counted_quantity), counted_area: 0 },
                            { headers: getAuthHeaders() }
                        );
                    }
                    await axios.post(`/api/inventory/counts/${countId}/approve`, {}, { headers: getAuthHeaders() });
                }

                setSuccessMessage("Stock count recorded and reconciled successfully.");
                setActiveModal(null);
                loadStockData();
                setTimeout(() => setSuccessMessage(null), 4000);
            }
        } catch (err) {
            alert(err.response?.data?.message || "Failed to process stock count.");
        } finally {
            setSubmittingAction(false);
        }
    };

    return (
        <div className="container-fluid py-4">
            {/* Success Alert */}
            {successMessage && (
                <div className="alert alert-success alert-dismissible fade show shadow-sm mb-4" role="alert">
                    <i className="bi bi-check-circle-fill me-2"></i>
                    {successMessage}
                    <button type="button" className="btn-close" onClick={() => setSuccessMessage(null)}></button>
                </div>
            )}

            {/* Error Alert */}
            {error && (
                <div className="alert alert-danger alert-dismissible fade show shadow-sm mb-4" role="alert">
                    <i className="bi bi-exclamation-triangle-fill me-2"></i>
                    {error}
                    <button type="button" className="btn-close" onClick={() => setError(null)}></button>
                </div>
            )}

            {/* Main Header */}
            <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-4">
                <div>
                    <h2 className="h3 font-weight-bold mb-1 text-dark">Inventory</h2>
                    <p className="text-secondary small mb-0">
                        View and manage current stock across warehouses and storage locations.
                    </p>
                </div>

                <div className="d-flex align-items-center gap-2">
                    {/* View Switcher Tabs */}
                    <div className="btn-group me-2" role="group">
                        <button
                            type="button"
                            className={`btn btn-sm ${viewMode === "stock" ? "btn-dark fw-medium" : "btn-outline-secondary"}`}
                            onClick={() => setViewMode("stock")}
                        >
                            <i className="bi bi-boxes me-1"></i> Stock View
                        </button>
                        <button
                            type="button"
                            className={`btn btn-sm ${viewMode === "history" ? "btn-dark fw-medium" : "btn-outline-secondary"}`}
                            onClick={() => setViewMode("history")}
                        >
                            <i className="bi bi-journal-text me-1"></i> Stock History
                        </button>
                    </div>

                    <button
                        className="btn btn-outline-secondary btn-sm d-flex align-items-center gap-1"
                        onClick={loadStockData}
                        disabled={loading}
                    >
                        <i className={`bi bi-arrow-clockwise ${loading ? "spin" : ""}`}></i>
                        Refresh
                    </button>

                    {/* Actions Dropdown */}
                    <div className="dropdown">
                        <button
                            className="btn btn-primary btn-sm dropdown-toggle d-flex align-items-center gap-1 fw-medium"
                            type="button"
                            id="inventoryActionsDropdown"
                            data-bs-toggle="dropdown"
                            aria-expanded="false"
                        >
                            <i className="bi bi-plus-lg me-1"></i> Actions
                        </button>
                        <ul className="dropdown-menu dropdown-menu-end shadow-sm border-0" aria-labelledby="inventoryActionsDropdown">
                            <li>
                                <button className="dropdown-item py-2" onClick={() => setActiveModal("transfer")}>
                                    <i className="bi bi-arrow-left-right text-primary me-2"></i>
                                    Transfer Stock
                                </button>
                            </li>
                            <li>
                                <button className="dropdown-item py-2" onClick={() => setActiveModal("adjust")}>
                                    <i className="bi bi-sliders text-warning me-2"></i>
                                    Adjust Stock
                                </button>
                            </li>
                            <li>
                                <button className="dropdown-item py-2" onClick={() => setActiveModal("count")}>
                                    <i className="bi bi-clipboard-check text-success me-2"></i>
                                    Stock Count
                                </button>
                            </li>
                        </ul>
                    </div>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="row g-3 mb-4">
                <div className="col-12 col-sm-6 col-xl-3">
                    <div className="card border-0 shadow-sm rounded-3 h-100 bg-white">
                        <div className="card-body p-3">
                            <div className="d-flex align-items-center justify-content-between">
                                <div>
                                    <span className="text-secondary small fw-semibold text-uppercase tracking-wider">Total Stock</span>
                                    <h3 className="h2 fw-bold text-dark mb-0 mt-1">{summaryCards.total_stock}</h3>
                                    <span className="text-muted fs-7">Unique stock entries</span>
                                </div>
                                <div className="p-3 bg-primary-subtle text-primary rounded-3">
                                    <i className="bi bi-box-seam fs-4"></i>
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
                                <div className="p-3 bg-success-subtle text-success rounded-3">
                                    <i className="bi bi-check-circle fs-4"></i>
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
                                    <span className="text-muted fs-7">Allocated to orders/quotes</span>
                                </div>
                                <div className="p-3 bg-warning-subtle text-warning rounded-3">
                                    <i className="bi bi-lock fs-4"></i>
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
                                    <span className="text-secondary small fw-semibold text-uppercase tracking-wider">Low Stock</span>
                                    <h3 className="h2 fw-bold text-danger mb-0 mt-1">{summaryCards.low_stock_count}</h3>
                                    <span className="text-muted fs-7">Items needing replenishment</span>
                                </div>
                                <div className="p-3 bg-danger-subtle text-danger rounded-3">
                                    <i className="bi bi-exclamation-triangle fs-4"></i>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* STOCK VIEW vs HISTORY VIEW */}
            {viewMode === "stock" ? (
                <>
                    {/* Filters Toolbar */}
                    <div className="card border-0 shadow-sm rounded-3 mb-4 bg-white">
                        <div className="card-body p-3">
                            <div className="row g-2 align-items-center">
                                {/* Warehouse Filter */}
                                <div className="col-12 col-md-3">
                                    <label className="form-label small text-secondary mb-1">Warehouse</label>
                                    <select
                                        className="form-select form-select-sm"
                                        value={filters.warehouse_id}
                                        onChange={(e) => setFilters(prev => ({ ...prev, warehouse_id: e.target.value }))}
                                    >
                                        <option value="">All Warehouses</option>
                                        {contexts.warehouses.map(w => (
                                            <option key={w.id} value={w.id}>{w.name}</option>
                                        ))}
                                    </select>
                                </div>

                                {/* Category Filter */}
                                <div className="col-12 col-md-3">
                                    <label className="form-label small text-secondary mb-1">Category</label>
                                    <select
                                        className="form-select form-select-sm"
                                        value={filters.category_id}
                                        onChange={(e) => setFilters(prev => ({ ...prev, category_id: e.target.value }))}
                                    >
                                        <option value="">All Categories</option>
                                        {contexts.categories.map(c => (
                                            <option key={c.id} value={c.id}>{c.name}</option>
                                        ))}
                                    </select>
                                </div>

                                {/* Stock Status Filter */}
                                <div className="col-12 col-md-2">
                                    <label className="form-label small text-secondary mb-1">Stock Status</label>
                                    <select
                                        className="form-select form-select-sm"
                                        value={filters.status}
                                        onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                                    >
                                        <option value="ALL">All</option>
                                        <option value="IN_STOCK">In Stock</option>
                                        <option value="LOW_STOCK">Low Stock</option>
                                        <option value="OUT_OF_STOCK">Out of Stock</option>
                                    </select>
                                </div>

                                {/* Search Bar */}
                                <div className="col-12 col-md-4">
                                    <label className="form-label small text-secondary mb-1">Search</label>
                                    <form onSubmit={(e) => { e.preventDefault(); loadStockData(); }}>
                                        <div className="input-group input-group-sm">
                                            <span className="input-group-text bg-light border-end-0">
                                                <i className="bi bi-search text-muted"></i>
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
                                                    onClick={() => {
                                                        setFilters(prev => ({ ...prev, search: "" }));
                                                    }}
                                                >
                                                    <i className="bi bi-x-lg"></i>
                                                </button>
                                            )}
                                        </div>
                                    </form>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Stock Table */}
                    <div className="card border-0 shadow-sm rounded-3 bg-white">
                        <div className="card-body p-0">
                            <div className="table-responsive">
                                <table className="table table-hover table-borderless align-middle mb-0">
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
                                            stockItems.map((item) => (
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
                                                        {item.stock_status === "In Stock" ? (
                                                            <span className="badge bg-success-subtle text-success border border-success px-2 py-1">In Stock</span>
                                                        ) : item.stock_status === "Low Stock" ? (
                                                            <span className="badge bg-warning-subtle text-warning border border-warning px-2 py-1">Low Stock</span>
                                                        ) : (
                                                            <span className="badge bg-danger-subtle text-danger border border-danger px-2 py-1">Out of Stock</span>
                                                        )}
                                                    </td>

                                                    <td className="pe-4 py-3 text-end">
                                                        <button
                                                            className="btn btn-outline-secondary btn-sm fw-medium px-3"
                                                            onClick={() => handleOpenDetails(item)}
                                                        >
                                                            View Details
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </>
            ) : (
                /* STOCK HISTORY LEDGER VIEW */
                <div className="card border-0 shadow-sm rounded-3 bg-white">
                    <div className="card-header bg-white border-bottom py-3 d-flex justify-content-between align-items-center">
                        <div>
                            <h5 className="mb-0 fw-bold text-dark fs-6">Stock Movement History</h5>
                            <span className="text-muted fs-7">Audit trail of all receipts, sales, transfers, and adjustments.</span>
                        </div>
                        <button className="btn btn-sm btn-outline-secondary" onClick={() => loadMovements(1)}>
                            <i className="bi bi-arrow-clockwise me-1"></i> Refresh History
                        </button>
                    </div>
                    <div className="card-body p-0">
                        <div className="table-responsive">
                            <table className="table table-hover table-borderless align-middle mb-0">
                                <thead className="bg-light border-bottom">
                                    <tr>
                                        <th className="ps-4 py-3 text-secondary text-uppercase fs-7 fw-bold">Date</th>
                                        <th className="py-3 text-secondary text-uppercase fs-7 fw-bold">Product</th>
                                        <th className="py-3 text-secondary text-uppercase fs-7 fw-bold">Movement</th>
                                        <th className="py-3 text-end text-secondary text-uppercase fs-7 fw-bold">Quantity Delta</th>
                                        <th className="py-3 text-secondary text-uppercase fs-7 fw-bold">Warehouse / Location</th>
                                        <th className="py-3 text-secondary text-uppercase fs-7 fw-bold">Reference</th>
                                        <th className="pe-4 py-3 text-secondary text-uppercase fs-7 fw-bold">User</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    {movementsLoading ? (
                                        <tr>
                                            <td colSpan="7" className="text-center py-5 text-muted">
                                                <div className="spinner-border spinner-border-sm me-2 text-primary" role="status"></div>
                                                Loading stock movement history...
                                            </td>
                                        </tr>
                                    ) : movements.length === 0 ? (
                                        <tr>
                                            <td colSpan="7" className="text-center py-5 text-muted">
                                                No stock movements recorded yet.
                                            </td>
                                        </tr>
                                    ) : (
                                        movements.map((m) => (
                                            <tr key={m.id}>
                                                <td className="ps-4 py-3 text-muted fs-7">{m.date}</td>
                                                <td className="py-3">
                                                    <div className="fw-semibold text-dark fs-7">{m.product_name}</div>
                                                    <span className="text-muted fs-7 font-monospace">SKU: {m.sku}</span>
                                                </td>
                                                <td className="py-3">
                                                    <span className={`badge px-2 py-1 ${
                                                        m.movement_label === 'Receipt' ? 'bg-success-subtle text-success' :
                                                        m.movement_label === 'Sale' ? 'bg-primary-subtle text-primary' :
                                                        m.movement_label === 'Transfer' ? 'bg-info-subtle text-info' :
                                                        m.movement_label === 'Adjustment' ? 'bg-warning-subtle text-warning' :
                                                        'bg-secondary-subtle text-secondary'
                                                    }`}>
                                                        {m.movement_label}
                                                    </span>
                                                </td>
                                                <td className="py-3 text-end fw-bold">
                                                    <span className={m.quantity_delta > 0 ? 'text-success' : m.quantity_delta < 0 ? 'text-danger' : 'text-dark'}>
                                                        {m.quantity_delta > 0 ? `+${m.quantity_delta}` : m.quantity_delta} {m.unit_symbol}
                                                    </span>
                                                </td>
                                                <td className="py-3 fs-7">
                                                    <div>{m.warehouse_name}</div>
                                                    <span className="text-muted">Loc: {m.location_code}</span>
                                                </td>
                                                <td className="py-3 fs-7">
                                                    <span className="badge bg-light text-dark border">
                                                        {m.reference_label}
                                                    </span>
                                                </td>
                                                <td className="pe-4 py-3 text-muted fs-7">{m.user_name}</td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {/* STOCK DETAILS MODAL / DRAWER */}
            {selectedItem && (
                <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
                    <div className="modal-dialog modal-lg modal-dialog-scrollable">
                        <div className="modal-content border-0 shadow-lg rounded-3">
                            <div className="modal-header border-bottom py-3">
                                <div>
                                    <h5 className="modal-title fw-bold text-dark">{selectedItem.product_name}</h5>
                                    <div className="d-flex align-items-center gap-2 mt-1">
                                        <span className="badge bg-light text-secondary border font-monospace">SKU: {selectedItem.sku || 'N/A'}</span>
                                        <span className="badge bg-secondary-subtle text-secondary">{selectedItem.category_name}</span>
                                        <span className={`badge ${selectedItem.stock_status === 'In Stock' ? 'bg-success-subtle text-success' : 'bg-danger-subtle text-danger'}`}>
                                            {selectedItem.stock_status}
                                        </span>
                                    </div>
                                </div>
                                <button type="button" className="btn-close" onClick={() => setSelectedItem(null)}></button>
                            </div>

                            <div className="modal-body p-4">
                                {/* Stock Level Summary Cards */}
                                <div className="row g-3 mb-4">
                                    <div className="col-4">
                                        <div className="p-3 bg-light rounded-3 text-center border">
                                            <span className="text-secondary small fw-semibold text-uppercase">On Hand</span>
                                            <h4 className="fw-bold text-dark mt-1 mb-0">
                                                {selectedItem.on_hand_qty} {selectedItem.unit_symbol}
                                            </h4>
                                            {selectedItem.on_hand_area > 0 && (
                                                <span className="text-muted fs-7">{selectedItem.on_hand_area} sq.ft.</span>
                                            )}
                                        </div>
                                    </div>
                                    <div className="col-4">
                                        <div className="p-3 bg-light rounded-3 text-center border">
                                            <span className="text-secondary small fw-semibold text-uppercase">Reserved</span>
                                            <h4 className="fw-bold text-warning mt-1 mb-0">
                                                {selectedItem.reserved_qty} {selectedItem.unit_symbol}
                                            </h4>
                                        </div>
                                    </div>
                                    <div className="col-4">
                                        <div className="p-3 bg-light rounded-3 text-center border">
                                            <span className="text-secondary small fw-semibold text-uppercase">Available</span>
                                            <h4 className="fw-bold text-success mt-1 mb-0">
                                                {selectedItem.available_qty} {selectedItem.unit_symbol}
                                            </h4>
                                            {selectedItem.available_area > 0 && (
                                                <span className="text-muted fs-7">{selectedItem.available_area} sq.ft.</span>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Location & Packaging info */}
                                <div className="row g-3 mb-4">
                                    <div className="col-md-6">
                                        <div className="card border-0 bg-light p-3 rounded-3">
                                            <span className="text-secondary small fw-semibold">Warehouse & Location</span>
                                            <div className="fw-bold text-dark mt-1">{selectedItem.warehouse_name}</div>
                                            <div className="text-muted small">Storage Bin / Bay: <span className="badge bg-white text-dark border ms-1">{selectedItem.storage_location_code}</span></div>
                                        </div>
                                    </div>
                                    <div className="col-md-6">
                                        <div className="card border-0 bg-light p-3 rounded-3">
                                            <span className="text-secondary small fw-semibold">Packaging Information</span>
                                            <div className="fw-medium text-dark mt-1">
                                                {selectedItem.packaging_info || "Standard Unit Packaging"}
                                            </div>
                                            <div className="text-muted small">Batch: <span className="font-monospace text-dark ms-1">{selectedItem.batch_number}</span></div>
                                        </div>
                                    </div>
                                </div>

                                {/* Slabs Breakdown if Granite/Marble */}
                                {selectedItem.is_slab && selectedItem.slabs?.length > 0 && (
                                    <div className="mb-4">
                                        <h6 className="fw-bold text-dark mb-3">Individual Slabs Inventory ({selectedItem.slabs_count} Slabs)</h6>
                                        <div className="table-responsive border rounded-3">
                                            <table className="table table-sm align-middle mb-0">
                                                <thead className="bg-light">
                                                    <tr>
                                                        <th className="ps-3 py-2 fs-7 text-secondary">Slab Code</th>
                                                        <th className="py-2 fs-7 text-secondary">Dimensions (L × W)</th>
                                                        <th className="py-2 fs-7 text-secondary">Area (sq.ft)</th>
                                                        <th className="py-2 fs-7 text-secondary">Location</th>
                                                        <th className="pe-3 py-2 fs-7 text-secondary text-end">Status</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {selectedItem.slabs.map(slab => (
                                                        <tr key={slab.id}>
                                                            <td className="ps-3 fw-mono text-dark fs-7">{slab.slab_code}</td>
                                                            <td className="fs-7">{slab.length} × {slab.width} in ({slab.thickness}mm)</td>
                                                            <td className="fs-7 fw-semibold">{Number(slab.area).toFixed(2)}</td>
                                                            <td className="fs-7"><span className="badge bg-light text-dark border">{slab.storage_location_code}</span></td>
                                                            <td className="pe-3 text-end">
                                                                <span className="badge bg-success-subtle text-success fs-7">{slab.status}</span>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                )}

                                {/* Recent Activity */}
                                <div>
                                    <h6 className="fw-bold text-dark mb-3">Recent Stock Activity</h6>
                                    {activityLoading ? (
                                        <div className="text-center py-3 text-muted">
                                            <div className="spinner-border spinner-border-sm me-2 text-primary" role="status"></div>
                                            Loading recent transactions...
                                        </div>
                                    ) : recentActivity.length === 0 ? (
                                        <div className="text-center py-3 text-muted small border rounded-3 bg-light">
                                            No recent stock movements recorded for this item.
                                        </div>
                                    ) : (
                                        <div className="table-responsive border rounded-3">
                                            <table className="table table-sm align-middle mb-0 fs-7">
                                                <thead className="bg-light">
                                                    <tr>
                                                        <th className="ps-3 py-2 text-secondary">Date</th>
                                                        <th className="py-2 text-secondary">Movement</th>
                                                        <th className="py-2 text-end text-secondary">Qty Delta</th>
                                                        <th className="py-2 text-secondary">Reference</th>
                                                        <th className="pe-3 py-2 text-secondary">User</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {recentActivity.map(act => (
                                                        <tr key={act.id}>
                                                            <td className="ps-3 text-muted">{act.date}</td>
                                                            <td>
                                                                <span className="badge bg-light text-dark border me-1">{act.movement_label}</span>
                                                            </td>
                                                            <td className="text-end fw-semibold">
                                                                <span className={act.quantity_delta > 0 ? "text-success" : "text-danger"}>
                                                                    {act.quantity_delta > 0 ? `+${act.quantity_delta}` : act.quantity_delta}
                                                                </span>
                                                            </td>
                                                            <td><span className="badge bg-light text-dark border">{act.reference_label}</span></td>
                                                            <td className="pe-3 text-muted">{act.user_name}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="modal-footer bg-light py-2">
                                <button type="button" className="btn btn-secondary btn-sm" onClick={() => setSelectedItem(null)}>
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* TRANSFER STOCK MODAL */}
            {activeModal === "transfer" && (
                <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
                    <div className="modal-dialog">
                        <div className="modal-content border-0 shadow-lg rounded-3">
                            <form onSubmit={handleTransferSubmit}>
                                <div className="modal-header border-bottom py-3">
                                    <h5 className="modal-title fw-bold text-dark">
                                        <i className="bi bi-arrow-left-right text-primary me-2"></i>
                                        Transfer Stock
                                    </h5>
                                    <button type="button" className="btn-close" onClick={() => setActiveModal(null)}></button>
                                </div>
                                <div className="modal-body p-4">
                                    <div className="mb-3">
                                        <label className="form-label small fw-semibold text-secondary">From Warehouse</label>
                                        <select
                                            className="form-select"
                                            required
                                            value={transferForm.from_warehouse_id}
                                            onChange={e => setTransferForm({ ...transferForm, from_warehouse_id: e.target.value })}
                                        >
                                            <option value="">Select Source Warehouse</option>
                                            {contexts.warehouses.map(w => (
                                                <option key={w.id} value={w.id}>{w.name}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="mb-3">
                                        <label className="form-label small fw-semibold text-secondary">To Warehouse</label>
                                        <select
                                            className="form-select"
                                            required
                                            value={transferForm.to_warehouse_id}
                                            onChange={e => setTransferForm({ ...transferForm, to_warehouse_id: e.target.value })}
                                        >
                                            <option value="">Select Destination Warehouse</option>
                                            {contexts.warehouses.filter(w => String(w.id) !== String(transferForm.from_warehouse_id)).map(w => (
                                                <option key={w.id} value={w.id}>{w.name}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="mb-3">
                                        <label className="form-label small fw-semibold text-secondary">Product</label>
                                        <select
                                            className="form-select"
                                            required
                                            value={transferForm.product_variant_id}
                                            onChange={e => setTransferForm({ ...transferForm, product_variant_id: e.target.value })}
                                        >
                                            <option value="">Select Product to Transfer</option>
                                            {stockItems
                                                .filter(s => !transferForm.from_warehouse_id || String(s.warehouse_id) === String(transferForm.from_warehouse_id))
                                                .map(s => (
                                                    <option key={s.id} value={s.product_variant_id}>
                                                        {s.product_name} (Avail: {s.available_qty} {s.unit_symbol})
                                                    </option>
                                                ))
                                            }
                                        </select>
                                    </div>

                                    <div className="mb-3">
                                        <label className="form-label small fw-semibold text-secondary">Quantity to Transfer</label>
                                        <input
                                            type="number"
                                            className="form-control"
                                            min="1"
                                            required
                                            value={transferForm.quantity}
                                            onChange={e => setTransferForm({ ...transferForm, quantity: e.target.value })}
                                        />
                                    </div>

                                    <div className="mb-3">
                                        <label className="form-label small fw-semibold text-secondary">Remarks / Reason</label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            placeholder="e.g. Store replenishment"
                                            value={transferForm.remarks}
                                            onChange={e => setTransferForm({ ...transferForm, remarks: e.target.value })}
                                        />
                                    </div>
                                </div>
                                <div className="modal-footer bg-light py-2">
                                    <button type="button" className="btn btn-secondary btn-sm" onClick={() => setActiveModal(null)}>Cancel</button>
                                    <button type="submit" className="btn btn-primary btn-sm px-4" disabled={submittingAction}>
                                        {submittingAction ? "Transferring..." : "Submit Transfer"}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* ADJUST STOCK MODAL */}
            {activeModal === "adjust" && (
                <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
                    <div className="modal-dialog">
                        <div className="modal-content border-0 shadow-lg rounded-3">
                            <form onSubmit={handleAdjustSubmit}>
                                <div className="modal-header border-bottom py-3">
                                    <h5 className="modal-title fw-bold text-dark">
                                        <i className="bi bi-sliders text-warning me-2"></i>
                                        Adjust Stock
                                    </h5>
                                    <button type="button" className="btn-close" onClick={() => setActiveModal(null)}></button>
                                </div>
                                <div className="modal-body p-4">
                                    <div className="mb-3">
                                        <label className="form-label small fw-semibold text-secondary">Warehouse</label>
                                        <select
                                            className="form-select"
                                            required
                                            value={adjustForm.warehouse_id}
                                            onChange={e => setAdjustForm({ ...adjustForm, warehouse_id: e.target.value })}
                                        >
                                            <option value="">Select Warehouse</option>
                                            {contexts.warehouses.map(w => (
                                                <option key={w.id} value={w.id}>{w.name}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="mb-3">
                                        <label className="form-label small fw-semibold text-secondary">Product</label>
                                        <select
                                            className="form-select"
                                            required
                                            value={adjustForm.product_variant_id}
                                            onChange={e => setAdjustForm({ ...adjustForm, product_variant_id: e.target.value })}
                                        >
                                            <option value="">Select Product</option>
                                            {stockItems
                                                .filter(s => !adjustForm.warehouse_id || String(s.warehouse_id) === String(adjustForm.warehouse_id))
                                                .map(s => (
                                                    <option key={s.id} value={s.product_variant_id}>
                                                        {s.product_name} (Current: {s.on_hand_qty} {s.unit_symbol})
                                                    </option>
                                                ))
                                            }
                                        </select>
                                    </div>

                                    <div className="mb-3">
                                        <label className="form-label small fw-semibold text-secondary">Adjustment Type</label>
                                        <select
                                            className="form-select"
                                            value={adjustForm.adjustment_type}
                                            onChange={e => setAdjustForm({ ...adjustForm, adjustment_type: e.target.value })}
                                        >
                                            <option value="DAMAGE">Damage / Breakage</option>
                                            <option value="FOUND">Stock Found (+)</option>
                                            <option value="CORRECTION">Quantity Correction</option>
                                            <option value="EXPIRY">Expiry / Wastage</option>
                                        </select>
                                    </div>

                                    <div className="mb-3">
                                        <label className="form-label small fw-semibold text-secondary">Adjustment Quantity (+ or -)</label>
                                        <input
                                            type="number"
                                            className="form-control"
                                            required
                                            value={adjustForm.quantity_delta}
                                            onChange={e => setAdjustForm({ ...adjustForm, quantity_delta: e.target.value })}
                                        />
                                        <span className="text-muted fs-7">Use negative number for reduction (e.g. -5), positive for addition (+5).</span>
                                    </div>

                                    <div className="mb-3">
                                        <label className="form-label small fw-semibold text-secondary">Reason & Remarks</label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            placeholder="Reason for adjustment"
                                            value={adjustForm.reason}
                                            onChange={e => setAdjustForm({ ...adjustForm, reason: e.target.value })}
                                        />
                                    </div>
                                </div>
                                <div className="modal-footer bg-light py-2">
                                    <button type="button" className="btn btn-secondary btn-sm" onClick={() => setActiveModal(null)}>Cancel</button>
                                    <button type="submit" className="btn btn-warning text-white btn-sm px-4" disabled={submittingAction}>
                                        {submittingAction ? "Submitting..." : "Apply Adjustment"}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* STOCK COUNT MODAL */}
            {activeModal === "count" && (
                <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
                    <div className="modal-dialog">
                        <div className="modal-content border-0 shadow-lg rounded-3">
                            <form onSubmit={handleCountSubmit}>
                                <div className="modal-header border-bottom py-3">
                                    <h5 className="modal-title fw-bold text-dark">
                                        <i className="bi bi-clipboard-check text-success me-2"></i>
                                        Stock Count Reconciliation
                                    </h5>
                                    <button type="button" className="btn-close" onClick={() => setActiveModal(null)}></button>
                                </div>
                                <div className="modal-body p-4">
                                    <div className="mb-3">
                                        <label className="form-label small fw-semibold text-secondary">Warehouse</label>
                                        <select
                                            className="form-select"
                                            required
                                            value={countForm.warehouse_id}
                                            onChange={e => setCountForm({ ...countForm, warehouse_id: e.target.value })}
                                        >
                                            <option value="">Select Warehouse</option>
                                            {contexts.warehouses.map(w => (
                                                <option key={w.id} value={w.id}>{w.name}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="mb-3">
                                        <label className="form-label small fw-semibold text-secondary">Count Type</label>
                                        <select
                                            className="form-select"
                                            value={countForm.count_type}
                                            onChange={e => setCountForm({ ...countForm, count_type: e.target.value })}
                                        >
                                            <option value="SPOT">Spot Count</option>
                                            <option value="CYCLE">Cycle Count</option>
                                            <option value="ANNUAL">Annual Physical Audit</option>
                                        </select>
                                    </div>

                                    <div className="mb-3">
                                        <label className="form-label small fw-semibold text-secondary">Product to Audit</label>
                                        <select
                                            className="form-select"
                                            value={countForm.product_variant_id}
                                            onChange={e => setCountForm({ ...countForm, product_variant_id: e.target.value })}
                                        >
                                            <option value="">Select Product (or Audit All)</option>
                                            {stockItems
                                                .filter(s => !countForm.warehouse_id || String(s.warehouse_id) === String(countForm.warehouse_id))
                                                .map(s => (
                                                    <option key={s.id} value={s.product_variant_id}>
                                                        {s.product_name} (System: {s.on_hand_qty} {s.unit_symbol})
                                                    </option>
                                                ))
                                            }
                                        </select>
                                    </div>

                                    {countForm.product_variant_id && (
                                        <div className="mb-3">
                                            <label className="form-label small fw-semibold text-secondary">Physical Counted Quantity</label>
                                            <input
                                                type="number"
                                                className="form-control"
                                                required
                                                value={countForm.counted_quantity}
                                                onChange={e => setCountForm({ ...countForm, counted_quantity: e.target.value })}
                                            />
                                        </div>
                                    )}

                                    <div className="mb-3">
                                        <label className="form-label small fw-semibold text-secondary">Audit Remarks</label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            placeholder="Physical count verification notes"
                                            value={countForm.remarks}
                                            onChange={e => setCountForm({ ...countForm, remarks: e.target.value })}
                                        />
                                    </div>
                                </div>
                                <div className="modal-footer bg-light py-2">
                                    <button type="button" className="btn btn-secondary btn-sm" onClick={() => setActiveModal(null)}>Cancel</button>
                                    <button type="submit" className="btn btn-success btn-sm px-4" disabled={submittingAction}>
                                        {submittingAction ? "Processing..." : "Reconcile Count"}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
