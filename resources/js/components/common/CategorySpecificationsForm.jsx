import React, { useState, useEffect } from 'react';
import axios from 'axios';

const UNIT_TO_MM = {
    mm: 1.0,
    milimeter: 1.0,
    millimeter: 1.0,
    cm: 10.0,
    centimeter: 10.0,
    m: 1000.0,
    meter: 1000.0,
    in: 25.4,
    inch: 25.4,
    ft: 304.8,
    feet: 304.8
};

const DEFAULT_LENGTH_UNITS = [
    { symbol: 'cm', name: 'centimeter' },
    { symbol: 'mm', name: 'millimeter' },
    { symbol: 'in', name: 'inch' },
    { symbol: 'ft', name: 'feet' }
];

export default function CategorySpecificationsForm({ categoryId, values = {}, onChange }) {
    const [specifications, setSpecifications] = useState([]);
    const [loading, setLoading] = useState(false);
    const [categoryInfo, setCategoryInfo] = useState(null);
    const [lengthUnits, setLengthUnits] = useState(DEFAULT_LENGTH_UNITS);
    const [selectedUnitState, setSelectedUnitState] = useState('cm');
    const [thicknessUnitState, setThicknessUnitState] = useState('mm');

    useEffect(() => {
        if (!categoryId) {
            setSpecifications([]);
            setCategoryInfo(null);
            return;
        }

        const fetchSpecifications = async () => {
            setLoading(true);
            try {
                const token = localStorage.getItem('auth_token');
                const res = await axios.get(`/api/categories/${categoryId}/specifications`, {
                    headers: token ? { Authorization: `Bearer ${token}` } : {}
                });
                const data = res.data || {};
                const specs = data.specifications || [];
                setSpecifications(specs);
                if (data.length_units && data.length_units.length > 0) {
                    setLengthUnits(data.length_units);
                }
                setCategoryInfo({
                    id: data.category_id,
                    name: data.category_name,
                    slug: data.category_slug
                });

                const dimUnitAttr = specs.find(s => s.slug === 'dimension-unit');
                const thickUnitAttr = specs.find(s => s.slug === 'thickness-unit');

                // Determine initial length/width unit if available
                const existingUnit = (dimUnitAttr && values[dimUnitAttr.attribute_id])
                    ? values[dimUnitAttr.attribute_id]
                    : (values['dimension-unit'] || values['dimension_unit']);
                if (existingUnit) {
                    setSelectedUnitState(existingUnit.toLowerCase());
                }

                // Determine initial thickness unit if available
                const existingThickUnit = (thickUnitAttr && values[thickUnitAttr.attribute_id])
                    ? values[thickUnitAttr.attribute_id]
                    : (values['thickness-unit'] || values['thickness_unit']);
                if (existingThickUnit) {
                    setThicknessUnitState(existingThickUnit.toLowerCase());
                }
            } catch (err) {
                console.error('Failed to load category specifications:', err);
                setSpecifications([]);
            } finally {
                setLoading(false);
            }
        };

        fetchSpecifications();
    }, [categoryId]);

    if (!categoryId) {
        return (
            <div className="alert alert-light border text-muted small mb-0">
                <i className="fa-solid fa-info-circle me-1"></i> Please select a product category above to enter category product details.
            </div>
        );
    }

    if (loading) {
        return (
            <div className="alert alert-light border py-3 text-center text-muted small mb-0">
                <div className="spinner-border spinner-border-sm me-2 text-primary" role="status"></div>
                Loading specifications for selected category...
            </div>
        );
    }

    if (specifications.length === 0) {
        return (
            <div className="alert alert-light border text-muted small mb-0">
                <i className="fa-solid fa-circle-info me-1 text-primary"></i> No additional category specifications configured for <strong>{categoryInfo?.name || 'this category'}</strong>.
            </div>
        );
    }

    // Helper to find attribute by slug
    const tileSizeAttr = specifications.find(s => s.slug === 'tile-size');
    const lengthAttr = specifications.find(s => s.slug === 'length');
    const widthAttr = specifications.find(s => s.slug === 'width');
    const thicknessAttr = specifications.find(s => s.slug === 'thickness');
    const thicknessUnitAttr = specifications.find(s => s.slug === 'thickness-unit');
    const dimensionUnitAttr = specifications.find(s => s.slug === 'dimension-unit');

    const isTileCategory = !!tileSizeAttr || (categoryInfo?.slug && (
        categoryInfo.slug.includes('tile') ||
        categoryInfo.slug.includes('vitrified')
    ));

    const isSlabCategory = (categoryInfo?.slug === 'granite-slabs' || categoryInfo?.slug === 'marble-slabs') ||
        (!tileSizeAttr && lengthAttr && widthAttr);

    const hasDimensions = isTileCategory || isSlabCategory || (lengthAttr && widthAttr);

    // Length & Width Unit Selection
    const currentUnit = (dimensionUnitAttr && values[dimensionUnitAttr.attribute_id])
        ? values[dimensionUnitAttr.attribute_id].toLowerCase()
        : (values['dimension-unit'] || values['dimension_unit'] || selectedUnitState || 'cm').toLowerCase();

    // Independent Thickness Unit Selection
    const currentThicknessUnit = (thicknessUnitAttr && values[thicknessUnitAttr.attribute_id])
        ? values[thicknessUnitAttr.attribute_id].toLowerCase()
        : (values['thickness-unit'] || values['thickness_unit'] || thicknessUnitState || 'mm').toLowerCase();

    // Handle Length Change
    const handleLengthChange = (e) => {
        const val = e.target.value;
        const updates = {};
        if (lengthAttr) updates[lengthAttr.attribute_id] = val;
        
        if (tileSizeAttr) {
            const w = widthAttr ? (values[widthAttr.attribute_id] || '') : '';
            updates[tileSizeAttr.attribute_id] = val && w ? `${val} × ${w} ${currentUnit}` : '';
        }
        onChange(updates);
    };

    // Handle Width Change
    const handleWidthChange = (e) => {
        const val = e.target.value;
        const updates = {};
        if (widthAttr) updates[widthAttr.attribute_id] = val;

        if (tileSizeAttr) {
            const l = lengthAttr ? (values[lengthAttr.attribute_id] || '') : '';
            updates[tileSizeAttr.attribute_id] = l && val ? `${l} × ${val} ${currentUnit}` : '';
        }
        onChange(updates);
    };

    // Handle Length & Width Unit Change
    const handleUnitChange = (e) => {
        const targetUnit = e.target.value.toLowerCase();
        setSelectedUnitState(targetUnit);
        const updates = {};

        if (dimensionUnitAttr) {
            updates[dimensionUnitAttr.attribute_id] = targetUnit;
        } else {
            updates['dimension-unit'] = targetUnit;
        }

        const oldMult = UNIT_TO_MM[currentUnit] || 10.0;
        const newMult = UNIT_TO_MM[targetUnit] || 10.0;

        let lenVal = lengthAttr ? values[lengthAttr.attribute_id] : '';
        let widVal = widthAttr ? values[widthAttr.attribute_id] : '';

        if (lengthAttr && lenVal && !isNaN(parseFloat(lenVal))) {
            // const oldLen = parseFloat(lenVal);
            // const convertedLen = (oldLen * oldMult) / newMult;
            // lenVal = Number.isInteger(convertedLen) ? convertedLen.toString() : convertedLen.toFixed(2);
            updates[lengthAttr.attribute_id] = lenVal;
        }

        if (widthAttr && widVal && !isNaN(parseFloat(widVal))) {
            //const oldWid = parseFloat(widVal);
            //const convertedWid = (oldWid * oldMult) / newMult;
            //widVal = Number.isInteger(convertedWid) ? convertedWid.toString() : convertedWid.toFixed(2);
            updates[widthAttr.attribute_id] = widVal;
        }

        if (tileSizeAttr && lenVal && widVal) {
            updates[tileSizeAttr.attribute_id] = `${lenVal} ${targetUnit} x ${widVal} ${targetUnit}`;
        }

        onChange(updates);
    };

    // Handle Thickness Change
    const handleThicknessChange = (e) => {
        if (thicknessAttr) {
            onChange({ [thicknessAttr.attribute_id]: e.target.value });
        }
    };

    // Handle Independent Thickness Unit Change
    const handleThicknessUnitChange = (e) => {
        const targetUnit = e.target.value.toLowerCase();
        setThicknessUnitState(targetUnit);
        const updates = {};

        if (thicknessUnitAttr) {
            updates[thicknessUnitAttr.attribute_id] = targetUnit;
        } else {
            updates['thickness-unit'] = targetUnit;
        }

        const oldMult = UNIT_TO_MM[currentThicknessUnit] || 1.0;
        const newMult = UNIT_TO_MM[targetUnit] || 1.0;

        if (thicknessAttr && values[thicknessAttr.attribute_id] && !isNaN(parseFloat(values[thicknessAttr.attribute_id]))) {
            // const oldThick = parseFloat(values[thicknessAttr.attribute_id]);
            // const convertedThick = (oldThick * oldMult) / newMult;
            // updates[thicknessAttr.attribute_id] = Number.isInteger(convertedThick) ? convertedThick.toString() : convertedThick.toFixed(2);
            updates[thicknessAttr.attribute_id] = values[thicknessAttr.attribute_id];
        }

        onChange(updates);
    };

    // Calculate Area & Normalization
    const lengthVal = lengthAttr ? parseFloat(values[lengthAttr.attribute_id] || 0) : 0;
    const widthVal = widthAttr ? parseFloat(values[widthAttr.attribute_id] || 0) : 0;
    const unitMultiplier = UNIT_TO_MM[currentUnit] || 10.0;

    const lengthMm = lengthVal > 0 ? lengthVal * unitMultiplier : 0;
    const widthMm = widthVal > 0 ? widthVal * unitMultiplier : 0;

    const areaSqm = (lengthMm > 0 && widthMm > 0) ? (lengthMm * widthMm) / 1000000 : 0;
    const areaSqft = (lengthMm > 0 && widthMm > 0) ? (lengthMm * widthMm) / 92903.04 : 0;

    return (
        <div className="category-specifications-container">
            {/* Dimensions Section (Manual Entry: Length, Width, Thickness) */}
            {hasDimensions && (
                <div className="card border-0 bg-light p-3 mb-3 rounded-3">
                    <h6 className="fw-bold text-dark mb-2.5 small">
                        <i className="fa-solid fa-ruler-combined text-primary me-2"></i> Physical Dimensions
                    </h6>
                    <div className="row g-3 align-items-end">
                        <div className={thicknessAttr ? "col-md-4" : "col-md-6"}>
                            <label className="form-label fw-bold small text-dark mb-1">
                                Length {lengthAttr?.is_required && <span className="text-danger">*</span>}
                            </label>
                            <div className="input-group input-group-sm">
                                <input
                                    type="number"
                                    step="0.01"
                                    className="form-control"
                                    placeholder="e.g. 60"
                                    value={lengthAttr ? (values[lengthAttr.attribute_id] || '') : ''}
                                    onChange={handleLengthChange}
                                    required={lengthAttr?.is_required}
                                />
                                <select
                                    className="form-select bg-light text-secondary border-secondary-subtle font-monospace"
                                    style={{ maxWidth: '85px' }}
                                    value={currentUnit}
                                    onChange={handleUnitChange}
                                    title="Length Unit"
                                >
                                    {lengthUnits.map((u, idx) => (
                                        <option key={idx} value={u.symbol}>{u.symbol.toLowerCase()}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className={thicknessAttr ? "col-md-4" : "col-md-6"}>
                            <label className="form-label fw-bold small text-dark mb-1">
                                Width {widthAttr?.is_required && <span className="text-danger">*</span>}
                            </label>
                            <div className="input-group input-group-sm">
                                <input
                                    type="number"
                                    step="0.01"
                                    className="form-control"
                                    placeholder="e.g. 60"
                                    value={widthAttr ? (values[widthAttr.attribute_id] || '') : ''}
                                    onChange={handleWidthChange}
                                    required={widthAttr?.is_required}
                                />
                                <select
                                    className="form-select bg-light text-secondary border-secondary-subtle font-monospace"
                                    style={{ maxWidth: '85px' }}
                                    value={currentUnit}
                                    onChange={handleUnitChange}
                                    title="Width Unit"
                                >
                                    {lengthUnits.map((u, idx) => (
                                        <option key={idx} value={u.symbol}>{u.symbol.toLowerCase()}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {thicknessAttr && (
                            <div className="col-md-4">
                                <label className="form-label fw-bold small text-dark mb-1">
                                    Thickness {thicknessAttr?.is_required && <span className="text-danger">*</span>}
                                </label>
                                <div className="input-group input-group-sm">
                                    <input
                                        type="number"
                                        step="0.01"
                                        className="form-control"
                                        placeholder="e.g. 10"
                                        value={values[thicknessAttr.attribute_id] || ''}
                                        onChange={handleThicknessChange}
                                        required={thicknessAttr?.is_required}
                                    />
                                    <select
                                        className="form-select bg-light text-secondary border-secondary-subtle font-monospace"
                                        style={{ maxWidth: '85px' }}
                                        value={currentThicknessUnit}
                                        onChange={handleThicknessUnitChange}
                                        title="Thickness Unit"
                                    >
                                        {lengthUnits.map((u, idx) => (
                                            <option key={idx} value={u.symbol}>{u.symbol.toLowerCase()}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        )}
                    </div>

                    {lengthVal > 0 && widthVal > 0 && (
                        <div className="mt-3 pt-2 border-top d-flex align-items-center justify-content-between flex-wrap gap-2 small">
                            <span className="text-muted">
                                Dimension: <strong>{lengthVal} × {widthVal} {currentUnit}</strong>
                                {currentUnit !== 'mm' && (
                                    <span className="ms-2 text-secondary font-monospace">({lengthMm.toFixed(0)} × {widthMm.toFixed(0)} mm)</span>
                                )}
                            </span>
                            <span className="badge bg-primary-subtle text-primary fw-bold">
                                Calculated Area: {areaSqm.toFixed(4)} m² ({areaSqft.toFixed(2)} sq.ft.)
                            </span>
                        </div>
                    )}
                </div>
            )}

            {/* General Category Specifications List */}
            <div className="row g-3">
                {specifications.map((spec) => {
                    // Skip dimension attributes if already rendered in special physical dimensions section
                    if (hasDimensions && ['tile-size', 'length', 'width', 'thickness', 'thickness-unit', 'dimension-unit', 'length-mm', 'width-mm', 'coverage-area-sqft', 'coverage-area-sqm'].includes(spec.slug)) return null;

                    const currentValue = values[spec.attribute_id] !== undefined ? values[spec.attribute_id] : '';

                    return (
                        <div className="col-md-6" key={spec.attribute_id}>
                            <label className="form-label fw-bold small text-dark mb-1">
                                {spec.name} {spec.is_required && <span className="text-danger">*</span>}
                            </label>

                            {spec.type === 'selection' && Array.isArray(spec.allowed_values) ? (
                                <select
                                    className="form-select form-select-sm border-secondary-subtle"
                                    value={currentValue}
                                    onChange={(e) => onChange({ [spec.attribute_id]: e.target.value })}
                                    required={spec.is_required}
                                >
                                    <option value="">-- Select {spec.name} --</option>
                                    {spec.allowed_values.map((opt, idx) => (
                                        <option key={idx} value={opt}>{opt}</option>
                                    ))}
                                </select>
                            ) : spec.unit_symbol ? (
                                <div className="input-group input-group-sm">
                                    <input
                                        type={spec.type === 'number' || spec.type === 'decimal' ? 'number' : 'text'}
                                        step={spec.type === 'decimal' ? '0.01' : undefined}
                                        className="form-control"
                                        placeholder={`Enter ${spec.name.toLowerCase()}`}
                                        value={currentValue}
                                        onChange={(e) => onChange({ [spec.attribute_id]: e.target.value })}
                                        required={spec.is_required}
                                    />
                                    <span className="input-group-text bg-white text-muted small">{spec.unit_symbol}</span>
                                </div>
                            ) : (
                                <input
                                    type={spec.type === 'number' || spec.type === 'decimal' ? 'number' : 'text'}
                                    step={spec.type === 'decimal' ? '0.01' : undefined}
                                    className="form-control form-control-sm"
                                    placeholder={`Enter ${spec.name.toLowerCase()}`}
                                    value={currentValue}
                                    onChange={(e) => onChange({ [spec.attribute_id]: e.target.value })}
                                    required={spec.is_required}
                                />
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
