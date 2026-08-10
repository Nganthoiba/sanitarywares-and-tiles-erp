<?php

namespace App\Domains\Purchase\Services;

use App\Domains\Purchase\Models\PurchaseOrder;
use App\Domains\Purchase\Models\PurchaseOrderItem;
use App\Domains\Purchase\Models\PurchaseRequisition;
use Illuminate\Support\Facades\DB;
use App\Domains\Product\Models\ProductVariant;
use Exception;

class PurchaseOrderService
{
    public function __construct() {}

    /**
     * Create a new Purchase Order.
     */
    public function createPO(array $data, int $organizationId): PurchaseOrder
    {
        return DB::transaction(function () use ($data, $organizationId) {
            $poNumber = $data['po_number'] ?? 'PO-' . strtoupper(uniqid());

            // Check uniqueness per organization
            $exists = PurchaseOrder::where('organization_id', $organizationId)
                ->where('po_number', $poNumber)
                ->exists();
            if ($exists) {
                throw new Exception("Purchase Order number {$poNumber} already exists in this organization.");
            }

            // Verify and transition Purchase Requisition if linked
            $prId = $data['purchase_requisition_id'] ?? null;
            if ($prId) {
                $pr = PurchaseRequisition::lockForUpdate()->findOrFail($prId);
                if ($pr->status !== 'APPROVED') {
                    throw new Exception("Cannot create Purchase Order from Requisition that is not APPROVED.");
                }
                $pr->status = 'ORDERED';
                $pr->save();
            }

            // Calculate totals
            $totals = $this->calculateTotals($data['items'] ?? [], $organizationId);

            $po = PurchaseOrder::create([
                'organization_id' => $organizationId,
                'branch_id' => $data['branch_id'],
                'supplier_id' => $data['supplier_id'],
                'purchase_requisition_id' => $prId,
                'po_number' => $poNumber,
                'po_date' => $data['po_date'],
                'expected_delivery_date' => $data['expected_delivery_date'] ?? null,
                'reference_number' => $data['reference_number'] ?? null,
                'payment_terms' => $data['payment_terms'] ?? null,
                'delivery_terms' => $data['delivery_terms'] ?? null,
                'total_amount' => $totals['total_amount'],
                'discount_amount' => $totals['discount_amount'],
                'tax_amount' => $totals['tax_amount'],
                'status' => 'DRAFT',
                'remarks' => $data['remarks'] ?? null,
            ]);

            // Save items
            if (!empty($data['items'])) {
                foreach ($data['items'] as $itemData) {
                    $variant = ProductVariant::findOrFail($itemData['product_variant_id']);
                    $qty = (float) $itemData['quantity'];
                    $price = (float) $itemData['unit_price'];
                    $discount = (float) ($itemData['discount_amount'] ?? 0.0);
                    $taxRate = (float) ($itemData['tax_rate'] ?? 0.0);
                    $purchaseUnitId = $itemData['unit_id'];
                    $pricingUnitId = $itemData['pricing_unit_id'] ?? $purchaseUnitId;

                    if ($qty <= 0) {
                        throw new Exception("Quantity must be greater than zero.");
                    }
                    if ($price < 0) {
                        throw new Exception("Unit price must be non-negative.");
                    }

                    if ($purchaseUnitId != $pricingUnitId) {
                        if ($variant->inventory_behavior === 'SLAB') {
                            $pricingBasis = (float) ($itemData['estimated_pricing_quantity'] ?? 0.0);
                        } else {
                            $multiplier = app(\App\Domains\Inventory\Services\InventoryService::class)->convertQuantity(1.0, $purchaseUnitId, $pricingUnitId, $variant->id, $organizationId);
                            $pricingBasis = $qty * $multiplier;
                        }
                    } else {
                        $pricingBasis = $qty;
                    }

                    $subtotal = ($pricingBasis * $price) - $discount;
                    $taxAmount = $subtotal * ($taxRate / 100);

                    $po->items()->create([
                        'organization_id' => $organizationId,
                        'product_variant_id' => $itemData['product_variant_id'],
                        'quantity' => $qty,
                        'received_quantity' => 0.0000,
                        'unit_id' => $purchaseUnitId,
                        'pricing_unit_id' => $pricingUnitId,
                        'estimated_pricing_quantity' => $pricingBasis,
                        'received_pricing_quantity' => 0.0000,
                        'unit_price' => $price,
                        'discount_amount' => $discount,
                        'tax_amount' => $taxAmount,
                        'tax_rate' => $taxRate,
                        'subtotal' => $subtotal + $taxAmount,
                    ]);
                }
            }

            return $po;
        });
    }

    /**
     * Update an existing Purchase Order (DRAFT only).
     */
    public function updatePO(int $id, array $data): PurchaseOrder
    {
        return DB::transaction(function () use ($id, $data) {
            $po = PurchaseOrder::lockForUpdate()->findOrFail($id);

            if ($po->status !== 'DRAFT') {
                throw new Exception("Cannot edit Purchase Order after it has transitioned out of DRAFT status.");
            }

            // Calculate totals
            $totals = $this->calculateTotals($data['items'] ?? [], $po->organization_id);

            $po->update([
                'branch_id' => $data['branch_id'],
                'supplier_id' => $data['supplier_id'],
                'po_date' => $data['po_date'],
                'expected_delivery_date' => $data['expected_delivery_date'] ?? null,
                'reference_number' => $data['reference_number'] ?? null,
                'payment_terms' => $data['payment_terms'] ?? null,
                'delivery_terms' => $data['delivery_terms'] ?? null,
                'total_amount' => $totals['total_amount'],
                'discount_amount' => $totals['discount_amount'],
                'tax_amount' => $totals['tax_amount'],
                'remarks' => $data['remarks'] ?? $po->remarks,
            ]);

            // Recreate items
            if (isset($data['items'])) {
                $po->items()->forceDelete();

                foreach ($data['items'] as $itemData) {
                    $variant = ProductVariant::findOrFail($itemData['product_variant_id']);
                    $qty = (float) $itemData['quantity'];
                    $price = (float) $itemData['unit_price'];
                    $discount = (float) ($itemData['discount_amount'] ?? 0.0);
                    $taxRate = (float) ($itemData['tax_rate'] ?? 0.0);
                    $purchaseUnitId = $itemData['unit_id'];
                    $pricingUnitId = $itemData['pricing_unit_id'] ?? $purchaseUnitId;

                    if ($qty <= 0) {
                        throw new Exception("Quantity must be greater than zero.");
                    }
                    if ($price < 0) {
                        throw new Exception("Unit price must be non-negative.");
                    }

                    if ($purchaseUnitId != $pricingUnitId) {
                        if ($variant->inventory_behavior === 'SLAB') {
                            $pricingBasis = (float) ($itemData['estimated_pricing_quantity'] ?? 0.0);
                        } else {
                            $multiplier = app(\App\Domains\Inventory\Services\InventoryService::class)->convertQuantity(1.0, $purchaseUnitId, $pricingUnitId, $variant->id, $po->organization_id);
                            $pricingBasis = $qty * $multiplier;
                        }
                    } else {
                        $pricingBasis = $qty;
                    }

                    $subtotal = ($pricingBasis * $price) - $discount;
                    $taxAmount = $subtotal * ($taxRate / 100);

                    $po->items()->create([
                        'organization_id' => $po->organization_id,
                        'product_variant_id' => $itemData['product_variant_id'],
                        'quantity' => $qty,
                        'received_quantity' => 0.0000,
                        'unit_id' => $purchaseUnitId,
                        'pricing_unit_id' => $pricingUnitId,
                        'estimated_pricing_quantity' => $pricingBasis,
                        'received_pricing_quantity' => 0.0000,
                        'unit_price' => $price,
                        'discount_amount' => $discount,
                        'tax_amount' => $taxAmount,
                        'tax_rate' => $taxRate,
                        'subtotal' => $subtotal + $taxAmount,
                    ]);
                }
            }

            return $po->fresh('items');
        });
    }

    /**
     * Submit Purchase Order for approval.
     */
    public function submit(int $id): PurchaseOrder
    {
        return DB::transaction(function () use ($id) {
            $po = PurchaseOrder::lockForUpdate()->findOrFail($id);

            if ($po->status !== 'DRAFT') {
                throw new Exception("Only DRAFT purchase orders can be submitted.");
            }

            $po->status = 'SUBMITTED';
            $po->save();

            return $po;
        });
    }

    /**
     * Approve Purchase Order.
     */
    public function approve(int $id): PurchaseOrder
    {
        return DB::transaction(function () use ($id) {
            $po = PurchaseOrder::lockForUpdate()->findOrFail($id);

            if ($po->status !== 'SUBMITTED') {
                throw new Exception("Only SUBMITTED purchase orders can be approved.");
            }

            $po->status = 'APPROVED';
            $po->save();

            return $po;
        });
    }

    /**
     * Send Purchase Order to Supplier.
     */
    public function send(int $id): PurchaseOrder
    {
        return DB::transaction(function () use ($id) {
            $po = PurchaseOrder::lockForUpdate()->findOrFail($id);

            if ($po->status !== 'APPROVED') {
                throw new Exception("Only APPROVED purchase orders can be marked as SENT.");
            }

            $po->status = 'SENT';
            $po->save();

            return $po;
        });
    }

    /**
     * Cancel Purchase Order.
     */
    public function cancel(int $id): PurchaseOrder
    {
        return DB::transaction(function () use ($id) {
            $po = PurchaseOrder::lockForUpdate()->findOrFail($id);

            // Business Rules for cancellation: cannot cancel if fully received or closed
            if (in_array($po->status, ['FULLY_RECEIVED', 'CLOSED', 'CANCELLED'])) {
                throw new Exception("Cannot cancel Purchase Order when it is {$po->status}.");
            }

            $po->status = 'CANCELLED';
            $po->save();

            // Revert Purchase Requisition if it was linked
            if ($po->purchase_requisition_id) {
                $pr = PurchaseRequisition::lockForUpdate()->find($po->purchase_requisition_id);
                if ($pr) {
                    $pr->status = 'APPROVED';
                    $pr->save();
                }
            }

            return $po;
        });
    }

    /**
     * Close Purchase Order.
     */
    public function close(int $id): PurchaseOrder
    {
        return DB::transaction(function () use ($id) {
            $po = PurchaseOrder::lockForUpdate()->findOrFail($id);

            if (in_array($po->status, ['CLOSED', 'CANCELLED'])) {
                throw new Exception("Purchase Order is already {$po->status}.");
            }

            $po->status = 'CLOSED';
            $po->save();

            return $po;
        });
    }

    /**
     * Helper to calculate totals for PO items.
     */
    protected function calculateTotals(array $items, int $organizationId): array
    {
        $totalAmount = 0.0;
        $discountAmount = 0.0;
        $taxAmount = 0.0;

        foreach ($items as $item) {
            $variant = ProductVariant::findOrFail($item['product_variant_id']);
            $qty = (float) $item['quantity'];
            $price = (float) $item['unit_price'];
            $discount = (float) ($item['discount_amount'] ?? 0.0);
            $taxRate = (float) ($item['tax_rate'] ?? 0.0);
            $purchaseUnitId = $item['unit_id'];
            $pricingUnitId = $item['pricing_unit_id'] ?? $purchaseUnitId;

            if ($qty <= 0) {
                throw new Exception("Quantity must be greater than zero.");
            }
            if ($price < 0) {
                throw new Exception("Unit price must be non-negative.");
            }

            if ($purchaseUnitId != $pricingUnitId) {
                if ($variant->inventory_behavior === 'SLAB') {
                    $pricingBasis = (float) ($item['estimated_pricing_quantity'] ?? 0.0);
                } else {
                    $multiplier = app(\App\Domains\Inventory\Services\InventoryService::class)->convertQuantity(1.0, $purchaseUnitId, $pricingUnitId, $variant->id, $organizationId);
                    $pricingBasis = $qty * $multiplier;
                }
            } else {
                $pricingBasis = $qty;
            }

            $subtotal = ($pricingBasis * $price) - $discount;
            $itemTax = $subtotal * ($taxRate / 100);

            $discountAmount += $discount;
            $taxAmount += $itemTax;
            $totalAmount += ($subtotal + $itemTax);
        }

        return [
            'total_amount' => $totalAmount,
            'discount_amount' => $discountAmount,
            'tax_amount' => $taxAmount
        ];
    }
}
