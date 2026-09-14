import React, { useState, useEffect } from 'react';
import { useProducts } from './hooks/useProducts';
import { useProductDetails } from './hooks/useProductDetails';
import { useProductAttributes } from './hooks/useProductAttributes';

import ProductFilters from './ProductFilters';
import ProductList from './ProductList';
import ProductDetails from './ProductDetails';
import ProductAttributes from './ProductAttributes';
import AddProductModal from './ProductModals/AddProductModal';
import AddBrandModal from './ProductModals/AddBrandModal';
import AddManufacturerModal from './ProductModals/AddManufacturerModal';

import { productApi } from '../../services/productApi';

export default function ProductCatalogPage({ initialSubTab = 'list' }) {
    const [view, setView] = useState(initialSubTab);

    // Primary products state hook
    const {
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
    } = useProducts(view, initialSubTab);

    // Product detail hook
    const {
        selectedProduct,
        selectedProductForEdit,
        detailLoading,
        conversionForm,
        setConversionForm,
        conversions,
        inventorySummary,
        viewProductDetail: viewProductDetailRaw,
        setupEditProduct: setupEditProductRaw,
        handleAddConversion,
        handleDeleteConversion
    } = useProductDetails(setError, setSuccess);

    // Custom attributes hook
    const {
        assignedAttributeIds,
        showAttrModal,
        setShowAttrModal,
        showAddExistingAttrModal,
        setShowAddExistingAttrModal,
        selectedExistingAttrId,
        setSelectedExistingAttrId,
        attrToRemove,
        setAttrToRemove,
        attributeForm,
        setAttributeForm,
        handleAttributeSubmit,
        handleAddExistingAttributeSubmit,
        confirmRemoveAttribute
    } = useProductAttributes(setError, setSuccess, (val) => {});

    // Quick Add Modals State
    const [showBrandModal, setShowBrandModal] = useState(false);
    const [brandForm, setBrandForm] = useState({ name: '', slug: '', description: '' });

    const [showManufacturerModal, setShowManufacturerModal] = useState(false);
    const [manufacturerModalError, setManufacturerModalError] = useState(null);
    const [manufacturerModalSuccess, setManufacturerModalSuccess] = useState(null);
    const [manufacturerForm, setManufacturerForm] = useState({
        legal_name: '',
        trade_name: '',
        gstin: '',
        phone: '',
        email: '',
        website: '',
        address: ''
    });

    // Navigation triggers
    const navigateToList = () => {
        setError(null);
        setSuccess(null);
        loadProducts();
        setView('list');
    };

    const navigateToCreate = () => {
        setError(null);
        setSuccess(null);
        setView('create');
    };

    const viewProductDetail = (productId) => {
        viewProductDetailRaw(productId, units, setView);
    };

    const setupEditProduct = (productId) => {
        setupEditProductRaw(productId, setView);
    };

    // Quick Add Brand submit handler
    const handleQuickAddBrandSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        try {
            await productApi.createBrand(brandForm);
            await loadFormData();
            setShowBrandModal(false);
            setBrandForm({ name: '', slug: '', description: '' });
            setSuccess('Brand created successfully!');
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to create brand.');
        }
    };

    // Quick Add Manufacturer submit handler
    const handleQuickAddManufacturerSubmit = async (e) => {
        e.preventDefault();
        setManufacturerModalError(null);
        setManufacturerModalSuccess(null);
        try {
            const res = await productApi.createManufacturer(manufacturerForm);
            const successMsg = res.message || 'Manufacturer added to global master successfully.';
            setManufacturerModalSuccess(successMsg);

            await loadFormData();

            setTimeout(() => {
                setShowManufacturerModal(false);
                setManufacturerForm({
                    legal_name: '',
                    trade_name: '',
                    gstin: '',
                    phone: '',
                    email: '',
                    website: '',
                    address: ''
                });
                setManufacturerModalSuccess(null);
            }, 1800);
        } catch (err) {
            let errMsg = err.response?.data?.message || 'Failed to create manufacturer.';
            if (err.response?.data?.errors) {
                const validationMsgs = Object.values(err.response.data.errors).flat().join(' ');
                if (validationMsgs) errMsg = validationMsgs;
            }
            setManufacturerModalError(errMsg);
        }
    };

    useEffect(() => {
        setView(initialSubTab);
    }, [initialSubTab]);

    return (
        <div className="card shadow-sm border-light" style={{ backgroundColor: '#fafbfc' }}>
            {/* Header section */}
            <div className="card-header bg-white d-flex justify-content-between align-items-center py-3 border-bottom-0">
                <div>
                    <h4 className="mb-0 fw-bold d-flex align-items-center text-dark">
                        <i className="fa-solid fa-cube text-primary me-2"></i>
                        Products Catalog
                    </h4>
                    <p className="text-muted small mb-0">Manage products, physical specifications, commercial profiles and conversions</p>
                </div>
                <div className="d-flex gap-2">
                    <button className="btn btn-primary btn-sm px-3 d-flex align-items-center gap-1" onClick={navigateToCreate}>
                        <i className="fa-solid fa-plus"></i> Add New Product Variant
                    </button>
                    <button className="btn btn-sm btn-secondary d-flex align-items-center gap-1" onClick={() => { loadFormData(); loadProducts(); }}>
                        <i className="fa-solid fa-rotate"></i> Sync
                    </button>
                </div>
            </div>

            <div className="card-body pt-2">
                {/* Global Message Alerts */}
                {error && (
                    <div className="alert alert-danger d-flex align-items-center justify-content-between py-2 animate__animated animate__fadeIn border-0" role="alert" style={{ borderRadius: "8px" }}>
                        <div className="d-flex align-items-center">
                            <i className="fa-solid fa-circle-exclamation me-2"></i>
                            <div>{error}</div>
                        </div>
                        <button type="button" className="btn-close ms-2 flex-shrink-0" onClick={() => setError(null)} aria-label="Close"></button>
                    </div>
                )}
                {success && (
                    <div className="alert alert-success d-flex align-items-center justify-content-between py-2 animate__animated animate__fadeIn border-0" role="alert" style={{ borderRadius: "8px" }}>
                        <div className="d-flex align-items-center">
                            <i className="fa-solid fa-circle-check me-2"></i>
                            <div>{success}</div>
                        </div>
                        <button type="button" className="btn-close ms-2 flex-shrink-0" onClick={() => setSuccess(null)} aria-label="Close"></button>
                    </div>
                )}

                {/* LIST / CATALOG REGISTRY VIEW */}
                {(view === "list" || view === "create" || view === "edit") && (
                    <div>
                        <ProductFilters
                            filters={filters}
                            perPage={perPage}
                            categories={categories}
                            brands={brands}
                            handleFilterChange={handleFilterChange}
                            handlePerPageChange={handlePerPageChange}
                        />

                        <ProductList
                            products={products}
                            loading={loading}
                            paginationMeta={paginationMeta}
                            currentPage={currentPage}
                            perPage={perPage}
                            handlePerPageChange={handlePerPageChange}
                            handlePageChange={handlePageChange}
                            viewProductDetail={viewProductDetail}
                            setupEditProduct={setupEditProduct}
                            toggleProductActiveStatus={toggleProductActiveStatus}
                        />
                    </div>
                )}

                {/* ADD / EDIT PRODUCT MODAL */}
                <AddProductModal
                    show={view === "create" || view === "edit"}
                    onClose={navigateToList}
                    onSave={() => {
                        loadProducts();
                        navigateToList();
                    }}
                    productToEdit={view === "edit" ? selectedProductForEdit : null}
                />

                {/* PRODUCT DETAIL VIEW */}
                {view === "detail" && (
                    <ProductDetails
                        selectedProduct={selectedProduct}
                        detailLoading={detailLoading}
                        navigateToList={navigateToList}
                        setupEditProduct={setupEditProduct}
                        units={units}
                        conversions={conversions}
                        conversionForm={conversionForm}
                        setConversionForm={setConversionForm}
                        handleAddConversion={handleAddConversion}
                        handleDeleteConversion={handleDeleteConversion}
                        inventorySummary={inventorySummary}
                    />
                )}
            </div>

            {/* Specification Attribute Modals */}
            <ProductAttributes
                units={units}
                attributes={attributes}
                assignedAttributeIds={assignedAttributeIds}
                showAttrModal={showAttrModal}
                setShowAttrModal={setShowAttrModal}
                showAddExistingAttrModal={showAddExistingAttrModal}
                setShowAddExistingAttrModal={setShowAddExistingAttrModal}
                selectedExistingAttrId={selectedExistingAttrId}
                setSelectedExistingAttrId={setSelectedExistingAttrId}
                attrToRemove={attrToRemove}
                setAttrToRemove={setAttrToRemove}
                attributeForm={attributeForm}
                setAttributeForm={setAttributeForm}
                handleAttributeSubmit={handleAttributeSubmit}
                handleAddExistingAttributeSubmit={handleAddExistingAttributeSubmit}
                confirmRemoveAttribute={confirmRemoveAttribute}
                loadFormData={loadFormData}
                loading={loading}
            />

            {/* Quick Add Brand Modal */}
            <AddBrandModal
                show={showBrandModal}
                onClose={() => setShowBrandModal(false)}
                brandForm={brandForm}
                setBrandForm={setBrandForm}
                onSubmit={handleQuickAddBrandSubmit}
                loading={loading}
            />

            {/* Quick Add Manufacturer Modal */}
            <AddManufacturerModal
                show={showManufacturerModal}
                onClose={() => setShowManufacturerModal(false)}
                manufacturerForm={manufacturerForm}
                setManufacturerForm={setManufacturerForm}
                onSubmit={handleQuickAddManufacturerSubmit}
                loading={loading}
                manufacturerModalError={manufacturerModalError}
                manufacturerModalSuccess={manufacturerModalSuccess}
                setManufacturerModalError={setManufacturerModalError}
                setManufacturerModalSuccess={setManufacturerModalSuccess}
            />
        </div>
    );
}
