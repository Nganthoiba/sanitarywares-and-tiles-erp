import React, { useState, useEffect } from 'react';

export default function UserManagement() {
    const [users, setUsers] = useState([]);
    const [roles, setRoles] = useState([]);
    const [branches, setBranches] = useState([]);
    const [warehouses, setWarehouses] = useState([]);
    
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [successMessage, setSuccessMessage] = useState(null);
    const [inviteLink, setInviteLink] = useState(null);

    // Form State
    const [inviteForm, setInviteForm] = useState({
        name: '',
        email: '',
        role_id: '',
        branch_id: '',
        warehouse_id: '',
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

            const [usersRes, rolesRes, branchesRes, warehousesRes] = await Promise.all([
                fetch('/api/users', { headers }),
                fetch('/api/roles', { headers }),
                fetch('/api/branches', { headers }),
                fetch('/api/warehouses', { headers }),
            ]);

            if (!usersRes.ok || !rolesRes.ok) {
                throw new Error('Failed to load user administration details.');
            }

            const [usersData, rolesData, branchesData, warehousesData] = await Promise.all([
                usersRes.json(),
                rolesRes.json(),
                branchesRes.json(),
                warehousesRes.json(),
            ]);

            setUsers(usersData);
            setRoles(rolesData);
            setBranches(branchesData);
            setWarehouses(warehousesData);

            // Pre-fill form dropdown defaults if details exist
            if (rolesData.length > 0 || branchesData.length > 0 || warehousesData.length > 0) {
                setInviteForm({
                    name: '',
                    email: '',
                    role_id: rolesData[0]?.id || '',
                    branch_id: branchesData[0]?.id || '',
                    warehouse_id: warehousesData[0]?.id || '',
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
        setInviteForm({ ...inviteForm, [e.target.name]: e.target.value });
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

    return (
        <div className="card shadow-sm border-0">
            <div className="card-header bg-white py-3 d-flex justify-content-between align-items-center border-bottom">
                <h5 className="mb-0 fw-bold text-dark">Employee Management & Security</h5>
                <button className="btn btn-primary btn-sm d-flex align-items-center" data-bs-toggle="modal" data-bs-target="#inviteModal">
                    <span className="me-1">➕</span> Invite Employee
                </button>
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

                {inviteLink && (
                    <div className="alert alert-info py-3 mb-4">
                        <h6 className="fw-bold mb-1">Generated Onboarding Link:</h6>
                        <div className="d-flex gap-2">
                            <input type="text" readOnly className="form-control form-control-sm bg-light" value={inviteLink} />
                            <button className="btn btn-outline-primary btn-sm" onClick={() => {
                                navigator.clipboard.writeText(inviteLink);
                                alert('Link copied to clipboard!');
                            }}>Copy</button>
                        </div>
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
                                    <th>Name</th>
                                    <th>Email</th>
                                    <th>Roles</th>
                                    <th>Assigned Branch</th>
                                    <th>Status</th>
                                    <th className="text-end">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {users.map(u => (
                                    <tr key={u.id}>
                                        <td>
                                            <div className="fw-bold text-dark">{u.name}</div>
                                        </td>
                                        <td>{u.email}</td>
                                        <td>
                                            {u.roles.map(r => (
                                                <span key={r.id} className="badge bg-secondary me-1">{r.name}</span>
                                            ))}
                                        </td>
                                        <td>
                                            {u.scopes[0]?.branch?.name || 'N/A'}
                                        </td>
                                        <td>
                                            {u.invitation_token ? (
                                                <span className="badge bg-warning text-dark">Pending Invite</span>
                                            ) : (
                                                <span className="badge bg-success">Active</span>
                                            )}
                                        </td>
                                        <td className="text-end">
                                            <button className="btn btn-outline-danger btn-sm" onClick={() => handleDelete(u.id)}>
                                                Delete
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Invite Modal */}
            <div className="modal fade" id="inviteModal" tabIndex="-1" aria-labelledby="inviteModalLabel" aria-hidden="true">
                <div className="modal-dialog">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h5 className="modal-title fw-bold text-dark" id="inviteModalLabel">Invite New Employee</h5>
                            <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                        </div>
                        <form onSubmit={handleInvite}>
                            <div className="modal-body">
                                <div className="mb-3">
                                    <label className="form-label small fw-semibold">Employee Name</label>
                                    <input type="text" name="name" className="form-control" value={inviteForm.name} onChange={handleFormChange} required />
                                </div>
                                <div className="mb-3">
                                    <label className="form-label small fw-semibold">Email Address</label>
                                    <input type="email" name="email" className="form-control" value={inviteForm.email} onChange={handleFormChange} required />
                                </div>
                                <div className="mb-3">
                                    <label className="form-label small fw-semibold">System Role</label>
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
                                        {warehouses.map(w => (
                                            <option key={w.id} value={w.id}>{w.name}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                                <button type="submit" className="btn btn-primary" data-bs-dismiss="modal">Generate Invitation</button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}
