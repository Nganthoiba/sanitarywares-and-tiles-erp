import React, { useState, useEffect } from 'react';
import axios from 'axios';

export default function QuickProductVariantModal({ show, onClose, onSave }) {
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);

    // Metadata references
    const [categories, setCategories] = useState([]);
    const [brands, setBrands] = useState([]);
    const [units, setUnits] = useState([]);
    const [taxProfiles, setTaxProfiles] = useState([]);

    const [form, setForm] = useState({
        name: '',
        sku: '',
        category_id: '',
        brand_id: '',
        product_type: 'STANDARD',
        physical_object: 'SLAB',
        measurement_unit: 'SQFT',
        purchase_unit_id: '',
        sales_unit_id: '',
        base_unit_id: '',
        tax_profile_id: '',
        is_active: true
    });

    useEffect(() => {
        if (show) {
            const fetchFormData = async () => {
                setLoading(true);
                try {
                    const token = localStorage.getItem('auth_token');
                    const res = await axios.get('/api/product/get-form-data', {
                        headers: { Authorization: `Bearer ${token}` }
                    });
                    const data = res.data || {};
                    setCategories(data.categories || []);
                    setBrands(data.brands || []);
                    setUnits(data.units || []);
                    setTaxProfiles(data.tax_profiles || []);

                    const defaultCat = data.categories?.[0]?.id?.toString() || '';
                    const defaultBrand = data.brands?.[0]?.id?.toString() || '';
                    const defaultUnit = data.units?.[0]?.id?.toString() || '';
                    const defaultTax = data.tax_profiles?.[0]?.id?.toString() || '';

                    setForm({
                        name: '',
                        sku: '',
                        category_id: defaultCat,
                        brand_id: defaultBrand,
                        product_type: 'STANDARD',
                        physical_object: 'SLAB',
                        measurement_unit: 'SQFT',
                        purchase_unit_id: defaultUnit,
                        sales_unit_id: defaultUnit,
                        base_unit_id: defaultUnit,
                        tax_profile_id: defaultTax,
                        is_active: true
                    });
                } catch (err) {
                    setError('Failed to load product creation references.');
                } finally {
                    setLoading(false);
                }
            };
            fetchFormData();
            setError(null);
        }
    }, [show]);

    if (!show) return null;

    const handleChange = (field, value) => {
        setForm(prev => {
            const updated = { ...prev, [field]: value };
            if (field === 'name' && !prev.sku) {
                // Generate quick SKU suggestion from name
                const suggestedSku = value.toUpperCase().replace(/[^A-Z0-9]/g, '-').slice(0, 20);
                updated.sku = suggestedSku;
            }
            return updated;
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        setError(null);

        try {
            const token = localStorage.getItem('auth_token');
            const res = await axios.post('/api/product/variants', form, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const createdVariant = res.data.data;
            onSave(createdVariant);
            onClose();
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to create product variant. Please verify fields.');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)', zIndex: 1070 }}>
            <div className="modal-dialog modal-lg modal-dialog-centered">
                <div className="modal-content border-0 shadow-lg" style={{ borderRadius: '16px' }}>
                    <div className="modal-header border-bottom-0 pb-0 pt-4 px-4">
                        <h5 className="modal-title fw-bold text-dark">
                            <i className="fa-solid fa-cube text-primary me-2"></i>Quick Add Product Variant
                        </h5>
                        <button type="button" className="btn-close" onClick={onClose} aria-label="Close"></button>
                    </div>
                    <form onSubmit={handleSubmit}>
                        <div className="modal-body px-4 py-3" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
                            {error && (
                                <div className="alert alert-danger py-2 small" role="alert">
                                    <i className="fa-solid fa-triangle-exclamation me-1"></i> {error}
                                </div>
                            )}

                            {/* Row 1: Classification */}
                            <div className="row g-3 mb-3">
                                <div className="col-md-6">
                                    <label className="form-label small fw-semibold">Category *</label>
                                    <select
                                        className="form-select form-select-sm"
                                        value={form.category_id}
                                        onChange={(e) => handleChange('category_id', e.target.value)}
                                        required
                                        disabled={loading}
                                    >
                                        <option value="">-- Select Category --</option>
                                        {categories.map(c => (
                                            <option key={c.id} value={c.id}>{c.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="col-md-6">
                                    <label className="form-label small fw-semibold">Brand *</label>
                                    <select
                                        className="form-select form-select-sm"
                                        value={form.brand_id}
                                        onChange={(e) => handleChange('brand_id', e.target.value)}
                                        required
                                        disabled={loading}
                                    >
                                        <option value="">-- Select Brand --</option>
                                        {brands.map(b => (
                                            <option key={b.id} value={b.id}>{b.name}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {/* Row 2: Name & SKU */}
                            <div className="row g-3 mb-3">
                                <div className="col-md-7">
                                    <label className="form-label small fw-semibold">Product Variant Name *</label>
                                    <input
                                        type="text"
                                        className="form-control form-control-sm"
                                        placeholder="e.g. Kajaria Royal Gold 600x600 mm"
                                        value={form.name}
                                        onChange={(e) => handleChange('name', e.target.value)}
                                        required
                                    />
                                </div>
                                <div className="col-md-5">
                                    <label className="form-label small fw-semibold">SKU / Item Code *</label>
                                    <input
                                        type="text"
                                        className="form-control form-control-sm font-monospace"
                                        placeholder="e.g. KAJ-600-WHT"
                                        value={form.sku}
                                        onChange={(e) => handleChange('sku', e.target.value.toUpperCase())}
                                        required
                                    />
                                </div>
                            </div>

                            {/* Row 3: Product Type & Units */}
                            <div className="row g-3 mb-3">
                                <div className="col-md-6">
                                    <label className="form-label small fw-semibold">Product Type *</label>
                                    <select
                                        className="form-select form-select-sm"
                                        value={form.product_type}
                                        onChange={(e) => handleChange('product_type', e.target.value)}
                                        required
                                    >
                                        <option value="STANDARD">Standard Product (Box/Pcs)</option>
                                        <option value="MEASURED_MATERIAL">Measured Material (Slab/SqFt)</option>
                                    </select>
                                </div>
                                <div className="col-md-6">
                                    <label className="form-label small fw-semibold">Primary Unit</label>
                                    <select
                                        className="form-select form-select-sm"
                                        value={form.purchase_unit_id}
                                        onChange={(e) => {
                                            const val = e.target.value;
                                            setForm(prev => ({
                                                ...prev,
                                                purchase_unit_id: val,
                                                sales_unit_id: val,
                                                base_unit_id: val
                                            }));
                                        }}
                                        disabled={loading}
                                    >
                                        <option value="">-- Choose Unit --</option>
                                        {units.map(u => (
                                            <option key={u.id} value={u.id}>{u.name} ({u.symbol})</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="col-md-6">
                                    <label className="form-label small fw-semibold">Tax Profile</label>
                                    <select
                                        className="form-select form-select-sm"
                                        value={form.tax_profile_id}
                                        onChange={(e) => handleChange('tax_profile_id', e.target.value)}
                                        disabled={loading}
                                    >
                                        <option value="">Select Tax Profile</option>
                                        {taxProfiles.map(tp => (
                                            <option key={tp.id} value={tp.id}>{tp.name} ({tp.igst_rate}%)</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </div>
                        <div className="modal-footer border-top-0 pb-4 px-4">
                            <button type="button" className="btn btn-outline-secondary me-2 px-3 btn-sm" onClick={onClose} disabled={saving}>
                                Cancel
                            </button>
                            <button type="submit" className="btn btn-primary px-4 btn-sm" disabled={saving || loading}>
                                {saving ? 'Creating Variant...' : 'Create Variant'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
