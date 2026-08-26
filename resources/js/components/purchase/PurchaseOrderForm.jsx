import React, { useState, useEffect } from 'react';
import axios from 'axios';
import QuickSupplierModal from '../grn/QuickSupplierModal';
import QuickBranchModal from '../grn/QuickBranchModal';
import SearchableSelect from '../common/SearchableSelect';

export default function PurchaseOrderForm({ poId, onBack, onSaveSuccess }) {
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);

    // Quick Add Modal States
    const [showQuickSupplierModal, setShowQuickSupplierModal] = useState(false);
    const [showQuickBranchModal, setShowQuickBranchModal] = useState(false);

    // Form inputs reference context
    const [suppliers, setSuppliers] = useState([]);
    const [branches, setBranches] = useState([]);
    const [units, setUnits] = useState([]);
    const [products, setProducts] = useState([]);
    const [conversions, setConversions] = useState([]);

    const handleSupplierSaved = (newSupplier) => {
        setSuppliers(prev => [...prev, newSupplier]);
        setFormData(prev => ({ ...prev, supplier_id: newSupplier.id }));
    };

    const handleBranchSaved = (newBranch) => {
        setBranches(prev => [...prev, newBranch]);
        setFormData(prev => ({ ...prev, branch_id: newBranch.id }));
    };

    // Form states
    const [formData, setFormData] = useState({
        branch_id: '',
        supplier_id: '',
        purchase_requisition_id: '',
        po_number: '',
        po_date: new Date().toISOString().split('T')[0],
        expected_delivery_date: '',
        reference_number: '',
        payment_terms: '',
        delivery_terms: '',
        remarks: '',
        items: []
    });

    // Resolve conversion multiplier
    const getConversionMultiplier = (variantId, fromUnit, toUnit) => {
        if (!fromUnit || !toUnit || parseInt(fromUnit) === parseInt(toUnit)) return 1.0;
        // 1. Variant-specific conversion
        let conv = conversions.find(c => c.product_variant_id === parseInt(variantId) && c.from_unit_id === parseInt(fromUnit) && c.to_unit_id === parseInt(toUnit));
        if (conv) return parseFloat(conv.multiplier);
        // 2. Variant-specific in reverse
        conv = conversions.find(c => c.product_variant_id === parseInt(variantId) && c.from_unit_id === parseInt(toUnit) && c.to_unit_id === parseInt(fromUnit));
        if (conv && parseFloat(conv.multiplier) > 0) return 1.0 / parseFloat(conv.multiplier);
        // 3. Global conversion
        conv = conversions.find(c => !c.product_variant_id && c.from_unit_id === parseInt(fromUnit) && c.to_unit_id === parseInt(toUnit));
        if (conv) return parseFloat(conv.multiplier);
        // 4. Global in reverse
        conv = conversions.find(c => !c.product_variant_id && c.from_unit_id === parseInt(toUnit) && c.to_unit_id === parseInt(fromUnit));
        if (conv && parseFloat(conv.multiplier) > 0) return 1.0 / parseFloat(conv.multiplier);
        return null;
    };

    // Valid units for a variant
    const getValidUnitsForProduct = (product) => {
        if (!product) return [];
        const validUnitIds = new Set();
        if (product.base_unit_id) validUnitIds.add(parseInt(product.base_unit_id));
        if (product.purchase_unit_id) validUnitIds.add(parseInt(product.purchase_unit_id));
        if (product.sales_unit_id) validUnitIds.add(parseInt(product.sales_unit_id));

        // Also add units from variant-specific conversions
        const variantConversions = conversions.filter(c => c.product_variant_id === product.id);
        variantConversions.forEach(c => {
            validUnitIds.add(parseInt(c.from_unit_id));
            validUnitIds.add(parseInt(c.to_unit_id));
        });

        return units.filter(u => validUnitIds.has(u.id));
    };

    const hasValidConversion = (productId, fromUnitId, toUnitId) => {
        if (!fromUnitId || !toUnitId) return false;
        if (parseInt(fromUnitId) === parseInt(toUnitId)) return true;
        return getConversionMultiplier(productId, fromUnitId, toUnitId) !== null;
    };

    const getValidPricingUnits = (product, orderUnitId) => {
        if (!product || !orderUnitId) return [];
        const validUnits = getValidUnitsForProduct(product);
        return validUnits.filter(u => hasValidConversion(product.id, orderUnitId, u.id));
    };

    // Load setup configurations
    useEffect(() => {
        const fetchContext = async () => {
            setLoading(true);
            try {
                const token = localStorage.getItem('auth_token');
                const res = await axios.get('/api/purchase-orders/form-data', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setSuppliers(res.data.suppliers || []);
                setBranches(res.data.branches || []);
                setUnits(res.data.units || []);
                setProducts(res.data.product_variants || []);
                setConversions(res.data.unit_conversions || []);

                if (poId) {
                    // Edit Mode: fetch PO details
                    const poRes = await axios.get(`/api/purchase-orders/${poId}`, {
                        headers: { Authorization: `Bearer ${token}` }
                    });
                    const po = poRes.data.data;
                    setFormData({
                        branch_id: po.branch_id || '',
                        supplier_id: po.supplier_id || '',
                        purchase_requisition_id: po.purchase_requisition_id || '',
                        po_number: po.po_number || '',
                        po_date: po.po_date || '',
                        expected_delivery_date: po.expected_delivery_date || '',
                        reference_number: po.reference_number || '',
                        payment_terms: po.payment_terms || '',
                        delivery_terms: po.delivery_terms || '',
                        remarks: po.remarks || '',
                        items: po.items.map(item => ({
                            id: item.id,
                            product_variant_id: item.product_variant_id,
                            quantity: item.quantity,
                            unit_id: item.unit_id,
                            pricing_unit_id: item.pricing_unit_id || item.unit_id,
                            estimated_pricing_quantity: item.estimated_pricing_quantity || item.quantity,
                            unit_price: item.unit_price,
                            discount_amount: item.discount_amount,
                            tax_rate: item.tax_rate
                        }))
                    });
                }
            } catch (err) {
                setError('Failed to load form configuration data.');
            } finally {
                setLoading(false);
            }
        };
        fetchContext();
    }, [poId]);

    const handleHeaderChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    // Item handlers
    const handleAddItem = () => {
        setFormData(prev => ({
            ...prev,
            items: [
                ...prev.items,
                {
                    product_variant_id: '',
                    quantity: 1,
                    unit_id: '',
                    pricing_unit_id: '',
                    estimated_pricing_quantity: '',
                    unit_price: 0,
                    discount_amount: 0,
                    tax_rate: 18.0
                }
            ]
        }));
    };

    const handleItemChange = (index, field, value) => {
        const updatedItems = [...formData.items];
        updatedItems[index][field] = value;

        // If product variant changes, auto-populate default unit and cost price
        if (field === 'product_variant_id') {
            const variant = products.find(p => p.id === parseInt(value));
            if (variant) {
                const uId = variant.purchase_unit_id || variant.base_unit_id || '';
                updatedItems[index].unit_id = uId;
                updatedItems[index].pricing_unit_id = uId;
                if (variant.inventory_behavior === 'SLAB') {
                    updatedItems[index].unit_id = variant.purchase_unit_id; // SLAB
                    updatedItems[index].pricing_unit_id = variant.sales_unit_id; // SQFT
                    updatedItems[index].estimated_pricing_quantity = '';
                } else {
                    updatedItems[index].estimated_pricing_quantity = 1;
                }
                updatedItems[index].unit_price = parseFloat(variant.cost_price || 0.0);
            }
        }

        // If unit_id or quantity changes, or pricing_unit_id changes, auto-update estimated pricing quantity if not a slab product
        if (field === 'quantity' || field === 'unit_id' || field === 'pricing_unit_id' || field === 'product_variant_id') {
            const item = updatedItems[index];
            const variant = products.find(p => p.id === parseInt(item.product_variant_id));
            if (variant && variant.inventory_behavior !== 'SLAB') {
                const multiplier = getConversionMultiplier(item.product_variant_id, item.unit_id, item.pricing_unit_id);
                if (multiplier !== null) {
                    updatedItems[index].estimated_pricing_quantity = (parseFloat(item.quantity || 0.0) * multiplier).toFixed(4);
                } else {
                    updatedItems[index].estimated_pricing_quantity = item.quantity;
                }
            }
        }

        setFormData(prev => ({ ...prev, items: updatedItems }));
    };

    const handleRemoveItem = (index) => {
        const updatedItems = formData.items.filter((_, i) => i !== index);
        setFormData(prev => ({ ...prev, items: updatedItems }));
    };

    // Dynamic computations
    const calculateTotals = () => {
        let subtotal = 0.0;
        let discount = 0.0;
        let tax = 0.0;

        formData.items.forEach(item => {
            const variant = products.find(p => p.id === parseInt(item.product_variant_id));
            const isSlab = variant?.inventory_behavior === 'SLAB';
            const q = parseFloat(item.quantity || 0.0);
            const p = parseFloat(item.unit_price || 0.0);
            const d = parseFloat(item.discount_amount || 0.0);
            const t = parseFloat(item.tax_rate || 0.0);

            let pricingBasis = q;
            if (isSlab) {
                pricingBasis = parseFloat(item.estimated_pricing_quantity || 0.0);
            } else if (item.unit_id && item.pricing_unit_id && parseInt(item.unit_id) !== parseInt(item.pricing_unit_id)) {
                const multiplier = getConversionMultiplier(item.product_variant_id, item.unit_id, item.pricing_unit_id);
                pricingBasis = multiplier !== null ? q * multiplier : q;
            }

            const itemSub = (pricingBasis * p) - d;
            const itemTax = itemSub * (t / 100);

            subtotal += (pricingBasis * p);
            discount += d;
            tax += itemTax;
        });

        return {
            subtotal,
            discount,
            tax,
            grandTotal: subtotal - discount + tax
        };
    };

    const totals = calculateTotals();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        setError(null);

        // Validations
        if (formData.items.length === 0) {
            setError('A Purchase Order must contain at least one line item.');
            setSaving(false);
            return;
        }

        try {
            const token = localStorage.getItem('auth_token');
            if (poId) {
                await axios.put(`/api/purchase-orders/${poId}`, formData, {
                    headers: { Authorization: `Bearer ${token}` }
                });
            } else {
                await axios.post('/api/purchase-orders', formData, {
                    headers: { Authorization: `Bearer ${token}` }
                });
            }
            onSaveSuccess();
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to save Purchase Order.');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="text-center py-5">
                <div className="spinner-border text-primary" role="status"></div>
                <p className="text-muted mt-2">Loading configurations...</p>
            </div>
        );
    }

    return (
        <>
        <form onSubmit={handleSubmit} id="po-form" className="animate__animated animate__fadeIn">
            {/* Top Navigation & Action Bar */}
            <div className="d-flex align-items-center justify-content-between pb-3 border-bottom">
                <div className="d-flex align-items-center gap-3">
                    <button 
                        type="button" 
                        className="btn btn-outline-secondary btn-sm rounded-circle d-flex align-items-center justify-content-center" 
                        style={{ width: '38px', height: '38px' }}
                        onClick={onBack}
                        title="Back to Purchase Orders Registry"
                    >
                        <i className="fa-solid fa-arrow-left fs-6"></i>
                    </button>
                    <div>
                        <div className="d-flex align-items-center gap-2">
                            <h5 className="text-dark mb-0">
                                {poId ? 'Modify Purchase Order' : 'Raise New Purchase Order'}
                            </h5>
                            <span className={`badge ${poId ? 'bg-warning-subtle text-warning-emphasis border border-warning-subtle' : 'bg-primary-subtle text-primary border border-primary-subtle'} px-2 py-1`}>
                                {poId ? 'EDIT MODE' : 'NEW DRAFT'}
                            </span>
                        </div>
                        <p className="text-muted small mb-0 mt-1">
                            Record raw inventory purchasing agreements, taxes, pricing basis, and supplier terms.
                        </p>
                    </div>
                </div>
                <div className="d-flex gap-2">
                    <button type="button" className="btn btn-outline-secondary px-4 fw-semibold" onClick={onBack}>
                        <i className="fa-solid fa-arrow-left me-1.5"></i> Back to Registry
                    </button>
                </div>
            </div>

            {error && (
                <div className="alert alert-danger d-flex align-items-center mb-4 border-0 shadow-sm" role="alert" style={{ borderRadius: '8px' }}>
                    <i className="fa-solid fa-circle-exclamation me-2 fs-5"></i>
                    <div>{error}</div>
                </div>
            )}

            {/* 1. PO Specifications & Supplier Details */}
            <div className="card border-0 shadow-sm mb-4" style={{ borderRadius: '12px', backgroundColor: '#ffffff' }}>
                <div className="card-body p-4">
                    <h6 className="fw-bold text-dark mb-3 border-bottom pb-2 d-flex align-items-center">
                        <i className="fa-solid fa-building-columns text-primary me-2 fs-5"></i>
                        1. Supplier & Order Specifications
                    </h6>
                    <div className="row g-3">
                        <div className="col-md-6">
                            <div className="d-flex justify-content-between align-items-center mb-1">
                                <label className="form-label small fw-semibold text-dark mb-0">Supplier *</label>
                                <button 
                                    type="button" 
                                    className="btn btn-xs btn-link text-primary p-0 text-decoration-none shadow-none fw-semibold"
                                    onClick={() => setShowQuickSupplierModal(true)}
                                >
                                    <i className="fa-solid fa-plus-circle me-1"></i>Quick Add Supplier
                                </button>
                            </div>
                            <div className="input-group">
                                <SearchableSelect
                                    options={suppliers.map(s => ({
                                        value: s.id,
                                        label: `${s.name} (${s.code})`,
                                        searchText: `${s.name} ${s.code}`
                                    }))}
                                    value={formData.supplier_id}
                                    onChange={(val) => handleHeaderChange('supplier_id', val)}
                                    placeholder="-- Select Supplier --"
                                    required
                                />
                                <button 
                                    type="button" 
                                    className="btn btn-outline-secondary" 
                                    onClick={() => setShowQuickSupplierModal(true)}
                                    title="Quick Add Supplier"
                                >
                                    <i className="fa-solid fa-plus"></i>
                                </button>
                            </div>
                        </div>
                        <div className="col-md-6">
                            <div className="d-flex justify-content-between align-items-center mb-1">
                                <label className="form-label small fw-semibold text-dark mb-0">Receiving Branch Location *</label>
                                <button 
                                    type="button" 
                                    className="btn btn-xs btn-link text-primary p-0 text-decoration-none shadow-none fw-semibold"
                                    onClick={() => setShowQuickBranchModal(true)}
                                >
                                    <i className="fa-solid fa-plus-circle me-1"></i>Quick Add Branch
                                </button>
                            </div>
                            <div className="input-group">
                                <SearchableSelect
                                    options={branches.map(b => ({
                                        value: b.id,
                                        label: b.name,
                                        searchText: b.name
                                    }))}
                                    value={formData.branch_id}
                                    onChange={(val) => handleHeaderChange('branch_id', val)}
                                    placeholder="-- Select Branch --"
                                    required
                                />
                                <button 
                                    type="button" 
                                    className="btn btn-outline-secondary" 
                                    onClick={() => setShowQuickBranchModal(true)}
                                    title="Quick Add Branch Location"
                                >
                                    <i className="fa-solid fa-plus"></i>
                                </button>
                            </div>
                        </div>
                        <div className="col-md-4">
                            <label className="form-label small fw-semibold text-dark">PO Number</label>
                            <input
                                type="text"
                                className="form-control font-monospace"
                                value={formData.po_number}
                                onChange={(e) => handleHeaderChange('po_number', e.target.value)}
                                placeholder="Auto-generated if blank"
                            />
                        </div>
                        <div className="col-md-4">
                            <label className="form-label small fw-semibold text-dark">PO Order Date *</label>
                            <input
                                type="date"
                                className="form-control"
                                value={formData.po_date}
                                onChange={(e) => handleHeaderChange('po_date', e.target.value)}
                                required
                            />
                        </div>
                        <div className="col-md-4">
                            <label className="form-label small fw-semibold text-dark">Expected Delivery Date</label>
                            <input
                                type="date"
                                className="form-control"
                                value={formData.expected_delivery_date}
                                onChange={(e) => handleHeaderChange('expected_delivery_date', e.target.value)}
                            />
                        </div>
                    </div>

                    {/* Commercial Terms Accordion */}
                    <div className="accordion mt-4" id="poDetailsAccordion">
                        <div className="accordion-item border-light bg-light rounded-3">
                            <h2 className="accordion-header">
                                <button className="accordion-button collapsed bg-light text-primary fw-semibold fs-6 py-2.5" type="button" data-bs-toggle="collapse" data-bs-target="#collapseTerms">
                                    <i className="fa-solid fa-file-contract me-2"></i> Additional Details (Commercial Terms, Ref Code & Remarks)
                                </button>
                            </h2>
                            <div id="collapseTerms" className="accordion-collapse collapse" data-bs-parent="#poDetailsAccordion">
                                <div className="accordion-body pt-3">
                                    <div className="row g-3">
                                        <div className="col-md-6">
                                            <label className="form-label small fw-semibold">Supplier Quote / Ref Number</label>
                                            <input
                                                type="text"
                                                className="form-control form-control-sm"
                                                value={formData.reference_number}
                                                onChange={(e) => handleHeaderChange('reference_number', e.target.value)}
                                                placeholder="e.g. QUOTE-2026-99"
                                            />
                                        </div>
                                        <div className="col-md-6">
                                            <label className="form-label small fw-semibold">Payment Terms</label>
                                            <input
                                                type="text"
                                                className="form-control form-control-sm"
                                                value={formData.payment_terms}
                                                onChange={(e) => handleHeaderChange('payment_terms', e.target.value)}
                                                placeholder="e.g. 50% advance, 50% on receipt..."
                                            />
                                        </div>
                                        <div className="col-md-6">
                                            <label className="form-label small fw-semibold">Delivery / Freight Terms</label>
                                            <input
                                                type="text"
                                                className="form-control form-control-sm"
                                                value={formData.delivery_terms}
                                                onChange={(e) => handleHeaderChange('delivery_terms', e.target.value)}
                                                placeholder="e.g. FOB Destination, Door Delivery..."
                                            />
                                        </div>
                                        <div className="col-md-6">
                                            <label className="form-label small fw-semibold">Operator Remarks / Internal Notes</label>
                                            <input
                                                type="text"
                                                className="form-control form-control-sm"
                                                value={formData.remarks}
                                                onChange={(e) => handleHeaderChange('remarks', e.target.value)}
                                                placeholder="Internal context, logistics instructions..."
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* 3. PO Line Items */}
            <div className="card border-0 shadow-sm mb-4" style={{ borderRadius: '12px', backgroundColor: '#ffffff' }}>
                <div className="card-body p-4">
                    <div className="d-flex align-items-center justify-content-between mb-3 border-bottom pb-2">
                        <div>
                            <h6 className="fw-bold text-dark mb-0 d-flex align-items-center">
                                <i className="fa-solid fa-list-check text-primary me-2 fs-5"></i>
                                2. Purchase Order Line Items
                            </h6>
                            <span className="text-muted small">Specify item quantities, pricing units, rates, and slab measurements</span>
                        </div>
                        <button type="button" className="btn btn-sm btn-primary px-3 fw-semibold d-flex align-items-center gap-1.5" onClick={handleAddItem}>
                            <i className="fa-solid fa-plus"></i> Add Line Item
                        </button>
                    </div>

                    {formData.items.length === 0 ? (
                        <div className="text-center py-5 border border-dashed rounded-3 bg-light">
                            <div className="rounded-circle bg-primary-subtle text-primary mx-auto d-flex align-items-center justify-content-center mb-3" style={{ width: '56px', height: '56px' }}>
                                <i className="fa-solid fa-box-open fs-3"></i>
                            </div>
                            <h6 className="fw-bold text-dark">No Items Added to Order</h6>
                            <p className="text-muted small mb-3">Click below to start adding product items to this purchase order.</p>
                            <button type="button" className="btn btn-sm btn-outline-primary px-4 fw-semibold" onClick={handleAddItem}>
                                <i className="fa-solid fa-plus me-1"></i> Add Line Item
                            </button>
                        </div>
                    ) : (
                        <div className="table-responsive">
                            <table className="table table-hover align-middle mb-0 border rounded-3 overflow-hidden">
                                <thead className="table-light text-uppercase font-monospace" style={{ fontSize: '0.75rem', letterSpacing: '0.5px' }}>
                                    <tr>
                                        <th style={{ width: '4%' }} className="text-center">#</th>
                                        <th style={{ width: '26%' }}>Product Item *</th>
                                        <th style={{ width: '9%' }} className="text-end">Order Qty *</th>
                                        <th style={{ width: '10%' }}>Order Unit *</th>
                                        <th style={{ width: '20%' }}>Unit Rate (₹) *</th>
                                        <th style={{ width: '13%' }}>Expected Area</th>
                                        <th style={{ width: '7%' }} className="text-end">Disc (₹)</th>
                                        <th style={{ width: '7%' }} className="text-center">Tax %</th>
                                        <th style={{ width: '10%' }} className="text-end">Line Total (₹)</th>
                                        <th style={{ width: '4%' }} className="text-center"></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {formData.items.map((item, index) => {
                                        const product = products.find(p => p.id === parseInt(item.product_variant_id));
                                        const isSlab = product?.inventory_behavior === 'SLAB';
                                        const validUnits = getValidUnitsForProduct(product);
                                        const validPricingUnits = getValidPricingUnits(product, item.unit_id);

                                        const q = parseFloat(item.quantity || 0.0);
                                        const r = parseFloat(item.unit_price || 0.0);
                                        const d = parseFloat(item.discount_amount || 0.0);
                                        const t = parseFloat(item.tax_rate || 0.0);

                                        let pricingBasis = q;
                                        let multiplierHint = '';

                                        if (isSlab) {
                                            pricingBasis = parseFloat(item.estimated_pricing_quantity || 0.0);
                                        } else if (item.unit_id && item.pricing_unit_id && parseInt(item.unit_id) !== parseInt(item.pricing_unit_id)) {
                                            const multiplier = getConversionMultiplier(item.product_variant_id, item.unit_id, item.pricing_unit_id);
                                            if (multiplier !== null) {
                                                pricingBasis = q * multiplier;
                                                const fromSymbol = units.find(u => u.id === parseInt(item.unit_id))?.symbol || '';
                                                const toSymbol = units.find(u => u.id === parseInt(item.pricing_unit_id))?.symbol || '';
                                                multiplierHint = `${q} ${fromSymbol} = ${pricingBasis.toFixed(2)} ${toSymbol}`;
                                            }
                                        }

                                        const lineAmount = (pricingBasis * r) - d;
                                        const lineTotal = lineAmount + (lineAmount * (t / 100));

                                        return (
                                            <tr key={index}>
                                                <td className="text-center fw-bold text-muted small">{index + 1}</td>
                                                <td>
                                                    <select
                                                        className="form-select form-select-sm"
                                                        value={item.product_variant_id}
                                                        onChange={(e) => handleItemChange(index, 'product_variant_id', e.target.value)}
                                                        required
                                                    >
                                                        <option value="">-- Choose Item --</option>
                                                        {products.map(p => (
                                                            <option key={p.id} value={p.id}>
                                                                {p.name} ({p.sku})
                                                            </option>
                                                        ))}
                                                    </select>
                                                    {product && (
                                                        <div className="mt-1 d-flex gap-1 align-items-center">
                                                            <span className={`badge ${isSlab ? 'bg-warning-subtle text-warning-emphasis border border-warning-subtle' : 'bg-primary-subtle text-primary'} px-1.5 py-0.5`} style={{ fontSize: '0.68rem' }}>
                                                                {isSlab ? 'MEASURED SLAB' : 'STANDARD'}
                                                            </span>
                                                            <span className="text-muted font-monospace" style={{ fontSize: '0.68rem' }}>SKU: {product.sku}</span>
                                                        </div>
                                                    )}
                                                </td>
                                                <td>
                                                    <input
                                                        type="number"
                                                        step="0.0001"
                                                        className="form-control form-control-sm text-end font-monospace"
                                                        value={item.quantity}
                                                        onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                                                        required
                                                        min="0.0001"
                                                    />
                                                </td>
                                                <td>
                                                    {isSlab ? (
                                                        <span className="form-control form-control-sm bg-light text-muted text-center fw-semibold">SLAB</span>
                                                    ) : (
                                                        <select
                                                            className="form-select form-select-sm"
                                                            value={item.unit_id}
                                                            onChange={(e) => handleItemChange(index, 'unit_id', e.target.value)}
                                                            required
                                                        >
                                                            <option value="">-- Unit --</option>
                                                            {validUnits.map(u => (
                                                                <option key={u.id} value={u.id}>{u.symbol}</option>
                                                            ))}
                                                        </select>
                                                    )}
                                                </td>
                                                <td>
                                                    <div className="d-flex align-items-center gap-1">
                                                        <div className="input-group input-group-sm" style={{ width: '100px' }}>
                                                            <span className="input-group-text px-1.5">₹</span>
                                                            <input
                                                                type="number"
                                                                step="0.01"
                                                                className="form-control text-end font-monospace px-1.5"
                                                                value={item.unit_price}
                                                                onChange={(e) => handleItemChange(index, 'unit_price', e.target.value)}
                                                                required
                                                                min="0"
                                                            />
                                                        </div>
                                                        <span className="text-muted small">per</span>
                                                        {isSlab ? (
                                                            <span className="badge bg-secondary-subtle text-secondary py-1.5 px-2">SQFT</span>
                                                        ) : (
                                                            <select
                                                                className="form-select form-select-sm py-0.5 px-1 text-center"
                                                                value={item.pricing_unit_id}
                                                                onChange={(e) => handleItemChange(index, 'pricing_unit_id', e.target.value)}
                                                                required
                                                                style={{ width: '68px', fontSize: '0.75rem' }}
                                                            >
                                                                {validPricingUnits.map(u => (
                                                                    <option key={u.id} value={u.id}>{u.symbol}</option>
                                                                ))}
                                                            </select>
                                                        )}
                                                    </div>
                                                    {multiplierHint && (
                                                        <div className="text-primary mt-1" style={{ fontSize: '10px' }}>
                                                            <i className="fa-solid fa-circle-info me-1"></i>
                                                            {multiplierHint}
                                                        </div>
                                                    )}
                                                </td>
                                                <td>
                                                    {isSlab ? (
                                                        <div>
                                                            <input
                                                                type="number"
                                                                step="0.0001"
                                                                className="form-control form-control-sm text-end font-monospace border-warning"
                                                                value={item.estimated_pricing_quantity || ''}
                                                                onChange={(e) => handleItemChange(index, 'estimated_pricing_quantity', e.target.value)}
                                                                placeholder="Est. SQFT"
                                                                required
                                                            />
                                                            <span className="text-muted d-block text-end mt-0.5" style={{ fontSize: '10px' }}>Est. Total Area</span>
                                                        </div>
                                                    ) : (
                                                        <span className="text-muted d-block text-center font-monospace" style={{ fontSize: '0.8rem' }}>—</span>
                                                    )}
                                                </td>
                                                <td>
                                                    <input
                                                        type="number"
                                                        step="0.01"
                                                        className="form-control form-control-sm text-end font-monospace"
                                                        value={item.discount_amount}
                                                        onChange={(e) => handleItemChange(index, 'discount_amount', e.target.value)}
                                                        min="0"
                                                    />
                                                </td>
                                                <td>
                                                    <select
                                                        className="form-select form-select-sm text-end"
                                                        value={item.tax_rate}
                                                        onChange={(e) => handleItemChange(index, 'tax_rate', e.target.value)}
                                                    >
                                                        <option value="0">0%</option>
                                                        <option value="5">5%</option>
                                                        <option value="12">12%</option>
                                                        <option value="18">18%</option>
                                                        <option value="28">28%</option>
                                                    </select>
                                                </td>
                                                <td className="text-end fw-bold font-monospace text-dark">
                                                    ₹{lineTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                </td>
                                                <td className="text-center">
                                                    <button
                                                        type="button"
                                                        className="btn btn-link btn-sm text-danger p-0 border-0"
                                                        onClick={() => handleRemoveItem(index)}
                                                        title="Remove Line Item"
                                                    >
                                                        <i className="fa-solid fa-trash-can fs-6"></i>
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>

            {/* 4. Financial Summary Dashboard & Save Control */}
            <div className="card border-0 shadow-sm p-4 mb-4" style={{ borderRadius: '12px', backgroundColor: '#f8fafc' }}>
                <h6 className="fw-bold text-dark mb-3 border-bottom pb-2 d-flex align-items-center">
                    <i className="fa-solid fa-calculator text-primary me-2 fs-5"></i>
                    3. Purchase Order Financial Summary
                </h6>
                
                <div className="row g-4 align-items-center">
                    <div className="col-lg-7">
                        <div className="row g-3">
                            <div className="col-6 col-sm-4">
                                <div className="p-3 bg-white border rounded-3 text-center shadow-sm">
                                    <div className="text-muted small mb-1">Total Line Items</div>
                                    <div className="fw-bold fs-5 text-dark">{formData.items.length} Items</div>
                                </div>
                            </div>
                            <div className="col-6 col-sm-4">
                                <div className="p-3 bg-white border rounded-3 text-center shadow-sm">
                                    <div className="text-muted small mb-1">Taxable Subtotal</div>
                                    <div className="fw-bold fs-5 text-dark">₹{totals.subtotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                                </div>
                            </div>
                            <div className="col-6 col-sm-4">
                                <div className="p-3 bg-white border rounded-3 text-center shadow-sm">
                                    <div className="text-muted small mb-1">GST Tax Total</div>
                                    <div className="fw-bold fs-5 text-primary">+₹{totals.tax.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="col-lg-5">
                        <div className="p-3 bg-white border border-success-subtle rounded-3 shadow-sm">
                            <div className="d-flex justify-content-between mb-2">
                                <span className="text-muted small">Subtotal:</span>
                                <span className="fw-semibold small">₹{totals.subtotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                            </div>
                            <div className="d-flex justify-content-between mb-2 text-danger small">
                                <span>Total Discounts:</span>
                                <span>-₹{totals.discount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                            </div>
                            <div className="d-flex justify-content-between mb-2 text-primary small">
                                <span>GST Tax Total:</span>
                                <span>+₹{totals.tax.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                            </div>
                            <hr className="my-2" />
                            <div className="d-flex justify-content-between align-items-center mb-3">
                                <span className="fw-bold text-dark fs-6">Grand Total:</span>
                                <span className="fs-4 fw-bold text-success">₹{totals.grandTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                            </div>

                            <button
                                type="submit"
                                className="btn btn-success w-100 py-2.5 shadow-sm fw-bold fs-6"
                                disabled={saving}
                            >
                                {saving ? (
                                    <>
                                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                        Saving Purchase Order...
                                    </>
                                ) : (
                                    <>
                                        <i className="fa-solid fa-floppy-disk me-2"></i> Save Purchase Order
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </form>

        {/* Quick Add Supplier Modal */}
        <QuickSupplierModal 
            show={showQuickSupplierModal}
            onClose={() => setShowQuickSupplierModal(false)}
            onSave={handleSupplierSaved}
        />

        {/* Quick Add Branch Location Modal */}
        <QuickBranchModal 
            show={showQuickBranchModal}
            onClose={() => setShowQuickBranchModal(false)}
            onSave={handleBranchSaved}
        />
        </>
    );
}
