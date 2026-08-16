<?php
// User permissions
return [
    'default_permissions' => [
        'Master Data' => [
            'master.organizations.view' => 'View Organization details',
            'master.organizations.update' => 'Update Organization details',
            'master.branches.manage' => 'Manage Branches',
            'master.warehouses.manage' => 'Manage Warehouses',
            'master.users.manage' => 'Manage Users and Roles',
        ],
        'Inventory Management' => [
            'inventory.stock.view' => 'View Stock Levels',
            'inventory.transfer.execute' => 'Execute Inventory Transfers',
            'inventory.adjustment.approve' => 'Approve Stock Adjustments',
            'inventory.count.manage' => 'Manage Inventory Counts',
        ],
        'Purchase Domain' => [
            'purchase.requisitions.manage' => 'Manage Purchase Requisitions',
            'purchase.orders.create' => 'Create Purchase Orders',
            'purchase.orders.approve' => 'Approve Purchase Orders',
        ],
        'Sales Domain' => [
            'sales.orders.manage' => 'Manage Sales Orders',
            'sales.invoice.cancel' => 'Cancel Sales Invoices',
        ],
        'Accounting Domain' => [
            'accounting.accounts.manage' => 'Manage Accounts & Ledgers',
            'accounting.journal.post' => 'Post Journal Entries',
        ],
        'Workflow Management' => [
            'workflow.definition.manage' => 'Manage Workflows Definitions',
        ],
    ],
];
