import React, { useState } from 'react';
import GRNSlabModal from './GRNSlabModal';

export default function GRNItemsTable({ items, onChange, products, units, purchaseOrder, readOnly }) {
    const [slabModalIndex, setSlabModalIndex] = useState(null);

    const handleItemChange = (index, field, value) => {
        const updated = [...items];
        
        if (field === 'product_variant_id') {
            const product = products.find(p => p.id === parseInt(value));
            updated[index] = {
                product_variant_id: value,
                quantity_received: 1,
                quantity_accepted: 1,
                quantity_rejected: 0,
                unit_id: product?.purchase_unit_id || product?.base_unit_id || '',
                slabs: [],
                purchase_order_item_id: null
            };
        } else {
            updated[index][field] = value;
            
            if (field === 'quantity_received') {
                updated[index].quantity_accepted = value;
                updated[index].quantity_rejected = 0;
            }
        }
        
        onChange(updated);
    };

    const handleAddItem = () => {
        onChange([
            ...items,
            {
                product_variant_id: '',
                quantity_received: 1,
                quantity_accepted: 1,
                quantity_rejected: 0,
                unit_id: '',
                slabs: [],
                purchase_order_item_id: null
            }
        ]);
    };

    const handleRemoveItem = (index) => {
        const updated = [...items];
        updated.splice(index, 1);
        onChange(updated);
    };

    const handleSlabSave = (slabs) => {
        if (slabModalIndex !== null) {
            const updated = [...items];
            updated[slabModalIndex].slabs = slabs;
            onChange(updated);
        }
    };

    const getProductBehavior = (variantId) => {
        const product = products.find(p => p.id === parseInt(variantId));
        return product?.inventory_behavior || 'STANDARD';
    };

    const getProductName = (variantId) => {
        const product = products.find(p => p.id === parseInt(variantId));
        return product?.name || '';
    };

    const handlePOSync = (index, poItemId) => {
        if (!purchaseOrder) return;
        const poItem = purchaseOrder.items.find(item => item.id === parseInt(poItemId));
        if (poItem) {
            const updated = [...items];
            updated[index].product_variant_id = poItem.product_variant_id;
            updated[index].purchase_order_item_id = poItem.id;
            updated[index].quantity_received = poItem.quantity - poItem.received_quantity;
            updated[index].quantity_accepted = poItem.quantity - poItem.received_quantity;
            updated[index].unit_id = poItem.unit_id;
            onChange(updated);
        }
    };

    return (
        <div className="card border-0 shadow-sm p-4 mb-4" style={{ borderRadius: '12px' }}>
            <h5 className="fw-bold mb-3 d-flex align-items-center justify-content-between">
                <span><i className="fa-solid fa-list-check me-2 text-primary"></i>GRN Line Items</span>
                {!readOnly && (
                    <button type="button" className="btn btn-sm btn-outline-primary px-3" onClick={handleAddItem}>
                        <i className="fa-solid fa-plus me-1"></i> Add Product
                    </button>
                )}
            </h5>

            <div className="table-responsive">
                <table className="table table-hover align-middle">
                    <thead>
                        <tr className="text-secondary font-monospace" style={{ fontSize: '0.8rem' }}>
                            <th style={{ width: '30%' }}>Product Variant</th>
                            {purchaseOrder && <th style={{ width: '15%' }}>PO Item / Ordered Qty</th>}
                            <th style={{ width: '12%' }}>Recv Qty</th>
                            <th style={{ width: '12%' }}>Unit</th>
                            <th style={{ width: '12%' }}>Accepted</th>
                            <th style={{ width: '12%' }}>Rejected</th>
                            <th style={{ width: '15%' }}>Action / Slabs</th>
                            {!readOnly && <th style={{ width: '5%' }}></th>}
                        </tr>
                    </thead>
                    <tbody>
                        {items.map((item, index) => {
                            const behavior = getProductBehavior(item.product_variant_id);
                            const product = products.find(p => p.id === parseInt(item.product_variant_id));
                            const baseUnit = units.find(u => u.id === product?.base_unit_id);
                            const recUnit = units.find(u => u.id === item.unit_id);
                            
                            return (
                                <tr key={index}>
                                    <td>
                                        {readOnly ? (
                                            <div>
                                                <div className="fw-bold text-dark">{getProductName(item.product_variant_id)}</div>
                                                <span className="badge bg-secondary-subtle text-secondary small font-monospace">{behavior}</span>
                                            </div>
                                        ) : (
                                            <div>
                                                <select
                                                    className="form-select form-select-sm"
                                                    value={item.product_variant_id}
                                                    onChange={(e) => handleItemChange(index, 'product_variant_id', e.target.value)}
                                                    required
                                                >
                                                    <option value="">-- Choose Variant --</option>
                                                    {products.map(p => (
                                                        <option key={p.id} value={p.id}>
                                                            {p.name} ({p.sku})
                                                        </option>
                                                    ))}
                                                </select>
                                                {item.product_variant_id && (
                                                    <span className="badge bg-light text-secondary font-monospace mt-1 px-2">{behavior}</span>
                                                )}
                                            </div>
                                        )}
                                    </td>
                                    {purchaseOrder && (
                                        <td>
                                            {readOnly ? (
                                                <span className="text-secondary small font-monospace">
                                                    Linked (PO Item #{item.purchase_order_item_id})
                                                </span>
                                            ) : (
                                                <select
                                                    className="form-select form-select-sm"
                                                    value={item.purchase_order_item_id || ''}
                                                    onChange={(e) => handlePOSync(index, e.target.value)}
                                                >
                                                    <option value="">-- Select PO Line --</option>
                                                    {purchaseOrder.items.map(poItem => (
                                                        <option key={poItem.id} value={poItem.id}>
                                                            {poItem.variant?.name} (Ordered: {poItem.quantity} {poItem.unit?.symbol}, Recv: {poItem.received_quantity})
                                                        </option>
                                                    ))}
                                                </select>
                                            )}
                                        </td>
                                    )}
                                    <td>
                                        <input
                                            type="number"
                                            className="form-control form-control-sm font-monospace"
                                            value={item.quantity_received}
                                            onChange={(e) => handleItemChange(index, 'quantity_received', parseFloat(e.target.value) || 0)}
                                            min="0.0001"
                                            step="any"
                                            required
                                            disabled={readOnly}
                                        />
                                    </td>
                                    <td>
                                        {readOnly ? (
                                            <span className="font-monospace fw-semibold text-secondary">{recUnit?.symbol}</span>
                                        ) : (
                                            <select
                                                className="form-select form-select-sm font-monospace"
                                                value={item.unit_id}
                                                onChange={(e) => handleItemChange(index, 'unit_id', e.target.value)}
                                                required
                                            >
                                                <option value="">-- Unit --</option>
                                                {units.map(u => (
                                                    <option key={u.id} value={u.id}>{u.symbol} - {u.name}</option>
                                                ))}
                                            </select>
                                        )}
                                    </td>
                                    <td>
                                        <input
                                            type="number"
                                            className="form-control form-control-sm font-monospace text-success border-success-subtle bg-success-subtle bg-opacity-10"
                                            value={item.quantity_accepted}
                                            onChange={(e) => handleItemChange(index, 'quantity_accepted', parseFloat(e.target.value) || 0)}
                                            min="0"
                                            step="any"
                                            required
                                            disabled={readOnly}
                                        />
                                    </td>
                                    <td>
                                        <input
                                            type="number"
                                            className="form-control form-control-sm font-monospace text-danger border-danger-subtle bg-danger-subtle bg-opacity-10"
                                            value={item.quantity_rejected}
                                            onChange={(e) => handleItemChange(index, 'quantity_rejected', parseFloat(e.target.value) || 0)}
                                            min="0"
                                            step="any"
                                            required
                                            disabled={readOnly}
                                        />
                                    </td>
                                    <td>
                                        {behavior === 'SLAB' ? (
                                            <div>
                                                <button
                                                    type="button"
                                                    className={`btn btn-xs w-100 ${item.slabs?.length === parseInt(item.quantity_received) ? 'btn-success' : 'btn-outline-warning'} font-monospace`}
                                                    onClick={() => setSlabModalIndex(index)}
                                                    disabled={!item.product_variant_id || readOnly}
                                                    style={{ fontSize: '0.75rem' }}
                                                >
                                                    <i className="fa-solid fa-ruler-combined me-1"></i>
                                                    {item.slabs?.length > 0 ? `Slabs: ${item.slabs.length}/${parseInt(item.quantity_received)}` : 'Enter Slabs'}
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="small text-muted font-monospace py-1 text-center">
                                                {baseUnit && recUnit && baseUnit.id !== recUnit.id ? (
                                                    <span>Converts to {baseUnit.symbol}</span>
                                                ) : (
                                                    <span>Standard bulk</span>
                                                )}
                                            </div>
                                        )}
                                    </td>
                                    {!readOnly && (
                                        <td>
                                            <button
                                                type="button"
                                                className="btn btn-sm btn-link text-danger border-0 p-1 bg-transparent shadow-none"
                                                onClick={() => handleRemoveItem(index)}
                                            >
                                                <i className="fa-solid fa-trash"></i>
                                            </button>
                                        </td>
                                    )}
                                </tr>
                            );
                        })}
                        {items.length === 0 && (
                            <tr>
                                <td colSpan={purchaseOrder ? 8 : 7} className="text-center py-4 text-muted font-monospace">
                                    No products added. Click 'Add Product' to begin receiving.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {slabModalIndex !== null && (
                <GRNSlabModal
                    show={slabModalIndex !== null}
                    onClose={() => setSlabModalIndex(null)}
                    quantity={parseInt(items[slabModalIndex]?.quantity_received || 0)}
                    initialSlabs={items[slabModalIndex]?.slabs || []}
                    onSave={handleSlabSave}
                    productName={getProductName(items[slabModalIndex]?.product_variant_id)}
                />
            )}
        </div>
    );
}
