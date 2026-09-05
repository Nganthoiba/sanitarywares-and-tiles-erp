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
    const [selectedTileSize, setSelectedTileSize] = useState('');
    const [isCustomTileSize, setIsCustomTileSize] = useState(false);
    const [lengthUnits, setLengthUnits] = useState(DEFAULT_LENGTH_UNITS);
    const [selectedUnitState, setSelectedUnitState] = useState('cm');

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

                // Detect initial tile size and unit from values
                const tileSizeAttr = specs.find(s => s.slug === 'tile-size');
                const lengthAttr = specs.find(s => s.slug === 'length');
                const widthAttr = specs.find(s => s.slug === 'width');
                const dimUnitAttr = specs.find(s => s.slug === 'dimension-unit');

                // Determine initial unit if available
                const existingUnit = (dimUnitAttr && values[dimUnitAttr.attribute_id])
                    ? values[dimUnitAttr.attribute_id]
                    : (values['dimension-unit'] || values['dimension_unit']);
                if (existingUnit) {
                    setSelectedUnitState(existingUnit.toLowerCase());
                }

                if (tileSizeAttr && values[tileSizeAttr.attribute_id]) {
                    const currentVal = values[tileSizeAttr.attribute_id];
                    if (currentVal === 'Custom Size' || !tileSizeAttr.allowed_values?.includes(currentVal)) {
                        setSelectedTileSize('Custom Size');
                        setIsCustomTileSize(true);
                    } else {
                        setSelectedTileSize(currentVal);
                        setIsCustomTileSize(false);
                        const match = currentVal.match(/(\d+(?:\.\d+)?)\s*[×xX]\s*(\d+(?:\.\d+)?)\s*([a-zA-Z\.]+)?/);
                        if (match && match[3]) {
                            setSelectedUnitState(match[3].trim().toLowerCase());
                        }
                    }
                } else if (lengthAttr && widthAttr && values[lengthAttr.attribute_id] && values[widthAttr.attribute_id]) {
                    const l = values[lengthAttr.attribute_id];
                    const w = values[widthAttr.attribute_id];
                    const matchedSize = `${l} × ${w} ft`;
                    if (tileSizeAttr?.allowed_values?.includes(matchedSize)) {
                        setSelectedTileSize(matchedSize);
                        setIsCustomTileSize(false);
                    } else {
                        setSelectedTileSize('Custom Size');
                        setIsCustomTileSize(true);
                    }
                } else {
                    setSelectedTileSize('');
                    setIsCustomTileSize(false);
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
    const dimensionUnitAttr = specifications.find(s => s.slug === 'dimension-unit');

    const isTileCategory = !!tileSizeAttr || (categoryInfo?.slug && (
        categoryInfo.slug.includes('tile') ||
        categoryInfo.slug.includes('vitrified')
    ));

    const isSlabCategory = (categoryInfo?.slug === 'granite-slabs' || categoryInfo?.slug === 'marble-slabs') ||
        (!tileSizeAttr && lengthAttr && widthAttr);

    // Current Unit Selection (reads from attribute ID, fallback keys, or local state)
    const currentUnit = (dimensionUnitAttr && values[dimensionUnitAttr.attribute_id])
        ? values[dimensionUnitAttr.attribute_id].toLowerCase()
        : (values['dimension-unit'] || values['dimension_unit'] || selectedUnitState || 'cm').toLowerCase();

    // Handle Tile Size Preset Change
    const handleTileSizeChange = (e) => {
        const selected = e.target.value;
        setSelectedTileSize(selected);

        const newBatch = {};
        if (tileSizeAttr) {
            newBatch[tileSizeAttr.attribute_id] = selected;
        }

        if (selected === 'Custom Size') {
            setIsCustomTileSize(true);
        } else if (selected) {
            setIsCustomTileSize(false);
            // Parse preset strings like "60 × 60 cm", "600 × 1200 mm", "2 × 2 ft", "12 × 24 in"
            const match = selected.match(/(\d+(?:\.\d+)?)\s*[×xX]\s*(\d+(?:\.\d+)?)\s*([a-zA-Z\.]+)?/);
            if (match && lengthAttr && widthAttr) {
                const len = match[1];
                const wid = match[2];
                const unitStr = (match[3] ? match[3].trim() : 'ft').toLowerCase();

                setSelectedUnitState(unitStr);
                newBatch[lengthAttr.attribute_id] = len;
                newBatch[widthAttr.attribute_id] = wid;
                if (dimensionUnitAttr) {
                    newBatch[dimensionUnitAttr.attribute_id] = unitStr;
                } else {
                    newBatch['dimension-unit'] = unitStr;
                }
            }
        } else {
            setIsCustomTileSize(false);
            if (lengthAttr) newBatch[lengthAttr.attribute_id] = '';
            if (widthAttr) newBatch[widthAttr.attribute_id] = '';
        }

        onChange(newBatch);
    };

    // Handle Unit Change in Custom Mode (Synchronizes Length, Width, and Thickness unit dropdowns)
    const handleUnitChange = (e) => {
        const targetUnit = e.target.value.toLowerCase();
        setSelectedUnitState(targetUnit);
        const newBatch = {};

        if (dimensionUnitAttr) {
            newBatch[dimensionUnitAttr.attribute_id] = targetUnit;
        } else {
            newBatch['dimension-unit'] = targetUnit;
        }

        // Convert existing length, width, and thickness if present
        const oldMult = UNIT_TO_MM[currentUnit] || 10.0;
        const newMult = UNIT_TO_MM[targetUnit] || 10.0;

        if (lengthAttr && values[lengthAttr.attribute_id] && !isNaN(parseFloat(values[lengthAttr.attribute_id]))) {
            const oldLen = parseFloat(values[lengthAttr.attribute_id]);
            const convertedLen = (oldLen * oldMult) / newMult;
            newBatch[lengthAttr.attribute_id] = Number.isInteger(convertedLen) ? convertedLen.toString() : convertedLen.toFixed(2);
        }

        if (widthAttr && values[widthAttr.attribute_id] && !isNaN(parseFloat(values[widthAttr.attribute_id]))) {
            const oldWid = parseFloat(values[widthAttr.attribute_id]);
            const convertedWid = (oldWid * oldMult) / newMult;
            newBatch[widthAttr.attribute_id] = Number.isInteger(convertedWid) ? convertedWid.toString() : convertedWid.toFixed(2);
        }

        if (thicknessAttr && values[thicknessAttr.attribute_id] && !isNaN(parseFloat(values[thicknessAttr.attribute_id]))) {
            const oldThick = parseFloat(values[thicknessAttr.attribute_id]);
            const convertedThick = (oldThick * oldMult) / newMult;
            newBatch[thicknessAttr.attribute_id] = Number.isInteger(convertedThick) ? convertedThick.toString() : convertedThick.toFixed(2);
        }

        onChange(newBatch);
    };

    // Calculate Slab / Tile Area & Normalization
    const lengthVal = lengthAttr ? parseFloat(values[lengthAttr.attribute_id] || 0) : 0;
    const widthVal = widthAttr ? parseFloat(values[widthAttr.attribute_id] || 0) : 0;
    const unitMultiplier = UNIT_TO_MM[currentUnit] || 10.0;

    const lengthMm = lengthVal > 0 ? lengthVal * unitMultiplier : 0;
    const widthMm = widthVal > 0 ? widthVal * unitMultiplier : 0;

    const areaSqm = (lengthMm > 0 && widthMm > 0) ? (lengthMm * widthMm) / 1000000 : 0;
    const areaSqft = (lengthMm > 0 && widthMm > 0) ? (lengthMm * widthMm) / 92903.04 : 0;

    return (
        <div className="category-specifications-container">
            {/* Tile Specific Layout */}
            {isTileCategory && tileSizeAttr && (
                <div className="card border-0 bg-light p-3 mb-3 rounded-3">
                    <div className="row g-3 align-items-end">
                        <div className={isCustomTileSize ? "col-md-4" : "col-md-6"}>
                            <label className="form-label fw-bold small text-dark mb-1">
                                Size <span className="text-danger">*</span>
                            </label>
                            <select
                                className="form-select form-select-sm border-secondary-subtle"
                                value={selectedTileSize}
                                onChange={handleTileSizeChange}
                                required={tileSizeAttr.is_required}
                            >
                                <option value="">-- Select Tile Size --</option>
                                {(tileSizeAttr.allowed_values || ['60 × 60 cm', '30 × 60 cm', '600 × 1200 mm', '2 × 2 ft', '2 × 4 ft', '12 × 24 in', 'Custom Size']).map((sz, idx) => (
                                    <option key={idx} value={sz}>{sz}</option>
                                ))}
                            </select>
                        </div>

                        {isCustomTileSize && (
                            <>
                                <div className={thicknessAttr ? "col-md-3" : "col-md-4"}>
                                    <label className="form-label fw-bold small text-dark mb-1">
                                        Length <span className="text-danger">*</span>
                                    </label>
                                    <div className="input-group input-group-sm">
                                        <input
                                            type="number"
                                            step="0.01"
                                            className="form-control"
                                            placeholder="e.g. 60"
                                            value={lengthAttr ? (values[lengthAttr.attribute_id] || '') : ''}
                                            onChange={(e) => lengthAttr && onChange({ [lengthAttr.attribute_id]: e.target.value })}
                                            required
                                        />
                                        <select
                                            className="form-select bg-light text-secondary border-secondary-subtle font-monospace"
                                            style={{ maxWidth: '85px' }}
                                            value={currentUnit}
                                            onChange={handleUnitChange}
                                            title="Length Unit"
                                            required
                                        >
                                            {lengthUnits.map((u, idx) => (
                                                <option key={idx} value={u.symbol}>{u.symbol.toLowerCase()}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div className={thicknessAttr ? "col-md-3" : "col-md-4"}>
                                    <label className="form-label fw-bold small text-dark mb-1">
                                        Width <span className="text-danger">*</span>
                                    </label>
                                    <div className="input-group input-group-sm">
                                        <input
                                            type="number"
                                            step="0.01"
                                            className="form-control"
                                            placeholder="e.g. 60"
                                            value={widthAttr ? (values[widthAttr.attribute_id] || '') : ''}
                                            onChange={(e) => widthAttr && onChange({ [widthAttr.attribute_id]: e.target.value })}
                                            required
                                        />
                                        <select
                                            className="form-select bg-light text-secondary border-secondary-subtle font-monospace"
                                            style={{ maxWidth: '85px' }}
                                            value={currentUnit}
                                            onChange={handleUnitChange}
                                            title="Width Unit"
                                            required
                                        >
                                            {lengthUnits.map((u, idx) => (
                                                <option key={idx} value={u.symbol}>{u.symbol.toLowerCase()}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                {thicknessAttr && (
                                    <div className="col-md-2">
                                        <label className="form-label fw-bold small text-dark mb-1">
                                            Thickness
                                        </label>
                                        <div className="input-group input-group-sm">
                                            <input
                                                type="number"
                                                step="0.01"
                                                className="form-control"
                                                placeholder="e.g. 10"
                                                value={values[thicknessAttr.attribute_id] || ''}
                                                onChange={(e) => onChange({ [thicknessAttr.attribute_id]: e.target.value })}
                                            />
                                            <select
                                                className="form-select bg-light text-secondary border-secondary-subtle font-monospace"
                                                style={{ maxWidth: '80px' }}
                                                value={currentUnit}
                                                onChange={handleUnitChange}
                                                title="Thickness Unit"
                                            >
                                                {lengthUnits.map((u, idx) => (
                                                    <option key={idx} value={u.symbol}>{u.symbol.toLowerCase()}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                )}
                            </>
                        )}
                    </div>

                    {lengthVal > 0 && widthVal > 0 && (
                        <div className="mt-3 pt-2 border-top d-flex align-items-center justify-content-between flex-wrap gap-2 small">
                            <span className="text-muted">
                                Size: <strong>{lengthVal} × {widthVal} {currentUnit}</strong>
                                {currentUnit !== 'mm' && (
                                    <span className="ms-2 text-secondary font-monospace">({lengthMm.toFixed(0)} × {widthMm.toFixed(0)} mm)</span>
                                )}
                            </span>
                            <span className="badge bg-primary-subtle text-primary fw-bold">
                                Coverage Area: {areaSqm.toFixed(4)} m² ({areaSqft.toFixed(2)} sq.ft.) / tile
                            </span>
                        </div>
                    )}
                </div>
            )}

            {/* Slab Specific Layout (Granite / Marble) */}
            {isSlabCategory && !isTileCategory && (
                <div className="card border-0 bg-light p-3 mb-3 rounded-3">
                    <h6 className="fw-bold text-dark mb-2.5 small">
                        <i className="fa-solid fa-ruler-combined text-primary me-2"></i> Slab Dimensions
                    </h6>
                    <div className="row g-3 align-items-end">
                        <div className="col-md-4">
                            <label className="form-label fw-bold small text-dark mb-1">
                                Length <span className="text-danger">*</span>
                            </label>
                            <div className="input-group input-group-sm">
                                <input
                                    type="number"
                                    step="0.01"
                                    className="form-control"
                                    placeholder="e.g. 8"
                                    value={lengthAttr ? (values[lengthAttr.attribute_id] || '') : ''}
                                    onChange={(e) => lengthAttr && onChange({ [lengthAttr.attribute_id]: e.target.value })}
                                    required
                                />
                                <select
                                    className="form-select bg-light text-secondary border-secondary-subtle font-monospace"
                                    style={{ maxWidth: '85px' }}
                                    value={currentUnit}
                                    onChange={handleUnitChange}
                                    title="Length Unit"
                                    required
                                >
                                    {lengthUnits.map((u, idx) => (
                                        <option key={idx} value={u.symbol}>{u.symbol.toLowerCase()}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="col-md-4">
                            <label className="form-label fw-bold small text-dark mb-1">
                                Width <span className="text-danger">*</span>
                            </label>
                            <div className="input-group input-group-sm">
                                <input
                                    type="number"
                                    step="0.01"
                                    className="form-control"
                                    placeholder="e.g. 4"
                                    value={widthAttr ? (values[widthAttr.attribute_id] || '') : ''}
                                    onChange={(e) => widthAttr && onChange({ [widthAttr.attribute_id]: e.target.value })}
                                    required
                                />
                                <select
                                    className="form-select bg-light text-secondary border-secondary-subtle font-monospace"
                                    style={{ maxWidth: '85px' }}
                                    value={currentUnit}
                                    onChange={handleUnitChange}
                                    title="Width Unit"
                                    required
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
                                    Thickness
                                </label>
                                <div className="input-group input-group-sm">
                                    <input
                                        type="number"
                                        step="0.01"
                                        className="form-control"
                                        placeholder="e.g. 18"
                                        value={values[thicknessAttr.attribute_id] || ''}
                                        onChange={(e) => onChange({ [thicknessAttr.attribute_id]: e.target.value })}
                                    />
                                    <select
                                        className="form-select bg-light text-secondary border-secondary-subtle font-monospace"
                                        style={{ maxWidth: '85px' }}
                                        value={currentUnit}
                                        onChange={handleUnitChange}
                                        title="Thickness Unit"
                                    >
                                        {lengthUnits.map((u, idx) => (
                                            <option key={idx} value={u.symbol}>{u.symbol.toLowerCase()}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        )}

                        <div className="col-md-4">
                            <label className="form-label fw-bold small text-muted mb-1">
                                Area <span className="badge bg-secondary-subtle text-secondary ms-1 fw-normal">Calculated</span>
                            </label>
                            <input
                                type="text"
                                readOnly
                                className="form-control form-control-sm bg-white fw-bold text-primary"
                                value={`${areaSqft.toFixed(2)} sq.ft. (${areaSqm.toFixed(2)} m²)`}
                            />
                        </div>
                    </div>
                </div>
            )}

            {/* General Category Specifications List */}
            <div className="row g-3">
                {specifications.map((spec) => {
                    // Skip Tile Size/Length/Width/Thickness/Dimension Unit if already rendered in special layout
                    if (isTileCategory && ['tile-size', 'length', 'width', 'thickness', 'dimension-unit', 'length-mm', 'width-mm', 'coverage-area-sqft', 'coverage-area-sqm'].includes(spec.slug)) return null;
                    if (isSlabCategory && !isTileCategory && ['length', 'width', 'thickness', 'dimension-unit', 'length-mm', 'width-mm', 'coverage-area-sqft', 'coverage-area-sqm'].includes(spec.slug)) return null;

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

