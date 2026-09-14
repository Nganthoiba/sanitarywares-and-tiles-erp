import { useState, useCallback } from 'react';
import { productApi } from '../../../services/productApi';

export function useProductDetails(setError, setSuccess) {
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [selectedProductForEdit, setSelectedProductForEdit] = useState(null);
    const [detailLoading, setDetailLoading] = useState(false);

    const [conversionForm, setConversionForm] = useState({
        from_unit_id: '',
        to_unit_id: '',
        multiplier: ''
    });
    const [conversions, setConversions] = useState([]);
    const [inventorySummary, setInventorySummary] = useState(null);

    const loadConversions = useCallback(async (productId) => {
        try {
            const data = await productApi.fetchConversions(productId);
            setConversions(data || []);
        } catch (err) {
            console.error('Failed to load conversions', err);
        }
    }, []);

    const loadInventorySummary = useCallback(async (productId) => {
        try {
            const data = await productApi.fetchInventorySummary(productId);
            setInventorySummary(data);
        } catch (err) {
            console.error('Failed to load inventory summary', err);
        }
    }, []);

    const viewProductDetail = useCallback(async (productId, units = [], setViewCallback) => {
        if (setError) setError(null);
        setDetailLoading(true);
        if (setViewCallback) setViewCallback('detail');
        try {
            const data = await productApi.fetchProductDetail(productId);
            setSelectedProduct(data);

            if (units.length > 0) {
                setConversionForm({
                    from_unit_id: '',
                    to_unit_id: data.base_unit_id?.toString() || units[0].id.toString(),
                    multiplier: ''
                });
            }

            loadConversions(productId);
            loadInventorySummary(productId);
        } catch (err) {
            if (setError) setError('Failed to load product specifications details.');
        } finally {
            setDetailLoading(false);
        }
    }, [setError, loadConversions, loadInventorySummary]);

    const setupEditProduct = useCallback(async (productId, setViewCallback, setLoadingCallback) => {
        if (setError) setError(null);
        if (setLoadingCallback) setLoadingCallback(true);
        try {
            const data = await productApi.fetchProductDetail(productId);
            setSelectedProductForEdit(data);
            if (setViewCallback) setViewCallback('edit');
        } catch (err) {
            if (setError) setError('Failed to fetch product data for editing.');
        } finally {
            if (setLoadingCallback) setLoadingCallback(false);
        }
    }, [setError]);

    const handleAddConversion = async (e) => {
        e.preventDefault();
        if (setError) setError(null);
        if (setSuccess) setSuccess(null);
        try {
            const payload = {
                from_unit_id: parseInt(conversionForm.from_unit_id),
                to_unit_id: parseInt(conversionForm.to_unit_id),
                multiplier: parseFloat(conversionForm.multiplier)
            };
            const data = await productApi.addConversion(selectedProduct.id, payload);
            if (data.success) {
                if (setSuccess) setSuccess('Unit conversion mapping created successfully!');
                setConversionForm(prev => ({ ...prev, from_unit_id: '', multiplier: '' }));
                loadConversions(selectedProduct.id);
            }
        } catch (err) {
            if (setError) setError(err.response?.data?.message || 'Failed to define unit conversion.');
        }
    };

    const handleDeleteConversion = async (convId) => {
        if (!confirm('Are you sure you want to remove this unit conversion profile?')) return;
        if (setError) setError(null);
        if (setSuccess) setSuccess(null);
        try {
            const data = await productApi.deleteConversion(convId);
            if (data.success) {
                if (setSuccess) setSuccess('Unit conversion deleted.');
                loadConversions(selectedProduct.id);
            }
        } catch (err) {
            if (setError) setError('Failed to delete unit conversion.');
        }
    };

    return {
        selectedProduct,
        setSelectedProduct,
        selectedProductForEdit,
        setSelectedProductForEdit,
        detailLoading,
        conversionForm,
        setConversionForm,
        conversions,
        inventorySummary,
        viewProductDetail,
        setupEditProduct,
        handleAddConversion,
        handleDeleteConversion,
        loadConversions,
        loadInventorySummary
    };
}
