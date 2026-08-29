import React, { useState, useEffect } from 'react';
import axios from 'axios';

export default function AddProductVariantModal({ show, onClose, onSave, productToEdit = null }) {
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);

    // Lookup references
    const [categories, setCategories] = useState([]);
    const [brands, setBrands] = useState([]);
    const [units, setUnits] = useState([]);
    const [taxProfiles, setTaxProfiles] = useState([]);
    const [manufacturers, setManufacturers] = useState([]);
    const [attributes, setAttributes] = useState([]);

    // Concept Info & Guide Toggles
    const [showFormVariantInfo, setShowFormVariantInfo] = useState(false);
    const [showTypeGuide, setShowTypeGuide] = useState(false);

    // Form state
    const [productForm, setProductForm] = useState({
        id: null,
        name: '',
        category_id: '',
        brand_id: '',
        manufacturer_id: '',
        sku: '',
        gtin: '',
        barcode: '',
        product_type: 'STANDARD',
        physical_object: 'SLAB',
        measurement_unit: 'SQFT',
        tax_profile_id: '',
        is_active: true,
        attributes: {} // { attribute_id: value }
    });

    // Attribute assignment tracking
    const [assignedAttributeIds, setAssignedAttributeIds] = useState([]);
    const [showAttrModal, setShowAttrModal] = useState(false);
    const [showAddExistingAttrModal, setShowAddExistingAttrModal] = useState(false);
    const [selectedExistingAttrId, setSelectedExistingAttrId] = useState('');
    const [attrToRemove, setAttrToRemove] = useState(null);
    const [attributeForm, setAttributeForm] = useState({
        name: '',
        type: 'string',
        unit_id: ''
    });

    // Quick-Add Sub-Modal States
    const [showCategoryModal, setShowCategoryModal] = useState(false);
    const [categoryForm, setCategoryForm] = useState({
        name: '',
        slug: '',
        parent_id: '',
        description: '',
        sort_order: '0'
    });

    const [showBrandModal, setShowBrandModal] = useState(false);
    const [brandForm, setBrandForm] = useState({
        name: '',
        slug: '',
        description: ''
    });

    const [showManufacturerModal, setShowManufacturerModal] = useState(false);
    const [manufacturerForm, setManufacturerForm] = useState({
        legal_name: '',
        trade_name: '',
        gstin: '',
        phone: '',
        email: '',
        website: '',
        address: ''
    });

    // Load form lookup data on modal open
    const loadFormData = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('auth_token');
            const response = await axios.get('/api/product/form-data', {
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = response.data || {};
            setCategories(data.categories || []);
            setBrands(data.brands || []);
            setUnits(data.units || []);
            setTaxProfiles(data.tax_profiles || []);
            setManufacturers(data.manufacturers || []);
            setAttributes(data.attributes || []);

            if (!productToEdit) {
                // Set default selections for new product
                setProductForm(prev => ({
                    ...prev,
                    category_id: prev.category_id || data.categories?.[0]?.id?.toString() || '',
                    brand_id: prev.brand_id || data.brands?.[0]?.id?.toString() || '',
                    tax_profile_id: prev.tax_profile_id || data.tax_profiles?.[0]?.id?.toString() || ''
                }));
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to load product lookup data.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (show) {
            setError(null);
            setSuccess(null);
            loadFormData();

            if (productToEdit) {
                const mappedAttrs = {};
                const assignedIds = [];
                if (productToEdit.attribute_values) {
                    productToEdit.attribute_values.forEach(av => {
                        mappedAttrs[av.product_attribute_id] = av.value;
                        assignedIds.push(av.product_attribute_id);
                    });
                }
                setAssignedAttributeIds(assignedIds);
                setProductForm({
                    id: productToEdit.id,
                    name: productToEdit.name || '',
                    category_id: productToEdit.category_id?.toString() || '',
                    brand_id: productToEdit.brand_id?.toString() || '',
                    manufacturer_id: productToEdit.manufacturer_id?.toString() || '',
                    sku: productToEdit.sku || '',
                    gtin: productToEdit.gtin || '',
                    barcode: productToEdit.barcode || '',
                    product_type: (productToEdit.inventory_behavior === 'SLAB') ? 'MEASURED_MATERIAL' : 'STANDARD',
                    physical_object: productToEdit.physical_object || 'SLAB',
                    measurement_unit: productToEdit.measurement_unit || 'SQFT',
                    tax_profile_id: productToEdit.tax_profile_id?.toString() || '',
                    is_active: !!productToEdit.is_active,
                    attributes: mappedAttrs
                });
            } else {
                setAssignedAttributeIds([]);
                setProductForm({
                    id: null,
                    name: '',
                    category_id: '',
                    brand_id: '',
                    manufacturer_id: '',
                    sku: '',
                    gtin: '',
                    barcode: '',
                    product_type: 'STANDARD',
                    physical_object: 'SLAB',
                    measurement_unit: 'SQFT',
                    tax_profile_id: '',
                    is_active: true,
                    attributes: {}
                });
            }
        }
    }, [show, productToEdit]);

    if (!show) return null;

    // Handle Main Product Variant Submit
    const handleProductSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setSuccess(null);
        setSaving(true);

        const mappedAttributes = assignedAttributeIds
            .filter(attrId => productForm.attributes[attrId] !== undefined && productForm.attributes[attrId] !== null && String(productForm.attributes[attrId]).trim() !== '')
            .map(attrId => ({
                attribute_id: parseInt(attrId, 10),
                value: String(productForm.attributes[attrId]).trim()
            }));

        const submissionData = {
            ...productForm,
            attributes: mappedAttributes
        };

        try {
            const token = localStorage.getItem('auth_token');
            let response;
            if (productForm.id) {
                response = await axios.put(`/api/product/variants/${productForm.id}`, submissionData, {
                    headers: { Authorization: `Bearer ${token}` }
                });
            } else {
                response = await axios.post('/api/product/variants', submissionData, {
                    headers: { Authorization: `Bearer ${token}` }
                });
            }

            const savedData = response.data?.data || response.data?.variant || response.data;
            if (onSave) {
                onSave(savedData);
            }
            onClose();
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to save product specification.');
        } finally {
            setSaving(false);
        }
    };

    // Inline Category Quick Add
    const handleQuickAddCategorySubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setSaving(true);
        try {
            const token = localStorage.getItem('auth_token');
            const response = await axios.post('/api/categories-crud', {
                ...categoryForm,
                sort_order: parseInt(categoryForm.sort_order, 10) || 0,
                parent_id: categoryForm.parent_id ? parseInt(categoryForm.parent_id, 10) : null
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const newCat = response.data.category;
            await loadFormData();
            setProductForm(prev => ({
                ...prev,
                category_id: newCat.id.toString()
            }));
            setShowCategoryModal(false);
            setCategoryForm({ name: '', slug: '', parent_id: '', description: '', sort_order: '0' });
            setSuccess('Category created successfully!');
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to create category.');
        } finally {
            setSaving(false);
        }
    };

    // Inline Brand Quick Add
    const handleQuickAddBrandSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setSaving(true);
        try {
            const token = localStorage.getItem('auth_token');
            const response = await axios.post('/api/brands-crud', brandForm, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const newBrand = response.data.brand;
            await loadFormData();
            setProductForm(prev => ({
                ...prev,
                brand_id: newBrand.id.toString()
            }));
            setShowBrandModal(false);
            setBrandForm({ name: '', slug: '', description: '' });
            setSuccess('Brand created successfully!');
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to create brand.');
        } finally {
            setSaving(false);
        }
    };

    // Inline Manufacturer Quick Add
    const handleQuickAddManufacturerSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setSaving(true);
        try {
            const token = localStorage.getItem('auth_token');
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
                headers: { Authorization: `Bearer ${token}` }
            });
            const newManufacturer = response.data.manufacturer;
            await loadFormData();
            setProductForm(prev => ({
                ...prev,
                manufacturer_id: newManufacturer.id.toString()
            }));
            setShowManufacturerModal(false);
            setManufacturerForm({ legal_name: '', trade_name: '', gstin: '', phone: '', email: '', website: '', address: '' });
            setSuccess('Manufacturer added successfully!');
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to create manufacturer.');
        } finally {
            setSaving(false);
        }
    };

    // Custom Attribute Definition
    const handleAttributeSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setSaving(true);
        try {
            const token = localStorage.getItem('auth_token');
            const payload = {
                name: attributeForm.name,
                type: attributeForm.type,
                unit_id: attributeForm.unit_id ? parseInt(attributeForm.unit_id, 10) : null
            };
            const response = await axios.post('/api/product/attributes', payload, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (response.data.success) {
                const newAttr = response.data.data;
                setSuccess(`Specification attribute "${attributeForm.name}" created successfully.`);
                setAttributeForm({ name: '', type: 'string', unit_id: '' });
                setShowAttrModal(false);
                await loadFormData();
                if (newAttr && newAttr.id) {
                    setAssignedAttributeIds(prev => Array.from(new Set([...prev, newAttr.id])));
                }
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to register custom attribute.');
        } finally {
            setSaving(false);
        }
    };

    const handleAddExistingAttributeSubmit = (e) => {
        e.preventDefault();
        if (!selectedExistingAttrId) return;
        const attrId = parseInt(selectedExistingAttrId, 10);
        setAssignedAttributeIds(prev => Array.from(new Set([...prev, attrId])));
        setSelectedExistingAttrId('');
        setShowAddExistingAttrModal(false);
    };

    const confirmRemoveAttribute = async () => {
        if (!attrToRemove) return;
        const attrId = attrToRemove.id;
        try {
            if (productForm.id) {
                const token = localStorage.getItem('auth_token');
                await axios.delete(`/api/products/${productForm.id}/attributes/${attrId}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
            }
        } catch (err) {
            // Ignore disassociate errors
        }
        setAssignedAttributeIds(prev => prev.filter(id => id !== attrId));
        setProductForm(prev => {
            const updatedAttrs = { ...prev.attributes };
            delete updatedAttrs[attrId];
            return { ...prev, attributes: updatedAttrs };
        });
        setAttrToRemove(null);
    };

    return (
        <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.55)', zIndex: 1060 }}>
            <div className="modal-dialog modal-xl modal-dialog-scrollable modal-dialog-centered">
                <div className="modal-content border-0 shadow-lg" style={{ borderRadius: '14px' }}>
                    <div className="modal-header border-bottom pb-3 pt-4 px-4 bg-light">
                        <h5 className="modal-title fw-bold text-dark d-flex align-items-center mb-0">
                            <i className="fa-solid fa-cube text-primary me-2 fs-4"></i>
                            {productForm.id ? 'Edit Product Specifications' : 'Add New Product Variant'}
                        </h5>
                        <button type="button" className="btn-close" onClick={onClose} aria-label="Close"></button>
                    </div>

                    <form onSubmit={handleProductSubmit}>
                        <div className="modal-body px-4 py-4" style={{ maxHeight: '75vh', overflowY: 'auto' }}>
                            {/* Alert Messages */}
                            {error && (
                                <div className="alert alert-danger py-2 small mb-3 animate__animated animate__fadeIn">
                                    <i className="fa-solid fa-circle-exclamation me-2"></i>{error}
                                </div>
                            )}
                            {success && (
                                <div className="alert alert-success py-2 small mb-3 animate__animated animate__fadeIn">
                                    <i className="fa-solid fa-circle-check me-2"></i>{success}
                                </div>
                            )}

                            {/* Section 1: Classification (Category & Brand) */}
                            <div className="mb-4">
                                <h6 className="text-primary fw-bold mb-3 border-bottom pb-2 d-flex align-items-center">
                                    1. Category & Brand Classification
                                </h6>
                                <div className="row mb-3 align-items-end">
                                    <div className="col-md-6">
                                        <label className="form-label small fw-semibold">Category *</label>
                                        <div className="input-group input-group-sm">
                                            <select
                                                className="form-select"
                                                value={productForm.category_id}
                                                onChange={(e) => setProductForm({ ...productForm, category_id: e.target.value })}
                                                required
                                                disabled={loading}
                                            >
                                                <option value="">Select Category</option>
                                                {categories.map(c => (
                                                    <option key={c.id} value={c.id}>{c.name}</option>
                                                ))}
                                            </select>
                                            <button
                                                type="button"
                                                className="btn btn-outline-primary"
                                                onClick={() => {
                                                    setCategoryForm(prev => ({ ...prev, parent_id: '' }));
                                                    setShowCategoryModal(true);
                                                }}
                                                title="Quick add Category"
                                            >
                                                <i className="fa-solid fa-plus"></i>
                                            </button>
                                        </div>
                                    </div>
                                    <div className="col-md-6">
                                        <label className="form-label small fw-semibold">Brand *</label>
                                        <div className="input-group input-group-sm">
                                            <select
                                                className="form-select"
                                                value={productForm.brand_id}
                                                onChange={(e) => setProductForm({ ...productForm, brand_id: e.target.value })}
                                                required
                                                disabled={loading}
                                            >
                                                <option value="">Select Brand</option>
                                                {brands.map(b => (
                                                    <option key={b.id} value={b.id}>{b.name}</option>
                                                ))}
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
                                </div>
                            </div>

                            {/* Section 2: Variant Details & Manufacturer */}
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
                                        <label className="form-label small fw-semibold">Product Name *</label>
                                        <input
                                            type="text"
                                            className="form-control form-control-sm"
                                            placeholder="e.g. Kajaria Royal Gold 600x600 mm"
                                            value={productForm.name}
                                            onChange={(e) => {
                                                const val = e.target.value;
                                                setProductForm(prev => {
                                                    const updated = { ...prev, name: val };
                                                    if (!prev.sku && val) {
                                                        updated.sku = val.toUpperCase().replace(/[^A-Z0-9]/g, '-').slice(0, 20);
                                                    }
                                                    return updated;
                                                });
                                            }}
                                            required
                                        />
                                    </div>
                                    <div className="col-md-6">
                                        <label className="form-label small fw-semibold">Manufacturer</label>
                                        <div className="input-group input-group-sm">
                                            <select
                                                className="form-select"
                                                value={productForm.manufacturer_id}
                                                onChange={(e) => setProductForm({ ...productForm, manufacturer_id: e.target.value })}
                                                disabled={loading}
                                            >
                                                <option value="">No Manufacturer</option>
                                                {manufacturers.map(m => (
                                                    <option key={m.id} value={m.id}>{m.legal_name}</option>
                                                ))}
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
                                            className="form-control form-control-sm font-monospace"
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
                                            className="form-control form-control-sm font-monospace"
                                            placeholder="Universal barcode"
                                            value={productForm.gtin}
                                            onChange={(e) => setProductForm({ ...productForm, gtin: e.target.value })}
                                        />
                                    </div>
                                    <div className="col-md-4">
                                        <label className="form-label small fw-semibold">Barcode</label>
                                        <input
                                            type="text"
                                            className="form-control form-control-sm font-monospace"
                                            placeholder="Scan code"
                                            value={productForm.barcode}
                                            onChange={(e) => setProductForm({ ...productForm, barcode: e.target.value })}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Section 4: Product Type & Inventory Behavior */}
                            <div className="mb-4">
                                <h6 className="text-primary fw-bold mb-3 border-bottom pb-2 d-flex align-items-center justify-content-between">
                                    <span className="d-flex align-items-center">
                                        4. Product Type & Inventory Behavior
                                        <button
                                            type="button"
                                            className="btn btn-link text-primary p-0 ms-2 text-decoration-none small"
                                            onClick={() => setShowTypeGuide(!showTypeGuide)}
                                            title="View Product Type Comparison Guide"
                                        >
                                            <i className="fa-solid fa-circle-info me-1"></i>
                                            <span className="small">What's the difference?</span>
                                        </button>
                                    </span>
                                </h6>

                                {showTypeGuide && (
                                    <div className="p-3 mb-3 bg-light border border-info-subtle rounded-3 small animate__animated animate__fadeIn">
                                        <div className="fw-bold text-dark mb-2 d-flex align-items-center">
                                            <i className="fa-solid fa-layer-group text-info me-2"></i>
                                            Product Type Classification Guide:
                                        </div>
                                        <div className="row g-3">
                                            <div className="col-md-6">
                                                <div className="p-2 border bg-white rounded-2 h-100 shadow-sm">
                                                    <span className="fw-bold text-primary d-block mb-1">
                                                        <i className="fa-solid fa-boxes-stacked me-1"></i> Standard Product
                                                    </span>
                                                    <p className="text-muted mb-1" style={{ fontSize: '0.82rem' }}>
                                                        Fixed, countable commercial quantity. POs and GRNs use fixed unit conversions without measuring individual items.
                                                    </p>
                                                    <span className="badge bg-primary-subtle text-primary" style={{ fontSize: '0.72rem' }}>
                                                        Examples: Tiles (BOX/PCS), Faucets, Basins, Cement (BAG)
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="col-md-6">
                                                <div className="p-2 border bg-white rounded-2 h-100 shadow-sm">
                                                    <span className="fw-bold text-warning-emphasis d-block mb-1">
                                                        <i className="fa-solid fa-ruler-combined me-1 text-warning"></i> Measured Material
                                                    </span>
                                                    <p className="text-muted mb-1" style={{ fontSize: '0.82rem' }}>
                                                        Value depends on actual physical measurement of each individual item received during GRN. No fixed 1-to-1 ratio.
                                                    </p>
                                                    <span className="badge bg-warning-subtle text-warning-emphasis" style={{ fontSize: '0.72rem' }}>
                                                        Examples: Granite Slabs, Marble Slabs (SQ.FT.)
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                <div className="row mb-3 align-items-center">
                                    <div className="col-md-4">
                                        <label className="form-label small fw-semibold">Product Type *</label>
                                        <select
                                            className="form-select form-select-sm fw-semibold"
                                            value={productForm.product_type}
                                            onChange={(e) => setProductForm({ ...productForm, product_type: e.target.value })}
                                            required
                                        >
                                            <option value="STANDARD">Standard Product</option>
                                            <option value="MEASURED_MATERIAL">Measured Material</option>
                                        </select>
                                    </div>

                                    {productForm.product_type === 'MEASURED_MATERIAL' ? (
                                        <>
                                            <div className="col-md-4">
                                                <label className="form-label small fw-semibold">Stock Form *</label>
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
                                                <label className="form-label small fw-semibold">Pricing Basis *</label>
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
                                    ) : (
                                        <div className="col-md-8">
                                            <div className="p-2 border rounded bg-light text-muted small d-flex align-items-center mt-3">
                                                <i className="fa-solid fa-circle-check text-success me-2 fs-5"></i>
                                                <div>
                                                    <strong>Standard Inventory Flow:</strong> Counted directly in fixed commercial units (BOX, PCS, BAG).
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Section 5: Dynamic Specifications / Custom Attributes */}
                            <div className="mb-4">
                                <div className="d-flex justify-content-between align-items-center mb-2 border-bottom pb-2">
                                    <div>
                                        <h6 className="text-primary fw-bold mb-0">5. Specifications / Custom Attributes — Optional</h6>
                                        <small className="text-muted">Add product-specific specifications only when they are relevant to this product.</small>
                                    </div>
                                    <button
                                        type="button"
                                        className="btn btn-xs btn-outline-primary d-flex align-items-center gap-1 py-1.5 px-2.5"
                                        style={{ fontSize: '0.75rem' }}
                                        onClick={() => setShowAttrModal(true)}
                                    >
                                        <i className="fa-solid fa-plus"></i> Define New Attribute
                                    </button>
                                </div>

                                {assignedAttributeIds.length === 0 ? (
                                    <div className="p-4 bg-light rounded-3 border border-dashed text-center my-3">
                                        <i className="fa-solid fa-sliders text-muted fs-3 mb-2 d-block"></i>
                                        <p className="fw-semibold text-dark mb-1">No specifications have been added.</p>
                                        <p className="text-muted small mb-3">Add specifications only if this product requires them.</p>
                                        <button
                                            type="button"
                                            className="btn btn-sm btn-outline-primary px-3"
                                            onClick={() => setShowAddExistingAttrModal(true)}
                                        >
                                            <i className="fa-solid fa-plus me-1"></i> Add Existing Attribute
                                        </button>
                                    </div>
                                ) : (
                                    <div>
                                        <div className="row g-3">
                                            {attributes.filter(attr => assignedAttributeIds.includes(attr.id)).map(attr => (
                                                <div key={attr.id} className="col-md-4">
                                                    <div className="d-flex justify-content-between align-items-center mb-1">
                                                        <label className="form-label small mb-0 fw-semibold text-dark">{attr.name}</label>
                                                        <div className="d-flex align-items-center gap-1">
                                                            <span className="badge bg-light text-secondary border small" style={{ fontSize: '0.65rem' }}>
                                                                {attr.unit ? `${attr.unit.name} (${attr.unit.symbol})` : 'NO UNIT'}
                                                            </span>
                                                            <button
                                                                type="button"
                                                                className="btn p-0 text-danger border-0 ms-1"
                                                                style={{ fontSize: '0.75rem', background: 'none' }}
                                                                title={`Remove ${attr.name} from product`}
                                                                onClick={() => setAttrToRemove(attr)}
                                                            >
                                                                <i className="fa-solid fa-xmark"></i>
                                                            </button>
                                                        </div>
                                                    </div>
                                                    <input
                                                        type={attr.type === 'number' ? 'number' : 'text'}
                                                        className="form-control form-control-sm"
                                                        placeholder={attr.unit ? `Enter ${attr.name.toLowerCase()} in ${attr.unit.symbol}` : `Enter ${attr.name.toLowerCase()}`}
                                                        value={productForm.attributes[attr.id] || ''}
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
                                        <div className="mt-3">
                                            <button
                                                type="button"
                                                className="btn btn-sm btn-outline-secondary d-flex align-items-center gap-1"
                                                onClick={() => setShowAddExistingAttrModal(true)}
                                            >
                                                <i className="fa-solid fa-plus"></i> Add Existing Attribute
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="modal-footer border-top pt-3 pb-4 px-4 bg-light">
                            <button type="button" className="btn btn-secondary px-3 btn-sm" onClick={onClose} disabled={saving}>Cancel</button>
                            <button type="submit" className="btn btn-primary px-4 btn-sm" disabled={saving || loading}>
                                {saving ? <span className="spinner-border spinner-border-sm me-2"></span> : null}
                                {productForm.id ? 'Update Product Specification' : 'Save Product Variant'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>

            {/* Quick Add Sub-Modals */}
            {/* 1. Quick Add Category Modal */}
            {showCategoryModal && (
                <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 1080 }}>
                    <div className="modal-dialog modal-dialog-centered">
                        <div className="modal-content border-0 shadow-lg" style={{ borderRadius: '12px' }}>
                            <div className="modal-header border-bottom bg-light">
                                <h6 className="modal-title fw-bold text-dark">Quick Add Category</h6>
                                <button type="button" className="btn-close" onClick={() => setShowCategoryModal(false)}></button>
                            </div>
                            <form onSubmit={handleQuickAddCategorySubmit}>
                                <div className="modal-body">
                                    <div className="mb-3">
                                        <label className="form-label small fw-semibold">Category Name *</label>
                                        <input
                                            type="text"
                                            className="form-control form-control-sm"
                                            value={categoryForm.name}
                                            onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value, slug: e.target.value.toLowerCase().replace(/[^a-z0-9]/g, '-') })}
                                            required
                                        />
                                    </div>
                                    <div className="mb-3">
                                        <label className="form-label small fw-semibold">Parent Category (Optional)</label>
                                        <select
                                            className="form-select form-select-sm"
                                            value={categoryForm.parent_id}
                                            onChange={(e) => setCategoryForm({ ...categoryForm, parent_id: e.target.value })}
                                        >
                                            <option value="">No Parent (Top-level)</option>
                                            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                        </select>
                                    </div>
                                </div>
                                <div className="modal-footer border-top bg-light">
                                    <button type="button" className="btn btn-sm btn-secondary" onClick={() => setShowCategoryModal(false)}>Cancel</button>
                                    <button type="submit" className="btn btn-sm btn-primary" disabled={saving}>Save Category</button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* 2. Quick Add Brand Modal */}
            {showBrandModal && (
                <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 1080 }}>
                    <div className="modal-dialog modal-dialog-centered">
                        <div className="modal-content border-0 shadow-lg" style={{ borderRadius: '12px' }}>
                            <div className="modal-header border-bottom bg-light">
                                <h6 className="modal-title fw-bold text-dark">Quick Add Brand</h6>
                                <button type="button" className="btn-close" onClick={() => setShowBrandModal(false)}></button>
                            </div>
                            <form onSubmit={handleQuickAddBrandSubmit}>
                                <div className="modal-body">
                                    <div className="mb-3">
                                        <label className="form-label small fw-semibold">Brand Name *</label>
                                        <input
                                            type="text"
                                            className="form-control form-control-sm"
                                            value={brandForm.name}
                                            onChange={(e) => setBrandForm({ ...brandForm, name: e.target.value, slug: e.target.value.toLowerCase().replace(/[^a-z0-9]/g, '-') })}
                                            required
                                        />
                                    </div>
                                </div>
                                <div className="modal-footer border-top bg-light">
                                    <button type="button" className="btn btn-sm btn-secondary" onClick={() => setShowBrandModal(false)}>Cancel</button>
                                    <button type="submit" className="btn btn-sm btn-primary" disabled={saving}>Save Brand</button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* 3. Quick Add Manufacturer Modal */}
            {showManufacturerModal && (
                <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 1080 }}>
                    <div className="modal-dialog modal-dialog-centered">
                        <div className="modal-content border-0 shadow-lg" style={{ borderRadius: '12px' }}>
                            <div className="modal-header border-bottom bg-light">
                                <h6 className="modal-title fw-bold text-dark">Quick Add Manufacturer</h6>
                                <button type="button" className="btn-close" onClick={() => setShowManufacturerModal(false)}></button>
                            </div>
                            <form onSubmit={handleQuickAddManufacturerSubmit}>
                                <div className="modal-body">
                                    <div className="mb-3">
                                        <label className="form-label small fw-semibold">Legal / Manufacturer Name *</label>
                                        <input
                                            type="text"
                                            className="form-control form-control-sm"
                                            value={manufacturerForm.legal_name}
                                            onChange={(e) => setManufacturerForm({ ...manufacturerForm, legal_name: e.target.value })}
                                            required
                                        />
                                    </div>
                                    <div className="row g-2 mb-3">
                                        <div className="col-6">
                                            <label className="form-label small fw-semibold">Phone</label>
                                            <input
                                                type="text"
                                                className="form-control form-control-sm"
                                                value={manufacturerForm.phone}
                                                onChange={(e) => setManufacturerForm({ ...manufacturerForm, phone: e.target.value })}
                                            />
                                        </div>
                                        <div className="col-6">
                                            <label className="form-label small fw-semibold">Email</label>
                                            <input
                                                type="email"
                                                className="form-control form-control-sm"
                                                value={manufacturerForm.email}
                                                onChange={(e) => setManufacturerForm({ ...manufacturerForm, email: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                </div>
                                <div className="modal-footer border-top bg-light">
                                    <button type="button" className="btn btn-sm btn-secondary" onClick={() => setShowManufacturerModal(false)}>Cancel</button>
                                    <button type="submit" className="btn btn-sm btn-primary" disabled={saving}>Save Manufacturer</button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* 4. Define New Attribute Modal */}
            {showAttrModal && (
                <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 1080 }}>
                    <div className="modal-dialog modal-dialog-centered">
                        <div className="modal-content border-0 shadow-lg" style={{ borderRadius: '12px' }}>
                            <div className="modal-header border-bottom bg-light">
                                <h6 className="modal-title fw-bold text-dark">Define New Specification Attribute</h6>
                                <button type="button" className="btn-close" onClick={() => setShowAttrModal(false)}></button>
                            </div>
                            <form onSubmit={handleAttributeSubmit}>
                                <div className="modal-body">
                                    <div className="mb-3">
                                        <label className="form-label small fw-semibold">Attribute Name *</label>
                                        <input
                                            type="text"
                                            className="form-control form-control-sm"
                                            placeholder="e.g. Surface Finish, Water Absorption"
                                            value={attributeForm.name}
                                            onChange={(e) => setAttributeForm({ ...attributeForm, name: e.target.value })}
                                            required
                                        />
                                    </div>
                                    <div className="row g-2 mb-3">
                                        <div className="col-6">
                                            <label className="form-label small fw-semibold">Data Type *</label>
                                            <select
                                                className="form-select form-select-sm"
                                                value={attributeForm.type}
                                                onChange={(e) => setAttributeForm({ ...attributeForm, type: e.target.value })}
                                            >
                                                <option value="string">Text (String)</option>
                                                <option value="number">Numeric (Number)</option>
                                            </select>
                                        </div>
                                        <div className="col-6">
                                            <label className="form-label small fw-semibold">Unit (Optional)</label>
                                            <select
                                                className="form-select form-select-sm"
                                                value={attributeForm.unit_id}
                                                onChange={(e) => setAttributeForm({ ...attributeForm, unit_id: e.target.value })}
                                            >
                                                <option value="">No Unit</option>
                                                {units.map(u => <option key={u.id} value={u.id}>{u.name} ({u.symbol})</option>)}
                                            </select>
                                        </div>
                                    </div>
                                </div>
                                <div className="modal-footer border-top bg-light">
                                    <button type="button" className="btn btn-sm btn-secondary" onClick={() => setShowAttrModal(false)}>Cancel</button>
                                    <button type="submit" className="btn btn-sm btn-primary" disabled={saving}>Save Attribute</button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* 5. Add Existing Attribute Modal */}
            {showAddExistingAttrModal && (
                <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 1080 }}>
                    <div className="modal-dialog modal-dialog-centered">
                        <div className="modal-content border-0 shadow-lg" style={{ borderRadius: '12px' }}>
                            <div className="modal-header border-bottom bg-light">
                                <h6 className="modal-title fw-bold text-dark">Add Existing Specification Attribute</h6>
                                <button type="button" className="btn-close" onClick={() => setShowAddExistingAttrModal(false)}></button>
                            </div>
                            <form onSubmit={handleAddExistingAttributeSubmit}>
                                <div className="modal-body">
                                    <label className="form-label small fw-semibold">Select Attribute *</label>
                                    <select
                                        className="form-select form-select-sm"
                                        value={selectedExistingAttrId}
                                        onChange={(e) => setSelectedExistingAttrId(e.target.value)}
                                        required
                                    >
                                        <option value="">-- Choose Attribute --</option>
                                        {attributes
                                            .filter(attr => !assignedAttributeIds.includes(attr.id))
                                            .map(attr => (
                                                <option key={attr.id} value={attr.id}>
                                                    {attr.name} {attr.unit ? `(${attr.unit.symbol})` : ''}
                                                </option>
                                            ))}
                                    </select>
                                </div>
                                <div className="modal-footer border-top bg-light">
                                    <button type="button" className="btn btn-sm btn-secondary" onClick={() => setShowAddExistingAttrModal(false)}>Cancel</button>
                                    <button type="submit" className="btn btn-sm btn-primary">Attach Attribute</button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* 6. Confirm Remove Attribute Modal */}
            {attrToRemove && (
                <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 1085 }}>
                    <div className="modal-dialog modal-dialog-centered modal-sm">
                        <div className="modal-content border-0 shadow-lg" style={{ borderRadius: '12px' }}>
                            <div className="modal-header border-bottom bg-light py-2">
                                <h6 className="modal-title fw-bold text-danger small">Remove Specification Attribute</h6>
                                <button type="button" className="btn-close" onClick={() => setAttrToRemove(null)}></button>
                            </div>
                            <div className="modal-body text-center py-3">
                                <p className="small mb-0">Are you sure you want to remove <strong>"{attrToRemove.name}"</strong> from this product?</p>
                            </div>
                            <div className="modal-footer border-top bg-light py-2">
                                <button type="button" className="btn btn-xs btn-secondary" onClick={() => setAttrToRemove(null)}>Cancel</button>
                                <button type="button" className="btn btn-xs btn-danger" onClick={confirmRemoveAttribute}>Remove</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
