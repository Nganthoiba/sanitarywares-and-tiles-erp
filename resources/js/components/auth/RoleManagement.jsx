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
        <div className="card shadow-sm border-0">
            <div className="card-header bg-white py-3 border-bottom d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3">
                <div>
                    <h5 className="mb-1 fw-bold text-dark">Role Permission Management</h5>
                    <p className="text-muted small mb-0">Manage custom system roles, permission assignments, and security profiles.</p>
                </div>
                <div>
                    <button className="btn btn-primary btn-sm d-flex align-items-center gap-1" onClick={openCreateRoleModal} data-bs-toggle="modal" data-bs-target="#roleModal">
                        <i className="fa-solid fa-plus me-1"></i> Create Custom Role
                    </button>
                </div>
            </div>

            <div className="card-body">
                {error && (
                    <div className="alert alert-danger py-2" role="alert">
                        {error}
                    </div>
                )}
                {successMessage && (
                    <div className="alert alert-success py-2" role="alert">
                        {successMessage}
                    </div>
                )}

                {loading ? (
                    <div className="text-center py-5">
                        <div className="spinner-border text-primary" role="status"></div>
                    </div>
                ) : (
                    <div className="table-responsive">
                        <table className="table table-hover align-middle">
                            <thead className="table-light">
                                <tr>
                                    <th>Role Name</th>
                                    <th>Slug</th>
                                    <th>Type</th>
                                    <th>Permissions Assigned</th>
                                    <th className="text-end">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {roles.length === 0 ? (
                                    <tr>
                                        <td colSpan="5" className="text-center py-4 text-muted">No roles found.</td>
                                    </tr>
                                ) : (
                                    roles.map(r => (
                                        <tr key={r.id}>
                                            <td>
                                                <div className="fw-bold text-dark">{r.name}</div>
                                            </td>
                                            <td><code>{r.slug}</code></td>
                                            <td>
                                                {r.is_system ? (
                                                    <span className="badge bg-dark px-2 py-1">System Role</span>
                                                ) : (
                                                    <span className="badge bg-secondary px-2 py-1">Custom Role</span>
                                                )}
                                            </td>
                                            <td>
                                                <div className="d-flex flex-wrap gap-1" style={{ maxWidth: '450px' }}>
                                                    {r.permissions && r.permissions.length > 0 ? (
                                                        r.permissions.map(p => (
                                                            <span key={p.id} className="badge bg-light text-dark border small px-2 py-0.5" title={p.slug}>
                                                                {p.name}
                                                            </span>
                                                        ))
                                                    ) : (
                                                        <span className="text-muted small">No permissions assigned.</span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="text-end">
                                                <div className="btn-group">
                                                    <button 
                                                        className="btn btn-outline-secondary btn-sm" 
                                                        onClick={() => openEditRoleModal(r)}
                                                        data-bs-toggle="modal" 
                                                        data-bs-target="#roleModal"
                                                        disabled={r.is_system && !isSystemAdmin}
                                                        title={r.is_system && !isSystemAdmin ? "System roles cannot be modified" : (r.is_system ? "Edit system role" : "Edit custom role")}
                                                    >
                                                        <i className="fa-solid fa-pen-to-square me-1"></i> Edit
                                                    </button>
                                                    <button 
                                                        className="btn btn-outline-danger btn-sm" 
                                                        onClick={() => handleDeleteRole(r.id)}
                                                        disabled={r.is_system}
                                                        title={r.is_system ? "System roles cannot be deleted" : "Delete custom role"}
                                                    >
                                                        <i className="fa-solid fa-trash me-1"></i> Delete
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Create / Edit Role Modal */}
            <div className="modal fade" id="roleModal" tabIndex="-1" aria-labelledby="roleModalLabel" aria-hidden="true">
                <div className="modal-dialog modal-lg">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h5 className="modal-title fw-bold text-dark" id="roleModalLabel">
                                {editingRole ? `Modify Custom Role: ${editingRole.name}` : 'Create Custom Access Role'}
                            </h5>
                            <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                        </div>
                        <form onSubmit={handleSaveRole}>
                            <div className="modal-body">
                                <div className="mb-3">
                                    <label className="form-label small fw-semibold">Role Display Name</label>
                                    <input 
                                        type="text" 
                                        name="name" 
                                        className="form-control" 
                                        value={roleForm.name} 
                                        onChange={handleRoleFormChange} 
                                        placeholder="e.g. Sales Coordinator" 
                                        required 
                                    />
                                    <div className="form-text small text-muted">A slug (like <code>sales-coordinator</code>) will be generated automatically.</div>
                                </div>

                                <div className="mb-2 d-flex justify-content-between align-items-center">
                                    <label className="form-label small fw-semibold mb-0">Select Permissions Scopes</label>
                                    <span className="badge bg-light text-secondary border small">{roleForm.permissions.length} Selected</span>
                                </div>

                                <div style={{ maxHeight: '350px', overflowY: 'auto' }} className="border rounded p-3 bg-light">
                                    {Object.keys(groupedPermissions).length === 0 ? (
                                        <div className="text-center py-4 text-muted small">No permissions scopes available.</div>
                                    ) : (
                                        Object.keys(groupedPermissions).map(groupName => (
                                            <div key={groupName} className="mb-4">
                                                <h6 className="fw-bold text-primary border-bottom pb-1 small text-uppercase font-monospace">{groupName}</h6>
                                                <div className="row">
                                                    {groupedPermissions[groupName].map(perm => {
                                                        const isChecked = roleForm.permissions.includes(perm.id);
                                                        return (
                                                            <div key={perm.id} className="col-12 col-md-6 mb-2">
                                                                <div className="form-check">
                                                                    <input 
                                                                        className="form-check-input" 
                                                                        type="checkbox" 
                                                                        id={`perm-${perm.id}`}
                                                                        checked={isChecked}
                                                                        onChange={() => handlePermissionToggle(perm.id)}
                                                                    />
                                                                    <label className="form-check-label small text-dark cursor-pointer fw-medium" htmlFor={`perm-${perm.id}`}>
                                                                        {perm.name}
                                                                    </label>
                                                                    <div className="text-muted small ps-0" style={{ fontSize: '0.75rem' }}>
                                                                        Code: <code>{perm.slug}</code>
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
                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                                <button type="submit" className="btn btn-primary" data-bs-dismiss="modal">
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
