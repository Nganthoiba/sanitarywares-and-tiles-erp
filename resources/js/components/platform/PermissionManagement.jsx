import React, { useState, useEffect } from 'react';

export default function PermissionManagement() {
    const [groups, setGroups] = useState([]);
    const [permissions, setPermissions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');

    // Filters
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedGroupFilter, setSelectedGroupFilter] = useState('ALL');
    const [statusFilter, setStatusFilter] = useState('ALL');

    // Group Modal State
    const [showGroupModal, setShowGroupModal] = useState(false);
    const [editingGroup, setEditingGroup] = useState(null);
    const [groupForm, setGroupForm] = useState({ name: '' });
    const [savingGroup, setSavingGroup] = useState(false);

    // Permission Modal State
    const [showPermissionModal, setShowPermissionModal] = useState(false);
    const [editingPermission, setEditingPermission] = useState(null);
    const [permissionForm, setPermissionForm] = useState({
        permission_group_id: '',
        name: '',
        display_name: '',
        description: '',
    });
    const [savingPermission, setSavingPermission] = useState(false);

    // Delete Confirmation State
    const [deletingItem, setDeletingItem] = useState(null); // { type: 'GROUP'|'PERMISSION', id, name }
    const [deleting, setDeleting] = useState(false);

    const token = localStorage.getItem('auth_token');

    const fetchData = async () => {
        setLoading(true);
        setError('');
        try {
            const res = await fetch('/api/platform/permissions', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json',
                }
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok) {
                throw new Error(data.message || `Failed to load permissions (HTTP ${res.status}).`);
            }
            setGroups(data.groups || []);
            setPermissions(data.permissions || []);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    // --- Permission Group Handlers ---
    const handleOpenGroupModal = (group = null) => {
        setError('');
        setEditingGroup(group);
        setGroupForm({ name: group ? group.name : '' });
        setShowGroupModal(true);
    };

    const handleSaveGroup = async (e) => {
        e.preventDefault();
        setSavingGroup(true);
        setError('');
        setSuccessMessage('');

        const isEdit = !!editingGroup;
        const url = isEdit ? `/api/platform/permission-groups/${editingGroup.id}` : '/api/platform/permission-groups';
        const method = isEdit ? 'PUT' : 'POST';

        try {
            const res = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json',
                },
                body: JSON.stringify(groupForm),
            });
            const data = await res.json();
            if (!res.ok) {
                if (data.errors) {
                    const firstErr = Object.values(data.errors).flat()[0];
                    throw new Error(firstErr || data.message || 'Failed to save group.');
                }
                throw new Error(data.message || 'Failed to save group.');
            }

            setSuccessMessage(data.message || 'Permission group saved successfully.');
            setShowGroupModal(false);
            await fetchData();
            window.dispatchEvent(new CustomEvent('role-permissions-updated'));
            window.dispatchEvent(new CustomEvent('navigation-refresh'));
        } catch (err) {
            setError(err.message);
        } finally {
            setSavingGroup(false);
        }
    };

    // --- Permission Handlers ---
    const handleOpenPermissionModal = (perm = null, defaultGroupId = null) => {
        setError('');
        setEditingPermission(perm);
        setPermissionForm({
            permission_group_id: perm ? perm.permission_group_id : (defaultGroupId || groups[0]?.id || ''),
            name: perm ? perm.slug : '',
            display_name: perm ? (perm.display_name || perm.slug) : '',
            description: perm ? (perm.description || '') : '',
        });
        setShowPermissionModal(true);
    };

    const handleSavePermission = async (e) => {
        e.preventDefault();
        setSavingPermission(true);
        setError('');
        setSuccessMessage('');

        const isEdit = !!editingPermission;
        const url = isEdit ? `/api/platform/permissions/${editingPermission.id}` : '/api/platform/permissions';
        const method = isEdit ? 'PUT' : 'POST';

        try {
            const res = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json',
                },
                body: JSON.stringify(permissionForm),
            });
            const data = await res.json();
            if (!res.ok) {
                if (data.errors) {
                    const firstErr = Object.values(data.errors).flat()[0];
                    throw new Error(firstErr || data.message || 'Failed to save permission.');
                }
                throw new Error(data.message || 'Failed to save permission.');
            }

            setSuccessMessage(data.message || 'Permission saved successfully.');
            setShowPermissionModal(false);
            await fetchData();
            window.dispatchEvent(new CustomEvent('role-permissions-updated'));
            window.dispatchEvent(new CustomEvent('navigation-refresh'));
        } catch (err) {
            setError(err.message);
        } finally {
            setSavingPermission(false);
        }
    };

    const handleTogglePermission = async (perm) => {
        setError('');
        setSuccessMessage('');
        try {
            const res = await fetch(`/api/platform/permissions/${perm.id}/toggle`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json',
                }
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || 'Failed to toggle permission.');

            setSuccessMessage(data.message);
            await fetchData();
            window.dispatchEvent(new CustomEvent('role-permissions-updated'));
            window.dispatchEvent(new CustomEvent('navigation-refresh'));
        } catch (err) {
            setError(err.message);
        }
    };

    // --- Delete Action Handler ---
    const handleDeleteConfirm = async () => {
        if (!deletingItem) return;
        setDeleting(true);
        setError('');
        setSuccessMessage('');

        const isGroup = deletingItem.type === 'GROUP';
        const url = isGroup ? `/api/platform/permission-groups/${deletingItem.id}` : `/api/platform/permissions/${deletingItem.id}`;

        try {
            const res = await fetch(url, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json',
                }
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || `Failed to delete ${isGroup ? 'group' : 'permission'}.`);

            setSuccessMessage(data.message);
            setDeletingItem(null);
            await fetchData();
            window.dispatchEvent(new CustomEvent('role-permissions-updated'));
            window.dispatchEvent(new CustomEvent('navigation-refresh'));
        } catch (err) {
            setError(err.message);
        } finally {
            setDeleting(false);
        }
    };

    // --- Filter & Group Computations ---
    const filteredPermissions = permissions.filter(p => {
        const matchesGroup = selectedGroupFilter === 'ALL' || String(p.permission_group_id) === String(selectedGroupFilter);
        const matchesStatus = statusFilter === 'ALL' ? true : statusFilter === 'ENABLED' ? p.enabled : !p.enabled;
        
        const q = searchQuery.toLowerCase().trim();
        const matchesSearch = !q || (
            (p.slug && p.slug.toLowerCase().includes(q)) ||
            (p.display_name && p.display_name.toLowerCase().includes(q)) ||
            (p.description && p.description.toLowerCase().includes(q)) ||
            (p.group?.name && p.group.name.toLowerCase().includes(q))
        );

        return matchesGroup && matchesStatus && matchesSearch;
    });

    const enabledCount = permissions.filter(p => p.enabled).length;
    const disabledCount = permissions.filter(p => !p.enabled).length;

    // Grouping permissions by Permission Group for rowSpan rendering
    const visibleGroups = groups.filter(g => {
        if (selectedGroupFilter !== 'ALL' && String(g.id) !== String(selectedGroupFilter)) {
            return false;
        }
        return true;
    });

    const groupedData = visibleGroups.map(grp => {
        const groupPerms = filteredPermissions.filter(p => p.permission_group_id === grp.id);
        return {
            group: grp,
            permissions: groupPerms
        };
    }).filter(item => {
        const isFiltering = searchQuery.trim().length > 0 || statusFilter !== 'ALL';
        if (isFiltering) {
            return item.permissions.length > 0;
        }
        return true;
    });

    // Unassigned permissions group
    const unassignedPerms = filteredPermissions.filter(p => !p.permission_group_id || !groups.some(g => g.id === p.permission_group_id));
    if (unassignedPerms.length > 0 && (selectedGroupFilter === 'ALL' || selectedGroupFilter === 'UNASSIGNED')) {
        groupedData.push({
            group: { id: 'UNASSIGNED', name: 'Other / Unassigned' },
            permissions: unassignedPerms
        });
    }

    return (
        <div className="container-fluid py-2">
            {/* Header */}
            <div className="d-flex flex-column flex-md-row align-items-md-center justify-content-between pb-3 mb-4 border-bottom gap-3">
                <div>
                    <h4 className="fw-bold text-dark mb-1 d-flex align-items-center gap-2">
                        <span className="rounded-3 bg-primary-subtle text-primary p-2 d-inline-flex align-items-center justify-content-center" style={{ width: '38px', height: '38px' }}>
                            <i className="fa-solid fa-key fs-5"></i>
                        </span>
                        Permission & Group Management
                    </h4>
                    <p className="text-muted mb-0 small ps-1">
                        Manage global authorization permissions and logical permission categories across the ERP system.
                    </p>
                </div>
                <div className="d-flex gap-2">
                    <button 
                        className="btn btn-outline-primary btn-sm rounded-2 shadow-xs fw-semibold px-3 d-flex align-items-center gap-1.5"
                        onClick={() => handleOpenGroupModal()}
                    >
                        <i className="fa-solid fa-folder-plus text-primary"></i>
                        <span>New Group</span>
                    </button>
                    <button 
                        className="btn btn-primary btn-sm rounded-2 shadow-xs fw-semibold px-3 d-flex align-items-center gap-1.5"
                        onClick={() => handleOpenPermissionModal()}
                    >
                        <i className="fa-solid fa-plus"></i>
                        <span>New Permission</span>
                    </button>
                </div>
            </div>

            {/* Alert Messages */}
            {error && (
                <div className="alert alert-danger alert-dismissible fade show shadow-sm rounded-3" role="alert">
                    <i className="fa-solid fa-triangle-exclamation me-2"></i>
                    <strong>Error:</strong> {error}
                    <button type="button" className="btn-close" onClick={() => setError('')}></button>
                </div>
            )}

            {successMessage && (
                <div className="alert alert-success alert-dismissible fade show shadow-sm rounded-3" role="alert">
                    <i className="fa-solid fa-circle-check me-2"></i>
                    {successMessage}
                    <button type="button" className="btn-close" onClick={() => setSuccessMessage('')}></button>
                </div>
            )}

            {/* Metrics Overview */}
            <div className="row g-3 mb-4">
                <div className="col-12 col-sm-6 col-md-3">
                    <div className="card border-0 shadow-xs rounded-3 p-3 bg-white h-100">
                        <div className="d-flex align-items-center justify-content-between">
                            <div>
                                <span className="text-muted small fw-semibold text-uppercase" style={{ fontSize: '0.72rem', letterSpacing: '0.5px' }}>
                                    Permission Groups
                                </span>
                                <h3 className="fw-bold text-dark mb-0 mt-1">{groups.length}</h3>
                            </div>
                            <div className="rounded-3 bg-primary-subtle text-primary p-3 d-flex align-items-center justify-content-center" style={{ width: '46px', height: '46px' }}>
                                <i className="fa-solid fa-folder-tree fs-5"></i>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="col-12 col-sm-6 col-md-3">
                    <div className="card border-0 shadow-xs rounded-3 p-3 bg-white h-100">
                        <div className="d-flex align-items-center justify-content-between">
                            <div>
                                <span className="text-muted small fw-semibold text-uppercase" style={{ fontSize: '0.72rem', letterSpacing: '0.5px' }}>
                                    Total Permissions
                                </span>
                                <h3 className="fw-bold text-dark mb-0 mt-1">{permissions.length}</h3>
                            </div>
                            <div className="rounded-3 bg-info-subtle text-info p-3 d-flex align-items-center justify-content-center" style={{ width: '46px', height: '46px' }}>
                                <i className="fa-solid fa-shield-halved fs-5"></i>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="col-12 col-sm-6 col-md-3">
                    <div className="card border-0 shadow-xs rounded-3 p-3 bg-white h-100">
                        <div className="d-flex align-items-center justify-content-between">
                            <div>
                                <span className="text-muted small fw-semibold text-uppercase" style={{ fontSize: '0.72rem', letterSpacing: '0.5px' }}>
                                    Active Permissions
                                </span>
                                <h3 className="fw-bold text-success mb-0 mt-1">{enabledCount}</h3>
                            </div>
                            <div className="rounded-3 bg-success-subtle text-success p-3 d-flex align-items-center justify-content-center" style={{ width: '46px', height: '46px' }}>
                                <i className="fa-solid fa-check-circle fs-5"></i>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="col-12 col-sm-6 col-md-3">
                    <div className="card border-0 shadow-xs rounded-3 p-3 bg-white h-100">
                        <div className="d-flex align-items-center justify-content-between">
                            <div>
                                <span className="text-muted small fw-semibold text-uppercase" style={{ fontSize: '0.72rem', letterSpacing: '0.5px' }}>
                                    Inactive Permissions
                                </span>
                                <h3 className="fw-bold text-secondary mb-0 mt-1">{disabledCount}</h3>
                            </div>
                            <div className="rounded-3 bg-secondary-subtle text-secondary p-3 d-flex align-items-center justify-content-center" style={{ width: '46px', height: '46px' }}>
                                <i className="fa-solid fa-ban fs-5"></i>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Filter Toolbar */}
            <div className="card shadow-xs border-0 rounded-3 mb-4 bg-white">
                <div className="card-body p-3">
                    <div className="row g-3 align-items-center justify-content-between">
                        <div className="col-12 col-md-5">
                            <div className="input-group input-group-sm">
                                <span className="input-group-text bg-light border-end-0 text-muted ps-3">
                                    <i className="fa-solid fa-magnifying-glass"></i>
                                </span>
                                <input 
                                    type="text" 
                                    className="form-control form-control-sm bg-light border-start-0" 
                                    placeholder="Search by key, display name, description, or group..." 
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="col-12 col-md-4">
                            <select 
                                className="form-select form-select-sm bg-light"
                                value={selectedGroupFilter}
                                onChange={(e) => setSelectedGroupFilter(e.target.value)}
                            >
                                <option value="ALL">All Permission Groups ({groups.length})</option>
                                {groups.map(g => (
                                    <option key={g.id} value={g.id}>{g.name}</option>
                                ))}
                            </select>
                        </div>

                        <div className="col-12 col-md-3 d-flex justify-content-md-end">
                            <div className="btn-group btn-group-sm w-100" role="group">
                                <button 
                                    className={`btn ${statusFilter === 'ALL' ? 'btn-primary' : 'btn-light text-secondary'}`}
                                    onClick={() => setStatusFilter('ALL')}
                                >
                                    All
                                </button>
                                <button 
                                    className={`btn ${statusFilter === 'ENABLED' ? 'btn-success' : 'btn-light text-secondary'}`}
                                    onClick={() => setStatusFilter('ENABLED')}
                                >
                                    Active ({enabledCount})
                                </button>
                                <button 
                                    className={`btn ${statusFilter === 'DISABLED' ? 'btn-secondary' : 'btn-light text-secondary'}`}
                                    onClick={() => setStatusFilter('DISABLED')}
                                >
                                    Inactive ({disabledCount})
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Grouped Permission Cards */}
            {loading ? (
                <div className="card shadow-xs border-0 rounded-3 mb-4 p-5 text-center bg-white">
                    <div className="spinner-border text-primary spinner-border-sm me-2" role="status"></div>
                    <span className="text-muted small">Loading system permissions...</span>
                </div>
            ) : groupedData.length === 0 ? (
                <div className="card shadow-xs border-0 rounded-3 mb-4 p-5 text-center text-muted bg-white">
                    <i className="fa-solid fa-key-skeleton fs-3 mb-2 opacity-50 d-block"></i>
                    No matching permissions found.
                </div>
            ) : (
                <div className="d-flex flex-column gap-4 mb-4">
                    {groupedData.map(({ group, permissions: groupPerms }) => (
                        <div key={group.id} className="card shadow-xs border-0 rounded-3 overflow-hidden bg-white">
                            {/* Card Header */}
                            <div className="card-header bg-white py-3 px-4 d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-2 border-bottom border-light">
                                <div className="d-flex align-items-center gap-3">
                                    <div className="rounded-3 bg-primary-subtle text-primary p-2 d-flex align-items-center justify-content-center" style={{ width: '38px', height: '38px' }}>
                                        <i className="fa-solid fa-folder fs-5"></i>
                                    </div>
                                    <div>
                                        <div className="d-flex align-items-center gap-2">
                                            <h6 className="fw-bold text-dark mb-0 fs-6">
                                                {group.name}
                                            </h6>
                                            <span className="badge bg-primary-subtle text-primary font-monospace rounded-pill px-2.5 py-1 small">
                                                {groupPerms.length} {groupPerms.length === 1 ? 'permission' : 'permissions'}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {group.id !== 'UNASSIGNED' && (
                                    <div className="d-flex align-items-center gap-2">
                                        <button 
                                            className="btn btn-sm btn-outline-primary rounded-2 shadow-xs fw-semibold px-3"
                                            onClick={() => handleOpenPermissionModal(null, group.id)}
                                            title="Add Permission to this Group"
                                        >
                                            <i className="fa-solid fa-plus me-1.5"></i> Add Permission
                                        </button>
                                        <button 
                                            className="btn btn-sm btn-light text-secondary border-0 rounded-2 px-2.5 fw-semibold"
                                            onClick={() => handleOpenGroupModal(group)}
                                            title="Edit Group Name"
                                        >
                                            <i className="fa-solid fa-pen-to-square me-1"></i> Edit Group
                                        </button>
                                        <button 
                                            className="btn btn-sm btn-light text-danger border-0 rounded-2 px-2.5 fw-semibold"
                                            onClick={() => setDeletingItem({ type: 'GROUP', id: group.id, name: group.name })}
                                            title="Delete Group"
                                        >
                                            <i className="fa-solid fa-trash-can me-1"></i> Delete
                                        </button>
                                    </div>
                                )}
                            </div>

                            {/* Card Body with Table inside */}
                            <div className="card-body p-0">
                                {groupPerms.length === 0 ? (
                                    <div className="p-4 text-center text-muted bg-light-subtle">
                                        <span className="opacity-75">No permissions assigned to this group yet.</span>
                                        <button 
                                            className="btn btn-link btn-sm text-primary ms-2 p-0 text-decoration-none font-monospace fw-semibold"
                                            onClick={() => handleOpenPermissionModal(null, group.id)}
                                        >
                                            <i className="fa-solid fa-plus me-1"></i> Add first permission
                                        </button>
                                    </div>
                                ) : (
                                    <div className="table-responsive">
                                        <table className="table table-hover align-middle mb-0">
                                            <thead className="bg-light-subtle text-muted text-uppercase font-monospace" style={{ fontSize: '0.72rem', letterSpacing: '0.5px' }}>
                                                <tr>
                                                    <th className="ps-4 py-3" style={{ width: '280px' }}>Permission Key / Slug</th>
                                                    <th className="py-3">Display Name & Description</th>
                                                    <th className="py-3" style={{ width: '130px' }}>Status</th>
                                                    <th className="text-end pe-4 py-3" style={{ width: '240px' }}>Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {groupPerms.map(perm => (
                                                    <tr key={perm.id}>
                                                        <td className="ps-4 py-3">
                                                            <span className="font-monospace fw-semibold text-primary bg-primary-subtle px-2.5 py-1 rounded small" style={{ fontSize: '0.82rem' }}>
                                                                {perm.slug}
                                                            </span>
                                                        </td>

                                                        <td className="py-3">
                                                            <div className="fw-semibold text-dark mb-0.5">
                                                                {perm.display_name || perm.slug}
                                                            </div>
                                                            {perm.description && (
                                                                <div className="text-muted small" style={{ fontSize: '0.82rem' }}>
                                                                    {perm.description}
                                                                </div>
                                                            )}
                                                        </td>

                                                        <td className="py-3">
                                                            {perm.enabled ? (
                                                                <span className="badge bg-success-subtle text-success-emphasis border border-success-subtle rounded-pill px-2.5 py-1 small">
                                                                    <i className="fa-solid fa-circle-check me-1"></i> Active
                                                                </span>
                                                            ) : (
                                                                <span className="badge bg-secondary-subtle text-secondary-emphasis border border-secondary-subtle rounded-pill px-2.5 py-1 small">
                                                                    <i className="fa-solid fa-ban me-1"></i> Inactive
                                                                </span>
                                                            )}
                                                        </td>

                                                        <td className="text-end pe-4 py-3">
                                                            <div className="d-flex justify-content-end gap-1">
                                                                <button 
                                                                    className="btn btn-xs btn-light text-dark border-0 rounded-2 px-2.5 py-1 shadow-xs fw-semibold"
                                                                    onClick={() => handleOpenPermissionModal(perm)}
                                                                    title="Edit Permission Details"
                                                                >
                                                                    <i className="fa-solid fa-pen text-muted me-1"></i> Edit
                                                                </button>

                                                                <button 
                                                                    className={`btn btn-xs rounded-2 px-2.5 py-1 shadow-xs fw-semibold ${perm.enabled ? 'btn-light text-warning-emphasis border-0' : 'btn-light text-success-emphasis border-0'}`}
                                                                    onClick={() => handleTogglePermission(perm)}
                                                                    title={perm.enabled ? 'Disable Permission' : 'Enable Permission'}
                                                                >
                                                                    <i className={`fa-solid ${perm.enabled ? 'fa-eye-slash text-warning me-1' : 'fa-eye text-success me-1'}`}></i>
                                                                    {perm.enabled ? 'Disable' : 'Enable'}
                                                                </button>

                                                                <button 
                                                                    className="btn btn-xs btn-light text-danger border-0 rounded-2 px-2.5 py-1 shadow-xs fw-semibold"
                                                                    onClick={() => setDeletingItem({ type: 'PERMISSION', id: perm.id, name: perm.slug })}
                                                                    title="Delete Permission"
                                                                >
                                                                    <i className="fa-solid fa-trash-can me-1"></i> Delete
                                                                </button>
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
                    ))}
                </div>
            )}

            {/* Save Permission Group Modal */}
            {showGroupModal && (
                <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1050 }}>
                    <div className="modal-dialog modal-dialog-centered">
                        <div className="modal-content shadow-lg border-0">
                            <div className="modal-header border-bottom">
                                <h5 className="modal-title fw-bold text-dark">
                                    <i className="fa-solid fa-folder-plus text-primary me-2"></i>
                                    {editingGroup ? 'Edit Permission Group' : 'Create Permission Group'}
                                </h5>
                                <button type="button" className="btn-close" onClick={() => setShowGroupModal(false)}></button>
                            </div>
                            <form onSubmit={handleSaveGroup}>
                                <div className="modal-body p-4">
                                    <div className="mb-3">
                                        <label className="form-label small fw-semibold text-dark">Group Name *</label>
                                        <input 
                                            type="text" 
                                            className="form-control" 
                                            placeholder="e.g. Sales & Quotations" 
                                            value={groupForm.name}
                                            onChange={(e) => setGroupForm({ name: e.target.value })}
                                            required 
                                        />
                                        <div className="form-text small">Logical category used to group operational permissions in role setup.</div>
                                    </div>
                                </div>
                                <div className="modal-footer border-top bg-light">
                                    <button type="button" className="btn btn-secondary" onClick={() => setShowGroupModal(false)}>Cancel</button>
                                    <button type="submit" className="btn btn-primary px-4 shadow-sm" disabled={savingGroup}>
                                        {savingGroup ? (
                                            <>
                                                <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                                                Saving...
                                            </>
                                        ) : 'Save Group'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* Save Permission Modal */}
            {showPermissionModal && (
                <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1050 }}>
                    <div className="modal-dialog modal-dialog-centered modal-lg">
                        <div className="modal-content shadow-lg border-0">
                            <div className="modal-header border-bottom">
                                <h5 className="modal-title fw-bold text-dark">
                                    <i className="fa-solid fa-key text-primary me-2"></i>
                                    {editingPermission ? 'Edit Permission' : 'Create New Permission'}
                                </h5>
                                <button type="button" className="btn-close" onClick={() => setShowPermissionModal(false)}></button>
                            </div>
                            <form onSubmit={handleSavePermission}>
                                <div className="modal-body p-4">
                                    <div className="row g-3">
                                        <div className="col-md-6">
                                            <label className="form-label small fw-semibold text-dark">Permission Group *</label>
                                            <select 
                                                className="form-select"
                                                value={permissionForm.permission_group_id}
                                                onChange={(e) => setPermissionForm(prev => ({ ...prev, permission_group_id: e.target.value }))}
                                                required
                                            >
                                                <option value="">Select Group...</option>
                                                {groups.map(g => (
                                                    <option key={g.id} value={g.id}>{g.name}</option>
                                                ))}
                                            </select>
                                        </div>

                                        <div className="col-md-6">
                                            <label className="form-label small fw-semibold text-dark">Permission Slug / Key *</label>
                                            <input 
                                                type="text" 
                                                className="form-control font-monospace" 
                                                placeholder="e.g. sales.quotations.create" 
                                                value={permissionForm.name}
                                                onChange={(e) => setPermissionForm(prev => ({ ...prev, name: e.target.value }))}
                                                disabled={!!editingPermission}
                                                required 
                                            />
                                            {editingPermission && <div className="form-text text-muted small">Permission key cannot be modified once created.</div>}
                                        </div>

                                        <div className="col-12">
                                            <label className="form-label small fw-semibold text-dark">Display Name *</label>
                                            <input 
                                                type="text" 
                                                className="form-control" 
                                                placeholder="e.g. Create & Issue Quotations" 
                                                value={permissionForm.display_name}
                                                onChange={(e) => setPermissionForm(prev => ({ ...prev, display_name: e.target.value }))}
                                                required 
                                            />
                                        </div>

                                        <div className="col-12">
                                            <label className="form-label small fw-semibold text-dark">Description</label>
                                            <textarea 
                                                className="form-control" 
                                                rows="3"
                                                placeholder="Brief explanation of what access or operation this permission grants..."
                                                value={permissionForm.description}
                                                onChange={(e) => setPermissionForm(prev => ({ ...prev, description: e.target.value }))}
                                            ></textarea>
                                        </div>
                                    </div>
                                </div>
                                <div className="modal-footer border-top bg-light">
                                    <button type="button" className="btn btn-secondary" onClick={() => setShowPermissionModal(false)}>Cancel</button>
                                    <button type="submit" className="btn btn-primary px-4 shadow-sm" disabled={savingPermission}>
                                        {savingPermission ? (
                                            <>
                                                <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                                                Saving...
                                            </>
                                        ) : 'Save Permission'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {deletingItem && (
                <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1060 }}>
                    <div className="modal-dialog modal-dialog-centered">
                        <div className="modal-content border-0 shadow-lg">
                            <div className="modal-header bg-danger text-white">
                                <h5 className="modal-title fw-bold">
                                    <i className="fa-solid fa-triangle-exclamation me-2"></i> Confirm Deletion
                                </h5>
                                <button type="button" className="btn-close btn-close-white" onClick={() => setDeletingItem(null)}></button>
                            </div>
                            <div className="modal-body p-4">
                                <p className="mb-2">
                                    Are you sure you want to delete the {deletingItem.type === 'GROUP' ? 'Permission Group' : 'Permission'}:
                                </p>
                                <div className="p-3 bg-light border rounded font-monospace fw-bold text-danger mb-3">
                                    {deletingItem.name}
                                </div>
                                <p className="text-muted small mb-0">
                                    This action cannot be undone. System components depending on this permission may lose access checks.
                                </p>
                            </div>
                            <div className="modal-footer border-top bg-light">
                                <button type="button" className="btn btn-secondary" onClick={() => setDeletingItem(null)}>Cancel</button>
                                <button type="button" className="btn btn-danger px-4 shadow-sm" onClick={handleDeleteConfirm} disabled={deleting}>
                                    {deleting ? (
                                        <>
                                            <span className="spinner-border spinner-border-sm me-2"></span>
                                            Deleting...
                                        </>
                                    ) : 'Confirm Delete'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
