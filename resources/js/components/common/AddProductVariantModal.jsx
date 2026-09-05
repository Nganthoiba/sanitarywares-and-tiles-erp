import React, { useState, useEffect } from 'react';
import axios from 'axios';
import CategorySpecificationsForm from './CategorySpecificationsForm';

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

    const [showCustomUnits, setShowCustomUnits] = useState(false);

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
        pieces_per_box: '',
        base_unit_id: '',
        purchase_unit_id: '',
        sales_unit_id: '',
        attributes: {} // { attribute_id: value }
    });

    const checkIsTileCategory = (catId) => {
        if (!catId) return false;
        const cat = categories.find(c => c.id.toString() === catId.toString());
        if (!cat) return false;

        const isTile = (item) => {
            if (!item) return false;
            const name = (item.name || '').toLowerCase();
            const slug = (item.slug || '').toLowerCase();
            if (name === 'tiles' || slug === 'tiles') return true;
            if (item.parent) return isTile(item.parent);
            if (item.parent_id) {
                const parentObj = categories.find(c => c.id.toString() === item.parent_id.toString());
                if (parentObj) return isTile(parentObj);
            }
            return false;
        };

        return isTile(cat);
    };

    const [showCategoryModal, setShowCategoryModal] = useState(false);
    const [categoryModalError, setCategoryModalError] = useState(null);
    const [categoryForm, setCategoryForm] = useState({
        name: '',
        parent_id: '',
        description: ''
    });

    const [showBrandModal, setShowBrandModal] = useState(false);
    const [brandForm, setBrandForm] = useState({
        name: '',
        slug: '',
        description: ''
    });

    const [showManufacturerModal, setShowManufacturerModal] = useState(false);
    const [manufacturerModalError, setManufacturerModalError] = useState(null);
    const [manufacturerModalSuccess, setManufacturerModalSuccess] = useState(null);
    const [manufacturerForm, setManufacturerForm] = useState({
        legal_name: '',
        trade_name: '',
        cin: '',
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
                setProductForm(prev => ({
                    ...prev,
                    category_id: prev.category_id || '',
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
                if (productToEdit.attribute_values) {
                    productToEdit.attribute_values.forEach(av => {
                        mappedAttrs[av.product_attribute_id] = av.value;
                    });
                }
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
                    pieces_per_box: (productToEdit.pieces_per_box !== null && productToEdit.pieces_per_box !== undefined) ? productToEdit.pieces_per_box.toString() : '',
                    base_unit_id: productToEdit.base_unit_id?.toString() || '',
                    purchase_unit_id: productToEdit.purchase_unit_id?.toString() || '',
                    sales_unit_id: productToEdit.sales_unit_id?.toString() || '',
                    attributes: mappedAttrs
                });
            } else {
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
                    pieces_per_box: '',
                    base_unit_id: '',
                    purchase_unit_id: '',
                    sales_unit_id: '',
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

        const mappedAttributes = Object.entries(productForm.attributes || {})
            .filter(([_, val]) => val !== undefined && val !== null && String(val).trim() !== '')
            .map(([attrId, val]) => ({
                attribute_id: parseInt(attrId, 10),
                value: String(val).trim()
            }));

        const isTile = checkIsTileCategory(productForm.category_id);
        const submissionData = {
            ...productForm,
            pieces_per_box: isTile && productForm.pieces_per_box ? parseInt(productForm.pieces_per_box, 10) : null,
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
        setCategoryModalError(null);
        setSaving(true);
        try {
            const token = localStorage.getItem('auth_token');
            const payload = {
                name: categoryForm.name,
                parent_id: categoryForm.parent_id || null,
                description: categoryForm.description || null,
                is_active: true
            };
            const response = await axios.post('/api/categories-crud', payload, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const newCategory = response.data.category || response.data.data;
            await loadFormData();

            const isTile = checkIsTileCategory(newCategory.id);
            const defaultBase = newCategory?.default_base_unit_id || newCategory?.parent?.default_base_unit_id || '';
            const defaultPurchase = newCategory?.default_purchase_unit_id || newCategory?.parent?.default_purchase_unit_id || '';
            const defaultSales = newCategory?.default_sales_unit_id || newCategory?.parent?.default_sales_unit_id || '';

            setProductForm(prev => ({
                ...prev,
                category_id: newCategory.id.toString(),
                pieces_per_box: isTile ? prev.pieces_per_box : '',
                base_unit_id: defaultBase ? defaultBase.toString() : prev.base_unit_id,
                purchase_unit_id: defaultPurchase ? defaultPurchase.toString() : prev.purchase_unit_id,
                sales_unit_id: defaultSales ? defaultSales.toString() : prev.sales_unit_id,
                attributes: {}
            }));

            setShowCategoryModal(false);
            setCategoryForm({ name: '', parent_id: '', description: '' });
            setSuccess('Category created successfully!');
        } catch (err) {
            setCategoryModalError(err.response?.data?.message || 'Failed to create category.');
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
        setManufacturerModalError(null);
        setManufacturerModalSuccess(null);
        setSaving(true);
        try {
            const token = localStorage.getItem('auth_token');
            const payload = {
                legal_name: manufacturerForm.legal_name || manufacturerForm.name,
                trade_name: manufacturerForm.trade_name || undefined,
                cin: manufacturerForm.cin || undefined,
                phone: manufacturerForm.phone || undefined,
                email: manufacturerForm.email || undefined,
                website: manufacturerForm.website || undefined,
                address: manufacturerForm.address || undefined
            };
            const response = await axios.post('/api/manufacturers-crud', payload, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const newManufacturer = response.data.manufacturer;
            const successMsg = response.data.message || 'Manufacturer added to global master successfully!';
            setManufacturerModalSuccess(successMsg);
            await loadFormData();
            setProductForm(prev => ({
                ...prev,
                manufacturer_id: newManufacturer.id.toString()
            }));

            setTimeout(() => {
                setShowManufacturerModal(false);
                setManufacturerForm({ legal_name: '', trade_name: '', cin: '', phone: '', email: '', website: '', address: '' });
                setManufacturerModalSuccess(null);
            }, 1800);
        } catch (err) {
            let errMsg = err.response?.data?.message || 'Failed to create manufacturer.';
            if (err.response?.data?.errors) {
                const validationMsgs = Object.values(err.response.data.errors).flat().join(' ');
                if (validationMsgs) errMsg = validationMsgs;
            }
            setManufacturerModalError(errMsg);
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
        <>
            <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.55)', zIndex: 1060 }}>
                <div className="modal-dialog modal-xl modal-dialog-scrollable modal-dialog-centered" style={{ maxHeight: 'calc(100vh - 2.5rem)' }}>
                    <form onSubmit={handleProductSubmit} className="modal-content border-0 shadow-lg" style={{ borderRadius: '14px', maxHeight: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                    <div className="modal-header border-bottom pb-3 pt-4 px-4 bg-light flex-shrink-0">
                        <h5 className="modal-title fw-bold text-dark d-flex align-items-center mb-0">
                            <i className="fa-solid fa-cube text-primary me-2 fs-4"></i>
                            {productForm.id ? 'Edit Product Specifications' : 'Add New Product Variant'}
                        </h5>
                        <button type="button" className="btn-close" onClick={onClose} aria-label="Close"></button>
                    </div>

                    <div className="modal-body px-4 py-4" style={{ overflowY: 'auto', flex: '1 1 auto' }}>
                            {/* Alert Messages */}
                            {error && (
                                <div className="alert alert-danger py-2 small mb-3 animate__animated animate__fadeIn d-flex align-items-center justify-content-between">
                                    <div><i className="fa-solid fa-circle-exclamation me-2"></i>{error}</div>
                                    <button type="button" className="btn-close ms-2 flex-shrink-0" onClick={() => setError(null)} aria-label="Close"></button>
                                </div>
                            )}
                            {success && (
                                <div className="alert alert-success py-2 small mb-3 animate__animated animate__fadeIn d-flex align-items-center justify-content-between">
                                    <div><i className="fa-solid fa-circle-check me-2"></i>{success}</div>
                                    <button type="button" className="btn-close ms-2 flex-shrink-0" onClick={() => setSuccess(null)} aria-label="Close"></button>
                                </div>
                            )}

                            {/* Section 1: Basic Information */}
                            <div className="mb-4">
                                <h6 className="text-primary fw-bold mb-3 border-bottom pb-2 d-flex align-items-center">
                                    1. Basic Information
                                </h6>
                                <div className="row mb-3 align-items-end">
                                    <div className="col-md-6">
                                        <label className="form-label small fw-semibold">Category *</label>
                                        <div className="input-group input-group-sm">
                                            <select
                                                className="form-select form-select-sm"
                                                value={productForm.category_id}
                                                onChange={(e) => {
                                                    const newCatId = e.target.value;
                                                    const isTile = checkIsTileCategory(newCatId);
                                                    const catObj = categories.find(c => c.id.toString() === newCatId.toString());
                                                    const defaultBase = catObj?.default_base_unit_id || catObj?.parent?.default_base_unit_id || '';
                                                    const defaultPurchase = catObj?.default_purchase_unit_id || catObj?.parent?.default_purchase_unit_id || '';
                                                    const defaultSales = catObj?.default_sales_unit_id || catObj?.parent?.default_sales_unit_id || '';

                                                    setProductForm(prev => ({
                                                        ...prev,
                                                        category_id: newCatId,
                                                        pieces_per_box: isTile ? prev.pieces_per_box : '',
                                                        base_unit_id: defaultBase ? defaultBase.toString() : prev.base_unit_id,
                                                        purchase_unit_id: defaultPurchase ? defaultPurchase.toString() : prev.purchase_unit_id,
                                                        sales_unit_id: defaultSales ? defaultSales.toString() : prev.sales_unit_id,
                                                        attributes: {}
                                                    }));
                                                }}
                                                required
                                                disabled={loading}
                                            >
                                                <option value="">-- Select Category --</option>
                                                {categories.map(c => (
                                                    <option key={c.id} value={c.id}>
                                                        {c.parent_id || c.parent ? `\u00A0\u00A0\u00A0\u00A0── ${c.name}` : c.name}
                                                    </option>
                                                ))}
                                            </select>
                                            {/* Add Category Button */}
                                            <button
                                                type="button"
                                                className="btn btn-outline-primary"
                                                onClick={() => setShowCategoryModal(true)}
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
                                                className="form-select form-select-sm"
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

                                {/* Units of Measure (UOM Defaults & Override Card) */}
                                <div className="card border-0 bg-light p-3 mt-3 rounded-3">
                                    <div className="d-flex align-items-center justify-content-between mb-2">
                                        <div className="fw-bold text-dark small d-flex align-items-center">
                                            <i className="fa-solid fa-ruler-combined text-primary me-2"></i>
                                            Units of Measure Configuration
                                        </div>
                                        <div className="form-check form-switch mb-0">
                                            <input
                                                className="form-check-input"
                                                type="checkbox"
                                                id="showCustomUnitsToggle"
                                                checked={showCustomUnits}
                                                onChange={(e) => setShowCustomUnits(e.target.checked)}
                                            />
                                            <label className="form-check-label extra-small text-muted" htmlFor="showCustomUnitsToggle">
                                                Customize Units
                                            </label>
                                        </div>
                                    </div>

                                    {!showCustomUnits ? (
                                        <div className="d-flex flex-wrap gap-2 align-items-center">
                                            <div className="bg-white border rounded px-3 py-2 flex-grow-1">
                                                <span className="text-muted extra-small d-block">Base Unit (Stock Tracking)</span>
                                                <strong className="text-dark small">
                                                    {units.find(u => u.id.toString() === productForm.base_unit_id?.toString())?.name || 'Standard / Category Default'}
                                                </strong>
                                            </div>
                                            <div className="bg-white border rounded px-3 py-2 flex-grow-1">
                                                <span className="text-muted extra-small d-block">Default Purchase Unit</span>
                                                <strong className="text-dark small">
                                                    {units.find(u => u.id.toString() === productForm.purchase_unit_id?.toString())?.name || 'Standard / Category Default'}
                                                </strong>
                                            </div>
                                            <div className="bg-white border rounded px-3 py-2 flex-grow-1">
                                                <span className="text-muted extra-small d-block">Default Sales Unit</span>
                                                <strong className="text-dark small">
                                                    {units.find(u => u.id.toString() === productForm.sales_unit_id?.toString())?.name || 'Standard / Category Default'}
                                                </strong>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="row g-2 mt-1">
                                            <div className="col-md-4">
                                                <label className="form-label extra-small fw-semibold text-secondary mb-1">Base Unit (Stock) *</label>
                                                <select
                                                    className="form-select form-select-sm"
                                                    value={productForm.base_unit_id}
                                                    onChange={(e) => setProductForm({ ...productForm, base_unit_id: e.target.value })}
                                                >
                                                    <option value="">-- Select Base Unit --</option>
                                                    {units.map(u => (
                                                        <option key={u.id} value={u.id}>{u.name} ({u.symbol})</option>
                                                    ))}
                                                </select>
                                            </div>
                                            <div className="col-md-4">
                                                <label className="form-label extra-small fw-semibold text-secondary mb-1">Purchase Unit *</label>
                                                <select
                                                    className="form-select form-select-sm"
                                                    value={productForm.purchase_unit_id}
                                                    onChange={(e) => setProductForm({ ...productForm, purchase_unit_id: e.target.value })}
                                                >
                                                    <option value="">-- Select Purchase Unit --</option>
                                                    {units.map(u => (
                                                        <option key={u.id} value={u.id}>{u.name} ({u.symbol})</option>
                                                    ))}
                                                </select>
                                            </div>
                                            <div className="col-md-4">
                                                <label className="form-label extra-small fw-semibold text-secondary mb-1">Sales Unit *</label>
                                                <select
                                                    className="form-select form-select-sm"
                                                    value={productForm.sales_unit_id}
                                                    onChange={(e) => setProductForm({ ...productForm, sales_unit_id: e.target.value })}
                                                >
                                                    <option value="">-- Select Sales Unit --</option>
                                                    {units.map(u => (
                                                        <option key={u.id} value={u.id}>{u.name} ({u.symbol})</option>
                                                    ))}
                                                </select>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Section 2: Product Details (Category-driven) */}
                            <div className="mb-4">
                                <div className="border-bottom pb-2 mb-3">
                                    <h6 className="text-primary fw-bold mb-0">2. Product Details</h6>
                                    <small className="text-muted">Category-specific specifications for the selected product category.</small>
                                </div>

                                <CategorySpecificationsForm
                                    categoryId={productForm.category_id}
                                    values={productForm.attributes}
                                    onChange={(changedValues) => {
                                        setProductForm(prev => ({
                                            ...prev,
                                            attributes: {
                                                ...prev.attributes,
                                                ...changedValues
                                            }
                                        }));
                                    }}
                                />
                            </div>

                            {/* Section 3: Identification Information */}
                            <div className="mb-4">
                                <h6 className="text-primary fw-bold mb-3 border-bottom pb-2">3. Identification Information</h6>
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
                        </div>

                        <div className="modal-footer border-top pt-3 pb-3 px-4 bg-light flex-shrink-0">
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
                                    {categoryModalError && (
                                        <div className="alert alert-danger border-0 shadow-sm d-flex align-items-center justify-content-between mb-3" role="alert">
                                            <div className="d-flex align-items-center">
                                                <i className="fa-solid fa-circle-exclamation me-2 fs-5 text-danger"></i>
                                                <div className="small">{categoryModalError}</div>
                                            </div>
                                            <button type="button" className="btn-close ms-2 flex-shrink-0" onClick={() => setCategoryModalError(null)} aria-label="Close"></button>
                                        </div>
                                    )}

                                    <div className="mb-3">
                                        <label className="form-label small fw-semibold">Category Name *</label>
                                        <input
                                            type="text"
                                            className="form-control form-control-sm"
                                            value={categoryForm.name}
                                            onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                                            placeholder="e.g. Vitrified Tiles, Wall Tiles"
                                            required
                                        />
                                    </div>

                                    <div className="mb-3">
                                        <label className="form-label small fw-semibold">Parent Category</label>
                                        <select
                                            className="form-select form-select-sm"
                                            value={categoryForm.parent_id}
                                            onChange={(e) => setCategoryForm({ ...categoryForm, parent_id: e.target.value })}
                                        >
                                            <option value="">None (Top-Level Category)</option>
                                            {categories.filter(c => !c.parent_id).map(c => (
                                                <option key={c.id} value={c.id}>{c.name}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="mb-3">
                                        <label className="form-label small fw-semibold">Description</label>
                                        <textarea
                                            className="form-control form-control-sm"
                                            rows="2"
                                            value={categoryForm.description}
                                            onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })}
                                            placeholder="Optional category description"
                                        ></textarea>
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
                                    {manufacturerModalError && (
                                        <div className="alert alert-danger border-0 shadow-sm d-flex align-items-center justify-content-between mb-3" role="alert">
                                            <div className="d-flex align-items-center">
                                                <i className="fa-solid fa-circle-exclamation me-2 fs-5 text-danger"></i>
                                                <div className="small">{manufacturerModalError}</div>
                                            </div>
                                            <button type="button" className="btn-close ms-2 flex-shrink-0" onClick={() => setManufacturerModalError(null)} aria-label="Close"></button>
                                        </div>
                                    )}

                                    {manufacturerModalSuccess && (
                                        <div className="alert alert-success border-0 shadow-sm d-flex align-items-center justify-content-between mb-3" role="alert">
                                            <div className="d-flex align-items-center">
                                                <i className="fa-solid fa-circle-check me-2 fs-5 text-success"></i>
                                                <div className="small">{manufacturerModalSuccess}</div>
                                            </div>
                                            <button type="button" className="btn-close ms-2 flex-shrink-0" onClick={() => setManufacturerModalSuccess(null)} aria-label="Close"></button>
                                        </div>
                                    )}

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
        </>
    );
}
