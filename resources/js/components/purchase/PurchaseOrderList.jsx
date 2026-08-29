import React, { useState, useEffect } from 'react';
import axios from 'axios';
import PurchaseOrderForm from './PurchaseOrderForm';
import PurchaseOrderView from './PurchaseOrderView';

export default function PurchaseOrderList({ initialViewMode = 'list', onViewModeChange, userPermissions = [] }) {
    const [viewMode, setViewMode] = useState(initialViewMode); // list, create, edit, view
    const [selectedPoId, setSelectedPoId] = useState(null);
    const [pos, setPos] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Filter states
    const [filters, setFilters] = useState({
        supplier_id: '',
        branch_id: '',
        status: '',
        date_from: '',
        date_to: '',
        search: ''
    });

    const [suppliers, setSuppliers] = useState([]);
    const [branches, setBranches] = useState([]);

    useEffect(() => {
        setViewMode(initialViewMode);
    }, [initialViewMode]);

    useEffect(() => {
        if (onViewModeChange) {
            onViewModeChange(viewMode);
        }
    }, [viewMode, onViewModeChange]);

    const fetchPOs = async () => {
        setLoading(true);
        setError(null);
        try {
            const token = localStorage.getItem('auth_token');
            const res = await axios.get('/api/purchase-orders', {
                params: filters,
                headers: { Authorization: `Bearer ${token}` }
            });
            setPos(res.data.data || []);
        } catch (err) {
            setError('Failed to fetch Purchase Orders.');
        } finally {
            setLoading(false);
        }
    };

    // Load reference data
    useEffect(() => {
        const fetchMetadata = async () => {
            try {
                const token = localStorage.getItem('auth_token');
                const res = await axios.get('/api/purchase-orders/form-data', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setSuppliers(res.data.suppliers || []);
                setBranches(res.data.branches || []);
            } catch (err) {
                console.error('Failed to load filter metadata.');
            }
        };
        fetchMetadata();
    }, []);

    useEffect(() => {
        if (viewMode === 'list') {
            fetchPOs();
        }
    }, [viewMode, filters]);

    const handleFilterChange = (field, value) => {
        setFilters(prev => ({ ...prev, [field]: value }));
    };

    const hasPermission = (perm) => {
        return userPermissions.includes(perm) || userPermissions.includes('administrator');
    };

    const getStatusBadge = (status) => {
        switch (status) {
            case 'DRAFT': return 'bg-secondary text-white';
            case 'SUBMITTED': return 'bg-warning text-dark';
            case 'APPROVED': return 'bg-success text-white';
            case 'SENT': return 'bg-info text-white';
            case 'PARTIALLY_RECEIVED': return 'bg-primary text-white';
            case 'FULLY_RECEIVED': return 'bg-dark text-white';
            case 'CLOSED': return 'bg-light text-dark border border-secondary';
            case 'CANCELLED': return 'bg-danger text-white';
            default: return 'bg-secondary text-white';
        }
    };

    const handleQuickSubmit = async (id) => {
        if (!confirm('Are you sure you want to submit this Purchase Order for approval?')) return;
        try {
            const token = localStorage.getItem('auth_token');
            await axios.post(`/api/purchase-orders/${id}/submit`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            alert('Purchase Order submitted successfully!');
            fetchPOs();
        } catch (err) {
            alert(err.response?.data?.message || 'Submission failed.');
        }
    };

    if (viewMode === 'create' || viewMode === 'edit') {
        return (
            <PurchaseOrderForm
                poId={viewMode === 'edit' ? selectedPoId : null}
                onBack={() => setViewMode('list')}
                onSaveSuccess={() => setViewMode('list')}
            />
        );
    }

    if (viewMode === 'view') {
        return (
            <PurchaseOrderView
                poId={selectedPoId}
                onBack={() => setViewMode('list')}
                userPermissions={userPermissions}
                onStatusChanged={fetchPOs}
            />
        );
    }

    return (
        <div className="animate__animated animate__fadeIn">
            <div className="d-flex align-items-center justify-content-between mb-4">
                <div>
                    <h3 className="fw-bold text-dark">Purchase Orders Registry</h3>
                    <p className="text-muted small mb-0">Create, manage, and trace the status of organizational purchase orders and supplier acquisitions.</p>
                </div>
                {hasPermission('purchase.orders.create') && (
                    <button
                        className="btn btn-dark px-4 shadow-sm"
                        onClick={() => {
                            setSelectedPoId(null);
                            setViewMode('create');
                        }}
                    >
                        <i className="fa-solid fa-plus me-2 text-warning"></i> Raise New PO
                    </button>
                )}
            </div>

            {error && (
                <div className="alert alert-danger d-flex align-items-center justify-content-between mb-4" role="alert">
                    <div className="d-flex align-items-center">
                        <i className="fa-solid fa-circle-exclamation me-2"></i>
                        <div>{error}</div>
                    </div>
                    <button type="button" className="btn-close ms-2 flex-shrink-0" onClick={() => setError(null)} aria-label="Close"></button>
                </div>
            )}

            {/* Filter Panel */}
            <div className="card border-0 shadow-sm p-4 mb-4" style={{ borderRadius: '12px' }}>
                <h6 className="text-uppercase text-secondary font-monospace fw-bold mb-3" style={{ fontSize: '0.8rem', letterSpacing: '1px' }}>
                    <i className="fa-solid fa-filter me-2 text-primary"></i> Filter Registry
                </h6>
                <div className="row g-3">
                    <div className="col-md-2">
                        <label htmlFor="po-search" className="form-label small mb-1">Search PO Number</label>
                        <input
                            id='po-search'
                            type="text"
                            className="form-control form-control-sm"
                            placeholder="Search PO Number or remarks..."
                            value={filters.search}
                            onChange={(e) => handleFilterChange('search', e.target.value)}
                        />
                    </div>
                    <div className="col-md-2">
                        <label htmlFor="po-branch" className="form-label small mb-1">Select Branch</label>
                        <select
                            id='po-branch'
                            className="form-select form-select-sm"
                            value={filters.branch_id}
                            onChange={(e) => handleFilterChange('branch_id', e.target.value)}
                        >
                            <option value="">-- All Branches --</option>
                            {branches.map(b => (
                                <option key={b.id} value={b.id}>{b.name}</option>
                            ))}
                        </select>
                    </div>
                    <div className="col-md-2">
                        <label htmlFor="po-supplier" className="form-label small mb-1">Select Supplier</label>
                        <select
                            className="form-select form-select-sm"
                            value={filters.supplier_id}
                            onChange={(e) => handleFilterChange('supplier_id', e.target.value)}
                        >
                            <option value="">-- All Suppliers --</option>
                            {suppliers.map(s => (
                                <option key={s.id} value={s.id}>{s.name}</option>
                            ))}
                        </select>
                    </div>
                    <div className="col-md-2">
                        <label htmlFor="po-status" className="form-label small mb-1">Select Status</label>
                        <select
                            className="form-select form-select-sm"
                            value={filters.status}
                            onChange={(e) => handleFilterChange('status', e.target.value)}
                        >
                            <option value="">-- All Statuses --</option>
                            <option value="DRAFT">DRAFT</option>
                            <option value="SUBMITTED">SUBMITTED</option>
                            <option value="APPROVED">APPROVED</option>
                            <option value="SENT">SENT</option>
                            <option value="PARTIALLY_RECEIVED">PARTIALLY RECEIVED</option>
                            <option value="FULLY_RECEIVED">FULLY RECEIVED</option>
                            <option value="CLOSED">CLOSED</option>
                            <option value="CANCELLED">CANCELLED</option>
                        </select>
                    </div>
                    <div className="col-md-2">
                        <label htmlFor="po-date-from" className="form-label small mb-1">Select PO Date From</label>
                        <input
                            type="date"
                            className="form-control form-control-sm"
                            value={filters.date_from}
                            onChange={(e) => handleFilterChange('date_from', e.target.value)}
                            title="PO Date From"
                        />
                    </div>
                    <div className="col-md-2">
                        <label htmlFor="po-date-to" className="form-label small mb-1">Select PO Date To</label>
                        <input
                            type="date"
                            className="form-control form-control-sm"
                            value={filters.date_to}
                            onChange={(e) => handleFilterChange('date_to', e.target.value)}
                            title="PO Date To"
                        />
                    </div>
                </div>
            </div>

            {/* List Panel */}
            <div className="card border-0 shadow-sm" style={{ borderRadius: '12px' }}>
                <div className="table-responsive">
                    <table className="table table-hover align-middle mb-0">
                        <thead className="table-light text-uppercase font-monospace" style={{ fontSize: '0.8rem' }}>
                            <tr>
                                <th className="ps-4">PO Number</th>
                                <th>Date</th>
                                <th>Branch</th>
                                <th>Supplier</th>
                                <th className="text-end">Total Amount</th>
                                <th className="text-center">Status</th>
                                <th className="pe-4 text-end" style={{ width: '180px' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan="7" className="text-center py-5">
                                        <div className="spinner-border spinner-border-sm text-primary me-2" role="status"></div>
                                        <span className="text-muted">Fetching registry...</span>
                                    </td>
                                </tr>
                            ) : pos.length === 0 ? (
                                <tr>
                                    <td colSpan="7" className="text-center py-5 text-muted">
                                        <i className="fa-regular fa-folder-open fs-2 mb-2 d-block text-secondary"></i>
                                        No purchase orders found matching standard filter criteria.
                                    </td>
                                </tr>
                            ) : (
                                pos.map(po => (
                                    <tr key={po.id}>
                                        <td className="ps-4 font-monospace fw-bold">{po.po_number}</td>
                                        <td>{po.po_date}</td>
                                        <td>{po.branch_name}</td>
                                        <td>{po.supplier_name}</td>
                                        <td className="text-end fw-bold">₹{po.total_amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                        <td className="text-center">
                                            <span className={`badge px-2.5 py-1.5 rounded-pill font-monospace ${getStatusBadge(po.status)}`} style={{ fontSize: '0.75rem' }}>
                                                {po.status}
                                            </span>
                                        </td>
                                        <td className="pe-4 text-end">
                                            <div className="btn-group">
                                                <button
                                                    className="btn btn-xs btn-outline-dark"
                                                    onClick={() => {
                                                        setSelectedPoId(po.id);
                                                        setViewMode('view');
                                                    }}
                                                    title="View Details"
                                                >
                                                    <i className="fa-solid fa-eye"></i>
                                                </button>
                                                {po.status === 'DRAFT' && hasPermission('purchase.orders.create') && (
                                                    <>
                                                        <button
                                                            className="btn btn-xs btn-outline-primary"
                                                            onClick={() => {
                                                                setSelectedPoId(po.id);
                                                                setViewMode('edit');
                                                            }}
                                                            title="Edit Draft"
                                                        >
                                                            <i className="fa-solid fa-pen-to-square"></i>
                                                        </button>
                                                        <button
                                                            className="btn btn-xs btn-outline-success"
                                                            onClick={() => handleQuickSubmit(po.id)}
                                                            title="Submit for Approval"
                                                        >
                                                            <i className="fa-solid fa-circle-check"></i>
                                                        </button>
                                                    </>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
