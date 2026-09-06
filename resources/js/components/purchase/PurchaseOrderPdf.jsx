import React from 'react';

export default function PurchaseOrderPdf({ po }) {
    if (!po) return null;

    return (
        <div className="purchase-order-pdf-document font-monospace p-3 bg-white text-dark" style={{ maxWidth: '850px', margin: '0 auto', fontSize: '0.85rem', color: '#111' }}>
            {/* Document Header */}
            <div className="row border-bottom pb-4 mb-4">
                <div className="col-7">
                    <h2 className="fw-bold mb-1 uppercase tracking-wide text-dark">PURCHASE ORDER</h2>
                    <div className="text-secondary small">Ref: <strong>{po.po_number}</strong></div>
                    <div className="mt-3">
                        <div className="fw-bold text-uppercase fs-6">
                            {po.organization?.legal_name || po.organization?.name || 'ORGANIZATION'}
                        </div>
                        {po.organization?.address && <div>{po.organization.address}</div>}
                        {(po.organization?.city || po.organization?.state || po.organization?.postal_code) && (
                            <div>
                                {[
                                    po.organization?.city,
                                    po.organization?.state ? (po.organization?.postal_code ? `${po.organization.state} - ${po.organization.postal_code}` : po.organization.state) : po.organization?.postal_code
                                ].filter(Boolean).join(', ')}
                            </div>
                        )}
                        {po.organization?.gstin && <div>GSTIN: {po.organization.gstin}</div>}
                        {po.organization?.email && <div>Email: {po.organization.email}</div>}
                        {po.organization?.phone && <div>Phone: {po.organization.phone}</div>}
                    </div>
                </div>
                <div className="col-5 text-end fs-7">
                    <div className="mb-1"><span className="text-muted">PO Date:</span> <strong>{po.po_date}</strong></div>
                    {po.expected_delivery_date && (
                        <div className="mb-1"><span className="text-muted">Expected Delivery:</span> <strong>{po.expected_delivery_date}</strong></div>
                    )}
                    {po.reference_number && (
                        <div className="mb-1"><span className="text-muted">Ref Quote:</span> <strong>{po.reference_number}</strong></div>
                    )}
                    <div className="mb-1"><span className="text-muted">Branch:</span> <strong>{po.branch_name}</strong></div>
                </div>
            </div>

            {/* Billing / Supplier info */}
            <div className="row mb-4">
                <div className="col-6">
                    <div className="card p-3 border-dark bg-light" style={{ borderRadius: '0px' }}>
                        <div className="text-muted text-uppercase fw-bold border-bottom pb-1 mb-2 font-monospace" style={{ fontSize: '0.75rem', letterSpacing: '1px' }}>Supplier / Vendor</div>
                        <div className="fw-bold text-uppercase">{po.supplier?.name || po.supplier_name || 'SUPPLIER'}</div>
                        {po.supplier?.address && <div>{po.supplier.address}</div>}
                        {po.supplier?.gstin && <div>GSTIN: {po.supplier.gstin}</div>}
                        {po.supplier?.email && <div>Email: {po.supplier.email}</div>}
                        {po.supplier?.phone && <div>Phone: {po.supplier.phone}</div>}
                        {!po.supplier?.address && <div className="small text-muted mt-2">Check system supplier directory for contact address & phone details.</div>}
                    </div>
                </div>
                <div className="col-6">
                    <div className="card p-3 border-dark bg-light" style={{ borderRadius: '0px' }}>
                        <div className="text-muted text-uppercase fw-bold border-bottom pb-1 mb-2 font-monospace" style={{ fontSize: '0.75rem', letterSpacing: '1px' }}>Delivery Address</div>
                        <div className="fw-bold text-uppercase">{po.branch?.name || po.branch_name || po.organization?.name || 'CENTRAL WAREHOUSE'}</div>
                        {po.branch?.address ? (
                            <div>{po.branch.address}</div>
                        ) : po.organization?.address ? (
                            <div>{po.organization.address}</div>
                        ) : null}
                        {po.branch?.email && <div>Email: {po.branch.email}</div>}
                        {po.branch?.phone && <div>Phone: {po.branch.phone}</div>}
                        <div className="small text-muted mt-2">Mark all incoming GRNs against purchase order reference code.</div>
                    </div>
                </div>
            </div>

            {/* Line Items Table */}
            <table className="table table-bordered table-sm align-middle text-dark mb-4 fs-7" style={{ borderColor: '#333' }}>
                <thead className="table-light text-uppercase font-monospace text-dark" style={{ borderBottom: '2px solid #000' }}>
                    <tr>
                        <th className="text-center" style={{ width: '5%' }}>#</th>
                        <th style={{ width: '30%' }}>Item Description & SKU</th>
                        <th className="text-end" style={{ width: '10%' }}>Quantity</th>
                        <th className="text-center" style={{ width: '10%' }}>Unit</th>
                        <th className="text-center" style={{ width: '12%' }}>Pricing Unit</th>
                        <th className="text-end" style={{ width: '13%' }}>Expected Qty / Area</th>
                        <th className="text-end" style={{ width: '10%' }}>Rate</th>
                        <th className="text-end" style={{ width: '10%' }}>Subtotal</th>
                    </tr>
                </thead>
                <tbody>
                    {po.items?.map((item, idx) => {
                        const showPricingDiff = item.pricing_unit_symbol && item.pricing_unit_symbol !== item.unit_symbol;
                        return (
                            <tr key={item.id} style={{ borderBottom: '1px solid #ddd' }}>
                                <td className="text-center font-monospace">{idx + 1}</td>
                                <td>
                                    <div className="fw-bold">{item.product_variant_name}</div>
                                    <div className="text-muted text-xs font-monospace">{item.product_variant_sku}</div>
                                </td>
                                <td className="text-end font-monospace">{parseFloat(item.quantity).toFixed(2)}</td>
                                <td className="text-center font-monospace">{item.unit_symbol}</td>
                                <td className="text-center font-monospace">{item.pricing_unit_symbol || item.unit_symbol}</td>
                                <td className="text-end font-monospace">
                                    {item.product_behavior === 'SLAB' ? parseFloat(item.estimated_pricing_quantity).toFixed(2) : 'N/A'}
                                </td>
                                <td className="text-end font-monospace">₹{parseFloat(item.unit_price).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                                <td className="text-end font-monospace fw-bold">
                                    {item.subtotal > 0 ? (
                                        `₹${parseFloat(item.subtotal).toLocaleString(undefined, { minimumFractionDigits: 2 })}`
                                    ) : (
                                        <span className="text-muted small">Pending actual area</span>
                                    )}
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>

            {/* Terms and Sign-off */}
            <div className="row">
                <div className="col-7 fs-7">
                    <div className="border p-3 bg-light mb-3" style={{ borderColor: '#ddd' }}>
                        <div className="fw-bold border-bottom pb-1 mb-2 font-monospace uppercase text-xs" style={{ letterSpacing: '1px' }}>Acquisition Terms & Instructions</div>
                        <div className="mb-2"><strong>Payment Terms:</strong> {po.payment_terms || 'Standard payment terms apply.'}</div>
                        <div><strong>Delivery Terms:</strong> {po.delivery_terms || 'Standard delivery terms apply.'}</div>
                    </div>
                    {po.remarks && (
                        <div className="p-2 border" style={{ borderStyle: 'dashed' }}>
                            <strong className="d-block text-muted text-xs">Remarks:</strong>
                            {po.remarks}
                        </div>
                    )}
                </div>
                <div className="col-5">
                    <table className="table table-bordered table-sm font-monospace text-dark mb-4 fs-7" style={{ borderColor: '#333' }}>
                        <tbody>
                            <tr>
                                <td className="text-muted">Total Discount:</td>
                                <td className="text-end text-danger">-₹{po.discount_amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                            </tr>
                            <tr>
                                <td className="text-muted">Taxes (GST):</td>
                                <td className="text-end text-primary">+₹{po.tax_amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                            </tr>
                            <tr className="table-light" style={{ borderTop: '2px solid #000' }}>
                                <td className="fw-bold">Total Amount:</td>
                                <td className="text-end fw-bold text-success fs-6">₹{po.total_amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                            </tr>
                        </tbody>
                    </table>

                    <div className="text-center mt-5 pt-3 border-top" style={{ borderColor: '#333' }}>
                        <span className="small text-muted font-monospace text-uppercase">Authorized Signatory</span>
                        <div className="mt-4" style={{ height: '35px', borderBottom: '1px dotted #000' }}></div>
                    </div>
                </div>
            </div>
        </div>
    );
}
