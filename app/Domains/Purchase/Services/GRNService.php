<?php

namespace App\Domains\Purchase\Services;

use App\Domains\Purchase\Models\GoodsReceiptNote;
use App\Domains\Purchase\Models\GoodsReceiptItem;
use App\Domains\Purchase\Models\GoodsReceiptItemSlab;
use App\Domains\Purchase\Models\PurchaseOrder;
use App\Domains\Purchase\Models\PurchaseOrderItem;
use App\Domains\Purchase\Enums\GoodsReceiptStatus;
use App\Domains\Inventory\Services\InventoryService;
use App\Domains\Accounting\Services\PostingService;
use App\Domains\Accounting\Models\Account;
use App\Domains\Accounting\Models\AccountGroup;
use App\Domains\Product\Models\ProductVariant;
use Illuminate\Support\Facades\DB;
use Exception;

class GRNService
{
    public function __construct(
        protected InventoryService $inventoryService,
        protected PostingService $postingService
    ) {}

    /**
     * Create a draft Goods Receipt Note.
     */
    public function createDraft(array $data): GoodsReceiptNote
    {
        return DB::transaction(function () use ($data) {
            $grnNumber = $data['grn_number'] ?? 'GRN-' . strtoupper(uniqid());

            // 1. Create GRN Header
            $grn = GoodsReceiptNote::create([
                'warehouse_id' => $data['warehouse_id'],
                'storage_location_id' => $data['storage_location_id'] ?? null,
                'purchase_order_id' => $data['purchase_order_id'] ?? null,
                'supplier_id' => $data['supplier_id'] ?? null,
                'grn_number' => $grnNumber,
                'received_date' => $data['received_date'] ?? now(),
                'status' => GoodsReceiptStatus::DRAFT->value,
                'remarks' => $data['remarks'] ?? null,
            ]);

            // 2. Create Items & Slabs
            if (!empty($data['items'])) {
                foreach ($data['items'] as $itemData) {
                    $variant = ProductVariant::findOrFail($itemData['product_variant_id']);
                    $hasSlabs = !empty($itemData['slabs']);

                    if ($variant->inventory_behavior !== 'SLAB' && $hasSlabs) {
                        throw new Exception("Slabs data must not be provided for non-slab product variant: " . $variant->name);
                    }

                    $item = $grn->items()->create([
                        'purchase_order_item_id' => $itemData['purchase_order_item_id'] ?? null,
                        'product_variant_id' => $itemData['product_variant_id'],
                        'unit_id' => $itemData['unit_id'] ?? null,
                        'quantity_received' => $itemData['quantity_received'],
                        'quantity_accepted' => $itemData['quantity_accepted'] ?? $itemData['quantity_received'],
                        'quantity_rejected' => $itemData['quantity_rejected'] ?? 0.0000,
                    ]);

                    // If item is granite slabs and has slabs data
                    if ($hasSlabs) {
                        foreach ($itemData['slabs'] as $slabData) {
                            $item->slabs()->create([
                                'length' => $slabData['length'],
                                'width' => $slabData['width'],
                                'thickness' => $slabData['thickness'] ?? 20.00,
                                'finish' => $slabData['finish'] ?? 'POLISHED',
                                'origin' => $slabData['origin'] ?? 'IMPORT',
                            ]);
                        }
                    }
                }
            }

            return $grn;
        });
    }

    /**
     * Update an existing draft Goods Receipt Note.
     */
    public function updateDraft(int $id, array $data): GoodsReceiptNote
    {
        return DB::transaction(function () use ($id, $data) {
            $grn = GoodsReceiptNote::findOrFail($id);

            if ($grn->status !== GoodsReceiptStatus::DRAFT->value) {
                throw new Exception("Cannot edit GRN after it has been approved.");
            }

            // 1. Update header
            $grn->update([
                'warehouse_id' => $data['warehouse_id'],
                'storage_location_id' => $data['storage_location_id'] ?? null,
                'purchase_order_id' => $data['purchase_order_id'] ?? null,
                'supplier_id' => $data['supplier_id'] ?? null,
                'received_date' => $data['received_date'] ?? $grn->received_date,
                'remarks' => $data['remarks'] ?? $grn->remarks,
            ]);

            // 2. Refresh items
            if (isset($data['items'])) {
                // Delete existing items & slabs first to recreate them
                foreach ($grn->items as $item) {
                    $item->slabs()->forceDelete();
                    $item->forceDelete();
                }

                foreach ($data['items'] as $itemData) {
                    $variant = ProductVariant::findOrFail($itemData['product_variant_id']);
                    $hasSlabs = !empty($itemData['slabs']);

                    if ($variant->inventory_behavior !== 'SLAB' && $hasSlabs) {
                        throw new Exception("Slabs data must not be provided for non-slab product variant: " . $variant->name);
                    }

                    $item = $grn->items()->create([
                        'purchase_order_item_id' => $itemData['purchase_order_item_id'] ?? null,
                        'product_variant_id' => $itemData['product_variant_id'],
                        'unit_id' => $itemData['unit_id'] ?? null,
                        'quantity_received' => $itemData['quantity_received'],
                        'quantity_accepted' => $itemData['quantity_accepted'] ?? $itemData['quantity_received'],
                        'quantity_rejected' => $itemData['quantity_rejected'] ?? 0.0000,
                    ]);

                    if ($hasSlabs) {
                        foreach ($itemData['slabs'] as $slabData) {
                            $item->slabs()->create([
                                'length' => $slabData['length'],
                                'width' => $slabData['width'],
                                'thickness' => $slabData['thickness'] ?? 20.00,
                                'finish' => $slabData['finish'] ?? 'POLISHED',
                                'origin' => $slabData['origin'] ?? 'IMPORT',
                            ]);
                        }
                    }
                }
            }

            return $grn->fresh(['items.slabs', 'items.variant']);
        });
    }

    /**
     * Approve Goods Receipt Note and trigger inventory services.
     */
    public function approveGRN(int $id): GoodsReceiptNote
    {
        return DB::transaction(function () use ($id) {
            // Lock the GRN row for update to prevent concurrent approval requests
            $grn = GoodsReceiptNote::lockForUpdate()->findOrFail($id);

            // 1. Validation checks
            if ($grn->status === GoodsReceiptStatus::APPROVED->value || $grn->status === GoodsReceiptStatus::LOCKED->value) {
                throw new Exception("This GRN is already approved.");
            }

            if ($grn->status !== GoodsReceiptStatus::DRAFT->value) {
                throw new Exception("Only DRAFT Goods Receipt Notes can be approved.");
            }

            // Validate that we have items
            if ($grn->items->isEmpty()) {
                throw new Exception("Cannot approve a Goods Receipt Note without items.");
            }

            $totalValue = 0.0;

            foreach ($grn->items as $item) {
                $variant = $item->variant;
                $receivedQty = (float) $item->quantity_received;
                $hasSlabs = !$item->slabs->isEmpty();

                if ($receivedQty <= 0) {
                    throw new Exception("Received quantity must be greater than zero for product: " . $variant->name);
                }

                // If product is granite, ensure slab count equals accepted received qty
                if ($variant->inventory_behavior === 'SLAB') {
                    if (!$hasSlabs) {
                        throw new Exception("Granite slabs are required for slab product variant: " . $variant->name);
                    }
                    $slabCount = $item->slabs()->count();
                    if ($slabCount !== (int) $receivedQty) {
                        throw new Exception("Slab count ({$slabCount}) must match received quantity ({$receivedQty}) for Granite variant: " . $variant->name);
                    }

                    // Slabs calculation: area in SQFT * price
                    $totalArea = 0.0;
                    foreach ($item->slabs as $slab) {
                        $totalArea += ((float) $slab->length * (float) $slab->width) / 144.0;
                    }
                    
                    $price = $item->orderItem ? (float) $item->orderItem->unit_price : (float) $variant->cost_price;
                    $totalValue += $totalArea * $price;
                } else {
                    if ($hasSlabs) {
                        throw new Exception("Slabs data must not be provided for non-slab product variant: " . $variant->name);
                    }

                    // Bulk calculation: received quantity * price
                    $price = $item->orderItem ? (float) $item->orderItem->unit_price : (float) $variant->cost_price;
                    $totalValue += $receivedQty * $price;
                }
            }

            // 2. Update status to APPROVED
            $grn->status = GoodsReceiptStatus::APPROVED->value;
            $grn->save();

            // 3. Trigger Inventory Service to generate stock
            $this->inventoryService->receiveGRN($grn);

            // 4. Resolve or create accounts and post to accounting
            if ($totalValue > 0) {
                $orgId = $grn->organization_id;

                // Resolve Inventory Account
                $inventoryAccount = Account::where('organization_id', $orgId)
                    ->where(function($query) {
                        $query->where('code', 'INV-01')
                              ->orWhere('name', 'like', '%Inventory%');
                    })->first();

                if (!$inventoryAccount) {
                    $assetGroup = AccountGroup::firstOrCreate([
                        'organization_id' => $orgId,
                        'type' => 'ASSET',
                    ], [
                        'name' => 'Current Assets',
                        'code' => 'AST-01',
                    ]);

                    $inventoryAccount = Account::create([
                        'organization_id' => $orgId,
                        'account_group_id' => $assetGroup->id,
                        'code' => 'INV-01',
                        'name' => 'Inventory Asset A/c',
                        'currency' => 'INR',
                    ]);
                }

                // Resolve GRNI Account
                $supplierName = $grn->supplier ? $grn->supplier->name : 'Supplier';
                
                // First check if there is a GRNI specific account, or a supplier-specific account
                $grniAccount = Account::where('organization_id', $orgId)
                    ->where(function($query) use ($supplierName) {
                        $query->where('code', 'GRNI-01')
                              ->orWhere('name', 'like', '%Goods Received Not Invoiced%')
                              ->orWhere('name', 'like', '%GRNI%')
                              ->orWhere('name', 'like', '%' . $supplierName . '%');
                    })->first();

                if (!$grniAccount) {
                    $liabilityGroup = AccountGroup::firstOrCreate([
                        'organization_id' => $orgId,
                        'type' => 'LIABILITY',
                    ], [
                        'name' => 'Current Liabilities',
                        'code' => 'LIA-01',
                    ]);

                    $grniAccount = Account::create([
                        'organization_id' => $orgId,
                        'account_group_id' => $liabilityGroup->id,
                        'code' => 'GRNI-01',
                        'name' => 'Goods Received Not Invoiced (GRNI)',
                        'currency' => 'INR',
                    ]);
                }

                $this->postingService->postGRNReceipt(
                    $orgId,
                    $totalValue,
                    $inventoryAccount->id,
                    $grniAccount->id,
                    $grn->grn_number,
                    $grn->received_date ? $grn->received_date->toDateString() : now()->toDateString(),
                    $grn->id
                );
            }

            // 5. Finalize transition approved -> locked
            $grn->status = GoodsReceiptStatus::LOCKED->value;
            $grn->save();

            return $grn;
        });
    }
}
