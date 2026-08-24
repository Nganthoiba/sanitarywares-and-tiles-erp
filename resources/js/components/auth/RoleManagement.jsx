import React, { useState, useEffect } from 'react';

export default function RoleManagement() {
    const [roles, setRoles] = useState([]);
    const [permissions, setPermissions] = useState([]);
    
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [successMessage, setSuccessMessage] = useState(null);

    // Custom Role Form State (Create / Edit)
    const [editingRole, setEditingRole] = useState(null);
    const [roleForm, setRoleForm] = useState({
        name: '',
        permissions: []
    });

    const token = localStorage.getItem('auth_token');

    // Check if the currently authenticated user is system administrator / super admin
    const isSystemAdmin = (() => {
        try {
            const activeRole = JSON.parse(localStorage.getItem('user_active_role') || 'null');
            if (activeRole) {
                const slug = typeof activeRole === 'object' ? activeRole.slug : activeRole;
                if (['super-administrator', 'super-admin'].includes(slug)) {
                    return true;
                }
            }
            const userRoles = JSON.parse(localStorage.getItem('user_roles') || '[]');
            return userRoles.some(r => {
                const slug = typeof r === 'object' ? r.slug : r;
                return ['system-administrator', 'super-administrator', 'super-admin'].includes(slug);
            });
        } catch (e) {
            return false;
        }
    })();

    const fetchData = async () => {
        setLoading(true);
        setError(null);
        try {
            const headers = {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json',
            };

            const [rolesRes, permissionsRes] = await Promise.all([
                fetch('/api/roles', { headers }),
                fetch('/api/permissions', { headers }),
            ]);

            if (!rolesRes.ok || !permissionsRes.ok) {
                throw new Error('Failed to load role and permission details.');
            }

            const [rolesData, permissionsData] = await Promise.all([
                rolesRes.json(),
                permissionsRes.json(),
            ]);

            setRoles(rolesData);
            setPermissions(permissionsData);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    // Role Actions
    const openCreateRoleModal = () => {
        setEditingRole(null);
        setRoleForm({
            name: '',
            permissions: []
        });
    };

    const openEditRoleModal = (role) => {
        setEditingRole(role);
        setRoleForm({
            name: role.name,
            permissions: role.permissions ? role.permissions.map(p => p.id) : []
        });
    };

    const handleRoleFormChange = (e) => {
        setRoleForm({ ...roleForm, [e.target.name]: e.target.value });
    };

    const handlePermissionToggle = (permId) => {
        let updatedPerms = [...roleForm.permissions];
        if (updatedPerms.includes(permId)) {
            updatedPerms = updatedPerms.filter(id => id !== permId);
        } else {
            updatedPerms.push(permId);
        }
        setRoleForm({ ...roleForm, permissions: updatedPerms });
    };

    const handleSaveRole = async (e) => {
        e.preventDefault();
        setError(null);
        setSuccessMessage(null);

        const url = editingRole ? `/api/roles/${editingRole.id}` : '/api/roles';
        const method = editingRole ? 'PUT' : 'POST';

        try {
            const response = await fetch(url, {
                method,
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                },
                body: JSON.stringify(roleForm),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Saving role failed');
            }

            setSuccessMessage(editingRole ? 'Role updated successfully!' : 'Role created successfully!');
            fetchData();
            window.dispatchEvent(new CustomEvent('role-permissions-updated'));
            window.dispatchEvent(new CustomEvent('navigation-refresh'));
        } catch (err) {
            setError(err.message);
        }
    };

    const handleDeleteRole = async (id) => {
        if (!confirm('Are you sure you want to delete this role? This cannot be undone.')) return;
        setError(null);
        setSuccessMessage(null);

        try {
            const response = await fetch(`/api/roles/${id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json',
                },
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Deletion of role failed');
            }

            setSuccessMessage(data.message);
            fetchData();
            window.dispatchEvent(new CustomEvent('role-permissions-updated'));
            window.dispatchEvent(new CustomEvent('navigation-refresh'));
        } catch (err) {
            setError(err.message);
        }
    };

    // Group permissions by their group name
    const groupedPermissions = permissions.reduce((acc, perm) => {
        const groupName = perm.group?.name || 'Other Module';
        if (!acc[groupName]) {
            acc[groupName] = [];
        }
        acc[groupName].push(perm);
        return acc;
    }, {});

    return (
        <div className="card shadow-sm border-0" style={{ borderRadius: '14px' }}>
            <div className="card-header bg-transparent py-3 border-bottom d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3">
                <div>
                    <h5 className="mb-1 fw-bold text-dark d-flex align-items-center gap-2">
                        <i className="fa-solid fa-user-shield text-primary opacity-75"></i>
                        Role & Permission Management
                    </h5>
                    <p className="text-muted small mb-0">Manage custom system roles, permission assignments, and security profiles.</p>
                </div>
                <div>
                    <button className="btn btn-primary btn-sm rounded-pill px-3 shadow-sm d-flex align-items-center gap-1" onClick={openCreateRoleModal} data-bs-toggle="modal" data-bs-target="#roleModal">
                        <i className="fa-solid fa-plus me-1"></i> Create Custom Role
                    </button>
                </div>
            </div>

            <div className="card-body p-4">
                {error && (
                    <div className="alert alert-danger border-0 shadow-sm py-2 px-3 small rounded-3" role="alert">
                        <i className="fa-solid fa-circle-exclamation me-2"></i>{error}
                    </div>
                )}
                {successMessage && (
                    <div className="alert alert-success border-0 shadow-sm py-2 px-3 small rounded-3" role="alert">
                        <i className="fa-solid fa-circle-check me-2"></i>{successMessage}
                    </div>
                )}

                {loading ? (
                    <div className="text-center py-5">
                        <div className="spinner-border text-primary" role="status"></div>
                    </div>
                ) : (
                    <div className="row g-3">
                        {roles.length === 0 ? (
                            <div className="col-12 text-center py-5 text-muted">
                                <i className="fa-solid fa-user-shield text-secondary fs-2 mb-2 d-block opacity-50"></i>
                                No roles found.
                            </div>
                        ) : (
                            roles.map(r => (
                                <div className="col-12 col-md-6 col-lg-4" key={r.id}>
                                    <div className="card role-card h-100 shadow-sm">
                                        <div className="card-header bg-transparent py-3 d-flex justify-content-between align-items-center">
                                            <div>
                                                <h6 className="fw-bold mb-0 text-dark d-flex align-items-center gap-2">
                                                    <i className="fa-solid fa-shield-cat text-primary opacity-75"></i>
                                                    {r.name}
                                                </h6>
                                                <span className="text-muted calibri" >{r.slug}</span>
                                            </div>
                                            {r.is_system ? (
                                                <span className="badge badge-soft-dark px-2.5 py-1" style={{ fontSize: '0.7rem' }}>System Role</span>
                                            ) : (
                                                <span className="badge badge-soft-secondary px-2.5 py-1" style={{ fontSize: '0.7rem' }}>Custom Role</span>
                                            )}
                                        </div>
                                        <div className="card-body d-flex flex-column justify-content-between p-3">
                                            <div>
                                                <div className="d-flex justify-content-between align-items-center mb-2">
                                                    <span className="text-uppercase text-muted font-monospace fw-semibold" style={{ fontSize: '0.72rem', letterSpacing: '0.5px' }}>
                                                        Permissions ({r.permissions ? r.permissions.length : 0})
                                                    </span>
                                                </div>
                                                <div className="d-flex flex-wrap gap-1 mb-3">
                                                    {r.permissions && r.permissions.length > 0 ? (
                                                        <>
                                                            {r.permissions.slice(0, 4).map(p => (
                                                                <span key={p.id} className="badge badge-soft-secondary px-2 py-1 small text-truncate" style={{ maxWidth: '180px' }} title={p.display_name || p.name || p.slug}>
                                                                    {p.display_name || p.name || p.slug}
                                                                </span>
                                                            ))}
                                                            {r.permissions.length > 4 && (
                                                                <button
                                                                    type="button"
                                                                    className="badge badge-soft-primary px-2 py-1 small border-0"
                                                                    onClick={() => openEditRoleModal(r)}
                                                                    data-bs-toggle="modal" 
                                                                    data-bs-target="#roleModal"
                                                                    title="View and edit all permissions in modal"
                                                                    style={{ cursor: 'pointer' }}
                                                                >
                                                                    +{r.permissions.length - 4} more
                                                                </button>
                                                            )}
                                                        </>
                                                    ) : (
                                                        <span className="text-muted small fst-italic">No permissions assigned.</span>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="border-top pt-3 mt-auto d-flex justify-content-between align-items-center">
                                                <button 
                                                    className="btn btn-outline-primary btn-sm rounded-pill px-3 fw-medium" 
                                                    onClick={() => openEditRoleModal(r)}
                                                    data-bs-toggle="modal" 
                                                    data-bs-target="#roleModal"
                                                    disabled={r.is_system && !isSystemAdmin}
                                                    title={r.is_system && !isSystemAdmin ? "System roles cannot be modified" : (r.is_system ? "Edit system role" : "Edit custom role")}
                                                >
                                                    <i className="fa-solid fa-pen-to-square me-1"></i> Edit Role
                                                </button>
                                                {!r.is_system && (
                                                    <button 
                                                        className="btn btn-outline-danger btn-sm rounded-pill px-3 fw-medium" 
                                                        onClick={() => handleDeleteRole(r.id)}
                                                        title="Delete custom role"
                                                    >
                                                        <i className="fa-solid fa-trash me-1"></i> Delete
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}
            </div>

            {/* Create / Edit Role Modal */}
            <div className="modal fade" id="roleModal" tabIndex="-1" aria-labelledby="roleModalLabel" aria-hidden="true">
                <div className="modal-dialog modal-lg modal-dialog-centered">
                    <div className="modal-content border-0 shadow-lg" style={{ borderRadius: '16px', overflow: 'hidden' }}>
                        <div className="modal-header py-3 px-4 bg-light border-bottom">
                            <h5 className="modal-title fw-bold text-dark d-flex align-items-center gap-2" id="roleModalLabel">
                                <i className="fa-solid fa-user-gear text-primary"></i>
                                {editingRole ? `Modify Custom Role: ${editingRole.name}` : 'Create Custom Access Role'}
                            </h5>
                            <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                        </div>
                        <form onSubmit={handleSaveRole}>
                            <div className="modal-body p-4">
                                <div className="mb-4">
                                    <label className="form-label small fw-semibold text-dark">Role Display Name</label>
                                    <input 
                                        type="text" 
                                        name="name" 
                                        className="form-control rounded-3" 
                                        value={roleForm.name} 
                                        onChange={handleRoleFormChange} 
                                        placeholder="e.g. Sales Coordinator" 
                                        required 
                                    />
                                    <div className="form-text small text-muted">A slug (like <span className="font-monospace text-primary">sales-coordinator</span>) will be generated automatically.</div>
                                </div>

                                <div className="mb-2 d-flex justify-content-between align-items-center">
                                    <label className="form-label small fw-semibold text-dark mb-0">Select Permissions Scopes</label>
                                    <span className="badge badge-soft-primary px-2.5 py-1 small">{roleForm.permissions.length} Selected</span>
                                </div>

                                <div style={{ maxHeight: '380px', overflowY: 'auto' }} className="border rounded-3 p-3 bg-light">
                                    {Object.keys(groupedPermissions).length === 0 ? (
                                        <div className="text-center py-4 text-muted small">No permissions scopes available.</div>
                                    ) : (
                                        Object.keys(groupedPermissions).map(groupName => (
                                            <div key={groupName} className="mb-4">
                                                <h6 className="fw-bold text-primary border-bottom pb-2 mb-3 small text-uppercase font-monospace d-flex align-items-center gap-2">
                                                    <i className="fa-solid fa-layer-group opacity-75"></i>
                                                    {groupName}
                                                </h6>
                                                <div className="row g-2">
                                                    {groupedPermissions[groupName].map(perm => {
                                                        const isChecked = roleForm.permissions.includes(perm.id);
                                                        return (
                                                            <div key={perm.id} className="col-12 col-md-6 mb-2">
                                                                <div className="form-check p-2 rounded-2 border-0 bg-transparent hover-bg-light transition-all">
                                                                    <input 
                                                                        className="form-check-input me-2" 
                                                                        type="checkbox" 
                                                                        id={`perm-${perm.id}`}
                                                                        checked={isChecked}
                                                                        onChange={() => handlePermissionToggle(perm.id)}
                                                                    />
                                                                    <label className="form-check-label small text-dark cursor-pointer fw-medium" htmlFor={`perm-${perm.id}`}>
                                                                        {perm.display_name || perm.name}
                                                                    </label>
                                                                    <div className="text-muted small ps-0" style={{ fontSize: '0.75rem' }}>
                                                                        Code: <span className="text-primary font-monospace">{perm.slug}</span>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                            <div className="modal-footer py-3 px-4 bg-light border-top">
                                <button type="button" className="btn btn-secondary rounded-pill px-4" data-bs-dismiss="modal">Close</button>
                                <button type="submit" className="btn btn-primary rounded-pill px-4 shadow-sm" data-bs-dismiss="modal">
                                    {editingRole ? 'Save Changes' : 'Create Custom Role'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}
