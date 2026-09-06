import React, { useState } from 'react';

export default function TileGraniteCalculator() {
    // Live Calculator State
    const [calcTab, setCalcTab] = useState('tiles');
    const [tileCalcMode, setTileCalcMode] = useState('forward'); // 'forward' | 'reverse'
    const [tileLength, setTileLength] = useState(600); // mm
    const [tileWidth, setTileWidth] = useState(600); // mm
    const [pcsPerBox, setPcsPerBox] = useState(4);
    const [boxCount, setBoxCount] = useState(50);
    const [tilePricePerPiece, setTilePricePerPiece] = useState(50); // ₹ per piece

    // Reverse Tile Calculation State
    const [targetAreaSqFt, setTargetAreaSqFt] = useState(500); // Target SQ.FT
    const [wastagePercent, setWastagePercent] = useState(5); // % Wastage

    // Granite Slab inputs
    const [slabLength, setSlabLength] = useState(10);
    const [slabLengthUnit, setSlabLengthUnit] = useState('FOOT'); // 'FOOT' or 'Inches'
    const [slabWidth, setSlabWidth] = useState(6);
    const [slabWidthUnit, setSlabWidthUnit] = useState('FOOT'); // 'FOOT' or 'Inches'
    const [ratePerSqft, setRatePerSqft] = useState(180); // ₹

    // Calculations for Forward Tiles
    const singleTileSqM = (tileLength / 1000) * (tileWidth / 1000);
    const coveragePerBoxSqM = singleTileSqM * pcsPerBox;
    const coveragePerBoxSqFt = coveragePerBoxSqM * 10.7639;
    const totalPieces = boxCount * pcsPerBox;
    const totalTileSqFt = boxCount * coveragePerBoxSqFt;
    const totalTileCost = totalPieces * tilePricePerPiece;

    // Calculations for Reverse Tiles (Area ➔ Boxes, Pieces & Cost)
    const effectiveAreaSqFt = targetAreaSqFt * (1 + (wastagePercent || 0) / 100);
    const requiredBoxes = coveragePerBoxSqFt > 0 ? Math.ceil(effectiveAreaSqFt / coveragePerBoxSqFt) : 0;
    const totalReversePieces = requiredBoxes * pcsPerBox;
    const actualDeliveredSqFt = requiredBoxes * coveragePerBoxSqFt;
    const totalReverseCost = totalReversePieces * tilePricePerPiece;

    // Calculations for Granite Slab
    const lengthInFeet = slabLengthUnit === 'Inches' ? slabLength / 12 : slabLength;
    const widthInFeet = slabWidthUnit === 'Inches' ? slabWidth / 12 : slabWidth;
    const slabSqFt = lengthInFeet * widthInFeet;
    const totalSlabValuation = slabSqFt * ratePerSqft;

    return (
        <div className="card border-0 shadow-sm p-4 p-md-5 mb-5 rounded-4" style={{ borderRadius: '16px' }}>
            <div className="d-flex flex-wrap align-items-center justify-content-between mb-4 pb-3 border-bottom">
                <div>
                    <h4 className="fw-bold text-dark mb-1 d-flex align-items-center">
                        <i className="fa-solid fa-calculator text-primary me-2.5"></i>
                        Tile & Granite/Marble Calculator
                    </h4>
                    <p className="text-muted small mb-0">Calculate real-world inventory coverage, box conversions, slab area, and total cost estimation.</p>
                </div>
                <span className="badge bg-success-subtle text-success border border-success px-3 py-2 rounded-pill font-monospace" style={{ fontSize: '0.78rem' }}>
                    <i className="fa-solid fa-bolt me-1"></i>Real-Time Math Engine
                </span>
            </div>

            {/* Tab selector */}
            <ul className="nav nav-pills mb-4 gap-2 border-bottom pb-3">
                <li className="nav-item">
                    <button 
                        className={`nav-link px-4 py-2 fw-bold ${calcTab === 'tiles' ? 'active bg-primary' : 'bg-light text-secondary'}`} 
                        onClick={() => setCalcTab('tiles')}
                        style={{ borderRadius: '10px' }}
                    >
                        <i className="fa-solid fa-boxes-stacked me-2"></i>Tiles (Box / SQFT)
                    </button>
                </li>
                <li className="nav-item">
                    <button 
                        className={`nav-link px-4 py-2 fw-bold ${calcTab === 'granite' ? 'active bg-primary' : 'bg-light text-secondary'}`} 
                        onClick={() => setCalcTab('granite')}
                        style={{ borderRadius: '10px' }}
                    >
                        <i className="fa-solid fa-ruler-combined me-2"></i>Granite & Marble Slab Area
                    </button>
                </li>
            </ul>

            {calcTab === 'tiles' ? (
                <div className="animate__animated animate__fadeIn">
                    {/* Sub-mode switcher */}
                    <div className="d-flex justify-content-between align-items-center mb-4 p-2 bg-light rounded-3 border">
                        <span className="small fw-semibold text-secondary ms-2" style={{ fontSize: '0.82rem' }}>
                            <i className="fa-solid fa-sliders text-primary me-1.5"></i>Calculation Direction:
                        </span>
                        <div className="btn-group btn-group-sm" role="group">
                            <button 
                                type="button" 
                                className={`btn px-3 ${tileCalcMode === 'forward' ? 'btn-primary active fw-bold' : 'btn-outline-secondary'}`} 
                                onClick={() => setTileCalcMode('forward')}
                                style={{ fontSize: '0.8rem', borderRadius: '8px 0 0 8px' }}
                            >
                                <i className="fa-solid fa-boxes-packing me-1.5"></i>Box ➔ SQ.FT & Cost
                            </button>
                            <button 
                                type="button" 
                                className={`btn px-3 ${tileCalcMode === 'reverse' ? 'btn-primary active fw-bold' : 'btn-outline-secondary'}`} 
                                onClick={() => setTileCalcMode('reverse')}
                                style={{ fontSize: '0.8rem', borderRadius: '0 8px 8px 0' }}
                            >
                                <i className="fa-solid fa-calculator me-1.5"></i>SQ.FT ➔ Boxes & Cost
                            </button>
                        </div>
                    </div>

                    {tileCalcMode === 'forward' ? (
                        <div>
                            <div className="row g-3 mb-4">
                                <div className="col-12 col-md-4">
                                    <label className="form-label small fw-bold text-secondary">Tile Size (mm)</label>
                                    <div className="input-group input-group-sm">
                                        <input type="number" className="form-control fw-bold" value={tileLength} onChange={(e) => setTileLength(Number(e.target.value))} />
                                        <span className="input-group-text">×</span>
                                        <input type="number" className="form-control fw-bold" value={tileWidth} onChange={(e) => setTileWidth(Number(e.target.value))} />
                                    </div>
                                </div>
                                <div className="col-6 col-md-2">
                                    <label className="form-label small fw-bold text-secondary">Pcs/Box</label>
                                    <input type="number" className="form-control form-control-sm fw-bold" value={pcsPerBox} onChange={(e) => setPcsPerBox(Number(e.target.value))} />
                                </div>
                                <div className="col-6 col-md-3">
                                    <label className="form-label small fw-bold text-secondary">Box Count</label>
                                    <input type="number" className="form-control form-control-sm fw-bold text-primary" value={boxCount} onChange={(e) => setBoxCount(Number(e.target.value))} />
                                </div>
                                <div className="col-12 col-md-3">
                                    <label className="form-label small fw-bold text-secondary">Price/Piece (₹)</label>
                                    <input type="number" className="form-control form-control-sm fw-bold text-success" value={tilePricePerPiece} onChange={(e) => setTilePricePerPiece(Number(e.target.value))} />
                                </div>
                            </div>

                            <div className="p-4 bg-light rounded-3 border">
                                <div className="row g-3 text-center">
                                    <div className="col-6 col-md-3 border-end">
                                        <small className="text-muted d-block text-uppercase fw-semibold" style={{ fontSize: '0.72rem' }}>Coverage / Box</small>
                                        <span className="fs-5 fw-extrabold text-dark">{coveragePerBoxSqFt.toFixed(2)} SQ.FT</span>
                                        <small className="d-block text-secondary">({coveragePerBoxSqM.toFixed(2)} SQ.M)</small>
                                    </div>
                                    <div className="col-6 col-md-3 border-end">
                                        <small className="text-muted d-block text-uppercase fw-semibold" style={{ fontSize: '0.72rem' }}>Total Stock Pcs</small>
                                        <span className="fs-5 fw-extrabold text-info">{totalPieces} PCS</span>
                                        <small className="d-block text-secondary">({boxCount} Boxes)</small>
                                    </div>
                                    <div className="col-6 col-md-3 border-end">
                                        <small className="text-muted d-block text-uppercase fw-semibold" style={{ fontSize: '0.72rem' }}>Total Coverage</small>
                                        <span className="fs-5 fw-extrabold text-primary">{totalTileSqFt.toFixed(1)} SQ.FT</span>
                                        <small className="d-block text-primary">Auto-Converted</small>
                                    </div>
                                    <div className="col-6 col-md-3">
                                        <small className="text-muted d-block text-uppercase fw-semibold" style={{ fontSize: '0.72rem' }}>Total Cost</small>
                                        <span className="fs-5 fw-extrabold text-success">₹{Math.round(totalTileCost).toLocaleString()}</span>
                                        <small className="d-block text-success">({(tilePricePerPiece * pcsPerBox).toFixed(0)} ₹/Box)</small>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div>
                            <div className="row g-3 mb-4">
                                <div className="col-12 col-md-3">
                                    <label className="form-label small fw-bold text-secondary">Target Area (SQ.FT)</label>
                                    <input type="number" className="form-control form-control-sm fw-bold text-primary" value={targetAreaSqFt} onChange={(e) => setTargetAreaSqFt(Number(e.target.value))} />
                                </div>
                                <div className="col-12 col-md-4">
                                    <label className="form-label small fw-bold text-secondary">Tile Size (mm)</label>
                                    <div className="input-group input-group-sm">
                                        <input type="number" className="form-control fw-bold" value={tileLength} onChange={(e) => setTileLength(Number(e.target.value))} />
                                        <span className="input-group-text">×</span>
                                        <input type="number" className="form-control fw-bold" value={tileWidth} onChange={(e) => setTileWidth(Number(e.target.value))} />
                                    </div>
                                </div>
                                <div className="col-4 col-md-2">
                                    <label className="form-label small fw-bold text-secondary">Pcs/Box</label>
                                    <input type="number" className="form-control form-control-sm fw-bold" value={pcsPerBox} onChange={(e) => setPcsPerBox(Number(e.target.value))} />
                                </div>
                                <div className="col-4 col-md-1.5">
                                    <label className="form-label small fw-bold text-secondary">Wastage %</label>
                                    <input type="number" className="form-control form-control-sm fw-bold text-warning" value={wastagePercent} onChange={(e) => setWastagePercent(Number(e.target.value))} />
                                </div>
                                <div className="col-4 col-md-1.5">
                                    <label className="form-label small fw-bold text-secondary">Price/Piece (₹)</label>
                                    <input type="number" className="form-control form-control-sm fw-bold text-success" value={tilePricePerPiece} onChange={(e) => setTilePricePerPiece(Number(e.target.value))} />
                                </div>
                            </div>

                            <div className="p-4 bg-light rounded-3 border">
                                <div className="row g-3 text-center">
                                    <div className="col-6 col-md-3 border-end">
                                        <small className="text-muted d-block text-uppercase fw-semibold" style={{ fontSize: '0.72rem' }}>Required Boxes</small>
                                        <span className="fs-5 fw-extrabold text-primary">{requiredBoxes} BOXES</span>
                                        <small className="d-block text-secondary">({coveragePerBoxSqFt.toFixed(2)} SQ.FT/Box)</small>
                                    </div>
                                    <div className="col-6 col-md-3 border-end">
                                        <small className="text-muted d-block text-uppercase fw-semibold" style={{ fontSize: '0.72rem' }}>Total Tiles Pcs</small>
                                        <span className="fs-5 fw-extrabold text-info">{totalReversePieces} PCS</span>
                                        <small className="d-block text-secondary">({pcsPerBox} Pcs/Box)</small>
                                    </div>
                                    <div className="col-6 col-md-3 border-end">
                                        <small className="text-muted d-block text-uppercase fw-semibold" style={{ fontSize: '0.72rem' }}>Delivered Coverage</small>
                                        <span className="fs-5 fw-extrabold text-dark">{actualDeliveredSqFt.toFixed(1)} SQ.FT</span>
                                        <small className="d-block text-warning">({wastagePercent}% Wastage Incl.)</small>
                                    </div>
                                    <div className="col-6 col-md-3">
                                        <small className="text-muted d-block text-uppercase fw-semibold" style={{ fontSize: '0.72rem' }}>Total Estimated Cost</small>
                                        <span className="fs-5 fw-extrabold text-success">₹{Math.round(totalReverseCost).toLocaleString()}</span>
                                        <small className="d-block text-success">({(tilePricePerPiece * pcsPerBox).toFixed(0)} ₹/Box)</small>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            ) : (
                <div className="animate__animated animate__fadeIn">
                    <div className="row g-3 mb-4">
                        <div className="col-md-6">
                            <label className="form-label small fw-bold text-secondary">Slab Length</label>
                            <div className="input-group input-group-sm">
                                <input type="number" className="form-control fw-bold" value={slabLength} onChange={(e) => setSlabLength(Number(e.target.value))} />
                                <select className="form-select form-select-sm fw-bold border-secondary-subtle" value={slabLengthUnit} onChange={(e) => setSlabLengthUnit(e.target.value)} style={{ maxWidth: '105px' }}>
                                    <option value="FOOT">FOOT</option>
                                    <option value="Inches">Inches</option>
                                </select>
                            </div>
                        </div>
                        <div className="col-md-6">
                            <label className="form-label small fw-bold text-secondary">Slab Width</label>
                            <div className="input-group input-group-sm">
                                <input type="number" className="form-control fw-bold" value={slabWidth} onChange={(e) => setSlabWidth(Number(e.target.value))} />
                                <select className="form-select form-select-sm fw-bold border-secondary-subtle" value={slabWidthUnit} onChange={(e) => setSlabWidthUnit(e.target.value)} style={{ maxWidth: '105px' }}>
                                    <option value="FOOT">FOOT</option>
                                    <option value="Inches">Inches</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    <div className="mb-4">
                        <label className="form-label small fw-bold text-secondary">Commercial Rate (₹ / SQ.FT)</label>
                        <input type="number" className="form-control form-control-sm fw-bold text-warning" value={ratePerSqft} onChange={(e) => setRatePerSqft(Number(e.target.value))} />
                    </div>

                    <div className="p-4 bg-light rounded-3 border">
                        <div className="row g-3 text-center">
                            <div className="col-md-4 border-end">
                                <small className="text-muted d-block text-uppercase fw-semibold" style={{ fontSize: '0.72rem' }}>Dimensions</small>
                                <span className="fs-5 fw-bold text-dark">{slabLength} {slabLengthUnit} × {slabWidth} {slabWidthUnit}</span>
                            </div>
                            <div className="col-md-4 border-end">
                                <small className="text-muted d-block text-uppercase fw-semibold" style={{ fontSize: '0.72rem' }}>Total Stone Area</small>
                                <span className="fs-5 fw-extrabold text-primary">{slabSqFt.toFixed(2)} SQ.FT</span>
                            </div>
                            <div className="col-md-4">
                                <small className="text-muted d-block text-uppercase fw-semibold" style={{ fontSize: '0.72rem' }}>Total Valuation</small>
                                <span className="fs-5 fw-extrabold text-success">₹{Math.round(totalSlabValuation).toLocaleString()}</span>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
