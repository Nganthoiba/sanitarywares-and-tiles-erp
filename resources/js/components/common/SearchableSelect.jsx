import React, { useState, useEffect, useRef } from 'react';

export default function SearchableSelect({
    options = [],
    value = '',
    onChange,
    placeholder = '-- Select --',
    required = false,
    disabled = false,
    className = ''
}) {
    const [isOpen, setIsOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const containerRef = useRef(null);
    const searchInputRef = useRef(null);

    // Selected option display label
    const selectedOption = options.find(opt => String(opt.value) === String(value));

    // Filter options based on search query
    const filteredOptions = options.filter(opt => {
        if (!searchQuery.trim()) return true;
        const query = searchQuery.toLowerCase();
        const labelText = String(opt.label || '').toLowerCase();
        const searchText = String(opt.searchText || '').toLowerCase();
        const subtext = String(opt.sublabel || '').toLowerCase();
        return labelText.includes(query) || searchText.includes(query) || subtext.includes(query);
    });

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (containerRef.current && !containerRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Auto-focus search input when dropdown opens
    useEffect(() => {
        if (isOpen && searchInputRef.current) {
            searchInputRef.current.focus();
        }
    }, [isOpen]);

    const handleSelect = (optionValue) => {
        if (onChange) {
            onChange(optionValue);
        }
        setIsOpen(false);
        setSearchQuery('');
    };

    const handleClear = (e) => {
        e.stopPropagation();
        if (onChange) {
            onChange('');
        }
        setIsOpen(false);
        setSearchQuery('');
    };

    const toggleOpen = () => {
        if (!disabled) {
            setIsOpen(!isOpen);
            if (!isOpen) {
                setSearchQuery('');
            }
        }
    };

    return (
        <div ref={containerRef} className={`position-relative flex-grow-1 ${className}`} style={{ minWidth: '200px' }}>
            {/* Native hidden input for HTML5 validation if required */}
            {required && (
                <input
                    type="text"
                    value={value || ''}
                    required={required}
                    readOnly
                    tabIndex={-1}
                    style={{
                        position: 'absolute',
                        opacity: 0,
                        width: '100%',
                        height: '100%',
                        top: 0,
                        left: 0,
                        pointerEvents: 'none',
                        zIndex: -1
                    }}
                />
            )}

            {/* Main Trigger Control */}
            <div
                className={`form-select d-flex align-items-center justify-content-between cursor-pointer ${disabled ? 'disabled bg-light' : ''} ${isOpen ? 'border-primary shadow-sm' : ''}`}
                onClick={toggleOpen}
                style={{ cursor: disabled ? 'not-allowed' : 'pointer', minHeight: '38px', backgroundImage: 'none' }}
            >
                <span className={`text-truncate me-2 ${!selectedOption ? 'text-muted' : 'text-dark fw-semibold'}`}>
                    {selectedOption ? selectedOption.label : placeholder}
                </span>
                <div className="d-flex align-items-center gap-1.5 ms-auto">
                    {value && !disabled && (
                        <button
                            type="button"
                            className="btn btn-sm btn-link text-muted p-0 text-decoration-none border-0 shadow-none me-1"
                            onClick={handleClear}
                            title="Clear Selection"
                            style={{ lineHeight: 1, fontSize: '0.85rem' }}
                        >
                            <i className="fa-solid fa-xmark"></i>
                        </button>
                    )}
                    <i className={`fa-solid fa-chevron-down text-muted small transition-transform ${isOpen ? 'rotate-180' : ''}`} style={{ fontSize: '0.75rem' }}></i>
                </div>
            </div>

            {/* Dropdown Menu */}
            {isOpen && (
                <div
                    className="position-absolute start-0 end-0 mt-1 bg-white rounded-3 shadow-lg border z-3 overflow-hidden"
                    style={{ zIndex: 1050, minWidth: '100%' }}
                >
                    {/* Search Input Box */}
                    <div className="p-2 border-bottom bg-light">
                        <div className="input-group input-group-sm">
                            <span className="input-group-text bg-white border-end-0 text-muted">
                                <i className="fa-solid fa-magnifying-glass"></i>
                            </span>
                            <input
                                ref={searchInputRef}
                                type="text"
                                className="form-control border-start-0 shadow-none ps-0"
                                placeholder="Type to filter options..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Escape') {
                                        setIsOpen(false);
                                    }
                                }}
                            />
                            {searchQuery && (
                                <button
                                    type="button"
                                    className="btn btn-white border border-start-0 text-muted"
                                    onClick={() => setSearchQuery('')}
                                >
                                    <i className="fa-solid fa-times"></i>
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Options List */}
                    <div className="overflow-auto py-1" style={{ maxHeight: '220px' }}>
                        {filteredOptions.length === 0 ? (
                            <div className="px-3 py-2.5 text-muted text-center small fst-italic">
                                <i className="fa-solid fa-folder-open me-1.5 opacity-50"></i> No matching options found
                            </div>
                        ) : (
                            filteredOptions.map((opt) => {
                                const isSelected = String(opt.value) === String(value);
                                return (
                                    <div
                                        key={opt.value}
                                        className={`px-3 py-2 d-flex align-items-center justify-content-between cursor-pointer text-start ${isSelected ? 'bg-primary-subtle text-primary fw-bold' : 'hover-bg-light text-dark'}`}
                                        style={{ cursor: 'pointer' }}
                                        onClick={() => handleSelect(opt.value)}
                                    >
                                        <div className="text-truncate">
                                            <div>{opt.label}</div>
                                            {opt.sublabel && (
                                                <div className="small text-muted fw-normal">{opt.sublabel}</div>
                                            )}
                                        </div>
                                        {isSelected && (
                                            <i className="fa-solid fa-check text-primary ms-2"></i>
                                        )}
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
