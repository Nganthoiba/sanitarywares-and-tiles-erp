# Inventory Manager Monolith Decomposition Plan

`InventoryManager.jsx` is currently a ~2,330-line monolithic React component handling stock views, summary cards, reservations, movements history, stock transfers, adjustments, stock count audits, slab detail drawers, low-stock threshold settings, inline API requests, and state management.

This plan details decomposing `InventoryManager.jsx` into a modular architecture under `resources/js/components/Inventory/`, creating a dedicated API service layer, extracting domain hooks, and separating UI views and modals while maintaining full backward compatibility.

## Proposed Component Architecture

```
resources/js/
├── services/
│   └── inventoryApi.js                 [NEW] Dedicated API service for inventory HTTP requests
└── components/
    ├── Inventory/                      [NEW] Domain directory for Inventory management
    │   ├── InventoryPage.jsx           [NEW] Master container page handling view tabs, header actions, and alerts
    │   ├── StockView.jsx               [NEW] Container for Stock View tab (Summary cards, filters, and table)
    │   ├── StockTable.jsx              [NEW] Stock items table with slab indicators, badges, and action buttons
    │   ├── StockFilters.jsx            [NEW] Stock search bar, warehouse, category, and status dropdowns
    │   ├── StockSummaryCards.jsx       [NEW] Metric summary cards (Total Stock, Available, Reserved, Low Stock Alert)
    │   ├── StockDetailsDrawer.jsx      [NEW] Item details side drawer showing slab breakdowns and recent activity
    │   ├── LowStockSettingsModal.jsx   [NEW] Modal dialog for configuring low-stock warning thresholds
    │   ├── Reservations/               [NEW] Sub-domain directory for Inventory Reservations
    │   │   ├── ReservationList.jsx     [NEW] Reservations list table and status filter controls
    │   │   ├── ReservationForm.jsx     [NEW] Reserve Stock modal form dialog with quick-add customer trigger
    │   │   └── ReservationDetails.jsx  [NEW] Reservation details and action handlers (Fulfill, Cancel)
    │   ├── Transfers/                  [NEW] Sub-domain directory for Warehouse Transfers
    │   │   └── TransferForm.jsx        [NEW] Stock transfer modal form dialog
    │   ├── Adjustments/                [NEW] Sub-domain directory for Inventory Adjustments
    │   │   └── AdjustmentForm.jsx      [NEW] Stock adjustment / damage entry modal form dialog
    │   ├── StockCounts/                [NEW] Sub-domain directory for Physical Stock Audit Counts
    │   │   └── StockCountForm.jsx      [NEW] Physical stock count audit modal form dialog
    │   ├── History/                    [NEW] Sub-domain directory for Stock Movement History
    │   │   └── StockHistory.jsx        [NEW] Stock movements audit log view with filters & pagination
    │   └── hooks/                      [NEW] Custom hooks encapsulating domain state & side effects
    │       ├── useInventoryStock.js    [NEW] Manages stock items, summary metrics, filtering, and contexts
    │       ├── useReservations.js      [NEW] Manages reservation list, filtering, creation, fulfillment, cancellation
    │       └── useInventoryMovements.js[NEW] Manages movements ledger, date & type filters, and pagination
    └── inventory/
        └── InventoryManager.jsx        [MODIFY] Delegates directly to InventoryPage for 100% backward compatibility
```

---

## User Review Required

> [!NOTE]
> The refactor maintains 100% backward compatibility for `InventoryManager.jsx` in `app.jsx` (`/inventory` route). No breaking changes to existing routes or backend API endpoints will be introduced.

---

## Proposed Changes

### Service Layer

#### [NEW] [inventoryApi.js](file:///home/ecourt/my_projects/sanitarywares-and-tiles-erp/resources/js/services/inventoryApi.js)
- Encapsulates all `axios` HTTP calls to `/api/inventory/*`.
- Helper methods: `fetchStockData`, `fetchFormData`, `fetchReservations`, `fetchMovements`, `createReservation`, `fulfillReservation`, `cancelReservation`, `createTransfer`, `createAdjustment`, `createStockCount`, `updateLowStockThreshold`.

---

### Custom Hooks (`resources/js/components/Inventory/hooks/`)

#### [NEW] [useInventoryStock.js](file:///home/ecourt/my_projects/sanitarywares-and-tiles-erp/resources/js/components/Inventory/hooks/useInventoryStock.js)
- Manages state for `stockItems`, `summaryCards`, `contexts` (warehouses, categories, locations, customers, product variants), `filters`, `stockPage`, `stockPerPage`.
- Handles `loadStockData`, `loadContexts`, and stock filtering.

#### [NEW] [useReservations.js](file:///home/ecourt/my_projects/sanitarywares-and-tiles-erp/resources/js/components/Inventory/hooks/useReservations.js)
- Manages state for `reservations`, `reservationsLoading`, `reservationsFilter`, `reservationsPagination`, `reserveForm`.
- Handles `loadReservations`, `handleReserveSubmit`, `handleFulfillReservation`, `handleCancelReservation`.

#### [NEW] [useInventoryMovements.js](file:///home/ecourt/my_projects/sanitarywares-and-tiles-erp/resources/js/components/Inventory/hooks/useInventoryMovements.js)
- Manages state for `movements`, `movementsLoading`, `movementsFilter`, `movementsPagination`, `movementsPerPage`.
- Handles `loadMovements`, `handleMovementsPerPageChange`, and movement filtering.

---

### UI Views & Components (`resources/js/components/Inventory/`)

#### [NEW] [InventoryPage.jsx](file:///home/ecourt/my_projects/sanitarywares-and-tiles-erp/resources/js/components/Inventory/InventoryPage.jsx)
- Master page container managing current active view mode (`stock`, `reservations`, `history`), modal states (`reserve`, `lowStockSettings`, `transfer`, `adjust`, `count`), global alerts, and header action buttons.

#### [NEW] [StockView.jsx](file:///home/ecourt/my_projects/sanitarywares-and-tiles-erp/resources/js/components/Inventory/StockView.jsx)
- Combines summary cards, filters, stock items table, and client-side pagination.

#### [NEW] [StockSummaryCards.jsx](file:///home/ecourt/my_projects/sanitarywares-and-tiles-erp/resources/js/components/Inventory/StockSummaryCards.jsx)
- Metric summary cards rendering Total Stock On Hand, Available Stock, Reserved Stock, and Low Stock Warning count.

#### [NEW] [StockFilters.jsx](file:///home/ecourt/my_projects/sanitarywares-and-tiles-erp/resources/js/components/Inventory/StockFilters.jsx)
- Filter dropdowns (Warehouse, Category, Status) and search keyword input.

#### [NEW] [StockTable.jsx](file:///home/ecourt/my_projects/sanitarywares-and-tiles-erp/resources/js/components/Inventory/StockTable.jsx)
- Stock items table rendering SKU, category badges, warehouse/location details, stock levels (On Hand, Available, Reserved), low-stock warning indicators, and action buttons.

#### [NEW] [StockDetailsDrawer.jsx](file:///home/ecourt/my_projects/sanitarywares-and-tiles-erp/resources/js/components/Inventory/StockDetailsDrawer.jsx)
- Offcanvas side drawer displaying product details, slab breakdown table (for measured materials), and recent movement history log.

#### [NEW] [LowStockSettingsModal.jsx](file:///home/ecourt/my_projects/sanitarywares-and-tiles-erp/resources/js/components/Inventory/LowStockSettingsModal.jsx)
- Modal form dialog to configure product variant low stock threshold.

---

### Sub-Domain Views & Modals

#### [NEW] [Reservations/ReservationList.jsx](file:///home/ecourt/my_projects/sanitarywares-and-tiles-erp/resources/js/components/Inventory/Reservations/ReservationList.jsx)
- Reservation list table with status badges (`ACTIVE`, `PARTIALLY_FULFILLED`, `FULFILLED`, `CANCELLED`, `EXPIRED`), customer details, reservation date, expiry badge, and action buttons.

#### [NEW] [Reservations/ReservationForm.jsx](file:///home/ecourt/my_projects/sanitarywares-and-tiles-erp/resources/js/components/Inventory/Reservations/ReservationForm.jsx)
- Modal form dialog to create stock reservations with product variant, warehouse, customer selection (including Quick Add Customer `+` button), quantity, and expiry dates.

#### [NEW] [Transfers/TransferForm.jsx](file:///home/ecourt/my_projects/sanitarywares-and-tiles-erp/resources/js/components/Inventory/Transfers/TransferForm.jsx)
- Modal form dialog to transfer stock between warehouses and storage locations.

#### [NEW] [Adjustments/AdjustmentForm.jsx](file:///home/ecourt/my_projects/sanitarywares-and-tiles-erp/resources/js/components/Inventory/Adjustments/AdjustmentForm.jsx)
- Modal form dialog to submit stock adjustments (damage, audit correction, expiry).

#### [NEW] [StockCounts/StockCountForm.jsx](file:///home/ecourt/my_projects/sanitarywares-and-tiles-erp/resources/js/components/Inventory/StockCounts/StockCountForm.jsx)
- Modal form dialog to conduct physical stock count audits.

#### [NEW] [History/StockHistory.jsx](file:///home/ecourt/my_projects/sanitarywares-and-tiles-erp/resources/js/components/Inventory/History/StockHistory.jsx)
- Stock audit movement history view with search, date range filters, movement type dropdown, top per-page selector bar, formatted reference labels, and datatable pagination.

---

### Entrypoint Delegation

#### [MODIFY] [InventoryManager.jsx](file:///home/ecourt/my_projects/sanitarywares-and-tiles-erp/resources/js/components/inventory/InventoryManager.jsx)
- Refactored to delegate directly to `InventoryPage.jsx`.

---

## Verification Plan

### Automated Tests & Asset Compilation
1. Run Vite build to verify compilation of all new modules:
   `npm run build`
2. Run PHPUnit test suite:
   `./vendor/bin/phpunit tests/Feature/InventoryReservationAndLowStockTest.php tests/Feature/ReservationLifecycleTest.php tests/Feature/SalesDirectBillingTest.php tests/Feature/UnitDimensionServiceTest.php`

### Manual Verification
1. Open `/inventory` in browser and test Stock View tab (filters, search, summary cards, item drawer).
2. Test Reservations tab (filtering, creating reservation, quick-add customer, fulfilling, cancelling).
3. Test Stock History tab (search, date filter, per-page selector, reference label rendering, pagination).
4. Test Action modals: Reserve Stock, Stock Transfer, Stock Adjustment, Stock Count, Low Stock Settings.
