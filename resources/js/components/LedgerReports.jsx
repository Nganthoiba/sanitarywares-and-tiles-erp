import React, { useState, useEffect } from 'react';
import axios from 'axios';

export default function LedgerReports() {
    const [accounts, setAccounts] = useState([]);
    const [trialBalance, setTrialBalance] = useState(null);
    const [profitLoss, setProfitLoss] = useState(null);
    const [balanceSheet, setBalanceSheet] = useState(null);

    const [activeReport, setActiveReport] = useState('tb'); // tb, pl, bs, coa
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const fetchFinancialData = async () => {
        setLoading(true);
        setError(null);
        try {
            const [accRes, tbRes, plRes, bsRes] = await Promise.all([
                axios.get('/api/accounting/accounts'),
                axios.get('/api/accounting/trial-balance'),
                axios.get('/api/accounting/profit-loss'),
                axios.get('/api/accounting/balance-sheet')
            ]);

            if (accRes.data.success) setAccounts(accRes.data.data);
            setTrialBalance(tbRes.data);
            setProfitLoss(plRes.data);
            setBalanceSheet(bsRes.data);
        } catch (err) {
            setError('Error loading general ledger reports data: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchFinancialData();
    }, []);

    // Format currency details helper
    const formatCurrency = (val) => {
        if (val === null || val === undefined) return '₹0.00';
        return '₹' + parseFloat(val).toLocaleString('en-IN', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
    };

    return (
        <div>
            {/* Header banner */}
            <div className="row mb-4">
                <div className="col-12">
                    <div className="card border-0 shadow-sm bg-dark text-white p-4" style={{ background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)' }}>
                        <div className="d-flex justify-content-between align-items-center">
                            <div>
                                <h3 className="fw-bold mb-1">Double Entry General Ledger Reports</h3>
                                <p className="text-white-50 mb-0 font-monospace" style={{ fontSize: '0.85rem' }}>
                                    Algebraic Equation: Assets ({formatCurrency(balanceSheet?.total_assets)}) = Liabilities ({formatCurrency(balanceSheet?.total_liabilities)}) + Equity ({formatCurrency(balanceSheet?.total_equity)})
                                </p>
                            </div>
                            <button className="btn btn-outline-light" onClick={fetchFinancialData} disabled={loading}>
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" className="me-2"><path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l.73-.73"/></svg>
                                {loading ? 'Syncing...' : 'Reload Ledger'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Switcher Navigation */}
            <div className="row mb-4">
                <div className="col-12">
                    <div className="card border-0 shadow-sm">
                        <div className="card-body p-2 d-flex gap-2">
                            <button className={`btn flex-fill py-2 fw-semibold ${activeReport === 'coa' ? 'btn-primary' : 'btn-light'}`} onClick={() => setActiveReport('coa')}>
                                📁 Chart of Accounts
                            </button>
                            <button className={`btn flex-fill py-2 fw-semibold ${activeReport === 'tb' ? 'btn-primary' : 'btn-light'}`} onClick={() => setActiveReport('tb')}>
                                ⚖️ Trial Balance
                            </button>
                            <button className={`btn flex-fill py-2 fw-semibold ${activeReport === 'pl' ? 'btn-primary' : 'btn-light'}`} onClick={() => setActiveReport('pl')}>
                                📉 Profit & Loss
                            </button>
                            <button className={`btn flex-fill py-2 fw-semibold ${activeReport === 'bs' ? 'btn-primary' : 'btn-light'}`} onClick={() => setActiveReport('bs')}>
                                🏛️ Balance Sheet
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {error && (
                <div className="alert alert-danger shadow-sm mb-4" role="alert">
                    {error}
                </div>
            )}

            {/* Main content display */}
            <div className="row">
                <div className="col-12">
                    {loading ? (
                        <div className="card border-0 shadow-sm py-5 text-center">
                            <div className="spinner-border text-primary mx-auto mb-3" role="status"></div>
                            <span className="text-muted">Loading double-entry statements balances...</span>
                        </div>
                    ) : (
                        <div>
                            {/* CHART OF ACCOUNTS view */}
                            {activeReport === 'coa' && (
                                <div className="card border-0 shadow-sm">
                                    <div className="card-header bg-white py-3">
                                        <h5 className="fw-bold mb-0">Active Chart of Accounts Registry</h5>
                                    </div>
                                    <div className="table-responsive">
                                        <table className="table table-hover align-middle mb-0">
                                            <thead className="table-light font-monospace text-uppercase" style={{ fontSize: '0.75rem' }}>
                                                <tr>
                                                    <th>Account Code</th>
                                                    <th>Account Name</th>
                                                    <th>Account Group</th>
                                                    <th>Opening Tally</th>
                                                    <th>Type</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {accounts.map(acc => (
                                                    <tr key={acc.id}>
                                                        <td className="font-monospace fw-semibold text-primary">{acc.code}</td>
                                                        <td>
                                                            <div className="fw-bold text-dark">{acc.name}</div>
                                                            <small className="text-muted">{acc.description || 'No description listed.'}</small>
                                                        </td>
                                                        <td>
                                                            <span className="badge bg-secondary bg-opacity-10 text-secondary">{acc.group?.name || 'GENERIC'}</span>
                                                        </td>
                                                        <td className="font-monospace fw-bold">{formatCurrency(acc.opening_balance)}</td>
                                                        <td>
                                                            <span className={`badge ${acc.opening_type === 'DEBIT' ? 'bg-primary' : 'bg-success'}`}>{acc.opening_type}</span>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}

                            {/* TRIAL BALANCE view */}
                            {activeReport === 'tb' && trialBalance && (
                                <div className="card border-0 shadow-sm">
                                    <div className="card-header bg-white py-3 d-flex justify-content-between align-items-center">
                                        <h5 className="fw-bold mb-0">Trial Balance Sheet</h5>
                                        <span className={`badge ${trialBalance.is_balanced ? 'bg-success' : 'bg-danger'} py-2 px-3`}>
                                            {trialBalance.is_balanced ? '✓ Ledger Balanced' : '✗ Arithmetic Discrepancy'}
                                        </span>
                                    </div>
                                    <div className="table-responsive">
                                        <table className="table table-hover align-middle mb-0">
                                            <thead className="table-light font-monospace text-uppercase" style={{ fontSize: '0.75rem' }}>
                                                <tr>
                                                    <th>Account Code</th>
                                                    <th>Account Account</th>
                                                    <th className="text-end">Debits (Dr.)</th>
                                                    <th className="text-end">Credits (Cr.)</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {trialBalance.rows.map(row => (
                                                    <tr key={row.account_id}>
                                                        <td className="font-monospace">{row.account_code}</td>
                                                        <td className="fw-semibold">{row.account_name}</td>
                                                        <td className="text-end font-monospace text-primary">{row.debit > 0 ? formatCurrency(row.debit) : '--'}</td>
                                                        <td className="text-end font-monospace text-success">{row.credit > 0 ? formatCurrency(row.credit) : '--'}</td>
                                                    </tr>
                                                ))}
                                                <tr className="table-light fw-bold">
                                                    <td colSpan="2">TOTAL TALLIES</td>
                                                    <td className="text-end font-monospace text-primary">{formatCurrency(trialBalance.total_debit)}</td>
                                                    <td className="text-end font-monospace text-success">{formatCurrency(trialBalance.total_credit)}</td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}

                            {/* PROFIT & LOSS view */}
                            {activeReport === 'pl' && profitLoss && (
                                <div className="card border-0 shadow-sm">
                                    <div className="card-header bg-white py-3">
                                        <h5 className="fw-bold mb-0">Profit and Loss Statement (Trading Period)</h5>
                                    </div>
                                    <div className="card-body">
                                        <div className="row g-4">
                                            {/* Revenue Column */}
                                            <div className="col-12 col-md-6">
                                                <h6 className="fw-bold text-success border-bottom pb-2 mb-3">REVENUE & INCOMES</h6>
                                                {profitLoss.income.length === 0 && <p className="text-muted small">No revenue transactions recorded.</p>}
                                                <ul className="list-group list-group-flush">
                                                    {profitLoss.income.map((inc, i) => (
                                                        <li key={i} className="list-group-item d-flex justify-content-between align-items-center px-0">
                                                            <span>{inc.account_name}</span>
                                                            <span className="font-monospace fw-bold">{formatCurrency(inc.balance)}</span>
                                                        </li>
                                                    ))}
                                                    <li className="list-group-item d-flex justify-content-between align-items-center px-0 fw-bold table-light border-top">
                                                        <span>GROSS INCOMES</span>
                                                        <span className="font-monospace text-success">{formatCurrency(profitLoss.total_income)}</span>
                                                    </li>
                                                </ul>
                                            </div>

                                            {/* Expenses Column */}
                                            <div className="col-12 col-md-6">
                                                <h6 className="fw-bold text-danger border-bottom pb-2 mb-3">COSTS & OPERATIONAL EXPENSES</h6>
                                                {profitLoss.expenses.length === 0 && <p className="text-muted small">No expense transactions recorded.</p>}
                                                <ul className="list-group list-group-flush">
                                                    {profitLoss.expenses.map((exp, i) => (
                                                        <li key={i} className="list-group-item d-flex justify-content-between align-items-center px-0">
                                                            <span>{exp.account_name}</span>
                                                            <span className="font-monospace fw-bold">{formatCurrency(exp.balance)}</span>
                                                        </li>
                                                    ))}
                                                    <li className="list-group-item d-flex justify-content-between align-items-center px-0 fw-bold table-light border-top">
                                                        <span>GROSS EXPENSES</span>
                                                        <span className="font-monospace text-danger">{formatCurrency(profitLoss.total_expenses)}</span>
                                                    </li>
                                                </ul>
                                            </div>
                                        </div>

                                        <div className="mt-4 p-4 rounded bg-light border d-flex justify-content-between align-items-center">
                                            <div>
                                                <h5 className="fw-bold mb-1">Net Trading Profit</h5>
                                                <small className="text-muted">Calculated as: Total Revenue - Operations Expenses</small>
                                            </div>
                                            <h3 className={`fw-bold mb-0 ${profitLoss.net_profit >= 0 ? 'text-success' : 'text-danger'}`}>
                                                {formatCurrency(profitLoss.net_profit)}
                                            </h3>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* BALANCE SHEET view */}
                            {activeReport === 'bs' && balanceSheet && (
                                <div className="card border-0 shadow-sm">
                                    <div className="card-header bg-white py-3">
                                        <h5 className="fw-bold mb-0">Balance Sheet Statement</h5>
                                    </div>
                                    <div className="card-body">
                                        <div className="row g-4">
                                            {/* Assets */}
                                            <div className="col-12 col-md-6">
                                                <h6 className="fw-bold text-primary border-bottom pb-2 mb-3">ASSETS & PROPERTY</h6>
                                                {balanceSheet.assets.length === 0 && <p className="text-muted small">No assets balances recorded.</p>}
                                                <ul className="list-group list-group-flush">
                                                    {balanceSheet.assets.map((asset, i) => (
                                                        <li key={i} className="list-group-item d-flex justify-content-between align-items-center px-0">
                                                            <span>{asset.account_name}</span>
                                                            <span className="font-monospace fw-bold">{formatCurrency(asset.balance)}</span>
                                                        </li>
                                                    ))}
                                                    <li className="list-group-item d-flex justify-content-between align-items-center px-0 fw-bold table-light border-top">
                                                        <span>TOTAL ASSETS VALUE</span>
                                                        <span className="font-monospace text-primary">{formatCurrency(balanceSheet.total_assets)}</span>
                                                    </li>
                                                </ul>
                                            </div>

                                            {/* Liabilities & Equity */}
                                            <div className="col-12 col-md-6">
                                                <h6 className="fw-bold text-dark border-bottom pb-2 mb-3">LIABILITIES & RESERVES / EQUITIES</h6>
                                                
                                                <p className="text-secondary small fw-bold mb-2">Liabilities</p>
                                                {balanceSheet.liabilities.length === 0 && <p className="text-muted small">No liabilities entries recorded.</p>}
                                                <ul className="list-group list-group-flush mb-3">
                                                    {balanceSheet.liabilities.map((liab, i) => (
                                                        <li key={i} className="list-group-item d-flex justify-content-between align-items-center px-0">
                                                            <span>{liab.account_name}</span>
                                                            <span className="font-monospace fw-bold">{formatCurrency(liab.balance)}</span>
                                                        </li>
                                                    ))}
                                                    <li className="list-group-item d-flex justify-content-between align-items-center px-0 fw-bold">
                                                        <span>Total Liabilities</span>
                                                        <span className="font-monospace text-dark">{formatCurrency(balanceSheet.total_liabilities)}</span>
                                                    </li>
                                                </ul>

                                                <p className="text-secondary small fw-bold mb-2">Shareholder Reserves & Equities</p>
                                                <ul className="list-group list-group-flush">
                                                    {balanceSheet.equity.map((eq, i) => (
                                                        <li key={i} className="list-group-item d-flex justify-content-between align-items-center px-0">
                                                            <span>{eq.account_name}</span>
                                                            <span className="font-monospace fw-bold">{formatCurrency(eq.balance)}</span>
                                                        </li>
                                                    ))}
                                                    <li className="list-group-item d-flex justify-content-between align-items-center px-0 fw-bold table-light border-top">
                                                        <span>TOTAL CAPITAL & LIABILITIES</span>
                                                        <span className="font-monospace text-dark">{formatCurrency(balanceSheet.total_liabilities_and_equity)}</span>
                                                    </li>
                                                </ul>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
