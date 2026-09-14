import React from "react";
import StockFilters from "./StockFilters";
import StockTable from "./StockTable";
import StockDetailsDrawer from "./StockDetailsDrawer";

export default function StockView({
    filters,
    setFilters,
    contexts,
    stockItems,
    loading,
    stockPage,
    stockPerPage,
    setStockPage,
    openReserveModal,
    openLowStockModal,
    selectedItem,
    setSelectedItem,
    recentActivity,
    activityLoading,
    handleOpenDetails
}) {
    return (
        <>
            <StockFilters
                filters={filters}
                setFilters={setFilters}
                contexts={contexts}
            />

            <StockTable
                stockItems={stockItems}
                loading={loading}
                stockPage={stockPage}
                stockPerPage={stockPerPage}
                setStockPage={setStockPage}
                openReserveModal={openReserveModal}
                openLowStockModal={openLowStockModal}
                handleOpenDetails={handleOpenDetails}
            />

            <StockDetailsDrawer
                item={selectedItem}
                onClose={() => setSelectedItem(null)}
                recentActivity={recentActivity}
                activityLoading={activityLoading}
                openReserveModal={openReserveModal}
                openLowStockModal={openLowStockModal}
            />
        </>
    );
}
