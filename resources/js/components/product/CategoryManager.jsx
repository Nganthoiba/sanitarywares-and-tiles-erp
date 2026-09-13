import React, { useState, useEffect } from 'react';
import axios from 'axios';

export default function CategoryManager() {
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(false);

    // Toast state (Replaces static alert divs with auto-fading toasts)
    const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

    const showToastNotification = (message, type = 'success') => {
        setToast({ show: true, message, type });
    };

    useEffect(() => {
        if (toast.show) {
            const timer = setTimeout(() => {
                setToast(prev => ({ ...prev, show: false }));
            }, 4000);
            return () => clearTimeout(timer);
        }
    }, [toast.show]);

    // Search, Filter & Pagination states
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all'); // all, active, inactive
    const [currentPage, setCurrentPage] = useState(1);
    const [perPage, setPerPage] = useState(10);

    // Modal state
    const [showModal, setShowModal] = useState(false);
    const [modalMode, setModalMode] = useState('create'); // create, edit
    const [selectedCategory, setSelectedCategory] = useState(null);

    const [units, setUnits] = useState([]);

    const [form, setForm] = useState({
        name: '',
        slug: '',
        parent_id: '',
        description: '',
        sort_order: '0',
        is_active: true,
        default_base_unit_id: '',
        default_purchase_unit_id: '',
        default_sales_unit_id: ''
    });

    const fetchCategories = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('auth_token');
            const [catRes, formRes] = await Promise.all([
                axios.get('/api/categories-crud', { headers: { Authorization: `Bearer ${token}` } }),
                axios.get('/api/product/form-data', { headers: { Authorization: `Bearer ${token}` } })
            ]);
            setCategories(catRes.data || []);
            setUnits(formRes.data?.units || []);
        } catch (err) {
            showToastNotification('Failed to fetch categories list.', 'danger');
        } finally {
            setLoading(false);
        }
    };

    const handleOpenCreate = () => {
        setModalMode('create');
        setSelectedCategory(null);
        setForm({
            name: '',
            slug: '',
            parent_id: '',
            description: '',
            sort_order: '0',
            is_active: true,
            default_base_unit_id: '',
            default_purchase_unit_id: '',
            default_sales_unit_id: ''
        });
        setShowModal(true);
    };

    const handleOpenEdit = (category) => {
        setModalMode('edit');
        setSelectedCategory(category);
        setForm({
            name: category.name || '',
            slug: category.slug || '',
            parent_id: category.parent_id ? category.parent_id.toString() : '',
            description: category.description || '',
            sort_order: category.sort_order !== undefined ? category.sort_order.toString() : '0',
            is_active: category.is_active === 1 || category.is_active === true,
            default_base_unit_id: category.default_base_unit_id ? category.default_base_unit_id.toString() : '',
            default_purchase_unit_id: category.default_purchase_unit_id ? category.default_purchase_unit_id.toString() : '',
            default_sales_unit_id: category.default_sales_unit_id ? category.default_sales_unit_id.toString() : ''
        });
        setShowModal(true);
    };

    // Category Specifications Modal state
    const [showAttrModal, setShowAttrModal] = useState(false);
    const [selectedCategoryForAttrs, setSelectedCategoryForAttrs] = useState(null);
    const [attrLoading, setAttrLoading] = useState(false);
    const [attrSaving, setAttrSaving] = useState(false);

    const [directAttrs, setDirectAttrs] = useState([]);
    const [inheritedFrom, setInheritedFrom] = useState(null);
    const [inheritedAttrs, setInheritedAttrs] = useState([]);
    const [availableSystemAttrs, setAvailableSystemAttrs] = useState([]);
    const [selectedNewAttrId, setSelectedNewAttrId] = useState('');

    // Inline custom attribute definition state
    const [showDefineAttrModal, setShowDefineAttrModal] = useState(false);
    const [newAttrForm, setNewAttrForm] = useState({
        name: '',
        type: 'string',
        unit_id: ''
    });
    const [definingAttr, setDefiningAttr] = useState(false);

    const handleCreateCustomAttribute = async (e) => {
        e.preventDefault();
        if (!newAttrForm.name.trim()) return;

        setDefiningAttr(true);
        try {
            const token = localStorage.getItem('auth_token');
            const payload = {
                name: newAttrForm.name.trim(),
                type: newAttrForm.type,
                unit_id: newAttrForm.unit_id ? parseInt(newAttrForm.unit_id, 10) : null
            };
            const res = await axios.post('/api/product/attributes', payload, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (res.data?.success && res.data?.data) {
                const newAttr = res.data.data;
                showToastNotification(`Custom attribute "${newAttr.name}" defined successfully.`, 'success');
                setNewAttrForm({ name: '', type: 'string', unit_id: '' });
                setShowDefineAttrModal(false);

                // Re-fetch system attributes and auto-attach newly created attribute
                if (selectedCategoryForAttrs) {
                    const attrRes = await axios.get(`/api/categories/${selectedCategoryForAttrs.id}/category-attributes-management`, {
                        headers: { Authorization: `Bearer ${token}` }
                    });
                    const data = attrRes.data || {};
                    const latestAvailable = data.available_attributes || [];
                    setAvailableSystemAttrs(latestAvailable);

                    const newDirectAttr = {
                        attribute_id: newAttr.id,
                        name: newAttr.name,
                        slug: newAttr.slug,
                        type: newAttr.type,
                        unit_symbol: newAttr.unit?.symbol || null,
                        is_required: false,
                        sort_order: directAttrs.length + 1,
                        allowed_values: []
                    };
                    setDirectAttrs(prev => [...prev, newDirectAttr]);
                }
            }
        } catch (err) {
            showToastNotification(err.response?.data?.message || 'Failed to create custom attribute definition.', 'danger');
        } finally {
            setDefiningAttr(false);
        }
    };

    const handleOpenAttributesModal = async (category) => {
        setSelectedCategoryForAttrs(category);
        setAttrLoading(true);
        setSelectedNewAttrId('');
        setShowDefineAttrModal(false);
        setShowAttrModal(true);

        try {
            const token = localStorage.getItem('auth_token');
            const res = await axios.get(`/api/categories/${category.id}/category-attributes`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = res.data || {};
            setDirectAttrs(data.direct_attributes || []);
            setInheritedFrom(data.inherited_from || null);
            setInheritedAttrs(data.inherited_attributes || []);
            setAvailableSystemAttrs(data.available_attributes || []);
        } catch (err) {
            showToastNotification('Failed to load category specification attributes.', 'danger');
        } finally {
            setAttrLoading(false);
        }
    };

    const handleAddAttributeToCategory = () => {
        if (!selectedNewAttrId) return;
        const attrObj = availableSystemAttrs.find(a => a.id.toString() === selectedNewAttrId.toString());
        if (!attrObj) return;

        if (directAttrs.some(a => a.attribute_id === attrObj.id)) {
            showToastNotification(`Attribute "${attrObj.name}" is already assigned to this category.`, 'warning');
            return;
        }

        const newDirectAttr = {
            attribute_id: attrObj.id,
            name: attrObj.name,
            slug: attrObj.slug,
            type: attrObj.type,
            unit_symbol: attrObj.unit_symbol,
            is_required: false,
            sort_order: directAttrs.length + 1,
            allowed_values: []
        };

        setDirectAttrs(prev => [...prev, newDirectAttr]);
        setSelectedNewAttrId('');
        showToastNotification(`Attached "${attrObj.name}" attribute.`, 'info');
    };

    const handleRemoveAttributeFromCategory = (index) => {
        const removed = directAttrs[index];
        setDirectAttrs(prev => prev.filter((_, i) => i !== index));
        if (removed) {
            showToastNotification(`Removed "${removed.name}" attribute.`, 'info');
        }
    };

    const handleUpdateDirectAttrField = (index, field, value) => {
        setDirectAttrs(prev => {
            const updated = [...prev];
            updated[index] = { ...updated[index], [field]: value };
            return updated;
        });
    };

    const handleSaveCategoryAttributes = async () => {
        if (!selectedCategoryForAttrs) return;
        setAttrSaving(true);

        try {
            const token = localStorage.getItem('auth_token');
            const payload = {
                attributes: directAttrs.map(a => ({
                    attribute_id: a.attribute_id,
                    is_required: a.is_required,
                    sort_order: parseInt(a.sort_order, 10) || 0,
                    allowed_values: Array.isArray(a.allowed_values) 
                        ? a.allowed_values 
                        : (typeof a.allowed_values === 'string' ? a.allowed_values.split(',').map(s => s.trim()).filter(Boolean) : null)
                }))
            };

            await axios.post(`/api/categories/${selectedCategoryForAttrs.id}/category-attributes`, payload, {
                headers: { Authorization: `Bearer ${token}` }
            });

            showToastNotification(`Specification attributes for "${selectedCategoryForAttrs.name}" saved successfully.`, 'success');
            fetchCategories();
        } catch (err) {
            showToastNotification(err.response?.data?.message || 'Failed to save category attributes.', 'danger');
        } finally {
            setAttrSaving(false);
        }
    };

    useEffect(() => {
        fetchCategories();
    }, []);

    const handleDelete = async (category) => {
        if (!confirm(`Are you sure you want to delete category "${category.name}"? This action cannot be undone.`)) {
            return;
        }
        try {
            const token = localStorage.getItem('auth_token');
            await axios.delete(`/api/categories-crud/${category.id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            showToastNotification(`Category "${category.name}" successfully deleted.`, 'success');
            fetchCategories();
        } catch (err) {
            showToastNotification(err.response?.data?.message || 'Failed to delete category.', 'danger');
        }
    };

    const handleToggleStatus = async (category) => {
        const isActive = category.is_active === 1 || category.is_active === true;
        const newStatus = !isActive;
        const actionText = newStatus ? 'activate' : 'deactivate';

        if (!confirm(`Are you sure you want to ${actionText} category "${category.name}"?`)) {
            return;
        }

        try {
            const token = localStorage.getItem('auth_token');
            await axios.put(`/api/categories-crud/${category.id}`, {
                is_active: newStatus
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            showToastNotification(`Category "${category.name}" successfully ${newStatus ? 'activated' : 'deactivated'}.`, newStatus ? 'success' : 'info');
            fetchCategories();
        } catch (err) {
            showToastNotification(err.response?.data?.message || `Failed to ${actionText} category.`, 'danger');
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        const payload = {
            ...form,
            sort_order: parseInt(form.sort_order, 10) || 0,
            parent_id: form.parent_id ? parseInt(form.parent_id, 10) : null,
            default_base_unit_id: form.default_base_unit_id ? parseInt(form.default_base_unit_id, 10) : null,
            default_purchase_unit_id: form.default_purchase_unit_id ? parseInt(form.default_purchase_unit_id, 10) : null,
            default_sales_unit_id: form.default_sales_unit_id ? parseInt(form.default_sales_unit_id, 10) : null,
        };

        try {
            const token = localStorage.getItem('auth_token');
            if (modalMode === 'create') {
                await axios.post('/api/categories-crud', payload, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                showToastNotification(`Category "${form.name}" created successfully.`, 'success');
            } else {
                await axios.put(`/api/categories-crud/${selectedCategory.id}`, payload, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                showToastNotification(`Category "${form.name}" updated successfully.`, 'success');
            }
            setShowModal(false);
            fetchCategories();
        } catch (err) {
            showToastNotification(err.response?.data?.message || 'Failed to save category.', 'danger');
        }
    };

    const handleChange = (field, value) => {
        setForm(prev => {
            const updated = { ...prev, [field]: value };
            if (field === 'name' && modalMode === 'create') {
                const autoSlug = value.toLowerCase().replace(/[^a-z0-9-_]/g, '-');
                const oldAutoSlug = (prev.name || '').toLowerCase().replace(/[^a-z0-9-_]/g, '-');
                if (!prev.slug || prev.slug === oldAutoSlug) {
                    updated.slug = autoSlug;
                }
            }
            return updated;
        });
    };

    const getUnitSymbol = (unitId, unitObj) => {
        if (unitObj?.symbol) return unitObj.symbol;
        if (unitObj?.name) return unitObj.name;
        if (!unitId) return null;
        const found = units.find(u => String(u.id) === String(unitId));
        return found ? (found.symbol || found.name) : null;
    };

    const getUnitFullName = (unitId, unitObj) => {
        if (unitObj?.name) return `${unitObj.name}${unitObj.symbol ? ` (${unitObj.symbol})` : ''}`;
        if (!unitId) return '';
        const found = units.find(u => String(u.id) === String(unitId));
        return found ? `${found.name}${found.symbol ? ` (${found.symbol})` : ''}` : '';
    };

    // Filter & Search calculation
    const filteredCategories = categories.filter(c => {
        const matchesStatus = 
            statusFilter === 'all' ? true :
            statusFilter === 'active' ? (c.is_active === 1 || c.is_active === true) :
            (c.is_active === 0 || c.is_active === false);

        if (!matchesStatus) return false;

        if (!searchTerm.trim()) return true;

        const term = searchTerm.toLowerCase();
        const nameMatch = (c.name || '').toLowerCase().includes(term);
        const slugMatch = (c.slug || '').toLowerCase().includes(term);
        const parentMatch = (c.parent?.name || '').toLowerCase().includes(term);
        const descMatch = (c.description || '').toLowerCase().includes(term);
        const baseUnitMatch = (c.default_base_unit?.name || '').toLowerCase().includes(term) || (c.default_base_unit?.symbol || '').toLowerCase().includes(term);
        const purchaseUnitMatch = (c.default_purchase_unit?.name || '').toLowerCase().includes(term) || (c.default_purchase_unit?.symbol || '').toLowerCase().includes(term);
        const salesUnitMatch = (c.default_sales_unit?.name || '').toLowerCase().includes(term) || (c.default_sales_unit?.symbol || '').toLowerCase().includes(term);

        return nameMatch || slugMatch || parentMatch || descMatch || baseUnitMatch || purchaseUnitMatch || salesUnitMatch;
    });

    const totalPages = Math.ceil(filteredCategories.length / perPage) || 1;
    const safeCurrentPage = Math.min(currentPage, totalPages);
    const indexOfFirstItem = (safeCurrentPage - 1) * perPage;
    const indexOfLastItem = Math.min(safeCurrentPage * perPage, filteredCategories.length);
    const paginatedCategories = filteredCategories.slice(indexOfFirstItem, indexOfLastItem);

    // Filter out the selected category itself to prevent self-reference
    const parentOptions = categories.filter(c => !selectedCategory || c.id !== selectedCategory.id);

    return (
        <div className="animate__animated animate__fadeIn position-relative" style={{ fontSize: '0.92rem' }}>
            {/* FLOATING TOAST NOTIFICATION OVERLAY */}
            {toast.show && (
                <div 
                    className="position-fixed top-0 end-0 p-3 animate__animated animate__fadeInDown" 
                    style={{ zIndex: 1200, maxWidth: '420px' }}
                >
                    <div 
                        className={`toast show align-items-center text-white border-0 shadow-lg bg-${toast.type === 'danger' ? 'danger' : (toast.type === 'success' ? 'success' : (toast.type === 'warning' ? 'warning' : 'primary'))}`} 
                        role="alert" 
                        style={{ borderRadius: '12px' }}
                    >
                        <div className="d-flex p-3 align-items-center">
                            <div className="fs-4 me-3">
                                <i className={`fa-solid ${toast.type === 'danger' ? 'fa-circle-exclamation' : (toast.type === 'success' ? 'fa-circle-check' : (toast.type === 'warning' ? 'fa-triangle-exclamation' : 'fa-circle-info'))}`}></i>
                            </div>
                            <div className="toast-body p-0 flex-grow-1 fw-bold" style={{ fontSize: '0.9rem', lineHeight: '1.4' }}>
                                {toast.message}
                            </div>
                            <button 
                                type="button" 
                                className="btn-close btn-close-white ms-3" 
                                onClick={() => setToast(prev => ({ ...prev, show: false }))}
                                aria-label="Close"
                            ></button>
                        </div>
                    </div>
                </div>
            )}

            {/* Header Banner */}
            <div className="card border-0 shadow-sm p-4 mb-4 rounded-4" style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0' }}>
                <div className="d-flex flex-wrap align-items-center justify-content-between gap-3">
                    <div className="d-flex align-items-center gap-3">
                        <div className="d-flex align-items-center justify-content-center bg-primary-subtle text-primary rounded-3 p-3" style={{ width: '52px', height: '52px' }}>
                            <i className="fa-solid fa-folder-tree fs-3"></i>
                        </div>
                        <div>
                            <h4 className="fw-bold text-dark mb-1 d-flex align-items-center gap-2">
                                Product Category Registry
                            </h4>
                            <p className="text-secondary mb-0" style={{ fontSize: '0.88rem' }}>
                                Organize inventory hierarchically (e.g. <i>Tiles &gt; Ceramic Tiles</i>), define UOM units, and configure product specifications.
                            </p>
                        </div>
                    </div>
                    <button className="btn btn-primary btn-md fw-bold px-4 py-2 rounded-3 shadow-xs d-flex align-items-center gap-2" onClick={handleOpenCreate} style={{ fontSize: '0.9rem' }}>
                        <i className="fa-solid fa-plus fs-6"></i> Add Category
                    </button>
                </div>
            </div>

            {/* Category Table Card */}
            <div className="card border-0 shadow-sm p-4 mb-4 rounded-4" style={{ borderRadius: '16px', backgroundColor: '#ffffff', border: '1px solid #e2e8f0' }}>
                {/* Search, Filter & Per-Page Controls */}
                <div className="row g-3 align-items-center mb-4">
                    <div className="col-md-5">
                        <div className="input-group">
                            <span className="input-group-text bg-white border-end-0 text-muted px-3">
                                <i className="fa-solid fa-magnifying-glass"></i>
                            </span>
                            <input
                                type="text"
                                className="form-control border-start-0 ps-0 fw-medium"
                                style={{ fontSize: '0.9rem' }}
                                placeholder="Search category, slug, units, parent..."
                                value={searchTerm}
                                onChange={(e) => {
                                    setSearchTerm(e.target.value);
                                    setCurrentPage(1);
                                }}
                            />
                            {searchTerm && (
                                <button 
                                    className="btn btn-outline-secondary border-start-0 bg-white text-muted"
                                    onClick={() => {
                                        setSearchTerm('');
                                        setCurrentPage(1);
                                    }}
                                    type="button"
                                >
                                    <i className="fa-solid fa-xmark"></i>
                                </button>
                            )}
                        </div>
                    </div>

                    <div className="col-md-4 col-6">
                        <select 
                            className="form-select fw-medium"
                            style={{ fontSize: '0.9rem' }}
                            value={statusFilter}
                            onChange={(e) => {
                                setStatusFilter(e.target.value);
                                setCurrentPage(1);
                            }}
                        >
                            <option value="all">All Statuses ({categories.length})</option>
                            <option value="active">Active Only ({categories.filter(c => c.is_active === 1 || c.is_active === true).length})</option>
                            <option value="inactive">Inactive Only ({categories.filter(c => c.is_active === 0 || c.is_active === false).length})</option>
                        </select>
                    </div>

                    <div className="col-md-3 col-6">
                        <select 
                            className="form-select fw-medium"
                            style={{ fontSize: '0.9rem' }}
                            value={perPage}
                            onChange={(e) => {
                                setPerPage(parseInt(e.target.value, 10));
                                setCurrentPage(1);
                            }}
                        >
                            <option value={10}>10 per page</option>
                            <option value={25}>25 per page</option>
                            <option value={50}>50 per page</option>
                            <option value={100}>100 per page</option>
                        </select>
                    </div>
                </div>

                {loading ? (
                    <div className="text-center py-5">
                        <div className="spinner-border text-primary" role="status"></div>
                        <div className="mt-2 text-secondary font-monospace fw-semibold" style={{ fontSize: '0.9rem' }}>Fetching categories catalog...</div>
                    </div>
                ) : (
                    <>
                        <div className="table-responsive">
                            <table className="table table-hover align-middle mb-0">
                                <thead>
                                    <tr className="text-secondary text-uppercase border-bottom" style={{ fontSize: '0.8rem', letterSpacing: '0.04em', fontWeight: 700 }}>
                                        <th style={{ width: '24%' }}>Category Name</th>
                                        <th style={{ width: '18%' }}>Parent Category</th>
                                        <th style={{ width: '32%' }}>
                                            Default Units (UOM)
                                            <span className="text-secondary font-monospace ms-1.5 fw-normal" style={{ fontSize: '0.74rem', textTransform: 'none' }}>
                                                [B: Base | P: Purchase | S: Sales]
                                            </span>
                                        </th>
                                        <th className="text-center" style={{ width: '8%' }}>Order</th>
                                        <th className="text-center" style={{ width: '10%' }}>Status</th>
                                        <th className="text-end" style={{ width: '8%' }}>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {paginatedCategories.map((c) => {
                                        const baseSym = getUnitSymbol(c.default_base_unit_id, c.default_base_unit);
                                        const purSym = getUnitSymbol(c.default_purchase_unit_id, c.default_purchase_unit);
                                        const saleSym = getUnitSymbol(c.default_sales_unit_id, c.default_sales_unit);
                                        const hasUnits = baseSym || purSym || saleSym;

                                        return (
                                            <tr key={c.id} style={{ height: '56px' }}>
                                                <td>
                                                    <div className="d-flex align-items-center gap-2">
                                                        <div className="d-flex align-items-center justify-content-center bg-primary-subtle text-primary rounded-2 p-1.5" style={{ width: '32px', height: '32px' }}>
                                                            <i className="fa-solid fa-th"></i>
                                                        </div>
                                                        <div>
                                                            <div className="fw-bold text-dark" style={{ fontSize: '0.94rem' }}>{c.name}</div>
                                                            <div className="font-monospace text-muted" style={{ fontSize: '0.78rem' }}>{c.slug}</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td>
                                                    {c.parent ? (
                                                        <span className="badge bg-light text-dark border font-normal px-2.5 py-1.5" style={{ fontSize: '0.84rem' }}>
                                                            <i className="fa-solid fa-diagram-nested text-secondary me-1.5"></i>{c.parent.name}
                                                        </span>
                                                    ) : (
                                                        <span className="text-muted italic opacity-60" style={{ fontSize: '0.84rem' }}>Root Category</span>
                                                    )}
                                                </td>
                                                <td>
                                                    {hasUnits ? (
                                                        <div className="d-flex align-items-center gap-1 flex-wrap">
                                                            {baseSym && (
                                                                <span 
                                                                    className="badge bg-primary-subtle text-primary border border-primary-subtle font-monospace px-2.5 py-1.5"
                                                                    style={{ fontSize: '0.82rem' }}
                                                                    title={`Base Stock Unit: ${getUnitFullName(c.default_base_unit_id, c.default_base_unit)}`}
                                                                >
                                                                    <span className="text-secondary opacity-75 me-1" style={{ fontSize: '0.7rem' }}>B:</span>{baseSym}
                                                                </span>
                                                            )}
                                                            {purSym && (
                                                                <span 
                                                                    className="badge bg-info-subtle text-info-emphasis border border-info-subtle font-monospace px-2.5 py-1.5"
                                                                    style={{ fontSize: '0.82rem' }}
                                                                    title={`Purchase Unit: ${getUnitFullName(c.default_purchase_unit_id, c.default_purchase_unit)}`}
                                                                >
                                                                    <span className="text-secondary opacity-75 me-1" style={{ fontSize: '0.7rem' }}>P:</span>{purSym}
                                                                </span>
                                                            )}
                                                            {saleSym && (
                                                                <span 
                                                                    className="badge bg-success-subtle text-success border border-success-subtle font-monospace px-2.5 py-1.5"
                                                                    style={{ fontSize: '0.82rem' }}
                                                                    title={`Sales Unit: ${getUnitFullName(c.default_sales_unit_id, c.default_sales_unit)}`}
                                                                >
                                                                    <span className="text-secondary opacity-75 me-1" style={{ fontSize: '0.7rem' }}>S:</span>{saleSym}
                                                                </span>
                                                            )}
                                                        </div>
                                                    ) : (
                                                        <span className="text-muted italic opacity-50" style={{ fontSize: '0.84rem' }}>-</span>
                                                    )}
                                                </td>
                                                <td className="text-center font-monospace text-secondary fw-semibold" style={{ fontSize: '0.88rem' }}>{c.sort_order}</td>
                                                <td className="text-center">
                                                    {c.is_active === 1 || c.is_active === true ? (
                                                        <span className="badge bg-success-subtle text-success px-2.5 py-1.5 fw-semibold" style={{ fontSize: '0.8rem' }}>
                                                            <i className="fa-solid fa-circle me-1.5" style={{ fontSize: '0.45rem' }}></i> Active
                                                        </span>
                                                    ) : (
                                                        <span className="badge bg-secondary-subtle text-secondary px-2.5 py-1.5 fw-semibold" style={{ fontSize: '0.8rem' }}>
                                                            <i className="fa-solid fa-circle me-1.5" style={{ fontSize: '0.45rem' }}></i> Inactive
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="text-end">
                                                    <div className="btn-group btn-group-sm">
                                                        <button
                                                            className="btn btn-sm btn-light text-info border-0 px-2.5 py-1.5"
                                                            onClick={() => handleOpenAttributesModal(c)}
                                                            title="Configure Product Specification Attributes (Specs)"
                                                        >
                                                            <i className="fa-solid fa-sliders"></i>
                                                        </button>
                                                        <button
                                                            className="btn btn-sm btn-light text-primary border-0 px-2.5 py-1.5"
                                                            onClick={() => handleOpenEdit(c)}
                                                            title="Edit Category"
                                                        >
                                                            <i className="fa-solid fa-pen-to-square"></i>
                                                        </button>
                                                        {c.is_active === 1 || c.is_active === true ? (
                                                            <button
                                                                className="btn btn-sm btn-light text-warning border-0 px-2.5 py-1.5"
                                                                onClick={() => handleToggleStatus(c)}
                                                                title="Deactivate Category"
                                                            >
                                                                <i className="fa-solid fa-ban"></i>
                                                            </button>
                                                        ) : (
                                                            <button
                                                                className="btn btn-sm btn-light text-success border-0 px-2.5 py-1.5"
                                                                onClick={() => handleToggleStatus(c)}
                                                                title="Activate Category"
                                                            >
                                                                <i className="fa-solid fa-circle-check"></i>
                                                            </button>
                                                        )}
                                                        <button
                                                            className="btn btn-sm btn-light text-danger border-0 px-2.5 py-1.5"
                                                            onClick={() => handleDelete(c)}
                                                            title="Delete Category"
                                                        >
                                                            <i className="fa-solid fa-trash-can"></i>
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                    {filteredCategories.length === 0 && (
                                        <tr>
                                            <td colSpan="6" className="text-center py-5">
                                                <div className="text-muted mb-2">
                                                    <i className="fa-solid fa-filter-circle-xmark fs-2 opacity-50"></i>
                                                </div>
                                                <div className="fw-bold text-secondary mb-1" style={{ fontSize: '0.94rem' }}>No matching categories found</div>
                                                <p className="text-muted mb-3" style={{ fontSize: '0.84rem' }}>Try adjusting your search query or status filter.</p>
                                                {(searchTerm || statusFilter !== 'all') && (
                                                    <button 
                                                        className="btn btn-outline-primary btn-sm px-3 fw-semibold"
                                                        onClick={() => {
                                                            setSearchTerm('');
                                                            setStatusFilter('all');
                                                            setCurrentPage(1);
                                                        }}
                                                    >
                                                        <i className="fa-solid fa-rotate-left me-1.5"></i> Clear Search Filters
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination & Summary Footer */}
                        {filteredCategories.length > 0 && (
                            <div className="d-flex flex-column flex-md-row align-items-center justify-content-between pt-3 border-top gap-3">
                                <div className="text-secondary" style={{ fontSize: '0.86rem' }}>
                                    Showing <span className="fw-bold text-dark">{indexOfFirstItem + 1}</span> to <span className="fw-bold text-dark">{indexOfLastItem}</span> of <span className="fw-bold text-dark">{filteredCategories.length}</span> categories
                                    {categories.length !== filteredCategories.length && (
                                        <span className="ms-1.5 text-muted">(filtered from {categories.length} total)</span>
                                    )}
                                </div>

                                <nav aria-label="Category pagination">
                                    <ul className="pagination pagination-sm mb-0">
                                        <li className={`page-item ${safeCurrentPage === 1 ? 'disabled' : ''}`}>
                                            <button className="page-link" onClick={() => setCurrentPage(1)} disabled={safeCurrentPage === 1} title="First Page">
                                                <i className="fa-solid fa-angles-left"></i>
                                            </button>
                                        </li>
                                        <li className={`page-item ${safeCurrentPage === 1 ? 'disabled' : ''}`}>
                                            <button className="page-link" onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} disabled={safeCurrentPage === 1}>
                                                Previous
                                            </button>
                                        </li>

                                        {Array.from({ length: totalPages }, (_, i) => i + 1)
                                            .filter(page => page === 1 || page === totalPages || Math.abs(page - safeCurrentPage) <= 1)
                                            .map((page, idx, arr) => {
                                                const prevPage = arr[idx - 1];
                                                const showEllipsis = prevPage && page - prevPage > 1;
                                                return (
                                                    <React.Fragment key={page}>
                                                        {showEllipsis && <li className="page-item disabled"><span className="page-link">...</span></li>}
                                                        <li className={`page-item ${safeCurrentPage === page ? 'active' : ''}`}>
                                                            <button className="page-link fw-bold" onClick={() => setCurrentPage(page)}>
                                                                {page}
                                                            </button>
                                                        </li>
                                                    </React.Fragment>
                                                );
                                            })}

                                        <li className={`page-item ${safeCurrentPage === totalPages ? 'disabled' : ''}`}>
                                            <button className="page-link" onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} disabled={safeCurrentPage === totalPages}>
                                                Next
                                            </button>
                                        </li>
                                        <li className={`page-item ${safeCurrentPage === totalPages ? 'disabled' : ''}`}>
                                            <button className="page-link" onClick={() => setCurrentPage(totalPages)} disabled={safeCurrentPage === totalPages} title="Last Page">
                                                <i className="fa-solid fa-angles-right"></i>
                                            </button>
                                        </li>
                                    </ul>
                                </nav>
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* CREATE / EDIT MODAL */}
            {showModal && (
                <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0, 0, 0, 0.55)', zIndex: 1070 }}>
                    <div className="modal-dialog modal-dialog-centered">
                        <div className="modal-content border-0 shadow-lg" style={{ borderRadius: '16px' }}>
                            <div className="modal-header border-bottom pb-3 pt-4 px-4">
                                <h5 className="modal-title fw-bold text-dark d-flex align-items-center gap-2">
                                    <i className="fa-solid fa-folder-tree text-primary"></i>
                                    {modalMode === 'create' ? 'Add Product Category' : 'Edit Product Category'}
                                </h5>
                                <button type="button" className="btn-close" onClick={() => setShowModal(false)} aria-label="Close"></button>
                            </div>
                            <form onSubmit={handleSubmit}>
                                <div className="modal-body px-4 py-3" style={{ fontSize: '0.9rem' }}>
                                    <div className="mb-3">
                                        <label className="form-label fw-bold text-dark mb-1">Category Name *</label>
                                        <input
                                            type="text"
                                            className="form-control fw-medium"
                                            value={form.name}
                                            onChange={(e) => handleChange('name', e.target.value)}
                                            placeholder="e.g. GVT Tiles, Bathware, Adhesive"
                                            required
                                        />
                                    </div>

                                    <div className="mb-3">
                                        <label className="form-label fw-bold text-dark mb-1">
                                            Slug {modalMode === 'edit' ? '(Permanent)' : '(Optional)'}
                                        </label>
                                        <input
                                            type="text"
                                            className="form-control font-monospace fw-medium"
                                            value={form.slug}
                                            onChange={(e) => handleChange('slug', e.target.value.toLowerCase().replace(/[^a-z0-9-_]/g, '-'))}
                                            placeholder="e.g. gvt-tiles (auto-generated if left blank)"
                                            disabled={modalMode === 'edit'}
                                        />
                                        {modalMode === 'edit' && (
                                            <div className="form-text text-muted" style={{ fontSize: '0.78rem' }}>
                                                <i className="fa-solid fa-lock me-1.5"></i> Slug is permanent once created and cannot be modified.
                                            </div>
                                        )}
                                    </div>

                                    <div className="mb-3">
                                        <label className="form-label fw-bold text-dark mb-1">Parent Category</label>
                                        <select
                                            className="form-select fw-medium"
                                            value={form.parent_id}
                                            onChange={(e) => handleChange('parent_id', e.target.value)}
                                        >
                                            <option value="">None (Top-Level Root)</option>
                                            {parentOptions.map(p => (
                                                <option key={p.id} value={p.id}>{p.name}</option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* Standard Category Units (UOM Defaults) */}
                                    <div className="card bg-light border-0 p-3 mb-3 rounded-3">
                                        <div className="d-flex align-items-center gap-1.5 mb-2">
                                            <i className="fa-solid fa-ruler text-primary me-1"></i>
                                            <label className="form-label fw-bold text-dark mb-0" style={{ fontSize: '0.86rem' }}>Default Units of Measure (UOM)</label>
                                        </div>
                                        <div className="row g-2">
                                            <div className="col-md-4">
                                                <label className="form-label small fw-semibold text-secondary mb-1">Base Unit (Stock)</label>
                                                <select
                                                    className="form-select form-select-sm fw-medium"
                                                    value={form.default_base_unit_id}
                                                    onChange={(e) => handleChange('default_base_unit_id', e.target.value)}
                                                >
                                                    <option value="">-- {form.parent_id ? 'Inherit' : 'Select Base Unit'} --</option>
                                                    {units.map(u => (
                                                        <option key={u.id} value={u.id}>{u.name} ({u.symbol})</option>
                                                    ))}
                                                </select>
                                            </div>
                                            <div className="col-md-4">
                                                <label className="form-label small fw-semibold text-secondary mb-1">Default Purchase Unit</label>
                                                <select
                                                    className="form-select form-select-sm fw-medium"
                                                    value={form.default_purchase_unit_id}
                                                    onChange={(e) => handleChange('default_purchase_unit_id', e.target.value)}
                                                >
                                                    <option value="">-- {form.parent_id ? 'Inherit' : 'Select Purchase Unit'} --</option>
                                                    {units.map(u => (
                                                        <option key={u.id} value={u.id}>{u.name} ({u.symbol})</option>
                                                    ))}
                                                </select>
                                            </div>
                                            <div className="col-md-4">
                                                <label className="form-label small fw-semibold text-secondary mb-1">Default Sales Unit</label>
                                                <select
                                                    className="form-select form-select-sm fw-medium"
                                                    value={form.default_sales_unit_id}
                                                    onChange={(e) => handleChange('default_sales_unit_id', e.target.value)}
                                                >
                                                    <option value="">-- {form.parent_id ? 'Inherit' : 'Select Sales Unit'} --</option>
                                                    {units.map(u => (
                                                        <option key={u.id} value={u.id}>{u.name} ({u.symbol})</option>
                                                    ))}
                                                </select>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="mb-3">
                                        <label className="form-label fw-bold text-dark mb-1">Description</label>
                                        <textarea
                                            className="form-control fw-medium"
                                            value={form.description}
                                            onChange={(e) => handleChange('description', e.target.value)}
                                            placeholder="Brief description of the category..."
                                            rows="3"
                                        />
                                    </div>

                                    <div className="mb-3">
                                        <label className="form-label fw-bold text-dark mb-1">Sort Order</label>
                                        <input
                                            type="number"
                                            className="form-control font-monospace fw-medium"
                                            value={form.sort_order}
                                            onChange={(e) => handleChange('sort_order', e.target.value)}
                                            min="0"
                                            required
                                        />
                                    </div>

                                    <div className="form-check form-switch mt-2">
                                        <input
                                            className="form-check-input cursor-pointer"
                                            type="checkbox"
                                            id="managerCategoryIsActive"
                                            checked={form.is_active}
                                            onChange={(e) => handleChange('is_active', e.target.checked)}
                                        />
                                        <label className="form-check-label fw-semibold text-secondary cursor-pointer" htmlFor="managerCategoryIsActive">
                                            Category is active for products
                                        </label>
                                    </div>
                                </div>
                                <div className="modal-footer border-top-0 pb-4 px-4">
                                    <button type="button" className="btn btn-outline-secondary me-2 px-3 fw-semibold" onClick={() => setShowModal(false)}>
                                        Cancel
                                    </button>
                                    <button type="submit" className="btn btn-primary px-4 fw-bold">
                                        {modalMode === 'create' ? 'Save Category' : 'Update Category'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* CATEGORY ATTRIBUTES MANAGEMENT MODAL */}
            {showAttrModal && (
                <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0, 0, 0, 0.65)', zIndex: 1080 }}>
                    <div className="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
                        <div className="modal-content border-0 shadow-lg" style={{ borderRadius: '16px' }}>
                            <div className="modal-header border-bottom pb-3 pt-4 px-4 bg-light">
                                <div>
                                    <h5 className="modal-title fw-bold text-dark mb-0 d-flex align-items-center gap-2">
                                        <i className="fa-solid fa-sliders text-info fs-5"></i>
                                        Configure Specifications for "{selectedCategoryForAttrs?.name}"
                                    </h5>
                                    <small className="text-secondary" style={{ fontSize: '0.84rem' }}>
                                        Define required & optional product attributes for items created under this category.
                                    </small>
                                </div>
                                <button type="button" className="btn-close" onClick={() => setShowAttrModal(false)} aria-label="Close"></button>
                            </div>

                            <div className="modal-body px-4 py-4" style={{ maxHeight: '70vh', overflowY: 'auto', fontSize: '0.9rem' }}>
                                {attrLoading ? (
                                    <div className="text-center py-5">
                                        <div className="spinner-border text-info spinner-border-sm me-2"></div>
                                        <span className="text-secondary font-monospace fw-semibold">Loading category specifications...</span>
                                    </div>
                                ) : (
                                    <>
                                        {/* Status Header */}
                                        {directAttrs.length === 0 && inheritedFrom ? (
                                            <div className="alert alert-warning border-0 p-3 mb-4 rounded-3">
                                                <i className="fa-solid fa-code-branch me-2 text-warning"></i>
                                                Currently inheriting specification attributes from parent category <strong>"{inheritedFrom.name}"</strong>:
                                                <ul className="mb-0 mt-2 ps-3 text-dark">
                                                    {inheritedAttrs.map(a => (
                                                        <li key={a.attribute_id}>
                                                            <strong>{a.name}</strong> {a.unit_symbol ? `(${a.unit_symbol})` : ''} {a.is_required ? <span className="badge bg-danger ms-1">Required</span> : ''}
                                                        </li>
                                                    ))}
                                                </ul>
                                                <div className="mt-2 text-secondary" style={{ fontSize: '0.8rem' }}>
                                                    Adding direct attributes below will override parent inheritance for this category.
                                                </div>
                                            </div>
                                        ) : directAttrs.length === 0 ? (
                                            <div className="alert alert-light border p-3 mb-4 text-muted text-center rounded-3">
                                                <i className="fa-solid fa-circle-info me-1.5 text-info"></i>
                                                No direct attributes configured for this category yet. Add attributes below.
                                            </div>
                                        ) : (
                                            <div className="alert alert-info border-0 p-2.5 px-3 mb-4 rounded-3">
                                                <i className="fa-solid fa-sliders me-2 text-info"></i>
                                                Configured with <strong>{directAttrs.length}</strong> direct specification attribute(s).
                                            </div>
                                        )}

                                        {/* Add New Attribute Control */}
                                        <div className="card bg-light border-0 p-3 mb-4 rounded-3">
                                            <div className="d-flex align-items-center justify-content-between mb-2">
                                                <label className="form-label fw-bold text-dark mb-0">
                                                    Add Product Specification Attribute
                                                </label>
                                                <button
                                                    type="button"
                                                    className="btn btn-xs btn-outline-info fw-semibold"
                                                    onClick={() => setShowDefineAttrModal(!showDefineAttrModal)}
                                                >
                                                    <i className="fa-solid fa-plus-circle me-1.5"></i> {showDefineAttrModal ? 'Close Creator' : 'Define New Attribute'}
                                                </button>
                                            </div>

                                            {showDefineAttrModal && (
                                                <div className="card border border-info-subtle p-3 mb-3 rounded-3 bg-white shadow-sm">
                                                    <div className="d-flex align-items-center justify-content-between mb-2.5 border-bottom pb-2">
                                                        <h6 className="fw-bold text-dark mb-0">
                                                            <i className="fa-solid fa-plus-circle text-info me-2"></i> Define New Custom Product Attribute
                                                        </h6>
                                                        <button type="button" className="btn-close btn-sm" onClick={() => setShowDefineAttrModal(false)}></button>
                                                    </div>
                                                    <form onSubmit={handleCreateCustomAttribute}>
                                                        <div className="row g-2 align-items-end">
                                                            <div className="col-md-4">
                                                                <label className="form-label small fw-semibold text-secondary mb-1">
                                                                    Attribute Name <span className="text-danger">*</span>
                                                                </label>
                                                                <input
                                                                    type="text"
                                                                    className="form-control form-control-sm fw-medium"
                                                                    placeholder="e.g. Thickness, Water Absorption"
                                                                    value={newAttrForm.name}
                                                                    onChange={(e) => setNewAttrForm({ ...newAttrForm, name: e.target.value })}
                                                                    required
                                                                />
                                                            </div>
                                                            <div className="col-md-3">
                                                                <label className="form-label small fw-semibold text-secondary mb-1">
                                                                    Data Type <span className="text-danger">*</span>
                                                                </label>
                                                                <select
                                                                    className="form-select form-select-sm fw-medium"
                                                                    value={newAttrForm.type}
                                                                    onChange={(e) => setNewAttrForm({ ...newAttrForm, type: e.target.value })}
                                                                >
                                                                    <option value="string">String (Text)</option>
                                                                    <option value="decimal">Decimal (Numeric)</option>
                                                                    <option value="number">Integer Number</option>
                                                                    <option value="selection">Selection (Dropdown)</option>
                                                                </select>
                                                            </div>
                                                            <div className="col-md-3">
                                                                <label className="form-label small fw-semibold text-secondary mb-1">
                                                                    Default Unit (Optional)
                                                                </label>
                                                                <select
                                                                    className="form-select form-select-sm fw-medium"
                                                                    value={newAttrForm.unit_id}
                                                                    onChange={(e) => setNewAttrForm({ ...newAttrForm, unit_id: e.target.value })}
                                                                >
                                                                    <option value="">-- No Default Unit --</option>
                                                                    {units.map(u => (
                                                                        <option key={u.id} value={u.id}>{u.name} ({u.symbol})</option>
                                                                    ))}
                                                                </select>
                                                            </div>
                                                            <div className="col-md-2 d-flex gap-1">
                                                                <button type="submit" className="btn btn-sm btn-info text-white flex-grow-1 fw-bold" disabled={definingAttr}>
                                                                    {definingAttr ? <span className="spinner-border spinner-border-sm"></span> : <><i className="fa-solid fa-check me-1.5"></i> Create</>}
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </form>
                                                </div>
                                            )}

                                            <div className="input-group input-group-sm">
                                                <select
                                                    className="form-select fw-medium"
                                                    value={selectedNewAttrId}
                                                    onChange={(e) => setSelectedNewAttrId(e.target.value)}
                                                >
                                                    <option value="">-- Choose Attribute Definition --</option>
                                                    {availableSystemAttrs
                                                        .filter(sys => !directAttrs.some(d => d.attribute_id === sys.id))
                                                        .map(sys => (
                                                            <option key={sys.id} value={sys.id}>
                                                                {sys.name} {sys.unit_symbol ? `(${sys.unit_symbol})` : ''} [{sys.type}]
                                                            </option>
                                                        ))
                                                    }
                                                </select>
                                                <button
                                                    type="button"
                                                    className="btn btn-primary fw-bold"
                                                    onClick={handleAddAttributeToCategory}
                                                    disabled={!selectedNewAttrId}
                                                >
                                                    <i className="fa-solid fa-plus me-1.5"></i> Attach Attribute
                                                </button>
                                            </div>
                                        </div>

                                        {/* Table of Direct Attributes */}
                                        <h6 className="fw-bold text-dark mb-3">Direct Category Attributes Configuration</h6>
                                        {directAttrs.length === 0 ? (
                                            <div className="text-center py-4 border rounded-3 bg-white text-muted">
                                                No attributes assigned directly. Select an attribute above and click "Attach Attribute".
                                            </div>
                                        ) : (
                                            <div className="table-responsive bg-white border rounded-3">
                                                <table className="table table-hover align-middle mb-0">
                                                    <thead className="bg-light">
                                                        <tr className="text-muted font-monospace" style={{ fontSize: '0.8rem' }}>
                                                            <th style={{ width: '25%' }}>Attribute Name</th>
                                                            <th style={{ width: '15%' }}>Sort Order</th>
                                                            <th style={{ width: '15%' }}>Mandatory</th>
                                                            <th style={{ width: '35%' }}>Allowed Values (Optional)</th>
                                                            <th style={{ width: '10%' }} className="text-end">Action</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {directAttrs.map((attr, idx) => (
                                                            <tr key={attr.attribute_id}>
                                                                <td>
                                                                    <div className="fw-bold text-dark" style={{ fontSize: '0.92rem' }}>{attr.name}</div>
                                                                    <small className="text-muted font-monospace" style={{ fontSize: '0.78rem' }}>{attr.unit_symbol ? `Unit: ${attr.unit_symbol}` : `Type: ${attr.type}`}</small>
                                                                </td>
                                                                <td>
                                                                    <input
                                                                        type="number"
                                                                        className="form-control form-control-sm font-monospace fw-medium"
                                                                        style={{ maxWidth: '80px' }}
                                                                        value={attr.sort_order}
                                                                        onChange={(e) => handleUpdateDirectAttrField(idx, 'sort_order', e.target.value)}
                                                                        min="0"
                                                                    />
                                                                </td>
                                                                <td>
                                                                    <div className="form-check form-switch">
                                                                        <input
                                                                            className="form-check-input cursor-pointer"
                                                                            type="checkbox"
                                                                            checked={!!attr.is_required}
                                                                            onChange={(e) => handleUpdateDirectAttrField(idx, 'is_required', e.target.checked)}
                                                                            id={`req-check-${attr.attribute_id}`}
                                                                        />
                                                                        <label className="form-check-label text-muted cursor-pointer" htmlFor={`req-check-${attr.attribute_id}`} style={{ fontSize: '0.82rem' }}>
                                                                            {attr.is_required ? <span className="text-danger fw-bold">Required</span> : 'Optional'}
                                                                        </label>
                                                                    </div>
                                                                </td>
                                                                <td>
                                                                    <input
                                                                        type="text"
                                                                        className="form-control form-control-sm fw-medium"
                                                                        placeholder="e.g. Red, Blue, Green (comma-separated)"
                                                                        value={Array.isArray(attr.allowed_values) ? attr.allowed_values.join(', ') : (attr.allowed_values || '')}
                                                                        onChange={(e) => handleUpdateDirectAttrField(idx, 'allowed_values', e.target.value)}
                                                                    />
                                                                </td>
                                                                <td className="text-end">
                                                                    <button
                                                                        type="button"
                                                                        className="btn btn-xs btn-outline-danger px-2 py-1"
                                                                        onClick={() => handleRemoveAttributeFromCategory(idx)}
                                                                        title="Remove attribute from category"
                                                                    >
                                                                        <i className="fa-solid fa-trash"></i>
                                                                    </button>
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

                            <div className="modal-footer border-top pt-3 pb-4 px-4 bg-light">
                                <button type="button" className="btn btn-secondary px-3.5 btn-sm fw-semibold" onClick={() => setShowAttrModal(false)} disabled={attrSaving}>
                                    Cancel
                                </button>
                                <button type="button" className="btn btn-primary px-4 btn-sm fw-bold" onClick={handleSaveCategoryAttributes} disabled={attrSaving || attrLoading}>
                                    {attrSaving ? <span className="spinner-border spinner-border-sm me-2"></span> : <i className="fa-solid fa-floppy-disk me-1.5"></i>}
                                    Save Category Attributes
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
