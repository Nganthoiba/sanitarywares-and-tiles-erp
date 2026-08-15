<?php

namespace App\Domains\Purchase\Services;

use App\Domains\Purchase\Models\PurchaseOrder;
use App\Domains\Purchase\Models\PurchaseOrderItem;
use App\Domains\Purchase\Models\PurchaseRequisition;
use Illuminate\Support\Facades\DB;
use App\Domains\Product\Models\Product;
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

            // Validate branch and supplier belong to organization
            \App\Domains\Master\Models\Branch::where('organization_id', $organizationId)->findOrFail($data['branch_id']);
            \App\Domains\Master\Models\Supplier::where('organization_id', $organizationId)->findOrFail($data['supplier_id']);

            // Verify and transition Purchase Requisition if linked
            $prId = $data['purchase_requisition_id'] ?? null;
            if ($prId) {
                $pr = PurchaseRequisition::lockForUpdate()->where('organization_id', $organizationId)->findOrFail($prId);
                if ($pr->status !== 'APPROVED') {
                    throw new Exception("Cannot create Purchase Order from Requisition that is not APPROVED.");
                }
                $pr->status = 'ORDERED';
                $pr->save();
            }

            // Calculate totals and validate items
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
            foreach ($totals['items'] as $item) {
                $po->items()->create([
                    'organization_id' => $organizationId,
                    'product_variant_id' => $item['product_variant_id'],
                    'quantity' => $item['quantity'],
                    'received_quantity' => 0.0000,
                    'unit_id' => $item['unit_id'],
                    'pricing_unit_id' => $item['pricing_unit_id'],
                    'estimated_pricing_quantity' => $item['estimated_pricing_quantity'],
                    'pricing_conversion_factor' => $item['pricing_conversion_factor'],
                    'received_pricing_quantity' => 0.0000,
                    'unit_price' => $item['unit_price'],
                    'discount_amount' => $item['discount_amount'],
                    'tax_amount' => $item['tax_amount'],
                    'tax_rate' => $item['tax_rate'],
                    'subtotal' => $item['subtotal'],
                ]);
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

            // Validate branch and supplier belong to organization
            \App\Domains\Master\Models\Branch::where('organization_id', $po->organization_id)->findOrFail($data['branch_id']);
            \App\Domains\Master\Models\Supplier::where('organization_id', $po->organization_id)->findOrFail($data['supplier_id']);

            // Calculate totals and validate items
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

                foreach ($totals['items'] as $item) {
                    $po->items()->create([
                        'organization_id' => $po->organization_id,
                        'product_variant_id' => $item['product_variant_id'],
                        'quantity' => $item['quantity'],
                        'received_quantity' => 0.0000,
                        'unit_id' => $item['unit_id'],
                        'pricing_unit_id' => $item['pricing_unit_id'],
                        'estimated_pricing_quantity' => $item['estimated_pricing_quantity'],
                        'pricing_conversion_factor' => $item['pricing_conversion_factor'],
                        'received_pricing_quantity' => 0.0000,
                        'unit_price' => $item['unit_price'],
                        'discount_amount' => $item['discount_amount'],
                        'tax_amount' => $item['tax_amount'],
                        'tax_rate' => $item['tax_rate'],
                        'subtotal' => $item['subtotal'],
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
     * Resolve unit conversions.
     */
    public function resolveConversionMultiplier(int $fromUnitId, int $toUnitId, int $variantId, int $organizationId): ?float
    {
        if ($fromUnitId === $toUnitId) {
            return 1.0;
        }

        // 1. Try variant-specific conversion
        $conversion = \App\Domains\Product\Models\UnitConversion::where('organization_id', $organizationId)
            ->where('product_variant_id', $variantId)
            ->where('from_unit_id', $fromUnitId)
            ->where('to_unit_id', $toUnitId)
            ->first();

        if ($conversion) {
            return (float) $conversion->multiplier;
        }

        // 2. Try variant-specific conversion in reverse
        $conversion = \App\Domains\Product\Models\UnitConversion::where('organization_id', $organizationId)
            ->where('product_variant_id', $variantId)
            ->where('from_unit_id', $toUnitId)
            ->where('to_unit_id', $fromUnitId)
            ->first();

        if ($conversion && (float) $conversion->multiplier > 0) {
            return 1.0 / (float) $conversion->multiplier;
        }

        // 3. Try global conversion
        $conversion = \App\Domains\Product\Models\UnitConversion::where('organization_id', $organizationId)
            ->whereNull('product_variant_id')
            ->where('from_unit_id', $fromUnitId)
            ->where('to_unit_id', $toUnitId)
            ->first();

        if ($conversion) {
            return (float) $conversion->multiplier;
        }

        // 4. Try global conversion in reverse
        $conversion = \App\Domains\Product\Models\UnitConversion::where('organization_id', $organizationId)
            ->whereNull('product_variant_id')
            ->where('from_unit_id', $toUnitId)
            ->where('to_unit_id', $fromUnitId)
            ->first();

        if ($conversion && (float) $conversion->multiplier > 0) {
            return 1.0 / (float) $conversion->multiplier;
        }

        return null;
    }

    /**
     * Retrieve valid units for variant.
     */
    public function getValidUnitsForVariant(Product $variant): \Illuminate\Support\Collection
    {
        $units = collect([
            $variant->base_unit_id,
            $variant->purchase_unit_id,
            $variant->sales_unit_id
        ])->filter()->unique();

        $conversionUnits = \App\Domains\Product\Models\UnitConversion::where('product_variant_id', $variant->id)
            ->get()
            ->flatMap(fn($c) => [$c->from_unit_id, $c->to_unit_id]);

        return $units->concat($conversionUnits)->unique()->values();
    }

    /**
     * Helper to calculate totals for PO items and validate all items.
     */
    protected function calculateTotals(array $items, int $organizationId): array
    {
        $totalAmount = 0.0;
        $discountAmount = 0.0;
        $taxAmount = 0.0;
        $calculatedItems = [];

        foreach ($items as $item) {
            $variant = Product::where('organization_id', $organizationId)->findOrFail($item['product_variant_id']);
            $qty = (float) $item['quantity'];
            $price = (float) $item['unit_price'];
            $discount = (float) ($item['discount_amount'] ?? 0.0);
            $taxRate = (float) ($item['tax_rate'] ?? 0.0);
            $purchaseUnitId = (int) $item['unit_id'];
            $pricingUnitId = isset($item['pricing_unit_id']) ? (int) $item['pricing_unit_id'] : $purchaseUnitId;

            if ($qty <= 0) {
                throw new Exception("Quantity must be greater than zero.");
            }
            if ($price < 0) {
                throw new Exception("Unit price must be non-negative.");
            }
            if ($discount < 0) {
                throw new Exception("Discount amount must be non-negative.");
            }
            if ($taxRate < 0) {
                throw new Exception("Tax rate must be non-negative.");
            }

            // Check that the unit is valid for the product
            $validUnits = $this->getValidUnitsForVariant($variant);
            if (!$validUnits->contains($purchaseUnitId)) {
                throw new Exception("Unit ID {$purchaseUnitId} is not configured for product {$variant->name}.");
            }

            if ($variant->inventory_behavior === 'SLAB') {
                // Slab items require SQFT or valid sales unit as pricing basis (Expected Area)
                $pricingBasis = (float) ($item['estimated_pricing_quantity'] ?? 0.0);
                $pricingConversionFactor = null;
            } else {
                if (!$validUnits->contains($pricingUnitId)) {
                    throw new Exception("Pricing Unit ID {$pricingUnitId} is not configured for product {$variant->name}.");
                }

                if ($purchaseUnitId !== $pricingUnitId) {
                    $multiplier = $this->resolveConversionMultiplier($purchaseUnitId, $pricingUnitId, $variant->id, $organizationId);
                    if ($multiplier === null) {
                        throw new Exception("No valid conversion is configured between the selected units for {$variant->name}.");
                    }
                    $pricingBasis = $qty * $multiplier;
                    $pricingConversionFactor = $multiplier;
                } else {
                    $pricingBasis = $qty;
                    $pricingConversionFactor = 1.0;
                }
            }

            $subtotal = ($pricingBasis * $price) - $discount;
            $itemTax = $subtotal * ($taxRate / 100);

            $discountAmount += $discount;
            $taxAmount += $itemTax;
            $totalAmount += ($subtotal + $itemTax);

            $calculatedItems[] = [
                'product_variant_id' => $variant->id,
                'quantity' => $qty,
                'unit_id' => $purchaseUnitId,
                'pricing_unit_id' => $pricingUnitId,
                'estimated_pricing_quantity' => $pricingBasis,
                'pricing_conversion_factor' => $pricingConversionFactor,
                'unit_price' => $price,
                'discount_amount' => $discount,
                'tax_rate' => $taxRate,
                'tax_amount' => $itemTax,
                'subtotal' => $subtotal + $itemTax,
            ];
        }

        return [
            'total_amount' => $totalAmount,
            'discount_amount' => $discountAmount,
            'tax_amount' => $taxAmount,
            'items' => $calculatedItems
        ];
    }
}
