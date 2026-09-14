import axios from 'axios';

const getAuthHeaders = () => {
    const token = localStorage.getItem('auth_token');
    return token ? { Authorization: `Bearer ${token}` } : {};
};

export const inventoryApi = {
    fetchStockData: async (params = {}) => {
        const response = await axios.get('/api/inventory', {
            headers: getAuthHeaders(),
            params
        });
        return response.data;
    },

    fetchFormData: async () => {
        const response = await axios.get('/api/inventory/form-data', {
            headers: getAuthHeaders()
        });
        return response.data;
    },

    getFormData: async () => {
        const response = await axios.get('/api/inventory/form-data', {
            headers: getAuthHeaders()
        });
        return response.data;
    },

    fetchReservations: async (params = {}) => {
        const response = await axios.get('/api/inventory/reservations', {
            headers: getAuthHeaders(),
            params
        });
        return response.data;
    },

    fetchMovements: async (params = {}) => {
        const response = await axios.get('/api/inventory/movements', {
            headers: getAuthHeaders(),
            params
        });
        return response.data;
    },

    reserveStock: async (payload) => {
        const response = await axios.post('/api/inventory/reserve', payload, {
            headers: getAuthHeaders()
        });
        return response.data;
    },

    fulfillReservation: async (reservationId, quantity) => {
        const response = await axios.post(`/api/inventory/reservations/${reservationId}/fulfill`, { quantity }, {
            headers: getAuthHeaders()
        });
        return response.data;
    },

    cancelReservation: async (reservationId) => {
        const response = await axios.post(`/api/inventory/reservations/${reservationId}/cancel`, {}, {
            headers: getAuthHeaders()
        });
        return response.data;
    },

    initiateTransfer: async (payload) => {
        const response = await axios.post('/api/inventory/transfers', payload, {
            headers: getAuthHeaders()
        });
        return response.data;
    },

    createAdjustment: async (payload) => {
        const response = await axios.post('/api/inventory/adjustments', payload, {
            headers: getAuthHeaders()
        });
        return response.data;
    },

    approveAdjustment: async (adjId) => {
        const response = await axios.post(`/api/inventory/adjustments/${adjId}/approve`, {}, {
            headers: getAuthHeaders()
        });
        return response.data;
    },

    createStockCount: async (payload) => {
        const response = await axios.post('/api/inventory/counts', payload, {
            headers: getAuthHeaders()
        });
        return response.data;
    },

    approveStockCount: async (countId) => {
        const response = await axios.post(`/api/inventory/counts/${countId}/approve`, {}, {
            headers: getAuthHeaders()
        });
        return response.data;
    },

    updateLowStockSettings: async (variantId, warningLevel) => {
        const response = await axios.put(`/api/product/variants/${variantId}/low-stock-settings`, {
            low_stock_warning_level: warningLevel
        }, {
            headers: getAuthHeaders()
        });
        return response.data;
    }
};

export default inventoryApi;
