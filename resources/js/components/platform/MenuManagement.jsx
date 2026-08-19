import React, { useState, useEffect } from 'react';

export default function MenuManagement() {
    const [tree, setTree] = useState([]);
    const [flatList, setFlatList] = useState([]);
    const [permissions, setPermissions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    
    // Unsaved changes tracking
    const [isDirty, setIsDirty] = useState(false);

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
            if (!res.ok) throw new Error('Failed to load platform menus.');
            const data = await res.json();
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
                // Flattens permission groups or permissions array
                if (Array.isArray(data)) {
                    setPermissions(data);
                } else if (data.groups) {
                    const allPerms = data.groups.flatMap(g => g.permissions || []);
                    setPermissions(allPerms);
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
        setIsDirty(false);
        setError('');
        setSuccessMessage('');
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
        setIsDirty(false);
        setError('');
        setSuccessMessage('');
    };

    const handleInputChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        setIsDirty(true);
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
            setIsDirty(false);
            await fetchMenus();

            if (!editingId && data.menu) {
                selectMenuForEdit(data.menu);
            }
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
                resetFormForNew();
            }
            await fetchMenus();
        } catch (err) {
            setError(err.message);
            setDeletingMenu(null);
        }
    };

    // Reorder action (move up/down within same parent)
    const handleMoveOrder = async (menu, direction) => {
        // Find siblings
        const siblings = flatList.filter(m => String(m.parent_id || '') === String(menu.parent_id || ''))
            .sort((a, b) => a.order - b.order);

        const currentIndex = siblings.findIndex(s => s.id === menu.id);
        if (currentIndex === -1) return;

        const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
        if (targetIndex < 0 || targetIndex >= siblings.length) return;

        const otherMenu = siblings[targetIndex];

        // Swap order numbers
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
        
        // Recursive helper to get all descendant IDs
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
                        {/* Drag Handle / Level Indicator */}
                        <span className="text-muted font-monospace opacity-50 cursor-grab" style={{ fontSize: '0.8rem' }}>⋮⋮</span>

                        {/* Icon */}
                        <i className={`${item.icon || (item.menu_type === 'GROUP' ? 'fa-solid fa-folder' : 'fa-solid fa-circle-dot')} text-secondary`} style={{ width: '18px', textAlign: 'center' }}></i>

                        {/* Menu Name & Type */}
                        <span className="fw-semibold text-truncate" style={{ fontSize: '0.88rem' }}>{item.menu_name}</span>

                        {/* Type Badge */}
                        <span className={`badge ${item.menu_type === 'GROUP' ? 'bg-info-subtle text-info border border-info-subtle' : 'bg-secondary-subtle text-secondary border'} rounded-pill`} style={{ fontSize: '0.65rem' }}>
                            {item.menu_type}
                        </span>

                        {/* Route display for page */}
                        {item.menu_type === 'PAGE' && item.route_uri && (
                            <span className="text-muted font-monospace text-truncate d-none d-md-inline" style={{ fontSize: '0.72rem' }}>
                                {item.route_uri}
                            </span>
                        )}

                        {/* Enabled / Disabled Badge */}
                        {!item.enabled && (
                            <span className="badge bg-danger-subtle text-danger border border-danger-subtle" style={{ fontSize: '0.65rem' }}>
                                Disabled
                            </span>
                        )}
                    </div>

                    {/* Actions */}
                    <div className="d-flex align-items-center gap-1 flex-shrink-0">
                        {/* Up/Down Reorder Buttons */}
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

                        {/* Add child button if GROUP */}
                        {item.menu_type === 'GROUP' && (
                            <button 
                                className="btn btn-xs btn-outline-primary p-1 shadow-none border-0" 
                                title="Add Child Item" 
                                onClick={() => resetFormForNew('PAGE', item.id)}
                            >
                                <i className="fa-solid fa-plus" style={{ fontSize: '0.75rem' }}></i>
                            </button>
                        )}

                        {/* Edit Button */}
                        <button 
                            className={`btn btn-xs ${isSelected ? 'btn-primary' : 'btn-outline-secondary'} py-0 px-2 shadow-none`}
                            onClick={() => selectMenuForEdit(item)}
                            style={{ fontSize: '0.75rem' }}
                        >
                            <i className="fa-solid fa-pen-to-square me-1"></i> Edit
                        </button>

                        {/* Delete Button */}
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

                {/* Render Nested Children */}
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
                        <i className="fa-solid fa-folder-plus"></i> + Create Group
                    </button>
                    <button 
                        className="btn btn-sm btn-primary d-flex align-items-center gap-1 shadow-sm"
                        onClick={() => resetFormForNew('PAGE')}
                    >
                        <i className="fa-solid fa-plus"></i> + Add Menu Item
                    </button>
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

            {/* Unsaved changes banner */}
            {isDirty && (
                <div className="alert alert-warning py-2 mb-3 d-flex align-items-center justify-content-between shadow-sm">
                    <span className="small">
                        <i className="fa-solid fa-pen-clip me-2"></i> You have unsaved changes in the editor.
                    </span>
                    <button className="btn btn-xs btn-warning px-3 fw-bold" onClick={handleSave} disabled={saving}>
                        {saving ? 'Saving...' : 'Save Changes Now'}
                    </button>
                </div>
            )}

            {/* Main Content Layout (2 Columns) */}
            <div className="row g-4">
                {/* LEFT PANEL: Navigation Tree */}
                <div className="col-12 col-lg-8">
                    <div className="card shadow-sm border-0 h-100">
                        <div className="card-header bg-white py-3 border-bottom d-flex align-items-center justify-content-between">
                            <h6 className="fw-bold mb-0 text-dark">
                                <i className="fa-solid fa-sitemap me-2 text-secondary"></i> Navigation Tree
                            </h6>
                            <span className="badge bg-light text-dark font-monospace border">
                                {flatList.length} Items
                            </span>
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
                            ) : (
                                <div className="menu-tree-container">
                                    {tree.map(item => renderTreeNode(item, 0))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* RIGHT PANEL: Menu Editor Form */}
                <div className="col-12 col-lg-4">
                    <div className="card shadow-sm border-0">
                        <div className="card-header bg-white py-3 border-bottom d-flex align-items-center justify-content-between">
                            <h6 className="fw-bold mb-0 text-dark">
                                <i className="fa-solid fa-sliders me-2 text-primary"></i> 
                                {editingId ? `Edit Menu Item: ${formData.menu_name}` : 'Create New Menu Item'}
                            </h6>
                            {editingId && (
                                <button 
                                    className="btn btn-xs btn-outline-secondary shadow-none"
                                    onClick={() => resetFormForNew()}
                                >
                                    <i className="fa-solid fa-xmark me-1"></i> Cancel Edit
                                </button>
                            )}
                        </div>

                        <div className="card-body p-4">
                            <form onSubmit={handleSave}>
                                {/* Menu Type */}
                                <div className="mb-3">
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
                                <div className="mb-3">
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

                                {/* Route URI (Required for PAGE) */}
                                {formData.menu_type === 'PAGE' && (
                                    <div className="mb-3">
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
                                            Must match an existing registered frontend/backend route endpoint.
                                        </div>
                                    </div>
                                )}

                                {/* Icon Selection */}
                                <div className="mb-3">
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

                                {/* Parent Menu Dropdown */}
                                <div className="mb-3">
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

                                {/* Database Permission (For PAGE) */}
                                {formData.menu_type === 'PAGE' && (
                                    <div className="mb-3">
                                        <label className="form-label fw-semibold small text-dark">Required Permission Guard</label>
                                        <select 
                                            className="form-select"
                                            value={formData.permission_id}
                                            onChange={(e) => handleInputChange('permission_id', e.target.value)}
                                        >
                                            <option value="">None (Publicly Accessible to Authenticated Users)</option>
                                            {permissions.map(perm => (
                                                <option key={perm.id} value={perm.id}>
                                                    {perm.display_name || perm.name} ({perm.slug || perm.name})
                                                </option>
                                            ))}
                                        </select>
                                        <div className="form-text text-muted" style={{ fontSize: '0.75rem' }}>
                                            Selected from database permissions table. Only users possessing this permission will see the menu.
                                        </div>
                                    </div>
                                )}

                                {/* Display Order */}
                                <div className="mb-3">
                                    <label className="form-label fw-semibold small text-dark">Display Order</label>
                                    <input 
                                        type="number" 
                                        className="form-control" 
                                        value={formData.order}
                                        onChange={(e) => handleInputChange('order', e.target.value)}
                                    />
                                </div>

                                {/* Enabled Toggle */}
                                <div className="mb-4 form-check form-switch">
                                    <input 
                                        className="form-check-input" 
                                        type="checkbox" 
                                        role="switch" 
                                        id="enabledSwitch" 
                                        checked={formData.enabled}
                                        onChange={(e) => handleInputChange('enabled', e.target.checked)}
                                    />
                                    <label className="form-check-label fw-semibold small text-dark" htmlFor="enabledSwitch">
                                        Enabled (Visible in navigation tree)
                                    </label>
                                </div>

                                {/* Buttons */}
                                <div className="d-flex align-items-center justify-content-between pt-3 border-top">
                                    {editingId ? (
                                        <button 
                                            type="button" 
                                            className="btn btn-outline-danger shadow-sm"
                                            onClick={() => confirmDelete({ id: editingId, menu_name: formData.menu_name })}
                                        >
                                            <i className="fa-solid fa-trash-can me-1"></i> Delete Item
                                        </button>
                                    ) : <div></div>}

                                    <div className="d-flex gap-2">
                                        <button 
                                            type="button" 
                                            className="btn btn-outline-secondary"
                                            onClick={() => resetFormForNew()}
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
            </div>

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
                                <div className="alert alert-warning py-2 small mb-0">
                                    <i className="fa-solid fa-circle-info me-1"></i> If this menu is a Group containing children, backend validation will prevent deletion until children are reassigned or removed.
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
