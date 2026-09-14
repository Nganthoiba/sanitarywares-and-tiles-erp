import React from 'react';
import AddProductVariantModal from '../../common/AddProductVariantModal';

export default function AddProductModal({ show, onClose, onSave, productToEdit }) {
    return (
        <AddProductVariantModal
            show={show}
            onClose={onClose}
            onSave={onSave}
            productToEdit={productToEdit}
        />
    );
}
