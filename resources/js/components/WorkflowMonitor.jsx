import React, { useState, useEffect } from 'react';
import axios from 'axios';

export default function WorkflowMonitor() {
    const [definitions, setDefinitions] = useState([]);
    const [instances, setInstances] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Approval inputs
    const [activeApprovingInstance, setActiveApprovingInstance] = useState(null);
    const [remarks, setRemarks] = useState('');
    const [approverName, setApproverName] = useState('Antigravity Manager');
    const [submittingAction, setSubmittingAction] = useState(false);

    // Pagination
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    const fetchData = async () => {
        setLoading(true);
        setError(null);
        try {
            // Retrieve definitions and instances
            const [defRes, instRes] = await Promise.all([
                axios.get('/api/workflows/definitions'),
                axios.get('/api/workflows/instances', { params: { page } })
            ]);

            if (defRes.data.success) {
                setDefinitions(defRes.data.data);
            }
            if (instRes.data.success) {
                setInstances(instRes.data.data.data);
                setTotalPages(instRes.data.data.last_page);
            }
        } catch (err) {
            setError('Error contacting server workflows API.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [page]);

    const handleApproveSubmit = async (e) => {
        e.preventDefault();
        if (!activeApprovingInstance) return;

        setSubmittingAction(true);
        try {
            const response = await axios.post(`/api/workflows/approvals/${activeApprovingInstance.id}`, {
                user: approverName,
                remarks: remarks
            });

            if (response.data.success) {
                alert('Workflow transition successfully processed!');
                setActiveApprovingInstance(null);
                setRemarks('');
                fetchData();
            } else {
                alert(response.data.message || 'Approval transition failed.');
            }
        } catch (err) {
            alert('Error executing transition task: ' + (err.response?.data?.message || err.message));
        } finally {
            setSubmittingAction(false);
        }
    };

    return (
        <div>
            {/* Header */}
            <div className="row mb-4">
                <div className="col-12">
                    <div className="card border-0 shadow-sm bg-dark text-white p-4">
                        <div className="d-flex justify-content-between align-items-center">
                            <div>
                                <h3 className="fw-bold mb-1">Configurable Workflow Engine</h3>
                                <p className="text-white-50 mb-0">Decoupled BPM process flows and double-entry financial/inventory checkpoints.</p>
                            </div>
                            <button className="btn btn-outline-light" onClick={fetchData}>
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" className="me-2"><path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l.73-.73"/></svg>
                                Refresh Center
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="row g-4">
                {/* Left side: Definitions list */}
                <div className="col-12 col-md-4">
                    <div className="card border-0 shadow-sm">
                        <div className="card-header bg-white py-3 border-bottom-0">
                            <h5 className="fw-bold mb-0">Workflow Schematics</h5>
                        </div>
                        <div className="card-body p-0">
                            {definitions.length === 0 && (
                                <p className="text-muted text-center py-4">No active workflow definitions configured.</p>
                            )}
                            <div className="list-group list-group-flush">
                                {definitions.map(def => (
                                    <div key={def.id} className="list-group-item p-3 border-bottom">
                                        <div className="d-flex justify-content-between align-items-start mb-2">
                                            <span className="badge bg-primary font-monospace">{def.code}</span>
                                            <span className="badge bg-success bg-opacity-10 text-success">Version {def.version}</span>
                                        </div>
                                        <h6 className="fw-bold mb-1 text-dark">{def.name}</h6>
                                        <p className="text-muted mb-0" style={{ fontSize: '0.85rem' }}>{def.description}</p>
                                        <small className="text-secondary d-block mt-2">Scope: {def.module}</small>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right side: Instances and action execution */}
                <div className="col-12 col-md-8">
                    <div className="card border-0 shadow-sm">
                        <div className="card-header bg-white py-3 border-bottom-0">
                            <h5 className="fw-bold mb-0">Live Instances & Traces</h5>
                        </div>
                        <div className="table-responsive">
                            <table className="table table-hover align-middle mb-0">
                                <thead className="table-light text-uppercase font-monospace" style={{ fontSize: '0.75rem' }}>
                                    <tr>
                                        <th>Target Record</th>
                                        <th>Active Node</th>
                                        <th>Status</th>
                                        <th>Assignment</th>
                                        <th>Created At</th>
                                        <th className="text-end">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {loading && (
                                        <tr>
                                            <td colSpan="6" className="text-center py-5">
                                                <div className="spinner-border text-primary" role="status"></div>
                                                <p className="text-muted mt-2 mb-0">Syncing execution engine state...</p>
                                            </td>
                                        </tr>
                                    )}
                                    {!loading && instances.length === 0 && (
                                        <tr>
                                            <td colSpan="6" className="text-center py-5 text-muted">
                                                No workflow instances running in background.
                                            </td>
                                        </tr>
                                    )}
                                    {!loading && instances.map(inst => (
                                        <tr key={inst.id}>
                                            <td>
                                                <div className="fw-bold font-monospace text-primary">#{inst.reference_id}</div>
                                                <small className="text-muted d-block" style={{ fontSize: '0.7rem' }}>
                                                    {inst.reference_type.split('\\').pop()}
                                                </small>
                                            </td>
                                            <td>
                                                <span className="fw-semibold">{inst.current_step?.name || 'End Node'}</span>
                                                <small className="text-muted d-block" style={{ fontSize: '0.75rem' }}>
                                                    ({inst.current_step?.step_type})
                                                </small>
                                            </td>
                                            <td>
                                                <span className={`badge ${
                                                    inst.status === 'COMPLETED' ? 'bg-success bg-opacity-10 text-success' :
                                                    inst.status === 'RUNNING' ? 'bg-primary bg-opacity-10 text-primary' :
                                                    inst.status === 'WAITING' ? 'bg-warning bg-opacity-10 text-warning' :
                                                    'bg-danger bg-opacity-10 text-danger'
                                                }`}>
                                                    {inst.status}
                                                </span>
                                            </td>
                                            <td className="font-monospace">
                                                {inst.current_step?.metadata?.assigned_to || '--'}
                                            </td>
                                            <td className="text-muted" style={{ fontSize: '0.8rem' }}>
                                                {new Date(inst.started_at).toLocaleString()}
                                            </td>
                                            <td className="text-end">
                                                {inst.status === 'WAITING' && inst.current_step?.step_type === 'APPROVAL' && (
                                                    <button
                                                        className="btn btn-sm btn-primary"
                                                        onClick={() => setActiveApprovingInstance(inst)}
                                                        data-bs-toggle="modal"
                                                        data-bs-target="#approvalModal"
                                                    >
                                                        Review Step
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>

            {/* Approval Action Modal */}
            {activeApprovingInstance && (
                <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} tabIndex="-1">
                    <div className="modal-dialog modal-dialog-centered">
                        <div className="modal-content border-0 shadow">
                            <div className="modal-header bg-primary text-white py-3">
                                <h5 className="modal-title fw-bold">Sign-off Approval Step</h5>
                                <button type="button" className="btn-close btn-close-white" onClick={() => setActiveApprovingInstance(null)}></button>
                            </div>
                            <form onSubmit={handleApproveSubmit}>
                                <div className="modal-body p-4">
                                    <div className="bg-light p-3 rounded mb-3">
                                        <div className="row font-monospace mb-2" style={{ fontSize: '0.85rem' }}>
                                            <div className="col-6 text-muted">INSTANCE CLASS:</div>
                                            <div className="col-6 text-end fw-bold">{activeApprovingInstance.reference_type.split('\\').pop()}</div>
                                        </div>
                                        <div className="row font-monospace" style={{ fontSize: '0.85rem' }}>
                                            <div className="col-6 text-muted">CURRENT ROUTINE:</div>
                                            <div className="col-6 text-end fw-bold text-primary">{activeApprovingInstance.current_step?.name}</div>
                                        </div>
                                    </div>

                                    <div className="mb-3">
                                        <label className="form-label fw-bold">Approver Sign-off Identity</label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            value={approverName}
                                            onChange={(e) => setApproverName(e.target.value)}
                                            required
                                        />
                                    </div>

                                    <div className="mb-3">
                                        <label className="form-label fw-bold">Audit Remarks / Justifications</label>
                                        <textarea
                                            className="form-control"
                                            rows="3"
                                            value={remarks}
                                            onChange={(e) => setRemarks(e.target.value)}
                                            placeholder="Specify rationale or comments for tracking..."
                                            required
                                        ></textarea>
                                    </div>
                                </div>
                                <div className="modal-footer bg-light border-top-0 py-3">
                                    <button type="button" className="btn btn-outline-secondary" onClick={() => setActiveApprovingInstance(null)}>Cancel</button>
                                    <button type="submit" className="btn btn-primary" disabled={submittingAction}>
                                        {submittingAction ? 'Processing...' : 'Confirm Step Sign-off'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
