import React, { useState, useEffect } from 'react';

export default function OrganizationManagement() {
    const [organizations, setOrganizations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('ALL');

    // Detail Modal state
    const [selectedOrg, setSelectedOrg] = useState(null);
    const [loadingDetails, setLoadingDetails] = useState(false);

    // Suspension Modal state
    const [suspendingOrg, setSuspendingOrg] = useState(null);
    const [suspensionReason, setSuspensionReason] = useState('');
    const [suspending, setSuspending] = useState(false);
    const [suspensionError, setSuspensionError] = useState('');

    const token = localStorage.getItem('auth_token');

    const fetchOrganizations = async () => {
        setLoading(true);
        setError('');
        try {
            const res = await fetch('/api/platform/organizations', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json',
                }
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok) {
                throw new Error(data.message || `Failed to load registered organizations (HTTP ${res.status}).`);
            }
            setOrganizations(Array.isArray(data) ? data : []);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchOrganizations();
    }, []);

    const handleOpenSuspendModal = (org) => {
        setError('');
        setSuccessMessage('');
        setSuspensionError('');
        setSuspensionReason('');
        setSuspendingOrg(org);
    };

    const handleConfirmSuspend = async (e) => {
        e.preventDefault();
        if (!suspensionReason.trim()) {
            setSuspensionError('Please enter a reason for suspending this organization.');
            return;
        }

        setSuspending(true);
        setSuspensionError('');
        setError('');

        try {
            const res = await fetch(`/api/platform/organizations/${suspendingOrg.id}/suspend`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json',
                },
                body: JSON.stringify({ reason: suspensionReason }),
            });

            const data = await res.json();
            if (!res.ok) {
                if (data.errors) {
                    const firstErr = Object.values(data.errors).flat()[0];
                    throw new Error(firstErr || data.message || 'Failed to suspend organization.');
                }
                throw new Error(data.message || 'Failed to suspend organization.');
            }

            setSuccessMessage(data.message || `Organization '${suspendingOrg.name}' suspended successfully.`);
            setSuspendingOrg(null);
            setSuspensionReason('');
            await fetchOrganizations();
        } catch (err) {
            setSuspensionError(err.message);
        } finally {
            setSuspending(false);
        }
    };

    const handleActivateOrg = async (org) => {
        setError('');
        setSuccessMessage('');

        try {
            const res = await fetch(`/api/platform/organizations/${org.id}/activate`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json',
                }
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.message || 'Failed to activate organization.');

            setSuccessMessage(data.message || `Organization '${org.name}' activated successfully.`);
            await fetchOrganizations();
        } catch (err) {
            setError(err.message);
        }
    };

    const handleViewDetails = async (id) => {
        setLoadingDetails(true);
        setSelectedOrg(null);
        try {
            const res = await fetch(`/api/platform/organizations/${id}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json',
                }
            });
            if (res.ok) {
                const data = await res.json();
                setSelectedOrg(data);
            }
        } catch (err) {
            console.error("Failed to load details:", err);
        } finally {
            setLoadingDetails(false);
        }
    };

    const filteredOrgs = organizations.filter(org => {
        const matchesSearch = 
            org.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            org.code?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            org.email?.toLowerCase().includes(searchQuery.toLowerCase());
        
        const matchesStatus = 
            statusFilter === 'ALL' ? true :
            statusFilter === 'ACTIVE' ? org.is_active :
            !org.is_active;

        return matchesSearch && matchesStatus;
    });

    const activeCount = organizations.filter(o => o.is_active).length;
    const suspendedCount = organizations.filter(o => !o.is_active).length;
    const totalUsersCount = organizations.reduce((acc, o) => acc + (o.users_count || 0), 0);

    return (
        <div className="container-fluid py-2">
            {/* Header */}
            <div className="d-flex align-items-center justify-content-between pb-3 mb-4 border-bottom">
                <div>
                    <h4 className="fw-bold text-dark mb-1">
                        <i className="fa-solid fa-sitemap text-primary me-2"></i> Tenant Organizations
                    </h4>
                    <p className="text-muted mb-0 small">
                        Inspect, monitor, suspend, and activate tenant organizations registered on the ERP platform.
                    </p>
                </div>
            </div>

            {/* Alert Messages */}
            {error && (
                <div className="alert alert-danger alert-dismissible fade show shadow-sm" role="alert">
                    <i className="fa-solid fa-triangle-exclamation me-2"></i>
                    <strong>Error:</strong> {error}
                    <button type="button" className="btn-close" onClick={() => setError('')}></button>
                </div>
            )}

            {successMessage && (
                <div className="alert alert-success alert-dismissible fade show shadow-sm" role="alert">
                    <i className="fa-solid fa-circle-check me-2"></i>
                    {successMessage}
                    <button type="button" className="btn-close" onClick={() => setSuccessMessage('')}></button>
                </div>
            )}

            {/* Metrics Overview */}
            <div className="row g-3 mb-4">
                <div className="col-12 col-sm-6 col-md-3">
                    <div className="card border-0 shadow-sm p-3">
                        <div className="d-flex align-items-center justify-content-between">
                            <div>
                                <span className="text-muted small fw-semibold text-uppercase">Total Organizations</span>
                                <h3 className="fw-bold text-dark mb-0 mt-1">{organizations.length}</h3>
                            </div>
                            <div className="rounded-circle bg-primary-subtle text-primary p-3 d-flex align-items-center justify-content-center" style={{ width: '48px', height: '48px' }}>
                                <i className="fa-solid fa-building fs-5"></i>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="col-12 col-sm-6 col-md-3">
                    <div className="card border-0 shadow-sm p-3">
                        <div className="d-flex align-items-center justify-content-between">
                            <div>
                                <span className="text-muted small fw-semibold text-uppercase">Active Tenants</span>
                                <h3 className="fw-bold text-success mb-0 mt-1">{activeCount}</h3>
                            </div>
                            <div className="rounded-circle bg-success-subtle text-success p-3 d-flex align-items-center justify-content-center" style={{ width: '48px', height: '48px' }}>
                                <i className="fa-solid fa-circle-check fs-5"></i>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="col-12 col-sm-6 col-md-3">
                    <div className="card border-0 shadow-sm p-3">
                        <div className="d-flex align-items-center justify-content-between">
                            <div>
                                <span className="text-muted small fw-semibold text-uppercase">Suspended</span>
                                <h3 className="fw-bold text-danger mb-0 mt-1">{suspendedCount}</h3>
                            </div>
                            <div className="rounded-circle bg-danger-subtle text-danger p-3 d-flex align-items-center justify-content-center" style={{ width: '48px', height: '48px' }}>
                                <i className="fa-solid fa-ban fs-5"></i>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="col-12 col-sm-6 col-md-3">
                    <div className="card border-0 shadow-sm p-3">
                        <div className="d-flex align-items-center justify-content-between">
                            <div>
                                <span className="text-muted small fw-semibold text-uppercase">Total Users</span>
                                <h3 className="fw-bold text-info mb-0 mt-1">{totalUsersCount}</h3>
                            </div>
                            <div className="rounded-circle bg-info-subtle text-info p-3 d-flex align-items-center justify-content-center" style={{ width: '48px', height: '48px' }}>
                                <i className="fa-solid fa-users fs-5"></i>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Filter & Search Toolbar */}
            <div className="card shadow-sm border-0 mb-4">
                <div className="card-body p-3">
                    <div className="row g-3 align-items-center justify-content-between">
                        <div className="col-12 col-md-6">
                            <div className="input-group">
                                <span className="input-group-text bg-white text-muted">
                                    <i className="fa-solid fa-magnifying-glass"></i>
                                </span>
                                <input 
                                    type="text" 
                                    className="form-control border-start-0" 
                                    placeholder="Search organizations by name, code, or email..." 
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="col-12 col-md-4 d-flex justify-content-md-end gap-2">
                            <div className="btn-group btn-group-sm" role="group">
                                <button 
                                    className={`btn ${statusFilter === 'ALL' ? 'btn-primary' : 'btn-outline-secondary'}`}
                                    onClick={() => setStatusFilter('ALL')}
                                >
                                    All ({organizations.length})
                                </button>
                                <button 
                                    className={`btn ${statusFilter === 'ACTIVE' ? 'btn-success' : 'btn-outline-secondary'}`}
                                    onClick={() => setStatusFilter('ACTIVE')}
                                >
                                    Active ({activeCount})
                                </button>
                                <button 
                                    className={`btn ${statusFilter === 'SUSPENDED' ? 'btn-danger' : 'btn-outline-secondary'}`}
                                    onClick={() => setStatusFilter('SUSPENDED')}
                                >
                                    Suspended ({suspendedCount})
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Table */}
            <div className="card shadow-sm border-0">
                <div className="card-body p-0">
                    {loading ? (
                        <div className="text-center py-5">
                            <div className="spinner-border text-primary spinner-border-sm me-2" role="status"></div>
                            <span className="text-muted small">Loading tenant organizations...</span>
                        </div>
                    ) : filteredOrgs.length === 0 ? (
                        <div className="text-center py-5 text-muted">
                            <i className="fa-solid fa-building-circle-exclamation fs-3 mb-2 opacity-50 d-block"></i>
                            No organizations found.
                        </div>
                    ) : (
                        <div className="table-responsive">
                            <table className="table table-hover align-middle mb-0">
                                <thead className="bg-light text-muted text-uppercase font-monospace small">
                                    <tr>
                                        <th className="ps-4">Organization</th>
                                        <th>Code</th>
                                        <th>Users</th>
                                        <th>Status</th>
                                        <th>Created Date</th>
                                        <th className="text-end pe-4">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredOrgs.map(org => (
                                        <tr key={org.id}>
                                            <td className="ps-4">
                                                <div className="d-flex align-items-center">
                                                    <div className="rounded-circle bg-light border d-flex align-items-center justify-content-center me-3 fw-bold font-monospace text-primary" style={{ width: '38px', height: '38px', fontSize: '0.85rem' }}>
                                                        {org.name ? org.name.substring(0, 2).toUpperCase() : 'OR'}
                                                    </div>
                                                    <div>
                                                        <div className="fw-bold text-dark">{org.name}</div>
                                                        {org.email && <span className="text-muted small d-block" style={{ fontSize: '0.78rem' }}>{org.email}</span>}
                                                    </div>
                                                </div>
                                            </td>

                                            <td>
                                                <span className="badge bg-light text-dark font-monospace border">
                                                    {org.code || 'N/A'}
                                                </span>
                                            </td>

                                            <td>
                                                <span className="badge bg-info-subtle text-info border border-info-subtle font-monospace">
                                                    <i className="fa-solid fa-users me-1"></i> {org.users_count || 0}
                                                </span>
                                            </td>

                                            <td>
                                                {org.is_active ? (
                                                    <span className="badge bg-success-subtle text-success border border-success-subtle rounded-pill">
                                                        <i className="fa-solid fa-circle-check me-1"></i> Active
                                                    </span>
                                                ) : (
                                                    <div>
                                                        <span className="badge bg-danger-subtle text-danger border border-danger-subtle rounded-pill">
                                                            <i className="fa-solid fa-ban me-1"></i> Suspended
                                                        </span>
                                                        {org.suspension_reason && (
                                                            <div className="text-muted small mt-1 font-monospace" style={{ fontSize: '0.74rem' }}>
                                                                <i className="fa-solid fa-circle-info me-1 text-danger"></i>
                                                                Reason: {org.suspension_reason}
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </td>

                                            <td className="text-muted small font-monospace">
                                                {org.created_at ? new Date(org.created_at).toLocaleDateString() : 'N/A'}
                                            </td>

                                            <td className="text-end pe-4">
                                                <div className="d-flex justify-content-end gap-2">
                                                    <button 
                                                        className="btn btn-xs btn-outline-secondary py-1 px-2"
                                                        onClick={() => handleViewDetails(org.id)}
                                                    >
                                                        <i className="fa-solid fa-eye me-1"></i> Details
                                                    </button>
                                                    {org.is_active ? (
                                                        <button 
                                                            className="btn btn-xs btn-outline-danger py-1 px-2"
                                                            onClick={() => handleOpenSuspendModal(org)}
                                                            title="Suspend Organization Access"
                                                        >
                                                            <i className="fa-solid fa-ban me-1"></i> Suspend
                                                        </button>
                                                    ) : (
                                                        <button 
                                                            className="btn btn-xs btn-outline-success py-1 px-2"
                                                            onClick={() => handleActivateOrg(org)}
                                                            title="Re-activate Organization Access"
                                                        >
                                                            <i className="fa-solid fa-check me-1"></i> Activate
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>

            {/* View Details Modal */}
            {(selectedOrg || loadingDetails) && (
                <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1050 }}>
                    <div className="modal-dialog modal-dialog-centered modal-lg">
                        <div className="modal-content shadow-lg border-0">
                            <div className="modal-header border-bottom">
                                <h5 className="modal-title fw-bold text-dark">
                                    <i className="fa-solid fa-circle-info text-primary me-2"></i> Organization Profile Details
                                </h5>
                                <button type="button" className="btn-close" onClick={() => setSelectedOrg(null)}></button>
                            </div>
                            <div className="modal-body p-4">
                                {loadingDetails ? (
                                    <div className="text-center py-4">
                                        <div className="spinner-border text-primary spinner-border-sm me-2"></div>
                                        <span className="text-muted small">Fetching organization data...</span>
                                    </div>
                                ) : selectedOrg && (
                                    <div>
                                        <div className="row g-3 mb-4 pb-3 border-bottom">
                                            <div className="col-md-6">
                                                <span className="text-muted small d-block">Organization Name</span>
                                                <strong className="fs-6 text-dark">{selectedOrg.name}</strong>
                                            </div>
                                            <div className="col-md-3">
                                                <span className="text-muted small d-block">Code</span>
                                                <span className="badge bg-light text-dark border font-monospace">{selectedOrg.code || 'N/A'}</span>
                                            </div>
                                            <div className="col-md-3">
                                                <span className="text-muted small d-block">Status</span>
                                                {selectedOrg.is_active ? (
                                                    <span className="badge bg-success-subtle text-success border border-success-subtle">Active</span>
                                                ) : (
                                                    <span className="badge bg-danger-subtle text-danger border border-danger-subtle">Suspended</span>
                                                )}
                                            </div>
                                        </div>

                                        {!selectedOrg.is_active && selectedOrg.suspension_reason && (
                                            <div className="alert alert-danger border-0 rounded-3 shadow-xs mb-4 p-3">
                                                <div className="fw-bold mb-1 text-danger">
                                                    <i className="fa-solid fa-circle-exclamation me-1.5"></i> Organization Suspended
                                                </div>
                                                <div className="small text-dark">
                                                    <strong>Reason for Suspension:</strong> {selectedOrg.suspension_reason}
                                                </div>
                                            </div>
                                        )}

                                        <h6 className="fw-bold text-secondary mb-3 small text-uppercase font-monospace">Registered Staff & Admins ({selectedOrg.users?.length || 0})</h6>
                                        {selectedOrg.users && selectedOrg.users.length > 0 ? (
                                            <div className="table-responsive mb-3">
                                                <table className="table table-sm table-bordered align-middle">
                                                    <thead className="bg-light text-muted small">
                                                        <tr>
                                                            <th>Name</th>
                                                            <th>Email</th>
                                                            <th>Assigned Roles</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {selectedOrg.users.map(u => (
                                                            <tr key={u.id}>
                                                                <td className="fw-semibold small">{u.name}</td>
                                                                <td className="small font-monospace">{u.email}</td>
                                                                <td>
                                                                    {u.roles && u.roles.length > 0 ? u.roles.map(r => (
                                                                        <span key={r.id} className="badge bg-primary-subtle text-primary me-1">{r.name}</span>
                                                                    )) : <span className="text-muted small">No Role</span>}
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        ) : (
                                            <p className="text-muted small">No users found.</p>
                                        )}

                                        <div className="row g-3">
                                            <div className="col-md-6">
                                                <h6 className="fw-bold text-secondary mb-2 small text-uppercase font-monospace">Branches ({selectedOrg.branches?.length || 0})</h6>
                                                <ul className="list-group list-group-flush small border rounded">
                                                    {selectedOrg.branches && selectedOrg.branches.length > 0 ? selectedOrg.branches.map(b => (
                                                        <li key={b.id} className="list-group-item d-flex justify-content-between align-items-center">
                                                            <span>{b.name}</span>
                                                            <span className="badge bg-light text-muted border">{b.code || 'Main'}</span>
                                                        </li>
                                                    )) : <li className="list-group-item text-muted">No branches configured.</li>}
                                                </ul>
                                            </div>
                                            <div className="col-md-6">
                                                <h6 className="fw-bold text-secondary mb-2 small text-uppercase font-monospace">Warehouses ({selectedOrg.warehouses?.length || 0})</h6>
                                                <ul className="list-group list-group-flush small border rounded">
                                                    {selectedOrg.warehouses && selectedOrg.warehouses.length > 0 ? selectedOrg.warehouses.map(w => (
                                                        <li key={w.id} className="list-group-item d-flex justify-content-between align-items-center">
                                                            <span>{w.name}</span>
                                                            <span className="badge bg-light text-muted border">{w.code || 'WH'}</span>
                                                        </li>
                                                    )) : <li className="list-group-item text-muted">No warehouses configured.</li>}
                                                </ul>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                            <div className="modal-footer border-top bg-light">
                                <button type="button" className="btn btn-secondary" onClick={() => setSelectedOrg(null)}>Close</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Suspend Organization Reason Modal */}
            {suspendingOrg && (
                <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1050 }}>
                    <div className="modal-dialog modal-dialog-centered">
                        <div className="modal-content shadow-lg border-0">
                            <div className="modal-header border-bottom bg-danger text-white">
                                <h5 className="modal-title fw-bold">
                                    <i className="fa-solid fa-triangle-exclamation me-2"></i>
                                    Suspend Organization Access
                                </h5>
                                <button type="button" className="btn-close btn-close-white" onClick={() => setSuspendingOrg(null)}></button>
                            </div>
                            <form onSubmit={handleConfirmSuspend}>
                                <div className="modal-body p-4">
                                    {suspensionError && (
                                        <div className="alert alert-danger alert-dismissible fade show shadow-sm rounded-3 mb-3" role="alert">
                                            <i className="fa-solid fa-circle-exclamation me-2"></i>
                                            {suspensionError}
                                            <button type="button" className="btn-close" onClick={() => setSuspensionError('')}></button>
                                        </div>
                                    )}
                                    <p className="text-dark mb-3">
                                        You are about to suspend tenant access for <strong>{suspendingOrg.name}</strong>. All users belonging to this organization will be blocked from signing in.
                                    </p>
                                    <div className="mb-3">
                                        <label className="form-label small fw-semibold text-dark">Reason for Suspension *</label>
                                        <textarea 
                                            className="form-control" 
                                            rows="3"
                                            placeholder="Enter official reason for suspension (e.g. Account payment overdue, terms violation, compliance audit)..." 
                                            value={suspensionReason}
                                            onChange={(e) => setSuspensionReason(e.target.value)}
                                            required 
                                        />
                                        <div className="form-text small text-muted mt-1">
                                            This reason will be displayed to users of this organization when they attempt to log in.
                                        </div>
                                    </div>
                                </div>
                                <div className="modal-footer border-top bg-light">
                                    <button type="button" className="btn btn-secondary" onClick={() => setSuspendingOrg(null)}>Cancel</button>
                                    <button type="submit" className="btn btn-danger px-4 shadow-sm fw-semibold" disabled={suspending}>
                                        {suspending ? (
                                            <>
                                                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                                Suspending...
                                            </>
                                        ) : (
                                            <>
                                                <i className="fa-solid fa-ban me-1.5"></i> Suspend Organization
                                            </>
                                        )}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
