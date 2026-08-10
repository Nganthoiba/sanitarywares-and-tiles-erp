import React, { useState, useEffect } from 'react';
import axios from 'axios';
import PurchaseOrderPdf from './PurchaseOrderPdf';

export default function PurchaseOrderView({ poId, onBack, userPermissions = [], onStatusChanged }) {
    const [po, setPo] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [actionLoading, setActionLoading] = useState(false);
    const [showPrintMode, setShowPrintMode] = useState(false);

    const fetchPODetails = async () => {
        setLoading(true);
        setError(null);
        try {
            const token = localStorage.getItem('auth_token');
            const res = await axios.get(`/api/purchase-orders/${poId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setPo(res.data.data);
        } catch (err) {
            setError('Failed to fetch Purchase Order details.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (poId) {
            fetchPODetails();
        }
    }, [poId]);

    const hasPermission = (perm) => {
        return userPermissions.includes(perm) || userPermissions.includes('administrator');
    };

    const triggerAction = async (endpoint, successMessage) => {
        setActionLoading(true);
        setError(null);
        try {
            const token = localStorage.getItem('auth_token');
            const res = await axios.post(`/api/purchase-orders/${poId}/${endpoint}`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            alert(successMessage);
            setPo(res.data.data);
            if (onStatusChanged) onStatusChanged();
        } catch (err) {
            alert(err.response?.data?.message || 'Action failed.');
            setError(err.response?.data?.message || 'Action failed.');
        } finally {
            setActionLoading(false);
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'DRAFT': return 'text-secondary border-secondary';
            case 'SUBMITTED': return 'text-warning border-warning';
            case 'APPROVED': return 'text-success border-success';
            case 'SENT': return 'text-info border-info';
            case 'PARTIALLY_RECEIVED': return 'text-primary border-primary';
            case 'FULLY_RECEIVED': return 'text-dark border-dark';
            case 'CLOSED': return 'text-secondary border-secondary bg-light';
            case 'CANCELLED': return 'text-danger border-danger';
            default: return 'text-secondary border-secondary';
        }
    };

    if (loading) {
        return (
            <div className="text-center py-5">
                <div className="spinner-border text-primary" role="status"></div>
                <p className="text-muted mt-2">Loading details...</p>
            </div>
        );
    }

    if (!po) return null;

    if (showPrintMode) {
        return (
            <div className="bg-white p-4">
                <div className="d-print-none mb-4 d-flex justify-content-between">
                    <button className="btn btn-outline-secondary btn-sm" onClick={() => setShowPrintMode(false)}>
                        <i className="fa-solid fa-arrow-left me-2"></i> Exit Print Mode
                    </button>
                    <button className="btn btn-primary btn-sm" onClick={() => window.print()}>
                        <i className="fa-solid fa-print me-2"></i> Trigger Print
                    </button>
                </div>
                <PurchaseOrderPdf po={po} />
            </div>
        );
    }

    return (
        <div className="animate__animated animate__fadeIn">
            {/* Header section */}
            <div className="d-flex align-items-center justify-content-between mb-4">
                <div>
                    <div className="d-flex align-items-center gap-3 mb-1">
                        <h3 className="fw-bold text-dark mb-0">Purchase Order: {po.po_number}</h3>
                        <span className={`badge border rounded-pill px-3 py-1.5 font-monospace fs-7 ${getStatusColor(po.status)}`}>
                            {po.status}
                        </span>
                    </div>
                    <p className="text-muted small mb-0">Raised on {po.po_date} for branch: <strong>{po.branch_name}</strong></p>
                </div>
                <div className="d-flex gap-2">
                    <button className="btn btn-outline-secondary px-3" onClick={onBack}>
                        <i className="fa-solid fa-arrow-left me-2"></i> Registry List
                    </button>
                    <button className="btn btn-dark px-3" onClick={() => setShowPrintMode(true)}>
                        <i className="fa-solid fa-print me-2 text-warning"></i> Print / Preview
                    </button>
                </div>
            </div>

            {error && (
                <div className="alert alert-danger" role="alert">
                    <i className="fa-solid fa-circle-exclamation me-2"></i>
                    {error}
                </div>
            )}

            <div className="row g-4">
                {/* Main Content Info */}
                <div className="col-lg-8">
                    <div className="card border-0 shadow-sm p-4 mb-4" style={{ borderRadius: '12px' }}>
                        <h5 className="fw-bold mb-3 text-secondary border-bottom pb-2">PO Header Attributes</h5>
                        <div className="row g-3 fs-7">
                            <div className="col-md-4">
                                <span className="text-muted d-block uppercase font-monospace">Supplier</span>
                                <strong className="text-dark fs-6">{po.supplier_name}</strong>
                            </div>
                            <div className="col-md-4">
                                <span className="text-muted d-block uppercase font-monospace">Requisition Reference</span>
                                <strong className="text-dark">{po.purchase_requisition_number || 'Direct Order'}</strong>
                            </div>
                            <div className="col-md-4">
                                <span className="text-muted d-block uppercase font-monospace">Expected Delivery</span>
                                <strong className="text-dark">{po.expected_delivery_date || 'N/A'}</strong>
                            </div>
                            <div className="col-md-4">
                                <span className="text-muted d-block uppercase font-monospace">Supplier Quote Reference</span>
                                <strong className="text-dark">{po.reference_number || 'N/A'}</strong>
                            </div>
                            <div className="col-md-4">
                                <span className="text-muted d-block uppercase font-monospace">Payment Terms</span>
                                <strong className="text-dark">{po.payment_terms || 'Standard 30 Days'}</strong>
                            </div>
                            <div className="col-md-4">
                                <span className="text-muted d-block uppercase font-monospace">Delivery Terms</span>
                                <strong className="text-dark">{po.delivery_terms || 'Standard Logistics'}</strong>
                            </div>
                        </div>

                        {po.remarks && (
                            <div className="mt-3 p-3 bg-light rounded-3">
                                <span className="text-muted d-block small font-monospace">Operator Remarks</span>
                                <p className="mb-0 fs-7">{po.remarks}</p>
                            </div>
                        )}
                    </div>

                    {/* PO Items & Quantities Trace */}
                    <div className="card border-0 shadow-sm p-4" style={{ borderRadius: '12px' }}>
                        <h5 className="fw-bold mb-3 text-secondary border-bottom pb-2">Line Items & Received Progress</h5>
                        <div className="table-responsive">
                            <table className="table table-hover table-sm align-middle fs-7">
                                <thead className="table-light text-uppercase font-monospace">
                                    <tr>
                                        <th>Product Variant</th>
                                        <th>Ordered Qty</th>
                                        <th>Pricing basis / Rate</th>
                                        <th>Expected Area / Pricing Qty</th>
                                        <th>Received Qty</th>
                                        <th>Received Area / Pricing Qty</th>
                                        <th className="text-end">Subtotal</th>
                                        <th className="text-center" style={{ width: '120px' }}>Inbound Progress</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {po.items?.map(item => {
                                        const ordered = parseFloat(item.quantity);
                                        const received = parseFloat(item.received_quantity);
                                        const pct = ordered > 0 ? Math.min(100, Math.round((received / ordered) * 100)) : 0;
                                        const showPricingDiff = item.pricing_unit_symbol && item.pricing_unit_symbol !== item.unit_symbol;
                                        
                                        return (
                                            <tr key={item.id}>
                                                <td>
                                                    <div className="fw-bold text-dark">{item.product_variant_name}</div>
                                                    <span className="text-muted font-monospace text-xs">{item.product_variant_sku}</span>
                                                </td>
                                                <td>
                                                    <strong>{item.quantity}</strong> {item.unit_symbol}
                                                </td>
                                                <td>
                                                    ₹{item.unit_price.toLocaleString(undefined, { minimumFractionDigits: 2 })} / {item.pricing_unit_symbol || item.unit_symbol}
                                                </td>
                                                <td>
                                                    {showPricingDiff ? (
                                                        <span>{parseFloat(item.estimated_pricing_quantity).toFixed(2)} {item.pricing_unit_symbol}</span>
                                                    ) : (
                                                        <span className="text-muted">-</span>
                                                    )}
                                                </td>
                                                <td>
                                                    <strong>{item.received_quantity}</strong> {item.unit_symbol}
                                                </td>
                                                <td>
                                                    {showPricingDiff ? (
                                                        <strong>{parseFloat(item.received_pricing_quantity).toFixed(2)} {item.pricing_unit_symbol}</strong>
                                                    ) : (
                                                        <span className="text-muted">-</span>
                                                    )}
                                                </td>
                                                <td className="text-end fw-bold">
                                                    {item.subtotal > 0 ? (
                                                        `₹${parseFloat(item.subtotal).toLocaleString(undefined, { minimumFractionDigits: 2 })}`
                                                    ) : (
                                                        <span className="text-muted small">Pending actual area</span>
                                                    )}
                                                </td>
                                                <td>
                                                    <div className="d-flex align-items-center gap-2">
                                                        <div className="progress flex-grow-1" style={{ height: '6px' }}>
                                                            <div 
                                                                className={`progress-bar ${pct === 100 ? 'bg-success' : 'bg-primary'}`} 
                                                                role="progressbar" 
                                                                style={{ width: `${pct}%` }} 
                                                                aria-valuenow={pct} 
                                                                aria-valuemin="0" 
                                                                aria-valuemax="100"
                                                            ></div>
                                                        </div>
                                                        <span className="text-muted font-monospace text-xs" style={{ fontSize: '10px' }}>{pct}%</span>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* Workflow Actions Side Panel */}
                <div className="col-lg-4">
                    <div className="card border-0 shadow-sm p-4 mb-4" style={{ borderRadius: '12px' }}>
                        <h5 className="fw-bold mb-3 text-secondary border-bottom pb-2">Acquisition Flow Actions</h5>
                        <div className="d-grid gap-2">
                            {po.status === 'DRAFT' && hasPermission('purchase.orders.create') && (
                                <button 
                                    className="btn btn-warning text-dark fw-bold shadow-sm"
                                    onClick={() => triggerAction('submit', 'Purchase order submitted successfully to approval workflows.')}
                                    disabled={actionLoading}
                                >
                                    <i className="fa-solid fa-paper-plane me-2"></i> Submit for Approval
                                </button>
                            )}

                            {po.status === 'SUBMITTED' && hasPermission('purchase.orders.approve') && (
                                <button 
                                    className="btn btn-success fw-bold shadow-sm"
                                    onClick={() => triggerAction('approve', 'Purchase Order approved successfully.')}
                                    disabled={actionLoading}
                                >
                                    <i className="fa-solid fa-circle-check me-2"></i> Approve Purchase Order
                                </button>
                            )}

                            {po.status === 'APPROVED' && hasPermission('purchase.orders.create') && (
                                <button 
                                    className="btn btn-info text-white fw-bold shadow-sm"
                                    onClick={() => triggerAction('send', 'Purchase Order marked as SENT to supplier.')}
                                    disabled={actionLoading}
                                >
                                    <i className="fa-solid fa-paper-plane me-2"></i> Mark as Sent to Supplier
                                </button>
                            )}

                            {['APPROVED', 'SENT', 'PARTIALLY_RECEIVED'].includes(po.status) && hasPermission('purchase.orders.create') && (
                                <button 
                                    className="btn btn-outline-dark fw-bold"
                                    onClick={() => {
                                        if (confirm('Are you sure you want to close this PO? No further Goods Receipts can be processed.')) {
                                            triggerAction('close', 'Purchase Order closed successfully.');
                                        }
                                    }}
                                    disabled={actionLoading}
                                >
                                    <i className="fa-solid fa-lock me-2"></i> Close Purchase Order
                                </button>
                            )}

                            {['DRAFT', 'SUBMITTED', 'APPROVED', 'SENT'].includes(po.status) && (
                                <button 
                                    className="btn btn-outline-danger fw-bold"
                                    onClick={() => {
                                        if (confirm('Are you sure you want to cancel this Purchase Order?')) {
                                            triggerAction('cancel', 'Purchase Order cancelled.');
                                        }
                                    }}
                                    disabled={actionLoading}
                                >
                                    <i className="fa-solid fa-circle-xmark me-2"></i> Cancel Purchase Order
                                </button>
                            )}
                        </div>
                    </div>

                    <div className="card border-0 shadow-sm p-4 bg-light" style={{ borderRadius: '12px' }}>
                        <h5 className="fw-bold mb-3 text-secondary border-bottom pb-2">Financial Totals</h5>
                        <div className="d-flex justify-content-between mb-2 fs-7">
                            <span className="text-muted">Net Discount:</span>
                            <span className="fw-semibold text-danger">-₹{po.discount_amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                        </div>
                        <div className="d-flex justify-content-between mb-3 fs-7">
                            <span className="text-muted">Taxes (GST):</span>
                            <span className="fw-semibold text-primary">+₹{po.tax_amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                        </div>
                        <hr />
                        <div className="d-flex justify-content-between align-items-center mb-0">
                            <span className="fw-bold">Grand Total:</span>
                            <span className="h5 mb-0 fw-bold text-success">₹{po.total_amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
