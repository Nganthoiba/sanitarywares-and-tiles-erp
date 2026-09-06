<?php

namespace App\Domains\Inventory\Services;

use App\Domains\Inventory\Models\InventoryReservation;
use App\Domains\Inventory\Models\InventoryObject;
use App\Domains\Product\Models\Product;
use App\Domains\Inventory\Events\InventoryReserved;
use App\Domains\Inventory\Events\InventoryReleased;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;
use Exception;

class ReservationService
{
    /**
     * Create stock reservation transactionally with concurrency protection.
     */
    public function reserve(array $data): InventoryReservation
    {
        return DB::transaction(function () use ($data) {
            $orgId = $data['organization_id'] ?? 1;
            $variantId = $data['product_variant_id'] ?? null;
            $objectId = $data['inventory_object_id'] ?? null;

            if ($objectId && !$variantId) {
                $obj = InventoryObject::where('id', $objectId)
                    ->where('organization_id', $orgId)
                    ->lockForUpdate()
                    ->firstOrFail();
                $variantId = $obj->product_variant_id;
            }

            if (!$variantId) {
                throw new Exception("Product variant ID is required for reservation.");
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
                throw new Exception("Reservation quantity must be greater than zero.");
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

            // Calculate active reservations
            $resQuery = InventoryReservation::where('organization_id', $orgId)
                ->where('product_variant_id', $variantId)
                ->whereIn('status', ['ACTIVE', 'PENDING'])
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

            $activeReservedQty = (float) $resQuery->sum('quantity');
            $availableQty = max(0, $onHandQty - $activeReservedQty);

            if ($requestedQty > $availableQty) {
                $formattedReq = rtrim(rtrim(number_format($requestedQty, 4, '.', ''), '0'), '.');
                $formattedAvail = rtrim(rtrim(number_format($availableQty, 4, '.', ''), '0'), '.');
                throw new Exception("Cannot reserve {$formattedReq} {$unitSymbol} because only {$formattedAvail} {$unitSymbol} is available.");
            }

            // Generate sequential reservation number
            $todayStr = Carbon::now()->format('Ymd');
            $countToday = InventoryReservation::where('organization_id', $orgId)
                ->whereDate('created_at', Carbon::today())
                ->count();
            $seqNumber = str_pad($countToday + 1, 4, '0', STR_PAD_LEFT);
            $resNumber = "RES-{$todayStr}-{$seqNumber}";

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
                'area' => $data['area'] ?? 0.0000,
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
     * Cancel/Release a reservation.
     */
    public function release(int $reservationId): void
    {
        DB::transaction(function () use ($reservationId) {
            $res = InventoryReservation::where('id', $reservationId)->firstOrFail();

            if (!in_array($res->status, ['ACTIVE', 'PENDING'])) {
                throw new Exception("Reservation is already {$res->status}.");
            }

            $res->status = 'CANCELLED';
            $res->save();

            event(new InventoryReleased($res));
        });
    }

    /**
     * Fulfill a reservation (when dispatched).
     */
    public function fulfill(int $reservationId): void
    {
        DB::transaction(function () use ($reservationId) {
            $res = InventoryReservation::where('id', $reservationId)->firstOrFail();

            if (!in_array($res->status, ['ACTIVE', 'PENDING'])) {
                throw new Exception("Reservation is already {$res->status}.");
            }

            $res->status = 'FULFILLED';
            $res->save();
        });
    }

    /**
     * Expire active reservations past their expiration date.
     */
    public function expireOldReservations(int $hoursThreshold = 24): int
    {
        $expiredList = InventoryReservation::whereIn('status', ['ACTIVE', 'PENDING'])
            ->where(function ($q) use ($hoursThreshold) {
                $q->where(function ($sub) {
                    $sub->whereNotNull('expires_at')
                        ->where('expires_at', '<', Carbon::now());
                })
                ->orWhere(function ($sub) use ($hoursThreshold) {
                    $sub->whereNull('expires_at')
                        ->where('created_at', '<', Carbon::now()->subHours($hoursThreshold));
                });
            })
            ->get();

        $count = 0;
        foreach ($expiredList as $res) {
            $res->status = 'EXPIRED';
            $res->save();
            event(new InventoryReleased($res));
            $count++;
        }

        return $count;
    }
}
