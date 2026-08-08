import React, { useState, useEffect } from "react";
import axios from "axios";

export default function InventoryManager() {
    const [activeSection, setActiveSection] = useState("dashboard");
    const [inventory, setInventory] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Global Stats
    const [stats, setStats] = useState({
        totalItems: 0,
        totalArea: 0,
        availableItems: 0,
        activeReservations: 0,
        activeAllocations: 0
    });

    // Reservations Form / List
    const [reservations, setReservations] = useState([]);
    const [resForm, setResForm] = useState({
        inventory_object_id: "",
        quantity: 1,
        area: 0,
        reservation_type: "SOFT",
        expires_at: ""
    });

    // Allocations Form / List
    const [allocations, setAllocations] = useState([]);
    const [allocForm, setAllocForm] = useState({
        inventory_object_id: "",
        quantity: 1,
        area: 0,
        reference_type: "ORDER",
        reference_id: ""
    });

    // Transfers Form / List
    const [transfers, setTransfers] = useState([]);
    const [transferForm, setTransferForm] = useState({
        from_warehouse_id: "1",
        to_warehouse_id: "2",
        items: [{ inventory_object_id: "", quantity: 1 }]
    });

    // Adjustments Form / List
    const [adjustments, setAdjustments] = useState([]);
    const [adjustmentForm, setAdjustmentForm] = useState({
        warehouse_id: "1",
        adjustment_type: "DAMAGE",
        reason: "",
        items: [{ inventory_object_id: "", quantity_delta: -1, area_delta: 0 }]
    });

    // Cycle Audit Form / List
    const [auditList, setAuditList] = useState([]);
    const [auditForm, setAuditForm] = useState({
        warehouse_id: "1",
        count_type: "CYCLE",
        remarks: ""
    });

    // Granite Slabs Form / List
    const [slabs, setSlabs] = useState([]);
    const [slabForm, setSlabForm] = useState({
        warehouse_id: "1",
        product_variant_id: "1",
        slab_code: "",
        length: 120,
        width: 60,
        thickness: 20,
        area: 50,
        finish: "POLISHED",
        origin: "ITALY"
    });

    // Valuation Panel
    const [valuationResults, setValuationResults] = useState(null);
    const [selectedValId, setSelectedValId] = useState("");
    const [valMethod, setValMethod] = useState("SPECIFIC_ID");

    // Load data
    const loadInventoryData = async () => {
        setLoading(true);
        try {
            // Fetch slabs and populate inventory mock/real tables
            const res = await axios.get("/api/granite/slabs");
            if (res.data.success) {
                const data = res.data.data;
                setInventory(data);
                setSlabs(data);

                // calculate stats
                const totalI = data.length;
                const totalA = data.reduce((acc, s) => acc + parseFloat(s.area_on_hand || 0), 0);
                const availI = data.filter(s => s.status === "AVAILABLE" || s.status === "ON_HAND").length;

                setStats({
                    totalItems: totalI,
                    totalArea: totalA,
                    availableItems: availI,
                    activeReservations: data.filter(s => s.status === "RESERVED").length,
                    activeAllocations: data.filter(s => s.status === "ALLOCATED").length
                });
            }
        } catch (err) {
            setError("Failed to fetch current inventory matrix.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadInventoryData();
    }, []);

    // 1. Submit Reservation
    const handleReserveSubmit = async (e) => {
        e.preventDefault();
        try {
            const res = await axios.post("/api/inventory/reserve", resForm);
            if (res.data.success) {
                alert("Soft Reservation Completed successfully.");
                setReservations([...reservations, res.data.data]);
                loadInventoryData();
            }
        } catch (err) {
            alert(err.response?.data?.message || "Failed to complete reservation.");
        }
    };

    // 2. Submit Allocation
    const handleAllocateSubmit = async (e) => {
        e.preventDefault();
        try {
            const res = await axios.post("/api/inventory/allocate", allocForm);
            if (res.data.success) {
                alert("Hard Inventory Allocation verified & recorded.");
                setAllocations([...allocations, res.data.data]);
                loadInventoryData();
            }
        } catch (err) {
            alert(err.response?.data?.message || "Failed to complete allocation.");
        }
    };

    // 3. Initiate Transfer
    const handleTransferSubmit = async (e) => {
        e.preventDefault();
        try {
            const res = await axios.post("/api/inventory/transfers", transferForm);
            if (res.data.success) {
                alert("Transfer sheet created. Status: In-Transit.");
                setTransfers([...transfers, res.data.data]);
                loadInventoryData();
            }
        } catch (err) {
            alert(err.response?.data?.message || "Failed to process transfer request.");
        }
    };

    const handleReceiveTransfer = async (id) => {
        try {
            const res = await axios.post(`/api/inventory/transfers/${id}/complete`);
            if (res.data.success) {
                alert("Transfer completed. Stock added to target warehouse.");
                loadInventoryData();
            }
        } catch (err) {
            alert(err.response?.data?.message || "Failed to complete receiving.");
        }
    };

    // 4. Adjustments
    const handleAdjustmentSubmit = async (e) => {
        e.preventDefault();
        try {
            const res = await axios.post("/api/inventory/adjustments", adjustmentForm);
            if (res.data.success) {
                alert("Adjustment draft generated.");
                setAdjustments([...adjustments, res.data.data]);
            }
        } catch (err) {
            alert(err.response?.data?.message || "Failed to create adjustment.");
        }
    };

    const handleApproveAdjustment = async (id) => {
        try {
            const res = await axios.post(`/api/inventory/adjustments/${id}/approve`);
            if (res.data.success) {
                alert("Adjustment approved. Slabs updated.");
                loadInventoryData();
            }
        } catch (err) {
            alert(err.response?.data?.message || "Failed to approve adjustment.");
        }
    };

    // 5. Audits
    const handleAuditSubmit = async (e) => {
        e.preventDefault();
        try {
            const res = await axios.post("/api/inventory/counts", auditForm);
            if (res.data.success) {
                alert("Cycle audit count list generated.");
                setAuditList([...auditList, res.data.data]);
                loadInventoryData();
            }
        } catch (err) {
            alert(err.response?.data?.message || "Failed to start counting.");
        }
    };

    const handleApproveAuditCount = async (id) => {
        try {
            const res = await axios.post(`/api/inventory/counts/${id}/approve`);
            if (res.data.success) {
                alert("Cycle Count audit approved and posted.");
                loadInventoryData();
            }
        } catch (err) {
            alert(err.response?.data?.message || "Failed to approve count sheet.");
        }
    };

    // 6. Slabs Cut
    const handleCreateSlab = async (e) => {
        e.preventDefault();
        try {
            const res = await axios.post("/api/granite/slabs/new", slabForm);
            if (res.data.success) {
                alert("Slab registered successfully.");
                loadInventoryData();
            }
        } catch (err) {
            alert(err.response?.data?.message || "Failed to create slab.");
        }
    };

    // 7. Valuation
    const checkValuation = async () => {
        if (!selectedValId) return;
        try {
            const res = await axios.get(`/api/inventory/${selectedValId}/valuation`, {
                params: { method: valMethod }
            });
            if (res.data.success) {
                setValuationResults(res.data.data);
            }
        } catch (err) {
            alert(err.response?.data?.message || "Failed to retrieve valuation.");
        }
    };

    return (
        <div className="card shadow-sm border-0">
            <div className="card-header bg-white border-bottom-0 py-3">
                <div className="d-flex justify-content-between align-items-center">
                    <div>
                        <h4 className="mb-0 fw-bold text-dark">Enterprise Inventory Control Engine</h4>
                        <p className="text-muted mb-0">Manage reservations, hard allocations, slab divisions, transfers, and specific ID stock audits.</p>
                    </div>
                    <button className="btn btn-outline-secondary btn-sm" onClick={loadInventoryData}>
                        🔄 Refresh Data
                    </button>
                </div>
            </div>

            <div className="card-body p-0">
                {/* Horizontal Navigation Tabs */}
                <div className="bg-light border-y p-2 d-flex">
                    {["dashboard", "reserve-allocate", "transfers", "adjustments", "cycle-audits", "granite-slab", "valuation"].map((tab) => (
                        <button
                            key={tab}
                            className={`btn btn-sm me-2 py-2 px-3 fw-bold text-capitalize ${activeSection === tab ? "btn-primary" : "btn-light text-secondary"}`}
                            onClick={() => setActiveSection(tab)}
                        >
                            {tab.replace("-", " ")}
                        </button>
                    ))}
                </div>

                <div className="p-4">
                    {/* 1. Dashboard View */}
                    {activeSection === "dashboard" && (
                        <div>
                            <div className="row g-4 mb-4">
                                <div className="col-12 col-md-3">
                                    <div className="card border-0 bg-dark text-white p-3 shadow-sm rounded">
                                        <small className="text-muted">Total Slab Units</small>
                                        <h3 className="mb-0 fw-bold">{stats.totalItems} Slabs</h3>
                                    </div>
                                </div>
                                <div className="col-12 col-md-3">
                                    <div className="card border-0 bg-primary text-white p-3 shadow-sm rounded">
                                        <small className="text-white-50">Total Area Size</small>
                                        <h3 className="mb-0 fw-bold">{stats.totalArea.toFixed(2)} SQFT</h3>
                                    </div>
                                </div>
                                <div className="col-12 col-md-3">
                                    <div className="card border-0 bg-success text-white p-3 shadow-sm rounded">
                                        <small className="text-white-50">Slabs On Hand</small>
                                        <h3 className="mb-0 fw-bold">{stats.availableItems} Avail</h3>
                                    </div>
                                </div>
                                <div className="col-12 col-md-3">
                                    <div className="card border-0 bg-warning text-dark p-3 shadow-sm rounded">
                                        <small className="text-dark-50">Reserved / Allocated</small>
                                        <h3 className="mb-0 fw-bold">{stats.activeReservations + stats.activeAllocations} Locked</h3>
                                    </div>
                                </div>
                            </div>

                            <h5 className="fw-bold mb-3">Live Stock Registry</h5>
                            <div className="table-responsive">
                                <table className="table table-hover align-middle">
                                    <thead className="table-light">
                                        <tr>
                                            <th>Slab Code</th>
                                            <th>Dimensions (L x W)</th>
                                            <th>Area (SQFT)</th>
                                            <th>Thickness</th>
                                            <th>Origin / Finish</th>
                                            <th>Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {inventory.map((item) => (
                                            <tr key={item.id}>
                                                <td className="fw-bold font-monospace text-primary">{item.slab_code}</td>
                                                <td>{item.length}” x {item.width}”</td>
                                                <td><strong>{parseFloat(item.area_on_hand).toFixed(2)}</strong> SQFT</td>
                                                <td>{item.thickness} mm</td>
                                                <td>{item.origin} / {item.finish}</td>
                                                <td>
                                                    <span className={`badge ${
                                                        item.status === 'AVAILABLE' || item.status === 'ON_HAND' ? 'bg-success bg-opacity-10 text-success' : 
                                                        item.status === 'RESERVED' ? 'bg-warning bg-opacity-10 text-warning' : 'bg-secondary bg-opacity-10 text-secondary'
                                                    }`}>{item.status}</span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* 2. Reserve & Allocate Tab */}
                    {activeSection === "reserve-allocate" && (
                        <div className="row">
                            <div className="col-md-6 border-end pe-4">
                                <h5 className="fw-bold text-primary mb-3">Create Soft/Hard Reservation</h5>
                                <form onSubmit={handleReserveSubmit}>
                                    <div className="mb-3">
                                        <label className="form-label">Select Slab Unit</label>
                                        <select className="form-select" value={resForm.inventory_object_id} onChange={(e) => setResForm({...resForm, inventory_object_id: e.target.value})} required>
                                            <option value="">-- Choose available slab --</option>
                                            {inventory.map(s => (
                                                <option key={s.id} value={s.id}>{s.slab_code} - {s.area_on_hand} SQFT ({s.status})</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="row mb-3">
                                        <div className="col-6">
                                            <label className="form-label">Reserved Qty</label>
                                            <input type="number" className="form-control" value={resForm.quantity} onChange={(e) => setResForm({...resForm, quantity: e.target.value})} required />
                                        </div>
                                        <div className="col-6">
                                            <label className="form-label">Reservation Type</label>
                                            <select className="form-select" value={resForm.reservation_type} onChange={(e) => setResForm({...resForm, reservation_type: e.target.value})}>
                                                <option value="SOFT">SOFT (No physical change)</option>
                                                <option value="HARD">HARD (Blocks status to RESERVED)</option>
                                            </select>
                                        </div>
                                    </div>
                                    <button type="submit" className="btn btn-primary w-100">Submit Reservation</button>
                                </form>
                            </div>

                            <div className="col-md-6 ps-4">
                                <h5 className="fw-bold text-success mb-3">Submit Hard Order Allocation</h5>
                                <form onSubmit={handleAllocateSubmit}>
                                    <div className="mb-3">
                                        <label className="form-label">Select Slab Unit</label>
                                        <select className="form-select" value={allocForm.inventory_object_id} onChange={(e) => setAllocForm({...allocForm, inventory_object_id: e.target.value})} required>
                                            <option value="">-- Choose available slab --</option>
                                            {inventory.map(s => (
                                                <option key={s.id} value={s.id}>{s.slab_code} - {s.area_on_hand} SQFT ({s.status})</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="row mb-3">
                                        <div className="col-6">
                                            <label className="form-label">Sales Reference ID</label>
                                            <input type="number" className="form-control" placeholder="10492" value={allocForm.reference_id} onChange={(e) => setAllocForm({...allocForm, reference_id: e.target.value})} required />
                                        </div>
                                        <div className="col-6">
                                            <label className="form-label">Allocated Qty</label>
                                            <input type="number" className="form-control" value={allocForm.quantity} readOnly />
                                        </div>
                                    </div>
                                    <button type="submit" className="btn btn-success w-100">Commit Allocation</button>
                                </form>
                            </div>
                        </div>
                    )}

                    {/* 3. Transfers Tab */}
                    {activeSection === "transfers" && (
                        <div>
                            <h5 className="fw-bold text-dark mb-3">Warehouse Stock Transfers</h5>
                            <form onSubmit={handleTransferSubmit} className="card p-3 mb-4 bg-light">
                                <div className="row g-3 align-items-center">
                                    <div className="col-md-3">
                                        <label className="form-label">Source Warehouse</label>
                                        <select className="form-select" value={transferForm.from_warehouse_id} onChange={(e) => setTransferForm({...transferForm, from_warehouse_id: e.target.value})}>
                                            <option value="1">Main Slab Depot (W1)</option>
                                            <option value="2">Sanitary & Tiles Loft (W2)</option>
                                        </select>
                                    </div>
                                    <div className="col-md-3">
                                        <label className="form-label">Destination Warehouse</label>
                                        <select className="form-select" value={transferForm.to_warehouse_id} onChange={(e) => setTransferForm({...transferForm, to_warehouse_id: e.target.value})}>
                                            <option value="2">Sanitary & Tiles Loft (W2)</option>
                                            <option value="1">Main Slab Depot (W1)</option>
                                        </select>
                                    </div>
                                    <div className="col-md-4">
                                        <label className="form-label">Choose Item</label>
                                        <select className="form-select" onChange={(e) => {
                                            const updated = { ...transferForm };
                                            updated.items[0].inventory_object_id = e.target.value;
                                            setTransferForm(updated);
                                        }} required>
                                            <option value="">-- Choose slab --</option>
                                            {inventory.map(s => (
                                                <option key={s.id} value={s.id}>{s.slab_code} ({s.status})</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="col-md-2 d-grid align-self-end">
                                        <button type="submit" className="btn btn-primary">Start Transfer</button>
                                    </div>
                                </div>
                            </form>

                            {/* Active in-transit transfers list */}
                            <h6 className="fw-bold mb-2">Pending In-Transit Sheets:</h6>
                            <div className="card p-3 bg-light">
                                {transfers.length === 0 ? <small className="text-muted">No active transfers currently in-transit.</small> : (
                                    <div className="list-group">
                                        {transfers.map((t, idx) => (
                                            <div key={idx} className="list-group-item d-flex justify-content-between align-items-center">
                                                <div>
                                                    <strong>{t.transfer_number}</strong> - Date: {t.transfer_date} | Status: <span className="badge bg-warning">{t.status}</span>
                                                </div>
                                                <button className="btn btn-sm btn-outline-success" onClick={() => handleReceiveTransfer(t.id)}>
                                                    ✅ Record Inbound Receipt
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* 4. Adjustments Tab */}
                    {activeSection === "adjustments" && (
                        <div>
                            <h5 className="fw-bold text-dark mb-3">Inventory Adjustments (Discrepancy / Damage)</h5>
                            <form onSubmit={handleAdjustmentSubmit} className="card p-3 mb-4 bg-light">
                                <div className="row g-3">
                                    <div className="col-md-3">
                                        <label className="form-label">Warehouse</label>
                                        <select className="form-select" value={adjustmentForm.warehouse_id} onChange={(e) => setAdjustmentForm({...adjustmentForm, warehouse_id: e.target.value})}>
                                            <option value="1">Main Slab Depot (W1)</option>
                                        </select>
                                    </div>
                                    <div className="col-md-3">
                                        <label className="form-label">Adjustment Type</label>
                                        <select className="form-select" value={adjustmentForm.adjustment_type} onChange={(e) => setAdjustmentForm({...adjustmentForm, adjustment_type: e.target.value})}>
                                            <option value="POSITIVE">Positive Add</option>
                                            <option value="NEGATIVE">Negative Deduct</option>
                                            <option value="DAMAGE">Damage Waste</option>
                                            <option value="SCRAP">Scrap</option>
                                        </select>
                                    </div>
                                    <div className="col-md-4">
                                        <label className="form-label">Slab Unit</label>
                                        <select className="form-select" onChange={(e) => {
                                            const updated = { ...adjustmentForm };
                                            updated.items[0].inventory_object_id = e.target.value;
                                            setAdjustmentForm(updated);
                                        }} required>
                                            <option value="">-- Choose slab --</option>
                                            {inventory.map(s => (
                                                <option key={s.id} value={s.id}>{s.slab_code} ({s.status})</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="col-md-2 d-grid align-self-end">
                                        <button type="submit" className="btn btn-danger">Log Discrepancy</button>
                                    </div>
                                </div>
                            </form>

                            {/* Authorizations queue */}
                            <h6 className="fw-bold mb-2">Adjustments Awaiting Approval (Manager Authorization):</h6>
                            <div className="card p-3 bg-light">
                                {adjustments.length === 0 ? <small className="text-muted">No pending stock adjustment sheets.</small> : (
                                    <div className="list-group">
                                        {adjustments.map((a, idx) => (
                                            <div key={idx} className="list-group-item d-flex justify-content-between align-items-center">
                                                <div>
                                                    <strong>{a.adjustment_number}</strong> - Type: {a.adjustment_type} | Status: <span className="badge bg-warning">{a.status}</span>
                                                </div>
                                                <button className="btn btn-sm btn-success" onClick={() => handleApproveAdjustment(a.id)}>
                                                    🔑 Approve & Post
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* 5. Cycle Audits Tab */}
                    {activeSection === "cycle-audits" && (
                        <div>
                            <h5 className="fw-bold text-dark mb-3">Cycle stock-take & Audit reconciliations</h5>
                            <form onSubmit={handleAuditSubmit} className="card p-3 mb-4 bg-light">
                                <div className="row g-3 align-items-center">
                                    <div className="col-md-4">
                                        <label className="form-label">Warehouse Scope</label>
                                        <select className="form-select" value={auditForm.warehouse_id} onChange={(e) => setAuditForm({...auditForm, warehouse_id: e.target.value})}>
                                            <option value="1">Main Slab Depot (W1)</option>
                                        </select>
                                    </div>
                                    <div className="col-md-4">
                                        <label className="form-label">Count Type</label>
                                        <select className="form-select" value={auditForm.count_type} onChange={(e) => setAuditForm({...auditForm, count_type: e.target.value})}>
                                            <option value="CYCLE">Random cycle check</option>
                                            <option value="ANNUAL">Annual comprehensive stocktake</option>
                                        </select>
                                    </div>
                                    <div className="col-md-4 d-grid align-self-end">
                                        <button type="submit" className="btn btn-dark">Initiate stocktake sheet</button>
                                    </div>
                                </div>
                            </form>

                            {/* Active counts */}
                            <h6 className="fw-bold mb-2">Ongoing Counts:</h6>
                            <div className="card p-3 bg-light">
                                {auditList.length === 0 ? <small className="text-muted">No ongoing cycle checks.</small> : (
                                    <div className="list-group">
                                        {auditList.map((c, idx) => (
                                            <div key={idx} className="list-group-item d-flex justify-content-between align-items-center">
                                                <div>
                                                    <strong>{c.count_number}</strong> - Type: {c.count_type} | Status: <span className="badge bg-warning">{c.status}</span>
                                                </div>
                                                <button className="btn btn-sm btn-outline-success" onClick={() => handleApproveAuditCount(c.id)}>
                                                    🔐 Verify & Close variances
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* 6. Granite Slab Tab */}
                    {activeSection === "granite-slab" && (
                        <div>
                            <h5 className="fw-bold text-dark mb-3">Register New Slab</h5>
                            <form onSubmit={handleCreateSlab} className="card p-3 mb-4 bg-light">
                                <div className="row g-3">
                                    <div className="col-md-3">
                                        <label className="form-label">Slab Code</label>
                                        <input type="text" className="form-control" placeholder="ONYX-ITAL-005" value={slabForm.slab_code} onChange={(e) => setSlabForm({...slabForm, slab_code: e.target.value})} required />
                                    </div>
                                    <div className="col-md-3">
                                        <label className="form-label">Product Variant ID</label>
                                        <input type="number" className="form-control" value={slabForm.product_variant_id} onChange={(e) => setSlabForm({...slabForm, product_variant_id: e.target.value})} />
                                    </div>
                                    <div className="col-md-2">
                                        <label className="form-label">Length (Inches)</label>
                                        <input type="number" className="form-control" value={slabForm.length} onChange={(e) => setSlabForm({...slabForm, length: e.target.value})} />
                                    </div>
                                    <div className="col-md-2">
                                        <label className="form-label">Width (Inches)</label>
                                        <input type="number" className="form-control" value={slabForm.width} onChange={(e) => setSlabForm({...slabForm, width: e.target.value})} />
                                    </div>
                                    <div className="col-md-2 d-grid align-self-end">
                                        <button type="submit" className="btn btn-primary">Create Slab</button>
                                    </div>
                                </div>
                            </form>
                        </div>
                    )}

                    {/* 7. Valuation Tab */}
                    {activeSection === "valuation" && (
                        <div>
                            <h5 className="fw-bold text-dark mb-3">Live Stock Cost Valuation</h5>
                            <div className="card p-3 mb-4 bg-light">
                                <div className="row g-3">
                                    <div className="col-md-5">
                                        <label className="form-label">Select Slab Unit</label>
                                        <select className="form-select" value={selectedValId} onChange={(e) => setSelectedValId(e.target.value)}>
                                            <option value="">-- Choose slab --</option>
                                            {inventory.map(s => (
                                                <option key={s.id} value={s.id}>{s.slab_code} (Area: {s.area_on_hand} SQFT)</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="col-md-4">
                                        <label className="form-label">Valuation Formula</label>
                                        <select className="form-select" value={valMethod} onChange={(e) => setValMethod(e.target.value)}>
                                            <option value="SPECIFIC_ID">SPECIFIC ID (Real costs basis)</option>
                                            <option value="FIFO">FIFO (First-In, First-Out)</option>
                                            <option value="LIFO">LIFO (Last-In, First-Out)</option>
                                            <option value="WAC">WAC (Weighted Average cost)</option>
                                        </select>
                                    </div>
                                    <div className="col-md-3 d-grid align-self-end">
                                        <button className="btn btn-info text-white" onClick={checkValuation}>Calculate Valuation</button>
                                    </div>
                                </div>
                            </div>

                            {valuationResults && (
                                <div className="alert alert-info border-0 shadow-sm p-4">
                                    <h5 className="fw-bold mb-2">Analytical Valuation Results</h5>
                                    <div>Method Code: <strong>{valuationResults.valuation_method}</strong></div>
                                    <div>Estimated Unit Cost: <strong>${parseFloat(valuationResults.unit_cost).toFixed(2)} / SQFT</strong></div>
                                    <div className="fs-4 mt-2 text-primary">Total Inventory Asset Value: <strong>${parseFloat(valuationResults.total_value).toFixed(2)}</strong></div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
