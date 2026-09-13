import React, { useState } from 'react';

export default function TileGraniteCalculator() {
    // Live Calculator State
    const [calcTab, setCalcTab] = useState('tiles');
    const [tileCalcMode, setTileCalcMode] = useState('forward'); // 'forward' | 'reverse'
    const [tileLength, setTileLength] = useState(600);
    const [tileWidth, setTileWidth] = useState(600);
    const [tileUnit, setTileUnit] = useState('mm'); // 'mm' | 'cm' | 'ft'
    const [pcsPerBox, setPcsPerBox] = useState(4);
    const [boxCount, setBoxCount] = useState(50);
    const [tilePricePerPiece, setTilePricePerPiece] = useState(150); // ₹ per piece

    // Reverse Tile Calculation State
    const [targetAreaSqFt, setTargetAreaSqFt] = useState(500); // Target SQ.FT
    const [areaInputMode, setAreaInputMode] = useState('direct'); // 'direct' | 'dimensions'
    const [roomLength, setRoomLength] = useState(20);
    const [roomBreadth, setRoomBreadth] = useState(25);
    const [roomUnit, setRoomUnit] = useState('ft'); // 'ft' | 'm' | 'in' | 'cm'
    const [wastagePercent, setWastagePercent] = useState(5); // % Wastage

    // Granite Slab inputs
    const [slabLength, setSlabLength] = useState(10);
    const [slabLengthUnit, setSlabLengthUnit] = useState('FOOT'); // 'FOOT' or 'Inches'
    const [slabWidth, setSlabWidth] = useState(6);
    const [slabWidthUnit, setSlabWidthUnit] = useState('FOOT'); // 'FOOT' or 'Inches'
    const [ratePerSqft, setRatePerSqft] = useState(180); // ₹

    // Handle Unit Conversions for Tile Dimensions
    const handleTileUnitChange = (newUnit) => {
        if (tileUnit === newUnit) return;
        const l = Number(tileLength) || 0;
        const w = Number(tileWidth) || 0;
        let newL = l;
        let newW = w;
        if (tileUnit === 'mm' && newUnit === 'cm') { newL = l / 10; newW = w / 10; }
        else if (tileUnit === 'mm' && newUnit === 'ft') { newL = +(l / 304.8).toFixed(2); newW = +(w / 304.8).toFixed(2); }
        else if (tileUnit === 'cm' && newUnit === 'mm') { newL = Math.round(l * 10); newW = Math.round(w * 10); }
        else if (tileUnit === 'cm' && newUnit === 'ft') { newL = +(l / 30.48).toFixed(2); newW = +(w / 30.48).toFixed(2); }
        else if (tileUnit === 'ft' && newUnit === 'mm') { newL = Math.round(l * 304.8); newW = Math.round(w * 304.8); }
        else if (tileUnit === 'ft' && newUnit === 'cm') { newL = Math.round(l * 30.48); newW = Math.round(w * 30.48); }
        setTileLength(newL);
        setTileWidth(newW);
        setTileUnit(newUnit);
    };

    // Handle Unit Conversions for Room Area Dimensions
    const handleRoomUnitChange = (newUnit) => {
        if (roomUnit === newUnit) return;
        const l = Number(roomLength) || 0;
        const b = Number(roomBreadth) || 0;
        let newL = l;
        let newB = b;
        if (roomUnit === 'ft' && newUnit === 'm') { newL = +(l * 0.3048).toFixed(2); newB = +(b * 0.3048).toFixed(2); }
        else if (roomUnit === 'ft' && newUnit === 'in') { newL = Math.round(l * 12); newB = Math.round(b * 12); }
        else if (roomUnit === 'ft' && newUnit === 'cm') { newL = Math.round(l * 30.48); newB = Math.round(b * 30.48); }
        else if (roomUnit === 'm' && newUnit === 'ft') { newL = +(l / 0.3048).toFixed(2); newB = +(b / 0.3048).toFixed(2); }
        else if (roomUnit === 'in' && newUnit === 'ft') { newL = +(l / 12).toFixed(2); newB = +(b / 12).toFixed(2); }
        else if (roomUnit === 'cm' && newUnit === 'ft') { newL = +(l / 30.48).toFixed(2); newB = +(b / 30.48).toFixed(2); }
        setRoomLength(newL);
        setRoomBreadth(newB);
        setRoomUnit(newUnit);
    };

    // Calculate Tile Dimensions in Feet
    const tileLengthInFt = tileUnit === 'ft' ? (Number(tileLength) || 0) : (tileUnit === 'cm' ? (Number(tileLength) || 0) / 30.48 : (Number(tileLength) || 0) / 304.8);
    const tileWidthInFt = tileUnit === 'ft' ? (Number(tileWidth) || 0) : (tileUnit === 'cm' ? (Number(tileWidth) || 0) / 30.48 : (Number(tileWidth) || 0) / 304.8);

    const singleTileSqFt = tileLengthInFt * tileWidthInFt;
    const singleTileSqM = singleTileSqFt / 10.7639;
    const coveragePerBoxSqFt = singleTileSqFt * pcsPerBox;
    const coveragePerBoxSqM = singleTileSqM * pcsPerBox;
    const totalPieces = boxCount * pcsPerBox;
    const totalTileSqFt = boxCount * coveragePerBoxSqFt;
    const totalTileCost = totalPieces * tilePricePerPiece;

    // Calculate Area from Room Dimensions in SQ.FT
    const rLength = Number(roomLength) || 0;
    const rBreadth = Number(roomBreadth) || 0;
    let calculatedAreaSqFt = rLength * rBreadth;
    if (roomUnit === 'm') {
        calculatedAreaSqFt = (rLength * rBreadth) * 10.7639;
    } else if (roomUnit === 'in') {
        calculatedAreaSqFt = (rLength / 12) * (rBreadth / 12);
    } else if (roomUnit === 'cm') {
        calculatedAreaSqFt = (rLength / 30.48) * (rBreadth / 30.48);
    }

    const currentTargetAreaSqFt = areaInputMode === 'direct' ? (Number(targetAreaSqFt) || 0) : calculatedAreaSqFt;

    // Calculations for Reverse Tiles (Area ➔ Boxes, Pieces & Cost)
    const effectiveAreaSqFt = currentTargetAreaSqFt * (1 + (wastagePercent || 0) / 100);
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
        <div className="card border-0 shadow-sm mb-4 rounded-4 overflow-hidden" style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0' }}>
            {/* Top Accent Line */}
            <div style={{ height: '4px', background: 'linear-gradient(90deg, #3b82f6 0%, #6366f1 50%, #10b981 100%)' }}></div>

            <div className="p-4 p-md-4.5">
                {/* Header */}
                <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-4 pb-3 border-bottom">
                    <div className="d-flex align-items-center gap-3">
                        <div className="d-flex align-items-center justify-content-center bg-primary-subtle text-primary rounded-3 p-2.5" style={{ width: '44px', height: '44px' }}>
                            <i className="fa-solid fa-calculator fs-5"></i>
                        </div>
                        <div>
                            <h5 className="fw-bold text-dark mb-0 d-flex align-items-center gap-2">
                                Tile & Granite/Marble Calculator
                            </h5>
                            <p className="text-secondary small mb-0" style={{ fontSize: '0.82rem' }}>
                                Estimate inventory box coverage, slab square footage, unit conversions, and cost.
                            </p>
                        </div>
                    </div>
                    <span className="badge bg-success-subtle text-success border border-success-subtle px-3 py-1.5 rounded-pill font-monospace" style={{ fontSize: '0.75rem', fontWeight: 600 }}>
                        <i className="fa-solid fa-bolt me-1.5"></i>Real-Time Engine
                    </span>
                </div>

                {/* Main Tab Segmented Control */}
                <div className="bg-body-tertiary p-1.5 rounded-3 border d-inline-flex gap-2 mb-4 w-100 max-w-md">
                    <button 
                        type="button"
                        className={`btn btn-sm flex-fill fw-bold px-3 py-2 transition-all d-flex align-items-center justify-content-center gap-2 ${calcTab === 'tiles' ? 'bg-primary text-white shadow-xs' : 'text-secondary border-0 bg-transparent'}`} 
                        onClick={() => setCalcTab('tiles')}
                        style={{ borderRadius: '8px', fontSize: '0.84rem' }}
                    >
                        <i className="fa-solid fa-boxes-stacked me-2"></i>Tiles (Box & SQFT)
                    </button>
                    <button 
                        type="button"
                        className={`btn btn-sm flex-fill fw-bold px-3 py-2 transition-all d-flex align-items-center justify-content-center gap-2 ${calcTab === 'granite' ? 'bg-primary text-white shadow-xs' : 'text-secondary border-0 bg-transparent'}`} 
                        onClick={() => setCalcTab('granite')}
                        style={{ borderRadius: '8px', fontSize: '0.84rem' }}
                    >
                        <i className="fa-solid fa-ruler-combined me-2"></i>Granite & Marble Slabs
                    </button>
                </div>

                {calcTab === 'tiles' ? (
                    <div className="animate__animated animate__fadeIn">
                        {/* Sub-mode switcher */}
                        <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-4 p-2 bg-light-subtle rounded-3 border">
                            <span className="small fw-semibold text-secondary ms-1" style={{ fontSize: '0.82rem' }}>
                                <i className="fa-solid fa-sliders text-primary me-2"></i>Calculation Direction:
                            </span>
                            <div className="bg-white p-1 rounded-3 border d-inline-flex gap-1">
                                <button 
                                    type="button" 
                                    className={`btn btn-xs px-3 py-1.5 fw-bold transition-all ${tileCalcMode === 'forward' ? 'bg-primary text-white shadow-2xs' : 'text-secondary border-0 bg-transparent'}`} 
                                    onClick={() => setTileCalcMode('forward')}
                                    style={{ fontSize: '0.78rem', borderRadius: '6px' }}
                                >
                                    <i className="fa-solid fa-boxes-packing me-2"></i>Box ➔ SQ.FT & Cost
                                </button>
                                <button 
                                    type="button" 
                                    className={`btn btn-xs px-3 py-1.5 fw-bold transition-all ${tileCalcMode === 'reverse' ? 'bg-primary text-white shadow-2xs' : 'text-secondary border-0 bg-transparent'}`} 
                                    onClick={() => setTileCalcMode('reverse')}
                                    style={{ fontSize: '0.78rem', borderRadius: '6px' }}
                                >
                                    <i className="fa-solid fa-calculator me-2"></i>SQ.FT ➔ Boxes & Cost
                                </button>
                            </div>
                        </div>

                        {tileCalcMode === 'forward' ? (
                            <div>
                                <div className="row g-3 mb-4">
                                    <div className="col-4 col-md-5.5">
                                        <label className="form-label small fw-bold text-secondary mb-1">Tile Size ({tileUnit})</label>
                                        <div className="input-group input-group-sm">
                                            <span className="input-group-text bg-white text-muted px-2.5"><i className="fa-solid fa-ruler-horizontal"></i></span>
                                            <input type="number" className="form-control fw-bold" value={tileLength} onChange={(e) => setTileLength(Number(e.target.value))} placeholder="Length" />
                                            <span className="input-group-text bg-white text-muted fw-bold">×</span>
                                            <input type="number" className="form-control fw-bold" value={tileWidth} onChange={(e) => setTileWidth(Number(e.target.value))} placeholder="Width" />
                                            <select className="form-select fw-bold bg-white border-secondary-subtle" value={tileUnit} onChange={(e) => handleTileUnitChange(e.target.value)} style={{ maxWidth: '75px' }}>
                                                <option value="mm">mm</option>
                                                <option value="cm">cm</option>
                                                <option value="ft">ft</option>
                                            </select>
                                        </div>
                                    </div>
                                    <div className="col-2 col-md-2">
                                        <label className="form-label small fw-bold text-secondary mb-1">Pcs/Box</label>
                                        <input type="number" className="form-control form-control-sm fw-bold" value={pcsPerBox} onChange={(e) => setPcsPerBox(Number(e.target.value))} style={{ maxWidth: '85px' }} />
                                    </div>
                                    <div className="col-3 col-md-2">
                                        <label className="form-label small fw-bold text-secondary mb-1">Box Count</label>
                                        <input type="number" className="form-control form-control-sm fw-bold text-primary" value={boxCount} onChange={(e) => setBoxCount(Number(e.target.value))} style={{ maxWidth: '100px' }} />
                                    </div>
                                    <div className="col-4 col-md-2.5">
                                        <label className="form-label small fw-bold text-secondary mb-1">Price/Piece (₹)</label>
                                        <div className="input-group input-group-sm" style={{ maxWidth: '125px' }}>
                                            <span className="input-group-text bg-white fw-bold text-muted">₹</span>
                                            <input type="number" className="form-control form-control-sm fw-bold text-success" value={tilePricePerPiece} onChange={(e) => setTilePricePerPiece(Number(e.target.value))} />
                                        </div>
                                    </div>
                                </div>

                                {/* Results Metric Dashboard Cards */}
                                <div className="row g-3">
                                    <div className="col-6 col-md-3">
                                        <div className="p-3 rounded-3 bg-body-tertiary border h-100">
                                            <div className="d-flex align-items-center gap-1.5 text-muted mb-1" style={{ fontSize: '0.72rem', textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.5px' }}>
                                                <i className="fa-solid fa-vector-square text-secondary"></i> Coverage / Box
                                            </div>
                                            <div className="fs-5 fw-extrabold text-dark font-monospace">{coveragePerBoxSqFt.toFixed(2)} <small className="fs-6 fw-bold">SQ.FT</small></div>
                                            <div className="small text-muted font-monospace" style={{ fontSize: '0.75rem' }}>({coveragePerBoxSqM.toFixed(2)} SQ.M)</div>
                                        </div>
                                    </div>
                                    <div className="col-6 col-md-3">
                                        <div className="p-3 rounded-3 bg-info-subtle border border-info-subtle h-100">
                                            <div className="d-flex align-items-center gap-1.5 text-info-emphasis mb-1" style={{ fontSize: '0.72rem', textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.5px' }}>
                                                <i className="fa-solid fa-cubes text-info"></i> Total Stock Pcs
                                            </div>
                                            <div className="fs-5 fw-extrabold text-info-emphasis font-monospace">{totalPieces} <small className="fs-6 fw-bold">PCS</small></div>
                                            <div className="small text-info-emphasis opacity-75" style={{ fontSize: '0.75rem' }}>({boxCount} Boxes Total)</div>
                                        </div>
                                    </div>
                                    <div className="col-6 col-md-3">
                                        <div className="p-3 rounded-3 bg-primary-subtle border border-primary-subtle h-100">
                                            <div className="d-flex align-items-center gap-1.5 text-primary mb-1" style={{ fontSize: '0.72rem', textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.5px' }}>
                                                <i className="fa-solid fa-chart-area text-primary"></i> Total Coverage
                                            </div>
                                            <div className="fs-5 fw-extrabold text-primary font-monospace">{totalTileSqFt.toFixed(1)} <small className="fs-6 fw-bold">SQ.FT</small></div>
                                            <div className="small text-primary opacity-75" style={{ fontSize: '0.75rem' }}>Auto-Calculated</div>
                                        </div>
                                    </div>
                                    <div className="col-6 col-md-3">
                                        <div className="p-3 rounded-3 bg-success-subtle border border-success-subtle h-100">
                                            <div className="d-flex align-items-center gap-1.5 text-success mb-1" style={{ fontSize: '0.72rem', textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.5px' }}>
                                                <i className="fa-solid fa-indian-rupee-sign text-success"></i> Total Cost
                                            </div>
                                            <div className="fs-5 fw-extrabold text-success font-monospace">₹{Math.round(totalTileCost).toLocaleString()}</div>
                                            <div className="small text-success opacity-75" style={{ fontSize: '0.75rem' }}>({(tilePricePerPiece * pcsPerBox).toFixed(0)} ₹/Box)</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div>
                                {/* Target Area Specification Card */}
                                <div className="card border-0 bg-light-subtle rounded-3 p-3.5 mb-4" style={{ border: '1px solid #e2e8f0' }}>
                                    <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 pb-2.5 mb-3 border-bottom">
                                        <div className="d-flex align-items-center gap-2">
                                            <span className="badge bg-primary-subtle text-primary p-2 rounded-2">
                                                <i className="fa-solid fa-layer-group fs-6"></i>
                                            </span>
                                            <div>
                                                <h6 className="fw-bold text-dark mb-0" style={{ fontSize: '0.9rem' }}>Area Specification</h6>
                                                <small className="text-muted d-block" style={{ fontSize: '0.75rem' }}>Specify installation area by total SQ.FT or room dimensions</small>
                                            </div>
                                        </div>

                                        {/* Radio Buttons Control */}
                                        <div className="d-flex align-items-center gap-4">
                                            <div className="form-check form-check-inline mb-0 d-flex align-items-center gap-2 ps-0 me-0">
                                                <input
                                                    className="form-check-input cursor-pointer m-0"
                                                    type="radio"
                                                    name="areaInputModeTileCalc"
                                                    id="areaModeDirectTileCalc"
                                                    value="direct"
                                                    checked={areaInputMode === 'direct'}
                                                    onChange={() => setAreaInputMode('direct')}
                                                    style={{ width: '1.1em', height: '1.1em' }}
                                                />
                                                <label className="form-check-label small fw-bold text-dark cursor-pointer mb-0 user-select-none d-flex align-items-center gap-1.5" htmlFor="areaModeDirectTileCalc" style={{ fontSize: '0.82rem' }}>
                                                    <i className="fa-solid fa-chart-area text-primary"></i>
                                                    <span>Total SQ.FT</span>
                                                </label>
                                            </div>
                                            <div className="form-check form-check-inline mb-0 d-flex align-items-center gap-2 ps-0 me-0">
                                                <input
                                                    className="form-check-input cursor-pointer m-0"
                                                    type="radio"
                                                    name="areaInputModeTileCalc"
                                                    id="areaModeDimensionsTileCalc"
                                                    value="dimensions"
                                                    checked={areaInputMode === 'dimensions'}
                                                    onChange={() => setAreaInputMode('dimensions')}
                                                    style={{ width: '1.1em', height: '1.1em' }}
                                                />
                                                <label className="form-check-label small fw-bold text-dark cursor-pointer mb-0 user-select-none d-flex align-items-center gap-1.5" htmlFor="areaModeDimensionsTileCalc" style={{ fontSize: '0.82rem' }}>
                                                    <i className="fa-solid fa-ruler-combined text-primary"></i>
                                                    <span>Length × Breadth</span>
                                                </label>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Area Input Mode Content */}
                                    {areaInputMode === 'direct' ? (
                                        <div className="row align-items-center g-3">
                                            <div className="col-12 col-md-5">
                                                <label className="form-label small fw-bold text-secondary mb-1">Target Area (SQ.FT)</label>
                                                <div className="input-group input-group-sm">
                                                    <span className="input-group-text bg-white border-end-0 text-muted"><i className="fa-solid fa-vector-square"></i></span>
                                                    <input
                                                        type="number"
                                                        className="form-control form-control-sm fw-extrabold text-primary border-start-0"
                                                        value={targetAreaSqFt}
                                                        onChange={(e) => setTargetAreaSqFt(Number(e.target.value))}
                                                        placeholder="e.g. 500"
                                                    />
                                                    <span className="input-group-text bg-white fw-bold text-secondary">SQ.FT</span>
                                                </div>
                                            </div>
                                            <div className="col-12 col-md-7">
                                                <div className="p-2.5 rounded-3 bg-body border d-flex align-items-center gap-2.5">
                                                    <i className="fa-solid fa-circle-info text-primary fs-5 ms-1"></i>
                                                    <span className="small text-secondary" style={{ fontSize: '0.78rem' }}>
                                                        Direct coverage area mode. Enter total net square footage required for your space.
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="row align-items-center g-3">
                                            <div className="col-12 col-md-7">
                                                <label className="form-label small fw-bold text-secondary mb-1">Room / Space Dimensions</label>
                                                <div className="input-group input-group-sm">
                                                    <span className="input-group-text bg-white text-muted px-2.5" title="Length"><i className="fa-solid fa-arrows-left-right me-1"></i>L</span>
                                                    <input
                                                        type="number"
                                                        className="form-control fw-bold"
                                                        placeholder="Length"
                                                        value={roomLength}
                                                        onChange={(e) => setRoomLength(Number(e.target.value))}
                                                    />
                                                    <span className="input-group-text bg-white text-muted fw-bold">×</span>
                                                    <span className="input-group-text bg-white text-muted px-2.5" title="Breadth"><i className="fa-solid fa-arrows-up-down me-1"></i>B</span>
                                                    <input
                                                        type="number"
                                                        className="form-control fw-bold"
                                                        placeholder="Breadth"
                                                        value={roomBreadth}
                                                        onChange={(e) => setRoomBreadth(Number(e.target.value))}
                                                    />
                                                    <select
                                                        className="form-select fw-bold bg-white border-secondary-subtle"
                                                        value={roomUnit}
                                                        onChange={(e) => handleRoomUnitChange(e.target.value)}
                                                        style={{ maxWidth: '80px' }}
                                                    >
                                                        <option value="ft">ft</option>
                                                        <option value="m">m</option>
                                                        <option value="in">in</option>
                                                        <option value="cm">cm</option>
                                                    </select>
                                                </div>
                                            </div>
                                            <div className="col-12 col-md-5">
                                                <label className="form-label small fw-bold text-secondary mb-1">Calculated Area</label>
                                                <div className="p-2 rounded-2 bg-primary-subtle border border-primary-subtle d-flex align-items-center justify-content-between px-3">
                                                    <span className="small text-primary fw-bold" style={{ fontSize: '0.78rem' }}>
                                                        <i className="fa-solid fa-calculator me-1"></i>Calculated Total:
                                                    </span>
                                                    <span className="fs-6 fw-extrabold text-primary font-monospace">
                                                        {calculatedAreaSqFt.toFixed(1)} <small className="fw-semibold">SQ.FT</small>
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Tile Parameters Row - Fixed Layout */}
                                <div className="row g-3 mb-4">
                                    <div className="col-12 col-md-5">
                                        <label className="form-label small fw-bold text-secondary mb-1">Tile Size ({tileUnit})</label>
                                        <div className="input-group input-group-sm">
                                            <span className="input-group-text bg-white text-muted px-2.5"><i className="fa-solid fa-ruler-horizontal"></i></span>
                                            <input type="number" className="form-control fw-bold" value={tileLength} onChange={(e) => setTileLength(Number(e.target.value))} placeholder="Length" />
                                            <span className="input-group-text bg-white text-muted fw-bold">×</span>
                                            <input type="number" className="form-control fw-bold" value={tileWidth} onChange={(e) => setTileWidth(Number(e.target.value))} placeholder="Width" />
                                            <select className="form-select fw-bold bg-white border-secondary-subtle" value={tileUnit} onChange={(e) => handleTileUnitChange(e.target.value)} style={{ maxWidth: '75px' }}>
                                                <option value="mm">mm</option>
                                                <option value="cm">cm</option>
                                                <option value="ft">ft</option>
                                            </select>
                                        </div>
                                    </div>
                                    <div className="col-4 col-md-2">
                                        <label className="form-label small fw-bold text-secondary mb-1">Pcs/Box</label>
                                        <input type="number" className="form-control form-control-sm fw-bold" value={pcsPerBox} onChange={(e) => setPcsPerBox(Number(e.target.value))} style={{ maxWidth: '85px' }} />
                                    </div>
                                    <div className="col-4 col-md-2">
                                        <label className="form-label small fw-bold text-secondary mb-1">Wastage %</label>
                                        <div className="input-group input-group-sm" style={{ maxWidth: '100px' }}>
                                            <input type="number" className="form-control form-control-sm fw-bold text-warning" value={wastagePercent} onChange={(e) => setWastagePercent(Number(e.target.value))} />
                                            <span className="input-group-text bg-white px-1.5">%</span>
                                        </div>
                                    </div>
                                    <div className="col-4 col-md-3">
                                        <label className="form-label small fw-bold text-secondary mb-1">Price/Piece (₹)</label>
                                        <div className="input-group input-group-sm" style={{ maxWidth: '125px' }}>
                                            <span className="input-group-text bg-white fw-bold text-muted">₹</span>
                                            <input type="number" className="form-control form-control-sm fw-bold text-success" value={tilePricePerPiece} onChange={(e) => setTilePricePerPiece(Number(e.target.value))} />
                                        </div>
                                    </div>
                                </div>

                                {/* Results Metric Dashboard Cards */}
                                <div className="row g-3">
                                    <div className="col-6 col-md-3">
                                        <div className="p-3 rounded-3 bg-primary-subtle border border-primary-subtle h-100">
                                            <div className="d-flex align-items-center gap-1.5 text-primary mb-1" style={{ fontSize: '0.72rem', textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.5px' }}>
                                                <i className="fa-solid fa-boxes-packing text-primary"></i>&nbsp; Required Boxes
                                            </div>
                                            <div className="fs-5 fw-extrabold text-primary font-monospace">{requiredBoxes} <small className="fs-6 fw-bold">BOXES</small></div>
                                            <div className="small text-primary opacity-75" style={{ fontSize: '0.75rem' }}>({coveragePerBoxSqFt.toFixed(2)} SQ.FT/Box)</div>
                                        </div>
                                    </div>
                                    <div className="col-6 col-md-3">
                                        <div className="p-3 rounded-3 bg-info-subtle border border-info-subtle h-100">
                                            <div className="d-flex align-items-center gap-1.5 text-info-emphasis mb-1" style={{ fontSize: '0.72rem', textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.5px' }}>
                                                <i className="fa-solid fa-cubes text-info"></i>&nbsp; Total Tiles Pcs
                                            </div>
                                            <div className="fs-5 fw-extrabold text-info-emphasis font-monospace">{totalReversePieces} <small className="fs-6 fw-bold">PCS</small></div>
                                            <div className="small text-info-emphasis opacity-75" style={{ fontSize: '0.75rem' }}>({pcsPerBox} Pcs/Box)</div>
                                        </div>
                                    </div>
                                    <div className="col-6 col-md-3">
                                        <div className="p-3 rounded-3 bg-body-tertiary border h-100">
                                            <div className="d-flex align-items-center gap-1.5 text-muted mb-1" style={{ fontSize: '0.72rem', textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.5px' }}>
                                                <i className="fa-solid fa-truck-ramp-box text-secondary"></i>&nbsp; Delivered Coverage
                                            </div>
                                            <div className="fs-5 fw-extrabold text-dark font-monospace">{actualDeliveredSqFt.toFixed(1)} <small className="fs-6 fw-bold">SQ.FT</small></div>
                                            <div className="small text-warning fw-semibold" style={{ fontSize: '0.75rem' }}>({wastagePercent}% Wastage Incl.)</div>
                                        </div>
                                    </div>
                                    <div className="col-6 col-md-3">
                                        <div className="p-3 rounded-3 bg-success-subtle border border-success-subtle h-100">
                                            <div className="d-flex align-items-center gap-1.5 text-success mb-1" style={{ fontSize: '0.72rem', textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.5px' }}>
                                                <i className="fa-solid fa-indian-rupee-sign text-success"></i>&nbsp; Estimated Cost
                                            </div>
                                            <div className="fs-5 fw-extrabold text-success font-monospace">₹{Math.round(totalReverseCost).toLocaleString()}</div>
                                            <div className="small text-success opacity-75" style={{ fontSize: '0.75rem' }}>({(tilePricePerPiece * pcsPerBox).toFixed(0)} ₹/Box)</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="animate__animated animate__fadeIn">
                        <div className="row g-3 mb-4">
                            <div className="col-12 col-md-4">
                                <label className="form-label small fw-bold text-secondary mb-1">Slab Length</label>
                                <div className="input-group input-group-sm">
                                    <span className="input-group-text bg-white text-muted px-2.5"><i className="fa-solid fa-arrows-left-right"></i></span>
                                    <input type="number" className="form-control fw-bold" value={slabLength} onChange={(e) => setSlabLength(Number(e.target.value))} />
                                    <select className="form-select form-select-sm fw-bold bg-white border-secondary-subtle" value={slabLengthUnit} onChange={(e) => setSlabLengthUnit(e.target.value)} style={{ maxWidth: '100px' }}>
                                        <option value="FOOT">FOOT</option>
                                        <option value="Inches">Inches</option>
                                    </select>
                                </div>
                            </div>
                            <div className="col-12 col-md-4">
                                <label className="form-label small fw-bold text-secondary mb-1">Slab Width</label>
                                <div className="input-group input-group-sm">
                                    <span className="input-group-text bg-white text-muted px-2.5"><i className="fa-solid fa-arrows-up-down"></i></span>
                                    <input type="number" className="form-control fw-bold" value={slabWidth} onChange={(e) => setSlabWidth(Number(e.target.value))} />
                                    <select className="form-select form-select-sm fw-bold bg-white border-secondary-subtle" value={slabWidthUnit} onChange={(e) => setSlabWidthUnit(e.target.value)} style={{ maxWidth: '100px' }}>
                                        <option value="FOOT">FOOT</option>
                                        <option value="Inches">Inches</option>
                                    </select>
                                </div>
                            </div>
                            <div className="col-12 col-md-4">
                                <label className="form-label small fw-bold text-secondary mb-1">Commercial Rate (₹ / SQ.FT)</label>
                                <div className="input-group input-group-sm">
                                    <span className="input-group-text bg-white text-muted fw-bold">₹</span>
                                    <input type="number" className="form-control form-control-sm fw-bold text-warning" value={ratePerSqft} onChange={(e) => setRatePerSqft(Number(e.target.value))} />
                                </div>
                            </div>
                        </div>

                        {/* Granite Results Metric Dashboard Cards */}
                        <div className="row g-3">
                            <div className="col-md-4">
                                <div className="p-3 rounded-3 bg-body-tertiary border h-100">
                                    <div className="d-flex align-items-center gap-1.5 text-muted mb-1" style={{ fontSize: '0.72rem', textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.5px' }}>
                                        <i className="fa-solid fa-ruler-combined text-secondary"></i> Dimensions
                                    </div>
                                    <div className="fs-5 fw-bold text-dark font-monospace">{slabLength} {slabLengthUnit} × {slabWidth} {slabWidthUnit}</div>
                                </div>
                            </div>
                            <div className="col-md-4">
                                <div className="p-3 rounded-3 bg-primary-subtle border border-primary-subtle h-100">
                                    <div className="d-flex align-items-center gap-1.5 text-primary mb-1" style={{ fontSize: '0.72rem', textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.5px' }}>
                                        <i className="fa-solid fa-chart-area text-primary"></i> Total Stone Area
                                    </div>
                                    <div className="fs-5 fw-extrabold text-primary font-monospace">{slabSqFt.toFixed(2)} <small className="fs-6 fw-bold">SQ.FT</small></div>
                                </div>
                            </div>
                            <div className="col-md-4">
                                <div className="p-3 rounded-3 bg-success-subtle border border-success-subtle h-100">
                                    <div className="d-flex align-items-center gap-1.5 text-success mb-1" style={{ fontSize: '0.72rem', textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.5px' }}>
                                        <i className="fa-solid fa-indian-rupee-sign text-success"></i> Total Valuation
                                    </div>
                                    <div className="fs-5 fw-extrabold text-success font-monospace">₹{Math.round(totalSlabValuation).toLocaleString()}</div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
