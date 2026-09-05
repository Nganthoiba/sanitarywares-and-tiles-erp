import React from 'react';

// Helper function to convert number to words in Indian Currency format
function numberToWordsIndian(num) {
    if (!num || isNaN(num)) return 'Zero Rupees Only';
    const a = ['', 'One ', 'Two ', 'Three ', 'Four ', 'Five ', 'Six ', 'Seven ', 'Eight ', 'Nine ', 'Ten ', 'Eleven ', 'Twelve ', 'Thirteen ', 'Fourteen ', 'Fifteen ', 'Sixteen ', 'Seventeen ', 'Eighteen ', 'Nineteen '];
    const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

    const numString = parseFloat(num).toFixed(2);
    const split = numString.split('.');
    let rupees = parseInt(split[0], 10);
    let paise = parseInt(split[1], 10);

    function convert(n) {
        if (n < 20) return a[n];
        if (n < 100) return b[Math.floor(n / 10)] + (n % 10 !== 0 ? ' ' + a[n % 10] : '');
        if (n < 1000) return a[Math.floor(n / 100)] + 'Hundred ' + (n % 100 !== 0 ? convert(n % 100) : '');
        if (n < 100000) return convert(Math.floor(n / 1000)) + 'Thousand ' + (n % 1000 !== 0 ? convert(n % 1000) : '');
        if (n < 10000000) return convert(Math.floor(n / 100000)) + 'Lakh ' + (n % 100000 !== 0 ? convert(n % 100000) : '');
        return convert(Math.floor(n / 10000000)) + 'Crore ' + (n % 10000000 !== 0 ? convert(n % 10000000) : '');
    }

    let result = '';
    if (rupees === 0) {
        result = 'Zero Rupees';
    } else {
        result = convert(rupees).trim() + ' Rupees';
    }

    if (paise > 0) {
        result += ' and ' + convert(paise).trim() + ' Paise';
    }

    return result + ' Only';
}

function formatHumanDate(dateString) {
    if (!dateString) return '';
    try {
        const parts = String(dateString).split('T')[0].split('-');
        if (parts.length === 3) {
            const year = parseInt(parts[0], 10);
            const month = parseInt(parts[1], 10) - 1;
            const day = parseInt(parts[2], 10);
            const dt = new Date(year, month, day);
            if (!isNaN(dt.getTime())) {
                const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                const dd = String(day).padStart(2, '0');
                return `${dd} ${months[month]} ${year}`;
            }
        }
        const dt = new Date(dateString);
        if (isNaN(dt.getTime())) return dateString;
        return dt.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    } catch (e) {
        return dateString;
    }
}

export default function TaxInvoiceModal({ invoice, show, onClose }) {
    if (!show || !invoice) return null;

    const handlePrint = () => {
        const printContent = document.getElementById('printable-tax-invoice');
        const win = window.open('', '', 'height=900,width=800');
        win.document.write('<html><head><title>Tax Invoice - ' + (invoice.invoice_number || 'INV') + '</title>');
        win.document.write('<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css">');
        win.document.write('<style>');
        win.document.write(`
            body { font-family: 'Helvetica Neue', Arial, sans-serif; font-size: 12px; color: #333; margin: 20px; }
            .invoice-box { max-width: 800px; margin: auto; padding: 20px; border: 1px solid #eee; }
            .table-bordered th, .table-bordered td { border: 1px solid #ddd !important; padding: 6px 8px; font-size: 11px; }
            .bg-light-header { background-color: #f8f9fa !important; }
            @media print {
                body { margin: 0; padding: 0; }
                .no-print { display: none !important; }
                .invoice-box { border: none; padding: 0; }
            }
        `);
        win.document.write('</style></head><body>');
        win.document.write(printContent.innerHTML);
        win.document.write('</body></html>');
        win.document.close();
        win.focus();
        setTimeout(() => {
            win.print();
            win.close();
        }, 500);
    };

    const isInterState = parseFloat(invoice.igst_amount || 0) > 0;

    return (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}>
            <div className="modal-dialog modal-xl modal-dialog-scrollable">
                <div className="modal-content shadow-lg border-0">
                    <div className="modal-header bg-dark text-white py-2 no-print">
                        <h5 className="modal-title fs-6 fw-bold">
                            <i className="fa-solid fa-file-invoice me-2 text-warning"></i>Tax Invoice Preview ({invoice.invoice_number})
                        </h5>
                        <div>
                            <button className="btn btn-warning btn-sm me-2 fw-semibold" onClick={handlePrint}>
                                <i className="fa-solid fa-print me-1"></i> Print Invoice
                            </button>
                            <button type="button" className="btn-close btn-close-white" onClick={onClose}></button>
                        </div>
                    </div>

                    <div className="modal-body p-4 bg-light">
                        <div id="printable-tax-invoice" className="invoice-box bg-white p-4 rounded shadow-sm border">
                            {/* Invoice Header */}
                            <div className="row border-bottom pb-3 mb-3">
                                <div className="col-7">
                                    <h3 className="fw-bold text-primary mb-1">
                                        {invoice.organization?.name || 'TILES & SANITARYWARES ERP'}
                                    </h3>
                                    <p className="text-muted mb-1 small">
                                        {invoice.organization?.address || 'Main Showroom & Depot'}
                                    </p>
                                    <p className="mb-0 small">
                                        <strong>GSTIN:</strong> {invoice.organization?.gstin || '24AAAAA0000A1Z5'} | <strong>Phone:</strong> {invoice.organization?.phone || '+91 98765 43210'}
                                    </p>
                                </div>
                                <div className="col-5 text-end">
                                    <span className="badge bg-primary fs-6 mb-2 px-3 py-2">TAX INVOICE</span>
                                    <h5 className="fw-bold text-dark mb-0">{invoice.invoice_number}</h5>
                                    <p className="small text-muted mb-0">Date: {formatHumanDate(invoice.invoice_date)}</p>
                                    <p className="small text-muted mb-0">Warehouse: {invoice.warehouse?.name || 'Main Warehouse'}</p>
                                </div>
                            </div>

                            {/* Billed To / Shipped To */}
                            <div className="row mb-3">
                                <div className="col-6">
                                    <div className="p-3 border rounded bg-light">
                                        <h6 className="fw-bold text-secondary border-bottom pb-1 mb-2">Billed To (Customer):</h6>
                                        <p className="fw-bold mb-1 fs-6 text-dark">{invoice.customer?.name || 'Walk-in Customer'}</p>
                                        <p className="mb-1 small text-muted">{invoice.billing_address || invoice.customer?.address || 'Counter Cash Sale'}</p>
                                        <p className="mb-0 small">
                                            <strong>Phone:</strong> {invoice.customer?.phone || 'N/A'} | <strong>GSTIN:</strong> {invoice.customer?.gstin || 'URP (Unregistered)'}
                                        </p>
                                    </div>
                                </div>
                                <div className="col-6">
                                    <div className="p-3 border rounded bg-light">
                                        <h6 className="fw-bold text-secondary border-bottom pb-1 mb-2">Invoice & Payment Summary:</h6>
                                        <div className="d-flex justify-content-between mb-1 small">
                                            <span>Payment Mode:</span>
                                            <strong className="text-uppercase">{invoice.payment_method || 'CASH'}</strong>
                                        </div>
                                        <div className="d-flex justify-content-between mb-1 small">
                                            <span>Payment Status:</span>
                                            <span className={`badge ${invoice.payment_status === 'PAID' ? 'bg-success' : 'bg-danger'}`}>
                                                {invoice.payment_status}
                                            </span>
                                        </div>
                                        <div className="d-flex justify-content-between small">
                                            <span>Amount Paid:</span>
                                            <strong>₹ {parseFloat(invoice.paid_amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</strong>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Items Table */}
                            <table className="table table-bordered align-middle mb-3">
                                <thead className="bg-light-header text-uppercase small fw-bold">
                                    <tr>
                                        <th style={{ width: '40px' }} className="text-center">#</th>
                                        <th>Item Description & SKU</th>
                                        <th className="text-center">Basis</th>
                                        <th className="text-end">Qty</th>
                                        <th className="text-end">Rate (₹)</th>
                                        <th className="text-end">Disc (₹)</th>
                                        <th className="text-end">Taxable (₹)</th>
                                        <th className="text-end">GST %</th>
                                        <th className="text-end">Amount (₹)</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {(invoice.items || []).map((item, index) => (
                                        <tr key={item.id || index}>
                                            <td className="text-center">{index + 1}</td>
                                            <td>
                                                <div className="fw-bold text-dark">
                                                    {item.product_name_snapshot || item.variant?.name || 'Product'}
                                                </div>
                                                <div className="small text-muted">
                                                    SKU: {item.sku_snapshot || item.variant?.sku || '-'}
                                                </div>
                                            </td>
                                            <td className="text-center badge-cell">
                                                <span className="badge bg-secondary">{item.price_basis || 'PCS'}</span>
                                            </td>
                                            <td className="text-end fw-bold">{parseFloat(item.quantity).toFixed(2)}</td>
                                            <td className="text-end">₹ {parseFloat(item.unit_price).toFixed(2)}</td>
                                            <td className="text-end text-muted">₹ {parseFloat(item.discount_amount || 0).toFixed(2)}</td>
                                            <td className="text-end">₹ {parseFloat(item.taxable_amount).toFixed(2)}</td>
                                            <td className="text-end">{parseFloat(item.tax_rate || 18).toFixed(1)}%</td>
                                            <td className="text-end fw-bold">₹ {parseFloat(item.subtotal).toFixed(2)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>

                            {/* Totals & Tax Breakdown */}
                            <div className="row pt-2">
                                <div className="col-7">
                                    <div className="p-3 border rounded mb-2 bg-light">
                                        <span className="fw-bold text-secondary small">Amount in Words:</span>
                                        <p className="fw-bold text-dark mb-0 mt-1 fst-italic">
                                            {numberToWordsIndian(invoice.total_amount)}
                                        </p>
                                    </div>

                                    {/* Tax breakdown summary */}
                                    <div className="p-2 border rounded small bg-white">
                                        <strong className="text-muted d-block mb-1">Tax Breakdown Summary:</strong>
                                        {isInterState ? (
                                            <div className="d-flex justify-content-between text-muted">
                                                <span>IGST Amount:</span>
                                                <strong>₹ {parseFloat(invoice.igst_amount || 0).toFixed(2)}</strong>
                                            </div>
                                        ) : (
                                            <>
                                                <div className="d-flex justify-content-between text-muted">
                                                    <span>CGST Amount:</span>
                                                    <strong>₹ {parseFloat(invoice.cgst_amount || 0).toFixed(2)}</strong>
                                                </div>
                                                <div className="d-flex justify-content-between text-muted">
                                                    <span>SGST Amount:</span>
                                                    <strong>₹ {parseFloat(invoice.sgst_amount || 0).toFixed(2)}</strong>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                </div>

                                <div className="col-5">
                                    <table className="table table-sm border-0 small align-middle">
                                        <tbody>
                                            <tr>
                                                <td className="text-muted">Subtotal (Gross):</td>
                                                <td className="text-end fw-bold">₹ {parseFloat(invoice.subtotal).toFixed(2)}</td>
                                            </tr>
                                            {parseFloat(invoice.discount_amount || 0) > 0 && (
                                                <tr>
                                                    <td className="text-danger">Total Discount:</td>
                                                    <td className="text-end text-danger fw-bold">- ₹ {parseFloat(invoice.discount_amount).toFixed(2)}</td>
                                                </tr>
                                            )}
                                            <tr>
                                                <td className="text-muted">Taxable Value:</td>
                                                <td className="text-end fw-bold">₹ {parseFloat(invoice.taxable_amount).toFixed(2)}</td>
                                            </tr>
                                            <tr>
                                                <td className="text-muted">Total Tax (GST):</td>
                                                <td className="text-end fw-bold text-primary">₹ {parseFloat(invoice.tax_amount).toFixed(2)}</td>
                                            </tr>
                                            <tr className="border-top border-bottom fs-6 bg-light">
                                                <td className="fw-bold text-dark py-2">Grand Total:</td>
                                                <td className="text-end fw-bold text-dark py-2">
                                                    ₹ {parseFloat(invoice.total_amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                                </td>
                                            </tr>
                                            <tr>
                                                <td className="text-success">Paid Amount:</td>
                                                <td className="text-end fw-bold text-success">₹ {parseFloat(invoice.paid_amount || 0).toFixed(2)}</td>
                                            </tr>
                                            {parseFloat(invoice.due_amount || 0) > 0 && (
                                                <tr>
                                                    <td className="text-danger fw-bold">Balance Due:</td>
                                                    <td className="text-end fw-bold text-danger">₹ {parseFloat(invoice.due_amount).toFixed(2)}</td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            {/* Terms & Signatures */}
                            <div className="row mt-4 pt-4 border-top text-muted small">
                                <div className="col-8">
                                    <h6 className="fw-bold text-dark mb-1">Terms & Conditions:</h6>
                                    <ol className="ps-3 mb-0 small">
                                        <li>Goods once sold will not be taken back or exchanged.</li>
                                        <li>No guarantee/warranty on ceramic shade variations after installation.</li>
                                        <li>Subject to local jurisdiction only.</li>
                                    </ol>
                                </div>
                                <div className="col-4 text-center pt-3">
                                    <div style={{ height: '40px' }}></div>
                                    <p className="border-top pt-1 fw-bold text-dark mb-0">Authorized Signatory</p>
                                    <span className="small text-muted">{invoice.organization?.name}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="modal-footer bg-light no-print">
                        <button type="button" className="btn btn-secondary" onClick={onClose}>Close</button>
                        <button type="button" className="btn btn-primary px-4" onClick={handlePrint}>
                            <i className="fa-solid fa-print me-2"></i>Print Invoice
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
