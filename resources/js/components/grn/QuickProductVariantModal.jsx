import React from 'react';
import AddProductVariantModal from '../common/AddProductVariantModal';

export default function QuickProductVariantModal({ show, onClose, onSave }) {
    return (
        <AddProductVariantModal
            show={show}
            onClose={onClose}
            onSave={onSave}
        />
    );
}
