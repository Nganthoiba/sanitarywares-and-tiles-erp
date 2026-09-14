import React from 'react';
import ProductCatalogPage from '../ProductCatalog/ProductCatalogPage';

export default function ProductEntry({ initialSubTab = 'list' }) {
    return <ProductCatalogPage initialSubTab={initialSubTab} />;
}
