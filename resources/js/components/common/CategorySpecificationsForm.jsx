import React, { useState, useEffect } from 'react';
import axios from 'axios';

export default function CategorySpecificationsForm({ categoryId, values = {}, onChange }) {
    const [specifications, setSpecifications] = useState([]);
    const [loading, setLoading] = useState(false);
    const [categoryInfo, setCategoryInfo] = useState(null);
    const [selectedTileSize, setSelectedTileSize] = useState('');
    const [isCustomTileSize, setIsCustomTileSize] = useState(false);

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
                setCategoryInfo({
                    id: data.category_id,
                    name: data.category_name,
                    slug: data.category_slug
                });

                // Detect initial tile size from values
                const tileSizeAttr = specs.find(s => s.slug === 'tile-size');
                const lengthAttr = specs.find(s => s.slug === 'length');
                const widthAttr = specs.find(s => s.slug === 'width');

                if (tileSizeAttr && values[tileSizeAttr.attribute_id]) {
                    const currentVal = values[tileSizeAttr.attribute_id];
                    if (currentVal === 'Custom Size' || !tileSizeAttr.allowed_values?.includes(currentVal)) {
                        setSelectedTileSize('Custom Size');
                        setIsCustomTileSize(true);
                    } else {
                        setSelectedTileSize(currentVal);
                        setIsCustomTileSize(false);
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
    const weightAttr = specifications.find(s => s.slug === 'net-weight');

    const isTileCategory = !!tileSizeAttr || (categoryInfo?.slug && (
        categoryInfo.slug.includes('tile') ||
        categoryInfo.slug.includes('vitrified')
    ));

    const isSlabCategory = (categoryInfo?.slug === 'granite-slabs' || categoryInfo?.slug === 'marble-slabs') ||
        (!tileSizeAttr && lengthAttr && widthAttr);

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
            // Parse dimensions like "2 × 4 ft" or "600x600 mm"
            const match = selected.match(/(\d+(?:\.\d+)?)\s*[×xX]\s*(\d+(?:\.\d+)?)/);
            if (match && lengthAttr && widthAttr) {
                const len = match[1];
                const wid = match[2];
                newBatch[lengthAttr.attribute_id] = len;
                newBatch[widthAttr.attribute_id] = wid;
            }
        } else {
            setIsCustomTileSize(false);
            if (lengthAttr) newBatch[lengthAttr.attribute_id] = '';
            if (widthAttr) newBatch[widthAttr.attribute_id] = '';
        }

        onChange(newBatch);
    };

    // Calculate Slab / Tile Area
    const lengthVal = lengthAttr ? parseFloat(values[lengthAttr.attribute_id] || 0) : 0;
    const widthVal = widthAttr ? parseFloat(values[widthAttr.attribute_id] || 0) : 0;
    const calculatedArea = (lengthVal > 0 && widthVal > 0) ? (lengthVal * widthVal).toFixed(2) : '0.00';

    return (
        <div className="category-specifications-container">
            {/* Tile Specific Layout */}
            {isTileCategory && tileSizeAttr && (
                <div className="card border-0 bg-light p-3 mb-3 rounded-3">
                    <div className="row g-3 align-items-end">
                        <div className="col-md-6">
                            <label className="form-label fw-bold small text-dark mb-1">
                                Tile Size <span className="text-danger">*</span>
                            </label>
                            <select
                                className="form-select form-select-sm border-secondary-subtle"
                                value={selectedTileSize}
                                onChange={handleTileSizeChange}
                                required={tileSizeAttr.is_required}
                            >
                                <option value="">-- Select Tile Size --</option>
                                {(tileSizeAttr.allowed_values || ['1 × 1 ft', '2 × 2 ft', '2 × 4 ft', '4 × 6 ft', 'Custom Size']).map((sz, idx) => (
                                    <option key={idx} value={sz}>{sz}</option>
                                ))}
                            </select>
                        </div>

                        {isCustomTileSize && (
                            <>
                                <div className="col-md-3">
                                    <label className="form-label fw-bold small text-dark mb-1">
                                        Length <span className="text-danger">*</span>
                                    </label>
                                    <div className="input-group input-group-sm">
                                        <input
                                            type="number"
                                            step="0.01"
                                            className="form-control"
                                            placeholder="e.g. 2.5"
                                            value={lengthAttr ? (values[lengthAttr.attribute_id] || '') : ''}
                                            onChange={(e) => lengthAttr && onChange({ [lengthAttr.attribute_id]: e.target.value })}
                                            required
                                        />
                                        <span className="input-group-text bg-white text-muted small">{lengthAttr?.unit_symbol || 'ft'}</span>
                                    </div>
                                </div>

                                <div className="col-md-3">
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
                                        <span className="input-group-text bg-white text-muted small">{widthAttr?.unit_symbol || 'ft'}</span>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>

                    {lengthVal > 0 && widthVal > 0 && (
                        <div className="mt-2.5 pt-2 border-top d-flex align-items-center justify-content-between small">
                            <span className="text-muted">Normalized Dimensions: <strong>{lengthVal} × {widthVal} {lengthAttr?.unit_symbol || 'ft'}</strong></span>
                            <span className="badge bg-primary-subtle text-primary fw-bold">Tile Coverage Area: {calculatedArea} sq.ft. / tile</span>
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
                    <div className="row g-3">
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
                                <span className="input-group-text bg-white text-muted small">{lengthAttr?.unit_symbol || 'Feet'}</span>
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
                                <span className="input-group-text bg-white text-muted small">{widthAttr?.unit_symbol || 'Feet'}</span>
                            </div>
                        </div>

                        <div className="col-md-4">
                            <label className="form-label fw-bold small text-muted mb-1">
                                Area <span className="badge bg-secondary-subtle text-secondary ms-1 fw-normal">Calculated</span>
                            </label>
                            <div className="input-group input-group-sm">
                                <input
                                    type="text"
                                    readOnly
                                    className="form-control bg-white fw-bold text-primary"
                                    value={`${calculatedArea} sq.ft.`}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* General Category Specifications List */}
            <div className="row g-3">
                {specifications.map((spec) => {
                    // Skip Tile Size/Length/Width if already rendered in special layout
                    if (isTileCategory && ['tile-size', 'length', 'width'].includes(spec.slug)) return null;
                    if (isSlabCategory && !isTileCategory && ['length', 'width'].includes(spec.slug)) return null;

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
