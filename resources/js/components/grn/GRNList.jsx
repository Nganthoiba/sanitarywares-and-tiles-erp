import React, { useState, useEffect } from 'react';
import axios from 'axios';
import GRNForm from './GRNForm';

export default function GRNList({ initialViewMode = 'list', onViewModeChange }) {
    const [viewMode, setViewMode] = useState(initialViewMode);
    const [selectedGrnId, setSelectedGrnId] = useState(null);
    const [grns, setGrns] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        setViewMode(initialViewMode);
    }, [initialViewMode]);

    useEffect(() => {
        if (onViewModeChange) {
            onViewModeChange(viewMode);
        }
    }, [viewMode, onViewModeChange]);


    // Filters
    const [filters, setFilters] = useState({
        warehouse_id: '',
        supplier_id: '',
        status: '',
        date_from: '',
        date_to: ''
    });

    // Lists for filters
    const [warehouses, setWarehouses] = useState([]);
    const [suppliers, setSuppliers] = useState([]);

    const fetchGRNs = async () => {
        setLoading(true);
        setError(null);
        try {
            const token = localStorage.getItem('auth_token');
            const res = await axios.get('/api/grn', {
                params: filters,
                headers: { Authorization: `Bearer ${token}` }
            });
            setGrns(res.data.data || []);
        } catch (err) {
            setError('Failed to load Goods Receipt Notes.');
        } finally {
            setLoading(false);
        }
    };

    // Load filter reference metadata
    useEffect(() => {
        const fetchFiltersContext = async () => {
            try {
                const token = localStorage.getItem('auth_token');
                const res = await axios.get('/api/grn/form-data', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setWarehouses(res.data.warehouses || []);
                setSuppliers(res.data.suppliers || []);
            } catch (err) {
                console.error('Failed to load filters dropdown references.');
            }
        };
        fetchFiltersContext();
    }, []);

    useEffect(() => {
        if (viewMode === 'list') {
            fetchGRNs();
        }
    }, [viewMode, filters]);

    const handleFilterChange = (field, value) => {
        setFilters(prev => ({ ...prev, [field]: value }));
    };

    const handleQuickApprove = async (id) => {
        if (!confirm('Are you sure you want to approve this Goods Receipt Note? This will lock the GRN and write entries to the inventory ledger.')) {
            return;
        }

        try {
            const token = localStorage.getItem('auth_token');
            await axios.post(`/api/grn/${id}/approve`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            alert('Goods Receipt Note approved successfully!');
            fetchGRNs();
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to approve Goods Receipt Note.');
        }
    };

    if (viewMode === 'create' || viewMode === 'edit') {
        return (
            <GRNForm
                grnId={selectedGrnId}
                onBack={() => setViewMode('list')}
                onSaveSuccess={() => setViewMode('list')}
            />
        );
    }

    return (
        <div className="animate__animated animate__fadeIn">
            <div className="d-flex align-items-center justify-content-between mb-4">
                <div>
                    <h3 className="fw-bold text-dark">Goods Receipt Notes (GRN)</h3>
                    <p className="text-muted small mb-0">Monitor and create Goods Receipt Notes from suppliers to track inbound material inventory.</p>
                </div>
                <button
                    className="btn btn-primary px-4 shadow-sm"
                    onClick={() => {
                        setSelectedGrnId(null);
                        setViewMode('create');
                    }}
                >
                    <i className="fa-solid fa-plus me-2"></i> Receive New Goods
                </button>
            </div>

            {error && (
                <div className="alert alert-danger d-flex align-items-center" role="alert">
                    <i className="fa-solid fa-circle-exclamation me-2"></i>
                    <div>{error}</div>
                </div>
            )}

            <div className="card border-0 shadow-sm p-4 mb-4" style={{ borderRadius: '12px' }}>
                <h6 className="text-uppercase text-secondary font-monospace fw-bold mb-3" style={{ fontSize: '0.8rem', letterSpacing: '1px' }}>
                    <i className="fa-solid fa-filter me-2 text-primary"></i> Filter Registry
                </h6>
                <div className="row g-3">
                    <div className="col-md-3">
                        <select
                            className="form-select form-select-sm"
                            value={filters.warehouse_id}
                            onChange={(e) => handleFilterChange('warehouse_id', e.target.value)}
                        >
                            <option value="">-- All Warehouses --</option>
                            {warehouses.map(w => (
                                <option key={w.id} value={w.id}>{w.name}</option>
                            ))}
                        </select>
                    </div>
                    <div className="col-md-3">
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
                        <select
                            className="form-select form-select-sm"
                            value={filters.status}
                            onChange={(e) => handleFilterChange('status', e.target.value)}
                        >
                            <option value="">-- All Statuses --</option>
                            <option value="DRAFT">Draft</option>
                            <option value="APPROVED">Approved</option>
                        </select>
                    </div>
                    <div className="col-md-2">
                        <input
                            type="date"
                            className="form-control form-control-sm"
                            value={filters.date_from}
                            onChange={(e) => handleFilterChange('date_from', e.target.value)}
                            placeholder="From date"
                        />
                    </div>
                    <div className="col-md-2">
                        <input
                            type="date"
                            className="form-control form-control-sm"
                            value={filters.date_to}
                            onChange={(e) => handleFilterChange('date_to', e.target.value)}
                            placeholder="To date"
                        />
                    </div>
                </div>
            </div>

            <div className="card border-0 shadow-sm p-4" style={{ borderRadius: '12px' }}>
                {loading ? (
                    <div className="text-center py-5">
                        <div className="spinner-border text-primary" role="status"></div>
                        <span className="ms-2 font-monospace">Scanning ledger records...</span>
                    </div>
                ) : (
                    <div className="table-responsive">
                        <table className="table table-hover align-middle">
                            <thead>
                                <tr className="text-secondary font-monospace" style={{ fontSize: '0.8rem' }}>
                                    <th>GRN Number</th>
                                    <th>Received Date</th>
                                    <th>Supplier</th>
                                    <th>Warehouse</th>
                                    <th>Status</th>
                                    <th className="text-end">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {grns.map((grn) => (
                                    <tr key={grn.id}>
                                        <td className="fw-bold text-dark font-monospace">{grn.grn_number}</td>
                                        <td className="font-monospace text-secondary">{grn.received_date}</td>
                                        <td>{grn.supplier_name || 'Direct Receipt'}</td>
                                        <td>{grn.warehouse_name}</td>
                                        <td>
                                            {grn.status === 'APPROVED' ? (
                                                <span className="badge bg-success-subtle text-success px-2 py-1">
                                                    <i className="fa-solid fa-lock me-1"></i> APPROVED
                                                </span>
                                            ) : (
                                                <span className="badge bg-warning-subtle text-warning px-2 py-1">
                                                    <i className="fa-solid fa-pen-to-square me-1"></i> DRAFT
                                                </span>
                                            )}
                                        </td>
                                        <td className="text-end">
                                            {grn.status === 'DRAFT' ? (
                                                <div className="d-flex justify-content-end gap-1">
                                                    <button
                                                        className="btn btn-xs btn-outline-primary px-2"
                                                        onClick={() => {
                                                            setSelectedGrnId(grn.id);
                                                            setViewMode('edit');
                                                        }}
                                                        style={{ fontSize: '0.75rem' }}
                                                    >
                                                        <i className="fa-solid fa-pen me-1"></i> Edit
                                                    </button>
                                                    <button
                                                        className="btn btn-xs btn-primary px-2"
                                                        onClick={() => handleQuickApprove(grn.id)}
                                                        style={{ fontSize: '0.75rem' }}
                                                    >
                                                        <i className="fa-solid fa-check me-1"></i> Approve
                                                    </button>
                                                </div>
                                            ) : (
                                                <button
                                                    className="btn btn-xs btn-outline-secondary px-2"
                                                    onClick={() => {
                                                        setSelectedGrnId(grn.id);
                                                        setViewMode('edit');
                                                    }}
                                                    style={{ fontSize: '0.75rem' }}
                                                >
                                                    <i className="fa-solid fa-eye me-1"></i> View
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                                {grns.length === 0 && (
                                    <tr>
                                        <td colSpan="6" className="text-center py-5 text-muted font-monospace">
                                            No Goods Receipt Notes registered matching search filters.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
