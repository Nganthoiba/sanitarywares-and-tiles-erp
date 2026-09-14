import axios from 'axios';

const getAuthHeaders = () => {
    const token = localStorage.getItem('auth_token');
    return { Authorization: `Bearer ${token}` };
};

export const productApi = {
    fetchFormData: async () => {
        const response = await axios.get('/api/product/form-data', {
            headers: getAuthHeaders()
        });
        return response.data;
    },

    fetchProducts: async (params = {}) => {
        const response = await axios.get('/api/product/variants', {
            headers: getAuthHeaders(),
            params
        });
        return response.data;
    },

    fetchProductDetail: async (productId) => {
        const response = await axios.get(`/api/product/variants/${productId}`, {
            headers: getAuthHeaders()
        });
        return response.data;
    },

    fetchConversions: async (productId) => {
        const response = await axios.get(`/api/product/variants/${productId}/conversions`, {
            headers: getAuthHeaders()
        });
        return response.data;
    },

    addConversion: async (productId, payload) => {
        const response = await axios.post(`/api/product/variants/${productId}/conversions`, payload, {
            headers: getAuthHeaders()
        });
        return response.data;
    },

    deleteConversion: async (convId) => {
        const response = await axios.delete(`/api/product/conversions/${convId}`, {
            headers: getAuthHeaders()
        });
        return response.data;
    },

    fetchInventorySummary: async (productId) => {
        const response = await axios.get(`/api/product/variants/${productId}/inventory-summary`, {
            headers: getAuthHeaders()
        });
        return response.data;
    },

    saveProduct: async (productForm, isEdit = false) => {
        if (isEdit && productForm.id) {
            const response = await axios.put(`/api/product/variants/${productForm.id}`, productForm, {
                headers: getAuthHeaders()
            });
            return response.data;
        } else {
            const response = await axios.post('/api/product/variants', productForm, {
                headers: getAuthHeaders()
            });
            return response.data;
        }
    },

    updateProductStatus: async (product) => {
        const mappedAttrs = product.attribute_values?.map(av => ({
            attribute_id: av.product_attribute_id,
            value: av.value
        })) || [];

        const payload = {
            name: product.name,
            sku: product.sku,
            gtin: product.gtin,
            barcode: product.barcode,
            tax_profile_id: product.tax_profile_id,
            brand_id: product.brand_id,
            manufacturer_id: product.manufacturer_id,
            purchase_unit_id: product.purchase_unit_id,
            sales_unit_id: product.sales_unit_id,
            base_unit_id: product.base_unit_id,
            inventory_behavior: product.inventory_behavior,
            is_active: !product.is_active,
            attributes: mappedAttrs
        };

        const response = await axios.put(`/api/product/variants/${product.id}`, payload, {
            headers: getAuthHeaders()
        });
        return response.data;
    },

    createBrand: async (brandForm) => {
        const response = await axios.post('/api/brands-crud', brandForm, {
            headers: getAuthHeaders()
        });
        return response.data;
    },

    createManufacturer: async (manufacturerForm) => {
        const payload = {
            legal_name: manufacturerForm.legal_name || manufacturerForm.name,
            trade_name: manufacturerForm.trade_name || undefined,
            gstin: manufacturerForm.gstin || undefined,
            phone: manufacturerForm.phone || undefined,
            email: manufacturerForm.email || undefined,
            website: manufacturerForm.website || undefined,
            address: manufacturerForm.address || undefined
        };
        const response = await axios.post('/api/manufacturers-crud', payload, {
            headers: getAuthHeaders()
        });
        return response.data;
    },

    createAttribute: async (attributeForm) => {
        const payload = {
            name: attributeForm.name,
            type: attributeForm.type,
            unit_id: attributeForm.unit_id ? parseInt(attributeForm.unit_id, 10) : null
        };
        const response = await axios.post('/api/product/attributes', payload, {
            headers: getAuthHeaders()
        });
        return response.data;
    },

    deleteProductAttribute: async (productId, attributeId) => {
        const response = await axios.delete(`/api/product/variants/${productId}/attributes/${attributeId}`, {
            headers: getAuthHeaders()
        });
        return response.data;
    }
};
