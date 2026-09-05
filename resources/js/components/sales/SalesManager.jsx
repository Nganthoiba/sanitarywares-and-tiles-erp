import React, { useState, useEffect } from 'react';
import axios from 'axios';
import NewSaleForm from './NewSaleForm';
import TaxInvoiceModal from './TaxInvoiceModal';

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

export default function SalesManager({ initialTab = 'new-sale' }) {
    const [activeTab, setActiveTab] = useState(initialTab);
    const [invoices, setInvoices] = useState([]);
    const [pagination, setPagination] = useState({ current_page: 1, last_page: 1, total: 0 });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // Invoice History Filters
    const [filters, setFilters] = useState({
        search: '',
        payment_status: '',
        status: '',
        page: 1
    });

    // Tax Invoice Modal State
    const [selectedInvoice, setSelectedInvoice] = useState(null);
    const [showInvoiceModal, setShowInvoiceModal] = useState(false);

    useEffect(() => {
        if (activeTab === 'invoices') {
            fetchInvoices();
        }
    }, [activeTab, filters.page, filters.payment_status, filters.status]);

    const fetchInvoices = async () => {
        setLoading(true);
        setError('');
        try {
            const token = localStorage.getItem('auth_token');
            const res = await axios.get('/api/sales', {
                params: filters,
                headers: { Authorization: `Bearer ${token}` }
            });

            setInvoices(res.data.data || []);
            setPagination({
                current_page: res.data.current_page || 1,
                last_page: res.data.last_page || 1,
                total: res.data.total || 0
            });
        } catch (err) {
            setError('Failed to fetch sales invoices list.');
        } finally {
            setLoading(false);
        }
    };

    const handleSearchSubmit = (e) => {
        e.preventDefault();
        setFilters(prev => ({ ...prev, page: 1 }));
        fetchInvoices();
    };

    const handleViewInvoice = async (invoiceId) => {
        try {
            const token = localStorage.getItem('auth_token');
            const res = await axios.get(`/api/sales/${invoiceId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setSelectedInvoice(res.data);
            setShowInvoiceModal(true);
        } catch (err) {
            alert('Failed to load invoice details.');
        }
    };

    // Calculate Summary Stats from Invoices
    const totalSalesAmount = invoices.reduce((sum, inv) => sum + parseFloat(inv.total_amount || 0), 0);
    const totalPaidAmount = invoices.reduce((sum, inv) => sum + parseFloat(inv.paid_amount || 0), 0);
    const totalDueAmount = invoices.reduce((sum, inv) => sum + parseFloat(inv.due_amount || 0), 0);

    return (
        <div className="container-fluid py-3">
            {/* Header Title & Nav Tabs */}
            <div className="d-flex justify-content-between align-items-center mb-3 border-bottom pb-2">
                <div>
                    <h4 className="fw-bold text-dark mb-0">
                        <i className="fa-solid fa-receipt text-primary me-2"></i>Sales & Billing Hub
                    </h4>
                    <small className="text-muted">Manage Counter Sales, Direct Tax Invoices, Customers & Billing History</small>
                </div>
                <div className="btn-group">
                    <button
                        className={`btn ${activeTab === 'new-sale' ? 'btn-primary fw-bold' : 'btn-outline-primary'}`}
                        onClick={() => setActiveTab('new-sale')}
                    >
                        <i className="fa-solid fa-cart-plus me-1"></i> New Counter Sale
                    </button>
                    <button
                        className={`btn ${activeTab === 'invoices' ? 'btn-primary fw-bold' : 'btn-outline-primary'}`}
                        onClick={() => setActiveTab('invoices')}
                    >
                        <i className="fa-solid fa-file-invoice me-1"></i> Invoice History
                    </button>
                </div>
            </div>

            {/* KPI Cards Header */}
            <div className="row g-3 mb-4">
                <div className="col-md-3">
                    <div className="card shadow-sm border-0 border-start border-primary border-4 bg-white p-3">
                        <div className="d-flex justify-content-between align-items-center">
                            <div>
                                <small className="text-muted fw-bold text-uppercase">Total Invoices</small>
                                <h4 className="fw-bold text-dark mb-0 mt-1">{pagination.total || invoices.length}</h4>
                            </div>
                            <div className="bg-primary text-white rounded-circle p-3">
                                <i className="fa-solid fa-file-invoice fs-5"></i>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="col-md-3">
                    <div className="card shadow-sm border-0 border-start border-success border-4 bg-white p-3">
                        <div className="d-flex justify-content-between align-items-center">
                            <div>
                                <small className="text-muted fw-bold text-uppercase">Total Sales Value</small>
                                <h4 className="fw-bold text-success mb-0 mt-1">₹ {totalSalesAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</h4>
                            </div>
                            <div className="bg-success text-white rounded-circle p-3">
                                <i className="fa-solid fa-indian-rupee-sign fs-5"></i>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="col-md-3">
                    <div className="card shadow-sm border-0 border-start border-info border-4 bg-white p-3">
                        <div className="d-flex justify-content-between align-items-center">
                            <div>
                                <small className="text-muted fw-bold text-uppercase">Payments Collected</small>
                                <h4 className="fw-bold text-info mb-0 mt-1">₹ {totalPaidAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</h4>
                            </div>
                            <div className="bg-info text-white rounded-circle p-3">
                                <i className="fa-solid fa-money-bill-wave fs-5"></i>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="col-md-3">
                    <div className="card shadow-sm border-0 border-start border-danger border-4 bg-white p-3">
                        <div className="d-flex justify-content-between align-items-center">
                            <div>
                                <small className="text-muted fw-bold text-uppercase">Outstanding Due</small>
                                <h4 className="fw-bold text-danger mb-0 mt-1">₹ {totalDueAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</h4>
                            </div>
                            <div className="bg-danger text-white rounded-circle p-3">
                                <i className="fa-solid fa-hand-holding-dollar fs-5"></i>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Tab 1: New Counter Direct Sale */}
            {activeTab === 'new-sale' && (
                <NewSaleForm
                    onSaleCompleted={(inv) => {
                        setActiveTab('invoices');
                    }}
                />
            )}

            {/* Tab 2: Invoice History List */}
            {activeTab === 'invoices' && (
                <div className="card shadow-sm border-0">
                    <div className="card-header bg-white py-3">
                        <form onSubmit={handleSearchSubmit} className="row g-2 align-items-center">
                            <div className="col-md-4">
                                <div className="input-group">
                                    <span className="input-group-text bg-light"><i className="fa-solid fa-search"></i></span>
                                    <input
                                        type="text"
                                        className="form-control"
                                        placeholder="Search by Invoice # or Customer..."
                                        value={filters.search}
                                        onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="col-md-3">
                                <select
                                    className="form-select"
                                    value={filters.payment_status}
                                    onChange={(e) => setFilters({ ...filters, payment_status: e.target.value, page: 1 })}
                                >
                                    <option value="">All Payment Statuses</option>
                                    <option value="PAID">PAID</option>
                                    <option value="PARTIALLY_PAID">PARTIALLY PAID</option>
                                    <option value="UNPAID">UNPAID</option>
                                </select>
                            </div>

                            <div className="col-md-3">
                                <select
                                    className="form-select"
                                    value={filters.status}
                                    onChange={(e) => setFilters({ ...filters, status: e.target.value, page: 1 })}
                                >
                                    <option value="">All Invoice Statuses</option>
                                    <option value="APPROVED">APPROVED</option>
                                    <option value="DRAFT">DRAFT</option>
                                    <option value="CANCELLED">CANCELLED</option>
                                </select>
                            </div>

                            <div className="col-md-2">
                                <button type="submit" className="btn btn-secondary w-100 fw-semibold">
                                    Apply Filter
                                </button>
                            </div>
                        </form>
                    </div>

                    <div className="card-body p-0">
                        {loading ? (
                            <div className="text-center py-5">
                                <div className="spinner-border text-primary" role="status"></div>
                                <p className="mt-2 text-muted">Loading Sales Invoices...</p>
                            </div>
                        ) : error ? (
                            <div className="alert alert-danger m-3">{error}</div>
                        ) : (
                            <div className="table-responsive">
                                <table className="table table-hover align-middle mb-0">
                                    <thead className="table-light text-uppercase small">
                                        <tr>
                                            <th>Invoice #</th>
                                            <th>Date</th>
                                            <th>Customer</th>
                                            <th>Warehouse</th>
                                            <th className="text-end">Total Amount (₹)</th>
                                            <th className="text-end">Paid Amount (₹)</th>
                                            <th className="text-end">Due (₹)</th>
                                            <th className="text-center">Payment Status</th>
                                            <th className="text-center">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {invoices.length === 0 ? (
                                            <tr>
                                                <td colSpan="9" className="text-center py-4 text-muted fst-italic">
                                                    No sales invoices found matching filters.
                                                </td>
                                            </tr>
                                        ) : (
                                            invoices.map((inv) => (
                                                <tr key={inv.id}>
                                                    <td className="fw-bold text-primary">{inv.invoice_number}</td>
                                                    <td className="fw-semibold text-dark">{formatHumanDate(inv.invoice_date)}</td>
                                                    <td>
                                                        <div className="fw-bold text-dark">{inv.customer?.name || 'Walk-in Customer'}</div>
                                                        <small className="text-muted">{inv.customer?.phone || ''}</small>
                                                    </td>
                                                    <td>{inv.warehouse?.name || 'Main Warehouse'}</td>
                                                    <td className="text-end fw-bold text-dark">
                                                        ₹ {parseFloat(inv.total_amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                                    </td>
                                                    <td className="text-end text-success fw-bold">
                                                        ₹ {parseFloat(inv.paid_amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                                    </td>
                                                    <td className="text-end text-danger fw-bold">
                                                        ₹ {parseFloat(inv.due_amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                                    </td>
                                                    <td className="text-center">
                                                        <span className={`badge ${inv.payment_status === 'PAID' ? 'bg-success' : inv.payment_status === 'PARTIALLY_PAID' ? 'bg-warning text-dark' : 'bg-danger'}`}>
                                                            {inv.payment_status}
                                                        </span>
                                                    </td>
                                                    <td className="text-center">
                                                        <button
                                                            className="btn btn-sm btn-outline-primary me-1"
                                                            onClick={() => handleViewInvoice(inv.id)}
                                                            title="View / Print Tax Invoice"
                                                        >
                                                            <i className="fa-solid fa-print me-1"></i> Print / View
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>

                    {/* Pagination Footer */}
                    {pagination.last_page > 1 && (
                        <div className="card-footer bg-light d-flex justify-content-between align-items-center py-2">
                            <span className="small text-muted">
                                Page {pagination.current_page} of {pagination.last_page} ({pagination.total} total items)
                            </span>
                            <div className="btn-group">
                                <button
                                    className="btn btn-sm btn-outline-secondary"
                                    disabled={pagination.current_page === 1}
                                    onClick={() => setFilters({ ...filters, page: pagination.current_page - 1 })}
                                >
                                    Previous
                                </button>
                                <button
                                    className="btn btn-sm btn-outline-secondary"
                                    disabled={pagination.current_page === pagination.last_page}
                                    onClick={() => setFilters({ ...filters, page: pagination.current_page + 1 })}
                                >
                                    Next
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Tax Invoice View Modal */}
            <TaxInvoiceModal
                invoice={selectedInvoice}
                show={showInvoiceModal}
                onClose={() => setShowInvoiceModal(false)}
            />
        </div>
    );
}
