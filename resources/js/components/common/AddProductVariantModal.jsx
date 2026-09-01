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
                <div className="modal-content border-0 shadow-lg" style={{ borderRadius: '14px'}}>
                    <div className="modal-header border-bottom pb-3 pt-4 px-4 bg-light">
                        <h5 className="modal-title fw-bold text-dark d-flex align-items-center mb-0">
                            <i className="fa-solid fa-cube text-primary me-2 fs-4"></i>
                            {productForm.id ? 'Edit Product Specifications' : 'Add New Product Variant'}
                        </h5>
                        <button type="button" className="btn-close" onClick={onClose} aria-label="Close"></button>
                    </div>

                    <form onSubmit={handleProductSubmit}>
                        <div className="modal-body px-4 py-4">
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
                                        <select
                                            className="form-select form-select-sm"
                                            value={productForm.category_id}
                                            onChange={(e) => {
                                                const newCatId = e.target.value;
                                                const isTile = checkIsTileCategory(newCatId);
                                                setProductForm(prev => ({
                                                    ...prev,
                                                    category_id: newCatId,
                                                    pieces_per_box: isTile ? prev.pieces_per_box : '',
                                                    attributes: {} // Safely reset category-specific attributes when category changes
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
        </div>
    );
}
