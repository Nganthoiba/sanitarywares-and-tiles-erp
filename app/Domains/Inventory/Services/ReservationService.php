<?php

namespace App\Domains\Inventory\Services;

use App\Domains\Inventory\Models\InventoryReservation;
use App\Domains\Inventory\Models\InventoryObject;
use App\Domains\Product\Models\Product;
use App\Domains\Inventory\Events\InventoryReserved;
use App\Domains\Inventory\Events\InventoryReleased;
use App\Domains\Inventory\Exceptions\InsufficientStockException;
use App\Domains\Inventory\Exceptions\InvalidReservationException;
use App\Domains\Inventory\Exceptions\ReservationConflictException;
use App\Domains\Master\Services\DocumentNumberService;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;
use Exception;

class ReservationService
{
    protected DocumentNumberService $documentNumberService;

    public function __construct(?DocumentNumberService $documentNumberService = null)
    {
        $this->documentNumberService = $documentNumberService ?? new DocumentNumberService();
    }

    /**
     * Create stock reservation transactionally with concurrency protection.
     */
    public function reserve(array $data): InventoryReservation
    {
        return DB::transaction(function () use ($data) {
            if (empty($data['organization_id'])) {
                throw new \InvalidArgumentException("Organization context (organization_id) is required.");
            }
            $orgId = (int) $data['organization_id'];
            $variantId = $data['product_variant_id'] ?? $data['product_id'] ?? null;
            $objectId = $data['inventory_object_id'] ?? null;

            if ($objectId && !$variantId) {
                $obj = InventoryObject::where('id', $objectId)
                    ->where('organization_id', $orgId)
                    ->lockForUpdate()
                    ->firstOrFail();
                $variantId = $obj->product_variant_id;
            }

            if (!$variantId) {
                throw new InvalidReservationException("Product variant ID is required for reservation.");
            }

            $product = Product::where('id', $variantId)
                ->where('organization_id', $orgId)
                ->with(['baseUnit', 'salesUnit'])
                ->firstOrFail();

            $unitSymbol = $product->baseUnit?->symbol ?? $product->salesUnit?->symbol ?? 'Units';
            if ($product->inventory_behavior === 'SLAB') {
                $unitSymbol = 'Slabs';
            }

            $requestedQty = (float) ($data['quantity'] ?? 0);
            if ($requestedQty <= 0) {
                throw new InvalidReservationException("Reservation quantity must be greater than zero.");
            }

            // Lock inventory objects for this variant & optional warehouse/location
            $objQuery = InventoryObject::where('organization_id', $orgId)
                ->where('product_variant_id', $variantId)
                ->whereNotIn('status', ['CONSUMED', 'DISPOSED']);

            if (!empty($data['warehouse_id'])) {
                $objQuery->where('warehouse_id', $data['warehouse_id']);
            }
            if (!empty($data['storage_location_id'])) {
                $objQuery->where('storage_location_id', $data['storage_location_id']);
            }
            if ($objectId) {
                $objQuery->where('id', $objectId);
            }

            $inventoryObjects = $objQuery->lockForUpdate()->get();
            $onHandQty = (float) $inventoryObjects->sum('quantity');

            // Calculate active reservations based on remaining unfulfilled quantities
            $resQuery = InventoryReservation::where('organization_id', $orgId)
                ->where('product_variant_id', $variantId)
                ->whereIn('status', ['ACTIVE', 'PENDING', 'PARTIALLY_FULFILLED'])
                ->where(function ($q) {
                    $q->whereNull('expires_at')
                      ->orWhere('expires_at', '>=', Carbon::now());
                });

            if (!empty($data['warehouse_id'])) {
                $resQuery->where('warehouse_id', $data['warehouse_id']);
            }
            if (!empty($data['storage_location_id'])) {
                $resQuery->where('storage_location_id', $data['storage_location_id']);
            }
            if ($objectId) {
                $resQuery->where('inventory_object_id', $objectId);
            }

            $activeReservedQty = (float) $resQuery->select(DB::raw('SUM(quantity - fulfilled_quantity) as total_active'))->value('total_active') ?? 0.0;
            $availableQty = max(0, $onHandQty - $activeReservedQty);

            if ($requestedQty > $availableQty) {
                $formattedReq = rtrim(rtrim(number_format($requestedQty, 4, '.', ''), '0'), '.');
                $formattedAvail = rtrim(rtrim(number_format($availableQty, 4, '.', ''), '0'), '.');
                throw new InsufficientStockException("Cannot reserve {$formattedReq} {$unitSymbol} because only {$formattedAvail} {$unitSymbol} is available.");
            }

            // Generate concurrency-safe FY-integrated reservation number
            $resNumber = $this->documentNumberService->generateNextNumber($orgId, 'RES');

            $res = InventoryReservation::create([
                'organization_id' => $orgId,
                'reservation_number' => $resNumber,
                'source_type' => $data['source_type'] ?? 'MANUAL',
                'source_id' => $data['source_id'] ?? 0,
                'source_item_id' => $data['source_item_id'] ?? 0,
                'product_variant_id' => $variantId,
                'inventory_object_id' => $objectId,
                'warehouse_id' => $data['warehouse_id'] ?? ($inventoryObjects->first()?->warehouse_id),
                'storage_location_id' => $data['storage_location_id'] ?? null,
                'customer_id' => $data['customer_id'] ?? null,
                'created_by' => $data['created_by'] ?? null,
                'quantity' => $requestedQty,
                'fulfilled_quantity' => 0.0000,
                'area' => $data['area'] ?? 0.0000,
                'fulfilled_area' => 0.0000,
                'reservation_date' => $data['reservation_date'] ?? Carbon::now(),
                'expires_at' => !empty($data['expires_at']) ? Carbon::parse($data['expires_at']) : null,
                'reference_number' => $data['reference_number'] ?? null,
                'remarks' => $data['remarks'] ?? null,
                'status' => 'ACTIVE',
            ]);

            event(new InventoryReserved($res));

            return $res;
        });
    }

    /**
     * Cancel/Release a reservation. Releases remaining unfulfilled quantity.
     */
    public function release(int $reservationId): void
    {
        DB::transaction(function () use ($reservationId) {
            $res = InventoryReservation::where('id', $reservationId)->firstOrFail();

            if (!in_array($res->status, ['ACTIVE', 'PENDING', 'PARTIALLY_FULFILLED'])) {
                throw new ReservationConflictException("Reservation #{$res->reservation_number} is already {$res->status}.");
            }

            if ((float) $res->fulfilled_quantity > 0) {
                $res->status = 'FULFILLED'; // Close out unfulfilled remaining balance
            } else {
                $res->status = 'CANCELLED';
            }
            $res->save();

            event(new InventoryReleased($res));
        });
    }

    /**
     * Fulfill a reservation (when dispatched / sold). Supports partial fulfillment.
     */
    public function fulfill(InventoryReservation|int $reservation, ?float $quantityToFulfill = null, ?float $areaToFulfill = null): InventoryReservation
    {
        return DB::transaction(function () use ($reservation, $quantityToFulfill, $areaToFulfill) {
            $res = $reservation instanceof InventoryReservation 
                ? $reservation 
                : InventoryReservation::where('id', $reservation)->firstOrFail();

            if (!in_array($res->status, ['ACTIVE', 'PENDING', 'PARTIALLY_FULFILLED'])) {
                throw new ReservationConflictException("Reservation #{$res->reservation_number} is currently {$res->status} and cannot be fulfilled.");
            }

            $remainingQty = $res->remaining_quantity;
            $fulfillQty = ($quantityToFulfill !== null && $quantityToFulfill > 0)
                ? min($quantityToFulfill, $remainingQty)
                : $remainingQty;

            $remainingArea = $res->remaining_area;
            $fulfillArea = ($areaToFulfill !== null && $areaToFulfill > 0)
                ? min($areaToFulfill, $remainingArea)
                : $remainingArea;

            $res->fulfilled_quantity = (float) $res->fulfilled_quantity + $fulfillQty;
            $res->fulfilled_area = (float) $res->fulfilled_area + $fulfillArea;

            if ($res->fulfilled_quantity >= (float) $res->quantity) {
                $res->status = 'FULFILLED';
            } else {
                $res->status = 'PARTIALLY_FULFILLED';
            }

            $res->save();

            return $res;
        });
    }

    /**
     * Expire active reservations past their explicit expiration date.
     * Note: Reservations with expires_at = NULL do NOT auto-expire (Never Expires).
     */
    public function expireOldReservations(?int $hoursThreshold = null): int
    {
        $query = InventoryReservation::whereIn('status', ['ACTIVE', 'PENDING', 'PARTIALLY_FULFILLED']);

        if ($hoursThreshold !== null && $hoursThreshold > 0) {
            $query->where(function ($q) use ($hoursThreshold) {
                $q->where(function ($sub) {
                    $sub->whereNotNull('expires_at')
                        ->where('expires_at', '<', Carbon::now());
                })
                ->orWhere(function ($sub) use ($hoursThreshold) {
                    $sub->whereNull('expires_at')
                        ->where('created_at', '<', Carbon::now()->subHours($hoursThreshold));
                });
            });
        } else {
            $query->whereNotNull('expires_at')
                ->where('expires_at', '<', Carbon::now());
        }

        $expiredList = $query->get();

        $count = 0;
        foreach ($expiredList as $res) {
            if ((float) $res->fulfilled_quantity > 0) {
                $res->status = 'FULFILLED'; // Keep fulfilled portion, expire remaining balance
            } else {
                $res->status = 'EXPIRED';
            }
            $res->save();
            event(new InventoryReleased($res));
            $count++;
        }

        return $count;
    }

    /**
     * Get active reserved quantity for a product variant at warehouse/location level.
     */
    public function getActiveReservedQuantity(int $productVariantId, ?int $warehouseId = null, ?int $storageLocationId = null): float
    {
        $query = InventoryReservation::where('product_variant_id', $productVariantId)
            ->whereIn('status', ['ACTIVE', 'PENDING', 'PARTIALLY_FULFILLED']);

        if ($warehouseId) {
            $query->where('warehouse_id', $warehouseId);
        }
        if ($storageLocationId) {
            $query->where('storage_location_id', $storageLocationId);
        }

        return (float) ($query->select(DB::raw('SUM(quantity - fulfilled_quantity) as total_active'))->value('total_active') ?? 0.0);
    }
}
