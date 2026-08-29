import React, { useState, useEffect } from 'react';

export default function ReportingHub() {
    const [selectedCategory, setSelectedCategory] = useState('dashboard');
    const [reportName, setReportName] = useState('Overview');
    const [reportData, setReportData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [filters, setFilters] = useState({
        warehouse_id: '',
        branch_id: '',
        start_date: '2026-04-01',
        end_date: '2027-03-31'
    });

    useEffect(() => {
        fetchReport();
    }, [selectedCategory, reportName]);

    const fetchReport = async () => {
        setLoading(true);
        try {
            let url = `/api/reports/dashboard`;
            if (selectedCategory === 'inventory') {
                url = `/api/reports/inventory?report_name=${encodeURIComponent(reportName)}&warehouse_id=${filters.warehouse_id}`;
            } else if (selectedCategory === 'sales') {
                url = `/api/reports/sales?report_name=${encodeURIComponent(reportName)}&branch_id=${filters.branch_id}`;
            } else if (selectedCategory === 'purchase') {
                url = `/api/reports/purchase?report_name=${encodeURIComponent(reportName)}`;
            } else if (selectedCategory === 'granite') {
                url = `/api/reports/granite?report_name=${encodeURIComponent(reportName)}`;
            } else if (selectedCategory === 'accounting') {
                url = `/api/reports/accounting?report_name=${encodeURIComponent(reportName)}`;
            } else if (selectedCategory === 'management') {
                url = `/api/reports/management?report_name=${encodeURIComponent(reportName)}`;
            } else if (selectedCategory === 'audit') {
                url = `/api/reports/audit?report_name=${encodeURIComponent(reportName)}`;
            }

            const response = await fetch(url);
            const result = await response.json();
            if (result.success) {
                setReportData(result);
            } else {
                setReportData(null);
            }
        } catch (error) {
            console.error("Failed to load report data:", error);
            setReportData(null);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="card shadow-sm border-0 mb-4" style={{ borderRadius: '15px', overflow: 'hidden' }}>
            {/* Header Area */}
            <div className="card-header bg-gradient bg-primary text-white p-4 d-flex justify-content-between align-items-center">
                <div>
                    <h3 className="mb-1 fw-bold tracking-tight">🏢 Commercial Monolith Reporting Engine</h3>
                    <p className="mb-0 text-white-50 small font-monospace">Building Materials SaaS / Analytics Processor v1.0</p>
                </div>
                <button className="btn btn-light btn-sm fw-bold px-3 py-2" onClick={fetchReport} disabled={loading}>
                    {loading ? (
                        <>
                            <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                            Loading...
                        </>
                    ) : '🔄 Reload Ledger Data'}
                </button>
            </div>

            {/* Navigation Tabs */}
            <div className="bg-light border-bottom px-4 py-2">
                <ul className="nav nav-pills gap-2 text-uppercase fw-bold font-monospace" style={{ fontSize: '0.8rem' }}>
                    <li className="nav-item">
                        <button className={`nav-link px-3 py-2 ${selectedCategory === 'dashboard' ? 'active bg-dark' : 'text-secondary'}`} onClick={() => { setSelectedCategory('dashboard'); setReportName('Overview'); }}>📊 Executive Dash</button>
                    </li>
                    <li className="nav-item">
                        <button className={`nav-link px-3 py-2 ${selectedCategory === 'inventory' ? 'active bg-dark' : 'text-secondary'}`} onClick={() => { setSelectedCategory('inventory'); setReportName('Current Stock'); }}>📦 Inventory</button>
                    </li>
                    <li className="nav-item">
                        <button className={`nav-link px-3 py-2 ${selectedCategory === 'sales' ? 'active bg-dark' : 'text-secondary'}`} onClick={() => { setSelectedCategory('sales'); setReportName('Sales Register'); }}>📤 Sales</button>
                    </li>
                    <li className="nav-item">
                        <button className={`nav-link px-3 py-2 ${selectedCategory === 'purchase' ? 'active bg-dark' : 'text-secondary'}`} onClick={() => { setSelectedCategory('purchase'); setReportName('Purchase Register'); }}>📥 Purchases</button>
                    </li>
                    <li className="nav-item">
                        <button className={`nav-link px-3 py-2 ${selectedCategory === 'granite' ? 'active bg-dark' : 'text-secondary'}`} onClick={() => { setSelectedCategory('granite'); setReportName('Granite Slabs'); }}>📐 Granite Slabs</button>
                    </li>
                    <li className="nav-item">
                        <button className={`nav-link px-3 py-2 ${selectedCategory === 'accounting' ? 'active bg-dark' : 'text-secondary'}`} onClick={() => { setSelectedCategory('accounting'); setReportName('Trial Balance'); }}>💰 Accounting</button>
                    </li>
                    <li className="nav-item">
                        <button className={`nav-link px-3 py-2 ${selectedCategory === 'management' ? 'active bg-dark' : 'text-secondary'}`} onClick={() => { setSelectedCategory('management'); setReportName('Performance Overview'); }}>💼 Management</button>
                    </li>
                    <li className="nav-item">
                        <button className={`nav-link px-3 py-2 ${selectedCategory === 'audit' ? 'active bg-dark' : 'text-secondary'}`} onClick={() => { setSelectedCategory('audit'); setReportName('Audit Trail'); }}>🔒 Security Logs</button>
                    </li>
                </ul>
            </div>

            {/* Filter Section */}
            <div className="card-body p-4 bg-white">
                <div className="row g-3 mb-4 bg-light p-3 rounded" style={{ border: '1px solid #e9ecef' }}>
                    <div className="col-md-3">
                        <label className="form-label fw-bold text-muted small">Warehouse ID Filter</label>
                        <input type="text" className="form-control" placeholder="e.g. 1" value={filters.warehouse_id} onChange={(e) => setFilters({...filters, warehouse_id: e.target.value})} />
                    </div>
                    <div className="col-md-3">
                        <label className="form-label fw-bold text-muted small">Branch ID Filter</label>
                        <input type="text" className="form-control" placeholder="e.g. 1" value={filters.branch_id} onChange={(e) => setFilters({...filters, branch_id: e.target.value})} />
                    </div>
                    <div className="col-md-3">
                        <label className="form-label fw-bold text-muted small">Start Date</label>
                        <input type="date" className="form-control" value={filters.start_date} onChange={(e) => setFilters({...filters, start_date: e.target.value})} />
                    </div>
                    <div className="col-md-3">
                        <label className="form-label fw-bold text-muted small">End Date</label>
                        <input type="date" className="form-control" value={filters.end_date} onChange={(e) => setFilters({...filters, end_date: e.target.value})} />
                    </div>
                </div>

                {/* Sub Menu Selection */}
                {selectedCategory === 'inventory' && (
                    <div className="btn-group mb-4" role="group">
                        <button className={`btn btn-sm ${reportName === 'Current Stock' ? 'btn-primary' : 'btn-outline-primary'}`} onClick={() => setReportName('Current Stock')}>Current Stock Status</button>
                        <button className={`btn btn-sm ${reportName === 'Stock Ledger' ? 'btn-primary' : 'btn-outline-primary'}`} onClick={() => setReportName('Stock Ledger')}>Stock Ledger Movement</button>
                    </div>
                )}
                {selectedCategory === 'sales' && (
                    <div className="btn-group mb-4" role="group">
                        <button className={`btn btn-sm ${reportName === 'Sales Register' ? 'btn-primary' : 'btn-outline-primary'}`} onClick={() => setReportName('Sales Register')}>Sales Invoice Register</button>
                        <button className={`btn btn-sm ${reportName === 'Sales By Category' ? 'btn-primary' : 'btn-outline-primary'}`} onClick={() => setReportName('Sales By Category')}>Sales Summary By Category</button>
                    </div>
                )}
                {selectedCategory === 'accounting' && (
                    <div className="btn-group mb-4" role="group">
                        <button className={`btn btn-sm ${reportName === 'Trial Balance' ? 'btn-primary' : 'btn-outline-primary'}`} onClick={() => setReportName('Trial Balance')}>Trial Balance Sheet</button>
                        <button className={`btn btn-sm ${reportName === 'Profit & Loss' ? 'btn-primary' : 'btn-outline-primary'}`} onClick={() => setReportName('Profit & Loss')}>Profit & Loss Account</button>
                        <button className={`btn btn-sm ${reportName === 'Balance Sheet' ? 'btn-primary' : 'btn-outline-primary'}`} onClick={() => setReportName('Balance Sheet')}>Balance Sheet Summary</button>
                    </div>
                )}

                {/* Report Content View */}
                {loading ? (
                    <div className="text-center py-5">
                        <div className="spinner-border text-primary mb-3" style={{ width: '3rem', height: '3rem' }} role="status"></div>
                        <h5 className="text-secondary fw-semibold">Compiling ERP Data Points...</h5>
                    </div>
                ) : reportData ? (
                    <div>
                        <div className="d-flex justify-content-between align-items-center mb-3">
                            <h4 className="fw-bold mb-0 text-dark">{reportData.report_name}</h4>
                            <span className="badge bg-secondary font-monospace" style={{ fontSize: '0.8rem' }}>Speed: {parseFloat(reportData.execution_time_ms).toFixed(2)} ms</span>
                        </div>

                        {/* Rendering different report tables */}
                        {selectedCategory === 'dashboard' && (
                            <div className="row g-4">
                                {reportData.data.map((item, idx) => (
                                    <React.Fragment key={idx}>
                                        <div className="col-md-3">
                                            <div className="p-4 rounded border bg-gradient bg-light text-center">
                                                <h5 className="text-muted fw-bold mb-1">Total Sales</h5>
                                                <h2 className="text-primary fw-bold mb-0">₹{item.total_sales.toLocaleString()}</h2>
                                            </div>
                                        </div>
                                        <div className="col-md-3">
                                            <div className="p-4 rounded border bg-gradient bg-light text-center">
                                                <h5 className="text-muted fw-bold mb-1">Procurement Costs</h5>
                                                <h2 className="text-danger fw-bold mb-0">₹{item.total_purchases.toLocaleString()}</h2>
                                            </div>
                                        </div>
                                        <div className="col-md-3">
                                            <div className="p-4 rounded border bg-gradient bg-light text-center">
                                                <h5 className="text-muted fw-bold mb-1">Slabs Inventory</h5>
                                                <h2 className="text-success fw-bold mb-0">{item.total_slabs_on_hand} Pcs</h2>
                                            </div>
                                        </div>
                                        <div className="col-md-3">
                                            <div className="p-4 rounded border bg-gradient bg-light text-center">
                                                <h5 className="text-muted fw-bold mb-1">Running Workflows</h5>
                                                <h2 className="text-warning fw-bold mb-0">{item.active_workflows}</h2>
                                            </div>
                                        </div>
                                    </React.Fragment>
                                ))}
                            </div>
                        )}

                        {selectedCategory === 'inventory' && reportName === 'Current Stock' && (
                            <div className="table-responsive">
                                <table className="table table-hover border">
                                    <thead className="table-dark">
                                        <tr>
                                            <th>Product ID</th>
                                            <th>Product Name</th>
                                            <th>SKU</th>
                                            <th>Unit Count</th>
                                            <th>Total Area (SQFT)</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {reportData.data.map((item, idx) => (
                                            <tr key={idx}>
                                                <td>{item.product_id}</td>
                                                <td className="fw-bold">{item.product_name}</td>
                                                <td><span className="badge bg-secondary font-monospace">{item.product_sku}</span></td>
                                                <td>{item.total_units} units</td>
                                                <td>{parseFloat(item.total_area || 0).toFixed(4)} SQFT</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        {selectedCategory === 'inventory' && reportName === 'Stock Ledger' && (
                            <div className="table-responsive">
                                <table className="table table-hover border">
                                    <thead className="table-dark">
                                        <tr>
                                            <th>ID</th>
                                            <th>Date</th>
                                            <th>Type</th>
                                            <th>Qty</th>
                                            <th>Slab Code</th>
                                            <th>Product</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {reportData.data.map((item, idx) => (
                                            <tr key={idx}>
                                                <td>#{item.id}</td>
                                                <td>{item.movement_date}</td>
                                                <td><span className={`badge ${item.movement_type === 'PURCHASE' ? 'bg-success' : 'bg-primary'}`}>{item.movement_type}</span></td>
                                                <td>{item.quantity}</td>
                                                <td>{item.slab_code || 'N/A'}</td>
                                                <td>{item.product_name} ({item.product_sku})</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        {selectedCategory === 'sales' && reportName === 'Sales Register' && (
                            <div className="table-responsive">
                                <table className="table table-hover border">
                                    <thead className="table-dark">
                                        <tr>
                                            <th>Invoice ID</th>
                                            <th>Number</th>
                                            <th>Date</th>
                                            <th>Customer Name</th>
                                            <th>Sub Total</th>
                                            <th>Tax Paid</th>
                                            <th>Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {reportData.data.map((item, idx) => (
                                            <tr key={idx}>
                                                <td>#{item.id}</td>
                                                <td className="fw-bold text-primary">{item.invoice_number}</td>
                                                <td>{item.invoice_date}</td>
                                                <td>{item.customer_name}</td>
                                                <td>₹{parseFloat(item.total_amount).toLocaleString()}</td>
                                                <td>₹{parseFloat(item.tax_amount).toLocaleString()}</td>
                                                <td><span className="badge bg-success">{item.status}</span></td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        {selectedCategory === 'sales' && reportName === 'Sales By Category' && (
                            <div className="table-responsive">
                                <table className="table table-hover border">
                                    <thead className="table-dark">
                                        <tr>
                                            <th>Category Name</th>
                                            <th>Total Qty Sold</th>
                                            <th>Revenue Accumulated</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {reportData.data.map((item, idx) => (
                                            <tr key={idx}>
                                                <td className="fw-bold">{item.category_name}</td>
                                                <td>{item.total_qty} units</td>
                                                <td>₹{parseFloat(item.total_revenue).toLocaleString()}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        {selectedCategory === 'purchase' && (
                            <div className="table-responsive">
                                <table className="table table-hover border">
                                    <thead className="table-dark">
                                        <tr>
                                            <th>Voucher ID</th>
                                            <th>Number</th>
                                            <th>Date</th>
                                            <th>Supplier Name</th>
                                            <th>Grand Total</th>
                                            <th>Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {reportData.data.map((item, idx) => (
                                            <tr key={idx}>
                                                <td>#{item.id}</td>
                                                <td className="fw-bold text-danger">{item.invoice_number}</td>
                                                <td>{item.invoice_date}</td>
                                                <td>{item.supplier_name}</td>
                                                <td>₹{parseFloat(item.total_amount).toLocaleString()}</td>
                                                <td><span className="badge bg-warning text-dark">{item.status}</span></td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        {selectedCategory === 'granite' && (
                            <div className="table-responsive">
                                <table className="table table-hover border">
                                    <thead className="table-dark">
                                        <tr>
                                            <th>ID</th>
                                            <th>Slab Code</th>
                                            <th>Dimensions (L x W)</th>
                                            <th>Area (SQFT)</th>
                                            <th>Status</th>
                                            <th>Product Name</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {reportData.data.map((item, idx) => (
                                            <tr key={idx}>
                                                <td>#{item.id}</td>
                                                <td className="fw-bold text-primary">{item.slab_code}</td>
                                                <td>{item.length} x {item.width} inches</td>
                                                <td>{parseFloat(item.area_on_hand).toFixed(4)} SQFT</td>
                                                <td><span className="badge bg-info text-dark">{item.status}</span></td>
                                                <td>{item.product_name}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        {selectedCategory === 'accounting' && reportName === 'Trial Balance' && (
                            <div className="table-responsive">
                                <table className="table table-hover border">
                                    <thead className="table-dark">
                                        <tr>
                                            <th>Code</th>
                                            <th>Account Name</th>
                                            <th>Debits (Dr.)</th>
                                            <th>Credits (Cr.)</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {reportData.data.rows?.map((item, idx) => (
                                            <tr key={idx}>
                                                <td>{item.account_code}</td>
                                                <td className="fw-bold">{item.account_name}</td>
                                                <td className="text-success">{item.debit > 0 ? `₹${parseFloat(item.debit).toLocaleString()}` : '-'}</td>
                                                <td className="text-danger">{item.credit > 0 ? `₹${parseFloat(item.credit).toLocaleString()}` : '-'}</td>
                                            </tr>
                                        ))}
                                        <tr className="table-secondary fw-bold">
                                            <td colSpan={2}>Aggregate Tallies</td>
                                            <td className="text-success">₹{parseFloat(reportData.data.total_debit || 0).toLocaleString()}</td>
                                            <td className="text-danger">₹{parseFloat(reportData.data.total_credit || 0).toLocaleString()}</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        )}

                        {selectedCategory === 'accounting' && reportName === 'Profit & Loss' && (
                            <div className="row">
                                <div className="col-md-6">
                                    <h5 className="fw-bold text-success border-bottom pb-2">Trading Incomes (Revenue)</h5>
                                    {reportData.data.income?.map((item, idx) => (
                                        <div className="d-flex justify-content-between p-2 border-bottom" key={idx}>
                                            <span>{item.account_name}</span>
                                            <span className="fw-bold">₹{item.balance.toLocaleString()}</span>
                                        </div>
                                    ))}
                                    <div className="d-flex justify-content-between p-2 fw-bold text-success">
                                        <span>Total Income</span>
                                        <span>₹{parseFloat(reportData.data.total_income || 0).toLocaleString()}</span>
                                    </div>
                                </div>
                                <div className="col-md-6">
                                    <h5 className="fw-bold text-danger border-bottom pb-2">Expenses & Trading Accounts</h5>
                                    {reportData.data.expenses?.map((item, idx) => (
                                        <div className="d-flex justify-content-between p-2 border-bottom" key={idx}>
                                            <span>{item.account_name}</span>
                                            <span className="fw-bold">₹{item.balance.toLocaleString()}</span>
                                        </div>
                                    ))}
                                    <div className="d-flex justify-content-between p-2 fw-bold text-danger">
                                        <span>Total Expenses</span>
                                        <span>₹{parseFloat(reportData.data.total_expenses || 0).toLocaleString()}</span>
                                    </div>
                                </div>
                                <div className="col-12 mt-4 p-3 bg-light rounded text-center">
                                    <h4 className="fw-bold text-primary mb-0">Compiled Net Profit: ₹{parseFloat(reportData.data.net_profit || 0).toLocaleString()}</h4>
                                </div>
                            </div>
                        )}

                        {selectedCategory === 'accounting' && reportName === 'Balance Sheet' && (
                            <div className="row">
                                <div className="col-md-6">
                                    <h5 className="fw-bold text-primary border-bottom pb-2">Assets Ledger Profiles</h5>
                                    {reportData.data.assets?.map((item, idx) => (
                                        <div className="d-flex justify-content-between p-2 border-bottom" key={idx}>
                                            <span>{item.account_name}</span>
                                            <span className="fw-bold">₹{item.balance.toLocaleString()}</span>
                                        </div>
                                    ))}
                                    <div className="d-flex justify-content-between p-2 fw-bold text-primary">
                                        <span>Total Assets</span>
                                        <span>₹{parseFloat(reportData.data.total_assets || 0).toLocaleString()}</span>
                                    </div>
                                </div>
                                <div className="col-md-6">
                                    <h5 className="fw-bold text-dark border-bottom pb-2">Liabilities & Owners Equity</h5>
                                    {reportData.data.liabilities?.map((item, idx) => (
                                        <div className="d-flex justify-content-between p-2 border-bottom" key={idx}>
                                            <span>{item.account_name}</span>
                                            <span className="fw-bold">₹{item.balance.toLocaleString()}</span>
                                        </div>
                                    ))}
                                    <div className="d-flex justify-content-between p-2 border-bottom">
                                        <span className="fw-semibold">Total Corporate Liabilities</span>
                                        <span className="fw-semibold">₹{parseFloat(reportData.data.total_liabilities || 0).toLocaleString()}</span>
                                    </div>

                                    <h6 className="fw-bold text-dark mt-3 border-bottom pb-1">Capital Reserves</h6>
                                    {reportData.data.equity?.map((item, idx) => (
                                        <div className="d-flex justify-content-between p-2 border-bottom" key={idx}>
                                            <span>{item.account_name}</span>
                                            <span className="fw-bold">₹{item.balance.toLocaleString()}</span>
                                        </div>
                                    ))}
                                    <div className="d-flex justify-content-between p-2 fw-bold text-dark">
                                        <span>Total Liabilities + Equity</span>
                                        <span>₹{parseFloat(reportData.data.total_liabilities_and_equity || 0).toLocaleString()}</span>
                                    </div>
                                </div>
                            </div>
                        )}

                        {selectedCategory === 'management' && (
                            <div className="row g-4">
                                {reportData.data.map((item, idx) => (
                                    <React.Fragment key={idx}>
                                        <div className="col-md-4">
                                            <div className="p-4 rounded border text-center">
                                                <h5 className="text-muted mb-1">Gross Billing Volume</h5>
                                                <h3 className="fw-bold text-primary">₹{item.gross_performance.toLocaleString()}</h3>
                                            </div>
                                        </div>
                                        <div className="col-md-4">
                                            <div className="p-4 rounded border text-center">
                                                <h5 className="text-muted mb-1">Total Procurement Costs</h5>
                                                <h3 className="fw-bold text-danger">₹{item.procurement_level.toLocaleString()}</h3>
                                            </div>
                                        </div>
                                        <div className="col-md-4">
                                            <div className="p-4 rounded border text-center">
                                                <h5 className="text-muted mb-1">Operational Margins</h5>
                                                <h3 className="fw-bold text-success">{parseFloat(item.margin_percentage).toFixed(2)}%</h3>
                                            </div>
                                        </div>
                                    </React.Fragment>
                                ))}
                            </div>
                        )}

                        {selectedCategory === 'audit' && (
                            <div className="table-responsive">
                                <table className="table table-hover border">
                                    <thead className="table-dark">
                                        <tr>
                                            <th>Timestamp</th>
                                            <th>Report Name</th>
                                            <th>Sector</th>
                                            <th>Generated By</th>
                                            <th>Speed</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {reportData.data.map((item, idx) => (
                                            <tr key={idx}>
                                                <td>{item.created_at}</td>
                                                <td className="fw-bold">{item.report_name}</td>
                                                <td><span className="badge bg-dark">{item.report_type}</span></td>
                                                <td>{item.user ? item.user.name : `User #${item.user_id}`}</td>
                                                <td>{parseFloat(item.execution_time_ms).toFixed(2)} ms</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}

                    </div>
                ) : (
                    <div className="alert alert-warning text-center py-4 mb-0 position-relative">
                        <button type="button" className="btn-close position-absolute top-0 end-0 m-3" onClick={(e) => { e.currentTarget.closest('.alert').style.display = 'none'; }} aria-label="Close"></button>
                        <h5 className="mb-0">No transaction data captured within selected parameters.</h5>
                    </div>
                )}
            </div>
        </div>
    );
}
