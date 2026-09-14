import { useState, useCallback } from 'react';
import inventoryApi from '../../../services/inventoryApi';

export function useInventoryMovements() {
    const [movements, setMovements] = useState([]);
    const [loading, setLoading] = useState(false);
    const [perPage, setPerPage] = useState(10);
    const [pagination, setPagination] = useState({
        current_page: 1,
        last_page: 1,
        total: 0
    });
    const [filter, setFilter] = useState({
        start_date: '',
        end_date: '',
        product_variant_id: '',
        search: '',
        warehouse_id: '',
        storage_location_id: '',
        movement_type: ''
    });

    const loadMovements = useCallback(async (page = 1, currentPerPage = perPage) => {
        setLoading(true);
        try {
            const params = { page, per_page: currentPerPage };
            if (filter.start_date) params.start_date = filter.start_date;
            if (filter.end_date) params.end_date = filter.end_date;
            if (filter.product_variant_id) params.product_variant_id = filter.product_variant_id;
            if (filter.search) params.search = filter.search;
            if (filter.warehouse_id) params.warehouse_id = filter.warehouse_id;
            if (filter.storage_location_id) params.storage_location_id = filter.storage_location_id;
            if (filter.movement_type) params.movement_type = filter.movement_type;

            const res = await inventoryApi.fetchMovements(params);
            if (res.success) {
                setMovements(res.data || []);
                if (res.pagination) {
                    setPagination(res.pagination);
                }
            }
        } catch (err) {
            console.error('Failed to fetch stock movements ledger', err);
        } finally {
            setLoading(false);
        }
    }, [filter, perPage]);

    const handlePerPageChange = (newPerPage) => {
        setPerPage(newPerPage);
        loadMovements(1, newPerPage);
    };

    return {
        movements,
        loading,
        perPage,
        setPerPage,
        pagination,
        filter,
        setFilter,
        loadMovements,
        handlePerPageChange
    };
}

export default useInventoryMovements;
