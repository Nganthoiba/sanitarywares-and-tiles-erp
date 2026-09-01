import React, { useState, useEffect } from "react";
import axios from "axios";
import ProductBatchPriceManagement from "./ProductBatchPriceManagement";
import AddProductVariantModal from "../common/AddProductVariantModal";

export default function ProductEntry({ initialSubTab = "list" }) {
    // Navigation / View state
    // "list", "create", "detail", "edit", "families"
    const [view, setView] = useState(initialSubTab);
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [selectedProductForEdit, setSelectedProductForEdit] = useState(null);

    // Lookup States
    const [categories, setCategories] = useState([]);
    const [brands, setBrands] = useState([]);
    const [units, setUnits] = useState([]);
    const [taxProfiles, setTaxProfiles] = useState([]);
    const [manufacturers, setManufacturers] = useState([]);
    const [attributes, setAttributes] = useState([]);
    
    // Core List State
    const [products, setProducts] = useState([]);

    // UX States
    const [loading, setLoading] = useState(false);
    const [detailLoading, setDetailLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);

    // Concept Info Toggles (Registry List View)
    const [showVariantInfo, setShowVariantInfo] = useState(false);

    // Concept Info Toggles (Form View)
    const [showFormVariantInfo, setShowFormVariantInfo] = useState(false);

    // Filter States
    const [filters, setFilters] = useState({
        search: "",
        category: "",
        brand: "",
        productType: "",
        status: ""
    });

    // Add/Edit Product Form State
    const [productForm, setProductForm] = useState({
        id: null,
        name: "",
        category_id: "",
        brand_id: "",
        manufacturer_id: "",
        sku: "",
        gtin: "",
        barcode: "",
        product_type: "STANDARD",
        physical_object: "SLAB",
        measurement_unit: "SQFT",
        tax_profile_id: "",
        is_active: true,
        attributes: {} // { attribute_id: value }
    });

    // Unit Conversion Form State (for detail view)
    const [conversionForm, setConversionForm] = useState({
        from_unit_id: "",
        to_unit_id: "",
        multiplier: ""
    });
    const [conversions, setConversions] = useState([]);

    // Calculated Inventory State
    const [inventorySummary, setInventorySummary] = useState(null);



    const [showTypeGuide, setShowTypeGuide] = useState(false);
    const [assignedAttributeIds, setAssignedAttributeIds] = useState([]);
    const [showAttrModal, setShowAttrModal] = useState(false);
    const [showAddExistingAttrModal, setShowAddExistingAttrModal] = useState(false);
    const [selectedExistingAttrId, setSelectedExistingAttrId] = useState("");
    const [attrToRemove, setAttrToRemove] = useState(null);
    const [attributeForm, setAttributeForm] = useState({
        name: "",
        type: "string",
        unit_id: ""
    });



    const [showBrandModal, setShowBrandModal] = useState(false);
    const [brandForm, setBrandForm] = useState({
        name: "",
        slug: "",
        description: ""
    });

    const [showManufacturerModal, setShowManufacturerModal] = useState(false);
    const [manufacturerForm, setManufacturerForm] = useState({
        name: "",
        phone: "",
        email: "",
        website: "",
        address: ""
    });

    // -------------------------------------------------------------
    // Core Data Loading
    // -------------------------------------------------------------
    const loadFormData = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem("auth_token");
            const response = await axios.get("/api/product/form-data", {
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = response.data;
            setCategories(data.categories || []);
            setBrands(data.brands || []);
            setUnits(data.units || []);
            console.log(data.tax_profiles);
            setTaxProfiles(data.tax_profiles || []);
            setManufacturers(data.manufacturers || []);
            setAttributes(data.attributes || []);

            // Set some smart defaults for creation form
            if (data.categories.length > 0) {
                setProductForm(prev => ({
                    ...prev,
                    category_id: data.categories[0].id.toString()
                }));
            }
            if (data.tax_profiles.length > 0) {
                setProductForm(prev => ({
                    ...prev,
                    tax_profile_id: data.tax_profiles[0].id.toString()
                }));
            }
        } catch (err) {
            setError(err.response?.data?.message || "Failed to load product lookup data.");
        } finally {
            setLoading(false);
        }
    };

    const loadProducts = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem("auth_token");
            const response = await axios.get("/api/product/variants", {
                headers: { Authorization: `Bearer ${token}` }
            });
            setProducts(response.data || []);
        } catch (err) {
            setError(err.response?.data?.message || "Failed to load products list.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadFormData();
        loadProducts();
    }, []);

    // Sync views when initialSubTab changes from parent router
    useEffect(() => {
        setView(initialSubTab);
    }, [initialSubTab]);

    // -------------------------------------------------------------
    // Actions: Navigation, Detail & Edit Setup
    // -------------------------------------------------------------
    const navigateToList = () => {
        setError(null);
        setSuccess(null);
        loadProducts();
        setView("list");
    };

    const navigateToCreate = () => {
        setError(null);
        setSuccess(null);
        setSelectedProductForEdit(null);
        setView("create");
    };

    const viewProductDetail = async (productId) => {
        setError(null);
        setDetailLoading(true);
        setView("detail");
        try {
            const token = localStorage.getItem("auth_token");
            const res = await axios.get(`/api/product/variants/${productId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setSelectedProduct(res.data);
            
            // Set up conversion form defaults
            if (units.length > 0) {
                setConversionForm({
                    from_unit_id: "",
                    to_unit_id: res.data.base_unit_id?.toString() || units[0].id.toString(),
                    multiplier: ""
                });
            }

            // Load sub-details
            loadConversions(productId);
            loadInventorySummary(productId);
        } catch (err) {
            setError("Failed to load product specifications details.");
        } finally {
            setDetailLoading(false);
        }
    };

    const setupEditProduct = async (productId) => {
        setError(null);
        setLoading(true);
        try {
            const token = localStorage.getItem("auth_token");
            const res = await axios.get(`/api/product/variants/${productId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setSelectedProductForEdit(res.data);
            setView("edit");
        } catch (err) {
            setError("Failed to fetch product data for editing.");
        } finally {
            setLoading(false);
        }
    };

    // -------------------------------------------------------------
    // Unit Conversion Handlers
    // -------------------------------------------------------------
    const loadConversions = async (productId) => {
        try {
            const token = localStorage.getItem("auth_token");
            const res = await axios.get(`/api/product/variants/${productId}/conversions`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setConversions(res.data || []);
        } catch (err) {
            console.error("Failed to load conversions", err);
        }
    };

    const handleAddConversion = async (e) => {
        e.preventDefault();
        setError(null);
        setSuccess(null);
        try {
            const token = localStorage.getItem("auth_token");
            const payload = {
                from_unit_id: parseInt(conversionForm.from_unit_id),
                to_unit_id: parseInt(conversionForm.to_unit_id),
                multiplier: parseFloat(conversionForm.multiplier)
            };
            const res = await axios.post(`/api/product/variants/${selectedProduct.id}/conversions`, payload, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.data.success) {
                setSuccess("Unit conversion mapping created successfully!");
                setConversionForm(prev => ({ ...prev, from_unit_id: "", multiplier: "" }));
                loadConversions(selectedProduct.id);
            }
        } catch (err) {
            setError(err.response?.data?.message || "Failed to define unit conversion.");
        }
    };

    const handleDeleteConversion = async (convId) => {
        if (!confirm("Are you sure you want to remove this unit conversion profile?")) return;
        setError(null);
        setSuccess(null);
        try {
            const token = localStorage.getItem("auth_token");
            const res = await axios.delete(`/api/product/conversions/${convId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.data.success) {
                setSuccess("Unit conversion deleted.");
                loadConversions(selectedProduct.id);
            }
        } catch (err) {
            setError("Failed to delete unit conversion.");
        }
    };

    // -------------------------------------------------------------
    // Inventory Summary Handlers
    // -------------------------------------------------------------
    const loadInventorySummary = async (productId) => {
        try {
            const token = localStorage.getItem("auth_token");
            const res = await axios.get(`/api/product/variants/${productId}/inventory-summary`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setInventorySummary(res.data);
        } catch (err) {
            console.error("Failed to load inventory summary", err);
        }
    };

    // -------------------------------------------------------------
    // Toggle Status Directly in List
    // -------------------------------------------------------------
    const toggleProductActiveStatus = async (product) => {
        setError(null);
        setSuccess(null);
        try {
            const token = localStorage.getItem("auth_token");
            
            // Map existing specifications
            const mappedAttrs = product.attribute_values?.map(av => ({
                attribute_id: av.product_attribute_id,
                value: av.value
            })) || [];

            const payload = {
                product_family_id: product.product_family_id,
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

            const res = await axios.put(`/api/product/variants/${product.id}`, payload, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.data.success) {
                setSuccess(`Product "${product.name}" ${!product.is_active ? 'activated' : 'deactivated'} successfully.`);
                loadProducts();
            }
        } catch (err) {
            setError(err.response?.data?.message || "Failed to update product status.");
        }
    };

    // -------------------------------------------------------------
    // Form Submission: Create / Edit Product
    // -------------------------------------------------------------
    const handleProductSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setSuccess(null);
        setLoading(true);

        // Map assigned specifications to array structure expected by backend API
        const mappedAttributes = assignedAttributeIds
            .filter(attrId => productForm.attributes[attrId] !== undefined && productForm.attributes[attrId] !== null && String(productForm.attributes[attrId]).trim() !== "")
            .map(attrId => ({
                attribute_id: parseInt(attrId, 10),
                value: String(productForm.attributes[attrId]).trim()
            }));

        const submissionData = {
            ...productForm,
            attributes: mappedAttributes
        };

        try {
            const token = localStorage.getItem("auth_token");
            let response;
            if (productForm.id) {
                // Edit / Update
                response = await axios.put(`/api/product/variants/${productForm.id}`, submissionData, {
                    headers: { Authorization: `Bearer ${token}` }
                });
            } else {
                // Create
                response = await axios.post("/api/product/variants", submissionData, {
                    headers: { Authorization: `Bearer ${token}` }
                });
            }

            if (response.data.success) {
                setSuccess(response.data.message || "Product saved successfully.");
                // Reload list and lookups
                await loadProducts();
                await loadFormData();
                // Navigate back
                setView("list");
            }
        } catch (err) {
            setError(err.response?.data?.message || "Failed to save product specification.");
        } finally {
            setLoading(false);
        }
    };



    // -------------------------------------------------------------
    // Inline Category, Brand, Manufacturer Quick Add Handlers
    // -------------------------------------------------------------


    const handleQuickAddBrandSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setLoading(true);
        try {
            const token = localStorage.getItem("auth_token");
            const response = await axios.post("/api/brands-crud", brandForm, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const newBrand = response.data.brand;
            // Refresh lookup
            const res = await axios.get("/api/product/form-data", {
                headers: { Authorization: `Bearer ${token}` }
            });
            setBrands(res.data.brands || []);
            setProductForm(prev => ({
                ...prev,
                brand_id: newBrand.id.toString()
            }));
            setShowBrandModal(false);
            setBrandForm({
                name: "",
                slug: "",
                description: ""
            });
            setSuccess("Brand created successfully!");
        } catch (err) {
            setError(err.response?.data?.message || "Failed to create brand.");
        } finally {
            setLoading(false);
        }
    };

    const handleQuickAddManufacturerSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setLoading(true);
        try {
            const token = localStorage.getItem("auth_token");
            const payload = {
                legal_name: manufacturerForm.legal_name || manufacturerForm.name,
                trade_name: manufacturerForm.trade_name || undefined,
                gstin: manufacturerForm.gstin || undefined,
                phone: manufacturerForm.phone || undefined,
                email: manufacturerForm.email || undefined,
                website: manufacturerForm.website || undefined,
                address: manufacturerForm.address || undefined
            };
            const response = await axios.post("/api/manufacturers-crud", payload, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const newManufacturer = response.data.manufacturer;
            // Refresh lookup
            const res = await axios.get("/api/product/form-data", {
                headers: { Authorization: `Bearer ${token}` }
            });
            setManufacturers(res.data.manufacturers || []);
            setProductForm(prev => ({
                ...prev,
                manufacturer_id: newManufacturer.id.toString()
            }));
            setShowManufacturerModal(false);
            setManufacturerForm({
                legal_name: "",
                trade_name: "",
                gstin: "",
                phone: "",
                email: "",
                website: "",
                address: ""
            });
            setSuccess("Manufacturer added to global master successfully!");
        } catch (err) {
            setError(err.response?.data?.message || "Failed to create manufacturer.");
        } finally {
            setLoading(false);
        }
    };

    // -------------------------------------------------------------
    // Custom Attribute Handlers
    // -------------------------------------------------------------
    const handleAttributeSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setLoading(true);
        try {
            const token = localStorage.getItem("auth_token");
            const payload = {
                name: attributeForm.name,
                type: attributeForm.type,
                unit_id: attributeForm.unit_id ? parseInt(attributeForm.unit_id, 10) : null
            };
            const response = await axios.post("/api/product/attributes", payload, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (response.data.success) {
                const newAttr = response.data.data;
                setSuccess(`Custom specification attribute "${attributeForm.name}" defined successfully.`);
                setAttributeForm({ name: "", type: "string", unit_id: "" });
                setShowAttrModal(false);
                await loadFormData();
                if (newAttr && newAttr.id) {
                    setAssignedAttributeIds(prev => Array.from(new Set([...prev, newAttr.id])));
                }
            }
        } catch (err) {
            setError(err.response?.data?.message || "Failed to register custom attribute.");
        } finally {
            setLoading(false);
        }
    };

    const handleAddExistingAttributeSubmit = (e) => {
        e.preventDefault();
        if (!selectedExistingAttrId) return;
        const attrId = parseInt(selectedExistingAttrId, 10);
        setAssignedAttributeIds(prev => Array.from(new Set([...prev, attrId])));
        setSelectedExistingAttrId("");
        setShowAddExistingAttrModal(false);
    };

    const confirmRemoveAttribute = async () => {
        if (!attrToRemove) return;
        const attrId = attrToRemove.id;
        try {
            if (productForm.id) {
                const token = localStorage.getItem("auth_token");
                await axios.delete(`/api/products/${productForm.id}/attributes/${attrId}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
            }
        } catch (err) {
            // Log/ignore errors on disassociate
        }
        setAssignedAttributeIds(prev => prev.filter(id => id !== attrId));
        setProductForm(prev => {
            const updatedAttrs = { ...prev.attributes };
            delete updatedAttrs[attrId];
            return { ...prev, attributes: updatedAttrs };
        });
        setAttrToRemove(null);
    };

    // -------------------------------------------------------------
    // Family Specific Sub-Views
    // -------------------------------------------------------------
    const handleViewFamilyProducts = (family) => {
        setSelectedFamilyId(family.id);
        setFamilyProducts(products.filter(p => p.product_family_id === family.id));
    };

    // -------------------------------------------------------------
    // Filtering Logic
    // -------------------------------------------------------------
    const filteredProducts = products.filter(p => {
        const matchesSearch = !filters.search || 
            p.name.toLowerCase().includes(filters.search.toLowerCase()) ||
            p.sku.toLowerCase().includes(filters.search.toLowerCase()) ||
            (p.gtin && p.gtin.toLowerCase().includes(filters.search.toLowerCase())) ||
            (p.barcode && p.barcode.toLowerCase().includes(filters.search.toLowerCase()));

        const matchesCategory = !filters.category || p.category_id?.toString() === filters.category;
        const matchesBrand = !filters.brand || p.brand_id?.toString() === filters.brand;
        const matchesType = !filters.productType || 
            (filters.productType === 'MEASURED_MATERIAL' && p.inventory_behavior === 'SLAB') ||
            (filters.productType === 'STANDARD' && p.inventory_behavior !== 'SLAB');
        const matchesStatus = !filters.status || 
            (filters.status === 'ACTIVE' && p.is_active) ||
            (filters.status === 'INACTIVE' && !p.is_active);

        return matchesSearch && matchesCategory && matchesBrand && matchesType && matchesStatus;
    });

    return (
        <>
            <div className="card shadow-sm border-light" style={{ backgroundColor: "#fafbfc" }}>
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
                    <button
                        className={`btn btn-sm ${view === "batch-pricing" ? "btn-primary" : "btn-outline-primary"} d-flex align-items-center gap-1`}
                        onClick={() => setView(view === "batch-pricing" ? "list" : "batch-pricing")}
                    >
                        <i className="fa-solid fa-tags"></i> Batch Pricing Registry
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

                {/* ---------------------------------------------------------
                    SUB-VIEW: BATCH PRICING REGISTRY
                    --------------------------------------------------------- */}
                {view === "batch-pricing" && (
                    <ProductBatchPriceManagement />
                )}

                {/* ---------------------------------------------------------
                    SUB-VIEW: LIST / PRODUCTS REGISTRY
                    --------------------------------------------------------- */}
                {(view === "list" || view === "create" || view === "edit") && (
                    <div>
                        {/* Concept Introductions */}
                        <div className="p-3 bg-white border border-light rounded-3 mb-4 shadow-sm">
                            <div className="d-flex align-items-center justify-content-between flex-wrap gap-2">
                                <div className="d-flex align-items-center gap-2">
                                    <span className="badge bg-primary-subtle text-primary font-monospace px-2 py-1">Catalog Structure</span>
                                    <span className="text-muted small">Products are directly categorized and branded for fast, streamlined inventory management.</span>
                                </div>
                            </div>
                        </div>

                        {/* Search and Filters panel */}
                        <div className="d-flex flex-wrap justify-content-between align-items-center mb-4 gap-3 bg-white p-3 border border-light rounded-3 shadow-sm">
                            <div className="d-flex flex-wrap gap-2 flex-grow-1">
                                <div className="position-relative" style={{ maxWidth: "240px", width: "100%" }}>
                                    <input 
                                        type="text" 
                                        className="form-control form-control-sm ps-4" 
                                        placeholder="Search products..." 
                                        value={filters.search}
                                        onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                                    />
                                    <i className="fa-solid fa-magnifying-glass position-absolute text-muted" style={{ left: "10px", top: "8px", fontSize: "0.8rem" }}></i>
                                </div>
                                <select 
                                    className="form-select form-select-sm" 
                                    style={{ maxWidth: "150px" }}
                                    value={filters.category}
                                    onChange={(e) => setFilters({ ...filters, category: e.target.value })}
                                >
                                    <option value="">All Categories</option>
                                    {categories.map(c => (
                                        <option key={c.id} value={c.id}>
                                            {c.parent_id || c.parent ? `\u00A0\u00A0── ${c.name}` : c.name}
                                        </option>
                                    ))}
                                </select>
                                <select 
                                    className="form-select form-select-sm" 
                                    style={{ maxWidth: "150px" }}
                                    value={filters.brand}
                                    onChange={(e) => setFilters({ ...filters, brand: e.target.value })}
                                >
                                    <option value="">All Brands</option>
                                    {brands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                                </select>
                                <select 
                                    className="form-select form-select-sm" 
                                    style={{ maxWidth: "150px" }}
                                    value={filters.productType}
                                    onChange={(e) => setFilters({ ...filters, productType: e.target.value })}
                                >
                                    <option value="">All Types</option>
                                    <option value="STANDARD">Standard</option>
                                    <option value="MEASURED_MATERIAL">Measured Material</option>
                                </select>
                                <select 
                                    className="form-select form-select-sm" 
                                    style={{ maxWidth: "150px" }}
                                    value={filters.status}
                                    onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                                >
                                    <option value="">All Statuses</option>
                                    <option value="ACTIVE">Active</option>
                                    <option value="INACTIVE">Inactive</option>
                                </select>
                            </div>
                            <button className="btn btn-primary btn-sm px-3 d-flex align-items-center gap-1" onClick={navigateToCreate}>
                                <i className="fa-solid fa-plus"></i> Add New Product Variant
                            </button>
                        </div>

                        {/* Products List Table */}
                        <div className="table-responsive bg-white border border-light rounded-3 shadow-sm">
                            {loading ? (
                                <div className="text-center py-5">
                                    <span className="spinner-border spinner-border-sm text-primary"></span> Loading product catalog...
                                </div>
                            ) : (
                                <table className="table table-hover align-middle border-0 mb-0">
                                    <thead className="bg-light">
                                        <tr>
                                            <th className="border-bottom-0 py-3">Product Name</th>
                                            <th className="border-bottom-0 py-3">Category</th>
                                            <th className="border-bottom-0 py-3">Brand</th>
                                            <th className="border-bottom-0 py-3">SKU</th>
                                            <th className="border-bottom-0 py-3">Type</th>
                                            <th className="border-bottom-0 py-3">Status</th>
                                            <th className="text-end border-bottom-0 py-3">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredProducts.length === 0 ? (
                                            <tr>
                                                <td colSpan="7" className="text-center text-muted py-4">
                                                    No products found matching filters.
                                                </td>
                                            </tr>
                                        ) : (
                                            filteredProducts.map(p => (
                                                <tr key={p.id}>
                                                    <td>
                                                        <div className="fw-bold text-dark">{p.name}</div>
                                                    </td>
                                                    <td>{p.category?.name || <span className="text-muted">-</span>}</td>
                                                    <td>{p.brand?.name || <span className="text-muted">-</span>}</td>
                                                    <td>
                                                        <span className="badge bg-primary-subtle text-primary border-light">{p.sku}</span>
                                                    </td>
                                                    <td>
                                                        <span className="badge bg-secondary-subtle text-secondary" style={{ fontSize: "0.75rem" }}>
                                                            {p.inventory_behavior === 'SLAB' ? 'Measured Material' : 'Standard'}
                                                        </span>
                                                    </td>
                                                    <td>
                                                        {p.is_active ? (
                                                            <span className="badge bg-success-subtle text-success border border-success-subtle px-2 py-1">Active</span>
                                                        ) : (
                                                            <span className="badge bg-danger-subtle text-danger border border-danger-subtle px-2 py-1">Inactive</span>
                                                        )}
                                                    </td>
                                                    <td className="text-end">
                                                        <div className="d-flex gap-1 justify-content-end">
                                                            <button className="btn btn-xs btn-outline-primary" onClick={() => viewProductDetail(p.id)} title="View Detail">
                                                                <i className="fa-solid fa-eye"></i> View
                                                            </button>
                                                            <button className="btn btn-xs btn-outline-secondary" onClick={() => setupEditProduct(p.id)} title="Edit specifications">
                                                                <i className="fa-solid fa-pen"></i> Edit
                                                            </button>
                                                            <button 
                                                                className={`btn btn-xs ${p.is_active ? 'btn-outline-danger' : 'btn-outline-success'}`}
                                                                onClick={() => toggleProductActiveStatus(p)}
                                                                title={p.is_active ? 'Deactivate Product' : 'Activate Product'}
                                                            >
                                                                <i className={`fa-solid ${p.is_active ? 'fa-ban' : 'fa-check'}`}></i> {p.is_active ? 'Disable' : 'Enable'}
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    </div>
                )}

                {/* ---------------------------------------------------------
                    SUB-VIEW: ADD / EDIT PRODUCT FORM
                    --------------------------------------------------------- */}
                <AddProductVariantModal
                    show={view === "create" || view === "edit"}
                    onClose={navigateToList}
                    onSave={() => {
                        loadProducts();
                        navigateToList();
                    }}
                    productToEdit={view === "edit" ? selectedProductForEdit : null}
                />

                {/* ---------------------------------------------------------
                    SUB-VIEW: PRODUCT DETAIL VIEW
                    --------------------------------------------------------- */}
                {view === "detail" && (
                    <div>
                        {detailLoading || !selectedProduct ? (
                            <div className="text-center py-5">
                                <span className="spinner-border spinner-border-sm text-primary"></span> Retrieving product profile details...
                            </div>
                        ) : (
                            <div>
                                {/* Profile Header Card */}
                                <div className="card border-0 bg-white p-4 rounded-3 mb-4 shadow-sm border border-light">
                                    <div className="d-flex justify-content-between align-items-start flex-wrap gap-3">
                                        <div>
                                            <span className="badge bg-primary text-uppercase mb-2" style={{ fontSize: "0.7rem" }}>
                                                {selectedProduct.inventory_behavior === 'SLAB' ? 'Measured Material (Slab)' : 'Standard Product'}
                                            </span>
                                            <h3 className="fw-bold mb-1 text-dark">{selectedProduct.name}</h3>
                                            <div className="text-muted d-flex gap-3 flex-wrap small">
                                                <span><strong className="text-dark">SKU:</strong> {selectedProduct.sku}</span>
                                                {selectedProduct.brand && <span><strong className="text-dark">Brand:</strong> {selectedProduct.brand.name}</span>}
                                                <span>
                                                    <strong className="text-dark">Status:</strong> {selectedProduct.is_active ? (
                                                        <span className="badge bg-success-subtle text-success">Active</span>
                                                    ) : (
                                                        <span className="badge bg-danger-subtle text-danger">Inactive</span>
                                                    )}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="d-flex gap-2">
                                            <button className="btn btn-sm btn-secondary px-3" onClick={navigateToList}>
                                                <i className="fa-solid fa-arrow-left"></i> Back
                                            </button>
                                            <button className="btn btn-sm btn-primary px-3" onClick={() => setupEditProduct(selectedProduct.id)}>
                                                <i className="fa-solid fa-pen"></i> Edit Product
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                {/* Tab Panels for Details */}
                                <div className="row">
                                    <div className="col-lg-3 mb-4">
                                        <div className="nav flex-column nav-pills bg-white p-2 rounded-3 shadow-sm border" role="tablist">
                                            <button className="nav-link active text-start fw-semibold py-2.5 px-3 mb-1" id="tab-overview" data-bs-toggle="pill" data-bs-target="#pane-overview" type="button">
                                                <i className="fa-solid fa-circle-info me-2 text-primary"></i> Overview
                                            </button>
                                            <button className="nav-link text-start fw-semibold py-2.5 px-3 mb-1" id="tab-specifications" data-bs-toggle="pill" data-bs-target="#pane-specifications" type="button">
                                                <i className="fa-solid fa-sliders me-2 text-primary"></i> Specifications
                                            </button>
                                            <button className="nav-link text-start fw-semibold py-2.5 px-3 mb-1" id="tab-units" data-bs-toggle="pill" data-bs-target="#pane-units" type="button">
                                                <i className="fa-solid fa-calculator me-2 text-primary"></i> Units & Conversions
                                            </button>
                                            <button className="nav-link text-start fw-semibold py-2.5 px-3 mb-1" id="tab-pricing" data-bs-toggle="pill" data-bs-target="#pane-pricing" type="button">
                                                <i className="fa-solid fa-indian-rupee-sign me-2 text-primary"></i> Pricing Profiles
                                            </button>
                                            <button className="nav-link text-start fw-semibold py-2.5 px-3" id="tab-inventory" data-bs-toggle="pill" data-bs-target="#pane-inventory" type="button">
                                                <i className="fa-solid fa-warehouse me-2 text-primary"></i> Stock Inventory
                                            </button>
                                        </div>
                                    </div>

                                    <div className="col-lg-9">
                                        <div className="tab-content card border-0 p-4 rounded-3 shadow-sm bg-white border border-light">
                                            
                                            {/* Overview Pane */}
                                            <div className="tab-pane fade show active" id="pane-overview" role="tabpanel">
                                                <h5 className="fw-bold mb-4 text-dark">Product Overview</h5>
                                                <div className="row g-3">
                                                    <div className="col-md-6 border-bottom pb-2">
                                                        <span className="text-muted d-block small">Product Name</span>
                                                        <strong className="text-dark">{selectedProduct.name}</strong>
                                                    </div>
                                                    <div className="col-md-6 border-bottom pb-2">
                                                         <span className="text-muted d-block small">Category</span>
                                                         <strong className="text-dark">{selectedProduct.category?.name || "N/A"}</strong>
                                                     </div>
                                                     <div className="col-md-6 border-bottom pb-2">
                                                         <span className="text-muted d-block small">Brand</span>
                                                         <strong className="text-dark">{selectedProduct.brand?.name || "N/A"}</strong>
                                                     </div>
                                                     <div className="col-md-6 border-bottom pb-2">
                                                         <span className="text-muted d-block small">Manufacturer</span>
                                                         <strong className="text-dark">{selectedProduct.manufacturer?.name || "N/A"}</strong>
                                                     </div>
                                                    <div className="col-md-6 border-bottom pb-2">
                                                        <span className="text-muted d-block small">SKU Code</span>
                                                        <strong className="text-dark font-monospace">{selectedProduct.sku}</strong>
                                                    </div>
                                                    <div className="col-md-6 border-bottom pb-2">
                                                        <span className="text-muted d-block small">GTIN / EAN</span>
                                                        <strong className="text-dark font-monospace">{selectedProduct.gtin || "-"}</strong>
                                                    </div>
                                                    <div className="col-md-6 border-bottom pb-2">
                                                        <span className="text-muted d-block small">Barcode Scan Code</span>
                                                        <strong className="text-dark font-monospace">{selectedProduct.barcode || "-"}</strong>
                                                    </div>
                                                    <div className="col-md-6 border-bottom pb-2">
                                                        <span className="text-muted d-block small">Product Type</span>
                                                        <strong className="text-dark">{selectedProduct.inventory_behavior === 'SLAB' ? 'Measured Material' : 'Standard Product'}</strong>
                                                    </div>
                                                    <div className="col-md-6 border-bottom pb-2">
                                                        <span className="text-muted d-block small">Inventory Engine Behavior</span>
                                                        <strong className="text-dark font-monospace">{selectedProduct.inventory_behavior}</strong>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Specifications Pane */}
                                            <div className="tab-pane fade" id="pane-specifications" role="tabpanel">
                                                <h5 className="fw-bold mb-4 text-dark">Specification Attributes</h5>
                                                {selectedProduct.attribute_values && selectedProduct.attribute_values.length > 0 ? (
                                                    <div className="table-responsive">
                                                        <table className="table table-striped align-middle border-light">
                                                            <thead>
                                                                <tr>
                                                                    <th>Attribute Specification Name</th>
                                                                    <th>Value</th>
                                                                </tr>
                                                            </thead>
                                                            <tbody>
                                                                {selectedProduct.attribute_values.map(av => (
                                                                    <tr key={av.id}>
                                                                        <td className="fw-semibold text-muted">{av.attribute?.name}</td>
                                                                        <td><strong className="text-dark">{av.value}</strong></td>
                                                                    </tr>
                                                                ))}
                                                            </tbody>
                                                        </table>
                                                    </div>
                                                ) : (
                                                    <div className="text-muted small">No specification attribute values assigned to this product.</div>
                                                )}
                                            </div>

                                            {/* Units Pane */}
                                            <div className="tab-pane fade" id="pane-units" role="tabpanel">
                                                <h5 className="fw-bold mb-4 text-dark">Product Units Configuration</h5>
                                                <div className="row mb-4">
                                                    <div className="col-md-4">
                                                        <div className="p-3 bg-light rounded-3 border-light text-center">
                                                            <span className="text-muted small d-block mb-1">Primary Inventory / Base Unit</span>
                                                            <strong className="fs-5 text-primary">{selectedProduct.base_unit?.name} ({selectedProduct.base_unit?.symbol})</strong>
                                                        </div>
                                                    </div>
                                                    <div className="col-md-4">
                                                        <div className="p-3 bg-light rounded-3 border-light text-center">
                                                            <span className="text-muted small d-block mb-1">Default Purchase Unit</span>
                                                            <strong className="fs-5 text-dark">{selectedProduct.purchase_unit?.name} ({selectedProduct.purchase_unit?.symbol})</strong>
                                                        </div>
                                                    </div>
                                                    <div className="col-md-4">
                                                        <div className="p-3 bg-light rounded-3 border-light text-center">
                                                            <span className="text-muted small d-block mb-1">Default Sales Unit</span>
                                                            <strong className="fs-5 text-dark">{selectedProduct.sales_unit?.name} ({selectedProduct.sales_unit?.symbol})</strong>
                                                        </div>
                                                    </div>
                                                </div>

                                                <h6 className="fw-bold border-bottom pb-2 mb-3 text-dark">Unit Conversion Relations</h6>
                                                <div className="table-responsive mb-4">
                                                    <table className="table align-middle border-light">
                                                        <thead>
                                                            <tr>
                                                                <th>From Unit</th>
                                                                <th>To Unit (Base)</th>
                                                                <th>Conversion Multiplier</th>
                                                                <th>Relationship Formula</th>
                                                                <th className="text-end">Action</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {conversions.length === 0 ? (
                                                                <tr>
                                                                    <td colSpan="5" className="text-center text-muted small py-3">
                                                                        No custom unit conversions defined. Add box-to-pieces or bulk-to-unit ratios below.
                                                                    </td>
                                                                </tr>
                                                            ) : (
                                                                conversions.map(conv => (
                                                                    <tr key={conv.id}>
                                                                        <td><strong>{conv.from_unit?.symbol}</strong></td>
                                                                        <td>{conv.to_unit?.symbol}</td>
                                                                        <td><strong className="text-primary">{parseFloat(conv.multiplier)}</strong></td>
                                                                        <td className="font-monospace small">1 {conv.from_unit?.symbol} = {parseFloat(conv.multiplier)} {conv.to_unit?.symbol}</td>
                                                                        <td className="text-end">
                                                                            <button className="btn btn-xs btn-link text-danger" onClick={() => handleDeleteConversion(conv.id)}>
                                                                                <i className="fa-solid fa-trash-can"></i> Remove
                                                                            </button>
                                                                        </td>
                                                                    </tr>
                                                                ))
                                                            )}
                                                        </tbody>
                                                    </table>
                                                </div>

                                                <form onSubmit={handleAddConversion} className="bg-light p-3 rounded-3 border border-light">
                                                    <h6 className="fw-bold mb-3 small text-uppercase text-muted">Add Conversion Relationship</h6>
                                                    <div className="row g-2 align-items-end">
                                                        <div className="col-md-3">
                                                            <label className="form-label small mb-1">From Unit</label>
                                                            <select 
                                                                className="form-select form-select-sm" 
                                                                value={conversionForm.from_unit_id} 
                                                                onChange={(e) => setConversionForm({ ...conversionForm, from_unit_id: e.target.value })}
                                                                required
                                                            >
                                                                <option value="">Select Unit</option>
                                                                {units.filter(u => u.id !== selectedProduct.base_unit_id).map(u => (
                                                                    <option key={u.id} value={u.id}>{u.name} ({u.symbol})</option>
                                                                ))}
                                                            </select>
                                                        </div>
                                                        <div className="col-md-3">
                                                            <label className="form-label small mb-1">To Base Unit</label>
                                                            <input type="text" className="form-control form-control-sm" value={`${selectedProduct.base_unit?.name} (${selectedProduct.base_unit?.symbol})`} disabled readOnly />
                                                        </div>
                                                        <div className="col-md-3">
                                                            <label className="form-label small mb-1">Multiplier Quantity</label>
                                                            <input 
                                                                type="number" 
                                                                step="0.000001" 
                                                                className="form-control form-control-sm" 
                                                                placeholder="e.g. 1 Box = X pcs"
                                                                value={conversionForm.multiplier} 
                                                                onChange={(e) => setConversionForm({ ...conversionForm, multiplier: e.target.value })}
                                                                required 
                                                            />
                                                        </div>
                                                        <div className="col-md-3">
                                                            <button type="submit" className="btn btn-sm btn-primary w-100">
                                                                <i className="fa-solid fa-plus me-1"></i> Register Ratio
                                                            </button>
                                                        </div>
                                                    </div>
                                                </form>
                                            </div>

                                            {/* Pricing Pane */}
                                            <div className="tab-pane fade" id="pane-pricing" role="tabpanel">
                                                <h5 className="fw-bold mb-4 text-dark">Pricing & Valuation Profile</h5>
                                                <div className="alert alert-info border-0 rounded-3 mb-4 d-flex align-items-center justify-content-between">
                                                     <div>
                                                         <i className="fa-solid fa-circle-info me-2"></i>
                                                         <strong>Batch-Based Dynamic Pricing:</strong> Purchase prices (cost price) and sale prices are tracked per inventory batch number upon goods receipt at the warehouse, rather than set statically at the product level.
                                                     </div>
                                                     <button type="button" className="btn-close ms-2 flex-shrink-0" onClick={(e) => { e.currentTarget.closest('.alert').style.display = 'none'; }} aria-label="Close"></button>
                                                 </div>
                                                <div className="p-3 bg-light rounded-3">
                                                    <h6 className="fw-bold mb-3 small text-uppercase text-muted">Tax & Commercial Profile</h6>
                                                    <div className="row">
                                                        <div className="col-md-6">
                                                            <span className="text-muted d-block small">GST Tax Profile</span>
                                                            <strong className="text-dark">{selectedProduct.tax_profile?.name || "None"}</strong>
                                                        </div>
                                                        <div className="col-md-6">
                                                            <span className="text-muted d-block small">IGST Tax Rate</span>
                                                            <strong className="text-dark">{selectedProduct.tax_profile?.igst_rate || 0}%</strong>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Inventory Pane */}
                                            <div className="tab-pane fade" id="pane-inventory" role="tabpanel">
                                                <h5 className="fw-bold mb-4 text-dark">Calculated Stock Inventory</h5>
                                                
                                                {inventorySummary ? (
                                                    <div>
                                                        {inventorySummary.is_measured ? (
                                                            // Measured (Granite / Marble)
                                                            <div className="row g-3">
                                                                <div className="col-md-4">
                                                                    <div className="card border-light p-3 text-center rounded-3 bg-light">
                                                                        <span className="text-muted small d-block mb-1">Current Slabs Count</span>
                                                                        <h3 className="fw-bold text-dark">{inventorySummary.measured.current_slabs}</h3>
                                                                    </div>
                                                                </div>
                                                                <div className="col-md-4">
                                                                    <div className="card border-light p-3 text-center rounded-3 bg-success-subtle border-0">
                                                                        <span className="text-muted small d-block mb-1">Available Area</span>
                                                                        <h3 className="fw-bold text-success">{inventorySummary.measured.available_area.toFixed(2)} Sq.Ft</h3>
                                                                    </div>
                                                                </div>
                                                                <div className="col-md-4">
                                                                    <div className="card border-light p-3 text-center rounded-3 bg-warning-subtle border-0">
                                                                        <span className="text-muted small d-block mb-1">Reserved Area</span>
                                                                        <h3 className="fw-bold text-warning">{inventorySummary.measured.reserved_area.toFixed(2)} Sq.Ft</h3>
                                                                    </div>
                                                                </div>
                                                                <div className="col-12 mt-3 text-center">
                                                                    <strong className="text-dark small d-block">Total Measured Area On Hand: {inventorySummary.measured.total_area.toFixed(2)} SQFT</strong>
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            // Standard (Tiles / Sanitaryware)
                                                            <div className="row g-3">
                                                                <div className="col-md-4">
                                                                    <div className="card border-light p-3 text-center rounded-3 bg-light">
                                                                        <span className="text-muted small d-block mb-1">Current Stock On Hand</span>
                                                                        <h3 className="fw-bold text-dark">{inventorySummary.standard.current_stock}</h3>
                                                                        <small className="text-muted">{selectedProduct.base_unit?.symbol}</small>
                                                                    </div>
                                                                </div>
                                                                <div className="col-md-4">
                                                                    <div className="card border-light p-3 text-center rounded-3 bg-success-subtle border-0">
                                                                        <span className="text-muted small d-block mb-1">Available Stock</span>
                                                                        <h3 className="fw-bold text-success">{inventorySummary.standard.available_stock}</h3>
                                                                        <small className="text-muted">{selectedProduct.base_unit?.symbol}</small>
                                                                    </div>
                                                                </div>
                                                                <div className="col-md-4">
                                                                    <div className="card border-light p-3 text-center rounded-3 bg-warning-subtle border-0">
                                                                        <span className="text-muted small d-block mb-1">Reserved Stock</span>
                                                                        <h3 className="fw-bold text-warning">{inventorySummary.standard.reserved_stock}</h3>
                                                                        <small className="text-muted">{selectedProduct.base_unit?.symbol}</small>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        )}
                                                        <div className="mt-4 p-3 bg-light rounded-3 border text-center small text-muted border-light">
                                                            <i className="fa-solid fa-circle-exclamation me-1"></i>
                                                            Physical slabs measurements & counts are updated live during receiving (GRN) and order allocations.
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="text-muted small py-4 text-center">No inventory snapshot details calculated for this product.</div>
                                                )}
                                            </div>

                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>



            {/* -------------------------------------------------------------
                MODAL: DEFINE CUSTOM SPECIFICATION ATTRIBUTE
                ------------------------------------------------------------- */}
            {showAttrModal && (
                <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: "rgba(0,0,0,0.5)", zIndex: 1100 }}>
                    <div className="modal-dialog modal-dialog-centered modal-sm">
                        <div className="modal-content shadow-lg border-0" style={{ borderRadius: "12px" }}>
                            <div className="modal-header border-bottom-0 pt-4 px-4">
                                <h5 className="modal-title fw-bold fs-5">Define Specification Attribute</h5>
                                <button type="button" className="btn-close" onClick={() => setShowAttrModal(false)}></button>
                            </div>
                            <form onSubmit={handleAttributeSubmit}>
                                <div className="modal-body px-4">
                                    <div className="mb-3">
                                        <label className="form-label small fw-semibold">Attribute Name *</label>
                                        <input 
                                            type="text" 
                                            className="form-control" 
                                            placeholder="e.g. Size, Color, Thickness" 
                                            value={attributeForm.name} 
                                            onChange={(e) => setAttributeForm({ ...attributeForm, name: e.target.value })} 
                                            required 
                                        />
                                    </div>
                                    <div className="mb-3">
                                        <label className="form-label small fw-semibold">Value Type *</label>
                                        <select 
                                            className="form-select" 
                                            value={attributeForm.type} 
                                            onChange={(e) => setAttributeForm({ ...attributeForm, type: e.target.value })} 
                                            required
                                        >
                                            <option value="string">String / Text</option>
                                            <option value="number">Numeric</option>
                                            <option value="list">List / Collection</option>
                                        </select>
                                    </div>
                                    <div className="mb-3">
                                        <label className="form-label small fw-semibold">Specification Unit</label>
                                        <select 
                                            className="form-select" 
                                            value={attributeForm.unit_id} 
                                            onChange={(e) => setAttributeForm({ ...attributeForm, unit_id: e.target.value })} 
                                        >
                                            <option value="">NO UNIT</option>
                                            <optgroup label="Length Dimensions">
                                                {units.filter(u => (u.dimension_category || u.type) === 'LENGTH' || ['MM', 'CM', 'M', 'IN', 'FT'].includes(u.symbol?.toUpperCase())).map(u => (
                                                    <option key={u.id} value={u.id}>{u.name} ({u.symbol})</option>
                                                ))}
                                            </optgroup>
                                            <optgroup label="Area Dimensions">
                                                {units.filter(u => (u.dimension_category || u.type) === 'AREA' || ['SQ.MM', 'SQ.CM', 'SQ.M', 'SQ.IN', 'SQ.FT', 'SQFT', 'SQ.FT.'].includes(u.symbol?.toUpperCase())).map(u => (
                                                    <option key={u.id} value={u.id}>{u.name} ({u.symbol})</option>
                                                ))}
                                            </optgroup>
                                            <optgroup label="Volume Dimensions">
                                                {units.filter(u => (u.dimension_category || u.type) === 'VOLUME' || ['L', 'LTR', 'LITRE', 'LITER', 'CU.MM', 'CU.CM', 'CU.M', 'CU.FT'].includes(u.symbol?.toUpperCase())).map(u => (
                                                    <option key={u.id} value={u.id}>{u.name} ({u.symbol})</option>
                                                ))}
                                            </optgroup>
                                            <optgroup label="Mass / Weight Dimensions">
                                                {units.filter(u => (u.dimension_category || u.type) === 'MASS' || ['G', 'GM', 'GRAM', 'KG', 'TON', 'MT'].includes(u.symbol?.toUpperCase())).map(u => (
                                                    <option key={u.id} value={u.id}>{u.name} ({u.symbol})</option>
                                                ))}
                                            </optgroup>
                                        </select>
                                        <small className="text-muted extra-small d-block mt-1">Select physical measurement unit (e.g., Millimeter, Foot, Square Foot, Cubic Meter) or leave as NO UNIT.</small>
                                    </div>
                                </div>
                                <div className="modal-footer border-top-0 pb-4 px-4">
                                    <button type="button" className="btn btn-secondary px-3" onClick={() => setShowAttrModal(false)}>Cancel</button>
                                    <button type="submit" className="btn btn-primary px-4" disabled={loading}>
                                        {loading ? <span className="spinner-border spinner-border-sm me-2"></span> : null}
                                        Define & Add
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* -------------------------------------------------------------
                MODAL: ADD EXISTING ATTRIBUTE TO PRODUCT
                ------------------------------------------------------------- */}
            {showAddExistingAttrModal && (
                <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: "rgba(0,0,0,0.5)", zIndex: 1110 }}>
                    <div className="modal-dialog modal-dialog-centered modal-sm">
                        <div className="modal-content shadow-lg border-0" style={{ borderRadius: "12px" }}>
                            <div className="modal-header border-bottom-0 pt-4 px-4">
                                <h5 className="modal-title fw-bold fs-5">Add Existing Attribute</h5>
                                <button type="button" className="btn-close" onClick={() => setShowAddExistingAttrModal(false)}></button>
                            </div>
                            {attributes.filter(a => !assignedAttributeIds.includes(a.id)).length === 0 ? (
                                <div className="modal-body px-4 py-3 text-center">
                                    <p className="text-muted small mb-3">All registered attribute definitions are already assigned to this product, or none exist yet.</p>
                                    <button 
                                        type="button" 
                                        className="btn btn-sm btn-primary px-3"
                                        onClick={() => {
                                            setShowAddExistingAttrModal(false);
                                            setShowAttrModal(true);
                                        }}
                                    >
                                        <i className="fa-solid fa-plus me-1"></i> Define New Attribute
                                    </button>
                                </div>
                            ) : (
                                <form onSubmit={handleAddExistingAttributeSubmit}>
                                    <div className="modal-body px-4">
                                        <div className="mb-3">
                                            <label className="form-label small fw-semibold">Select Organization Attribute *</label>
                                            <select 
                                                className="form-select" 
                                                value={selectedExistingAttrId} 
                                                onChange={(e) => setSelectedExistingAttrId(e.target.value)} 
                                                required
                                            >
                                                <option value="">Choose Attribute...</option>
                                                {attributes.filter(a => !assignedAttributeIds.includes(a.id)).map(a => (
                                                    <option key={a.id} value={a.id}>
                                                        {a.name} ({a.unit ? `${a.unit.name} (${a.unit.symbol})` : "NO UNIT"})
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                    <div className="modal-footer border-top-0 pb-4 px-4">
                                        <button type="button" className="btn btn-secondary px-3" onClick={() => setShowAddExistingAttrModal(false)}>Cancel</button>
                                        <button type="submit" className="btn btn-primary px-4" disabled={!selectedExistingAttrId}>
                                            Add Specification
                                        </button>
                                    </div>
                                </form>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* -------------------------------------------------------------
                MODAL: REMOVE ATTRIBUTE CONFIRMATION
                ------------------------------------------------------------- */}
            {attrToRemove && (
                <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: "rgba(0,0,0,0.5)", zIndex: 1150 }}>
                    <div className="modal-dialog modal-dialog-centered modal-sm">
                        <div className="modal-content shadow-lg border-0" style={{ borderRadius: "12px" }}>
                            <div className="modal-header border-bottom-0 pt-4 px-4">
                                <h5 className="modal-title fw-bold fs-6 text-danger d-flex align-items-center gap-2">
                                    <i className="fa-solid fa-triangle-exclamation"></i> Remove Specification?
                                </h5>
                                <button type="button" className="btn-close" onClick={() => setAttrToRemove(null)}></button>
                            </div>
                            <div className="modal-body px-4 py-2">
                                <p className="small mb-2">Remove <strong>"{attrToRemove.name}"</strong> from this product?</p>
                                <p className="text-muted small mb-0" style={{ fontSize: "0.75rem" }}>
                                    This will remove the specification from this product. It will not delete the Attribute Definition.
                                </p>
                            </div>
                            <div className="modal-footer border-top-0 pb-4 px-4 pt-3">
                                <button type="button" className="btn btn-sm btn-secondary px-3" onClick={() => setAttrToRemove(null)}>Cancel</button>
                                <button type="button" className="btn btn-sm btn-danger px-3" onClick={confirmRemoveAttribute}>Remove</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}



            {/* Brand Quick Add Modal */}
            {showBrandModal && (
                <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: "rgba(0,0,0,0.5)", zIndex: 1100 }}>
                    <div className="modal-dialog modal-dialog-centered">
                        <div className="modal-content shadow-lg border-0" style={{ borderRadius: "12px" }}>
                            <div className="modal-header border-bottom-0 pt-4 px-4">
                                <h5 className="modal-title fw-bold fs-5">Quick Add Brand</h5>
                                <button type="button" className="btn-close" onClick={() => setShowBrandModal(false)}></button>
                            </div>
                            <form onSubmit={handleQuickAddBrandSubmit}>
                                <div className="modal-body px-4">
                                    <div className="mb-3">
                                        <label className="form-label small fw-semibold">Brand Name *</label>
                                        <input 
                                            type="text" 
                                            className="form-control" 
                                            value={brandForm.name} 
                                            onChange={(e) => setBrandForm({ ...brandForm, name: e.target.value })} 
                                            required 
                                        />
                                    </div>
                                    <div className="mb-3">
                                        <label className="form-label small fw-semibold">Description</label>
                                        <textarea 
                                            className="form-control" 
                                            rows="3"
                                            value={brandForm.description}
                                            onChange={(e) => setBrandForm({ ...brandForm, description: e.target.value })}
                                        ></textarea>
                                    </div>
                                </div>
                                <div className="modal-footer border-top-0 pb-4 px-4">
                                    <button type="button" className="btn btn-secondary px-3" onClick={() => setShowBrandModal(false)}>Cancel</button>
                                    <button type="submit" className="btn btn-primary px-4" disabled={loading}>
                                        {loading ? <span className="spinner-border spinner-border-sm me-2"></span> : null}
                                        Save Brand
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* Manufacturer Quick Add Modal */}
            {showManufacturerModal && (
                <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: "rgba(0,0,0,0.5)", zIndex: 1100 }}>
                    <div className="modal-dialog modal-dialog-centered">
                        <div className="modal-content shadow-lg border-0" style={{ borderRadius: "12px" }}>
                            <div className="modal-header border-bottom-0 pt-4 px-4">
                                <h5 className="modal-title fw-bold fs-5">Quick Add Manufacturer</h5>
                                <button type="button" className="btn-close" onClick={() => setShowManufacturerModal(false)}></button>
                            </div>
                            <form onSubmit={handleQuickAddManufacturerSubmit}>
                                <div className="modal-body px-4">
                                    <div className="mb-3">
                                        <label className="form-label small fw-semibold">Legal Name *</label>
                                        <input 
                                            type="text" 
                                            className="form-control" 
                                            placeholder="e.g. Kajaria Ceramics Limited"
                                            value={manufacturerForm.legal_name || manufacturerForm.name || ""} 
                                            onChange={(e) => setManufacturerForm({ ...manufacturerForm, legal_name: e.target.value, name: e.target.value })} 
                                            required 
                                        />
                                    </div>
                                    <div className="mb-3">
                                        <label className="form-label small fw-semibold">Trade Name</label>
                                        <input 
                                            type="text" 
                                            className="form-control" 
                                            placeholder="e.g. Kajaria"
                                            value={manufacturerForm.trade_name || ""} 
                                            onChange={(e) => setManufacturerForm({ ...manufacturerForm, trade_name: e.target.value })} 
                                        />
                                    </div>
                                    <div className="mb-3">
                                        <label className="form-label small fw-semibold">GSTIN</label>
                                        <input 
                                            type="text" 
                                            className="form-control font-monospace" 
                                            placeholder="e.g. 27AAACK1234F1Z5"
                                            value={manufacturerForm.gstin || ""} 
                                            onChange={(e) => setManufacturerForm({ ...manufacturerForm, gstin: e.target.value })} 
                                        />
                                    </div>
                                    <div className="mb-3">
                                        <label className="form-label small fw-semibold">Phone Number</label>
                                        <input 
                                            type="text" 
                                            className="form-control font-monospace" 
                                            value={manufacturerForm.phone} 
                                            onChange={(e) => setManufacturerForm({ ...manufacturerForm, phone: e.target.value })} 
                                        />
                                    </div>
                                    <div className="mb-3">
                                        <label className="form-label small fw-semibold">Email Address</label>
                                        <input 
                                            type="email" 
                                            className="form-control" 
                                            value={manufacturerForm.email} 
                                            onChange={(e) => setManufacturerForm({ ...manufacturerForm, email: e.target.value })} 
                                        />
                                    </div>
                                    <div className="mb-3">
                                        <label className="form-label small fw-semibold">Website</label>
                                        <input 
                                            type="text" 
                                            className="form-control font-monospace" 
                                            value={manufacturerForm.website} 
                                            onChange={(e) => setManufacturerForm({ ...manufacturerForm, website: e.target.value })} 
                                        />
                                    </div>
                                    <div className="mb-3">
                                        <label className="form-label small fw-semibold">Address</label>
                                        <textarea 
                                            className="form-control" 
                                            rows="2"
                                            value={manufacturerForm.address}
                                            onChange={(e) => setManufacturerForm({ ...manufacturerForm, address: e.target.value })}
                                        ></textarea>
                                    </div>
                                </div>
                                <div className="modal-footer border-top-0 pb-4 px-4">
                                    <button type="button" className="btn btn-secondary px-3" onClick={() => setShowManufacturerModal(false)}>Cancel</button>
                                    <button type="submit" className="btn btn-primary px-4" disabled={loading}>
                                        {loading ? <span className="spinner-border spinner-border-sm me-2"></span> : null}
                                        Save Manufacturer
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
