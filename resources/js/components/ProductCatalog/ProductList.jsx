import React from 'react';

export default function ProductList({
    products,
    loading,
    paginationMeta,
    currentPage,
    perPage,
    handlePerPageChange,
    handlePageChange,
    viewProductDetail,
    setupEditProduct,
    toggleProductActiveStatus,
    getProductSize
}) {
    const defaultGetProductSize = (product) => {
        if (!product) return null;
        const values = product.attribute_values || product.attributeValues || [];
        
        let tileSize = null;
        let length = null;
        let width = null;
        let unit = null;
        let lengthMm = null;
        let widthMm = null;

        values.forEach(av => {
            const attrName = (av.attribute?.name || '').toLowerCase();
            const attrSlug = (av.attribute?.slug || attrName).toLowerCase();
            const val = av.value;

            if (val === null || val === undefined || val === '') return;

            if (attrSlug === 'tile-size' || attrSlug === 'size' || attrSlug === 'dimensions' || attrName.includes('size')) {
                tileSize = String(val).trim();
            } else if (attrSlug === 'length' || attrName === 'length') {
                length = val;
            } else if (attrSlug === 'width' || attrName === 'width') {
                width = val;
            } else if (attrSlug === 'dimension-unit' || attrSlug === 'size-unit' || attrName.includes('dimension unit')) {
                unit = String(val).trim();
            } else if (attrSlug === 'length-mm') {
                lengthMm = val;
            } else if (attrSlug === 'width-mm') {
                widthMm = val;
            }
        });

        if (tileSize && tileSize !== 'Custom Size') {
            return tileSize;
        }

        if (length !== null && length !== undefined && width !== null && width !== undefined && length !== '' && width !== '') {
            const unitStr = unit || '';
            const lHasUnit = /[a-zA-Z]/.test(String(length));
            const wHasUnit = /[a-zA-Z]/.test(String(width));
            
            if (lHasUnit && wHasUnit) {
                return `${length} x ${width}`;
            }
            if (unitStr) {
                return `${length}${unitStr} x ${width}${unitStr}`;
            }
            return `${length} x ${width}`;
        }

        if (lengthMm !== null && lengthMm !== undefined && widthMm !== null && widthMm !== undefined && lengthMm !== '' && widthMm !== '') {
            return `${lengthMm}mm x ${widthMm}mm`;
        }

        return null;
    };

    const getSize = getProductSize || defaultGetProductSize;

    return (
        <div>
            <div className="table-responsive bg-white border border-light rounded-3 shadow-sm">
                {loading ? (
                    <div className="text-center py-5">
                        <span className="spinner-border spinner-border-sm text-primary me-2"></span> Loading product catalog...
                    </div>
                ) : (
                    <table id="product-list-table" className="table table-hover align-middle border-0 mb-0">
                        <thead className="bg-light">
                            <tr>
                                <th className="border-bottom-0 py-3 text-center" style={{ width: "50px" }}>#</th>
                                <th className="border-bottom-0 py-3">Product Name</th>
                                <th className="border-bottom-0 py-3">Category</th>
                                <th className="border-bottom-0 py-3">Brand</th>
                                <th className="border-bottom-0 py-3">SKU</th>
                                <th className="border-bottom-0 py-3">Size</th>
                                <th className="border-bottom-0 py-3">Type</th>
                                <th className="border-bottom-0 py-3">Status</th>
                                <th className="text-end border-bottom-0 py-3">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {products.length === 0 ? (
                                <tr>
                                    <td colSpan="9" className="text-center text-muted py-4">
                                        No products found matching filters.
                                    </td>
                                </tr>
                            ) : (
                                products.map((p, index) => {
                                    const size = getSize(p);
                                    const slNo = (paginationMeta.from || 1) + index;
                                    return (
                                        <tr key={p.id}>
                                            <td className="text-center text-muted font-monospace" style={{ fontSize: "0.8rem" }}>
                                                {slNo}
                                            </td>
                                            <td>
                                                <div className="fw-bold text-dark">{p.name}</div>
                                            </td>
                                            <td>{p.category?.name || <span className="text-muted">-</span>}</td>
                                            <td>{p.brand?.name || <span className="text-muted">-</span>}</td>
                                            <td>
                                                <span className="badge bg-primary-subtle text-primary border-light">{p.sku}</span>
                                            </td>
                                            <td>
                                                {size ? (
                                                    <span className="badge bg-light text-dark border font-monospace" style={{ fontSize: "0.78rem" }}>
                                                        {size}
                                                    </span>
                                                ) : (
                                                    <span className="text-muted">—</span>
                                                )}
                                            </td>
                                            <td>
                                                <span className="badge bg-secondary-subtle text-secondary" style={{ fontSize: "0.75rem" }}>
                                                    {p.inventory_behavior === 'SLAB' ? 'Measured Material' : 'Standard'}
                                                </span>
                                            </td>
                                            <td>
                                                {p.is_active ? (
                                                    <span className="badge bg-success-subtle text-success border border-success-subtle px-2 py-1">Active</span>
                                                ) : (
                                                    <span className="badge bg-danger-subtle text-danger border border-danger-subtle px-2 py-1">Inactive</span>
                                                )}
                                            </td>
                                            <td className="text-end">
                                                <div className="btn-group btn-group-sm">
                                                    <button 
                                                        className="btn btn-sm btn-light text-primary border-0 px-2" 
                                                        onClick={() => viewProductDetail(p.id)} 
                                                        title="View Product Details"
                                                    >
                                                        <i className="fa-solid fa-eye"></i>
                                                    </button>
                                                    <button 
                                                        className="btn btn-sm btn-light text-secondary border-0 px-2" 
                                                        onClick={() => setupEditProduct(p.id)} 
                                                        title="Edit Product Specifications"
                                                    >
                                                        <i className="fa-solid fa-pen-to-square"></i>
                                                    </button>
                                                    {p.is_active ? (
                                                        <button 
                                                            className="btn btn-sm btn-light text-danger border-0 px-2"
                                                            onClick={() => toggleProductActiveStatus(p)}
                                                            title="Deactivate Product Variant"
                                                        >
                                                            <i className="fa-solid fa-ban"></i>
                                                        </button>
                                                    ) : (
                                                        <button 
                                                            className="btn btn-sm btn-light text-success border-0 px-2"
                                                            onClick={() => toggleProductActiveStatus(p)}
                                                            title="Activate Product Variant"
                                                        >
                                                            <i className="fa-solid fa-circle-check"></i>
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Pagination Bar */}
            {!loading && paginationMeta.total > 0 && (
                <div className="d-flex flex-wrap align-items-center justify-content-between p-3 bg-white border border-top-0 border-light rounded-bottom-3 shadow-sm gap-2 mt-0">
                    <div className="d-flex align-items-center gap-2 text-muted small">
                        <span>
                            Showing <strong>{paginationMeta.from}</strong> to <strong>{paginationMeta.to}</strong> of <strong>{paginationMeta.total}</strong> products
                        </span>
                        <span className="ms-2">|</span>
                        <span className="ms-1">Per page:</span>
                        <select 
                            className="form-select form-select-sm py-0 border-secondary-subtle" 
                            style={{ width: "75px", height: "28px", fontSize: "0.8rem" }}
                            value={perPage}
                            onChange={handlePerPageChange}
                        >
                            <option value={10}>10</option>
                            <option value={15}>15</option>
                            <option value={25}>25</option>
                            <option value={50}>50</option>
                            <option value={100}>100</option>
                        </select>
                    </div>

                    <nav aria-label="Product list pagination">
                        <ul className="pagination pagination-sm mb-0">
                            <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                                <button 
                                    className="page-link" 
                                    onClick={() => handlePageChange(1)}
                                    disabled={currentPage === 1}
                                    title="First Page"
                                >
                                    <i className="fa-solid fa-angles-left"></i>
                                </button>
                            </li>
                            <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                                <button 
                                    className="page-link" 
                                    onClick={() => handlePageChange(currentPage - 1)}
                                    disabled={currentPage === 1}
                                >
                                    Prev
                                </button>
                            </li>

                            {Array.from({ length: paginationMeta.last_page }, (_, i) => i + 1)
                                .filter(p => p === 1 || p === paginationMeta.last_page || Math.abs(p - currentPage) <= 1)
                                .reduce((acc, p, idx, arr) => {
                                    if (idx > 0 && p - arr[idx - 1] > 1) {
                                        acc.push('...');
                                    }
                                    acc.push(p);
                                    return acc;
                                }, [])
                                .map((item, idx) => {
                                    if (item === '...') {
                                        return (
                                            <li key={`ellipsis-${idx}`} className="page-item disabled">
                                                <span className="page-link">...</span>
                                            </li>
                                        );
                                    }
                                    return (
                                        <li key={item} className={`page-item ${currentPage === item ? 'active' : ''}`}>
                                            <button 
                                                className="page-link" 
                                                onClick={() => handlePageChange(item)}
                                            >
                                                {item}
                                            </button>
                                        </li>
                                    );
                                })}

                            <li className={`page-item ${currentPage === paginationMeta.last_page ? 'disabled' : ''}`}>
                                <button 
                                    className="page-link" 
                                    onClick={() => handlePageChange(currentPage + 1)}
                                    disabled={currentPage === paginationMeta.last_page}
                                >
                                    Next
                                </button>
                            </li>
                            <li className={`page-item ${currentPage === paginationMeta.last_page ? 'disabled' : ''}`}>
                                <button 
                                    className="page-link" 
                                    onClick={() => handlePageChange(paginationMeta.last_page)}
                                    disabled={currentPage === paginationMeta.last_page}
                                    title="Last Page"
                                >
                                    <i className="fa-solid fa-angles-right"></i>
                                </button>
                            </li>
                        </ul>
                    </nav>
                </div>
            )}
        </div>
    );
}
