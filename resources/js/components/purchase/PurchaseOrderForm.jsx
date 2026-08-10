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
    const [requisitions, setRequisitions] = useState([]);

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
                setRequisitions(res.data.approved_requisitions || []);

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
            // Find base/purchase unit
            const variant = products.find(p => p.id === item.product_variant_id);
            const defaultPrice = variant ? parseFloat(variant.cost_price || 0.0) : 0.0;
            return {
                product_variant_id: item.product_variant_id,
                quantity: parseFloat(item.quantity),
                unit_id: item.unit_id || (variant?.purchase_unit_id || variant?.base_unit_id),
                unit_price: defaultPrice,
                discount_amount: 0.0,
                tax_rate: 18.0 // default tax profile rate or fallback
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
                updatedItems[index].unit_id = variant.purchase_unit_id || variant.base_unit_id || '';
                updatedItems[index].unit_price = parseFloat(variant.cost_price || 0.0);
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
            const q = parseFloat(item.quantity || 0.0);
            const p = parseFloat(item.unit_price || 0.0);
            const d = parseFloat(item.discount_amount || 0.0);
            const t = parseFloat(item.tax_rate || 0.0);

            const itemSub = (q * p) - d;
            const itemTax = itemSub * (t / 100);

            subtotal += (q * p);
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

            <div className="row g-4">
                {/* Header Information */}
                <div className="col-lg-8">
                    <div className="card border-0 shadow-sm p-4 mb-4" style={{ borderRadius: '12px' }}>
                        <h5 className="fw-bold mb-3 text-secondary border-bottom pb-2">1. Header Information</h5>
                        <div className="row g-3">
                            <div className="col-md-6">
                                <label className="form-label small fw-semibold">Convert from Purchase Requisition</label>
                                <select
                                    className="form-select"
                                    value={formData.purchase_requisition_id}
                                    onChange={(e) => handleRequisitionChange(e.target.value)}
                                    disabled={!!poId}
                                >
                                    <option value="">-- Direct PO (No Requisition) --</option>
                                    {requisitions.map(r => (
                                        <option key={r.id} value={r.id}>
                                            {r.pr_number} (Requested by: {r.requester?.name || 'PR Client'})
                                        </option>
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
                        </div>
                    </div>

                    {/* PO Items */}
                    <div className="card border-0 shadow-sm p-4" style={{ borderRadius: '12px' }}>
                        <div className="d-flex align-items-center justify-content-between mb-3 border-bottom pb-2">
                            <h5 className="fw-bold mb-0 text-secondary">2. Line Items</h5>
                            <button type="button" className="btn btn-sm btn-dark" onClick={handleAddItem}>
                                <i className="fa-solid fa-plus me-1 text-warning"></i> Add Item Row
                            </button>
                        </div>

                        <div className="table-responsive">
                            <table className="table table-bordered table-sm align-middle">
                                <thead className="table-light text-uppercase font-monospace" style={{ fontSize: '0.75rem' }}>
                                    <tr>
                                        <th style={{ width: '35%' }}>Product Variant *</th>
                                        <th style={{ width: '12%' }}>Quantity *</th>
                                        <th style={{ width: '15%' }}>Unit *</th>
                                        <th style={{ width: '15%' }}>Rate *</th>
                                        <th style={{ width: '10%' }}>Discount</th>
                                        <th style={{ width: '10%' }}>Tax %</th>
                                        <th style={{ width: '3%' }}></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {formData.items.map((item, index) => (
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
                                                <select
                                                    className="form-select form-select-sm"
                                                    value={item.unit_id}
                                                    onChange={(e) => handleItemChange(index, 'unit_id', e.target.value)}
                                                    required
                                                >
                                                    <option value="">-- Select --</option>
                                                    {units.map(u => (
                                                        <option key={u.id} value={u.id}>{u.name} ({u.symbol})</option>
                                                    ))}
                                                </select>
                                            </td>
                                            <td>
                                                <div className="input-group input-group-sm">
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
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* Terms and Financial summary */}
                <div className="col-lg-4">
                    <div className="card border-0 shadow-sm p-4 mb-4" style={{ borderRadius: '12px' }}>
                        <h5 className="fw-bold mb-3 text-secondary border-bottom pb-2">3. Commercial Terms</h5>
                        <div className="mb-3">
                            <label className="form-label small fw-semibold">Payment Terms</label>
                            <textarea
                                className="form-control form-control-sm"
                                rows="2"
                                value={formData.payment_terms}
                                onChange={(e) => handleHeaderChange('payment_terms', e.target.value)}
                                placeholder="e.g. 50% advance, 50% on receipt..."
                            />
                        </div>
                        <div className="mb-3">
                            <label className="form-label small fw-semibold">Delivery Terms</label>
                            <textarea
                                className="form-control form-control-sm"
                                rows="2"
                                value={formData.delivery_terms}
                                onChange={(e) => handleHeaderChange('delivery_terms', e.target.value)}
                                placeholder="e.g. FOB Staging Warehouse, carriage inclusive..."
                            />
                        </div>
                        <div className="mb-3">
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

                    <div className="card border-0 shadow-sm bg-light p-4" style={{ borderRadius: '12px' }}>
                        <h5 className="fw-bold mb-3 text-secondary border-bottom pb-2">4. Price Totals</h5>
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
                            className="btn btn-success w-100 py-2.5 shadow-sm fw-bold"
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
