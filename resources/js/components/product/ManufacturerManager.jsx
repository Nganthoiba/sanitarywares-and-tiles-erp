import React, { useState, useEffect } from 'react';
import axios from 'axios';

export default function ManufacturerManager() {
    const [manufacturers, setManufacturers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');

    // Determine if current user is Super Admin
    const [isSuperAdmin, setIsSuperAdmin] = useState(() => {
        try {
            const activeRole = JSON.parse(localStorage.getItem('user_active_role') || 'null');
            if (activeRole && activeRole.slug === 'super-admin') return true;

            const roles = JSON.parse(localStorage.getItem('user_roles') || '[]');
            return roles.some(r => (typeof r === 'object' ? r.slug === 'super-admin' : r === 'super-admin'));
        } catch (e) {
            return false;
        }
    });

    // Modal state
    const [showModal, setShowModal] = useState(false);
    const [modalMode, setModalMode] = useState('create'); // 'create', 'edit'
    const [selectedManufacturer, setSelectedManufacturer] = useState(null);
    const [modalError, setModalError] = useState(null);
    const [modalSuccess, setModalSuccess] = useState(null);
    const [submitting, setSubmitting] = useState(false);

    // Duplicate search & verification states
    const [searchStep, setSearchStep] = useState(true); // Search first before form
    const [checkingDuplicates, setCheckingDuplicates] = useState(false);
    const [duplicateResult, setDuplicateResult] = useState(null);
    const [forceCreate, setForceCreate] = useState(false);

    const [form, setForm] = useState({
        legal_name: '',
        trade_name: '',
        gstin: '',
        registration_number: '',
        business_constitution: '',
        address: '',
        phone: '',
        email: '',
        website: '',
        is_active: true,
        verification_status: 'UNVERIFIED'
    });

    const fetchManufacturers = async (query = '') => {
        setLoading(true);
        setError(null);
        try {
            const token = localStorage.getItem('auth_token');
            const res = await axios.get('/api/manufacturers-crud', {
                headers: { Authorization: `Bearer ${token}` },
                params: { query: query || undefined }
            });
            setManufacturers(res.data || []);
        } catch (err) {
            setError('Failed to fetch global manufacturers registry.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchManufacturers(searchQuery);
    }, [searchQuery]);

    const handleOpenCreate = () => {
        setModalMode('create');
        setSelectedManufacturer(null);
        setSearchStep(true);
        setDuplicateResult(null);
        setForceCreate(false);
        setForm({
            legal_name: '',
            trade_name: '',
            gstin: '',
            registration_number: '',
            business_constitution: 'PRIVATE_LIMITED',
            address: '',
            phone: '',
            email: '',
            website: '',
            is_active: true,
            verification_status: 'UNVERIFIED'
        });
        setError(null);
        setModalError(null);
        setModalSuccess(null);
        setShowModal(true);
    };

    const handleOpenEdit = (manufacturer) => {
        if (!isSuperAdmin) return;
        setModalMode('edit');
        setSelectedManufacturer(manufacturer);
        setSearchStep(false);
        setDuplicateResult(null);
        setForm({
            legal_name: manufacturer.legal_name || manufacturer.name || '',
            trade_name: manufacturer.trade_name || '',
            gstin: manufacturer.gstin || '',
            registration_number: manufacturer.registration_number || '',
            business_constitution: manufacturer.business_constitution || 'PRIVATE_LIMITED',
            address: manufacturer.address || '',
            phone: manufacturer.phone || '',
            email: manufacturer.email || '',
            website: manufacturer.website || '',
            is_active: manufacturer.is_active === 1 || manufacturer.is_active === true,
            verification_status: manufacturer.verification_status || 'UNVERIFIED'
        });
        setError(null);
        setModalError(null);
        setModalSuccess(null);
        setShowModal(true);
    };

    const handleDelete = async (manufacturer) => {
        if (!isSuperAdmin) return;
        if (!confirm(`Are you sure you want to delete global manufacturer "${manufacturer.legal_name || manufacturer.name}"? This action cannot be undone.`)) {
            return;
        }
        setError(null);
        setSuccess(null);
        try {
            const token = localStorage.getItem('auth_token');
            await axios.delete(`/api/manufacturers-crud/${manufacturer.id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setSuccess('Manufacturer successfully removed from global master.');
            fetchManufacturers(searchQuery);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to delete manufacturer.');
        }
    };

    const handleCheckDuplicate = async () => {
        if (!form.legal_name && !form.gstin) {
            setModalError('Please enter a Legal Name or GSTIN to search existing master.');
            return;
        }
        setCheckingDuplicates(true);
        setError(null);
        setModalError(null);
        setModalSuccess(null);

        try {
            const token = localStorage.getItem('auth_token');
            const res = await axios.post('/api/manufacturers-crud/check-duplicates', {
                legal_name: form.legal_name,
                trade_name: form.trade_name,
                gstin: form.gstin
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            setDuplicateResult(res.data);
            if (!res.data.has_exact_match && !res.data.has_possible_match) {
                // No matches, advance directly to form
                setSearchStep(false);
            }
        } catch (err) {
            setModalError('Failed to check duplicate manufacturer master records.');
        } finally {
            setCheckingDuplicates(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setSuccess(null);
        setModalError(null);
        setModalSuccess(null);
        setSubmitting(true);

        try {
            const token = localStorage.getItem('auth_token');
            let successMessage = '';
            if (modalMode === 'create') {
                const res = await axios.post('/api/manufacturers-crud', {
                    ...form,
                    force: forceCreate
                }, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                successMessage = res.data.message || 'Manufacturer added to global master successfully.';
            } else {
                const res = await axios.put(`/api/manufacturers-crud/${selectedManufacturer.id}`, form, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                successMessage = res.data.message || 'Global manufacturer updated successfully.';
            }
            
            // Display success message inside modal directly
            setModalSuccess(successMessage);
            setSuccess(successMessage);
            fetchManufacturers(searchQuery);

            // Keep modal open briefly to show the success response before auto-closing
            setTimeout(() => {
                setShowModal(false);
                setModalSuccess(null);
            }, 1800);
        } catch (err) {
            if (err.response?.data?.duplicate_type) {
                setDuplicateResult({
                    has_exact_match: err.response.data.duplicate_type === 'exact_gstin',
                    exact_match: err.response.data.existing_manufacturer,
                    has_possible_match: err.response.data.duplicate_type === 'possible_name',
                    possible_matches: [err.response.data.existing_manufacturer]
                });
                setSearchStep(true);
                setModalError(err.response?.data?.message || 'A matching manufacturer already exists in global master.');
            } else {
                let errMessage = err.response?.data?.message || 'Failed to save manufacturer.';
                if (err.response?.data?.errors) {
                    const validationMsgs = Object.values(err.response.data.errors).flat().join(' ');
                    if (validationMsgs) errMessage = validationMsgs;
                }
                setModalError(errMessage);
            }
        } finally {
            setSubmitting(false);
        }
    };

    const handleChange = (field, value) => {
        setForm(prev => ({ ...prev, [field]: value }));
    };

    return (
        <div className="animate__animated animate__fadeIn">
            {/* Header Banner */}
            <div className="d-flex align-items-center justify-content-between mb-4">
                <div>
                    <h3 className="fw-bold text-dark">
                        <i className="fa-solid fa-industry me-2 text-primary"></i>Global Manufacturer Master
                    </h3>
                    <p className="text-muted small mb-0">
                        Independent real-world manufacturer directory shared across organizations.
                    </p>
                </div>
                <button className="btn btn-primary px-4 shadow-sm" onClick={handleOpenCreate}>
                    <i className="fa-solid fa-plus me-2"></i> Add Manufacturer to Master
                </button>
            </div>

            {error && (
                <div className="alert alert-danger d-flex align-items-center justify-content-between mb-4 animate__animated animate__shakeX" role="alert">
                    <div className="d-flex align-items-center">
                        <i className="fa-solid fa-circle-exclamation me-2 fs-5"></i>
                        <div>{error}</div>
                    </div>
                    <button type="button" className="btn-close ms-2 flex-shrink-0" onClick={() => setError(null)} aria-label="Close"></button>
                </div>
            )}

            {success && (
                <div className="alert alert-success d-flex align-items-center justify-content-between mb-4 animate__animated animate__fadeIn" role="alert">
                    <div className="d-flex align-items-center">
                        <i className="fa-solid fa-circle-check me-2 fs-5"></i>
                        <div>{success}</div>
                    </div>
                    <button type="button" className="btn-close ms-2 flex-shrink-0" onClick={() => setSuccess(null)} aria-label="Close"></button>
                </div>
            )}

            {/* Filter & Search Bar Card */}
            <div className="card border-0 shadow-sm p-3 mb-4" style={{ borderRadius: '12px' }}>
                <div className="row g-3 align-items-center">
                    <div className="col-md-6">
                        <div className="input-group">
                            <span className="input-group-text bg-white border-end-0 text-muted"><i className="fa-solid fa-magnifying-glass"></i></span>
                            <input 
                                type="text" 
                                className="form-control border-start-0" 
                                placeholder="Search by Legal Name, Trade Name, GSTIN, or Reg. Number..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                            {searchQuery && (
                                <button className="btn btn-outline-secondary border-start-0" onClick={() => setSearchQuery('')}>Clear</button>
                            )}
                        </div>
                    </div>
                    <div className="col-md-6 text-end">
                        <span className="badge bg-light text-secondary border font-monospace py-2 px-3">
                            Total Records: {manufacturers.length}
                        </span>
                    </div>
                </div>
            </div>

            {/* Manufacturer Master Directory Table Card */}
            <div className="card border-0 shadow-sm p-4" style={{ borderRadius: '12px' }}>
                {loading ? (
                    <div className="text-center py-5">
                        <div className="spinner-border text-primary" role="status"></div>
                        <span className="ms-2 font-monospace">Fetching global manufacturers directory...</span>
                    </div>
                ) : (
                    <div className="table-responsive">
                        <table className="table table-hover align-middle">
                            <thead>
                                <tr className="text-secondary font-monospace" style={{ fontSize: '0.8rem' }}>
                                    <th>Legal / Trade Name</th>
                                    <th>GSTIN / Reg No.</th>
                                    <th>Contact Details</th>
                                    <th>Verification</th>
                                    <th>Status</th>
                                    <th className="text-end">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {manufacturers.map((m) => (
                                    <tr key={m.id}>
                                        <td>
                                            <div className="fw-bold text-dark">{m.legal_name || m.name}</div>
                                            {m.trade_name && m.trade_name !== m.legal_name && (
                                                <div className="text-muted small">Trade: {m.trade_name}</div>
                                            )}
                                        </td>
                                        <td>
                                            <div className="small font-monospace fw-semibold text-dark">{m.gstin || <span className="text-muted font-normal italic">-</span>}</div>
                                            {m.registration_number && (
                                                <div className="text-secondary small font-monospace">Reg: {m.registration_number}</div>
                                            )}
                                        </td>
                                        <td>
                                            <div className="small">{m.phone || <span className="text-muted small italic">-</span>}</div>
                                            <div className="text-secondary small">{m.email}</div>
                                        </td>
                                        <td>
                                            {m.verification_status === 'VERIFIED' ? (
                                                <span className="badge bg-success-subtle text-success border border-success-subtle px-2 py-1">
                                                    <i className="fa-solid fa-shield-check me-1"></i> VERIFIED
                                                </span>
                                            ) : m.verification_status === 'REJECTED' ? (
                                                <span className="badge bg-danger-subtle text-danger border border-danger-subtle px-2 py-1">
                                                    <i className="fa-solid fa-shield-xmark me-1"></i> REJECTED
                                                </span>
                                            ) : (
                                                <span className="badge bg-warning-subtle text-warning border border-warning-subtle px-2 py-1">
                                                    <i className="fa-solid fa-clock me-1"></i> UNVERIFIED
                                                </span>
                                            )}
                                        </td>
                                        <td>
                                            {m.is_active === 1 || m.is_active === true ? (
                                                <span className="badge bg-success-subtle text-success px-2 py-1">
                                                    <i className="fa-solid fa-circle-check me-1"></i> ACTIVE
                                                </span>
                                            ) : (
                                                <span className="badge bg-danger-subtle text-danger px-2 py-1">
                                                    <i className="fa-solid fa-circle-xmark me-1"></i> INACTIVE
                                                </span>
                                            )}
                                        </td>
                                        <td className="text-end">
                                            {isSuperAdmin ? (
                                                <div className="d-flex justify-content-end gap-1">
                                                    <button
                                                        className="btn btn-xs btn-outline-primary px-2"
                                                        onClick={() => handleOpenEdit(m)}
                                                        style={{ fontSize: '0.75rem' }}
                                                        title="Edit Global Manufacturer"
                                                    >
                                                        <i className="fa-solid fa-pen me-1"></i> Edit
                                                    </button>
                                                    <button
                                                        className="btn btn-xs btn-outline-danger px-2"
                                                        onClick={() => handleDelete(m)}
                                                        style={{ fontSize: '0.75rem' }}
                                                        title="Delete Global Manufacturer"
                                                    >
                                                        <i className="fa-solid fa-trash me-1"></i> Delete
                                                    </button>
                                                </div>
                                            ) : (
                                                <span className="text-muted small font-monospace opacity-75" title="Shared Master Record — Only Super Admin can edit or delete">
                                                    <i className="fa-solid fa-lock me-1"></i> Shared Master
                                                </span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                                {manufacturers.length === 0 && (
                                    <tr>
                                        <td colSpan="6" className="text-center py-5 text-muted font-monospace">
                                            No manufacturers found in global master. Click 'Add Manufacturer to Master' to add one.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* CREATE / EDIT MODAL */}
            {showModal && (
                <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(4px)', zIndex: 1070 }}>
                    <div className="modal-dialog modal-lg modal-dialog-centered">
                        <div className="modal-content border-0 shadow-lg" style={{ borderRadius: '16px', overflow: 'hidden' }}>
                            <div className="modal-header border-bottom p-4 bg-white">
                                <div className="d-flex align-items-center gap-3">
                                    <div className="rounded-circle d-flex justify-content-center align-items-center shadow-sm" style={{ width: '44px', height: '44px', fontSize: '1.1rem', backgroundColor: 'var(--accent-color, #3b82f6)', color: '#ffffff' }}>
                                        <i className="fa-solid fa-industry"></i>
                                    </div>
                                    <div>
                                        <h5 className="modal-title fw-bold text-dark mb-0" style={{ fontSize: '1.15rem' }}>
                                            {modalMode === 'create' ? 'Add Manufacturer to Master' : 'Edit Global Manufacturer'}
                                        </h5>
                                        <div className="text-muted small" style={{ fontSize: '0.8rem' }}>
                                            Shared real-world manufacturer record used across organizations
                                        </div>
                                    </div>
                                </div>
                                <button type="button" className="btn-close" onClick={() => setShowModal(false)} aria-label="Close"></button>
                            </div>

                            <form onSubmit={handleSubmit}>
                                <div className="modal-body p-4 bg-light-subtle">
                                    {/* RESPONSE MESSAGES INSIDE MODAL */}
                                    {modalError && (
                                        <div className="alert alert-danger border-0 shadow-sm d-flex align-items-center justify-content-between mb-4 animate__animated animate__shakeX" style={{ borderRadius: '10px' }} role="alert">
                                            <div className="d-flex align-items-center">
                                                <i className="fa-solid fa-circle-exclamation fs-5 me-3 text-danger"></i>
                                                <div>
                                                    <div className="fw-bold">Action Failed</div>
                                                    <div className="small">{modalError}</div>
                                                </div>
                                            </div>
                                            <button type="button" className="btn-close ms-2 flex-shrink-0" onClick={() => setModalError(null)} aria-label="Close"></button>
                                        </div>
                                    )}

                                    {modalSuccess && (
                                        <div className="alert alert-success border-0 shadow-sm d-flex align-items-center justify-content-between mb-4 animate__animated animate__fadeIn" style={{ borderRadius: '10px' }} role="alert">
                                            <div className="d-flex align-items-center">
                                                <i className="fa-solid fa-circle-check fs-5 me-3 text-success"></i>
                                                <div>
                                                    <div className="fw-bold">Success</div>
                                                    <div className="small">{modalSuccess}</div>
                                                </div>
                                            </div>
                                            <button type="button" className="btn-close ms-2 flex-shrink-0" onClick={() => setModalSuccess(null)} aria-label="Close"></button>
                                        </div>
                                    )}

                                    {/* SEARCH FIRST STEP FOR CREATION */}
                                    {modalMode === 'create' && searchStep ? (
                                        <div>
                                            <div className="alert alert-info border-0 shadow-sm d-flex align-items-start justify-content-between mb-4" style={{ borderRadius: '10px' }}>
                                                <div className="d-flex align-items-start">
                                                    <i className="fa-solid fa-circle-info fs-5 me-3 text-info mt-0.5"></i>
                                                    <div>
                                                        <div className="fw-bold">Search Global Master First</div>
                                                        <div className="small text-muted">
                                                            Before adding a new manufacturer, check if it already exists in the global master by searching Legal Name or GSTIN.
                                                        </div>
                                                    </div>
                                                </div>
                                                <button type="button" className="btn-close ms-2 flex-shrink-0" onClick={(e) => { e.currentTarget.closest('.alert').style.display = 'none'; }} aria-label="Close"></button>
                                            </div>

                                            <div className="row g-3 mb-4">
                                                <div className="col-md-6">
                                                    <label className="form-label small fw-semibold">Legal Name *</label>
                                                    <input
                                                        type="text"
                                                        className="form-control"
                                                        value={form.legal_name}
                                                        onChange={(e) => handleChange('legal_name', e.target.value)}
                                                        placeholder="e.g. Kajaria Ceramics Limited"
                                                    />
                                                </div>
                                                <div className="col-md-6">
                                                    <label className="form-label small fw-semibold">GSTIN (Tax Registration)</label>
                                                    <input
                                                        type="text"
                                                        className="form-control font-monospace"
                                                        value={form.gstin}
                                                        onChange={(e) => handleChange('gstin', e.target.value)}
                                                        placeholder="e.g. 27AAACK1234F1Z5"
                                                    />
                                                </div>
                                            </div>

                                            <div className="d-flex justify-content-end gap-2 mb-4">
                                                <button
                                                    type="button"
                                                    className="btn btn-primary px-4 d-flex align-items-center"
                                                    onClick={handleCheckDuplicate}
                                                    disabled={checkingDuplicates}
                                                >
                                                    {checkingDuplicates ? (
                                                        <>
                                                            <span className="spinner-border spinner-border-sm me-2"></span> Checking...
                                                        </>
                                                    ) : (
                                                        <>
                                                            <i className="fa-solid fa-magnifying-glass me-2"></i> Search Master
                                                        </>
                                                    )}
                                                </button>
                                                <button
                                                    type="button"
                                                    className="btn btn-outline-secondary px-3"
                                                    onClick={() => setSearchStep(false)}
                                                >
                                                    Skip & Create New
                                                </button>
                                            </div>

                                            {/* DUPLICATE SEARCH RESULTS BANNER */}
                                            {duplicateResult?.has_exact_match && (
                                                <div className="card border-warning bg-warning-subtle shadow-sm p-3 mb-3">
                                                    <div className="d-flex align-items-center justify-content-between">
                                                        <div>
                                                            <div className="fw-bold text-dark mb-1">
                                                                <i className="fa-solid fa-triangle-exclamation text-warning me-2 fs-5"></i> Existing Manufacturer Found (Exact GSTIN Match)
                                                            </div>
                                                            <div className="fw-semibold text-dark">{duplicateResult.exact_match.legal_name}</div>
                                                            <div className="small font-monospace text-muted">GSTIN: {duplicateResult.exact_match.gstin}</div>
                                                        </div>
                                                        <button
                                                            type="button"
                                                            className="btn btn-warning btn-sm fw-bold px-3 shadow-sm"
                                                            onClick={() => {
                                                                setShowModal(false);
                                                                setSuccess(`Selected existing manufacturer: ${duplicateResult.exact_match.legal_name}`);
                                                            }}
                                                        >
                                                            Use Existing Manufacturer
                                                        </button>
                                                    </div>
                                                </div>
                                            )}

                                            {duplicateResult?.has_possible_match && !duplicateResult?.has_exact_match && (
                                                <div className="card border-info bg-info-subtle shadow-sm p-3 mb-3">
                                                    <div className="fw-bold text-dark mb-2">
                                                        <i className="fa-solid fa-circle-question text-info me-2 fs-5"></i> Possible Duplicate Manufacturer(s) Found
                                                    </div>
                                                    <div className="list-group mb-3">
                                                        {duplicateResult.possible_matches.map(m => (
                                                            <div key={m.id} className="list-group-item d-flex justify-content-between align-items-center">
                                                                <div>
                                                                    <div className="fw-bold">{m.legal_name || m.name}</div>
                                                                    {m.gstin && <span className="small font-monospace text-muted">GSTIN: {m.gstin}</span>}
                                                                </div>
                                                                <button
                                                                    type="button"
                                                                    className="btn btn-outline-info btn-sm"
                                                                    onClick={() => {
                                                                        setShowModal(false);
                                                                        setSuccess(`Selected existing manufacturer: ${m.legal_name || m.name}`);
                                                                    }}
                                                                >
                                                                    Use Existing
                                                                </button>
                                                            </div>
                                                        ))}
                                                    </div>
                                                    <div className="text-end">
                                                        <button
                                                            type="button"
                                                            className="btn btn-primary btn-sm px-3"
                                                            onClick={() => {
                                                                setForceCreate(true);
                                                                setSearchStep(false);
                                                            }}
                                                        >
                                                            Continue Anyway
                                                        </button>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        /* FULL CREATION / EDIT FORM */
                                        <div>
                                            <div className="row g-3 mb-3">
                                                <div className="col-md-6">
                                                    <label className="form-label small fw-semibold">Legal Name *</label>
                                                    <input
                                                        type="text"
                                                        className="form-control"
                                                        value={form.legal_name}
                                                        onChange={(e) => handleChange('legal_name', e.target.value)}
                                                        placeholder="e.g. Kajaria Ceramics Limited"
                                                        required
                                                    />
                                                </div>
                                                <div className="col-md-6">
                                                    <label className="form-label small fw-semibold">Trade Name</label>
                                                    <input
                                                        type="text"
                                                        className="form-control"
                                                        value={form.trade_name}
                                                        onChange={(e) => handleChange('trade_name', e.target.value)}
                                                        placeholder="e.g. Kajaria"
                                                    />
                                                </div>
                                            </div>

                                            <div className="row g-3 mb-3">
                                                <div className="col-md-4">
                                                    <label className="form-label small fw-semibold">GSTIN</label>
                                                    <input
                                                        type="text"
                                                        className="form-control font-monospace"
                                                        value={form.gstin}
                                                        onChange={(e) => handleChange('gstin', e.target.value)}
                                                        placeholder="e.g. 27AAACK1234F1Z5"
                                                    />
                                                </div>
                                                <div className="col-md-4">
                                                    <label className="form-label small fw-semibold">Registration Number</label>
                                                    <input
                                                        type="text"
                                                        className="form-control font-monospace"
                                                        value={form.registration_number}
                                                        onChange={(e) => handleChange('registration_number', e.target.value)}
                                                        placeholder="e.g. CIN / Corporate Reg No"
                                                    />
                                                </div>
                                                <div className="col-md-4">
                                                    <label className="form-label small fw-semibold">Business Constitution</label>
                                                    <select
                                                        className="form-select"
                                                        value={form.business_constitution}
                                                        onChange={(e) => handleChange('business_constitution', e.target.value)}
                                                    >
                                                        <option value="PRIVATE_LIMITED">Private Limited</option>
                                                        <option value="PUBLIC_LIMITED">Public Limited</option>
                                                        <option value="LLP">LLP</option>
                                                        <option value="PARTNERSHIP">Partnership</option>
                                                        <option value="PROPRIETORSHIP">Proprietorship</option>
                                                        <option value="GOVERNMENT">Government</option>
                                                        <option value="OTHER">Other</option>
                                                    </select>
                                                </div>
                                            </div>

                                            <div className="row g-3 mb-3">
                                                <div className="col-md-4">
                                                    <label className="form-label small fw-semibold">Phone Number</label>
                                                    <input
                                                        type="text"
                                                        className="form-control font-monospace"
                                                        value={form.phone}
                                                        onChange={(e) => handleChange('phone', e.target.value)}
                                                        placeholder="e.g. +91 98765 43210"
                                                    />
                                                </div>
                                                <div className="col-md-4">
                                                    <label className="form-label small fw-semibold">Email Address</label>
                                                    <input
                                                        type="email"
                                                        className="form-control"
                                                        value={form.email}
                                                        onChange={(e) => handleChange('email', e.target.value)}
                                                        placeholder="e.g. info@kajaria.com"
                                                    />
                                                </div>
                                                <div className="col-md-4">
                                                    <label className="form-label small fw-semibold">Website URL</label>
                                                    <input
                                                        type="text"
                                                        className="form-control font-monospace"
                                                        value={form.website}
                                                        onChange={(e) => handleChange('website', e.target.value)}
                                                        placeholder="e.g. www.kajaria.com"
                                                    />
                                                </div>
                                            </div>

                                            <div className="mb-3">
                                                <label className="form-label small fw-semibold">Address Details</label>
                                                <textarea
                                                    className="form-control"
                                                    value={form.address}
                                                    onChange={(e) => handleChange('address', e.target.value)}
                                                    placeholder="Corporate head office / factory address..."
                                                    rows="2"
                                                />
                                            </div>

                                            {isSuperAdmin && modalMode === 'edit' && (
                                                <div className="row g-3 mb-3 p-3 bg-light rounded-3 border">
                                                    <div className="col-md-6">
                                                        <label className="form-label small fw-semibold text-primary">Verification Status (Super Admin)</label>
                                                        <select
                                                            className="form-select border-primary"
                                                            value={form.verification_status}
                                                            onChange={(e) => handleChange('verification_status', e.target.value)}
                                                        >
                                                            <option value="UNVERIFIED">UNVERIFIED</option>
                                                            <option value="VERIFIED">VERIFIED</option>
                                                            <option value="REJECTED">REJECTED</option>
                                                        </select>
                                                    </div>
                                                </div>
                                            )}

                                            <div className="form-check form-switch mt-3">
                                                <input
                                                    className="form-check-input"
                                                    type="checkbox"
                                                    id="managerManufacturerIsActive"
                                                    checked={form.is_active}
                                                    onChange={(e) => handleChange('is_active', e.target.checked)}
                                                />
                                                <label className="form-check-label small text-muted" htmlFor="managerManufacturerIsActive">
                                                    Manufacturer is active for products
                                                </label>
                                            </div>
                                        </div>
                                    )}
                                </div>
                                <div className="modal-footer border-top bg-light px-4 py-3">
                                    <button type="button" className="btn btn-light px-4 text-secondary" onClick={() => setShowModal(false)}>
                                        Cancel
                                    </button>
                                    {(!searchStep || modalMode === 'edit') && (
                                        <button type="submit" className="btn btn-primary px-4 shadow-sm" disabled={submitting}>
                                            {submitting ? (
                                                <>
                                                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                                    Saving...
                                                </>
                                            ) : (
                                                modalMode === 'create' ? 'Save Manufacturer' : 'Update Manufacturer'
                                            )}
                                        </button>
                                    )}
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
