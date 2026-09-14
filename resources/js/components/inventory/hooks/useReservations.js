import { useState, useCallback } from 'react';
import inventoryApi from '../../../services/inventoryApi';

export function useReservations() {
    const [reservations, setReservations] = useState([]);
    const [loading, setLoading] = useState(false);
    const [filter, setFilter] = useState({
        status: 'ALL',
        search: '',
        warehouse_id: ''
    });
    const [pagination, setPagination] = useState({
        current_page: 1,
        last_page: 1,
        total: 0
    });

    const loadReservations = useCallback(async (page = 1) => {
        setLoading(true);
        try {
            const params = { page, per_page: 15 };
            if (filter.status !== 'ALL') params.status = filter.status;
            if (filter.search) params.search = filter.search;
            if (filter.warehouse_id) params.warehouse_id = filter.warehouse_id;

            const res = await inventoryApi.fetchReservations(params);

            if (res.success) {
                setReservations(res.data || []);
                if (res.pagination) {
                    setPagination(res.pagination);
                }
            }
        } catch (err) {
            console.error('Failed to fetch reservations list', err);
        } finally {
            setLoading(false);
        }
    }, [filter]);

    const cancelReservation = async (reservationId) => {
        if (!confirm('Are you sure you want to cancel this reservation? The reserved quantity will be released back to available stock.')) {
            return { success: false };
        }
        try {
            const res = await inventoryApi.cancelReservation(reservationId);
            if (res.success) {
                loadReservations(pagination.current_page);
                return { success: true, data: res };
            }
            return { success: false, error: res.message };
        } catch (err) {
            return { success: false, error: err.response?.data?.message || 'Failed to cancel reservation.' };
        }
    };

    const fulfillReservation = async (reservationId, quantity) => {
        try {
            const res = await inventoryApi.fulfillReservation(reservationId, quantity);
            if (res.success) {
                loadReservations(pagination.current_page);
                return { success: true, data: res };
            }
            return { success: false, error: res.message };
        } catch (err) {
            return { success: false, error: err.response?.data?.message || 'Failed to fulfill reservation.' };
        }
    };

    return {
        reservations,
        loading,
        filter,
        setFilter,
        pagination,
        loadReservations,
        cancelReservation,
        fulfillReservation
    };
}

export default useReservations;
