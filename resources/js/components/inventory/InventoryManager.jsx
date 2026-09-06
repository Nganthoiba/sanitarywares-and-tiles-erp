import React, { useState, useEffect } from "react";
import axios from "axios";

export default function InventoryManager() {
    const [viewMode, setViewMode] = useState("stock"); // 'stock' | 'reservations' | 'history'
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [successMessage, setSuccessMessage] = useState(null);
    const [isForbidden, setIsForbidden] = useState(false);
    const [forbiddenMessage, setForbiddenMessage] = useState("");

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
        customers: [],
        product_variants: []
    });

    // Filter state for Stock View
    const [filters, setFilters] = useState({
        warehouse_id: "",
        category_id: "",
        status: "ALL",
        search: ""
    });

    // Stock View Pagination state
    const [stockPage, setStockPage] = useState(1);
    const [stockPerPage, setStockPerPage] = useState(15);

    // Reservations List state
    const [reservations, setReservations] = useState([]);
    const [reservationsLoading, setReservationsLoading] = useState(false);
    const [reservationsFilter, setReservationsFilter] = useState({
        status: "ALL",
        search: "",
        warehouse_id: ""
    });
    const [reservationsPagination, setReservationsPagination] = useState({
        current_page: 1,
        last_page: 1,
        total: 0
    });

    // History Ledger state
    const [movements, setMovements] = useState([]);
    const [movementsLoading, setMovementsLoading] = useState(false);
    const [movementsPerPage, setMovementsPerPage] = useState(25);
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
    const [activeModal, setActiveModal] = useState(null); // 'reserve' | 'lowStockSettings' | 'transfer' | 'adjust' | 'count' | null
    const [submittingAction, setSubmittingAction] = useState(false);

    // Reserve Form
    const [reserveForm, setReserveForm] = useState({
        product_variant_id: "",
        warehouse_id: "",
        storage_location_id: "",
        customer_id: "",
        quantity: 1,
        reservation_date: new Date().toISOString().split("T")[0],
        expires_at: "",
        reference_number: "",
        remarks: ""
    });

    // Low Stock Settings Form
    const [lowStockForm, setLowStockForm] = useState({
        product_variant_id: "",
        product_name: "",
        unit_symbol: "",
        low_stock_warning_level: 0
    });

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
            if (err.response && err.response.data) {
                const msg = err.response.data.message || "Failed to fetch inventory stock records.";
                setError(msg);
                if (err.response.status === 403 || err.response.status === 401) {
                    setIsForbidden(true);
                    setForbiddenMessage(msg);
                }
            } else {
                setError("Failed to fetch inventory stock records.");
            }
        } finally {
            setLoading(false);
        }
    };

    // Load Form Options (Warehouses, Categories, Locations, Customers, Products)
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
                    customers: res.data.customers || [],
                    product_variants: res.data.product_variants || []
                });

                if (res.data.warehouses?.length > 0) {
                    const firstWhId = String(res.data.warehouses[0].id);
                    setTransferForm(prev => ({ ...prev, from_warehouse_id: firstWhId }));
                    setAdjustForm(prev => ({ ...prev, warehouse_id: firstWhId }));
                    setCountForm(prev => ({ ...prev, warehouse_id: firstWhId }));
                    setReserveForm(prev => ({ ...prev, warehouse_id: firstWhId }));
                }
            }
        } catch (err) {
            console.error("Failed to load inventory options context", err);
        }
    };

    // Load Reservations List
    const loadReservations = async (page = 1) => {
        setReservationsLoading(true);
        try {
            const params = { page, per_page: 15 };
            if (reservationsFilter.status !== "ALL") params.status = reservationsFilter.status;
            if (reservationsFilter.search) params.search = reservationsFilter.search;
            if (reservationsFilter.warehouse_id) params.warehouse_id = reservationsFilter.warehouse_id;

            const res = await axios.get("/api/inventory/reservations", {
                headers: getAuthHeaders(),
                params
            });

            if (res.data.success) {
                setReservations(res.data.data || []);
                if (res.data.pagination) {
                    setReservationsPagination(res.data.pagination);
                }
            }
        } catch (err) {
            console.error("Failed to fetch reservations list", err);
        } finally {
            setReservationsLoading(false);
        }
    };

    // Load Movements Ledger
    const loadMovements = async (page = 1, perPage = movementsPerPage) => {
        setMovementsLoading(true);
        try {
            const res = await axios.get("/api/inventory/movements", {
                headers: getAuthHeaders(),
                params: { page, per_page: perPage }
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
        setStockPage(1);
        loadStockData();
    }, [filters.warehouse_id, filters.category_id, filters.status, filters.search]);

    useEffect(() => {
        if (viewMode === "history") {
            loadMovements(1, movementsPerPage);
        } else if (viewMode === "reservations") {
            loadReservations(1);
        }
    }, [viewMode, reservationsFilter.status, reservationsFilter.search, reservationsFilter.warehouse_id]);

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

    // Open Reserve Stock Modal
    const openReserveModal = (item = null) => {
        const firstWhId = contexts.warehouses.length > 0 ? String(contexts.warehouses[0].id) : "";
        setReserveForm({
            product_variant_id: item ? String(item.product_variant_id) : (contexts.product_variants.length > 0 ? String(contexts.product_variants[0].id) : ""),
            warehouse_id: item ? String(item.warehouse_id || firstWhId) : firstWhId,
            storage_location_id: item ? String(item.storage_location_id || "") : "",
            customer_id: "",
            quantity: 1,
            reservation_date: new Date().toISOString().split("T")[0],
            expires_at: "",
            reference_number: "",
            remarks: ""
        });
        setActiveModal("reserve");
    };

    // Open Low Stock Modal
    const openLowStockModal = (item) => {
        setLowStockForm({
            product_variant_id: item.product_variant_id,
            product_name: item.product_name,
            unit_symbol: item.unit_symbol || "Units",
            low_stock_warning_level: item.low_stock_warning_level ?? 0
        });
        setActiveModal("lowStockSettings");
    };

    // Submit Reserve Stock
    const handleReserveSubmit = async (e) => {
        e.preventDefault();
        setSubmittingAction(true);
        setError(null);
        try {
            const payload = {
                product_variant_id: parseInt(reserveForm.product_variant_id),
                warehouse_id: reserveForm.warehouse_id ? parseInt(reserveForm.warehouse_id) : null,
                storage_location_id: reserveForm.storage_location_id ? parseInt(reserveForm.storage_location_id) : null,
                customer_id: reserveForm.customer_id ? parseInt(reserveForm.customer_id) : null,
                quantity: parseFloat(reserveForm.quantity),
                reservation_date: reserveForm.reservation_date || null,
                expires_at: reserveForm.expires_at || null,
                reference_number: reserveForm.reference_number || null,
                remarks: reserveForm.remarks || null,
            };

            const res = await axios.post("/api/inventory/reserve", payload, {
                headers: getAuthHeaders()
            });

            if (res.data.success) {
                setSuccessMessage("Stock reserved successfully.");
                setActiveModal(null);
                loadStockData();
                if (viewMode === "reservations") loadReservations(1);
                setTimeout(() => setSuccessMessage(null), 4000);
            }
        } catch (err) {
            alert(err.response?.data?.message || "Failed to reserve stock.");
        } finally {
            setSubmittingAction(false);
        }
    };

    // Submit Low Stock Warning Level Update
    const handleLowStockSubmit = async (e) => {
        e.preventDefault();
        setSubmittingAction(true);
        try {
            const res = await axios.put(`/api/product/variants/${lowStockForm.product_variant_id}/low-stock-settings`, {
                low_stock_warning_level: parseFloat(lowStockForm.low_stock_warning_level)
            }, {
                headers: getAuthHeaders()
            });

            if (res.data.success) {
                setSuccessMessage("Low-stock warning level updated successfully.");
                setActiveModal(null);
                loadStockData();
                setTimeout(() => setSuccessMessage(null), 4000);
            }
        } catch (err) {
            alert(err.response?.data?.message || "Failed to update low-stock warning level.");
        } finally {
            setSubmittingAction(false);
        }
    };

    // Cancel Reservation
    const handleCancelReservation = async (id) => {
        if (!confirm("Are you sure you want to cancel this reservation? The reserved quantity will be released back to available stock.")) {
            return;
        }
        try {
            const res = await axios.post(`/api/inventory/reservations/${id}/cancel`, {}, {
                headers: getAuthHeaders()
            });
            if (res.data.success) {
                setSuccessMessage("Reservation cancelled and stock released.");
                loadReservations(reservationsPagination.current_page);
                loadStockData();
                setTimeout(() => setSuccessMessage(null), 4000);
            }
        } catch (err) {
            alert(err.response?.data?.message || "Failed to cancel reservation.");
        }
    };

    // Fulfill Reservation
    const handleFulfillReservation = async (id) => {
        if (!confirm("Mark this reservation as fulfilled?")) {
            return;
        }
        try {
            const res = await axios.post(`/api/inventory/reservations/${id}/fulfill`, {}, {
                headers: getAuthHeaders()
            });
            if (res.data.success) {
                setSuccessMessage("Reservation marked as fulfilled.");
                loadReservations(reservationsPagination.current_page);
                loadStockData();
                setTimeout(() => setSuccessMessage(null), 4000);
            }
        } catch (err) {
            alert(err.response?.data?.message || "Failed to fulfill reservation.");
        }
    };

    // Submit Transfer
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

    // Submit Adjustment
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

    // Submit Stock Count
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
                    await axios.post(`/api/inventory/counts/${countId}/approve`, {}, { headers: getAuthHeaders() });
                }
                setSuccessMessage("Stock count completed and posted successfully.");
                setActiveModal(null);
                loadStockData();
                setTimeout(() => setSuccessMessage(null), 4000);
            }
        } catch (err) {
            alert(err.response?.data?.message || "Failed to complete stock count reconciliation.");
        } finally {
            setSubmittingAction(false);
        }
    };

    // Selected product & stock calculations for Reserve Modal
    const selectedReserveProduct = contexts.product_variants.find(
        p => String(p.id) === String(reserveForm.product_variant_id)
    );
    const matchingStockEntry = stockItems.find(
        s => String(s.product_variant_id) === String(reserveForm.product_variant_id) &&
             (!reserveForm.warehouse_id || String(s.warehouse_id) === String(reserveForm.warehouse_id))
    );
    const currentOnHand = matchingStockEntry ? matchingStockEntry.on_hand_qty : 0;
    const currentReserved = matchingStockEntry ? matchingStockEntry.reserved_qty : 0;
    const currentAvailable = matchingStockEntry ? matchingStockEntry.available_qty : 0;
    const selectedUnitSymbol = selectedReserveProduct?.base_unit?.symbol || selectedReserveProduct?.baseUnit?.symbol || matchingStockEntry?.unit_symbol || "Units";
    const isExceedingAvailable = parseFloat(reserveForm.quantity || 0) > currentAvailable;

    if (isForbidden) {
        return (
            <div className="container-fluid py-5">
                <div className="card border-0 shadow-sm rounded-3 text-center p-5">
                    <div className="card-body">
                        <i className="bi bi-shield-lock-fill text-danger fs-1 mb-3"></i>
                        <h4 className="fw-bold text-dark">Access Restricted</h4>
                        <p className="text-muted">{forbiddenMessage}</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="container-fluid py-4 px-4 bg-light min-vh-100">
            {/* Success & Error Banner */}
            {successMessage && (
                <div className="alert alert-success alert-dismissible fade show border-0 shadow-sm rounded-3 mb-3" role="alert">
                    <i className="bi bi-check-circle-fill me-2"></i>
                    {successMessage}
                    <button type="button" className="btn-close" onClick={() => setSuccessMessage(null)}></button>
                </div>
            )}
            {error && (
                <div className="alert alert-danger alert-dismissible fade show border-0 shadow-sm rounded-3 mb-3" role="alert">
                    <i className="bi bi-exclamation-triangle-fill me-2"></i>
                    {error}
                    <button type="button" className="btn-close" onClick={() => setError(null)}></button>
                </div>
            )}

            {/* Header Toolbar */}
            <div className="d-flex flex-column flex-md-row align-items-md-center justify-content-between mb-4 gap-3">
                <div>
                    <h2 className="h3 fw-bold text-dark mb-1">Inventory Management</h2>
                    <p className="text-muted small mb-0">
                        Real-time physical stock levels, reservation controls, low-stock warnings, and audit ledger.
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
                            className={`btn btn-sm ${viewMode === "reservations" ? "btn-dark fw-medium" : "btn-outline-secondary"}`}
                            onClick={() => setViewMode("reservations")}
                        >
                            <i className="bi bi-bookmark-check me-1"></i> Reservations
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
                        onClick={() => {
                            if (viewMode === "stock") loadStockData();
                            else if (viewMode === "reservations") loadReservations(reservationsPagination.current_page);
                            else loadMovements(movementsPagination.current_page);
                        }}
                        disabled={loading || reservationsLoading || movementsLoading}
                    >
                        <i className={`bi bi-arrow-clockwise ${(loading || reservationsLoading || movementsLoading) ? "spin" : ""}`}></i>
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
                                <button className="dropdown-item py-2" onClick={() => openReserveModal()}>
                                    <i className="bi bi-bookmark-plus text-primary me-2"></i>
                                    Reserve Stock
                                </button>
                            </li>
                            <li>
                                <button className="dropdown-item py-2" onClick={() => setActiveModal("transfer")}>
                                    <i className="bi bi-arrow-left-right text-info me-2"></i>
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

            {/* TAB 1: STOCK VIEW */}
            {viewMode === "stock" && (
                <>
                    {/* Filters Toolbar */}
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
                                        {contexts.warehouses.map(w => (
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
                                        {contexts.categories.map(c => (
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

                    {/* Stock Table */}
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
                </>
            )}

            {/* TAB 2: RESERVATIONS LIST VIEW */}
            {viewMode === "reservations" && (
                <>
                    {/* Reservations Filter Toolbar */}
                    <div className="card border-0 shadow-sm rounded-3 mb-3 bg-white">
                        <div className="card-body p-3">
                            <div className="row g-2 align-items-center">
                                <div className="col-12 col-md-3">
                                    <label className="form-label small text-secondary mb-1">Status Filter</label>
                                    <select
                                        className="form-select form-select-sm"
                                        value={reservationsFilter.status}
                                        onChange={e => setReservationsFilter(prev => ({ ...prev, status: e.target.value }))}
                                    >
                                        <option value="ALL">All Statuses</option>
                                        <option value="ACTIVE">Active</option>
                                        <option value="FULFILLED">Fulfilled</option>
                                        <option value="CANCELLED">Cancelled</option>
                                        <option value="EXPIRED">Expired</option>
                                    </select>
                                </div>

                                <div className="col-12 col-md-3">
                                    <label className="form-label small text-secondary mb-1">Warehouse</label>
                                    <select
                                        className="form-select form-select-sm"
                                        value={reservationsFilter.warehouse_id}
                                        onChange={e => setReservationsFilter(prev => ({ ...prev, warehouse_id: e.target.value }))}
                                    >
                                        <option value="">All Warehouses</option>
                                        {contexts.warehouses.map(w => (
                                            <option key={w.id} value={w.id}>{w.name}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="col-12 col-md-6">
                                    <label className="form-label small text-secondary mb-1">Search Reservations</label>
                                    <div className="input-group input-group-sm">
                                        <span className="input-group-text bg-white border-end-0">
                                            <i className="bi bi-search text-secondary"></i>
                                        </span>
                                        <input
                                            type="text"
                                            className="form-control border-start-0 ps-0"
                                            placeholder="Search reservation #, reference, product, customer..."
                                            value={reservationsFilter.search}
                                            onChange={e => setReservationsFilter(prev => ({ ...prev, search: e.target.value }))}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Reservations Table */}
                    <div className="card border-0 shadow-sm rounded-3 mb-4 bg-white overflow-hidden">
                        <div className="card-body p-0">
                            <div className="table-responsive">
                                <table className="table table-hover table-borderless align-middle mb-0">
                                    <thead className="bg-light border-bottom">
                                        <tr>
                                            <th className="ps-4 py-3 text-secondary text-uppercase fs-7 fw-bold">Reservation #</th>
                                            <th className="py-3 text-secondary text-uppercase fs-7 fw-bold">Product</th>
                                            <th className="py-3 text-secondary text-uppercase fs-7 fw-bold">Customer / Order</th>
                                            <th className="py-3 text-secondary text-uppercase fs-7 fw-bold">Warehouse / Location</th>
                                            <th className="py-3 text-end text-secondary text-uppercase fs-7 fw-bold">Reserved Qty</th>
                                            <th className="py-3 text-secondary text-uppercase fs-7 fw-bold">Reservation Date</th>
                                            <th className="py-3 text-secondary text-uppercase fs-7 fw-bold">Expiry Date</th>
                                            <th className="py-3 text-center text-secondary text-uppercase fs-7 fw-bold">Status</th>
                                            <th className="pe-4 py-3 text-end text-secondary text-uppercase fs-7 fw-bold">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y">
                                        {reservationsLoading ? (
                                            <tr>
                                                <td colSpan="9" className="text-center py-5 text-muted">
                                                    <div className="spinner-border spinner-border-sm me-2 text-primary" role="status"></div>
                                                    Loading stock reservations...
                                                </td>
                                            </tr>
                                        ) : reservations.length === 0 ? (
                                            <tr>
                                                <td colSpan="9" className="text-center py-5 text-muted">
                                                    <i className="bi bi-bookmark-x fs-2 d-block mb-2 text-secondary"></i>
                                                    No reservations found matching your criteria.
                                                </td>
                                            </tr>
                                        ) : (
                                            reservations.map((res) => {
                                                const unitSym = res.product?.base_unit?.symbol || res.product?.sales_unit?.symbol || 'Units';
                                                return (
                                                    <tr key={res.id}>
                                                        <td className="ps-4 py-3 font-monospace fw-bold text-primary">
                                                            {res.reservation_number || `RES-#${res.id}`}
                                                        </td>
                                                        <td className="py-3">
                                                            <div className="fw-semibold text-dark">{res.product?.name || 'Product'}</div>
                                                            <div className="text-muted fs-7">SKU: {res.product?.sku || '-'}</div>
                                                        </td>
                                                        <td className="py-3">
                                                            <div className="fw-medium text-dark">{res.customer?.name || 'Walk-in / Direct'}</div>
                                                            {res.reference_number && (
                                                                <div className="text-muted fs-7">Ref: {res.reference_number}</div>
                                                            )}
                                                        </td>
                                                        <td className="py-3">
                                                            <div className="fw-medium text-dark">{res.warehouse?.name || 'Main Warehouse'}</div>
                                                            {res.storage_location && (
                                                                <div className="text-muted fs-7">Loc: {res.storage_location.code}</div>
                                                            )}
                                                        </td>
                                                        <td className="py-3 text-end fw-bold text-warning">
                                                            {Number(res.quantity).toLocaleString()} {unitSym}
                                                        </td>
                                                        <td className="py-3 text-muted fs-7">
                                                            {res.reservation_date ? new Date(res.reservation_date).toLocaleDateString() : new Date(res.created_at).toLocaleDateString()}
                                                        </td>
                                                        <td className="py-3 text-muted fs-7">
                                                            {res.expires_at ? new Date(res.expires_at).toLocaleDateString() : 'No Expiry'}
                                                        </td>
                                                        <td className="py-3 text-center">
                                                            {res.status === 'ACTIVE' || res.status === 'PENDING' ? (
                                                                <span className="badge bg-primary-subtle text-primary border border-primary px-2.5 py-1">Active</span>
                                                            ) : res.status === 'FULFILLED' ? (
                                                                <span className="badge bg-success-subtle text-success border border-success px-2.5 py-1">Fulfilled</span>
                                                            ) : res.status === 'CANCELLED' ? (
                                                                <span className="badge bg-secondary-subtle text-secondary border px-2.5 py-1">Cancelled</span>
                                                            ) : (
                                                                <span className="badge bg-danger-subtle text-danger border border-danger px-2.5 py-1">Expired</span>
                                                            )}
                                                        </td>
                                                        <td className="pe-4 py-3 text-end">
                                                            {(res.status === 'ACTIVE' || res.status === 'PENDING') && (
                                                                <div className="btn-group">
                                                                    <button
                                                                        className="btn btn-outline-success btn-sm px-2 py-0.5 fs-7"
                                                                        onClick={() => handleFulfillReservation(res.id)}
                                                                        title="Fulfill / Dispatch Reservation"
                                                                    >
                                                                        <i className="bi bi-check2-circle me-1"></i> Fulfill
                                                                    </button>
                                                                    <button
                                                                        className="btn btn-outline-danger btn-sm px-2 py-0.5 fs-7"
                                                                        onClick={() => handleCancelReservation(res.id)}
                                                                        title="Cancel Reservation"
                                                                    >
                                                                        <i className="bi bi-x-circle me-1"></i> Cancel
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
                    </div>
                </>
            )}

            {/* TAB 3: STOCK HISTORY VIEW */}
            {viewMode === "history" && (
                <div className="card border-0 shadow-sm rounded-3 mb-4 bg-white overflow-hidden">
                    <div className="card-header bg-white border-bottom py-3 px-4">
                        <h5 className="card-title fw-bold text-dark mb-0">Append-Only Stock Audit Ledger</h5>
                    </div>
                    <div className="card-body p-0">
                        <div className="table-responsive">
                            <table className="table table-hover table-borderless align-middle mb-0">
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
                                    {movementsLoading ? (
                                        <tr>
                                            <td colSpan="7" className="text-center py-5 text-muted">
                                                <div className="spinner-border spinner-border-sm me-2 text-primary" role="status"></div>
                                                Loading stock audit movements...
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
                                                <td className="py-3 text-muted fs-7">{m.reference_label}</td>
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

            {/* MODAL 1: RESERVE STOCK MODAL */}
            {activeModal === "reserve" && (
                <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
                    <div className="modal-dialog modal-lg">
                        <div className="modal-content border-0 shadow-lg rounded-3">
                            <form onSubmit={handleReserveSubmit}>
                                <div className="modal-header border-bottom py-3">
                                    <h5 className="modal-title fw-bold text-dark">
                                        <i className="bi bi-bookmark-plus text-primary me-2"></i>
                                        Reserve Stock
                                    </h5>
                                    <button type="button" className="btn-close" onClick={() => setActiveModal(null)}></button>
                                </div>
                                <div className="modal-body p-4">
                                    {/* Availability Live Context Banner */}
                                    {reserveForm.product_variant_id && (
                                        <div className="card border-0 bg-primary-subtle rounded-3 mb-3 p-3">
                                            <div className="d-flex align-items-center justify-content-between">
                                                <div>
                                                    <div className="fw-bold text-dark">
                                                        {selectedReserveProduct?.name || 'Selected Product'}
                                                    </div>
                                                    <div className="small text-muted">
                                                        SKU: {selectedReserveProduct?.sku || '-'}
                                                    </div>
                                                </div>
                                                <div className="d-flex gap-3 text-end">
                                                    <div>
                                                        <span className="small text-secondary d-block">On Hand</span>
                                                        <strong className="text-dark">{currentOnHand} {selectedUnitSymbol}</strong>
                                                    </div>
                                                    <div>
                                                        <span className="small text-secondary d-block">Reserved</span>
                                                        <strong className="text-warning">{currentReserved} {selectedUnitSymbol}</strong>
                                                    </div>
                                                    <div>
                                                        <span className="small text-secondary d-block">Available</span>
                                                        <strong className="text-success">{currentAvailable} {selectedUnitSymbol}</strong>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {isExceedingAvailable && (
                                        <div className="alert alert-danger p-2.5 small mb-3">
                                            <i className="bi bi-exclamation-triangle-fill me-1"></i>
                                            Cannot reserve {reserveForm.quantity} {selectedUnitSymbol} because only {currentAvailable} {selectedUnitSymbol} is available.
                                        </div>
                                    )}

                                    <div className="row g-3">
                                        <div className="col-12 col-md-6">
                                            <label className="form-label small fw-semibold text-secondary">Product <span className="text-danger">*</span></label>
                                            <select
                                                className="form-select"
                                                required
                                                value={reserveForm.product_variant_id}
                                                onChange={e => setReserveForm({ ...reserveForm, product_variant_id: e.target.value })}
                                            >
                                                <option value="">Select Product</option>
                                                {contexts.product_variants.map(p => (
                                                    <option key={p.id} value={p.id}>
                                                        {p.name} ({p.sku})
                                                    </option>
                                                ))}
                                            </select>
                                        </div>

                                        <div className="col-12 col-md-6">
                                            <label className="form-label small fw-semibold text-secondary">Warehouse <span className="text-danger">*</span></label>
                                            <select
                                                className="form-select"
                                                required
                                                value={reserveForm.warehouse_id}
                                                onChange={e => setReserveForm({ ...reserveForm, warehouse_id: e.target.value })}
                                            >
                                                <option value="">Select Warehouse</option>
                                                {contexts.warehouses.map(w => (
                                                    <option key={w.id} value={w.id}>{w.name}</option>
                                                ))}
                                            </select>
                                        </div>

                                        <div className="col-12 col-md-6">
                                            <label className="form-label small fw-semibold text-secondary">Storage Location (Optional)</label>
                                            <select
                                                className="form-select"
                                                value={reserveForm.storage_location_id}
                                                onChange={e => setReserveForm({ ...reserveForm, storage_location_id: e.target.value })}
                                            >
                                                <option value="">All / Any Location</option>
                                                {contexts.storage_locations
                                                    .filter(l => !reserveForm.warehouse_id || String(l.warehouse_id) === String(reserveForm.warehouse_id))
                                                    .map(l => (
                                                        <option key={l.id} value={l.id}>{l.name} ({l.code})</option>
                                                    ))
                                                }
                                            </select>
                                        </div>

                                        <div className="col-12 col-md-6">
                                            <label className="form-label small fw-semibold text-secondary">Customer (Optional)</label>
                                            <select
                                                className="form-select"
                                                value={reserveForm.customer_id}
                                                onChange={e => setReserveForm({ ...reserveForm, customer_id: e.target.value })}
                                            >
                                                <option value="">Select Customer</option>
                                                {contexts.customers.map(c => (
                                                    <option key={c.id} value={c.id}>{c.name}</option>
                                                ))}
                                            </select>
                                        </div>

                                        <div className="col-12 col-md-4">
                                            <label className="form-label small fw-semibold text-secondary">Quantity to Reserve <span className="text-danger">*</span></label>
                                            <div className="input-group">
                                                <input
                                                    type="number"
                                                    step="0.0001"
                                                    min="0.0001"
                                                    className={`form-control ${isExceedingAvailable ? 'is-invalid' : ''}`}
                                                    required
                                                    value={reserveForm.quantity}
                                                    onChange={e => setReserveForm({ ...reserveForm, quantity: e.target.value })}
                                                />
                                                <span className="input-group-text bg-light">{selectedUnitSymbol}</span>
                                            </div>
                                        </div>

                                        <div className="col-12 col-md-4">
                                            <label className="form-label small fw-semibold text-secondary">Reservation Date</label>
                                            <input
                                                type="date"
                                                className="form-control"
                                                value={reserveForm.reservation_date}
                                                onChange={e => setReserveForm({ ...reserveForm, reservation_date: e.target.value })}
                                            />
                                        </div>

                                        <div className="col-12 col-md-4">
                                            <label className="form-label small fw-semibold text-secondary">Expiry Date (Optional)</label>
                                            <input
                                                type="date"
                                                className="form-control"
                                                value={reserveForm.expires_at}
                                                onChange={e => setReserveForm({ ...reserveForm, expires_at: e.target.value })}
                                            />
                                        </div>

                                        <div className="col-12 col-md-6">
                                            <label className="form-label small fw-semibold text-secondary">Quotation / Sales Order Ref (Optional)</label>
                                            <input
                                                type="text"
                                                className="form-control"
                                                placeholder="e.g. SO-2026-0042 or QUOTE-88"
                                                value={reserveForm.reference_number}
                                                onChange={e => setReserveForm({ ...reserveForm, reference_number: e.target.value })}
                                            />
                                        </div>

                                        <div className="col-12 col-md-6">
                                            <label className="form-label small fw-semibold text-secondary">Remarks (Optional)</label>
                                            <input
                                                type="text"
                                                className="form-control"
                                                placeholder="Customer hold request notes..."
                                                value={reserveForm.remarks}
                                                onChange={e => setReserveForm({ ...reserveForm, remarks: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                </div>
                                <div className="modal-footer bg-light py-2">
                                    <button type="button" className="btn btn-secondary btn-sm" onClick={() => setActiveModal(null)}>Cancel</button>
                                    <button
                                        type="submit"
                                        className="btn btn-primary btn-sm px-4"
                                        disabled={submittingAction || isExceedingAvailable}
                                    >
                                        {submittingAction ? "Reserving..." : "Confirm Reservation"}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL 2: LOW STOCK WARNING SETTINGS MODAL */}
            {activeModal === "lowStockSettings" && (
                <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
                    <div className="modal-dialog">
                        <div className="modal-content border-0 shadow-lg rounded-3">
                            <form onSubmit={handleLowStockSubmit}>
                                <div className="modal-header border-bottom py-3">
                                    <h5 className="modal-title fw-bold text-dark">
                                        <i className="bi bi-sliders text-warning me-2"></i>
                                        Configure Low-Stock Warning Level
                                    </h5>
                                    <button type="button" className="btn-close" onClick={() => setActiveModal(null)}></button>
                                </div>
                                <div className="modal-body p-4">
                                    <div className="mb-3">
                                        <label className="form-label small fw-semibold text-secondary">Product</label>
                                        <input
                                            type="text"
                                            className="form-control bg-light"
                                            readOnly
                                            value={lowStockForm.product_name}
                                        />
                                    </div>

                                    <div className="mb-3">
                                        <label className="form-label small fw-semibold text-secondary">Low Stock Warning Threshold Level <span className="text-danger">*</span></label>
                                        <div className="input-group">
                                            <input
                                                type="number"
                                                step="0.0001"
                                                min="0"
                                                className="form-control"
                                                required
                                                value={lowStockForm.low_stock_warning_level}
                                                onChange={e => setLowStockForm({ ...lowStockForm, low_stock_warning_level: e.target.value })}
                                            />
                                            <span className="input-group-text bg-light">{lowStockForm.unit_symbol}</span>
                                        </div>
                                        <div className="form-text small text-muted mt-1">
                                            Warning triggers when Available Stock (On Hand - Reserved) drops to or below this quantity.
                                        </div>
                                    </div>
                                </div>
                                <div className="modal-footer bg-light py-2">
                                    <button type="button" className="btn btn-secondary btn-sm" onClick={() => setActiveModal(null)}>Cancel</button>
                                    <button type="submit" className="btn btn-warning text-white btn-sm px-4" disabled={submittingAction}>
                                        {submittingAction ? "Saving..." : "Save Inventory Settings"}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL 3: TRANSFER STOCK MODAL */}
            {activeModal === "transfer" && (
                <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
                    <div className="modal-dialog">
                        <div className="modal-content border-0 shadow-lg rounded-3">
                            <form onSubmit={handleTransferSubmit}>
                                <div className="modal-header border-bottom py-3">
                                    <h5 className="modal-title fw-bold text-dark">
                                        <i className="bi bi-arrow-left-right text-primary me-2"></i>
                                        Initiate Warehouse Transfer
                                    </h5>
                                    <button type="button" className="btn-close" onClick={() => setActiveModal(null)}></button>
                                </div>
                                <div className="modal-body p-4">
                                    <div className="mb-3">
                                        <label className="form-label small fw-semibold text-secondary">Source Warehouse</label>
                                        <select
                                            className="form-select"
                                            required
                                            value={transferForm.from_warehouse_id}
                                            onChange={e => setTransferForm({ ...transferForm, from_warehouse_id: e.target.value })}
                                        >
                                            <option value="">Select From Warehouse</option>
                                            {contexts.warehouses.map(w => (
                                                <option key={w.id} value={w.id}>{w.name}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="mb-3">
                                        <label className="form-label small fw-semibold text-secondary">Destination Warehouse</label>
                                        <select
                                            className="form-select"
                                            required
                                            value={transferForm.to_warehouse_id}
                                            onChange={e => setTransferForm({ ...transferForm, to_warehouse_id: e.target.value })}
                                        >
                                            <option value="">Select To Warehouse</option>
                                            {contexts.warehouses.filter(w => String(w.id) !== String(transferForm.from_warehouse_id)).map(w => (
                                                <option key={w.id} value={w.id}>{w.name}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="mb-3">
                                        <label className="form-label small fw-semibold text-secondary">Product to Transfer</label>
                                        <select
                                            className="form-select"
                                            required
                                            value={transferForm.product_variant_id}
                                            onChange={e => setTransferForm({ ...transferForm, product_variant_id: e.target.value })}
                                        >
                                            <option value="">Select Product</option>
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
                                            step="0.0001"
                                            min="0.0001"
                                            className="form-control"
                                            required
                                            value={transferForm.quantity}
                                            onChange={e => setTransferForm({ ...transferForm, quantity: e.target.value })}
                                        />
                                    </div>

                                    <div className="mb-3">
                                        <label className="form-label small fw-semibold text-secondary">Remarks / Internal Note</label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            placeholder="Reason for transfer"
                                            value={transferForm.remarks}
                                            onChange={e => setTransferForm({ ...transferForm, remarks: e.target.value })}
                                        />
                                    </div>
                                </div>
                                <div className="modal-footer bg-light py-2">
                                    <button type="button" className="btn btn-secondary btn-sm" onClick={() => setActiveModal(null)}>Cancel</button>
                                    <button type="submit" className="btn btn-primary btn-sm px-4" disabled={submittingAction}>
                                        {submittingAction ? "Transferring..." : "Confirm Transfer"}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL 4: ADJUST STOCK MODAL */}
            {activeModal === "adjust" && (
                <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
                    <div className="modal-dialog">
                        <div className="modal-content border-0 shadow-lg rounded-3">
                            <form onSubmit={handleAdjustSubmit}>
                                <div className="modal-header border-bottom py-3">
                                    <h5 className="modal-title fw-bold text-dark">
                                        <i className="bi bi-sliders text-warning me-2"></i>
                                        Stock Level Adjustment
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
                                        <label className="form-label small fw-semibold text-secondary">Product to Adjust</label>
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
                                                        {s.product_name} (On Hand: {s.on_hand_qty} {s.unit_symbol})
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
                                            <option value="DAMAGE">Damage / Breakage (-)</option>
                                            <option value="THEFT">Loss / Theft (-)</option>
                                            <option value="CORRECTION">System Stock Correction (+/-)</option>
                                            <option value="FOUND">Found Extra Stock (+)</option>
                                        </select>
                                    </div>

                                    <div className="mb-3">
                                        <label className="form-label small fw-semibold text-secondary">Quantity Delta (+ or -)</label>
                                        <input
                                            type="number"
                                            step="0.0001"
                                            className="form-control"
                                            required
                                            value={adjustForm.quantity_delta}
                                            onChange={e => setAdjustForm({ ...adjustForm, quantity_delta: e.target.value })}
                                        />
                                        <div className="form-text small">Use negative values to deduct (e.g. -5), positive to add (e.g. 5).</div>
                                    </div>

                                    <div className="mb-3">
                                        <label className="form-label small fw-semibold text-secondary">Reason / Explanation</label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            placeholder="Brief reason for stock change"
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

            {/* MODAL 5: STOCK COUNT RECONCILIATION */}
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
                                                        {s.product_name} (System On Hand: {s.on_hand_qty} {s.unit_symbol})
                                                    </option>
                                                ))
                                            }
                                        </select>
                                    </div>

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

            {/* STOCK DETAILS DRAWER / MODAL */}
            {selectedItem && (
                <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
                    <div className="modal-dialog modal-lg modal-dialog-scrollable">
                        <div className="modal-content border-0 shadow-lg rounded-3">
                            <div className="modal-header border-bottom py-3">
                                <div>
                                    <h5 className="modal-title fw-bold text-dark">{selectedItem.product_name}</h5>
                                    <div className="small text-muted mt-0.5">
                                        SKU: <span className="font-monospace text-dark fw-semibold">{selectedItem.sku}</span> | Category: {selectedItem.category_name}
                                    </div>
                                </div>
                                <button type="button" className="btn-close" onClick={() => setSelectedItem(null)}></button>
                            </div>
                            <div className="modal-body p-4">
                                {/* Stock Summary Header Cards */}
                                <div className="row g-2 mb-4">
                                    <div className="col-6 col-md-3">
                                        <div className="bg-light p-3 rounded-3 border text-center">
                                            <span className="text-secondary small fw-semibold text-uppercase">On Hand</span>
                                            <div className="h4 fw-bold text-dark mb-0 mt-1">
                                                {selectedItem.on_hand_qty} {selectedItem.unit_symbol}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="col-6 col-md-3">
                                        <div className="bg-light p-3 rounded-3 border text-center">
                                            <span className="text-secondary small fw-semibold text-uppercase">Reserved</span>
                                            <div className="h4 fw-bold text-warning mb-0 mt-1">
                                                {selectedItem.reserved_qty} {selectedItem.unit_symbol}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="col-6 col-md-3">
                                        <div className="bg-light p-3 rounded-3 border text-center">
                                            <span className="text-secondary small fw-semibold text-uppercase">Available</span>
                                            <div className="h4 fw-bold text-success mb-0 mt-1">
                                                {selectedItem.available_qty} {selectedItem.unit_symbol}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="col-6 col-md-3">
                                        <div className="bg-light p-3 rounded-3 border text-center">
                                            <span className="text-secondary small fw-semibold text-uppercase">Low Stock Level</span>
                                            <div className="h4 fw-bold text-danger mb-0 mt-1">
                                                {selectedItem.low_stock_warning_level} {selectedItem.unit_symbol}
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
                                                const itemToReserve = selectedItem;
                                                setSelectedItem(null);
                                                openReserveModal(itemToReserve);
                                            }}
                                        >
                                            <i className="bi bi-bookmark-plus me-1"></i> Reserve Stock
                                        </button>
                                        <button
                                            className="btn btn-sm btn-outline-warning"
                                            onClick={() => {
                                                const itemToEdit = selectedItem;
                                                setSelectedItem(null);
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
                                            <strong className="text-dark">{selectedItem.warehouse_name}</strong>
                                        </div>
                                        <div className="col-md-6">
                                            <span className="text-muted small d-block">Storage Location Code</span>
                                            <span className="badge bg-white text-dark border font-monospace ms-0">{selectedItem.storage_location_code}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Granite Slab Details */}
                                {selectedItem.is_slab && selectedItem.slabs?.length > 0 && (
                                    <div className="mb-4">
                                        <h6 className="fw-bold text-dark mb-2">Individual Slab Inventory ({selectedItem.slabs.length} Slabs)</h6>
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
                                                    {selectedItem.slabs.map(slab => (
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
                                <button type="button" className="btn btn-secondary btn-sm" onClick={() => setSelectedItem(null)}>Close</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
