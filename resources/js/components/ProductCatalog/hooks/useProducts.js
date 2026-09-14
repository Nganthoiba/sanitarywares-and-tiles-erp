import { useState, useEffect, useCallback } from 'react';
import { productApi } from '../../../services/productApi';

export function useProducts(view, initialSubTab = 'list') {
    const [categories, setCategories] = useState([]);
    const [brands, setBrands] = useState([]);
    const [units, setUnits] = useState([]);
    const [taxProfiles, setTaxProfiles] = useState([]);
    const [manufacturers, setManufacturers] = useState([]);
    const [attributes, setAttributes] = useState([]);

    const [products, setProducts] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [perPage, setPerPage] = useState(10);
    const [paginationMeta, setPaginationMeta] = useState({
        total: 0,
        last_page: 1,
        from: 0,
        to: 0,
        current_page: 1,
        per_page: 10
    });

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);

    const [filters, setFilters] = useState({
        search: '',
        category: '',
        brand: '',
        productType: '',
        status: ''
    });

    const loadFormData = useCallback(async () => {
        setLoading(true);
        try {
            const data = await productApi.fetchFormData();
            setCategories(data.categories || []);
            setBrands(data.brands || []);
            setUnits(data.units || []);
            setTaxProfiles(data.tax_profiles || []);
            setManufacturers(data.manufacturers || []);
            setAttributes(data.attributes || []);
            return data;
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to load product lookup data.');
        } finally {
            setLoading(false);
        }
    }, []);

    const loadProducts = useCallback(async (page = currentPage, overridePerPage = perPage, currentFilters = filters) => {
        setLoading(true);
        try {
            const data = await productApi.fetchProducts({
                page: page,
                per_page: overridePerPage,
                search: currentFilters.search || undefined,
                category_id: currentFilters.category || undefined,
                brand_id: currentFilters.brand || undefined,
                product_type: currentFilters.productType || undefined,
                status: currentFilters.status || undefined
            });

            if (data && Array.isArray(data.data)) {
                setProducts(data.data || []);
                setPaginationMeta({
                    total: data.total || 0,
                    last_page: data.last_page || 1,
                    from: data.from || 0,
                    to: data.to || 0,
                    current_page: data.current_page || 1,
                    per_page: data.per_page || overridePerPage
                });
            } else if (Array.isArray(data)) {
                setProducts(data);
                setPaginationMeta({
                    total: data.length,
                    last_page: 1,
                    from: data.length > 0 ? 1 : 0,
                    to: data.length,
                    current_page: 1,
                    per_page: data.length || overridePerPage
                });
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to load products list.');
        } finally {
            setLoading(false);
        }
    }, [currentPage, perPage, filters]);

    useEffect(() => {
        loadFormData();
    }, [loadFormData]);

    useEffect(() => {
        if (view === 'list') {
            loadProducts(currentPage, perPage, filters);
        }
    }, [currentPage, perPage, filters, view, loadProducts]);

    const toggleProductActiveStatus = async (product) => {
        setError(null);
        setSuccess(null);
        try {
            const data = await productApi.updateProductStatus(product);
            if (data.success) {
                setSuccess(`Product "${product.name}" ${!product.is_active ? 'activated' : 'deactivated'} successfully.`);
                loadProducts();
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to update product status.');
        }
    };

    const handleFilterChange = (field, value) => {
        setFilters(prev => ({ ...prev, [field]: value }));
        setCurrentPage(1);
    };

    const handlePerPageChange = (e) => {
        const val = parseInt(e.target.value, 10);
        setPerPage(val);
        setCurrentPage(1);
    };

    const handlePageChange = (newPage) => {
        if (newPage >= 1 && newPage <= paginationMeta.last_page && newPage !== currentPage) {
            setCurrentPage(newPage);
        }
    };

    return {
        categories,
        brands,
        units,
        taxProfiles,
        manufacturers,
        attributes,
        products,
        currentPage,
        perPage,
        paginationMeta,
        loading,
        error,
        success,
        filters,
        setError,
        setSuccess,
        loadFormData,
        loadProducts,
        toggleProductActiveStatus,
        handleFilterChange,
        handlePerPageChange,
        handlePageChange
    };
}
