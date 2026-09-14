import React from 'react';

export default function ProductFilters({
    filters,
    perPage,
    categories,
    brands,
    handleFilterChange,
    handlePerPageChange
}) {
    return (
        <div className="d-flex flex-wrap justify-content-between align-items-center mb-4 gap-3 bg-white p-3 border border-light rounded-3 shadow-sm">
            <div className="d-flex flex-wrap justify-content-between gap-2 flex-grow-1">
                <select 
                    className="form-select form-select-sm font-monospace" 
                    style={{ maxWidth: "140px" }}
                    value={perPage}
                    onChange={handlePerPageChange}
                    title="Records per page"
                >
                    <option value={10}>10 per page</option>
                    <option value={15}>15 per page</option>
                    <option value={25}>25 per page</option>
                    <option value={50}>50 per page</option>
                    <option value={100}>100 per page</option>
                </select>
                <div className="position-relative" style={{ maxWidth: "260px", width: "100%" }}>
                    <input 
                        type="text" 
                        className="form-control form-control-sm ps-4" 
                        placeholder="Search products..." 
                        value={filters.search}
                        onChange={(e) => handleFilterChange("search", e.target.value)}
                    />
                    <i className="fa-solid fa-magnifying-glass position-absolute text-muted" style={{ left: "10px", top: "8px", fontSize: "0.8rem" }}></i>
                </div>
                <select 
                    className="form-select form-select-sm" 
                    style={{ maxWidth: "150px" }}
                    value={filters.category}
                    onChange={(e) => handleFilterChange("category", e.target.value)}
                >
                    <option value="">All Categories</option>
                    {categories.map(c => (
                        <option key={c.id} value={c.id}>
                            {c.parent_id || c.parent ? `\u00A0\u00A0── ${c.name}` : c.name}
                        </option>
                    ))}
                </select>
                <select 
                    className="form-select form-select-sm" 
                    style={{ maxWidth: "150px" }}
                    value={filters.brand}
                    onChange={(e) => handleFilterChange("brand", e.target.value)}
                >
                    <option value="">All Brands</option>
                    {brands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
                <select 
                    className="form-select form-select-sm" 
                    style={{ maxWidth: "150px" }}
                    value={filters.productType}
                    onChange={(e) => handleFilterChange("productType", e.target.value)}
                >
                    <option value="">All Types</option>
                    <option value="STANDARD">Standard</option>
                    <option value="MEASURED_MATERIAL">Measured Material</option>
                </select>
                <select 
                    className="form-select form-select-sm" 
                    style={{ maxWidth: "150px" }}
                    value={filters.status}
                    onChange={(e) => handleFilterChange("status", e.target.value)}
                >
                    <option value="">All Statuses</option>
                    <option value="ACTIVE">Active</option>
                    <option value="INACTIVE">Inactive</option>
                </select>                                
            </div>
        </div>
    );
}
