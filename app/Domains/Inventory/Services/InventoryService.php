<?php

namespace App\Domains\Inventory\Services;

use App\Domains\Inventory\Models\InventoryObject;
use App\Domains\Inventory\Models\InventoryMovement;
use App\Domains\Inventory\Models\GraniteSlabDetail;
use App\Domains\Purchase\Models\GoodsReceiptNote;
use App\Domains\Purchase\Models\GoodsReceiptItem;
use App\Domains\Product\Models\Product;
use App\Domains\Product\Models\UnitConversion;
use App\Domains\Master\Models\Unit;
use App\Domains\Inventory\Events\InventoryReceived;
use Illuminate\Support\Facades\DB;

class InventoryService
{
    /**
     * Process stock receipt from an approved Goods Receipt Note.
     */
    public function receiveGRN(GoodsReceiptNote $grn): void
    {
        DB::transaction(function () use ($grn) {
            // Check if inventory has already been processed for this GRN
            $alreadyProcessed = DB::table('inventory_movements')
                ->where('organization_id', $grn->organization_id)
                ->where('reference_type', 'GoodsReceiptNote')
                ->where('reference_id', $grn->id)
                ->exists();

            if ($alreadyProcessed) {
                throw new \Exception("Inventory has already been processed for this Goods Receipt Note.");
            }

            foreach ($grn->items as $item) {
                $variant = $item->variant;

                if ($variant->inventory_behavior === 'SLAB') {
                    // Granite slab receipt: 1 inventory_object per slab
                    foreach ($item->slabs as $index => $slabData) {
                        $length = (float) $slabData->length;
                        $width = (float) $slabData->width;
                        $thickness = (float) $slabData->thickness;
                        $area = ($length * $width) / 144.0;
                        
                        $slabCode = $slabData->slab_code ?: 'SLAB-' . $grn->grn_number . '-' . $item->id . '-' . ($index + 1);

                        // Check if slab inventory object already exists to prevent duplicate
                        $exists = InventoryObject::where('organization_id', $grn->organization_id)
                            ->where('object_code', $slabCode)
                            ->exists();
                        if ($exists) {
                            throw new \Exception("Inventory object with code {$slabCode} already exists.");
                        }

                        // Create unique inventory object representing the physical slab
                        $inventoryObj = InventoryObject::create([
                            'organization_id' => $grn->organization_id,
                            'product_variant_id' => $item->product_variant_id,
                            'warehouse_id' => $grn->warehouse_id,
                            'storage_location_id' => $grn->storage_location_id,
                            'object_code' => $slabCode,
                            'quantity' => 1.0000,
                            'area' => $area,
                            'batch_number' => $grn->grn_number,
                            'status' => 'AVAILABLE',
                        ]);

                        // Create GraniteSlabDetail
                        GraniteSlabDetail::create([
                            'inventory_object_id' => $inventoryObj->id,
                            'length' => $length,
                            'width' => $width,
                            'thickness' => $thickness,
                            'finish' => $slabData->finish ?: 'POLISHED',
                            'origin' => $slabData->origin ?: 'IMPORT',
                        ]);

                        // Save slab code back to the slab detail for auditability
                        if (!$slabData->slab_code) {
                            $slabData->update(['slab_code' => $slabCode]);
                        }

                        // Create stock movement history entry
                        $movement = new InventoryMovement([
                            'organization_id' => $grn->organization_id,
                            'inventory_object_id' => $inventoryObj->id,
                            'movement_type' => 'PURCHASE',
                            'quantity_delta' => 1.0000,
                            'area_delta' => $area,
                            'to_warehouse_id' => $grn->warehouse_id,
                            'to_storage_location_id' => $grn->storage_location_id,
                            'reference_type' => 'GoodsReceiptNote',
                            'reference_id' => $grn->id,
                        ]);
                        $movement->save();
                    }
                } else {
                    // Bulk inventory receipt (Tiles, Sanitary, etc.): ONE aggregated inventory_object
                    $receivedQty = (float) $item->quantity_received;
                    $fromUnitId = $item->unit_id;
                    $baseUnitId = $variant->base_unit_id;

                    // 1. Convert received qty to base unit (e.g. Box to PCS)
                    $baseQty = $this->convertQuantity($receivedQty, $fromUnitId, $baseUnitId, $variant->id, $grn->organization_id);

                    // 2. Calculate area in SQFT if applicable
                    $area = $this->getAreaForQuantity($receivedQty, $fromUnitId, $variant->id, $grn->organization_id);

                    // Generate a unique object code for the bulk batch
                    $objectCode = 'BULK-' . $grn->grn_number . '-' . $item->id;

                    // Check if bulk inventory object already exists to prevent duplicate
                    $exists = InventoryObject::where('organization_id', $grn->organization_id)
                        ->where('object_code', $objectCode)
                        ->exists();
                    if ($exists) {
                        throw new \Exception("Inventory object with code {$objectCode} already exists.");
                    }

                    $inventoryObj = InventoryObject::create([
                        'organization_id' => $grn->organization_id,
                        'product_variant_id' => $item->product_variant_id,
                        'warehouse_id' => $grn->warehouse_id,
                        'storage_location_id' => $grn->storage_location_id,
                        'object_code' => $objectCode,
                        'quantity' => $baseQty,
                        'area' => $area,
                        'batch_number' => $grn->grn_number,
                        'status' => 'AVAILABLE',
                    ]);

                    // Link inventory object to the GRN item
                    $item->update(['inventory_object_id' => $inventoryObj->id]);

                    // Create stock movement history entry
                    $movement = new InventoryMovement([
                        'organization_id' => $grn->organization_id,
                        'inventory_object_id' => $inventoryObj->id,
                        'movement_type' => 'PURCHASE',
                        'quantity_delta' => $baseQty,
                        'area_delta' => $area,
                        'to_warehouse_id' => $grn->warehouse_id,
                        'to_storage_location_id' => $grn->storage_location_id,
                        'reference_type' => 'GoodsReceiptNote',
                        'reference_id' => $grn->id,
                    ]);
                    $movement->save();
                }
            }

            // Dispatch event for downstream systems (accounting, reports, etc.)
            event(new InventoryReceived($grn));
        });
    }

    /**
     * Core unit conversion engine.
     */
    public function convertQuantity(float $quantity, ?int $fromUnitId, ?int $toUnitId, int $variantId, int $organizationId): float
    {
        if (!$fromUnitId || !$toUnitId || $fromUnitId === $toUnitId) {
            return $quantity;
        }

        // 1. Try variant-specific conversion
        $conversion = UnitConversion::where('organization_id', $organizationId)
            ->where('product_variant_id', $variantId)
            ->where('from_unit_id', $fromUnitId)
            ->where('to_unit_id', $toUnitId)
            ->first();

        if ($conversion) {
            return $quantity * (float) $conversion->multiplier;
        }

        // 2. Try variant-specific conversion in reverse
        $conversion = UnitConversion::where('organization_id', $organizationId)
            ->where('product_variant_id', $variantId)
            ->where('from_unit_id', $toUnitId)
            ->where('to_unit_id', $fromUnitId)
            ->first();

        if ($conversion && (float) $conversion->multiplier > 0) {
            return $quantity / (float) $conversion->multiplier;
        }

        // 3. Try global conversion
        $conversion = UnitConversion::where('organization_id', $organizationId)
            ->whereNull('product_variant_id')
            ->where('from_unit_id', $fromUnitId)
            ->where('to_unit_id', $toUnitId)
            ->first();

        if ($conversion) {
            return $quantity * (float) $conversion->multiplier;
        }

        // 4. Try global conversion in reverse
        $conversion = UnitConversion::where('organization_id', $organizationId)
            ->whereNull('product_variant_id')
            ->where('from_unit_id', $toUnitId)
            ->where('to_unit_id', $fromUnitId)
            ->first();

        if ($conversion && (float) $conversion->multiplier > 0) {
            return $quantity / (float) $conversion->multiplier;
        }

        throw new \Exception("No unit conversion defined from unit ID {$fromUnitId} to unit ID {$toUnitId} for product variant ID {$variantId}.");
    }

    /**
     * Compute total square footage (SQFT) area for a non-granite variant.
     */
    public function getAreaForQuantity(float $quantity, ?int $fromUnitId, int $variantId, int $organizationId): float
    {
        if (!$fromUnitId) {
            return 0.0000;
        }

        // Find standard SQFT unit (symbol = 'SQFT' or type = 'AREA')
        $sqftUnit = Unit::where(fn($q) => $q->where('symbol', 'SQFT')->orWhere('type', 'AREA'))
            ->first();

        if (!$sqftUnit) {
            return 0.0000;
        }

        try {
            return $this->convertQuantity($quantity, $fromUnitId, $sqftUnit->id, $variantId, $organizationId);
        } catch (\Exception $e) {
            // Check if we can route the conversion through the variant's base unit
            $variant = Product::find($variantId);
            if ($variant && $variant->base_unit_id && $variant->base_unit_id !== $fromUnitId) {
                try {
                    $baseQty = $this->convertQuantity($quantity, $fromUnitId, $variant->base_unit_id, $variantId, $organizationId);
                    return $this->convertQuantity($baseQty, $variant->base_unit_id, $sqftUnit->id, $variantId, $organizationId);
                } catch (\Exception $ex) {
                    return 0.0000;
                }
            }
            return 0.0000;
        }
    }
}
