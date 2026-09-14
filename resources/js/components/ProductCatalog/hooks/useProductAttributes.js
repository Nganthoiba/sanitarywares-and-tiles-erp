import { useState } from 'react';
import { productApi } from '../../../services/productApi';

export function useProductAttributes(setError, setSuccess, setLoading) {
    const [assignedAttributeIds, setAssignedAttributeIds] = useState([]);
    const [showAttrModal, setShowAttrModal] = useState(false);
    const [showAddExistingAttrModal, setShowAddExistingAttrModal] = useState(false);
    const [selectedExistingAttrId, setSelectedExistingAttrId] = useState('');
    const [attrToRemove, setAttrToRemove] = useState(null);
    const [attributeForm, setAttributeForm] = useState({
        name: '',
        type: 'string',
        unit_id: ''
    });

    const handleAttributeSubmit = async (e, loadFormDataCallback) => {
        e.preventDefault();
        if (setError) setError(null);
        if (setLoading) setLoading(true);
        try {
            const data = await productApi.createAttribute(attributeForm);
            if (data.success) {
                const newAttr = data.data;
                if (setSuccess) setSuccess(`Custom specification attribute "${attributeForm.name}" defined successfully.`);
                setAttributeForm({ name: '', type: 'string', unit_id: '' });
                setShowAttrModal(false);
                if (loadFormDataCallback) await loadFormDataCallback();
                if (newAttr && newAttr.id) {
                    setAssignedAttributeIds(prev => Array.from(new Set([...prev, newAttr.id])));
                }
            }
        } catch (err) {
            if (setError) setError(err.response?.data?.message || 'Failed to register custom attribute.');
        } finally {
            if (setLoading) setLoading(false);
        }
    };

    const handleAddExistingAttributeSubmit = (e) => {
        e.preventDefault();
        if (!selectedExistingAttrId) return;
        const attrId = parseInt(selectedExistingAttrId, 10);
        setAssignedAttributeIds(prev => Array.from(new Set([...prev, attrId])));
        setSelectedExistingAttrId('');
        setShowAddExistingAttrModal(false);
    };

    const confirmRemoveAttribute = async (productId, productForm, setProductForm) => {
        if (!attrToRemove) return;
        const attrId = attrToRemove.id;
        try {
            if (productId) {
                await productApi.deleteProductAttribute(productId, attrId);
            }
        } catch (err) {
            // Log/ignore errors on disassociate
        }
        setAssignedAttributeIds(prev => prev.filter(id => id !== attrId));
        if (productForm && setProductForm) {
            setProductForm(prev => {
                const updatedAttrs = { ...prev.attributes };
                delete updatedAttrs[attrId];
                return { ...prev, attributes: updatedAttrs };
            });
        }
        setAttrToRemove(null);
    };

    return {
        assignedAttributeIds,
        setAssignedAttributeIds,
        showAttrModal,
        setShowAttrModal,
        showAddExistingAttrModal,
        setShowAddExistingAttrModal,
        selectedExistingAttrId,
        setSelectedExistingAttrId,
        attrToRemove,
        setAttrToRemove,
        attributeForm,
        setAttributeForm,
        handleAttributeSubmit,
        handleAddExistingAttributeSubmit,
        confirmRemoveAttribute
    };
}
