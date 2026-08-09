import React, { useState, useEffect } from 'react';

export default function GRNSlabModal({ show, onClose, quantity, initialSlabs, onSave, productName }) {
    const [slabs, setSlabs] = useState([]);

    useEffect(() => {
        if (show) {
            const list = [];
            for (let i = 0; i < quantity; i++) {
                const existing = initialSlabs && initialSlabs[i] ? initialSlabs[i] : {};
                list.push({
                    length: existing.length || 120,
                    width: existing.width || 60,
                    thickness: existing.thickness || 20,
                    finish: existing.finish || 'POLISHED',
                    origin: existing.origin || 'IMPORT'
                });
            }
            setSlabs(list);
        }
    }, [show, quantity, initialSlabs]);

    if (!show) return null;

    const handleFieldChange = (index, field, value) => {
        const updated = [...slabs];
        updated[index][field] = value;
        setSlabs(updated);
    };

    const calculateArea = (length, width) => {
        return ((parseFloat(length || 0) * parseFloat(width || 0)) / 144.0).toFixed(2);
    };

    const totalArea = slabs.reduce((acc, slab) => {
        return acc + parseFloat(calculateArea(slab.length, slab.width));
    }, 0).toFixed(2);

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave(slabs);
        onClose();
    };

    return (
        <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)', zIndex: 1060 }}>
            <div className="modal-dialog modal-dialog-centered modal-lg">
                <div className="modal-content border-0 shadow-lg" style={{ borderRadius: '16px' }}>
                    <div className="modal-header border-bottom-0 pb-0 pt-4 px-4">
                        <div>
                            <h5 className="modal-title fw-bold text-dark">Slab Details Entry</h5>
                            <span className="text-muted small font-monospace">{productName} (Qty: {quantity})</span>
                        </div>
                        <button type="button" className="btn-close" onClick={onClose} aria-label="Close"></button>
                    </div>
                    <form onSubmit={handleSubmit}>
                        <div className="modal-body px-4 py-3" style={{ maxHeight: '60vh', overflowY: 'auto' }}>
                            <div className="table-responsive">
                                <table className="table table-hover align-middle">
                                    <thead>
                                        <tr className="text-secondary font-monospace" style={{ fontSize: '0.8rem' }}>
                                            <th style={{ width: '8%' }}>Slab #</th>
                                            <th>Length (in)</th>
                                            <th>Width (in)</th>
                                            <th>Thickness (mm)</th>
                                            <th>Finish</th>
                                            <th>Origin</th>
                                            <th className="text-end">Area (SF)</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {slabs.map((slab, index) => (
                                            <tr key={index}>
                                                <td className="fw-bold text-secondary font-monospace">#{index + 1}</td>
                                                <td>
                                                    <input
                                                        type="number"
                                                        className="form-control form-control-sm"
                                                        value={slab.length}
                                                        onChange={(e) => handleFieldChange(index, 'length', parseFloat(e.target.value) || 0)}
                                                        min="1"
                                                        required
                                                    />
                                                </td>
                                                <td>
                                                    <input
                                                        type="number"
                                                        className="form-control form-control-sm"
                                                        value={slab.width}
                                                        onChange={(e) => handleFieldChange(index, 'width', parseFloat(e.target.value) || 0)}
                                                        min="1"
                                                        required
                                                    />
                                                </td>
                                                <td>
                                                    <input
                                                        type="number"
                                                        className="form-control form-control-sm"
                                                        value={slab.thickness}
                                                        onChange={(e) => handleFieldChange(index, 'thickness', parseFloat(e.target.value) || 0)}
                                                        min="1"
                                                        required
                                                    />
                                                </td>
                                                <td>
                                                    <select
                                                        className="form-select form-select-sm"
                                                        value={slab.finish}
                                                        onChange={(e) => handleFieldChange(index, 'finish', e.target.value)}
                                                    >
                                                        <option value="POLISHED">Polished</option>
                                                        <option value="UNPOLISHED">Unpolished</option>
                                                        <option value="HONED">Honed</option>
                                                        <option value="FLAMED">Flamed</option>
                                                    </select>
                                                </td>
                                                <td>
                                                    <select
                                                        className="form-select form-select-sm"
                                                        value={slab.origin}
                                                        onChange={(e) => handleFieldChange(index, 'origin', e.target.value)}
                                                    >
                                                        <option value="IMPORT">Imported</option>
                                                        <option value="DOMESTIC">Domestic</option>
                                                    </select>
                                                </td>
                                                <td className="text-end fw-semibold font-monospace">
                                                    {calculateArea(slab.length, slab.width)} SF
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                        <div className="modal-footer border-top-0 d-flex justify-content-between pb-4 px-4">
                            <div className="text-dark">
                                <span className="text-muted small font-monospace">Aggregate Area:</span>{' '}
                                <strong className="fs-5 font-monospace" style={{ color: 'var(--accent-color)' }}>
                                    {totalArea} SQFT
                                </strong>
                            </div>
                            <div>
                                <button type="button" className="btn btn-outline-secondary me-2 px-3" onClick={onClose}>
                                    Cancel
                                </button>
                                <button type="submit" className="btn btn-primary px-4">
                                    Save Slab Details
                                </button>
                            </div>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
