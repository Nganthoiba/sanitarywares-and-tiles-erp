<?php

namespace Database\Seeders;

use App\Domains\Security\Models\PermissionGroup;
use App\Domains\Security\Models\Permission;
use App\Library\Database\AutoIncrement;
use Illuminate\Database\Seeder;

class PermissionSeeder extends Seeder
{
    public function run(): void
    {
        $catalogue = [
            'Platform Administration' => [
                'platform.organizations.manage' => ['View & Manage Tenant Organizations', 'Create, activate, suspend and inspect tenant organizations'],
                'platform.permissions.manage'   => ['Manage Permissions & Groups', 'Create, update and configure system permissions'],
                'platform.menus.manage'         => ['Manage Dynamic Menus', 'Configure application menu hierarchy and permissions'],
            ],
            'Master Data' => [
                'master.organizations.view'  => ['View Organization details', 'View tenant profile and settings'],
                'master.organizations.update' => ['Update Organization details', 'Update tenant profile and configuration'],
                'master.branches.manage'     => ['Manage Branches', 'Create, edit and manage organization branches'],
                'master.warehouses.manage'   => ['Manage Warehouses', 'Create, edit and manage organization warehouses'],
                'master.users.manage'        => ['Manage Users and Roles', 'Manage staff accounts, roles and permission assignments'],
                'master.storage_locations.manage' => ['Manage Storage Locations', 'Create, edit and manage organization storage locations'],
            ],
            'Product Management' => [
                'products.view'                 => ['View Products', 'Access product catalog and details'],
                'products.create'               => ['Create Products', 'Add new products and variants'],
                'products.edit'                 => ['Edit Products', 'Modify product details and pricing'],
                'products.delete'               => ['Delete Products', 'Remove products from catalog'],
                'products.brands.manage'        => ['Manage Brands', 'Manage organization product brands'],
                'products.manufacturers.manage' => ['Manage Manufacturers', 'Associate products with manufacturers'],
                'products.batch_prices.update'  => ['Update Batch Pricing', 'Authorize setting and updating cost price and sale price for product variant batches'],
                'products.pricing.manage'       => ['Manage Product Pricing & Packaging', 'Maintain organization cost price, selling price, and commercial packaging per variant'],
                'products.categories.update'     => ['Update Product Categories', 'Update product categories'],
                'products.categories.delete'     => ['Delete Product Categories', 'Delete product categories'],
                'products.categories.view'       => ['View Product Categories', 'View product categories'],
                'products.categories.create'     => ['Create Product Categories', 'Create product categories'],
            ],
            'Purchasing' => [
                'purchase.requisitions.manage'  => ['Manage Purchase Requisitions', 'Create and process requisitions'],
                'purchase.orders.view'          => ['View Purchase Orders', 'View PO registry and details'],
                'purchase.orders.create'        => ['Create Purchase Orders', 'Draft and submit new purchase orders'],
                'purchase.orders.approve'       => ['Approve Purchase Orders', 'Approve pending purchase orders'],
                'purchase.orders.send'          => ['Send Purchase Orders', 'Dispatch POs to suppliers'],
                'purchase.over_receipt.approve' => ['Approve Over-Receipt', 'Approve GRN quantities exceeding PO limits'],
                'purchase.grn.create'           => ['Create GRN', 'Create Goods Receipt Note'],
                'purchase.grn.approve'          => ['Approve GRN', 'Approve Goods Receipt Note'],
            ],
            'Inventory Management' => [
                'inventory.stock.view'         => ['View Stock Levels', 'Inspect real-time warehouse stock'],
                'inventory.transfer.execute'   => ['Execute Inventory Transfers', 'Transfer stock between locations'],
                'inventory.adjustment.approve' => ['Approve Stock Adjustments', 'Approve inventory quantity/cost adjustments'],
                'inventory.count.manage'       => ['Manage Inventory Counts', 'Initiate and verify physical stock counts'],
            ],
            'Sales' => [
                'sales.orders.manage'  => ['Manage Sales Orders', 'Create and process sales orders'],
                'sales.invoice.cancel' => ['Cancel Sales Invoices', 'Authorize cancellation of issued invoices'],
            ],
            'Accounting' => [
                'accounting.accounts.manage' => ['Manage Accounts & Ledgers', 'Manage chart of accounts and general ledger'],
                'accounting.journal.post'    => ['Post Journal Entries', 'Post financial journal entries'],
            ],
            'Workflow Management' => [
                'workflow.definition.manage' => ['Manage Workflows Definitions', 'Define and configure BPM workflow processes'],
            ],
            'Stackholder Administration' => [
                'supplier.view'   => ['View Suppliers', 'View supplier details and information'],
                'supplier.create' => ['Register New Supplier', 'Register new supplier and provide details'],
                'supplier.update' => ['Update Supplier Details', 'Update existing supplier details'],
                'supplier.delete' => ['Remove Supplier', 'Remove supplier'],
            ]
        ];

        // $permissionGroups = [];
        $permissions = [];
        // $permissionGroupId = 1;
        // $permissionId = 1;

        foreach ($catalogue as $groupName => $groupPermissions) {

            // $permissionGroups[] = [
            //     'id' => $permissionGroupId,
            //     'name' => $groupName,
            //     'enabled' => true,
            // ];

            $permissionGroup = PermissionGroup::updateOrCreate([
                'name' => $groupName,
            ], [
                'enabled' => true,
            ]);

            foreach ($groupPermissions as $slug => $info) {
                $permissions[] = [
                    //'id' => $permissionId,
                    'permission_group_id' => $permissionGroup->id,
                    'slug' => $slug,
                    'display_name' => $info[0],
                    'description' => $info[1],
                    'enabled' => true,
                ];

                //$permissionId++;
            }

            //$permissionGroupId++;
        }


        // PermissionGroup::upsert($permissionGroups, ['name'], ['enabled']);
        // AutoIncrement::resetIndex((new PermissionGroup())->getTable(), 'id');

        Permission::upsert($permissions, ['slug'], ['permission_group_id', 'display_name', 'description', 'enabled']);
        AutoIncrement::resetIndex((new Permission())->getTable(), 'id');
    }
}
