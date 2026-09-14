import React, { useState, useEffect } from "react";
import inventoryApi from "../../services/inventoryApi";
import useInventoryStock from "./hooks/useInventoryStock";
import useReservations from "./hooks/useReservations";
import useInventoryMovements from "./hooks/useInventoryMovements";

import StockSummaryCards from "./StockSummaryCards";
import StockView from "./StockView";
import ReservationList from "./Reservations/ReservationList";
import ReservationForm from "./Reservations/ReservationForm";
import LowStockSettingsModal from "./LowStockSettingsModal";
import TransferForm from "./Transfers/TransferForm";
import AdjustmentForm from "./Adjustments/AdjustmentForm";
import StockCountForm from "./StockCounts/StockCountForm";
import StockHistory from "./History/StockHistory";

export default function InventoryPage() {
    const [viewMode, setViewMode] = useState("stock"); // 'stock' | 'reservations' | 'history'
    const [successMessage, setSuccessMessage] = useState(null);
    const [activeModal, setActiveModal] = useState(null); // 'reserve' | 'lowStockSettings' | 'transfer' | 'adjust' | 'count' | null
    const [submittingAction, setSubmittingAction] = useState(false);
    const [showCustomerModal, setShowCustomerModal] = useState(false);

    // Options / References Context
    const [contexts, setContexts] = useState({
        warehouses: [],
        categories: [],
        storage_locations: [],
        customers: [],
        product_variants: []
    });

    // Custom Domain Hooks
    const {
        stockItems,
        summaryCards,
        loading: stockLoading,
        error: stockError,
        setError: setStockError,
        isForbidden,
        forbiddenMessage,
        filters: stockFilters,
        setFilters: setStockFilters,
        page: stockPage,
        setPage: setStockPage,
        perPage: stockPerPage,
        loadStockData,
        selectedItem,
        setSelectedItem,
        recentActivity,
        activityLoading,
        handleOpenDetails
    } = useInventoryStock();

    const {
        reservations,
        loading: reservationsLoading,
        filter: reservationsFilter,
        setFilter: setReservationsFilter,
        pagination: reservationsPagination,
        loadReservations,
        cancelReservation,
        fulfillReservation
    } = useReservations();

    const {
        movements,
        loading: movementsLoading,
        filter: movementsFilter,
        setFilter: setMovementsFilter,
        pagination: movementsPagination,
        perPage: movementsPerPage,
        loadMovements,
        handlePerPageChange: handleMovementsPerPageChange
    } = useInventoryMovements();

    // Action Forms State
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

    const [lowStockForm, setLowStockForm] = useState({
        product_variant_id: "",
        product_name: "",
        unit_symbol: "",
        low_stock_warning_level: 0
    });

    const [transferForm, setTransferForm] = useState({
        from_warehouse_id: "",
        to_warehouse_id: "",
        product_variant_id: "",
        inventory_object_id: "",
        quantity: 1,
        destination_location_id: "",
        remarks: ""
    });

    const [adjustForm, setAdjustForm] = useState({
        warehouse_id: "",
        product_variant_id: "",
        inventory_object_id: "",
        adjustment_type: "DAMAGE",
        quantity_delta: -1,
        reason: "",
        remarks: ""
    });

    const [countForm, setCountForm] = useState({
        warehouse_id: "",
        count_type: "SPOT",
        remarks: "",
        product_variant_id: "",
        items: []
    });

    // Load Form Options (Warehouses, Categories, Locations, Customers, Products)
    const loadContexts = async () => {
        try {
            const data = await inventoryApi.getFormData();
            if (data.success) {
                setContexts({
                    warehouses: data.warehouses || [],
                    categories: data.categories || [],
                    storage_locations: data.storage_locations || [],
                    customers: data.customers || [],
                    product_variants: data.product_variants || []
                });

                if (data.warehouses?.length > 0) {
                    const firstWhId = String(data.warehouses[0].id);
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

    useEffect(() => {
        loadContexts();
    }, []);

    useEffect(() => {
        if (viewMode === "history") {
            const timer = setTimeout(() => {
                loadMovements(1, movementsPerPage);
            }, 250);
            return () => clearTimeout(timer);
        } else if (viewMode === "reservations") {
            loadReservations(1);
        }
    }, [
        viewMode,
        reservationsFilter.status,
        reservationsFilter.search,
        reservationsFilter.warehouse_id,
        movementsFilter.start_date,
        movementsFilter.end_date,
        movementsFilter.product_variant_id,
        movementsFilter.search,
        movementsFilter.warehouse_id,
        movementsFilter.storage_location_id,
        movementsFilter.movement_type
    ]);

    const handleCustomerCreated = (newCust) => {
        if (!newCust) return;
        setContexts(prev => ({
            ...prev,
            customers: [newCust, ...(prev.customers || [])]
        }));
        setReserveForm(prev => ({
            ...prev,
            customer_id: newCust.id || newCust.data?.id || ""
        }));
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
        setStockError(null);
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

            const data = await inventoryApi.reserveStock(payload);

            if (data.success) {
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
            const data = await inventoryApi.updateLowStockSettings(
                lowStockForm.product_variant_id,
                parseFloat(lowStockForm.low_stock_warning_level)
            );

            if (data.success) {
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

    // Cancel Reservation wrapper
    const handleCancelReservationClick = async (id) => {
        const result = await cancelReservation(id);
        if (result.success) {
            setSuccessMessage("Reservation cancelled and stock released.");
            loadStockData();
            setTimeout(() => setSuccessMessage(null), 4000);
        } else if (result.error) {
            alert(result.error);
        }
    };

    // Fulfill Reservation wrapper
    const handleFulfillReservationClick = async (reservation) => {
        const remaining = reservation.remaining_quantity !== undefined ? reservation.remaining_quantity : reservation.quantity;
        const unitSym = reservation.product?.base_unit?.symbol || reservation.product?.sales_unit?.symbol || 'Units';

        const inputQty = prompt(
            `Fulfill / Dispatch Reservation (${reservation.reservation_number || '#' + reservation.id}):\n\nTotal Reserved: ${reservation.quantity} ${unitSym}\nAlready Fulfilled: ${reservation.fulfilled_quantity || 0} ${unitSym}\nRemaining: ${remaining} ${unitSym}\n\nEnter quantity to fulfill now:`,
            remaining
        );

        if (inputQty === null) return;
        const qtyVal = parseFloat(inputQty);
        if (isNaN(qtyVal) || qtyVal <= 0) {
            alert("Please enter a valid positive quantity.");
            return;
        }

        const result = await fulfillReservation(reservation.id, qtyVal);
        if (result.success) {
            setSuccessMessage(result.data?.message || "Reservation fulfilled successfully.");
            loadStockData();
            setTimeout(() => setSuccessMessage(null), 4000);
        } else if (result.error) {
            alert(result.error);
        }
    };

    // Submit Transfer
    const handleTransferSubmit = async (e) => {
        e.preventDefault();
        setSubmittingAction(true);
        setStockError(null);
        try {
            const itemPayload = transferForm.inventory_object_id
                ? { inventory_object_id: parseInt(transferForm.inventory_object_id), quantity: parseFloat(transferForm.quantity) }
                : { product_variant_id: parseInt(transferForm.product_variant_id), quantity: parseFloat(transferForm.quantity) };

            if (!itemPayload.inventory_object_id && !itemPayload.product_variant_id) {
                alert("Please select a product or item to transfer.");
                setSubmittingAction(false);
                return;
            }

            const payload = {
                from_warehouse_id: parseInt(transferForm.from_warehouse_id),
                to_warehouse_id: parseInt(transferForm.to_warehouse_id),
                items: [itemPayload],
                remarks: transferForm.remarks
            };

            const data = await inventoryApi.initiateTransfer(payload);

            if (data.success) {
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
        setStockError(null);
        try {
            const itemPayload = adjustForm.inventory_object_id
                ? { inventory_object_id: parseInt(adjustForm.inventory_object_id), quantity_delta: parseFloat(adjustForm.quantity_delta), area_delta: 0 }
                : { product_variant_id: parseInt(adjustForm.product_variant_id), quantity_delta: parseFloat(adjustForm.quantity_delta), area_delta: 0 };

            if (!itemPayload.inventory_object_id && !itemPayload.product_variant_id) {
                alert("Please select a product or item to adjust.");
                setSubmittingAction(false);
                return;
            }

            const payload = {
                warehouse_id: parseInt(adjustForm.warehouse_id),
                adjustment_type: adjustForm.adjustment_type,
                reason: adjustForm.reason || "Manual stock adjustment",
                items: [itemPayload]
            };

            const data = await inventoryApi.createAdjustment(payload);

            if (data.success) {
                const adjId = data.data?.id;
                if (adjId) {
                    await inventoryApi.approveAdjustment(adjId);
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
        setStockError(null);
        try {
            const payload = {
                warehouse_id: parseInt(countForm.warehouse_id),
                count_type: countForm.count_type,
                remarks: countForm.remarks || "Physical stock count reconciliation"
            };

            const data = await inventoryApi.createStockCount(payload);

            if (data.success) {
                const countId = data.data?.id;
                if (countId && countForm.product_variant_id) {
                    await inventoryApi.approveStockCount(countId);
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

    // Calculations for Reserve Modal
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
            {stockError && (
                <div className="alert alert-danger alert-dismissible fade show border-0 shadow-sm rounded-3 mb-3" role="alert">
                    <i className="bi bi-exclamation-triangle-fill me-2"></i>
                    {stockError}
                    <button type="button" className="btn-close" onClick={() => setStockError(null)}></button>
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
                        disabled={stockLoading || reservationsLoading || movementsLoading}
                    >
                        <i className={`bi bi-arrow-clockwise ${(stockLoading || reservationsLoading || movementsLoading) ? "spin" : ""}`}></i>
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
            <StockSummaryCards summaryCards={summaryCards} />

            {/* TAB 1: STOCK VIEW */}
            {viewMode === "stock" && (
                <StockView
                    filters={stockFilters}
                    setFilters={setStockFilters}
                    contexts={contexts}
                    stockItems={stockItems}
                    loading={stockLoading}
                    stockPage={stockPage}
                    stockPerPage={stockPerPage}
                    setStockPage={setStockPage}
                    openReserveModal={openReserveModal}
                    openLowStockModal={openLowStockModal}
                    selectedItem={selectedItem}
                    setSelectedItem={setSelectedItem}
                    recentActivity={recentActivity}
                    activityLoading={activityLoading}
                    handleOpenDetails={handleOpenDetails}
                />
            )}

            {/* TAB 2: RESERVATIONS LIST VIEW */}
            {viewMode === "reservations" && (
                <ReservationList
                    reservations={reservations}
                    loading={reservationsLoading}
                    pagination={reservationsPagination}
                    filter={reservationsFilter}
                    setFilter={setReservationsFilter}
                    onPageChange={(p) => loadReservations(p)}
                    onCancel={handleCancelReservationClick}
                    onFulfill={handleFulfillReservationClick}
                    contexts={contexts}
                />
            )}

            {/* TAB 3: STOCK HISTORY VIEW */}
            {viewMode === "history" && (
                <StockHistory
                    movements={movements}
                    loading={movementsLoading}
                    pagination={movementsPagination}
                    perPage={movementsPerPage}
                    filter={movementsFilter}
                    setFilter={setMovementsFilter}
                    onPageChange={(p) => loadMovements(p, movementsPerPage)}
                    onPerPageChange={handleMovementsPerPageChange}
                    contexts={contexts}
                />
            )}

            {/* Action Modals */}
            <ReservationForm
                show={activeModal === "reserve"}
                onClose={() => setActiveModal(null)}
                onSubmit={handleReserveSubmit}
                submitting={submittingAction}
                contexts={contexts}
                reserveForm={reserveForm}
                setReserveForm={setReserveForm}
                selectedReserveProduct={selectedReserveProduct}
                matchingStockEntry={matchingStockEntry}
                currentOnHand={currentOnHand}
                currentReserved={currentReserved}
                currentAvailable={currentAvailable}
                selectedUnitSymbol={selectedUnitSymbol}
                isExceedingAvailable={isExceedingAvailable}
                showCustomerModal={showCustomerModal}
                setShowCustomerModal={setShowCustomerModal}
                handleCustomerCreated={handleCustomerCreated}
            />

            <LowStockSettingsModal
                show={activeModal === "lowStockSettings"}
                onClose={() => setActiveModal(null)}
                onSubmit={handleLowStockSubmit}
                submitting={submittingAction}
                lowStockForm={lowStockForm}
                setLowStockForm={setLowStockForm}
            />

            <TransferForm
                show={activeModal === "transfer"}
                onClose={() => setActiveModal(null)}
                onSubmit={handleTransferSubmit}
                submitting={submittingAction}
                contexts={contexts}
                stockItems={stockItems}
                transferForm={transferForm}
                setTransferForm={setTransferForm}
            />

            <AdjustmentForm
                show={activeModal === "adjust"}
                onClose={() => setActiveModal(null)}
                onSubmit={handleAdjustSubmit}
                submitting={submittingAction}
                contexts={contexts}
                stockItems={stockItems}
                adjustForm={adjustForm}
                setAdjustForm={setAdjustForm}
            />

            <StockCountForm
                show={activeModal === "count"}
                onClose={() => setActiveModal(null)}
                onSubmit={handleCountSubmit}
                submitting={submittingAction}
                contexts={contexts}
                stockItems={stockItems}
                countForm={countForm}
                setCountForm={setCountForm}
            />
        </div>
    );
}
