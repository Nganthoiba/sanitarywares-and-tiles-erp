import React, { useState, useEffect } from "react";
import axios from "axios";

export default function SlabInventoryView() {
    const [slabs, setSlabs] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [search, setSearch] = useState("");
    const [warehouseFilter, setWarehouseFilter] = useState("");
    const [statusFilter, setStatusFilter] = useState("");

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalSlabs, setTotalSlabs] = useState(0);

    // Cutting Modal State
    const [selectedSlab, setSelectedSlab] = useState(null);
    const [splits, setSplits] = useState([{ length: "", width: "" }]);
    const [splittingLoader, setSplittingLoader] = useState(false);
    const [splitResult, setSplitResult] = useState(null);

    // Fetch Slabs
    const fetchSlabs = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await axios.get("/api/granite/slabs", {
                params: {
                    search,
                    warehouse_id: warehouseFilter,
                    status: statusFilter,
                    page: currentPage,
                    per_page: 5, // smaller per_page for high-density listing
                },
            });
            if (response.data.success) {
                setSlabs(response.data.data);
                if (response.data.meta) {
                    setTotalPages(response.data.meta.last_page);
                    setTotalSlabs(response.data.meta.total);
                }
            } else {
                setError(response.data.message || "Failed to fetch inventory.");
            }
        } catch (err) {
            setError(
                "Error contacting server. Please verify database connection.",
            );
        } finally {
            setLoading(false);
        }
    };

    // Fetch on filter/page change
    useEffect(() => {
        fetchSlabs();
    }, [currentPage, warehouseFilter, statusFilter]);

    // Handle Split input change
    const handleSplitChange = (index, field, value) => {
        const updated = [...splits];
        updated[index][field] = value;
        setSplits(updated);
    };

    // Add another split piece
    const addSplitPiece = () => {
        setSplits([...splits, { length: "", width: "" }]);
    };

    // Remove a split piece
    const removeSplitPiece = (index) => {
        if (splits.length > 1) {
            setSplits(splits.filter((_, i) => i !== index));
        }
    };

    // Submit split calculation
    const handleSplitSubmit = async (e) => {
        e.preventDefault();
        if (!selectedSlab) return;

        setSplittingLoader(true);
        setSplitResult(null);

        // Convert splits strings to numbers
        const payload = {
            splits: splits.map((s) => ({
                length: parseFloat(s.length),
                width: parseFloat(s.width),
            })),
        };

        try {
            const response = await axios.post(
                `/api/granite/slabs/${selectedSlab.id}/cut`,
                payload,
            );
            if (response.data.success) {
                setSplitResult(response.data.data);
                // Refresh list
                fetchSlabs();
            } else {
                alert(response.data.message || "Operation failed.");
            }
        } catch (err) {
            const apiError =
                err.response?.data?.message ||
                "Failed to execute split transaction checks.";
            alert("Error: " + apiError);
        } finally {
            setSplittingLoader(false);
        }
    };

    const handleOpenCutModal = (slab) => {
        setSelectedSlab(slab);
        setSplits([{ length: "", width: "" }]);
        setSplitResult(null);
    };

    return (
        <div>
            {/* Header section / Stats */}
            <div className="row g-4 mb-4">
                <div className="col-12 col-md-4">
                    <div
                        className="card border-0 shadow-sm bg-gradient text-white p-4"
                        style={{
                            background:
                                "linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)",
                        }}
                    >
                        <div className="d-flex justify-content-between align-items-center">
                            <div>
                                <h6
                                    className="text-uppercase text-white-50 mb-1 fw-bold"
                                    style={{ fontSize: "0.8rem" }}
                                >
                                    Total Slabs On Hand
                                </h6>
                                <h2 className="mb-0 fw-bold">
                                    {totalSlabs} Pieces
                                </h2>
                            </div>
                            <div
                                className="bg-white bg-opacity-25 rounded-circle p-3 d-flex align-items-center justify-content-center"
                                style={{ width: "56px", height: "56px" }}
                            >
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    width="24"
                                    height="24"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    className="text-white"
                                >
                                    <rect
                                        width="18"
                                        height="18"
                                        x="3"
                                        y="3"
                                        rx="2"
                                    />
                                    <path d="M3 9h18" />
                                    <path d="M9 21V9" />
                                </svg>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="col-12 col-md-4">
                    <div
                        className="card border-0 shadow-sm bg-gradient text-white p-4"
                        style={{
                            background:
                                "linear-gradient(135deg, #0f2027 0%, #203a43 50%, #2c5364 100%)",
                        }}
                    >
                        <div className="d-flex justify-content-between align-items-center">
                            <div>
                                <h6
                                    className="text-uppercase text-white-50 mb-1 fw-bold"
                                    style={{ fontSize: "0.8rem" }}
                                >
                                    Total Dynamic Area
                                </h6>
                                <h2 className="mb-0 fw-bold">
                                    {slabs
                                        .reduce(
                                            (acc, s) =>
                                                acc + (s.area_on_hand || 0),
                                            0,
                                        )
                                        .toFixed(2)}{" "}
                                    SQFT
                                </h2>
                            </div>
                            <div
                                className="bg-white bg-opacity-25 rounded-circle p-3 d-flex align-items-center justify-content-center"
                                style={{ width: "56px", height: "56px" }}
                            >
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    width="24"
                                    height="24"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    className="text-white"
                                >
                                    <path d="M5 3a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2H5Zm0 16V5h14v14H5Z" />
                                </svg>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="col-12 col-md-4">
                    <div
                        className="card border-0 shadow-sm bg-gradient text-white p-4"
                        style={{
                            background:
                                "linear-gradient(135deg, #11998e 0%, #38ef7d 100%)",
                        }}
                    >
                        <div className="d-flex justify-content-between align-items-center">
                            <div>
                                <h6
                                    className="text-uppercase text-white-50 mb-1 fw-bold"
                                    style={{ fontSize: "0.8rem" }}
                                >
                                    Operational Slabs
                                </h6>
                                <h2 className="mb-0 fw-bold">
                                    {
                                        slabs.filter(
                                            (s) => s.status === "AVAILABLE",
                                        ).length
                                    }{" "}
                                    Available
                                </h2>
                            </div>
                            <div
                                className="bg-white bg-opacity-25 rounded-circle p-3 d-flex align-items-center justify-content-center"
                                style={{ width: "56px", height: "56px" }}
                            >
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    width="24"
                                    height="24"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    className="text-white"
                                >
                                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                                    <polyline points="22 4 12 14.01 9 11.01" />
                                </svg>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Filter Bar */}
            <div className="card shadow-sm border-0 mb-4 bg-light">
                <div className="card-body">
                    <div className="row g-3 align-items-center">
                        <div className="col-12 col-md-4">
                            <div className="input-group">
                                <span className="input-group-text bg-white border-end-0">
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        width="16"
                                        height="16"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        viewBox="0 0 24 24"
                                    >
                                        <circle cx="11" cy="11" r="8" />
                                        <path d="m21 21-4.3-4.3" />
                                    </svg>
                                </span>
                                <input
                                    type="text"
                                    className="form-control border-start-0"
                                    placeholder="Search slab code or variants..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                />
                            </div>
                        </div>
                        <div className="col-6 col-md-3">
                            <select
                                className="form-select"
                                value={warehouseFilter}
                                onChange={(e) =>
                                    setWarehouseFilter(e.target.value)
                                }
                            >
                                <option value="">All Warehouses</option>
                                <option value="1">Main Slab Depot</option>
                            </select>
                        </div>
                        <div className="col-6 col-md-3">
                            <select
                                className="form-select"
                                value={statusFilter}
                                onChange={(e) =>
                                    setStatusFilter(e.target.value)
                                }
                            >
                                <option value="">All Statuses</option>
                                <option value="AVAILABLE">Available</option>
                                <option value="ALLOCATED">Allocated</option>
                                <option value="SCRAPED">Scraped</option>
                            </select>
                        </div>
                        <div className="col-12 col-md-2 d-grid">
                            <button
                                className="btn btn-primary"
                                onClick={() => fetchSlabs()}
                            >
                                Query
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Slabs Grid / Table */}
            <div className="card border-0 shadow-sm">
                <div className="card-header bg-white py-3 border-bottom-0">
                    <div className="d-flex justify-content-between align-items-center">
                        <h5 className="mb-0 fw-bold text-dark">
                            Physical Slabs Ledger
                        </h5>
                    </div>
                </div>
                <div className="table-responsive">
                    <table className="table table-hover align-middle mb-0">
                        <thead
                            className="table-light text-uppercase font-monospace"
                            style={{
                                fontSize: "0.75rem",
                                letterSpacing: "0.5px",
                            }}
                        >
                            <tr>
                                <th>Slab Code</th>
                                <th>Item details</th>
                                <th>Finish</th>
                                <th>Dimensions (Inches)</th>
                                <th>Slab Area</th>
                                <th>Stock Status</th>
                                <th className="text-end">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading && (
                                <tr>
                                    <td
                                        colSpan="7"
                                        className="text-center py-5"
                                    >
                                        <div
                                            className="spinner-border text-primary"
                                            role="status"
                                        >
                                            <span className="visually-hidden">
                                                Loading...
                                            </span>
                                        </div>
                                        <p className="mt-2 text-muted mb-0">
                                            Contacting inventory database...
                                        </p>
                                    </td>
                                </tr>
                            )}
                            {!loading && slabs.length === 0 && (
                                <tr>
                                    <td
                                        colSpan="7"
                                        className="text-center py-5"
                                    >
                                        <svg
                                            xmlns="http://www.w3.org/2000/svg"
                                            width="48"
                                            height="48"
                                            fill="none"
                                            stroke="currentColor"
                                            strokeWidth="1"
                                            viewBox="0 0 24 24"
                                            className="text-muted mb-3"
                                        >
                                            <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z" />
                                            <path d="M6 6h10M6 10h10" />
                                        </svg>
                                        <p className="text-muted fw-bold">
                                            No slabs matching the filter
                                            criteria were found.
                                        </p>
                                    </td>
                                </tr>
                            )}
                            {!loading &&
                                slabs.map((slab) => (
                                    <tr key={slab.id}>
                                        <td className="fw-bold text-primary font-monospace">
                                            {slab.slab_code}
                                        </td>
                                        <td>
                                            <div className="fw-semibold">
                                                {slab.variant_name ||
                                                    "Italian Onyx Granite"}
                                            </div>
                                            <small className="text-muted">
                                                {slab.origin} Slab / Thk:{" "}
                                                {slab.thickness}”
                                            </small>
                                        </td>
                                        <td>
                                            <span className="badge bg-secondary bg-opacity-10 text-secondary">
                                                {slab.finish}
                                            </span>
                                        </td>
                                        <td className="font-monospace fw-semibold">
                                            {slab.length}” x {slab.width}”
                                        </td>
                                        <td>
                                            <span className="fw-bold text-dark">
                                                {slab.area_on_hand.toFixed(2)}
                                            </span>
                                            <small className="text-muted font-monospace ms-1">
                                                SQFT
                                            </small>
                                        </td>
                                        <td>
                                            <span
                                                className={`badge ${
                                                    slab.status === "AVAILABLE"
                                                        ? "bg-success bg-opacity-10 text-success"
                                                        : slab.status ===
                                                            "ALLOCATED"
                                                          ? "bg-warning bg-opacity-10 text-warning"
                                                          : "bg-danger bg-opacity-10 text-danger"
                                                }`}
                                            >
                                                {slab.status}
                                            </span>
                                        </td>
                                        <td className="text-end">
                                            <button
                                                className="btn btn-sm btn-outline-primary border-0"
                                                disabled={
                                                    slab.status !== "AVAILABLE"
                                                }
                                                onClick={() =>
                                                    handleOpenCutModal(slab)
                                                }
                                                data-bs-toggle="modal"
                                                data-bs-target="#cutSlabModal"
                                            >
                                                <svg
                                                    xmlns="http://www.w3.org/2000/svg"
                                                    width="16"
                                                    height="16"
                                                    viewBox="0 0 24 24"
                                                    fill="none"
                                                    stroke="currentColor"
                                                    strokeWidth="2"
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    className="me-1"
                                                >
                                                    <line
                                                        x1="6"
                                                        x12="18"
                                                        y1="6"
                                                        y2="18"
                                                    />
                                                    <line
                                                        x1="18"
                                                        x12="6"
                                                        y1="6"
                                                        y2="18"
                                                    />
                                                </svg>
                                                Cut/Split Remnant
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                        </tbody>
                    </table>
                </div>

                {/* Pagination footer */}
                {!loading && totalPages > 1 && (
                    <div className="card-footer bg-white border-top-0 d-flex justify-content-between align-items-center py-3">
                        <small className="text-muted">
                            Showing sheet page {currentPage} of {totalPages}
                        </small>
                        <nav>
                            <ul className="pagination pagination-sm mb-0">
                                <li
                                    className={`page-item ${currentPage === 1 ? "disabled" : ""}`}
                                >
                                    <button
                                        className="page-link"
                                        onClick={() =>
                                            setCurrentPage(currentPage - 1)
                                        }
                                    >
                                        Prev
                                    </button>
                                </li>
                                {Array.from(
                                    { length: totalPages },
                                    (_, i) => i + 1,
                                ).map((p) => (
                                    <li
                                        key={p}
                                        className={`page-item ${p === currentPage ? "active" : ""}`}
                                    >
                                        <button
                                            className="page-link"
                                            onClick={() => setCurrentPage(p)}
                                        >
                                            {p}
                                        </button>
                                    </li>
                                ))}
                                <li
                                    className={`page-item ${currentPage === totalPages ? "disabled" : ""}`}
                                >
                                    <button
                                        className="page-link"
                                        onClick={() =>
                                            setCurrentPage(currentPage + 1)
                                        }
                                    >
                                        Next
                                    </button>
                                </li>
                            </ul>
                        </nav>
                    </div>
                )}
            </div>

            {/* Cut Slab Modal */}
            <div
                className="modal fade"
                id="cutSlabModal"
                tabIndex="-1"
                aria-labelledby="cutSlabModalLabel"
                aria-hidden="true"
            >
                <div className="modal-dialog modal-lg modal-dialog-centered">
                    <div className="modal-content border-0 shadow">
                        <div className="modal-header bg-dark text-white py-3">
                            <h5
                                className="modal-title fw-bold"
                                id="cutSlabModalLabel"
                            >
                                Split Physical Slab
                            </h5>
                            <button
                                type="button"
                                className="btn-close btn-close-white"
                                data-bs-dismiss="modal"
                                aria-label="Close"
                            ></button>
                        </div>
                        <form onSubmit={handleSplitSubmit}>
                            <div className="modal-body p-4">
                                {selectedSlab && (
                                    <div className="card border-0 bg-light p-3 mb-4">
                                        <div className="row">
                                            <div className="col-12 col-md-6">
                                                <small className="text-muted text-uppercase fw-bold font-monospace">
                                                    Parent Slab Code
                                                </small>
                                                <h5 className="fw-bold font-monospace mt-1 text-primary">
                                                    {selectedSlab.slab_code}
                                                </h5>
                                            </div>
                                            <div className="col-12 col-md-6 text-md-end">
                                                <small className="text-muted text-uppercase fw-bold font-monospace">
                                                    Parent Slab Area
                                                </small>
                                                <h5 className="fw-bold mt-1">
                                                    {selectedSlab.area_on_hand.toFixed(
                                                        2,
                                                    )}{" "}
                                                    SQFT
                                                </h5>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Validation Success State */}
                                {splitResult && (
                                    <div className="alert alert-success border-0 shadow-sm p-4 mb-4">
                                        <div className="d-flex align-items-center mb-3">
                                            <svg
                                                xmlns="http://www.w3.org/2000/svg"
                                                width="28"
                                                height="28"
                                                viewBox="0 0 24 24"
                                                fill="none"
                                                stroke="currentColor"
                                                strokeWidth="2.5"
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                className="text-success me-2"
                                            >
                                                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                                                <polyline points="22 4 12 14.01 9 11.01" />
                                            </svg>
                                            <h5 className="mb-0 fw-bold text-success">
                                                Split Computed Cleanly!
                                            </h5>
                                        </div>
                                        <div className="row g-3">
                                            <div className="col-6">
                                                <small className="text-muted d-block">
                                                    Parent Remaining Area:
                                                </small>
                                                <strong className="fs-5">
                                                    {splitResult.parent.area_on_hand.toFixed(
                                                        4,
                                                    )}{" "}
                                                    SQFT
                                                </strong>
                                            </div>
                                            <div className="col-6">
                                                <small className="text-muted d-block">
                                                    Parent Status:
                                                </small>
                                                <span className="badge bg-secondary">
                                                    {splitResult.parent.status}
                                                </span>
                                            </div>
                                        </div>
                                        <hr />
                                        <h6 className="fw-bold mb-2 text-success-emphasis">
                                            Remnants Generated:
                                        </h6>
                                        <div className="list-group">
                                            {splitResult.children.map(
                                                (child, i) => (
                                                    <div
                                                        key={i}
                                                        className="list-group-item d-flex justify-content-between align-items-center bg-white bg-opacity-75 border-0 rounded mb-2"
                                                    >
                                                        <span className="font-monospace fw-bold text-primary">
                                                            {child.slab_code}
                                                        </span>
                                                        <span>
                                                            <strong className="font-monospace">
                                                                {child.area_on_hand.toFixed(
                                                                    4,
                                                                )}
                                                            </strong>{" "}
                                                            SQFT
                                                        </span>
                                                    </div>
                                                ),
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* Configure split pieces */}
                                {!splitResult && (
                                    <>
                                        <div className="d-flex justify-content-between align-items-center mb-3">
                                            <h6 className="fw-bold mb-0 text-dark">
                                                Define Target Cut Dimensions
                                            </h6>
                                            <button
                                                type="button"
                                                className="btn btn-sm btn-outline-success border-0 fw-bold"
                                                onClick={addSplitPiece}
                                            >
                                                + Add Split Piece
                                            </button>
                                        </div>

                                        {splits.map((s, idx) => (
                                            <div
                                                key={idx}
                                                className="row g-3 align-items-center mb-3"
                                            >
                                                <div className="col-1 text-center">
                                                    <span className="badge bg-dark rounded-circle">
                                                        {idx + 1}
                                                    </span>
                                                </div>
                                                <div className="col-5">
                                                    <div className="input-group">
                                                        <input
                                                            type="number"
                                                            className="form-control"
                                                            placeholder="Length"
                                                            value={s.length}
                                                            onChange={(e) =>
                                                                handleSplitChange(
                                                                    idx,
                                                                    "length",
                                                                    e.target
                                                                        .value,
                                                                )
                                                            }
                                                            required
                                                        />
                                                        <span className="input-group-text bg-light text-muted">
                                                            in
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className="col-5">
                                                    <div className="input-group">
                                                        <input
                                                            type="number"
                                                            className="form-control"
                                                            placeholder="Width"
                                                            value={s.width}
                                                            onChange={(e) =>
                                                                handleSplitChange(
                                                                    idx,
                                                                    "width",
                                                                    e.target
                                                                        .value,
                                                                )
                                                            }
                                                            required
                                                        />
                                                        <span className="input-group-text bg-light text-muted">
                                                            in
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className="col-1 text-end">
                                                    <button
                                                        type="button"
                                                        className="btn btn-outline-danger border-0 p-1"
                                                        disabled={
                                                            splits.length === 1
                                                        }
                                                        onClick={() =>
                                                            removeSplitPiece(
                                                                idx,
                                                            )
                                                        }
                                                    >
                                                        <svg
                                                            xmlns="http://www.w3.org/2000/svg"
                                                            width="18"
                                                            height="18"
                                                            fill="none"
                                                            stroke="currentColor"
                                                            strokeWidth="2"
                                                            strokeLinecap="round"
                                                            strokeLinejoin="round"
                                                            viewBox="0 0 24 24"
                                                        >
                                                            <path d="M3 6h18" />
                                                            <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                                                            <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                                                        </svg>
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </>
                                )}
                            </div>
                            <div className="modal-footer bg-light border-top-0 py-3">
                                <button
                                    type="button"
                                    className="btn btn-outline-secondary"
                                    data-bs-dismiss="modal"
                                >
                                    Close
                                </button>
                                {!splitResult && (
                                    <button
                                        type="submit"
                                        className="btn btn-primary px-4 fw-semibold"
                                        disabled={splittingLoader}
                                    >
                                        {splittingLoader ? (
                                            <>
                                                <span
                                                    className="spinner-border spinner-border-sm me-2"
                                                    role="status"
                                                    aria-hidden="true"
                                                ></span>
                                                Executing...
                                            </>
                                        ) : (
                                            "Validate & Scrap/Cut Parent"
                                        )}
                                    </button>
                                )}
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}
