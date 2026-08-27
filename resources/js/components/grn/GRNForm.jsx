import React, { useState, useEffect } from 'react';
import axios from 'axios';
import GRNItemsTable from './GRNItemsTable';
import GRNSummary from './GRNSummary';
import QuickWarehouseModal from './QuickWarehouseModal';
import QuickSupplierModal from './QuickSupplierModal';
import QuickStorageLocationModal from '../inventory/QuickStorageLocationModal';


export default function GRNForm({ grnId, onBack, onSaveSuccess }) {
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    const [showQuickWHModal, setShowQuickWHModal] = useState(false);
    const [showQuickSupplierModal, setShowQuickSupplierModal] = useState(false);
    const [showQuickSLModal, setShowQuickSLModal] = useState(false);


    // Form Contexts
    const [contexts, setContexts] = useState({
        suppliers: [],
        warehouses: [],
        storage_locations: [],
        units: [],
        product_variants: [],
        purchase_orders: []
    });

    // Form Fields
    const [formData, setFormData] = useState({
        warehouse_id: '',
        storage_location_id: '',
        purchase_order_id: '',
        supplier_id: '',
        received_date: new Date().toISOString().substring(0, 10),
        remarks: '',
        status: 'DRAFT',
        grn_number: '',
        items: []
    });

    const isReadOnly = formData.status === 'APPROVED';

    // Load form options
    useEffect(() => {
        const fetchContexts = async () => {
            setLoading(true);
            try {
                const token = localStorage.getItem('auth_token');
                const res = await axios.get('/api/grn/form-data', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setContexts(res.data);
                
                if (res.data.warehouses.length > 0) {
                    setFormData(prev => ({
                        ...prev,
                        warehouse_id: res.data.warehouses[0].id
                    }));
                }
            } catch (err) {
                setError('Failed to load system references/dropdown metadata.');
            } finally {
                setLoading(false);
            }
        };

        fetchContexts();
    }, []);

    // Load existing GRN if editing
    useEffect(() => {
        if (grnId) {
            const fetchGRN = async () => {
                try {
                    const token = localStorage.getItem('auth_token');
                    const res = await axios.get(`/api/grn/${grnId}`, {
                        headers: { Authorization: `Bearer ${token}` }
                    });
                    const grn = res.data.data;
                    
                    setFormData({
                        id: grn.id,
                        warehouse_id: grn.warehouse_id || '',
                        storage_location_id: grn.storage_location_id || '',
                        purchase_order_id: grn.purchase_order_id || '',
                        supplier_id: grn.supplier_id || '',
                        received_date: grn.received_date || '',
                        remarks: grn.remarks || '',
                        status: grn.status || 'DRAFT',
                        grn_number: grn.grn_number || '',
                        items: (grn.items || []).map(item => ({
                            product_variant_id: item.product_variant_id,
                            purchase_order_item_id: item.purchase_order_item_id,
                            unit_id: item.unit_id,
                            quantity_received: item.quantity_received,
                            quantity_accepted: item.quantity_accepted,
                            quantity_rejected: item.quantity_rejected,
                            slabs: item.slabs || []
                        }))
                    });
                } catch (err) {
                    setError('Failed to fetch the requested Goods Receipt Note details.');
                }
            };
            fetchGRN();
        }
    }, [grnId]);

    const handleHeaderChange = (field, value) => {
        setFormData(prev => {
            const updated = { ...prev, [field]: value };
            if (field === 'purchase_order_id' && value) {
                const po = contexts.purchase_orders.find(o => o.id === parseInt(value));
                if (po) {
                    updated.supplier_id = po.supplier_id || '';
                }
            }
            return updated;
        });
    };

    const handleItemsChange = (items) => {
        setFormData(prev => ({ ...prev, items }));
    };

    const handleSave = async (approveAfterSave = false) => {
        setSaving(true);
        setError(null);
        setSuccess(null);

        if (formData.items.length === 0) {
            setError('Please add at least one item line to the Goods Receipt Note.');
            setSaving(false);
            return;
        }

        for (let item of formData.items) {
            const variant = contexts.product_variants.find(p => p.id === parseInt(item.product_variant_id));
            if (variant?.inventory_behavior === 'SLAB') {
                const reqCount = parseInt(item.quantity_received || 0);
                if ((item.slabs || []).length !== reqCount) {
                    setError(`Slab detail entries count (${(item.slabs || []).length}) must match received quantity (${reqCount}) for: ${variant.name}`);
                    setSaving(false);
                    return;
                }
            }
        }

        try {
            const token = localStorage.getItem('auth_token');
            const url = grnId ? `/api/grn/${grnId}` : '/api/grn';
            const method = grnId ? 'put' : 'post';

            const res = await axios[method](url, formData, {
                headers: { Authorization: `Bearer ${token}` }
            });

            const savedGrn = res.data.data;

            if (approveAfterSave) {
                await axios.post(`/api/grn/${savedGrn.id}/approve`, {}, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setSuccess('Goods Receipt Note approved and posted to inventory successfully!');
                setTimeout(() => onSaveSuccess(), 1500);
            } else {
                setSuccess('Draft Goods Receipt Note saved successfully!');
                setTimeout(() => onSaveSuccess(), 1500);
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to save Goods Receipt Note. Please check validations.');
        } finally {
            setSaving(false);
        }
    };

    const filteredLocations = contexts.storage_locations.filter(
        loc => loc.warehouse_id === parseInt(formData.warehouse_id)
    );

    const selectedPO = contexts.purchase_orders.find(o => o.id === parseInt(formData.purchase_order_id));

    if (loading) {
        return (
            <div className="text-center py-5">
                <div className="spinner-border text-primary" role="status"></div>
                <span className="ms-2 font-monospace">Loading forms framework...</span>
            </div>
        );
    }

    return (
        <div className="animate__animated animate__fadeIn">
            <div className="d-flex align-items-center justify-content-between mb-4">
                <div>
                    <h3 className="fw-bold text-dark">
                        <i className="fa-solid fa-file-invoice me-2 text-primary"></i>
                        {grnId ? `Edit GRN: ${formData.grn_number || 'Draft'}` : 'New Goods Receipt Note'}
                    </h3>
                    <p className="text-muted small mb-0">Record incoming stock inventory into a storage yard.</p>
                </div>
                <button className="btn btn-outline-secondary px-3" onClick={onBack}>
                    <i className="fa-solid fa-arrow-left me-1"></i> Back to Listing
                </button>
            </div>

            {error && (
                <div className="alert alert-danger d-flex align-items-center animate__animated animate__shakeX" role="alert">
                    <i className="fa-solid fa-circle-exclamation me-2"></i>
                    <div>{error}</div>
                </div>
            )}

            {success && (
                <div className="alert alert-success d-flex align-items-center animate__animated animate__fadeIn" role="alert">
                    <i className="fa-solid fa-circle-check me-2"></i>
                    <div>{success}</div>
                </div>
            )}

            <div className="card border-0 shadow-sm p-4 mb-4" style={{ borderRadius: '12px' }}>
                <h5 className="fw-bold mb-3"><i className="fa-solid fa-circle-info me-2 text-primary"></i>Header Context</h5>
                <div className="row g-3">
                    <div className="col-md-3">
                        <div className="d-flex justify-content-between align-items-center mb-1">
                            <label className="form-label small fw-semibold mb-0">Received at Warehouse</label>
                            {!isReadOnly && (
                                <button
                                    type="button"
                                    className="btn btn-link p-0 text-primary small text-decoration-none fw-semibold"
                                    onClick={() => setShowQuickWHModal(true)}
                                    style={{ fontSize: '0.75rem' }}
                                >
                                    <i className="fa-solid fa-plus me-1"></i> Add New
                                </button>
                            )}
                        </div>
                        <select
                            className="form-select form-select-sm"
                            value={formData.warehouse_id}
                            onChange={(e) => handleHeaderChange('warehouse_id', e.target.value)}
                            disabled={isReadOnly}
                            required
                        >
                            <option value="">-- Choose Warehouse --</option>
                            {contexts.warehouses.map(w => (
                                <option key={w.id} value={w.id}>{w.name} ({w.code})</option>
                            ))}
                        </select>
                    </div>

                    <div className="col-md-3">
                        <div className="d-flex justify-content-between align-items-center mb-1">
                            <label className="form-label small fw-semibold mb-0">To Storage Location</label>
                            {!isReadOnly && formData.warehouse_id && (
                                <button
                                    type="button"
                                    className="btn btn-link p-0 text-primary small text-decoration-none fw-semibold"
                                    onClick={() => setShowQuickSLModal(true)}
                                    style={{ fontSize: '0.75rem' }}
                                >
                                    <i className="fa-solid fa-plus me-1"></i> Add New
                                </button>
                            )}
                        </div>
                        <select
                            className="form-select form-select-sm"
                            value={formData.storage_location_id}
                            onChange={(e) => handleHeaderChange('storage_location_id', e.target.value)}
                            disabled={isReadOnly}
                        >
                            <option value="">-- Main Floor / default --</option>
                            {filteredLocations.map(loc => (
                                <option key={loc.id} value={loc.id}>{loc.name} ({loc.code})</option>
                            ))}
                        </select>
                    </div>

                    <div className="col-md-3">
                        <label className="form-label small fw-semibold">Reference Purchase Order (Optional)</label>
                        <select
                            className="form-select form-select-sm"
                            value={formData.purchase_order_id}
                            onChange={(e) => handleHeaderChange('purchase_order_id', e.target.value)}
                            disabled={isReadOnly}
                        >
                            <option value="">-- Direct Receipt (No PO) --</option>
                            {contexts.purchase_orders.map(po => (
                                <option key={po.id} value={po.id}>{po.po_number} (Total: {po.total_amount} INR)</option>
                            ))}
                        </select>
                    </div>

                    <div className="col-md-3">
                        <div className="d-flex justify-content-between align-items-center mb-1">
                            <label className="form-label small fw-semibold mb-0">From Supplier</label>
                            {!isReadOnly && !formData.purchase_order_id && (
                                <button
                                    type="button"
                                    className="btn btn-link p-0 text-primary small text-decoration-none fw-semibold"
                                    onClick={() => setShowQuickSupplierModal(true)}
                                    style={{ fontSize: '0.75rem' }}
                                >
                                    <i className="fa-solid fa-plus me-1"></i> Add New
                                </button>
                            )}
                        </div>
                        {formData.purchase_order_id ? (
                            <input
                                type="text"
                                className="form-control form-control-sm bg-light"
                                value={selectedPO?.supplier?.name || 'Auto resolving...'}
                                disabled
                            />
                        ) : (
                            <select
                                className="form-select form-select-sm"
                                value={formData.supplier_id}
                                onChange={(e) => handleHeaderChange('supplier_id', e.target.value)}
                                disabled={isReadOnly}
                                required
                            >
                                <option value="">-- Choose Supplier --</option>
                                {contexts.suppliers.map(s => (
                                    <option key={s.id} value={s.id}>{s.name} ({s.code})</option>
                                ))}
                            </select>
                        )}
                    </div>

                    <div className="col-md-3">
                        <label className="form-label small fw-semibold">GRN Date</label>
                        <input
                            type="date"
                            className="form-control form-control-sm"
                            value={formData.received_date}
                            onChange={(e) => handleHeaderChange('received_date', e.target.value)}
                            disabled={isReadOnly}
                            required
                        />
                    </div>

                    <div className="col-md-9">
                        <label className="form-label small fw-semibold">Remarks</label>
                        <input
                            type="text"
                            className="form-control form-control-sm"
                            placeholder="Optional shipping details, invoice refs, etc."
                            value={formData.remarks}
                            onChange={(e) => handleHeaderChange('remarks', e.target.value)}
                            disabled={isReadOnly}
                        />
                    </div>
                </div>
            </div>

            <GRNItemsTable
                items={formData.items}
                onChange={handleItemsChange}
                products={contexts.product_variants}
                units={contexts.units}
                purchaseOrder={selectedPO}
                readOnly={isReadOnly}
                onProductCreated={(newVariant) => {
                    setContexts(prev => ({
                        ...prev,
                        product_variants: [...prev.product_variants, newVariant]
                    }));
                }}
            />

            <GRNSummary
                items={formData.items}
                products={contexts.product_variants}
                units={contexts.units}
            />

            <div className="d-flex align-items-center justify-content-end gap-2 py-4">
                <button className="btn btn-outline-secondary px-4" onClick={onBack} disabled={saving}>
                    Cancel
                </button>
                {!isReadOnly && (
                    <>
                        <button className="btn btn-secondary px-4 text-white" onClick={() => handleSave(false)} disabled={saving}>
                            {saving ? 'Saving...' : 'Save Draft'}
                        </button>
                        <button className="btn btn-primary px-4" onClick={() => handleSave(true)} disabled={saving}>
                            {saving ? 'Processing...' : 'Approve & Post to Stock'}
                        </button>
                    </>
                )}
            </div>

            <QuickWarehouseModal
                show={showQuickWHModal}
                onClose={() => setShowQuickWHModal(false)}
                onSave={(newWH) => {
                    setContexts(prev => ({
                        ...prev,
                        warehouses: [...prev.warehouses, newWH]
                    }));
                    setFormData(prev => ({
                        ...prev,
                        warehouse_id: newWH.id
                    }));
                }}
            />

            <QuickSupplierModal
                show={showQuickSupplierModal}
                onClose={() => setShowQuickSupplierModal(false)}
                onSave={(newSupplier) => {
                    setContexts(prev => ({
                        ...prev,
                        suppliers: [...prev.suppliers, newSupplier]
                    }));
                    setFormData(prev => ({
                        ...prev,
                        supplier_id: newSupplier.id
                    }));
                }}
            />

            <QuickStorageLocationModal
                show={showQuickSLModal}
                onClose={() => setShowQuickSLModal(false)}
                warehouseId={formData.warehouse_id}
                warehouses={contexts.warehouses}
                onSave={(newSL) => {
                    setContexts(prev => ({
                        ...prev,
                        storage_locations: [...prev.storage_locations, newSL]
                    }));
                    setFormData(prev => ({
                        ...prev,
                        storage_location_id: newSL.id
                    }));
                }}
            />
        </div>
    );
}
