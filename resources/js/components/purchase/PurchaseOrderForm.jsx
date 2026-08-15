import React, { useState, useEffect } from 'react';
import axios from 'axios';

export default function PurchaseOrderForm({ poId, onBack, onSaveSuccess }) {
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);

    // Form inputs reference context
    const [suppliers, setSuppliers] = useState([]);
    const [branches, setBranches] = useState([]);
    const [units, setUnits] = useState([]);
    const [products, setProducts] = useState([]);
    const [conversions, setConversions] = useState([]);
    const [requisitions, setRequisitions] = useState([]);

    // Workflow Selection: Direct PO or PR based
    const [usePr, setUsePr] = useState(false);

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
                setRequisitions(res.data.approved_requisitions || []);

                if (poId) {
                    // Edit Mode: fetch PO details
                    const poRes = await axios.get(`/api/purchase-orders/${poId}`, {
                        headers: { Authorization: `Bearer ${token}` }
                    });
                    const po = poRes.data.data;
                    if (po.purchase_requisition_id) {
                        setUsePr(true);
                    }
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

    // Handle requisition selection conversion
    const handleRequisitionChange = (reqId) => {
        if (!reqId) {
            setFormData(prev => ({
                ...prev,
                purchase_requisition_id: '',
                items: []
            }));
            return;
        }

        const selectedPR = requisitions.find(r => r.id === parseInt(reqId));
        if (!selectedPR) return;

        // Auto-assign items from Requisition
        const mappedItems = selectedPR.items.map(item => {
            const variant = products.find(p => p.id === item.product_variant_id);
            const defaultPrice = variant ? parseFloat(variant.cost_price || 0.0) : 0.0;
            const uId = item.unit_id || (variant?.purchase_unit_id || variant?.base_unit_id);
            return {
                product_variant_id: item.product_variant_id,
                quantity: parseFloat(item.quantity),
                unit_id: uId,
                pricing_unit_id: variant?.purchase_unit_id || variant?.base_unit_id || uId,
                estimated_pricing_quantity: parseFloat(item.quantity),
                unit_price: defaultPrice,
                discount_amount: 0.0,
                tax_rate: 18.0
            };
        });

        setFormData(prev => ({
            ...prev,
            purchase_requisition_id: reqId,
            branch_id: selectedPR.branch_id || prev.branch_id,
            items: mappedItems
        }));
    };

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
        <form onSubmit={handleSubmit} className="animate__animated animate__fadeIn">
            <div className="d-flex align-items-center justify-content-between mb-4">
                <div>
                    <h3 className="fw-bold text-dark">{poId ? 'Modify Draft Purchase Order' : 'Raise New Purchase Order'}</h3>
                    <p className="text-muted small mb-0">Record raw inventory purchasing agreements, taxes, and supplier delivery terms.</p>
                </div>
                <button type="button" className="btn btn-outline-secondary px-4" onClick={onBack}>
                    <i className="fa-solid fa-arrow-left me-2"></i> Registry List
                </button>
            </div>

            {error && (
                <div className="alert alert-danger" role="alert">
                    <i className="fa-solid fa-circle-exclamation me-2"></i>
                    {error}
                </div>
            )}

            {/* Part 23: Requisition Workflow Toggle */}
            <div className="card border-0 shadow-sm p-4 mb-4" style={{ borderRadius: '12px' }}>
                <h5 className="fw-bold mb-3 text-secondary border-bottom pb-2">Purchase Order Source</h5>
                <div className="d-flex gap-4 mb-2">
                    <div className="form-check">
                        <input
                            className="form-check-input"
                            type="radio"
                            name="poSourceType"
                            id="sourceDirect"
                            checked={!usePr}
                            onChange={() => {
                                setUsePr(false);
                                handleRequisitionChange('');
                            }}
                            disabled={!!poId}
                        />
                        <label className="form-check-label fw-semibold" htmlFor="sourceDirect">
                            Start New Order (Direct PO)
                        </label>
                    </div>
                    <div className="form-check">
                        <input
                            className="form-check-input"
                            type="radio"
                            name="poSourceType"
                            id="sourcePR"
                            checked={usePr}
                            onChange={() => setUsePr(true)}
                            disabled={!!poId}
                        />
                        <label className="form-check-label fw-semibold" htmlFor="sourcePR">
                            From Approved Purchase Requisition
                        </label>
                    </div>
                </div>

                {usePr && (
                    <div className="row mt-3">
                        <div className="col-md-6">
                            <label className="form-label small fw-semibold">Approved Requisition *</label>
                            <select
                                className="form-select"
                                value={formData.purchase_requisition_id}
                                onChange={(e) => handleRequisitionChange(e.target.value)}
                                disabled={!!poId}
                                required
                            >
                                <option value="">-- Choose Requisition --</option>
                                {requisitions.map(r => (
                                    <option key={r.id} value={r.id}>
                                        {r.pr_number} (Requested by: {r.requester?.name || 'PR Client'})
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                )}
            </div>

            <div className="row g-4">
                {/* Header Information */}
                <div className="col-lg-8">
                    <div className="card border-0 shadow-sm p-4 mb-4" style={{ borderRadius: '12px' }}>
                        <h5 className="fw-bold mb-3 text-secondary border-bottom pb-2">PO Specifications</h5>
                        <div className="row g-3">
                            <div className="col-md-6">
                                <label className="form-label small fw-semibold">Supplier *</label>
                                <select
                                    className="form-select"
                                    value={formData.supplier_id}
                                    onChange={(e) => handleHeaderChange('supplier_id', e.target.value)}
                                    required
                                >
                                    <option value="">-- Select Supplier --</option>
                                    {suppliers.map(s => (
                                        <option key={s.id} value={s.id}>{s.name} ({s.code})</option>
                                    ))}
                                </select>
                            </div>
                            <div className="col-md-6">
                                <label className="form-label small fw-semibold">Branch Location *</label>
                                <select
                                    className="form-select"
                                    value={formData.branch_id}
                                    onChange={(e) => handleHeaderChange('branch_id', e.target.value)}
                                    required
                                >
                                    <option value="">-- Select Branch --</option>
                                    {branches.map(b => (
                                        <option key={b.id} value={b.id}>{b.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="col-md-6">
                                <label className="form-label small fw-semibold">PO Number (Leave blank to auto-generate)</label>
                                <input
                                    type="text"
                                    className="form-control font-monospace"
                                    value={formData.po_number}
                                    onChange={(e) => handleHeaderChange('po_number', e.target.value)}
                                    placeholder="e.g. PO-2026-0001"
                                />
                            </div>
                            <div className="col-md-6">
                                <label className="form-label small fw-semibold">PO Date *</label>
                                <input
                                    type="date"
                                    className="form-control"
                                    value={formData.po_date}
                                    onChange={(e) => handleHeaderChange('po_date', e.target.value)}
                                    required
                                />
                            </div>
                        </div>

                        {/* Part 22: Progressive Disclosure for Additional details */}
                        <details className="mt-4">
                            <summary className="text-primary fw-semibold cursor-pointer mb-2" style={{ outline: 'none' }}>
                                ▸ Additional Details
                            </summary>
                            <div className="row g-3 pt-2">
                                <div className="col-md-6">
                                    <label className="form-label small fw-semibold">Expected Delivery Date</label>
                                    <input
                                        type="date"
                                        className="form-control"
                                        value={formData.expected_delivery_date}
                                        onChange={(e) => handleHeaderChange('expected_delivery_date', e.target.value)}
                                    />
                                </div>
                                <div className="col-md-6">
                                    <label className="form-label small fw-semibold">Supplier Quote/Reference Number</label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        value={formData.reference_number}
                                        onChange={(e) => handleHeaderChange('reference_number', e.target.value)}
                                        placeholder="e.g. QUOTE-998"
                                    />
                                </div>
                                <div className="col-md-6">
                                    <label className="form-label small fw-semibold">Payment Terms</label>
                                    <textarea
                                        className="form-control form-control-sm"
                                        rows="2"
                                        value={formData.payment_terms}
                                        onChange={(e) => handleHeaderChange('payment_terms', e.target.value)}
                                        placeholder="e.g. 50% advance, 50% on receipt..."
                                    />
                                </div>
                                <div className="col-md-6">
                                    <label className="form-label small fw-semibold">Delivery Terms</label>
                                    <textarea
                                        className="form-control form-control-sm"
                                        rows="2"
                                        value={formData.delivery_terms}
                                        onChange={(e) => handleHeaderChange('delivery_terms', e.target.value)}
                                        placeholder="e.g. FOB Staging Warehouse..."
                                    />
                                </div>
                                <div className="col-md-12">
                                    <label className="form-label small fw-semibold">Operator Remarks</label>
                                    <textarea
                                        className="form-control form-control-sm"
                                        rows="2"
                                        value={formData.remarks}
                                        onChange={(e) => handleHeaderChange('remarks', e.target.value)}
                                        placeholder="Internal context, logistics info..."
                                    />
                                </div>
                            </div>
                        </details>
                    </div>

                    {/* PO Items */}
                    <div className="card border-0 shadow-sm p-4" style={{ borderRadius: '12px' }}>
                        <div className="d-flex align-items-center justify-content-between mb-3 border-bottom pb-2">
                            <h5 className="fw-bold mb-0 text-secondary">PO Line Items</h5>
                            <button type="button" className="btn btn-sm btn-dark" onClick={handleAddItem}>
                                <i className="fa-solid fa-plus me-1 text-warning"></i> Add Item Row
                            </button>
                        </div>

                        <div className="table-responsive">
                            <table className="table table-bordered table-sm align-middle mb-0">
                                <thead className="table-light text-uppercase font-monospace" style={{ fontSize: '0.75rem' }}>
                                    <tr>
                                        <th style={{ width: '28%' }}>Product Variant *</th>
                                        <th style={{ width: '10%' }}>Qty *</th>
                                        <th style={{ width: '10%' }}>Order Unit *</th>
                                        <th style={{ width: '20%' }}>Rate *</th>
                                        <th style={{ width: '12%' }}>Expected Measurement</th>
                                        <th style={{ width: '8%' }}>Discount</th>
                                        <th style={{ width: '8%' }}>Tax %</th>
                                        <th style={{ width: '4%' }}></th>
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
                                                multiplierHint = `${q} ${fromSymbol} = ${pricingBasis.toFixed(2)} ${toSymbol} for pricing`;
                                            }
                                        }

                                        const lineAmount = (pricingBasis * r) - d;
                                        const lineTotal = lineAmount + (lineAmount * (t / 100));

                                        return (
                                            <tr key={index}>
                                                <td>
                                                    <select
                                                        className="form-select form-select-sm"
                                                        value={item.product_variant_id}
                                                        onChange={(e) => handleItemChange(index, 'product_variant_id', e.target.value)}
                                                        required
                                                    >
                                                        <option value="">-- Choose Variant --</option>
                                                        {products.map(p => (
                                                            <option key={p.id} value={p.id}>
                                                                {p.name} ({p.sku})
                                                            </option>
                                                        ))}
                                                    </select>
                                                </td>
                                                <td>
                                                    <input
                                                        type="number"
                                                        step="0.0001"
                                                        className="form-control form-control-sm text-end"
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
                                                        <div className="input-group input-group-sm" style={{ width: '90px' }}>
                                                            <span className="input-group-text">₹</span>
                                                            <input
                                                                type="number"
                                                                step="0.01"
                                                                className="form-control text-end"
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
                                                        <input
                                                            type="number"
                                                            step="0.0001"
                                                            className="form-control form-control-sm text-end font-monospace"
                                                            value={item.estimated_pricing_quantity || ''}
                                                            onChange={(e) => handleItemChange(index, 'estimated_pricing_quantity', e.target.value)}
                                                            placeholder="Expected Area"
                                                            required
                                                        />
                                                    ) : (
                                                        <span className="text-muted d-block text-center">—</span>
                                                    )}
                                                </td>
                                                <td>
                                                    <input
                                                        type="number"
                                                        step="0.01"
                                                        className="form-control form-control-sm text-end"
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
                                                <td className="text-center">
                                                    <button
                                                        type="button"
                                                        className="btn btn-link btn-sm text-danger p-0 border-0"
                                                        onClick={() => handleRemoveItem(index)}
                                                    >
                                                        <i className="fa-solid fa-trash-can"></i>
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* Terms and Financial summary */}
                <div className="col-lg-4">
                    <div className="card border-0 shadow-sm bg-light p-4" style={{ borderRadius: '12px' }}>
                        <h5 className="fw-bold mb-3 text-secondary border-bottom pb-2">Price Summary</h5>
                        <div className="d-flex justify-content-between mb-2">
                            <span className="text-muted">Subtotal:</span>
                            <span className="fw-semibold">₹{totals.subtotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                        </div>
                        <div className="d-flex justify-content-between mb-2 text-danger">
                            <span>Discounts:</span>
                            <span>-₹{totals.discount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                        </div>
                        <div className="d-flex justify-content-between mb-3 text-primary">
                            <span>GST Tax Total:</span>
                            <span>+₹{totals.tax.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                        </div>
                        <hr />
                        <div className="d-flex justify-content-between align-items-center mb-4">
                            <span className="h6 mb-0 text-dark fw-bold">Grand Total:</span>
                            <span className="h5 mb-0 fw-bold text-success">₹{totals.grandTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                        </div>

                        <button
                            type="submit"
                            className="btn btn-success w-100 py-2.5 shadow-sm fw-bold animate__animated animate__pulse animate__infinite"
                            style={{ animationDuration: '3s' }}
                            disabled={saving}
                        >
                            {saving ? (
                                <>
                                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                    Saving Draft...
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
        </form>
    );
}
