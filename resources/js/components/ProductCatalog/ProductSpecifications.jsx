import React from 'react';

export default function ProductSpecifications({ selectedProduct }) {
    if (!selectedProduct) return null;

    return (
        <div className="tab-pane fade" id="pane-specifications" role="tabpanel">
            <h5 className="fw-bold mb-4 text-dark">Specification Attributes</h5>
            {selectedProduct.attribute_values && selectedProduct.attribute_values.length > 0 ? (
                <div className="table-responsive">
                    <table className="table table-striped align-middle border-light">
                        <thead>
                            <tr>
                                <th>Attribute Specification Name</th>
                                <th>Value</th>
                            </tr>
                        </thead>
                        <tbody>
                            {selectedProduct.attribute_values.map(av => (
                                <tr key={av.id}>
                                    <td className="fw-semibold text-muted">{av.attribute?.name}</td>
                                    <td><strong className="text-dark">{av.value}</strong></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : (
                <div className="text-muted small">No specification attribute values assigned to this product.</div>
            )}
        </div>
    );
}
