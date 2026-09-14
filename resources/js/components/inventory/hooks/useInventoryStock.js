import { useState, useCallback, useEffect } from 'react';
import inventoryApi from '../../../services/inventoryApi';

export function useInventoryStock() {
    const [stockItems, setStockItems] = useState([]);
    const [summaryCards, setSummaryCards] = useState({
        total_stock: 0,
        total_on_hand_qty: 0,
        available_stock: 0,
        reserved_stock: 0,
        low_stock_count: 0
    });

    const [filters, setFilters] = useState({
        warehouse_id: '',
        category_id: '',
        status: 'ALL',
        search: ''
    });

    const [stockPage, setStockPage] = useState(1);
    const [stockPerPage, setStockPerPage] = useState(15);

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [isForbidden, setIsForbidden] = useState(false);
    const [forbiddenMessage, setForbiddenMessage] = useState('');

    const [selectedItem, setSelectedItem] = useState(null);
    const [recentActivity, setRecentActivity] = useState([]);
    const [activityLoading, setActivityLoading] = useState(false);

    const loadStockData = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const params = {};
            if (filters.warehouse_id) params.warehouse_id = filters.warehouse_id;
            if (filters.category_id) params.category_id = filters.category_id;
            if (filters.status !== 'ALL') params.status = filters.status;
            if (filters.search) params.search = filters.search;

            const res = await inventoryApi.fetchStockData(params);

            if (res.success) {
                setStockItems(res.data || []);
                if (res.summary_cards) {
                    setSummaryCards(res.summary_cards);
                }
            }
        } catch (err) {
            if (err.response && err.response.data) {
                const msg = err.response.data.message || 'Failed to fetch inventory stock records.';
                setError(msg);
                if (err.response.status === 403 || err.response.status === 401) {
                    setIsForbidden(true);
                    setForbiddenMessage(msg);
                }
            } else {
                setError('Failed to fetch inventory stock records.');
            }
        } finally {
            setLoading(false);
        }
    }, [filters]);

    useEffect(() => {
        setStockPage(1);
        loadStockData();
    }, [filters.warehouse_id, filters.category_id, filters.status, filters.search, loadStockData]);

    const handleOpenDetails = async (item) => {
        setSelectedItem(item);
        setActivityLoading(true);
        try {
            const res = await inventoryApi.fetchMovements({
                product_variant_id: item.product_variant_id,
                per_page: 10
            });
            if (res.success) {
                setRecentActivity(res.data || []);
            }
        } catch (err) {
            setRecentActivity([]);
        } finally {
            setActivityLoading(false);
        }
    };

    return {
        stockItems,
        summaryCards,
        loading,
        error,
        setError,
        isForbidden,
        forbiddenMessage,
        filters,
        setFilters,
        page: stockPage,
        setPage: setStockPage,
        perPage: stockPerPage,
        setPerPage: setStockPerPage,
        loadStockData,
        selectedItem,
        setSelectedItem,
        recentActivity,
        activityLoading,
        handleOpenDetails
    };
}

export default useInventoryStock;
