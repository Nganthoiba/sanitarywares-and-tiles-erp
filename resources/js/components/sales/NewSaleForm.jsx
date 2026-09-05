import React, { useState, useEffect } from 'react';
import axios from 'axios';
import QuickCustomerModal from './QuickCustomerModal';
import TaxInvoiceModal from './TaxInvoiceModal';

export default function NewSaleForm({ onSaleCompleted }) {
    const [formData, setFormData] = useState({
        customer_id: '',
        warehouse_id: '',
        invoice_date: new Date().toISOString().split('T')[0],
        payment_method: 'CASH',
        paid_amount: 0,
        notes: '',
        items: []
    });

    const [context, setContext] = useState({
        customers: [],
        warehouses: [],
        units: [],
        organization: null,
        products: []
    });

    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');

    // Modal States
    const [showCustomerModal, setShowCustomerModal] = useState(false);
    const [createdInvoice, setCreatedInvoice] = useState(null);
    const [showInvoiceModal, setShowInvoiceModal] = useState(false);

    // Slab selection modal state
    const [slabModalItemIndex, setSlabModalItemIndex] = useState(null);

    // Selected product state for quick adding
    const [selectedProductId, setSelectedProductId] = useState('');
    const [productSearch, setProductSearch] = useState('');

    useEffect(() => {
        fetchFormData();
    }, []);

    const fetchFormData = async () => {
        setLoading(true);
        setError('');
        try {
            const token = localStorage.getItem('auth_token');
            const res = await axios.get('/api/sales/form-data', {
                headers: { Authorization: `Bearer ${token}` }
            });

            const data = res.data;
            setContext(data);

            // Default warehouse to first available
            const defaultWarehouseId = data.warehouses?.[0]?.id || '';
            
            // Default customer to Cash / Walk-in customer or first customer
            const walkInCust = data.customers?.find(c => c.name.toLowerCase().includes('walk-in') || c.name.toLowerCase().includes('cash')) || data.customers?.[0];

            setFormData(prev => ({
                ...prev,
                warehouse_id: defaultWarehouseId,
                customer_id: walkInCust?.id || ''
            }));
        } catch (err) {
            setError('Failed to load sales form metadata.');
        } finally {
            setLoading(false);
        }
    };

    const handleCustomerCreated = (newCust) => {
        setContext(prev => ({
            ...prev,
            customers: [newCust, ...prev.customers]
        }));
        setFormData(prev => ({ ...prev, customer_id: newCust.id }));
    };

    // Automatic unit price calculation engine based on database pricing & packaging basis
    const calculateUnitPrice = (product, targetBasis) => {
        if (!product) return 0.0;

        const pricing = product.current_pricing || product.pricings?.[0];
        if (!pricing || !pricing.selling_price) {
            return 0.0;
        }

        const basePrice = parseFloat(pricing.selling_price || 0);
        const dbBasis = (pricing.price_basis || 'PCS').toUpperCase();
        const target = (targetBasis || dbBasis).toUpperCase();

        if (dbBasis === target) {
            return basePrice;
        }

        const piecesPerBox = parseInt(product.pieces_per_box || pricing.pieces_per_box || 1, 10) || 1;
        const sqftPerBox = parseFloat(product.sqft_per_box || 0);
        const sqftPerPiece = sqftPerBox > 0 ? (sqftPerBox / piecesPerBox) : (parseFloat(product.sqft_per_piece || 0) || 0);

        // 1. Convert basePrice from dbBasis to price-per-piece (PCS)
        let pricePerPiece = 0;
        if (dbBasis === 'PCS') {
            pricePerPiece = basePrice;
        } else if (dbBasis === 'BOX') {
            pricePerPiece = basePrice / piecesPerBox;
        } else if (dbBasis === 'SQFT') {
            pricePerPiece = sqftPerPiece > 0 ? basePrice * sqftPerPiece : (sqftPerBox > 0 ? (basePrice * sqftPerBox / piecesPerBox) : basePrice);
        } else if (dbBasis === 'SQM') {
            const pricePerSqft = basePrice / 10.76391;
            pricePerPiece = sqftPerPiece > 0 ? pricePerSqft * sqftPerPiece : basePrice;
        } else {
            pricePerPiece = basePrice;
        }

        // 2. Convert price-per-piece (PCS) to targetBasis
        let targetPrice = 0;
        if (target === 'PCS') {
            targetPrice = pricePerPiece;
        } else if (target === 'BOX') {
            targetPrice = pricePerPiece * piecesPerBox;
        } else if (target === 'SQFT') {
            targetPrice = sqftPerPiece > 0 ? (pricePerPiece / sqftPerPiece) : (sqftPerBox > 0 ? (pricePerPiece * piecesPerBox / sqftPerBox) : pricePerPiece);
        } else if (target === 'SQM') {
            const pricePerSqft = sqftPerPiece > 0 ? (pricePerPiece / sqftPerPiece) : pricePerPiece;
            targetPrice = pricePerSqft * 10.76391;
        } else {
            targetPrice = pricePerPiece;
        }

        return Math.round(targetPrice * 100) / 100;
    };

    const handleAddProductLine = (productId) => {
        if (!productId) return;
        const product = context.products.find(p => p.id === parseInt(productId));
        if (!product) return;

        const defaultBasis = (product.current_pricing?.price_basis || product.pricings?.[0]?.price_basis || 'PCS').toUpperCase();
        const autoPrice = calculateUnitPrice(product, defaultBasis);

        const newItem = {
            product_variant_id: product.id,
            product_name: product.name,
            sku: product.sku,
            inventory_behavior: product.inventory_behavior,
            unit_id: product.base_unit_id,
            price_basis: defaultBasis,
            quantity: 1,
            unit_price: autoPrice,
            discount_amount: 0,
            tax_rate: product.tax_rate || 18.00,
            slab_ids: [],
            available_slabs: product.available_slabs || []
        };

        setFormData(prev => ({
            ...prev,
            items: [...prev.items, newItem]
        }));

        setSelectedProductId('');
    };

    const handleRemoveItem = (index) => {
        setFormData(prev => ({
            ...prev,
            items: prev.items.filter((_, i) => i !== index)
        }));
    };

    const handleItemChange = (index, field, value) => {
        setFormData(prev => {
            const newItems = [...prev.items];
            const currentItem = newItems[index];

            if (field === 'price_basis') {
                const product = context.products.find(p => p.id === currentItem.product_variant_id);
                const recalculatedPrice = calculateUnitPrice(product, value);
                newItems[index] = {
                    ...currentItem,
                    price_basis: value,
                    unit_price: recalculatedPrice
                };
            } else {
                newItems[index] = { ...currentItem, [field]: value };
            }

            return { ...prev, items: newItems };
        });
    };

    // Calculate totals dynamically
    const selectedCustomer = context.customers?.find(c => c.id === parseInt(formData.customer_id));
    const customerState = trimString(selectedCustomer?.state);
    const orgState = trimString(context.organization?.state);
    const isInterState = customerState && orgState && customerState !== orgState;

    let totalSubtotal = 0;
    let totalDiscount = 0;
    let totalTaxable = 0;
    let totalCGST = 0;
    let totalSGST = 0;
    let totalIGST = 0;
    let totalTax = 0;
    let grandTotal = 0;

    const calculatedItems = formData.items.map(item => {
        const qty = parseFloat(item.quantity || 0);
        const price = parseFloat(item.unit_price || 0);
        const disc = parseFloat(item.discount_amount || 0);
        const taxRate = parseFloat(item.tax_rate || 18);

        const lineGross = qty * price;
        const lineTaxable = Math.max(0, lineGross - disc);

        let cgst = 0, sgst = 0, igst = 0, lineTax = 0;

        if (isInterState) {
            igst = (lineTaxable * taxRate) / 100;
            lineTax = igst;
        } else {
            cgst = (lineTaxable * (taxRate / 2)) / 100;
            sgst = (lineTaxable * (taxRate / 2)) / 100;
            lineTax = cgst + sgst;
        }

        const lineTotal = lineTaxable + lineTax;

        totalSubtotal += lineGross;
        totalDiscount += disc;
        totalTaxable += lineTaxable;
        totalCGST += cgst;
        totalSGST += sgst;
        totalIGST += igst;
        totalTax += lineTax;
        grandTotal += lineTotal;

        return { ...item, lineGross, lineTaxable, cgst, sgst, igst, lineTax, lineTotal };
    });

    const balanceDue = Math.max(0, grandTotal - parseFloat(formData.paid_amount || 0));

    // Handle full paid shortcut
    const handleSetFullPaid = () => {
        setFormData(prev => ({ ...prev, paid_amount: Math.round(grandTotal) }));
    };

    const handleSubmitSale = async (e) => {
        e.preventDefault();

        if (!formData.customer_id) {
            setError('Please select a customer.');
            return;
        }
        if (!formData.warehouse_id) {
            setError('Please select a warehouse.');
            return;
        }
        if (formData.items.length === 0) {
            setError('Please add at least one product item to the invoice.');
            return;
        }

        // Validate slab products
        for (let item of formData.items) {
            if (item.inventory_behavior === 'SLAB') {
                if ((item.slab_ids || []).length !== parseInt(item.quantity)) {
                    setError(`Selected slab details count (${(item.slab_ids || []).length}) must match quantity (${item.quantity}) for product: ${item.product_name}`);
                    return;
                }
            }
        }

        setSubmitting(true);
        setError('');

        try {
            const token = localStorage.getItem('auth_token');
            const payload = {
                ...formData,
                paid_amount: parseFloat(formData.paid_amount || 0)
            };

            const res = await axios.post('/api/sales/direct', payload, {
                headers: { Authorization: `Bearer ${token}` }
            });

            const invoice = res.data.invoice;
            setCreatedInvoice(invoice);
            setShowInvoiceModal(true);
            setSuccessMessage('Sale invoice created and posted to stock & accounts successfully!');

            // Reset form
            setFormData(prev => ({
                ...prev,
                paid_amount: 0,
                notes: '',
                items: []
            }));

            if (onSaleCompleted) {
                onSaleCompleted(invoice);
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to complete direct sale.');
        } finally {
            setSubmitting(false);
        }
    };

    function trimString(str) {
        return str ? str.trim().toLowerCase() : '';
    }

    if (loading) {
        return (
            <div className="text-center py-5">
                <div className="spinner-border text-primary" role="status"></div>
                <p className="mt-2 text-muted fw-semibold">Loading Counter Sale Workspace...</p>
            </div>
        );
    }

    // Filter products for dropdown search
    const filteredProducts = context.products.filter(p =>
        p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
        p.sku.toLowerCase().includes(productSearch.toLowerCase()) ||
        p.category_name.toLowerCase().includes(productSearch.toLowerCase())
    );

    return (
        <div className="card shadow-sm border-0 mb-4">
            <div className="card-header bg-primary text-white d-flex justify-content-between align-items-center py-3">
                <h5 className="mb-0 fw-bold">
                    <i className="fa-solid fa-cart-shopping me-2"></i>New Counter Direct Sale & Invoice
                </h5>
                <span className="badge bg-warning text-dark fw-bold fs-6">
                    <i className="fa-solid fa-bolt me-1"></i>Instant Stock & GL Post
                </span>
            </div>

            <div className="card-body p-4">
                {error && <div className="alert alert-danger alert-dismissible fade show">{error}</div>}
                {successMessage && <div className="alert alert-success alert-dismissible fade show">{successMessage}</div>}

                <form onSubmit={handleSubmitSale}>
                    {/* Header Row: Customer, Warehouse, Date */}
                    <div className="row g-3 p-3 bg-light rounded border mb-4">
                        <div className="col-md-5">
                            <label className="form-label fw-bold text-secondary">
                                Customer *
                            </label>
                            <div className="input-group">
                                <select
                                    className="form-select fw-semibold"
                                    value={formData.customer_id}
                                    onChange={(e) => setFormData({ ...formData, customer_id: e.target.value })}
                                    required
                                >
                                    <option value="">-- Select Customer --</option>
                                    {context.customers.map(c => (
                                        <option key={c.id} value={c.id}>
                                            {c.name} {c.phone ? `(${c.phone})` : ''} {c.gstin ? `[GST: ${c.gstin}]` : ''}
                                        </option>
                                    ))}
                                </select>
                                <button
                                    type="button"
                                    className="btn btn-outline-primary"
                                    onClick={() => setShowCustomerModal(true)}
                                    title="Add New Customer"
                                >
                                    <i className="fa-solid fa-user-plus"></i> New
                                </button>
                            </div>
                        </div>

                        <div className="col-md-4">
                            <label className="form-label fw-bold text-secondary">Dispatch Warehouse *</label>
                            <select
                                className="form-select fw-semibold"
                                value={formData.warehouse_id}
                                onChange={(e) => setFormData({ ...formData, warehouse_id: e.target.value })}
                                required
                            >
                                {context.warehouses.map(w => (
                                    <option key={w.id} value={w.id}>{w.name} ({w.code})</option>
                                ))}
                            </select>
                        </div>

                        <div className="col-md-3">
                            <label className="form-label fw-bold text-secondary">Invoice Date</label>
                            <input
                                type="date"
                                className="form-control fw-semibold"
                                value={formData.invoice_date}
                                onChange={(e) => setFormData({ ...formData, invoice_date: e.target.value })}
                            />
                        </div>
                    </div>

                    {/* Product Selection Bar */}
                    <div className="card border mb-4 shadow-sm">
                        <div className="card-header bg-light fw-bold text-dark d-flex justify-content-between align-items-center">
                            <span><i className="fa-solid fa-cubes me-2 text-primary"></i>Add Items to Bill</span>
                            <span className="small text-muted">Intra-State GST: {isInterState ? 'NO (IGST)' : 'YES (CGST + SGST)'}</span>
                        </div>
                        <div className="card-body p-3">
                            <div className="row g-2 align-items-center">
                                <div className="col-md-4">
                                    <input
                                        type="text"
                                        className="form-control"
                                        placeholder="Filter products by name or SKU..."
                                        value={productSearch}
                                        onChange={(e) => setProductSearch(e.target.value)}
                                    />
                                </div>
                                <div className="col-md-6">
                                    <select
                                        className="form-select fw-bold"
                                        value={selectedProductId}
                                        onChange={(e) => setSelectedProductId(e.target.value)}
                                    >
                                        <option value="">-- Choose Product to Add --</option>
                                        {filteredProducts.map(p => {
                                            const stockInfo = p.stock_by_warehouse[formData.warehouse_id];
                                            const availableQty = stockInfo ? stockInfo.total_qty : 0;
                                            return (
                                                <option key={p.id} value={p.id}>
                                                    {p.name} [{p.sku}] - Stock: {availableQty} {p.base_unit_symbol}
                                                </option>
                                            );
                                        })}
                                    </select>
                                </div>
                                <div className="col-md-2">
                                    <button
                                        type="button"
                                        className="btn btn-success w-100 fw-bold"
                                        onClick={() => handleAddProductLine(selectedProductId)}
                                        disabled={!selectedProductId}
                                    >
                                        <i className="fa-solid fa-plus me-1"></i> Add Line
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Line Items Table */}
                    <div className="table-responsive mb-4">
                        <table className="table table-bordered align-middle">
                            <thead className="table-dark text-uppercase small">
                                <tr>
                                    <th style={{ width: '30px' }}>#</th>
                                    <th style={{ minWidth: '220px' }}>Product & Specifications</th>
                                    <th style={{ width: '110px' }}>Basis</th>
                                    <th style={{ width: '100px' }}>Qty</th>
                                    <th style={{ width: '120px' }}>Unit Price (₹)</th>
                                    <th style={{ width: '110px' }}>Discount (₹)</th>
                                    <th style={{ width: '120px' }}>Taxable (₹)</th>
                                    <th style={{ width: '110px' }}>GST Amount</th>
                                    <th style={{ width: '130px' }}>Subtotal (₹)</th>
                                    <th style={{ width: '50px' }} className="text-center">Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {calculatedItems.length === 0 ? (
                                    <tr>
                                        <td colSpan="10" className="text-center py-4 text-muted fst-italic">
                                            No products added yet. Select a product above to build the invoice.
                                        </td>
                                    </tr>
                                ) : (
                                    calculatedItems.map((item, index) => (
                                        <tr key={index}>
                                            <td className="text-center fw-bold">{index + 1}</td>
                                            <td>
                                                <div className="fw-bold text-dark">{item.product_name}</div>
                                                <small className="text-muted">SKU: {item.sku}</small>
                                                {item.inventory_behavior === 'SLAB' && (
                                                    <div className="mt-1">
                                                        <button
                                                            type="button"
                                                            className="btn btn-xs btn-outline-warning text-dark py-0 px-2 small fw-bold"
                                                            onClick={() => setSlabModalItemIndex(index)}
                                                        >
                                                            <i className="fa-solid fa-layer-group me-1"></i>
                                                            Select Slabs ({(item.slab_ids || []).length} / {item.quantity})
                                                        </button>
                                                    </div>
                                                )}
                                            </td>
                                            <td>
                                                <select
                                                    className="form-select form-select-sm"
                                                    value={item.price_basis}
                                                    onChange={(e) => handleItemChange(index, 'price_basis', e.target.value)}
                                                >
                                                    <option value="PCS">PCS</option>
                                                    <option value="BOX">BOX</option>
                                                    <option value="SQFT">SQFT</option>
                                                    <option value="SQM">SQM</option>
                                                </select>
                                            </td>
                                            <td>
                                                <input
                                                    type="number"
                                                    step="any"
                                                    className="form-control form-control-sm text-end fw-bold"
                                                    value={item.quantity}
                                                    min="1"
                                                    onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                                                />
                                            </td>
                                            <td>
                                                <input
                                                    type="number"
                                                    step="0.01"
                                                    className="form-control form-control-sm text-end"
                                                    value={item.unit_price}
                                                    onChange={(e) => handleItemChange(index, 'unit_price', e.target.value)}
                                                />
                                            </td>
                                            <td>
                                                <input
                                                    type="number"
                                                    step="0.01"
                                                    className="form-control form-control-sm text-end text-danger"
                                                    value={item.discount_amount}
                                                    onChange={(e) => handleItemChange(index, 'discount_amount', e.target.value)}
                                                />
                                            </td>
                                            <td className="text-end fw-semibold">
                                                ₹ {item.lineTaxable.toFixed(2)}
                                            </td>
                                            <td className="text-end text-primary small">
                                                ₹ {item.lineTax.toFixed(2)} ({item.tax_rate}%)
                                            </td>
                                            <td className="text-end fw-bold fs-6 text-dark">
                                                ₹ {item.lineTotal.toFixed(2)}
                                            </td>
                                            <td className="text-center">
                                                <button
                                                    type="button"
                                                    className="btn btn-sm btn-outline-danger border-0"
                                                    onClick={() => handleRemoveItem(index)}
                                                >
                                                    <i className="fa-solid fa-trash-can"></i>
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Footer Row: Payment Details & Summary Box */}
                    <div className="row g-4 border-top pt-3">
                        <div className="col-md-7">
                            <div className="p-3 border rounded bg-light mb-3">
                                <h6 className="fw-bold text-dark border-bottom pb-2 mb-3">
                                    <i className="fa-solid fa-wallet me-2 text-success"></i>Payment Details
                                </h6>
                                <div className="row g-3">
                                    <div className="col-md-6">
                                        <label className="form-label fw-semibold">Payment Method</label>
                                        <select
                                            className="form-select fw-semibold"
                                            value={formData.payment_method}
                                            onChange={(e) => setFormData({ ...formData, payment_method: e.target.value })}
                                        >
                                            <option value="CASH">CASH (Counter Cash)</option>
                                            <option value="UPI">UPI / GPay / PhonePe</option>
                                            <option value="BANK">Bank Transfer / NEFT</option>
                                            <option value="CHEQUE">Cheque</option>
                                            <option value="CREDIT">Credit (On Account)</option>
                                        </select>
                                    </div>
                                    <div className="col-md-6">
                                        <label className="form-label fw-semibold">Amount Paid (₹)</label>
                                        <div className="input-group">
                                            <input
                                                type="number"
                                                step="0.01"
                                                className="form-control text-end fw-bold fs-6 text-success"
                                                value={formData.paid_amount}
                                                onChange={(e) => setFormData({ ...formData, paid_amount: e.target.value })}
                                            />
                                            <button
                                                type="button"
                                                className="btn btn-outline-success"
                                                onClick={handleSetFullPaid}
                                            >
                                                Full Paid
                                            </button>
                                        </div>
                                    </div>
                                    <div className="col-md-12">
                                        <label className="form-label fw-semibold">Notes / Special Instructions</label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            placeholder="e.g. Delivery via auto-rickshaw, Site contact: 98765..."
                                            value={formData.notes}
                                            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="col-md-5">
                            <div className="p-3 border rounded bg-white shadow-sm">
                                <h6 className="fw-bold text-dark border-bottom pb-2 mb-3">Billing Total Summary</h6>
                                <div className="d-flex justify-content-between mb-2">
                                    <span className="text-muted">Subtotal Gross:</span>
                                    <span className="fw-semibold">₹ {totalSubtotal.toFixed(2)}</span>
                                </div>
                                {totalDiscount > 0 && (
                                    <div className="d-flex justify-content-between mb-2 text-danger">
                                        <span>Total Discount:</span>
                                        <span className="fw-semibold">- ₹ {totalDiscount.toFixed(2)}</span>
                                    </div>
                                )}
                                <div className="d-flex justify-content-between mb-2">
                                    <span className="text-muted">Taxable Amount:</span>
                                    <span className="fw-semibold">₹ {totalTaxable.toFixed(2)}</span>
                                </div>
                                <div className="d-flex justify-content-between mb-2 text-primary">
                                    <span>Total Tax (GST):</span>
                                    <span className="fw-semibold">₹ {totalTax.toFixed(2)}</span>
                                </div>

                                <div className="d-flex justify-content-between py-2 border-top border-bottom fs-5 bg-light px-2 my-2 rounded">
                                    <strong className="text-dark">Grand Total:</strong>
                                    <strong className="text-dark">₹ {grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</strong>
                                </div>

                                <div className="d-flex justify-content-between mb-2 text-success">
                                    <span>Paid Amount:</span>
                                    <strong className="fs-6">₹ {parseFloat(formData.paid_amount || 0).toFixed(2)}</strong>
                                </div>
                                {balanceDue > 0 && (
                                    <div className="d-flex justify-content-between mb-2 text-danger">
                                        <strong className="fw-bold">Balance Due:</strong>
                                        <strong className="fs-6 fw-bold">₹ {balanceDue.toFixed(2)}</strong>
                                    </div>
                                )}

                                <button
                                    type="submit"
                                    className="btn btn-primary btn-lg w-100 mt-3 py-3 fw-bold shadow"
                                    disabled={submitting || calculatedItems.length === 0}
                                >
                                    {submitting ? (
                                        <span><span className="spinner-border spinner-border-sm me-2"></span>Posting Sale & Stock...</span>
                                    ) : (
                                        <span><i className="fa-solid fa-check-circle me-2"></i>Confirm Sale & Issue Tax Invoice</span>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </form>
            </div>

            {/* Quick Customer Modal */}
            <QuickCustomerModal
                show={showCustomerModal}
                onClose={() => setShowCustomerModal(false)}
                onCustomerCreated={handleCustomerCreated}
            />

            {/* Tax Invoice Modal */}
            <TaxInvoiceModal
                invoice={createdInvoice}
                show={showInvoiceModal}
                onClose={() => setShowInvoiceModal(false)}
            />

            {/* Slab Picker Modal */}
            {slabModalItemIndex !== null && (
                <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
                    <div className="modal-dialog modal-dialog-centered modal-lg">
                        <div className="modal-content shadow-lg border-0">
                            <div className="modal-header bg-warning text-dark py-3">
                                <h5 className="modal-title font-weight-bold">
                                    <i className="fa-solid fa-layer-group me-2"></i>Select Individual Granite Slabs
                                </h5>
                                <button type="button" className="btn-close" onClick={() => setSlabModalItemIndex(null)}></button>
                            </div>
                            <div className="modal-body p-4">
                                <p className="small text-muted mb-3">
                                    Select exactly <strong>{calculatedItems[slabModalItemIndex]?.quantity}</strong> slab(s) for product: <strong>{calculatedItems[slabModalItemIndex]?.product_name}</strong>
                                </p>
                                <div className="table-responsive" style={{ maxHeight: '300px' }}>
                                    <table className="table table-sm table-hover align-middle">
                                        <thead className="table-light">
                                            <tr>
                                                <th style={{ width: '40px' }}>Select</th>
                                                <th>Slab Code</th>
                                                <th>Dimensions (L x W x TH)</th>
                                                <th>Area (SQFT)</th>
                                                <th>Batch</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {(calculatedItems[slabModalItemIndex]?.available_slabs || []).length === 0 ? (
                                                <tr>
                                                    <td colSpan="5" className="text-center py-3 text-muted">
                                                        No available slabs found in selected warehouse.
                                                    </td>
                                                </tr>
                                            ) : (
                                                calculatedItems[slabModalItemIndex]?.available_slabs.map((slab) => {
                                                    const isChecked = (calculatedItems[slabModalItemIndex]?.slab_ids || []).includes(slab.id);
                                                    return (
                                                        <tr key={slab.id}>
                                                            <td>
                                                                <input
                                                                    type="checkbox"
                                                                    className="form-check-input"
                                                                    checked={isChecked}
                                                                    onChange={(e) => {
                                                                        const currentSlabIds = calculatedItems[slabModalItemIndex]?.slab_ids || [];
                                                                        let updatedSlabIds = [];
                                                                        if (e.target.checked) {
                                                                            updatedSlabIds = [...currentSlabIds, slab.id];
                                                                        } else {
                                                                            updatedSlabIds = currentSlabIds.filter(id => id !== slab.id);
                                                                        }
                                                                        handleItemChange(slabModalItemIndex, 'slab_ids', updatedSlabIds);
                                                                    }}
                                                                />
                                                            </td>
                                                            <td className="fw-bold">{slab.object_code}</td>
                                                            <td>{slab.length}" x {slab.width}" x {slab.thickness}mm</td>
                                                            <td className="fw-semibold text-primary">{parseFloat(slab.area).toFixed(2)} SQFT</td>
                                                            <td className="text-muted small">{slab.batch_number || '-'}</td>
                                                        </tr>
                                                    );
                                                })
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                            <div className="modal-footer bg-light">
                                <button type="button" className="btn btn-primary px-4" onClick={() => setSlabModalItemIndex(null)}>
                                    Done
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
