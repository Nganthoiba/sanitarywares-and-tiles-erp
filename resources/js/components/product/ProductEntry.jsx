import React, { useState, useEffect } from "react";
import axios from "axios";

export default function ProductEntry() {
    const [activeTab, setActiveTab] = useState("variants-list"); // variants-list, families-list, add-family, add-variant
    
    // Lookups
    const [categories, setCategories] = useState([]);
    const [brands, setBrands] = useState([]);
    const [units, setUnits] = useState([]);
    const [taxProfiles, setTaxProfiles] = useState([]);
    const [manufacturers, setManufacturers] = useState([]);
    const [attributes, setAttributes] = useState([]);
    const [families, setFamilies] = useState([]);
    const [variants, setVariants] = useState([]);
    const [behaviors, setBehaviors] = useState([]);

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);

    // Form States
    const [familyForm, setFamilyForm] = useState({
        name: "",
        code: "",
        category_id: "",
        brand_id: "",
        tax_profile_id: "",
        description: ""
    });

    const [variantForm, setVariantForm] = useState({
        product_family_id: "",
        name: "",
        sku: "",
        gtin: "",
        barcode: "",
        inventory_behavior: "STANDARD",
        purchase_unit_id: "",
        sales_unit_id: "",
        base_unit_id: "",
        tax_profile_id: "",
        brand_id: "",
        manufacturer_id: "",
        cost_price: 0,
        sale_price: 0,
        is_active: true,
        attributes: {} // key is attribute_id, value is string
    });

    const [attributeForm, setAttributeForm] = useState({
        name: "",
        type: "string"
    });

    const [showAttrModal, setShowAttrModal] = useState(false);

    // Load Form Data
    const loadFormData = async () => {
        setLoading(true);
        setError(null);
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
            setBehaviors(data.inventory_behaviors || []);

            // Set default dropdowns
            if (data.categories.length > 0) setFamilyForm(prev => ({ ...prev, category_id: data.categories[0].id.toString() }));
            if (data.tax_profiles.length > 0) {
                setFamilyForm(prev => ({ ...prev, tax_profile_id: data.tax_profiles[0].id.toString() }));
                setVariantForm(prev => ({ ...prev, tax_profile_id: data.tax_profiles[0].id.toString() }));
            }
            if (data.units.length > 0) {
                setVariantForm(prev => ({ 
                    ...prev, 
                    purchase_unit_id: data.units[0].id.toString(),
                    sales_unit_id: data.units[0].id.toString(),
                    base_unit_id: data.units[0].id.toString()
                }));
            }
            if (data.families.length > 0) {
                setVariantForm(prev => ({ ...prev, product_family_id: data.families[0].id.toString() }));
            }
        } catch (err) {
            setError(err.response?.data?.message || "Failed to load product lookups.");
        } finally {
            setLoading(false);
        }
    };

    // Load Variants
    const loadVariants = async () => {
        setLoading(true);
        setError(null);
        try {
            const token = localStorage.getItem("auth_token");
            const response = await axios.get("/api/product/variants", {
                headers: { Authorization: `Bearer ${token}` }
            });
            setVariants(response.data || []);
        } catch (err) {
            setError(err.response?.data?.message || "Failed to load variants.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadFormData();
        loadVariants();
    }, []);

    // Handle Family Creation
    const handleFamilySubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setSuccess(null);
        setLoading(true);
        try {
            const token = localStorage.getItem("auth_token");
            const response = await axios.post("/api/product/families", familyForm, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (response.data.success) {
                setSuccess(response.data.message || "Family created successfully!");
                setFamilyForm({
                    name: "",
                    code: "",
                    category_id: categories[0]?.id?.toString() || "",
                    brand_id: "",
                    tax_profile_id: taxProfiles[0]?.id?.toString() || "",
                    description: ""
                });
                // Reload lookup data
                await loadFormData();
                setActiveTab("families-list");
            }
        } catch (err) {
            setError(err.response?.data?.message || "Failed to create product family.");
        } finally {
            setLoading(false);
        }
    };

    // Handle Variant Creation
    const handleVariantSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setSuccess(null);
        setLoading(true);

        // Map attribute object to backend expected format
        const mappedAttributes = Object.entries(variantForm.attributes)
            .filter(([_, val]) => val.trim() !== "")
            .map(([attrId, val]) => ({
                attribute_id: parseInt(attrId),
                value: val
            }));

        const submissionData = {
            ...variantForm,
            cost_price: parseFloat(variantForm.cost_price),
            sale_price: parseFloat(variantForm.sale_price),
            attributes: mappedAttributes
        };

        try {
            const token = localStorage.getItem("auth_token");
            const response = await axios.post("/api/product/variants", submissionData, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (response.data.success) {
                setSuccess(response.data.message || "Variant created successfully!");
                setVariantForm({
                    product_family_id: families[0]?.id?.toString() || "",
                    name: "",
                    sku: "",
                    gtin: "",
                    barcode: "",
                    inventory_behavior: "STANDARD",
                    purchase_unit_id: units[0]?.id?.toString() || "",
                    sales_unit_id: units[0]?.id?.toString() || "",
                    base_unit_id: units[0]?.id?.toString() || "",
                    tax_profile_id: taxProfiles[0]?.id?.toString() || "",
                    brand_id: "",
                    manufacturer_id: "",
                    cost_price: 0,
                    sale_price: 0,
                    is_active: true,
                    attributes: {}
                });
                await loadVariants();
                setActiveTab("variants-list");
            }
        } catch (err) {
            setError(err.response?.data?.message || "Failed to create product variant.");
        } finally {
            setLoading(false);
        }
    };

    // Handle Custom Attribute definition
    const handleAttributeSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setSuccess(null);
        setLoading(true);
        try {
            const token = localStorage.getItem("auth_token");
            const response = await axios.post("/api/product/attributes", attributeForm, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (response.data.success) {
                setSuccess("New attribute defined successfully!");
                setAttributeForm({ name: "", type: "string" });
                setShowAttrModal(false);
                await loadFormData();
            }
        } catch (err) {
            setError(err.response?.data?.message || "Failed to define custom attribute.");
        } finally {
            setLoading(false);
        }
    };

    // Sync variant attributes when product family changes (to copy default family specs if any)
    const handleFamilyChange = (familyId) => {
        const selectedFamily = families.find(f => f.id.toString() === familyId);
        setVariantForm(prev => ({
            ...prev,
            product_family_id: familyId,
            brand_id: selectedFamily?.brand_id?.toString() || "",
            tax_profile_id: selectedFamily?.tax_profile_id?.toString() || ""
        }));
    };

    return (
        <div className="card shadow-sm border-light">
            <div className="card-header bg-white d-flex justify-content-between align-items-center py-3">
                <div>
                    <h4 className="mb-0 fw-bold d-flex align-items-center">
                        <i className="fa-solid fa-cube text-primary me-2"></i>
                        Product Catalog & Specification Engine
                    </h4>
                    <p className="text-muted small mb-0 font-monospace">Manage structural hierarchy, variants, and dimensions</p>
                </div>
                <div className="d-flex gap-2">
                    <button className="btn btn-sm btn-outline-primary d-flex align-items-center gap-1" onClick={() => setShowAttrModal(true)}>
                        <i className="fa-solid fa-tags"></i> Define Custom Attribute
                    </button>
                    <button className="btn btn-sm btn-secondary d-flex align-items-center gap-1" onClick={() => { loadFormData(); loadVariants(); }}>
                        <i className="fa-solid fa-rotate"></i> Sync
                    </button>
                </div>
            </div>

            <div className="card-body">
                {/* Error & Success Messages */}
                {error && (
                    <div className="alert alert-danger d-flex align-items-center py-2 animate__animated animate__fadeIn" role="alert">
                        <i className="fa-solid fa-circle-exclamation me-2"></i>
                        <div>{error}</div>
                    </div>
                )}
                {success && (
                    <div className="alert alert-success d-flex align-items-center py-2 animate__animated animate__fadeIn" role="alert">
                        <i className="fa-solid fa-circle-check me-2"></i>
                        <div>{success}</div>
                    </div>
                )}

                {/* Elegant Tabs Navigation */}
                <ul className="nav nav-tabs mb-4">
                    <li className="nav-item">
                        <button className={`nav-link fw-semibold ${activeTab === "variants-list" ? "active text-primary border-primary border-bottom-0" : "text-secondary"}`} onClick={() => setActiveTab("variants-list")}>
                            <i className="fa-solid fa-list me-1"></i> Product Variants ({variants.length})
                        </button>
                    </li>
                    <li className="nav-item">
                        <button className={`nav-link fw-semibold ${activeTab === "families-list" ? "active text-primary border-primary border-bottom-0" : "text-secondary"}`} onClick={() => setActiveTab("families-list")}>
                            <i className="fa-solid fa-folder-tree me-1"></i> Product Families ({families.length})
                        </button>
                    </li>
                    <li className="nav-item">
                        <button className={`nav-link fw-semibold ${activeTab === "add-variant" ? "active text-primary border-primary border-bottom-0" : "text-secondary"}`} onClick={() => setActiveTab("add-variant")}>
                            <i className="fa-solid fa-plus me-1"></i> Create Variant
                        </button>
                    </li>
                    <li className="nav-item">
                        <button className={`nav-link fw-semibold ${activeTab === "add-family" ? "active text-primary border-primary border-bottom-0" : "text-secondary"}`} onClick={() => setActiveTab("add-family")}>
                            <i className="fa-solid fa-folder-plus me-1"></i> Create Family
                        </button>
                    </li>
                </ul>

                {/* Variants List View */}
                {activeTab === "variants-list" && (
                    <div className="table-responsive">
                        {loading && variants.length === 0 ? (
                            <div className="text-center py-4"><span className="spinner-border spinner-border-sm text-primary"></span> Loading catalog...</div>
                        ) : (
                            <table className="table table-hover align-middle border-top border-light">
                                <thead>
                                    <tr>
                                        <th>Variant Spec</th>
                                        <th>SKU / Barcode</th>
                                        <th>Product Family</th>
                                        <th>Behavior</th>
                                        <th>Standard Units</th>
                                        <th>Pricing (INR)</th>
                                        <th>Custom Specs</th>
                                        <th>Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {variants.length === 0 ? (
                                        <tr><td colSpan="8" className="text-center text-muted py-4">No product variants found. Create your first variant!</td></tr>
                                    ) : (
                                        variants.map((v) => (
                                            <tr key={v.id}>
                                                <td>
                                                    <div className="fw-bold">{v.name}</div>
                                                    <small className="text-muted font-monospace" style={{ fontSize: "0.75rem" }}>ID: {v.id}</small>
                                                </td>
                                                <td>
                                                    <span className="badge bg-primary-subtle text-primary border-light">{v.sku}</span>
                                                    {v.barcode && <div className="text-muted small mt-1 font-monospace"><i className="fa-solid fa-barcode"></i> {v.barcode}</div>}
                                                </td>
                                                <td>{v.family?.name || "N/A"}</td>
                                                <td>
                                                    <span className="badge bg-secondary-subtle text-secondary font-monospace" style={{ fontSize: "0.75rem" }}>{v.inventory_behavior}</span>
                                                </td>
                                                <td>
                                                    <div className="small">Purchase: <strong>{v.purchase_unit?.symbol}</strong></div>
                                                    <div className="small">Sales: <strong>{v.sales_unit?.symbol}</strong></div>
                                                    <div className="small">Base: <strong>{v.base_unit?.symbol}</strong></div>
                                                </td>
                                                <td>
                                                    <div className="text-danger small">Cost: ₹{parseFloat(v.cost_price).toFixed(2)}</div>
                                                    <div className="text-success small fw-bold">Sale: ₹{parseFloat(v.sale_price).toFixed(2)}</div>
                                                </td>
                                                <td>
                                                    {v.attribute_values?.length > 0 ? (
                                                        v.attribute_values.map((av) => (
                                                            <div key={av.id} className="small">
                                                                <span className="text-muted">{av.attribute?.name}:</span> <strong>{av.value}</strong>
                                                            </div>
                                                        ))
                                                    ) : (
                                                        <span className="text-muted small">-</span>
                                                    )}
                                                </td>
                                                <td>
                                                    {v.is_active ? (
                                                        <span className="badge bg-success-subtle text-success border border-success-subtle px-2 py-1">Active</span>
                                                    ) : (
                                                        <span className="badge bg-danger-subtle text-danger border border-danger-subtle px-2 py-1">Inactive</span>
                                                    )}
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        )}
                    </div>
                )}

                {/* Families List View */}
                {activeTab === "families-list" && (
                    <div className="table-responsive">
                        <table className="table table-hover align-middle border-top border-light">
                            <thead>
                                <tr>
                                    <th>Code</th>
                                    <th>Family Name</th>
                                    <th>Category</th>
                                    <th>Brand</th>
                                    <th>Tax Profile</th>
                                    <th>Description</th>
                                </tr>
                            </thead>
                            <tbody>
                                {families.length === 0 ? (
                                    <tr><td colSpan="6" className="text-center text-muted py-4">No product families found.</td></tr>
                                ) : (
                                    families.map((f) => (
                                        <tr key={f.id}>
                                            <td><span className="badge bg-dark-subtle text-dark font-monospace">{f.code}</span></td>
                                            <td className="fw-bold">{f.name}</td>
                                            <td>{f.category?.name}</td>
                                            <td>{f.brand?.name || <span className="text-muted">-</span>}</td>
                                            <td>{f.tax_profile?.name ? `${f.tax_profile.name} (${f.tax_profile.igst_rate}%)` : <span className="text-muted">-</span>}</td>
                                            <td className="small text-muted">{f.description || <span className="text-muted italic">No description</span>}</td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Add Product Family Form */}
                {activeTab === "add-family" && (
                    <form onSubmit={handleFamilySubmit} className="mx-auto" style={{ maxWidth: "600px" }}>
                        <div className="card border-light bg-light p-4 rounded-3">
                            <h5 className="fw-bold mb-4"><i className="fa-solid fa-folder-plus text-primary me-2"></i>New Product Family</h5>
                            
                            <div className="mb-3">
                                <label className="form-label small fw-semibold">Family Name *</label>
                                <input type="text" className="form-control" placeholder="e.g. Kajaria Glazed Vitrified" value={familyForm.name} onChange={(e) => setFamilyForm({ ...familyForm, name: e.target.value })} required />
                            </div>

                            <div className="row mb-3">
                                <div className="col-md-6">
                                    <label className="form-label small fw-semibold">Unique Code / Prefix *</label>
                                    <input type="text" className="form-control" placeholder="e.g. KAJ-VIT" value={familyForm.code} onChange={(e) => setFamilyForm({ ...familyForm, code: e.target.value.toUpperCase() })} required />
                                </div>
                                <div className="col-md-6">
                                    <label className="form-label small fw-semibold">Category *</label>
                                    <select className="form-select" value={familyForm.category_id} onChange={(e) => setFamilyForm({ ...familyForm, category_id: e.target.value })} required>
                                        <option value="">Select Category</option>
                                        {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                                    </select>
                                </div>
                            </div>

                            <div className="row mb-3">
                                <div className="col-md-6">
                                    <label className="form-label small fw-semibold">Brand</label>
                                    <select className="form-select" value={familyForm.brand_id} onChange={(e) => setFamilyForm({ ...familyForm, brand_id: e.target.value })}>
                                        <option value="">Generic / No Brand</option>
                                        {brands.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
                                    </select>
                                </div>
                                <div className="col-md-6">
                                    <label className="form-label small fw-semibold">Tax Profile</label>
                                    <select className="form-select" value={familyForm.tax_profile_id} onChange={(e) => setFamilyForm({ ...familyForm, tax_profile_id: e.target.value })}>
                                        <option value="">No Tax Profile</option>
                                        {taxProfiles.map((tp) => <option key={tp.id} value={tp.id}>{tp.name} ({tp.igst_rate}%)</option>)}
                                    </select>
                                </div>
                            </div>

                            <div className="mb-3">
                                <label className="form-label small fw-semibold">Description</label>
                                <textarea className="form-control" rows="3" placeholder="Additional specifications, series details, notes..." value={familyForm.description} onChange={(e) => setFamilyForm({ ...familyForm, description: e.target.value })}></textarea>
                            </div>

                            <div className="d-flex justify-content-end gap-2 mt-4">
                                <button type="button" className="btn btn-secondary px-3" onClick={() => setActiveTab("families-list")}>Cancel</button>
                                <button type="submit" className="btn btn-primary px-4" disabled={loading}>
                                    {loading ? <span className="spinner-border spinner-border-sm me-2"></span> : null} Save Family
                                </button>
                            </div>
                        </div>
                    </form>
                )}

                {/* Add Product Variant Form */}
                {activeTab === "add-variant" && (
                    <form onSubmit={handleVariantSubmit}>
                        <div className="card border-light bg-light p-4 rounded-3">
                            <h5 className="fw-bold mb-4"><i className="fa-solid fa-cube text-primary me-2"></i>New Product Variant</h5>
                            
                            <div className="row mb-3">
                                <div className="col-md-6">
                                    <label className="form-label small fw-semibold">Product Family *</label>
                                    <select className="form-select" value={variantForm.product_family_id} onChange={(e) => handleFamilyChange(e.target.value)} required>
                                        <option value="">Select Family</option>
                                        {families.map((f) => <option key={f.id} value={f.id}>{f.name} ({f.code})</option>)}
                                    </select>
                                </div>
                                <div className="col-md-6">
                                    <label className="form-label small fw-semibold">Variant Name *</label>
                                    <input type="text" className="form-control" placeholder="e.g. Kajaria Royal Gold 600x600" value={variantForm.name} onChange={(e) => setVariantForm({ ...variantForm, name: e.target.value })} required />
                                </div>
                            </div>

                            <div className="row mb-3">
                                <div className="col-md-4">
                                    <label className="form-label small fw-semibold">SKU / Item Code *</label>
                                    <input type="text" className="form-control" placeholder="e.g. KAJ-ROY-GLD" value={variantForm.sku} onChange={(e) => setVariantForm({ ...variantForm, sku: e.target.value.toUpperCase() })} required />
                                </div>
                                <div className="col-md-4">
                                    <label className="form-label small fw-semibold">GTIN / EAN</label>
                                    <input type="text" className="form-control" placeholder="e.g. 890123456789" value={variantForm.gtin} onChange={(e) => setVariantForm({ ...variantForm, gtin: e.target.value })} />
                                </div>
                                <div className="col-md-4">
                                    <label className="form-label small fw-semibold">Barcode</label>
                                    <input type="text" className="form-control" placeholder="UPC / Scan Code" value={variantForm.barcode} onChange={(e) => setVariantForm({ ...variantForm, barcode: e.target.value })} />
                                </div>
                            </div>

                            <div className="row mb-3">
                                <div className="col-md-4">
                                    <label className="form-label small fw-semibold">Purchase Unit *</label>
                                    <select className="form-select" value={variantForm.purchase_unit_id} onChange={(e) => setVariantForm({ ...variantForm, purchase_unit_id: e.target.value })} required>
                                        {units.map((u) => <option key={u.id} value={u.id}>{u.name} ({u.symbol})</option>)}
                                    </select>
                                </div>
                                <div className="col-md-4">
                                    <label className="form-label small fw-semibold">Sales Unit *</label>
                                    <select className="form-select" value={variantForm.sales_unit_id} onChange={(e) => setVariantForm({ ...variantForm, sales_unit_id: e.target.value })} required>
                                        {units.map((u) => <option key={u.id} value={u.id}>{u.name} ({u.symbol})</option>)}
                                    </select>
                                </div>
                                <div className="col-md-4">
                                    <label className="form-label small fw-semibold">Base Accounting Unit *</label>
                                    <select className="form-select" value={variantForm.base_unit_id} onChange={(e) => setVariantForm({ ...variantForm, base_unit_id: e.target.value })} required>
                                        {units.map((u) => <option key={u.id} value={u.id}>{u.name} ({u.symbol})</option>)}
                                    </select>
                                </div>
                            </div>

                            <div className="row mb-3">
                                <div className="col-md-4">
                                    <label className="form-label small fw-semibold">Inventory Behavior Model *</label>
                                    <select className="form-select" value={variantForm.inventory_behavior} onChange={(e) => setVariantForm({ ...variantForm, inventory_behavior: e.target.value })} required>
                                        {behaviors.map((b) => <option key={b} value={b}>{b}</option>)}
                                    </select>
                                </div>
                                <div className="col-md-4">
                                    <label className="form-label small fw-semibold">Tax Profile *</label>
                                    <select className="form-select" value={variantForm.tax_profile_id} onChange={(e) => setVariantForm({ ...variantForm, tax_profile_id: e.target.value })} required>
                                        {taxProfiles.map((tp) => <option key={tp.id} value={tp.id}>{tp.name} ({tp.igst_rate}%)</option>)}
                                    </select>
                                </div>
                                <div className="col-md-4">
                                    <label className="form-label small fw-semibold">Brand Override</label>
                                    <select className="form-select" value={variantForm.brand_id} onChange={(e) => setVariantForm({ ...variantForm, brand_id: e.target.value })}>
                                        <option value="">Inherit from Family</option>
                                        {brands.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
                                    </select>
                                </div>
                            </div>

                            <div className="row mb-3">
                                <div className="col-md-4">
                                    <label className="form-label small fw-semibold">Manufacturer</label>
                                    <select className="form-select" value={variantForm.manufacturer_id} onChange={(e) => setVariantForm({ ...variantForm, manufacturer_id: e.target.value })}>
                                        <option value="">No Manufacturer</option>
                                        {manufacturers.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
                                    </select>
                                </div>
                                <div className="col-md-4">
                                    <label className="form-label small fw-semibold">Purchase Price (Cost) (₹) *</label>
                                    <input type="number" step="0.0001" className="form-control" value={variantForm.cost_price} onChange={(e) => setVariantForm({ ...variantForm, cost_price: e.target.value })} required />
                                </div>
                                <div className="col-md-4">
                                    <label className="form-label small fw-semibold">Sales Retail Price (₹) *</label>
                                    <input type="number" step="0.0001" className="form-control" value={variantForm.sale_price} onChange={(e) => setVariantForm({ ...variantForm, sale_price: e.target.value })} required />
                                </div>
                            </div>

                            <div className="form-check mb-4">
                                <input type="checkbox" className="form-check-input" id="isActiveCheck" checked={variantForm.is_active} onChange={(e) => setVariantForm({ ...variantForm, is_active: e.target.checked })} />
                                <label className="form-check-label small fw-semibold" htmlFor="isActiveCheck">Catalog Variant is Active and Purchasable</label>
                            </div>

                            {/* Dynamic Custom Attributes Section */}
                            <div className="border-top pt-4 mt-4">
                                <div className="d-flex justify-content-between align-items-center mb-3">
                                    <h6 className="fw-bold mb-0"><i className="fa-solid fa-sliders text-secondary me-2"></i>Product Physical Specifications / Attributes</h6>
                                    <button type="button" className="btn btn-xs btn-outline-secondary" onClick={() => setShowAttrModal(true)}>+ Define Custom Attribute</button>
                                </div>
                                {attributes.length === 0 ? (
                                    <p className="text-muted small">No custom attributes defined yet. Create some to specify dimensions, finish types, slab thickness, etc.</p>
                                ) : (
                                    <div className="row g-3">
                                        {attributes.map((attr) => (
                                            <div key={attr.id} className="col-md-4">
                                                <label className="form-label small">{attr.name} ({attr.type})</label>
                                                <input 
                                                    type={attr.type === "number" ? "number" : "text"} 
                                                    className="form-control" 
                                                    placeholder={`Enter ${attr.name.toLowerCase()}`}
                                                    value={variantForm.attributes[attr.id] || ""}
                                                    onChange={(e) => setVariantForm({
                                                        ...variantForm,
                                                        attributes: {
                                                            ...variantForm.attributes,
                                                            [attr.id]: e.target.value
                                                        }
                                                    })}
                                                />
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div className="d-flex justify-content-end gap-2 mt-5">
                                <button type="button" className="btn btn-secondary px-3" onClick={() => setActiveTab("variants-list")}>Cancel</button>
                                <button type="submit" className="btn btn-primary px-4" disabled={loading}>
                                    {loading ? <span className="spinner-border spinner-border-sm me-2"></span> : null} Save Variant
                                </button>
                            </div>
                        </div>
                    </form>
                )}
            </div>

            {/* Custom Attribute Builder Modal */}
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
                                        <input type="text" className="form-control" placeholder="e.g. Thickness (mm), Finish" value={attributeForm.name} onChange={(e) => setAttributeForm({ ...attributeForm, name: e.target.value })} required />
                                    </div>
                                    <div className="mb-3">
                                        <label className="form-label small fw-semibold">Value Type *</label>
                                        <select className="form-select" value={attributeForm.type} onChange={(e) => setAttributeForm({ ...attributeForm, type: e.target.value })} required>
                                            <option value="string">String / Text</option>
                                            <option value="number">Numeric</option>
                                            <option value="list">List / Collection</option>
                                        </select>
                                    </div>
                                </div>
                                <div className="modal-footer border-top-0 pb-4 px-4">
                                    <button type="button" className="btn btn-secondary px-3" onClick={() => setShowAttrModal(false)}>Close</button>
                                    <button type="submit" className="btn btn-primary px-4" disabled={loading}>
                                        {loading ? <span className="spinner-border spinner-border-sm me-2"></span> : null} Define
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
