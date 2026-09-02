import React, { useState, useEffect } from 'react';

export default function MenuManagement() {
    const [tree, setTree] = useState([]);
    const [flatList, setFlatList] = useState([]);
    const [permissions, setPermissions] = useState([]);
    const [permissionGroups, setPermissionGroups] = useState([]);
    const [permSearchQuery, setPermSearchQuery] = useState('');
    const [permGroupFilter, setPermGroupFilter] = useState('ALL');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');

    // Tree search & filter states
    const [searchQuery, setSearchQuery] = useState('');
    const [typeFilter, setTypeFilter] = useState('ALL');
    const [statusFilter, setStatusFilter] = useState('ALL');
    
    // Modal state for Add/Edit Menu
    const [showModal, setShowModal] = useState(false);

    // Currently editing menu or new draft
    const [editingId, setEditingId] = useState(null); // null = creating new
    const [formData, setFormData] = useState({
        menu_name: '',
        menu_type: 'PAGE',
        icon: 'fa-solid fa-circle-dot',
        route_uri: '',
        parent_id: '',
        permission_id: '',
        order: 0,
        enabled: true,
    });

    // Delete modal confirmation state
    const [deletingMenu, setDeletingMenu] = useState(null);

    const token = localStorage.getItem('auth_token');

    const commonIcons = [
        { label: 'Shield (Platform)', value: 'fa-solid fa-shield-halved' },
        { label: 'Sitemap / Structure', value: 'fa-solid fa-sitemap' },
        { label: 'Key / Permissions', value: 'fa-solid fa-key' },
        { label: 'Checklist / Menus', value: 'fa-solid fa-list-check' },
        { label: 'Cart / Purchases', value: 'fa-solid fa-cart-shopping' },
        { label: 'Invoice / Orders', value: 'fa-solid fa-file-invoice-dollar' },
        { label: 'Truck / Logistics', value: 'fa-solid fa-truck-ramp-box' },
        { label: 'Boxes / Inventory', value: 'fa-solid fa-boxes-stacked' },
        { label: 'Cubes / Stock', value: 'fa-solid fa-cubes' },
        { label: 'Box Archive / Products', value: 'fa-solid fa-box-archive' },
        { label: 'Cube / Catalog', value: 'fa-solid fa-cube' },
        { label: 'Tags / Brands', value: 'fa-solid fa-tags' },
        { label: 'Industry / Mfrs', value: 'fa-solid fa-industry' },
        { label: 'Calculator / Finance', value: 'fa-solid fa-calculator' },
        { label: 'Book / Ledgers', value: 'fa-solid fa-book' },
        { label: 'Chart Line / Reports', value: 'fa-solid fa-chart-line' },
        { label: 'Chart Pie / BI', value: 'fa-solid fa-chart-pie' },
        { label: 'Users / Staff', value: 'fa-solid fa-users-gear' },
        { label: 'Diagram / Workflows', value: 'fa-solid fa-diagram-project' },
        { label: 'Gears / Settings', value: 'fa-solid fa-gears' },
        { label: 'Warehouse', value: 'fa-solid fa-warehouse' },
        { label: 'Branch / Locations', value: 'fa-solid fa-code-branch' },
        { label: 'Pin / Map', value: 'fa-solid fa-map-pin' },
        { label: 'Plus / Create', value: 'fa-solid fa-plus' },
    ];

    const fetchMenus = async () => {
        setLoading(true);
        setError('');
        try {
            const res = await fetch('/api/platform/menus', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json',
                }
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok) {
                throw new Error(data.message || `Failed to load platform menus (HTTP ${res.status}).`);
            }
            setTree(data.tree || []);
            setFlatList(data.flat || []);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const fetchPermissions = async () => {
        try {
            const res = await fetch('/api/platform/permissions', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json',
                }
            });
            if (res.ok) {
                const data = await res.json();
                if (Array.isArray(data)) {
                    setPermissions(data);
                } else {
                    if (data.groups) {
                        setPermissionGroups(data.groups);
                    }
                    if (data.permissions) {
                        setPermissions(data.permissions);
                    } else if (data.groups) {
                        const allPerms = data.groups.flatMap(g => g.permissions || []);
                        setPermissions(allPerms);
                    }
                }
            }
        } catch (err) {
            console.error("Failed to load permissions:", err);
        }
    };

    useEffect(() => {
        fetchMenus();
        fetchPermissions();
    }, []);

    const resetFormForNew = (defaultType = 'PAGE', parentId = '') => {
        setEditingId(null);
        setFormData({
            menu_name: '',
            menu_type: defaultType,
            icon: defaultType === 'GROUP' ? 'fa-solid fa-folder' : 'fa-solid fa-circle-dot',
            route_uri: '',
            parent_id: parentId ? String(parentId) : '',
            permission_id: '',
            order: 0,
            enabled: true,
        });
        setPermSearchQuery('');
        setPermGroupFilter('ALL');
        setError('');
        setShowModal(true);
    };

    const selectMenuForEdit = (menu) => {
        setEditingId(menu.id);
        setFormData({
            menu_name: menu.menu_name || '',
            menu_type: menu.menu_type || 'PAGE',
            icon: menu.icon || '',
            route_uri: menu.route_uri || '',
            parent_id: menu.parent_id ? String(menu.parent_id) : '',
            permission_id: menu.permission_id ? String(menu.permission_id) : '',
            order: menu.order ?? 0,
            enabled: Boolean(menu.enabled),
        });
        setPermSearchQuery('');
        setPermGroupFilter('ALL');
        setError('');
        setShowModal(true);
    };

    const getFilteredPermissions = () => {
        return permissions.filter(perm => {
            const q = permSearchQuery.trim().toLowerCase();
            const groupName = perm.group ? perm.group.name : (permissionGroups.find(g => String(g.id) === String(perm.permission_group_id))?.name || '');
            
            const matchesSearch = !q || 
                (perm.name && perm.name.toLowerCase().includes(q)) ||
                (perm.display_name && perm.display_name.toLowerCase().includes(q)) ||
                (perm.description && perm.description.toLowerCase().includes(q)) ||
                (groupName && groupName.toLowerCase().includes(q));

            const permGroupId = perm.permission_group_id || perm.group_id || (perm.group ? perm.group.id : '');
            const matchesGroup = permGroupFilter === 'ALL' || String(permGroupId) === String(permGroupFilter);

            return matchesSearch && matchesGroup;
        });
    };

    const handleInputChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setError('');
        setSuccessMessage('');

        if (!formData.menu_name.trim()) {
            setError('Menu Label is required.');
            return;
        }

        if (formData.menu_type === 'PAGE' && !formData.route_uri.trim()) {
            setError('Route URI is required for Page menu types.');
            return;
        }

        setSaving(true);

        const payload = {
            menu_name: formData.menu_name.trim(),
            menu_type: formData.menu_type,
            icon: formData.icon ? formData.icon.trim() : null,
            route_uri: formData.menu_type === 'PAGE' ? formData.route_uri.trim() : null,
            parent_id: formData.parent_id ? parseInt(formData.parent_id) : null,
            permission_id: (formData.menu_type === 'PAGE' && formData.permission_id) ? parseInt(formData.permission_id) : null,
            order: parseInt(formData.order) || 0,
            enabled: Boolean(formData.enabled),
        };

        const url = editingId ? `/api/platform/menus/${editingId}` : '/api/platform/menus';
        const method = editingId ? 'PUT' : 'POST';

        try {
            const res = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json',
                },
                body: JSON.stringify(payload)
            });

            const data = await res.json();

            if (!res.ok) {
                if (data.errors) {
                    const firstErr = Object.values(data.errors).flat()[0];
                    throw new Error(firstErr || data.message || 'Validation failed.');
                }
                throw new Error(data.message || 'Failed to save menu item.');
            }

            setSuccessMessage(data.message || 'Menu item saved successfully.');
            setShowModal(false);
            await fetchMenus();
            window.dispatchEvent(new CustomEvent('navigation-refresh'));
        } catch (err) {
            setError(err.message);
        } finally {
            setSaving(false);
        }
    };

    const confirmDelete = (menu) => {
        setDeletingMenu(menu);
    };

    const handleDelete = async () => {
        if (!deletingMenu) return;
        setError('');
        setSuccessMessage('');

        try {
            const res = await fetch(`/api/platform/menus/${deletingMenu.id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json',
                }
            });

            const data = await res.json();
            if (!res.ok) {
                throw new Error(data.message || 'Failed to delete menu item.');
            }

            setSuccessMessage(data.message || 'Menu item deleted successfully.');
            setDeletingMenu(null);
            if (editingId === deletingMenu.id) {
                setEditingId(null);
            }
            await fetchMenus();
            window.dispatchEvent(new CustomEvent('navigation-refresh'));
        } catch (err) {
            setError(err.message);
            setDeletingMenu(null);
        }
    };

    // Toggle menu enabled status (Activate / Deactivate)
    const handleToggleEnabled = async (menu) => {
        setError('');
        setSuccessMessage('');
        try {
            const res = await fetch(`/api/platform/menus/${menu.id}/toggle`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json',
                }
            });

            const data = await res.json();
            if (!res.ok) {
                throw new Error(data.message || 'Failed to toggle menu status.');
            }

            setSuccessMessage(data.message || `Menu item ${menu.enabled ? 'deactivated' : 'activated'} successfully.`);
            await fetchMenus();
            window.dispatchEvent(new CustomEvent('navigation-refresh'));
        } catch (err) {
            setError(err.message);
        }
    };

    // Reorder action (move up/down within same parent)
    const handleMoveOrder = async (menu, direction) => {
        const siblings = flatList.filter(m => String(m.parent_id || '') === String(menu.parent_id || ''))
            .sort((a, b) => a.order - b.order);

        const currentIndex = siblings.findIndex(s => s.id === menu.id);
        if (currentIndex === -1) return;

        const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
        if (targetIndex < 0 || targetIndex >= siblings.length) return;

        const otherMenu = siblings[targetIndex];

        const itemsToUpdate = [
            { id: menu.id, order: otherMenu.order, parent_id: menu.parent_id },
            { id: otherMenu.id, order: menu.order, parent_id: otherMenu.parent_id }
        ];

        try {
            const res = await fetch('/api/platform/menus/reorder', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json',
                },
                body: JSON.stringify({ items: itemsToUpdate })
            });
            if (res.ok) {
                await fetchMenus();
                window.dispatchEvent(new CustomEvent('navigation-refresh'));
            }
        } catch (err) {
            console.error("Reorder failed:", err);
        }
    };

    // Filter potential parents (exclude current editing menu and its descendants to prevent circular hierarchy)
    const getAvailableParents = () => {
        if (!editingId) {
            return flatList.filter(m => m.menu_type === 'GROUP');
        }
        
        const getDescendantIds = (id) => {
            const children = flatList.filter(m => m.parent_id === id);
            let ids = children.map(c => c.id);
            children.forEach(c => {
                ids = [...ids, ...getDescendantIds(c.id)];
            });
            return ids;
        };

        const forbiddenIds = new Set([editingId, ...getDescendantIds(editingId)]);
        return flatList.filter(m => m.menu_type === 'GROUP' && !forbiddenIds.has(m.id));
    };

    // Filter tree hierarchy based on search query, type, and active status
    const getFilteredTree = () => {
        const query = searchQuery.trim().toLowerCase();
        if (!query && typeFilter === 'ALL' && statusFilter === 'ALL') {
            return tree;
        }

        const filterNodes = (nodes) => {
            return nodes.map(node => {
                const matchesSearch = !query || 
                    (node.menu_name && node.menu_name.toLowerCase().includes(query)) ||
                    (node.route_uri && node.route_uri.toLowerCase().includes(query));

                const matchesType = typeFilter === 'ALL' || node.menu_type === typeFilter;
                const matchesStatus = statusFilter === 'ALL' || (statusFilter === 'ACTIVE' ? Boolean(node.enabled) : !node.enabled);

                const selfMatches = matchesSearch && matchesType && matchesStatus;

                let filteredChildren = [];
                if (node.children && node.children.length > 0) {
                    filteredChildren = filterNodes(node.children);
                }

                const childMatches = filteredChildren.length > 0;

                if (selfMatches || childMatches) {
                    return {
                        ...node,
                        children: filteredChildren
                    };
                }

                return null;
            }).filter(Boolean);
        };

        return filterNodes(tree);
    };

    // Render tree node component
    const renderTreeNode = (item, level = 0) => {
        const isSelected = editingId === item.id;
        const hasChildren = item.children && item.children.length > 0;

        return (
            <div key={item.id} className="menu-tree-node mb-1">
                <div 
                    className={`d-flex align-items-center justify-content-between p-2 rounded border transition-all ${isSelected ? 'border-primary bg-primary-subtle shadow-sm' : 'bg-white hover-bg-light'}`}
                    style={{ marginLeft: `${level * 20}px` }}
                >
                    <div className="d-flex align-items-center gap-2 overflow-hidden me-2">
                        <span className="text-muted font-monospace opacity-50 cursor-grab" style={{ fontSize: '0.8rem' }}>⋮⋮</span>

                        <i className={`${item.icon || (item.menu_type === 'GROUP' ? 'fa-solid fa-folder' : 'fa-solid fa-circle-dot')} text-secondary`} style={{ width: '18px', textAlign: 'center' }}></i>

                        <span className="fw-semibold text-truncate" style={{ fontSize: '0.88rem' }}>{item.menu_name}</span>

                        <span className={`badge ${item.menu_type === 'GROUP' ? 'bg-info-subtle text-info border border-info-subtle' : 'bg-secondary-subtle text-secondary border'} rounded-pill`} style={{ fontSize: '0.65rem' }}>
                            {item.menu_type}
                        </span>

                        {item.menu_type === 'PAGE' && item.route_uri && (
                            <span className="text-muted font-monospace text-truncate d-none d-md-inline" style={{ fontSize: '0.72rem' }}>
                                {item.route_uri}
                            </span>
                        )}

                        {!item.enabled && (
                            <span className="badge bg-danger-subtle text-danger border border-danger-subtle" style={{ fontSize: '0.65rem' }}>
                                Disabled
                            </span>
                        )}
                    </div>

                    <div className="d-flex align-items-center gap-1 flex-shrink-0">
                        <button 
                            className="btn btn-xs btn-outline-secondary p-1 shadow-none border-0" 
                            title="Move Up" 
                            onClick={() => handleMoveOrder(item, 'up')}
                        >
                            <i className="fa-solid fa-chevron-up" style={{ fontSize: '0.7rem' }}></i>
                        </button>
                        <button 
                            className="btn btn-xs btn-outline-secondary p-1 shadow-none border-0" 
                            title="Move Down" 
                            onClick={() => handleMoveOrder(item, 'down')}
                        >
                            <i className="fa-solid fa-chevron-down" style={{ fontSize: '0.7rem' }}></i>
                        </button>

                        {item.menu_type === 'GROUP' && (
                            <button 
                                className="btn btn-xs btn-outline-primary p-1 shadow-none border-0" 
                                title="Add Child Item" 
                                onClick={() => resetFormForNew('PAGE', item.id)}
                            >
                                <i className="fa-solid fa-plus" style={{ fontSize: '0.75rem' }}></i>
                            </button>
                        )}

                        {item.enabled ? (
                            <button 
                                className="btn btn-xs btn-outline-warning py-0 px-2 shadow-none" 
                                onClick={() => handleToggleEnabled(item)}
                                title="Deactivate Menu Item"
                                style={{ fontSize: '0.75rem' }}
                            >
                                <i className="fa-solid fa-ban me-1"></i> Deactivate
                            </button>
                        ) : (
                            <button 
                                className="btn btn-xs btn-outline-success py-0 px-2 shadow-none" 
                                onClick={() => handleToggleEnabled(item)}
                                title="Activate Menu Item"
                                style={{ fontSize: '0.75rem' }}
                            >
                                <i className="fa-solid fa-circle-check me-1"></i> Activate
                            </button>
                        )}

                        <button 
                            className={`btn btn-xs ${isSelected ? 'btn-primary' : 'btn-outline-secondary'} py-0 px-2 shadow-none`}
                            onClick={() => selectMenuForEdit(item)}
                            style={{ fontSize: '0.75rem' }}
                        >
                            <i className="fa-solid fa-pen-to-square me-1"></i> Edit
                        </button>

                        <button 
                            className="btn btn-xs btn-outline-danger py-0 px-2 shadow-none border-0" 
                            onClick={() => confirmDelete(item)}
                            title="Delete Menu"
                            style={{ fontSize: '0.75rem' }}
                        >
                            <i className="fa-solid fa-trash-can"></i>
                        </button>
                    </div>
                </div>

                {hasChildren && (
                    <div className="menu-tree-children mt-1">
                        {item.children.map(child => renderTreeNode(child, level + 1))}
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="container-fluid py-2">
            {/* Header Title Section */}
            <div className="d-flex align-items-center justify-content-between pb-3 mb-4 border-bottom">
                <div>
                    <h4 className="fw-bold text-dark mb-1">
                        <i className="fa-solid fa-list-check text-primary me-2"></i> Menu Management
                    </h4>
                    <p className="text-muted mb-0 small">
                        Configure and order system-wide navigation menus, routes, and permission guards for the platform.
                    </p>
                </div>
                <div className="d-flex gap-2">
                    <button 
                        className="btn btn-sm btn-outline-secondary d-flex align-items-center gap-1 shadow-sm"
                        onClick={() => resetFormForNew('GROUP')}
                    >
                        <i className="fa-solid fa-folder-plus"></i>  Create Group
                    </button>
                    <button 
                        className="btn btn-sm btn-primary d-flex align-items-center gap-1 shadow-sm"
                        onClick={() => resetFormForNew('PAGE')}
                    >
                        <i className="fa-solid fa-plus"></i>  Add Menu Item
                    </button>
                </div>
            </div>

            {/* Alert Messages */}
            {error && !showModal && (
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

            {/* Main Content Layout (Full Width Navigation Tree) */}
            <div className="row g-4">
                <div className="col-12">
                    <div className="card shadow-sm border-0">
                        <div className="card-header bg-white py-3 border-bottom">
                            <div className="row g-2 align-items-center justify-content-between">
                                <div className="col-12 col-md-5">
                                    <div className="input-group input-group-sm">
                                        <span className="input-group-text bg-light text-muted">
                                            <i className="fa-solid fa-magnifying-glass"></i>
                                        </span>
                                        <input 
                                            type="text" 
                                            className="form-control" 
                                            placeholder="Search menus (e.g. Purchase, GRN, /users)..."
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                        />
                                        {searchQuery && (
                                            <button 
                                                className="btn btn-outline-secondary" 
                                                type="button"
                                                onClick={() => setSearchQuery('')}
                                            >
                                                <i className="fa-solid fa-xmark"></i>
                                            </button>
                                        )}
                                    </div>
                                </div>

                                <div className="col-12 col-md-7 d-flex align-items-center justify-content-md-end gap-2 flex-wrap">
                                    {/* Type Filter */}
                                    <select 
                                        className="form-select form-select-sm w-auto"
                                        value={typeFilter}
                                        onChange={(e) => setTypeFilter(e.target.value)}
                                    >
                                        <option value="ALL">All Types</option>
                                        <option value="PAGE">Pages Only</option>
                                        <option value="GROUP">Groups Only</option>
                                    </select>

                                    {/* Status Filter */}
                                    <select 
                                        className="form-select form-select-sm w-auto"
                                        value={statusFilter}
                                        onChange={(e) => setStatusFilter(e.target.value)}
                                    >
                                        <option value="ALL">All Statuses</option>
                                        <option value="ACTIVE">Active Only</option>
                                        <option value="INACTIVE">Inactive Only</option>
                                    </select>

                                    {(searchQuery || typeFilter !== 'ALL' || statusFilter !== 'ALL') && (
                                        <button 
                                            className="btn btn-sm btn-outline-danger py-1 px-2"
                                            onClick={() => {
                                                setSearchQuery('');
                                                setTypeFilter('ALL');
                                                setStatusFilter('ALL');
                                            }}
                                            title="Clear Filters"
                                        >
                                            <i className="fa-solid fa-filter-circle-xmark me-1"></i> Reset
                                        </button>
                                    )}

                                    <span className="badge bg-light text-dark font-monospace border ms-md-2">
                                        {flatList.length} Items
                                    </span>
                                </div>
                            </div>
                        </div>
                        <div className="card-body p-3 overflow-auto" style={{ maxHeight: '720px' }}>
                            {loading ? (
                                <div className="text-center py-5">
                                    <div className="spinner-border text-primary spinner-border-sm me-2" role="status"></div>
                                    <span className="text-muted small">Loading menu hierarchy...</span>
                                </div>
                            ) : tree.length === 0 ? (
                                <div className="text-center py-5 text-muted">
                                    <i className="fa-solid fa-folder-open fs-3 mb-2 opacity-50 d-block"></i>
                                    No menus found in database. Seed default menus or create one.
                                </div>
                            ) : getFilteredTree().length === 0 ? (
                                <div className="text-center py-5 text-muted">
                                    <i className="fa-solid fa-magnifying-glass fs-3 mb-2 opacity-50 d-block"></i>
                                    No menus found matching your search and filter criteria.
                                    <div className="mt-2">
                                        <button 
                                            className="btn btn-sm btn-link text-primary p-0"
                                            onClick={() => {
                                                setSearchQuery('');
                                                setTypeFilter('ALL');
                                                setStatusFilter('ALL');
                                            }}
                                        >
                                            Reset Search & Filters
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="menu-tree-container">
                                    {getFilteredTree().map(item => renderTreeNode(item, 0))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Add / Edit Menu Bootstrap Modal */}
            {showModal && (
                <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1050 }}>
                    <div className="modal-dialog modal-dialog-centered modal-lg">
                        <div className="modal-content shadow-lg border-0">
                            <div className="modal-header bg-light py-3 border-bottom">
                                <h5 className="modal-title fw-bold text-dark fs-6">
                                    <i className={`fa-solid ${editingId ? 'fa-pen-to-square text-primary' : 'fa-plus-circle text-success'} me-2`}></i>
                                    {editingId ? `Edit Menu Item: ${formData.menu_name}` : (formData.menu_type === 'GROUP' ? 'Create New Group Container' : 'Create New Menu Item')}
                                </h5>
                                <button type="button" className="btn-close" onClick={() => setShowModal(false)}></button>
                            </div>
                            <form onSubmit={handleSave}>
                                <div className="modal-body p-4">
                                    {error && (
                                        <div className="alert alert-danger py-2 mb-3 small d-flex align-items-center justify-content-between">
                                            <div>
                                                <i className="fa-solid fa-triangle-exclamation me-2"></i> {error}
                                            </div>
                                            <button type="button" className="btn-close" style={{ fontSize: '0.65rem' }} onClick={() => setError('')}></button>
                                        </div>
                                    )}

                                    <div className="row g-3">
                                        {/* Menu Type */}
                                        <div className="col-12 mb-2">
                                            <label className="form-label fw-semibold small text-dark">Menu Type *</label>
                                            <div className="btn-group w-100" role="group">
                                                <input 
                                                    type="radio" 
                                                    className="btn-check" 
                                                    name="menu_type" 
                                                    id="typePage" 
                                                    value="PAGE" 
                                                    checked={formData.menu_type === 'PAGE'} 
                                                    onChange={() => handleInputChange('menu_type', 'PAGE')} 
                                                />
                                                <label className="btn btn-outline-secondary py-2" htmlFor="typePage">
                                                    <i className="fa-solid fa-file me-2"></i> Page Endpoint
                                                </label>

                                                <input 
                                                    type="radio" 
                                                    className="btn-check" 
                                                    name="menu_type" 
                                                    id="typeGroup" 
                                                    value="GROUP" 
                                                    checked={formData.menu_type === 'GROUP'} 
                                                    onChange={() => handleInputChange('menu_type', 'GROUP')} 
                                                />
                                                <label className="btn btn-outline-secondary py-2" htmlFor="typeGroup">
                                                    <i className="fa-solid fa-folder me-2"></i> Group Container
                                                </label>
                                            </div>
                                            <div className="form-text text-muted" style={{ fontSize: '0.75rem' }}>
                                                {formData.menu_type === 'GROUP' 
                                                    ? 'Group containers group related child submenus in the sidebar.' 
                                                    : 'Page items link to specific React/Laravel routes.'}
                                            </div>
                                        </div>

                                        {/* Menu Label */}
                                        <div className="col-12 col-md-6 mb-2">
                                            <label className="form-label fw-semibold small text-dark">Menu Label *</label>
                                            <input 
                                                type="text" 
                                                className="form-control" 
                                                placeholder="e.g. Purchase Orders" 
                                                value={formData.menu_name}
                                                onChange={(e) => handleInputChange('menu_name', e.target.value)}
                                                required 
                                            />
                                        </div>

                                        {/* Parent Menu Dropdown */}
                                        <div className="col-12 col-md-6 mb-2">
                                            <label className="form-label fw-semibold small text-dark">Parent Menu</label>
                                            <select 
                                                className="form-select"
                                                value={formData.parent_id}
                                                onChange={(e) => handleInputChange('parent_id', e.target.value)}
                                            >
                                                <option value="">None (Root Level Navigation)</option>
                                                {getAvailableParents().map(parent => (
                                                    <option key={parent.id} value={parent.id}>
                                                        📁 {parent.menu_name}
                                                    </option>
                                                ))}
                                            </select>
                                            <div className="form-text text-muted" style={{ fontSize: '0.75rem' }}>
                                                Select a Group menu to embed this item as a child submenu.
                                            </div>
                                        </div>

                                        {/* Route URI (Required for PAGE) */}
                                        {formData.menu_type === 'PAGE' && (
                                            <div className="col-12 col-md-6 mb-2">
                                                <label className="form-label fw-semibold small text-dark">Route URI *</label>
                                                <div className="input-group">
                                                    <span className="input-group-text font-monospace bg-light text-muted" style={{ fontSize: '0.8rem' }}>URL</span>
                                                    <input 
                                                        type="text" 
                                                        className="form-control font-monospace" 
                                                        placeholder="/purchase-orders" 
                                                        value={formData.route_uri}
                                                        onChange={(e) => handleInputChange('route_uri', e.target.value)}
                                                        required={formData.menu_type === 'PAGE'}
                                                    />
                                                </div>
                                                <div className="form-text text-muted" style={{ fontSize: '0.75rem' }}>
                                                    Must match an existing registered route endpoint.
                                                </div>
                                            </div>
                                        )}

                                        {/* Database Permission Guard Picker (For PAGE) */}
                                        {formData.menu_type === 'PAGE' && (
                                            <div className="col-12 mb-3">
                                                <div className="d-flex align-items-center justify-content-between mb-1">
                                                    <label className="form-label fw-semibold small text-dark mb-0">
                                                        Required Permission Guard
                                                    </label>
                                                    {formData.permission_id && (
                                                        <button 
                                                            type="button" 
                                                            className="btn btn-xs btn-outline-danger py-0 px-2 shadow-none"
                                                            onClick={() => handleInputChange('permission_id', '')}
                                                            title="Remove permission requirement"
                                                            style={{ fontSize: '0.72rem' }}
                                                        >
                                                            <i className="fa-solid fa-xmark me-1"></i> Clear Guard (Make Public)
                                                        </button>
                                                    )}
                                                </div>

                                                {/* Selected Permission Badge Banner */}
                                                <div className="p-2 bg-light rounded border d-flex align-items-center justify-content-between">
                                                    {(() => {
                                                        const selectedPerm = permissions.find(p => String(p.id) === String(formData.permission_id));
                                                        if (selectedPerm) {
                                                            const groupName = selectedPerm.group?.name || permissionGroups.find(g => String(g.id) === String(selectedPerm.permission_group_id))?.name || 'General';
                                                            return (
                                                                <div className="d-flex align-items-center gap-2 overflow-hidden me-2">
                                                                    <span className="badge bg-primary-subtle text-primary border border-primary-subtle">
                                                                        <i className="fa-solid fa-shield-halved me-1"></i>
                                                                        {groupName}
                                                                    </span>
                                                                    <span className="fw-semibold text-dark text-truncate" style={{ fontSize: '0.85rem' }}>
                                                                        {selectedPerm.display_name || selectedPerm.name}
                                                                    </span>
                                                                    <span className="text-muted font-monospace text-truncate d-none d-sm-inline" style={{ fontSize: '0.75rem' }}>
                                                                        ({selectedPerm.slug || selectedPerm.name})
                                                                    </span>
                                                                </div>
                                                            );
                                                        }
                                                        return (
                                                            <span className="text-muted small italic">
                                                                <i className="fa-solid fa-lock-open me-1 text-success"></i> None (Publicly Accessible to Authenticated Users)
                                                            </span>
                                                        );
                                                    })()}
                                                </div>

                                                {/** Here giving a hint to the user that, only the user assigned with the permission will be able to see this menu */}
                                                <div className="fst-italic small text-muted mb-2">
                                                    <i className="fa-solid fa-circle-info me-1"></i>
                                                    Only the user assigned with the permission will be able to see this menu. And if no permission is set to the menu then everyone can see it.
                                                </div>

                                                {/* Permission Search & Filter Box */}
                                                <div className="border rounded p-2 bg-white shadow-sm">
                                                    <div className="row g-2 mb-2">
                                                        <div className="col-12 col-md-7">
                                                            <div className="input-group input-group-sm">
                                                                <span className="input-group-text bg-light text-muted">
                                                                    <i className="fa-solid fa-magnifying-glass"></i>
                                                                </span>
                                                                <input 
                                                                    type="text" 
                                                                    className="form-control"
                                                                    placeholder="Search permissions (e.g. purchase, inventory)..." 
                                                                    value={permSearchQuery}
                                                                    onChange={(e) => setPermSearchQuery(e.target.value)}
                                                                />
                                                                {permSearchQuery && (
                                                                    <button 
                                                                        className="btn btn-outline-secondary" 
                                                                        type="button"
                                                                        onClick={() => setPermSearchQuery('')}
                                                                    >
                                                                        <i className="fa-solid fa-xmark"></i>
                                                                    </button>
                                                                )}
                                                            </div>
                                                        </div>

                                                        <div className="col-12 col-md-5">
                                                            <select 
                                                                className="form-select form-select-sm"
                                                                value={permGroupFilter}
                                                                onChange={(e) => setPermGroupFilter(e.target.value)}
                                                            >
                                                                <option value="ALL">All Modules / Groups ({permissions.length})</option>
                                                                {permissionGroups.map(group => (
                                                                    <option key={group.id} value={group.id}>
                                                                        📁 {group.name}
                                                                    </option>
                                                                ))}
                                                            </select>
                                                        </div>
                                                    </div>

                                                    {/* Scrollable Picklist */}
                                                    <div className="permission-picklist border rounded overflow-auto" style={{ maxHeight: '180px', backgroundColor: '#fafafa' }}>
                                                        <div 
                                                            className={`p-2 border-bottom cursor-pointer hover-bg-light d-flex align-items-center justify-content-between ${!formData.permission_id ? 'bg-primary-subtle fw-bold text-primary' : ''}`}
                                                            onClick={() => handleInputChange('permission_id', '')}
                                                            style={{ fontSize: '0.82rem' }}
                                                        >
                                                            <div>
                                                                <i className="fa-solid fa-lock-open me-2 text-success"></i>
                                                                <span>None (Publicly Accessible)</span>
                                                            </div>
                                                            {!formData.permission_id && <i className="fa-solid fa-check text-primary"></i>}
                                                        </div>

                                                        {getFilteredPermissions().length === 0 ? (
                                                            <div className="p-3 text-center text-muted small">
                                                                No permissions matching <strong>"{permSearchQuery}"</strong>
                                                            </div>
                                                        ) : (
                                                            getFilteredPermissions().map(perm => {
                                                                const isSelected = String(formData.permission_id) === String(perm.id);
                                                                const groupName = perm.group?.name || permissionGroups.find(g => String(g.id) === String(perm.permission_group_id))?.name || 'General';

                                                                return (
                                                                    <div 
                                                                        key={perm.id}
                                                                        className={`p-2 border-bottom cursor-pointer transition-all d-flex align-items-center justify-content-between ${isSelected ? 'bg-primary-subtle text-primary border-primary' : 'hover-bg-white'}`}
                                                                        onClick={() => handleInputChange('permission_id', String(perm.id))}
                                                                        style={{ fontSize: '0.82rem' }}
                                                                    >
                                                                        <div className="d-flex align-items-center gap-2 overflow-hidden me-2">
                                                                            <span className="badge bg-secondary-subtle text-secondary border font-monospace" style={{ fontSize: '0.65rem' }}>
                                                                                {groupName}
                                                                            </span>
                                                                            <span className="fw-semibold text-truncate">{perm.display_name || perm.name}</span>
                                                                            <span className="text-muted font-monospace text-truncate d-none d-md-inline" style={{ fontSize: '0.72rem' }}>
                                                                                ({perm.slug || perm.name})
                                                                            </span>
                                                                        </div>
                                                                        {isSelected && <i className="fa-solid fa-check text-primary"></i>}
                                                                    </div>
                                                                );
                                                            })
                                                        )}
                                                    </div>
                                                    <div className="form-text text-muted mt-1" style={{ fontSize: '0.75rem' }}>
                                                        Showing {getFilteredPermissions().length} of {permissions.length} total system permissions.
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {/* Icon Selection */}
                                        <div className="col-12 col-md-6 mb-2">
                                            <label className="form-label fw-semibold small text-dark">Icon Selection</label>
                                            <div className="input-group mb-2">
                                                <span className="input-group-text bg-light">
                                                    <i className={formData.icon || 'fa-solid fa-icons'}></i>
                                                </span>
                                                <select 
                                                    className="form-select"
                                                    value={formData.icon}
                                                    onChange={(e) => handleInputChange('icon', e.target.value)}
                                                >
                                                    <option value="">-- Choose Icon Preset --</option>
                                                    {commonIcons.map((ic, i) => (
                                                        <option key={i} value={ic.value}>{ic.label} ({ic.value})</option>
                                                    ))}
                                                </select>
                                            </div>
                                            <input 
                                                type="text" 
                                                className="form-control form-control-sm font-monospace" 
                                                placeholder="Or enter custom class, e.g. fa-solid fa-star" 
                                                value={formData.icon}
                                                onChange={(e) => handleInputChange('icon', e.target.value)}
                                            />
                                        </div>

                                        {/* Display Order */}
                                        <div className="col-12 col-md-3 mb-2">
                                            <label className="form-label fw-semibold small text-dark">Display Order</label>
                                            <input 
                                                type="number" 
                                                className="form-control" 
                                                value={formData.order}
                                                onChange={(e) => handleInputChange('order', e.target.value)}
                                            />
                                        </div>

                                        {/* Enabled Toggle */}
                                        <div className="col-12 col-md-3 mb-2 d-flex align-items-center">
                                            <div className="form-check form-switch pt-3">
                                                <input 
                                                    className="form-check-input" 
                                                    type="checkbox" 
                                                    role="switch" 
                                                    id="enabledSwitch" 
                                                    checked={formData.enabled}
                                                    onChange={(e) => handleInputChange('enabled', e.target.checked)}
                                                />
                                                <label className="form-check-label fw-semibold small text-dark" htmlFor="enabledSwitch">
                                                    Enabled
                                                </label>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="modal-footer bg-light border-top d-flex align-items-center justify-content-between">
                                    {editingId ? (
                                        <button 
                                            type="button" 
                                            className="btn btn-outline-danger shadow-sm"
                                            onClick={() => {
                                                setShowModal(false);
                                                confirmDelete({ id: editingId, menu_name: formData.menu_name });
                                            }}
                                        >
                                            <i className="fa-solid fa-trash-can me-1"></i> Delete Item
                                        </button>
                                    ) : <div></div>}

                                    <div className="d-flex gap-2">
                                        <button 
                                            type="button" 
                                            className="btn btn-secondary px-3"
                                            onClick={() => setShowModal(false)}
                                        >
                                            Cancel
                                        </button>
                                        <button 
                                            type="submit" 
                                            className="btn btn-primary px-4 shadow-sm"
                                            disabled={saving}
                                        >
                                            {saving ? (
                                                <>
                                                    <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                                                    Saving...
                                                </>
                                            ) : (
                                                <>
                                                    <i className="fa-solid fa-floppy-disk me-1"></i> Save Changes
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {deletingMenu && (
                <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1060 }}>
                    <div className="modal-dialog modal-dialog-centered">
                        <div className="modal-content shadow-lg border-0">
                            <div className="modal-header border-bottom-0">
                                <h5 className="modal-title fw-bold text-danger">
                                    <i className="fa-solid fa-triangle-exclamation me-2"></i> Delete Menu Confirmation
                                </h5>
                                <button type="button" className="btn-close" onClick={() => setDeletingMenu(null)}></button>
                            </div>
                            <div className="modal-body">
                                <p className="mb-2">Are you sure you want to delete the menu item <strong>"{deletingMenu.menu_name}"</strong>?</p>
                                <div className="alert alert-warning py-2 small mb-0 d-flex align-items-center justify-content-between">
                                    <div>
                                        <i className="fa-solid fa-circle-info me-1"></i> If this menu is a Group containing children, backend validation will prevent deletion until children are reassigned or removed.
                                    </div>
                                    <button type="button" className="btn-close ms-2 flex-shrink-0" style={{ fontSize: '0.65rem' }} onClick={(e) => { e.currentTarget.closest('.alert').style.display = 'none'; }} aria-label="Close"></button>
                                </div>
                            </div>
                            <div className="modal-footer border-top-0">
                                <button type="button" className="btn btn-secondary" onClick={() => setDeletingMenu(null)}>Cancel</button>
                                <button type="button" className="btn btn-danger px-4" onClick={handleDelete}>Confirm Delete</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

