import React, { useState, useEffect } from 'react';

export default function UserManagement() {
    const [users, setUsers] = useState([]);
    const [roles, setRoles] = useState([]);
    const [branches, setBranches] = useState([]);
    const [warehouses, setWarehouses] = useState([]);
    const [permissions, setPermissions] = useState([]);
    
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [successMessage, setSuccessMessage] = useState(null);
    const [inviteLink, setInviteLink] = useState(null);

    // Tab state: 'staff' or 'roles'
    const [activeSubTab, setActiveSubTab] = useState('staff');

    // Invite Employee Form State
    const [inviteForm, setInviteForm] = useState({
        name: '',
        email: '',
        role_id: '',
        branch_id: '',
        warehouse_id: '',
    });

    // Edit Employee Form State
    const [editingUser, setEditingUser] = useState(null);
    const [editForm, setEditForm] = useState({
        name: '',
        role_id: '',
        branch_id: '',
        warehouse_id: '',
    });

    // Custom Role Form State (Create / Edit)
    const [editingRole, setEditingRole] = useState(null);
    const [roleForm, setRoleForm] = useState({
        name: '',
        permissions: []
    });

    const token = localStorage.getItem('auth_token');

    const fetchData = async () => {
        setLoading(true);
        setError(null);
        try {
            const headers = {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json',
            };

            const [usersRes, rolesRes, branchesRes, warehousesRes, permissionsRes] = await Promise.all([
                fetch('/api/users', { headers }),
                fetch('/api/roles', { headers }),
                fetch('/api/branches', { headers }),
                fetch('/api/warehouses', { headers }),
                fetch('/api/permissions', { headers }),
            ]);

            if (!usersRes.ok || !rolesRes.ok || !branchesRes.ok || !warehousesRes.ok || !permissionsRes.ok) {
                throw new Error('Failed to load user administration details.');
            }

            const [usersData, rolesData, branchesData, warehousesData, permissionsData] = await Promise.all([
                usersRes.json(),
                rolesRes.json(),
                branchesRes.json(),
                warehousesRes.json(),
                permissionsRes.json(),
            ]);

            setUsers(usersData);
            setRoles(rolesData);
            setBranches(branchesData);
            setWarehouses(warehousesData);
            setPermissions(permissionsData);

            // Pre-fill form dropdown defaults if details exist
            if (rolesData.length > 0 && branchesData.length > 0 && warehousesData.length > 0) {
                const defaultBranchId = branchesData[0]?.id || '';
                const defaultWarehouse = warehousesData.find(w => String(w.branch_id) === String(defaultBranchId)) || warehousesData[0];
                setInviteForm({
                    name: '',
                    email: '',
                    role_id: rolesData[0]?.id || '',
                    branch_id: defaultBranchId,
                    warehouse_id: defaultWarehouse?.id || '',
                });
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleFormChange = (e) => {
        const { name, value } = e.target;
        if (name === 'branch_id') {
            const firstWarehouse = warehouses.find(w => String(w.branch_id) === String(value));
            setInviteForm({
                ...inviteForm,
                branch_id: value,
                warehouse_id: firstWarehouse ? firstWarehouse.id : '',
            });
        } else {
            setInviteForm({ ...inviteForm, [name]: value });
        }
    };

    const openEditUserModal = (user) => {
        setEditingUser(user);
        const roleId = user.roles[0]?.id || '';
        const branchId = user.scopes[0]?.branch_id || user.scopes[0]?.branch?.id || '';
        const warehouseId = user.scopes[0]?.warehouse_id || user.scopes[0]?.warehouse?.id || '';
        setEditForm({
            name: user.name || '',
            role_id: roleId,
            branch_id: branchId,
            warehouse_id: warehouseId,
        });
    };

    const handleEditFormChange = (e) => {
        const { name, value } = e.target;
        if (name === 'branch_id') {
            const firstWarehouse = warehouses.find(w => String(w.branch_id) === String(value));
            setEditForm({
                ...editForm,
                branch_id: value,
                warehouse_id: firstWarehouse ? firstWarehouse.id : '',
            });
        } else {
            setEditForm({ ...editForm, [name]: value });
        }
    };

    const handleUpdateUser = async (e) => {
        e.preventDefault();
        setError(null);
        setSuccessMessage(null);

        try {
            const response = await fetch(`/api/users/${editingUser.id}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                },
                body: JSON.stringify(editForm),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Updating staff member failed');
            }

            setSuccessMessage('Staff member updated successfully!');
            fetchData();
        } catch (err) {
            setError(err.message);
        }
    };

    const handleInvite = async (e) => {
        e.preventDefault();
        setError(null);
        setSuccessMessage(null);
        setInviteLink(null);

        try {
            const response = await fetch('/api/users/invite', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                },
                body: JSON.stringify(inviteForm),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Invitation failed');
            }

            setSuccessMessage('Employee invited successfully!');
            setInviteLink(data.invitation_link);
            
            // Reset invite form fields
            setInviteForm({
                ...inviteForm,
                name: '',
                email: '',
            });

            // Reload user list
            fetchData();
        } catch (err) {
            setError(err.message);
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('Are you sure you want to delete this employee?')) return;
        setError(null);
        setSuccessMessage(null);

        try {
            const response = await fetch(`/api/users/${id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json',
                },
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Deletion failed');
            }

            setSuccessMessage(data.message);
            fetchData();
        } catch (err) {
            setError(err.message);
        }
    };

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
            permissions: role.permissions.map(p => p.id)
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
                    <h5 className="mb-1 fw-bold text-dark">Access Control & Security</h5>
                    <p className="text-muted small mb-0">Manage employee accounts, custom system roles, and resource access scopes.</p>
                </div>
                <div className="d-flex gap-2">
                    {activeSubTab === 'staff' ? (
                        <button className="btn btn-primary btn-sm d-flex align-items-center gap-1" data-bs-toggle="modal" data-bs-target="#inviteModal">
                            <i className="fa-solid fa-user-plus me-1"></i> Invite Staff Member
                        </button>
                    ) : (
                        <button className="btn btn-primary btn-sm d-flex align-items-center gap-1" onClick={openCreateRoleModal} data-bs-toggle="modal" data-bs-target="#roleModal">
                            <i className="fa-solid fa-plus me-1"></i> Create Custom Role
                        </button>
                    )}
                </div>
            </div>

            {/* Sub navigation tabs */}
            <div className="bg-light border-bottom px-4">
                <nav className="nav nav-tabs border-bottom-0 mt-2" role="tablist">
                    <button 
                        className={`nav-link border-0 fw-bold px-3 py-2 ${activeSubTab === 'staff' ? 'active bg-white text-primary border-top' : 'text-secondary bg-transparent'}`} 
                        onClick={() => { setActiveSubTab('staff'); setError(null); setSuccessMessage(null); }}
                        style={{ fontSize: '0.9rem' }}
                    >
                        <i className="fa-solid fa-users me-2"></i> Staff Directory
                    </button>
                    <button 
                        className={`nav-link border-0 fw-bold px-3 py-2 ${activeSubTab === 'roles' ? 'active bg-white text-primary border-top' : 'text-secondary bg-transparent'}`} 
                        onClick={() => { setActiveSubTab('roles'); setError(null); setSuccessMessage(null); }}
                        style={{ fontSize: '0.9rem' }}
                    >
                        <i className="fa-solid fa-key me-2"></i> Roles & Permissions
                    </button>
                </nav>
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

                {inviteLink && activeSubTab === 'staff' && (
                    <div className="alert alert-info py-3 mb-4">
                        <h6 className="fw-bold mb-1">Generated Onboarding Link:</h6>
                        <p className="small text-muted mb-2">Provide this URL to the staff member so they can set up their secure account password.</p>
                        <div className="d-flex gap-2">
                            <input type="text" readOnly className="form-control form-control-sm bg-white" value={inviteLink} />
                            <button className="btn btn-outline-primary btn-sm" onClick={() => {
                                navigator.clipboard.writeText(inviteLink);
                                alert('Link copied to clipboard!');
                            }}>Copy Link</button>
                        </div>
                    </div>
                )}

                {loading ? (
                    <div className="text-center py-5">
                        <div className="spinner-border text-primary" role="status"></div>
                    </div>
                ) : (
                    <>
                        {/* Tab 1: Staff Listing */}
                        {activeSubTab === 'staff' && (
                            <div className="table-responsive">
                                <table className="table table-hover align-middle">
                                    <thead className="table-light">
                                        <tr>
                                            <th>Name</th>
                                            <th>Email</th>
                                            <th>Assigned Roles</th>
                                            <th>Branch / Warehouse</th>
                                            <th>Invitation Status</th>
                                            <th className="text-end">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {users.length === 0 ? (
                                            <tr>
                                                <td colSpan="6" className="text-center py-4 text-muted">No staff members found.</td>
                                            </tr>
                                        ) : (
                                            users.map(u => (
                                                <tr key={u.id}>
                                                    <td>
                                                        <div className="fw-bold text-dark">{u.name}</div>
                                                    </td>
                                                    <td>{u.email}</td>
                                                    <td>
                                                        {u.roles.map(r => (
                                                            <span key={r.id} className="badge bg-primary-subtle text-primary border border-primary-subtle me-1 px-2 py-1">{r.name}</span>
                                                        ))}
                                                    </td>
                                                    <td>
                                                        <div className="fw-semibold text-secondary">{u.scopes[0]?.branch?.name || 'N/A'}</div>
                                                        <div className="text-muted small">{u.scopes[0]?.warehouse?.name || 'N/A'}</div>
                                                    </td>
                                                    <td>
                                                        {u.invitation_token ? (
                                                            <span className="badge bg-warning-subtle text-warning border border-warning-subtle px-2 py-1">Pending Password</span>
                                                        ) : (
                                                            <span className="badge bg-success-subtle text-success border border-success-subtle px-2 py-1">Active</span>
                                                        )}
                                                    </td>
                                                    <td className="text-end">
                                                        <div className="btn-group">
                                                            <button 
                                                                className="btn btn-outline-secondary btn-sm px-2 py-1" 
                                                                onClick={() => openEditUserModal(u)}
                                                                data-bs-toggle="modal" 
                                                                data-bs-target="#editUserModal"
                                                            >
                                                                <i className="fa-solid fa-pen-to-square me-1"></i> Edit
                                                            </button>
                                                            <button 
                                                                className="btn btn-outline-danger btn-sm px-2 py-1" 
                                                                onClick={() => handleDelete(u.id)}
                                                                disabled={users.length <= 1} // Protection if single user
                                                            >
                                                                <i className="fa-solid fa-trash me-1"></i> Remove
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

                        {/* Tab 2: Roles and Permissions Listing */}
                        {activeSubTab === 'roles' && (
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
                                        {roles.map(r => (
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
                                                            disabled={r.is_system}
                                                            title={r.is_system ? "System roles cannot be modified" : "Edit custom role"}
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
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* Invite Staff Modal */}
            <div className="modal fade" id="inviteModal" tabIndex="-1" aria-labelledby="inviteModalLabel" aria-hidden="true">
                <div className="modal-dialog">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h5 className="modal-title fw-bold text-dark" id="inviteModalLabel">Invite New Staff Member</h5>
                            <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                        </div>
                        <form onSubmit={handleInvite}>
                            <div className="modal-body">
                                <div className="mb-3">
                                    <label className="form-label small fw-semibold">Employee Name</label>
                                    <input type="text" name="name" className="form-control" value={inviteForm.name} onChange={handleFormChange} placeholder="e.g. Saikhom Manimatum" required />
                                </div>
                                <div className="mb-3">
                                    <label className="form-label small fw-semibold">Email Address</label>
                                    <input type="email" name="email" className="form-control" value={inviteForm.email} onChange={handleFormChange} placeholder="e.g. rahul@organization.com" required />
                                </div>
                                <div className="mb-3">
                                    <label className="form-label small fw-semibold">System Access Role</label>
                                    <select name="role_id" className="form-select" value={inviteForm.role_id} onChange={handleFormChange} required>
                                        {roles.map(r => (
                                            <option key={r.id} value={r.id}>{r.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="mb-3">
                                    <label className="form-label small fw-semibold">Branch Scoping</label>
                                    <select name="branch_id" className="form-select" value={inviteForm.branch_id} onChange={handleFormChange} required>
                                        {branches.map(b => (
                                            <option key={b.id} value={b.id}>{b.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="mb-3">
                                    <label className="form-label small fw-semibold">Warehouse Scoping</label>
                                    <select name="warehouse_id" className="form-select" value={inviteForm.warehouse_id} onChange={handleFormChange} required>
                                        {warehouses.filter(w => String(w.branch_id) === String(inviteForm.branch_id)).length === 0 ? (
                                            <option value="">No warehouses in this branch</option>
                                        ) : (
                                            warehouses.filter(w => String(w.branch_id) === String(inviteForm.branch_id)).map(w => (
                                                <option key={w.id} value={w.id}>{w.name}</option>
                                            ))
                                        )}
                                    </select>
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                                <button type="submit" className="btn btn-primary" data-bs-dismiss="modal">Generate Invitation Link</button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>

            {/* Edit Staff Modal */}
            <div className="modal fade" id="editUserModal" tabIndex="-1" aria-labelledby="editUserModalLabel" aria-hidden="true">
                <div className="modal-dialog">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h5 className="modal-title fw-bold text-dark" id="editUserModalLabel">Modify Staff Member</h5>
                            <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                        </div>
                        {editingUser && (
                            <form onSubmit={handleUpdateUser}>
                                <div className="modal-body">
                                    <div className="mb-3">
                                        <label className="form-label small fw-semibold">Employee Name</label>
                                        <input 
                                            type="text" 
                                            name="name" 
                                            className="form-control" 
                                            value={editForm.name} 
                                            onChange={handleEditFormChange} 
                                            placeholder="e.g. Saikhom Manimatum" 
                                            required 
                                        />
                                    </div>
                                    <div className="mb-3">
                                        <label className="form-label small fw-semibold">Email Address</label>
                                        <input 
                                            type="email" 
                                            className="form-control bg-light" 
                                            value={editingUser.email} 
                                            disabled 
                                            readOnly 
                                        />
                                        <div className="form-text small text-muted">Email address cannot be changed.</div>
                                    </div>
                                    <div className="mb-3">
                                        <label className="form-label small fw-semibold">System Access Role</label>
                                        <select 
                                            name="role_id" 
                                            className="form-select" 
                                            value={editForm.role_id} 
                                            onChange={handleEditFormChange} 
                                            required
                                        >
                                            {roles.map(r => (
                                                <option key={r.id} value={r.id}>{r.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="mb-3">
                                        <label className="form-label small fw-semibold">Branch Scoping</label>
                                        <select 
                                            name="branch_id" 
                                            className="form-select" 
                                            value={editForm.branch_id} 
                                            onChange={handleEditFormChange} 
                                            required
                                        >
                                            {branches.map(b => (
                                                <option key={b.id} value={b.id}>{b.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="mb-3">
                                        <label className="form-label small fw-semibold">Warehouse Scoping</label>
                                        <select 
                                            name="warehouse_id" 
                                            className="form-select" 
                                            value={editForm.warehouse_id} 
                                            onChange={handleEditFormChange} 
                                            required
                                        >
                                            {warehouses.filter(w => String(w.branch_id) === String(editForm.branch_id)).length === 0 ? (
                                                <option value="">No warehouses in this branch</option>
                                            ) : (
                                                warehouses.filter(w => String(w.branch_id) === String(editForm.branch_id)).map(w => (
                                                    <option key={w.id} value={w.id}>{w.name}</option>
                                                ))
                                            )}
                                        </select>
                                    </div>
                                </div>
                                <div className="modal-footer">
                                    <button type="button" className="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                                    <button type="submit" className="btn btn-primary" data-bs-dismiss="modal">Save Changes</button>
                                </div>
                            </form>
                        )}
                    </div>
                </div>
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
