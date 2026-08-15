import React, { useState, useEffect } from "react";
import axios from "axios";

export default function ProductEntry({ initialSubTab = "list" }) {
    // Navigation / View state
    // "list", "create", "detail", "edit", "families"
    const [view, setView] = useState(initialSubTab);
    const [selectedProduct, setSelectedProduct] = useState(null);

    // Lookup States
    const [categories, setCategories] = useState([]);
    const [brands, setBrands] = useState([]);
    const [units, setUnits] = useState([]);
    const [taxProfiles, setTaxProfiles] = useState([]);
    const [manufacturers, setManufacturers] = useState([]);
    const [attributes, setAttributes] = useState([]);
    const [families, setFamilies] = useState([]);
    
    // Core List State
    const [products, setProducts] = useState([]);
    const [familyProducts, setFamilyProducts] = useState([]); // for viewing specific family products
    const [selectedFamilyId, setSelectedFamilyId] = useState(""); // active family context

    // UX States
    const [loading, setLoading] = useState(false);
    const [detailLoading, setDetailLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);

    // Concept Info Toggles (Registry List View)
    const [showFamilyInfo, setShowFamilyInfo] = useState(false);
    const [showVariantInfo, setShowVariantInfo] = useState(false);

    // Concept Info Toggles (Form View)
    const [showFormFamilyInfo, setShowFormFamilyInfo] = useState(false);
    const [showFormVariantInfo, setShowFormVariantInfo] = useState(false);

    // Filter States
    const [filters, setFilters] = useState({
        search: "",
        category: "",
        brand: "",
        productType: "",
        status: "",
        family: ""
    });

    // Add/Edit Product Form State
    const [productForm, setProductForm] = useState({
        id: null,
        name: "",
        category_id: "",
        brand_id: "",
        manufacturer_id: "",
        product_family_id: "",
        sku: "",
        gtin: "",
        barcode: "",
        product_type: "STANDARD",
        physical_object: "SLAB",
        measurement_unit: "SQFT",
        cost_price: "",
        sale_price: "",
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

    // Modal forms
    const [showFamilyModal, setShowFamilyModal] = useState(false);
    const [familyForm, setFamilyForm] = useState({
        name: "",
        code: "",
        category_id: "",
        brand_id: "",
        tax_profile_id: "",
        description: ""
    });

    const [showAttrModal, setShowAttrModal] = useState(false);
    const [attributeForm, setAttributeForm] = useState({
        name: "",
        type: "string"
    });

    const [showCategoryModal, setShowCategoryModal] = useState(false);
    const [categoryForm, setCategoryForm] = useState({
        name: "",
        slug: "",
        parent_id: "",
        description: "",
        sort_order: "0"
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
            setTaxProfiles(data.tax_profiles || []);
            setManufacturers(data.manufacturers || []);
            setAttributes(data.attributes || []);
            setFamilies(data.families || []);

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
        setProductForm({
            id: null,
            name: "",
            category_id: categories[0]?.id?.toString() || "",
            brand_id: "",
            manufacturer_id: "",
            product_family_id: "",
            sku: "",
            gtin: "",
            barcode: "",
            product_type: "STANDARD",
            physical_object: "SLAB",
            measurement_unit: "SQFT",
            cost_price: "0",
            sale_price: "0",
            tax_profile_id: taxProfiles[0]?.id?.toString() || "",
            is_active: true,
            attributes: {}
        });
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
            const p = res.data;
            
            // Map attribute values to object key-value
            const mappedAttrs = {};
            if (p.attribute_values) {
                p.attribute_values.forEach(av => {
                    mappedAttrs[av.product_attribute_id] = av.value;
                });
            }

            setProductForm({
                id: p.id,
                name: p.name,
                category_id: p.family?.category_id?.toString() || "",
                brand_id: p.brand_id?.toString() || "",
                manufacturer_id: p.manufacturer_id?.toString() || "",
                product_family_id: p.product_family_id?.toString() || "",
                sku: p.sku,
                gtin: p.gtin || "",
                barcode: p.barcode || "",
                product_type: (p.inventory_behavior === 'SLAB') ? "MEASURED_MATERIAL" : "STANDARD",
                physical_object: p.physical_object || "SLAB",
                measurement_unit: p.measurement_unit || "SQFT",
                cost_price: p.cost_price,
                sale_price: p.sale_price,
                tax_profile_id: p.tax_profile_id?.toString() || "",
                is_active: !!p.is_active,
                attributes: mappedAttrs
            });
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
                cost_price: product.cost_price,
                sale_price: product.sale_price,
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

        // Map specifications to array structure expected by backend API
        const mappedAttributes = Object.entries(productForm.attributes)
            .filter(([_, val]) => val && val.trim() !== "")
            .map(([attrId, val]) => ({
                attribute_id: parseInt(attrId),
                value: val
            }));

        const submissionData = {
            ...productForm,
            cost_price: parseFloat(productForm.cost_price || 0),
            sale_price: parseFloat(productForm.sale_price || 0),
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
    // Inline Family Creation Handler
    // -------------------------------------------------------------
    const handleContextualFamilySubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setLoading(true);
        try {
            const token = localStorage.getItem("auth_token");
            const payload = {
                ...familyForm,
                // Prefill category and brand context if not manually chosen
                category_id: familyForm.category_id || productForm.category_id,
                brand_id: familyForm.brand_id || productForm.brand_id,
                tax_profile_id: familyForm.tax_profile_id || productForm.tax_profile_id
            };
            const response = await axios.post("/api/product/families", payload, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (response.data.success) {
                const newFam = response.data.data;
                // Reload lookups
                const res = await axios.get("/api/product/form-data", {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setFamilies(res.data.families || []);
                
                // Automatically select newly created family
                setProductForm(prev => ({
                    ...prev,
                    product_family_id: newFam.id.toString(),
                    category_id: newFam.category_id.toString(),
                    brand_id: newFam.brand_id ? newFam.brand_id.toString() : prev.brand_id
                }));

                setShowFamilyModal(false);
                setFamilyForm({
                    name: "",
                    code: "",
                    category_id: "",
                    brand_id: "",
                    tax_profile_id: "",
                    description: ""
                });
                setSuccess("New Product Family registered successfully!");
            }
        } catch (err) {
            setError(err.response?.data?.message || "Failed to create product family.");
        } finally {
            setLoading(false);
        }
    };

    // -------------------------------------------------------------
    // Inline Category, Brand, Manufacturer Quick Add Handlers
    // -------------------------------------------------------------
    const handleQuickAddCategorySubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setLoading(true);
        try {
            const token = localStorage.getItem("auth_token");
            const response = await axios.post("/api/categories-crud", {
                ...categoryForm,
                sort_order: parseInt(categoryForm.sort_order, 10) || 0,
                parent_id: categoryForm.parent_id ? parseInt(categoryForm.parent_id, 10) : null
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const newCat = response.data.category;
            // Refresh lookup
            const res = await axios.get("/api/product/form-data", {
                headers: { Authorization: `Bearer ${token}` }
            });
            setCategories(res.data.categories || []);
            setProductForm(prev => ({
                ...prev,
                category_id: newCat.id.toString()
            }));
            setShowCategoryModal(false);
            setCategoryForm({
                name: "",
                slug: "",
                parent_id: "",
                description: "",
                sort_order: "0"
            });
            setSuccess("Category created successfully!");
        } catch (err) {
            setError(err.response?.data?.message || "Failed to create category.");
        } finally {
            setLoading(false);
        }
    };

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
            const response = await axios.post("/api/manufacturers-crud", manufacturerForm, {
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
                name: "",
                phone: "",
                email: "",
                website: "",
                address: ""
            });
            setSuccess("Manufacturer created successfully!");
        } catch (err) {
            setError(err.response?.data?.message || "Failed to create manufacturer.");
        } finally {
            setLoading(false);
        }
    };

    // -------------------------------------------------------------
    // Define Custom Attribute Modal Handler
    // -------------------------------------------------------------
    const handleAttributeSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setLoading(true);
        try {
            const token = localStorage.getItem("auth_token");
            const response = await axios.post("/api/product/attributes", attributeForm, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (response.data.success) {
                setSuccess(`Custom specification attribute "${attributeForm.name}" registered successfully.`);
                setAttributeForm({ name: "", type: "string" });
                setShowAttrModal(false);
                await loadFormData();
            }
        } catch (err) {
            setError(err.response?.data?.message || "Failed to register custom attribute.");
        } finally {
            setLoading(false);
        }
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

        const matchesCategory = !filters.category || p.family?.category_id?.toString() === filters.category;
        const matchesBrand = !filters.brand || p.brand_id?.toString() === filters.brand;
        const matchesType = !filters.productType || 
            (filters.productType === 'MEASURED_MATERIAL' && p.inventory_behavior === 'SLAB') ||
            (filters.productType === 'STANDARD' && p.inventory_behavior !== 'SLAB');
        const matchesStatus = !filters.status || 
            (filters.status === 'ACTIVE' && p.is_active) ||
            (filters.status === 'INACTIVE' && !p.is_active);
        const matchesFamily = !filters.family || p.product_family_id?.toString() === filters.family;

        return matchesSearch && matchesCategory && matchesBrand && matchesType && matchesStatus && matchesFamily;
    });

    // Resolve active family name for Step 2 preview
    const activeFamilyObj = families.find(f => f.id.toString() === productForm.product_family_id);
    const activeFamilyName = activeFamilyObj ? activeFamilyObj.name : "System Resolved Family";

    return (
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
                    <button className="btn btn-sm btn-outline-primary d-flex align-items-center gap-1" onClick={() => setShowAttrModal(true)}>
                        <i className="fa-solid fa-tags"></i> Define Attribute
                    </button>
                    <button className="btn btn-sm btn-secondary d-flex align-items-center gap-1" onClick={() => { loadFormData(); loadProducts(); }}>
                        <i className="fa-solid fa-rotate"></i> Sync
                    </button>
                </div>
            </div>

            <div className="card-body pt-2">
                {/* Global Message Alerts */}
                {error && (
                    <div className="alert alert-danger d-flex align-items-center py-2 animate__animated animate__fadeIn border-0" role="alert" style={{ borderRadius: "8px" }}>
                        <i className="fa-solid fa-circle-exclamation me-2"></i>
                        <div>{error}</div>
                    </div>
                )}
                {success && (
                    <div className="alert alert-success d-flex align-items-center py-2 animate__animated animate__fadeIn border-0" role="alert" style={{ borderRadius: "8px" }}>
                        <i className="fa-solid fa-circle-check me-2"></i>
                        <div>{success}</div>
                    </div>
                )}

                {/* ---------------------------------------------------------
                    SUB-VIEW: LIST / PRODUCTS REGISTRY
                    --------------------------------------------------------- */}
                {view === "list" && (
                    <div>
                        {/* Concept Introductions (Educational Quick Toggles) */}
                        <div className="p-3 bg-white border border-light rounded-3 mb-4 shadow-sm">
                            <div className="d-flex align-items-center justify-content-between flex-wrap gap-2">
                                <div className="d-flex align-items-center gap-2">
                                    <span className="badge bg-primary-subtle text-primary font-monospace px-2 py-1">Concept Guide</span>
                                    <span className="text-muted small">New to catalog hierarchy? Click to explore:</span>
                                </div>
                                <div className="d-flex gap-2">
                                    <button 
                                        type="button" 
                                        className={`btn btn-xs ${showFamilyInfo ? 'btn-primary' : 'btn-outline-primary'} d-flex align-items-center gap-1`}
                                        onClick={() => { setShowFamilyInfo(!showFamilyInfo); setShowVariantInfo(false); }}
                                    >
                                        <i className="fa-solid fa-circle-info"></i> Product Family
                                    </button>
                                    <button 
                                        type="button" 
                                        className={`btn btn-xs ${showVariantInfo ? 'btn-secondary' : 'btn-outline-secondary'} d-flex align-items-center gap-1`}
                                        onClick={() => { setShowVariantInfo(!showVariantInfo); setShowFamilyInfo(false); }}
                                    >
                                        <i className="fa-solid fa-circle-info"></i> Product Variant
                                    </button>
                                </div>
                            </div>

                            {/* Dropdown details of concepts */}
                            {showFamilyInfo && (
                                <div className="mt-3 p-3 bg-primary-subtle text-primary rounded-3 border-0 animate__animated animate__fadeIn" style={{ fontSize: "0.85rem" }}>
                                    <strong className="d-block mb-1"><i className="fa-solid fa-folder-tree me-1"></i>Product Family (Level 1 Hierarchy)</strong>
                                    A group of related products belonging to the same product line or series. 
                                    Families share common categorizations, brand references, and basic tax profiles.
                                    <div className="mt-2 font-monospace text-dark-50">Example: <em>Kajaria Eternity</em>.</div>
                                    <button className="btn btn-xs btn-primary mt-2" onClick={() => setView("families")}>
                                        <i className="fa-solid fa-folder-open me-1"></i> View Families Registry
                                    </button>
                                </div>
                            )}

                            {showVariantInfo && (
                                <div className="mt-3 p-3 bg-secondary-subtle text-secondary rounded-3 border-0 animate__animated animate__fadeIn" style={{ fontSize: "0.85rem" }}>
                                    <strong className="d-block mb-1"><i className="fa-solid fa-boxes-stacked me-1"></i>Product Variant (Level 2 Hierarchy)</strong>
                                    A specific product model within a family. Variants represent actual sellable items and are distinguished by attributes like size, color, finish, thickness, or material code.
                                    <div className="mt-2 font-monospace text-dark-50">Example: <em>Eternity 600×600 White Glossy</em>.</div>
                                </div>
                            )}
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
                                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
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
                                <i className="fa-solid fa-plus"></i> Add Product
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
                                                        {p.family && (
                                                            <small className="text-muted d-block" style={{ fontSize: "0.8rem" }}>
                                                                Family: {p.family.name}
                                                            </small>
                                                        )}
                                                    </td>
                                                    <td>{p.family?.category?.name || <span className="text-muted">-</span>}</td>
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
                {(view === "create" || view === "edit") && (
                    <form onSubmit={handleProductSubmit}>
                        <div className="card border-0 p-4 rounded-3 shadow-sm bg-white mb-4">
                            <h5 className="fw-bold mb-4 text-dark d-flex align-items-center">
                                <i className="fa-solid fa-cube text-primary me-2"></i>
                                {productForm.id ? "Edit Product Specifications" : "Add Product Wizard"}
                            </h5>

                            {/* Section 1: Basic Information & Families Concept */}
                            <div className="mb-4">
                                <h6 className="text-primary fw-bold mb-3 border-bottom pb-2 d-flex align-items-center">
                                    1. Basic Information & Product Family
                                    <button 
                                        type="button" 
                                        className="btn btn-link text-muted p-0 ms-2"
                                        onClick={() => setShowFormFamilyInfo(!showFormFamilyInfo)}
                                        title="What is a Product Family?"
                                    >
                                        <i className="fa-solid fa-circle-info"></i>
                                    </button>
                                </h6>
                                
                                {showFormFamilyInfo && (
                                    <div className="alert alert-info bg-info-subtle text-info border-0 p-2.5 mb-3 small animate__animated animate__fadeIn">
                                        <strong>Product Family Selection:</strong> A product family represents a line or series of items (e.g. *Kajaria Eternity*). 
                                        Selecting a family inherits its category, brand, and default tax configurations automatically. Leave blank to auto-create a default family.
                                    </div>
                                )}

                                <div className="row mb-3 align-items-end">
                                    <div className="col-md-4">
                                        <label className="form-label small fw-semibold">Category *</label>
                                        <div className="input-group input-group-sm">
                                            <select 
                                                className="form-select" 
                                                value={productForm.category_id} 
                                                onChange={(e) => setProductForm({ ...productForm, category_id: e.target.value })} 
                                                required
                                            >
                                                <option value="">Select Category</option>
                                                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                            </select>
                                            <button 
                                                type="button" 
                                                className="btn btn-outline-primary"
                                                onClick={() => {
                                                    setCategoryForm(prev => ({
                                                        ...prev,
                                                        parent_id: ""
                                                    }));
                                                    setShowCategoryModal(true);
                                                }}
                                                title="Quick add Category"
                                            >
                                                <i className="fa-solid fa-plus"></i>
                                            </button>
                                        </div>
                                    </div>
                                    <div className="col-md-4">
                                        <label className="form-label small fw-semibold">Brand</label>
                                        <div className="input-group input-group-sm">
                                            <select 
                                                className="form-select" 
                                                value={productForm.brand_id} 
                                                onChange={(e) => setProductForm({ ...productForm, brand_id: e.target.value })}
                                            >
                                                <option value="">No Brand / Generic</option>
                                                {brands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                                            </select>
                                            <button 
                                                type="button" 
                                                className="btn btn-outline-primary"
                                                onClick={() => setShowBrandModal(true)}
                                                title="Quick add Brand"
                                            >
                                                <i className="fa-solid fa-plus"></i>
                                            </button>
                                        </div>
                                    </div>
                                    <div className="col-md-4">
                                        <label className="form-label small fw-semibold">Product Family (Optional)</label>
                                        <div className="input-group input-group-sm">
                                            <select 
                                                className="form-select" 
                                                value={productForm.product_family_id} 
                                                onChange={(e) => setProductForm({ ...productForm, product_family_id: e.target.value })}
                                            >
                                                <option value="">None (Auto-Resolve Default)</option>
                                                {families.map(f => <option key={f.id} value={f.id}>{f.name} ({f.code})</option>)}
                                            </select>
                                            <button 
                                                type="button" 
                                                className="btn btn-outline-primary"
                                                onClick={() => {
                                                    setFamilyForm(prev => ({
                                                        ...prev,
                                                        category_id: productForm.category_id,
                                                        brand_id: productForm.brand_id
                                                    }));
                                                    setShowFamilyModal(true);
                                                }}
                                            >
                                                <i className="fa-solid fa-plus"></i> New Family
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Section 2: Variant Details & Concepts */}
                            <div className="mb-4">
                                <h6 className="text-primary fw-bold mb-3 border-bottom pb-2 d-flex align-items-center">
                                    2. Product Name & Manufacturer
                                    <button 
                                        type="button" 
                                        className="btn btn-link text-muted p-0 ms-2"
                                        onClick={() => setShowFormVariantInfo(!showFormVariantInfo)}
                                        title="What is a Product Variant?"
                                    >
                                        <i className="fa-solid fa-circle-info"></i>
                                    </button>
                                </h6>

                                {showFormVariantInfo && (
                                    <div className="alert alert-info bg-info-subtle text-info border-0 p-2.5 mb-3 small animate__animated animate__fadeIn">
                                        <strong>Product Variant definition:</strong> A variant is a sellable catalog product configuration under a family. 
                                        For example, standard products usually show the family prefix followed by specific attribute details (e.g. *Eternity 600×600 White Glossy*).
                                    </div>
                                )}

                                <div className="row mb-3">
                                    <div className="col-md-6">
                                        <label className="form-label small fw-semibold">Product Variant Name *</label>
                                        <input 
                                            type="text" 
                                            className="form-control form-control-sm" 
                                            placeholder="e.g. Eternity 600x600 White Glossy" 
                                            value={productForm.name} 
                                            onChange={(e) => setProductForm({ ...productForm, name: e.target.value })} 
                                            required 
                                        />
                                        <div className="form-text text-muted font-monospace" style={{ fontSize: "0.75rem" }}>
                                            <strong>Hierarchy Map:</strong> Family: <span className="text-primary">{activeFamilyName}</span> ➔ Variant Name: <span className="text-dark fw-bold">{productForm.name || "(enter name)"}</span>
                                        </div>
                                    </div>
                                    <div className="col-md-6">
                                        <label className="form-label small fw-semibold">Manufacturer</label>
                                        <div className="input-group input-group-sm">
                                            <select 
                                                className="form-select" 
                                                value={productForm.manufacturer_id} 
                                                onChange={(e) => setProductForm({ ...productForm, manufacturer_id: e.target.value })}
                                            >
                                                <option value="">No Manufacturer</option>
                                                {manufacturers.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                                            </select>
                                            <button 
                                                type="button" 
                                                className="btn btn-outline-primary"
                                                onClick={() => setShowManufacturerModal(true)}
                                                title="Quick add Manufacturer"
                                            >
                                                <i className="fa-solid fa-plus"></i>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Section 3: Identification */}
                            <div className="mb-4">
                                <h6 className="text-primary fw-bold mb-3 border-bottom pb-2">3. Identification</h6>
                                <div className="row mb-3">
                                    <div className="col-md-4">
                                        <label className="form-label small fw-semibold">SKU / Item Code *</label>
                                        <input 
                                            type="text" 
                                            className="form-control form-control-sm" 
                                            placeholder="e.g. KAJ-600-WHT" 
                                            value={productForm.sku} 
                                            onChange={(e) => setProductForm({ ...productForm, sku: e.target.value.toUpperCase() })} 
                                            required 
                                        />
                                    </div>
                                    <div className="col-md-4">
                                        <label className="form-label small fw-semibold">GTIN / EAN</label>
                                        <input 
                                            type="text" 
                                            className="form-control form-control-sm" 
                                            placeholder="Universal barcode" 
                                            value={productForm.gtin} 
                                            onChange={(e) => setProductForm({ ...productForm, gtin: e.target.value })} 
                                        />
                                    </div>
                                    <div className="col-md-4">
                                        <label className="form-label small fw-semibold">Barcode</label>
                                        <input 
                                            type="text" 
                                            className="form-control form-control-sm" 
                                            placeholder="Scan code" 
                                            value={productForm.barcode} 
                                            onChange={(e) => setProductForm({ ...productForm, barcode: e.target.value })} 
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Section 4: Product Type */}
                            <div className="mb-4">
                                <h6 className="text-primary fw-bold mb-3 border-bottom pb-2">4. Product Type</h6>
                                <div className="row mb-3">
                                    <div className="col-md-4">
                                        <label className="form-label small fw-semibold">Product Type *</label>
                                        <select 
                                            className="form-select form-select-sm" 
                                            value={productForm.product_type} 
                                            onChange={(e) => setProductForm({ ...productForm, product_type: e.target.value })} 
                                            required
                                        >
                                            <option value="STANDARD">Standard</option>
                                            <option value="MEASURED_MATERIAL">Measured Material</option>
                                        </select>
                                    </div>
                                    {productForm.product_type === "MEASURED_MATERIAL" && (
                                        <>
                                            <div className="col-md-4">
                                                <label className="form-label small fw-semibold">Physical Object *</label>
                                                <select 
                                                    className="form-select form-select-sm" 
                                                    value={productForm.physical_object} 
                                                    onChange={(e) => setProductForm({ ...productForm, physical_object: e.target.value })} 
                                                    required
                                                >
                                                    <option value="SLAB">Slab</option>
                                                </select>
                                            </div>
                                            <div className="col-md-4">
                                                <label className="form-label small fw-semibold">Measurement Unit *</label>
                                                <select 
                                                    className="form-select form-select-sm" 
                                                    value={productForm.measurement_unit} 
                                                    onChange={(e) => setProductForm({ ...productForm, measurement_unit: e.target.value })} 
                                                    required
                                                >
                                                    <option value="SQFT">SQ.FT.</option>
                                                </select>
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>

                            {/* Section 5: Commercial Information */}
                            <div className="mb-4">
                                <h6 className="text-primary fw-bold mb-3 border-bottom pb-2">5. Commercial Information</h6>
                                <div className="row mb-3">
                                    <div className="col-md-4">
                                        <label className="form-label small fw-semibold">Purchase Price (₹) *</label>
                                        <input 
                                            type="number" 
                                            step="0.0001" 
                                            className="form-control form-control-sm" 
                                            placeholder="₹"
                                            value={productForm.cost_price} 
                                            onChange={(e) => setProductForm({ ...productForm, cost_price: e.target.value })} 
                                            required 
                                        />
                                    </div>
                                    <div className="col-md-4">
                                        <label className="form-label small fw-semibold">Sale Price (₹) *</label>
                                        <input 
                                            type="number" 
                                            step="0.0001" 
                                            className="form-control form-control-sm" 
                                            placeholder="₹"
                                            value={productForm.sale_price} 
                                            onChange={(e) => setProductForm({ ...productForm, sale_price: e.target.value })} 
                                            required 
                                        />
                                    </div>
                                    <div className="col-md-4">
                                        <label className="form-label small fw-semibold">Tax Profile *</label>
                                        <select 
                                            className="form-select form-select-sm" 
                                            value={productForm.tax_profile_id} 
                                            onChange={(e) => setProductForm({ ...productForm, tax_profile_id: e.target.value })} 
                                            required
                                        >
                                            <option value="">Select Tax Profile</option>
                                            {taxProfiles.map(tp => <option key={tp.id} value={tp.id}>{tp.name} ({tp.igst_rate}%)</option>)}
                                        </select>
                                    </div>
                                </div>
                                <div className="form-check mt-3">
                                    <input 
                                        type="checkbox" 
                                        className="form-check-input" 
                                        id="isActiveProd" 
                                        checked={productForm.is_active} 
                                        onChange={(e) => setProductForm({ ...productForm, is_active: e.target.checked })} 
                                    />
                                    <label className="form-check-label small fw-semibold text-dark" htmlFor="isActiveProd">Product is Active and Purchasable</label>
                                </div>
                            </div>

                            {/* Section 6: Dynamic Specifications */}
                            <div className="mb-4">
                                <h6 className="text-primary fw-bold mb-3 border-bottom pb-2">6. Specifications / Custom Attributes</h6>
                                {attributes.length === 0 ? (
                                    <p className="text-muted small">No custom specifications attributes registered. Define custom attributes from the top right button if needed.</p>
                                ) : (
                                    <div className="row g-3">
                                        {attributes.map(attr => (
                                            <div key={attr.id} className="col-md-4">
                                                <label className="form-label small">{attr.name}</label>
                                                <input 
                                                    type={attr.type === "number" ? "number" : "text"} 
                                                    className="form-control form-control-sm" 
                                                    placeholder={`Enter ${attr.name.toLowerCase()}`}
                                                    value={productForm.attributes[attr.id] || ""}
                                                    onChange={(e) => setProductForm({
                                                        ...productForm,
                                                        attributes: {
                                                            ...productForm.attributes,
                                                            [attr.id]: e.target.value
                                                        }
                                                    })}
                                                />
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div className="d-flex justify-content-end gap-2 mt-4 border-top pt-3">
                                <button type="button" className="btn btn-sm btn-secondary px-3" onClick={navigateToList}>Cancel</button>
                                <button type="submit" className="btn btn-sm btn-primary px-4" disabled={loading}>
                                    {loading ? <span className="spinner-border spinner-border-sm me-2"></span> : null}
                                    Save Product
                                </button>
                            </div>
                        </div>
                    </form>
                )}

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
                                                        <strong className="text-dark">{selectedProduct.family?.category?.name || "N/A"}</strong>
                                                    </div>
                                                    <div className="col-md-6 border-bottom pb-2">
                                                        <span className="text-muted d-block small">Brand</span>
                                                        <strong className="text-dark">{selectedProduct.brand?.name || "Generic / None"}</strong>
                                                    </div>
                                                    <div className="col-md-6 border-bottom pb-2">
                                                        <span className="text-muted d-block small">Manufacturer</span>
                                                        <strong className="text-dark">{selectedProduct.manufacturer?.name || "N/A"}</strong>
                                                    </div>
                                                    <div className="col-md-6 border-bottom pb-2">
                                                        <span className="text-muted d-block small">Product Family</span>
                                                        <strong className="text-dark">{selectedProduct.family ? `${selectedProduct.family.name} (${selectedProduct.family.code})` : "None"}</strong>
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
                                                <div className="row g-3">
                                                    <div className="col-md-6">
                                                        <div className="card bg-danger-subtle border-0 p-3 rounded-3 text-center">
                                                            <span className="text-muted small d-block mb-1">Default Purchase Cost</span>
                                                            <h3 className="fw-bold text-danger">₹{parseFloat(selectedProduct.cost_price).toFixed(2)}</h3>
                                                            <small className="text-muted">Master catalogue cost unit rate basis</small>
                                                        </div>
                                                    </div>
                                                    <div className="col-md-6">
                                                        <div className="card bg-success-subtle border-0 p-3 rounded-3 text-center">
                                                            <span className="text-muted small d-block mb-1">Default Sales Price</span>
                                                            <h3 className="fw-bold text-success">₹{parseFloat(selectedProduct.sale_price).toFixed(2)}</h3>
                                                            <small className="text-muted">Standard Catalogue list rate basis</small>
                                                        </div>
                                                    </div>
                                                    <div className="col-12 mt-4">
                                                        <div className="p-3 bg-light rounded-3">
                                                            <h6 className="fw-bold mb-3 small text-uppercase text-muted">Commercial Profile Specs</h6>
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

                {/* ---------------------------------------------------------
                    SUB-VIEW: FAMILY MANAGEMENT VIEW
                    --------------------------------------------------------- */}
                {view === "families" && (
                    <div>
                        <h5 className="fw-bold mb-4 text-dark">Product Family Manager</h5>
                        <div className="row">
                            <div className="col-md-5 mb-4">
                                <div className="card border-0 p-3 bg-white rounded-3 shadow-sm border border-light">
                                    <h6 className="fw-bold mb-3 border-bottom pb-2 text-dark">Registered Families ({families.length})</h6>
                                    <div className="list-group list-group-flush" style={{ maxHeight: "400px", overflowY: "auto" }}>
                                        {families.map(f => (
                                            <button 
                                                key={f.id} 
                                                type="button" 
                                                className={`list-group-item list-group-item-action border-light rounded-2 mb-1 py-2 ${selectedFamilyId === f.id ? 'active' : ''}`}
                                                onClick={() => handleViewFamilyProducts(f)}
                                            >
                                                <div className="d-flex w-100 justify-content-between align-items-center">
                                                    <strong className="mb-1">{f.name}</strong>
                                                    <span className="badge bg-secondary font-monospace" style={{ fontSize: "0.7rem" }}>{f.code}</span>
                                                </div>
                                                <small className="d-block text-muted">{f.category?.name} {f.brand ? `• ${f.brand.name}` : ''}</small>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className="col-md-7 mb-4">
                                <div className="card border-0 p-3 rounded-3 shadow-sm bg-white border border-light">
                                    <h6 className="fw-bold mb-3 border-bottom pb-2 text-dark">
                                        Products in Family: {selectedFamilyId ? families.find(f => f.id === selectedFamilyId)?.name : "Select a Family"}
                                    </h6>
                                    <div className="table-responsive">
                                        <table className="table align-middle border-0">
                                            <thead>
                                                <tr>
                                                    <th className="py-2 border-bottom-0 text-muted">Product Name</th>
                                                    <th className="py-2 border-bottom-0 text-muted">SKU</th>
                                                    <th className="py-2 border-bottom-0 text-muted">Pricing</th>
                                                    <th className="py-2 border-bottom-0 text-muted">Status</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {!selectedFamilyId ? (
                                                    <tr>
                                                        <td colSpan="4" className="text-center text-muted small py-4">
                                                            Click a family on the left to show its member products.
                                                        </td>
                                                    </tr>
                                                ) : familyProducts.length === 0 ? (
                                                    <tr>
                                                        <td colSpan="4" className="text-center text-muted small py-4">
                                                            No products defined within this family context.
                                                        </td>
                                                    </tr>
                                                ) : (
                                                    familyProducts.map(p => (
                                                        <tr key={p.id}>
                                                            <td><strong>{p.name}</strong></td>
                                                            <td><span className="badge bg-light text-dark font-monospace border">{p.sku}</span></td>
                                                            <td>
                                                                <div className="small">Sale: ₹{parseFloat(p.sale_price).toFixed(2)}</div>
                                                            </td>
                                                            <td>
                                                                {p.is_active ? (
                                                                    <span className="badge bg-success-subtle text-success">Active</span>
                                                                ) : (
                                                                    <span className="badge bg-danger-subtle text-danger">Inactive</span>
                                                                )}
                                                            </td>
                                                        </tr>
                                                    ))
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* -------------------------------------------------------------
                MODAL: CONTEXTUAL PRODUCT FAMILY CREATION
                ------------------------------------------------------------- */}
            {showFamilyModal && (
                <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: "rgba(0,0,0,0.5)", zIndex: 1100 }}>
                    <div className="modal-dialog modal-dialog-centered">
                        <div className="modal-content shadow-lg border-0" style={{ borderRadius: "12px" }}>
                            <div className="modal-header border-bottom-0 pt-4 px-4">
                                <h5 className="modal-title fw-bold fs-5">Create Product Family</h5>
                                <button type="button" className="btn-close" onClick={() => setShowFamilyModal(false)}></button>
                            </div>
                            <form onSubmit={handleContextualFamilySubmit}>
                                <div className="modal-body px-4">
                                    <div className="mb-3">
                                        <label className="form-label small fw-semibold">Family Name *</label>
                                        <input 
                                            type="text" 
                                            className="form-control" 
                                            placeholder="e.g. Eternity Series" 
                                            value={familyForm.name} 
                                            onChange={(e) => setFamilyForm({ ...familyForm, name: e.target.value })} 
                                            required 
                                        />
                                    </div>
                                    <div className="mb-3">
                                        <label className="form-label small fw-semibold">Unique Code / Prefix *</label>
                                        <input 
                                            type="text" 
                                            className="form-control" 
                                            placeholder="e.g. KAJ-ETERN" 
                                            value={familyForm.code} 
                                            onChange={(e) => setFamilyForm({ ...familyForm, code: e.target.value.toUpperCase() })} 
                                            required 
                                        />
                                    </div>
                                    <div className="mb-3">
                                        <label className="form-label small fw-semibold">Description</label>
                                        <textarea 
                                            className="form-control" 
                                            rows="3" 
                                            placeholder="Details, series notes..."
                                            value={familyForm.description}
                                            onChange={(e) => setFamilyForm({ ...familyForm, description: e.target.value })}
                                        ></textarea>
                                    </div>
                                </div>
                                <div className="modal-footer border-top-0 pb-4 px-4">
                                    <button type="button" className="btn btn-secondary px-3" onClick={() => setShowFamilyModal(false)}>Cancel</button>
                                    <button type="submit" className="btn btn-primary px-4" disabled={loading}>
                                        {loading ? <span className="spinner-border spinner-border-sm me-2"></span> : null}
                                        Create Family
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

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
                                </div>
                                <div className="modal-footer border-top-0 pb-4 px-4">
                                    <button type="button" className="btn btn-secondary px-3" onClick={() => setShowAttrModal(false)}>Cancel</button>
                                    <button type="submit" className="btn btn-primary px-4" disabled={loading}>
                                        {loading ? <span className="spinner-border spinner-border-sm me-2"></span> : null}
                                        Define
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* Category Quick Add Modal */}
            {showCategoryModal && (
                <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: "rgba(0,0,0,0.5)", zIndex: 1100 }}>
                    <div className="modal-dialog modal-dialog-centered">
                        <div className="modal-content shadow-lg border-0" style={{ borderRadius: "12px" }}>
                            <div className="modal-header border-bottom-0 pt-4 px-4">
                                <h5 className="modal-title fw-bold fs-5">Quick Add Category</h5>
                                <button type="button" className="btn-close" onClick={() => setShowCategoryModal(false)}></button>
                            </div>
                            <form onSubmit={handleQuickAddCategorySubmit}>
                                <div className="modal-body px-4">
                                    <div className="mb-3">
                                        <label className="form-label small fw-semibold">Category Name *</label>
                                        <input 
                                            type="text" 
                                            className="form-control" 
                                            value={categoryForm.name} 
                                            onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })} 
                                            required 
                                        />
                                    </div>
                                    <div className="mb-3">
                                        <label className="form-label small fw-semibold">Parent Category</label>
                                        <select 
                                            className="form-select" 
                                            value={categoryForm.parent_id} 
                                            onChange={(e) => setCategoryForm({ ...categoryForm, parent_id: e.target.value })}
                                        >
                                            <option value="">None (Top-Level)</option>
                                            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                        </select>
                                    </div>
                                    <div className="mb-3">
                                        <label className="form-label small fw-semibold">Description</label>
                                        <textarea 
                                            className="form-control" 
                                            rows="3"
                                            value={categoryForm.description}
                                            onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })}
                                        ></textarea>
                                    </div>
                                </div>
                                <div className="modal-footer border-top-0 pb-4 px-4">
                                    <button type="button" className="btn btn-secondary px-3" onClick={() => setShowCategoryModal(false)}>Cancel</button>
                                    <button type="submit" className="btn btn-primary px-4" disabled={loading}>
                                        {loading ? <span className="spinner-border spinner-border-sm me-2"></span> : null}
                                        Save Category
                                    </button>
                                </div>
                            </form>
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
                                        <label className="form-label small fw-semibold">Manufacturer Name *</label>
                                        <input 
                                            type="text" 
                                            className="form-control" 
                                            value={manufacturerForm.name} 
                                            onChange={(e) => setManufacturerForm({ ...manufacturerForm, name: e.target.value })} 
                                            required 
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
        </div>
    );
}
