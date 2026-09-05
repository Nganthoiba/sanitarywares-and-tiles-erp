<?php

namespace App\Http\Controllers\Api\Inventory;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Domains\Inventory\Services\ReservationService;
use App\Domains\Inventory\Services\AllocationService;
use App\Domains\Inventory\Services\TransferService;
use App\Domains\Inventory\Services\AdjustmentService;
use App\Domains\Inventory\Services\InventoryCountService;
use App\Domains\Inventory\Services\GraniteService;
use App\Domains\Inventory\Services\ValuationService;
use App\Domains\Inventory\Models\InventoryObject;
use App\Domains\Inventory\Models\InventoryReservation;
use App\Domains\Inventory\Models\InventoryAllocation;
use App\Domains\Inventory\Models\InventoryTransfer;
use App\Domains\Inventory\Models\InventoryAdjustment;
use App\Domains\Inventory\Models\InventoryCount;
use App\Domains\Inventory\Models\InventoryValuation;
use App\Domains\Inventory\Models\InventoryMovement;
use App\Domains\Master\Models\Warehouse;
use App\Domains\Master\Models\Category;
use App\Domains\Master\Models\StorageLocation;
use App\Domains\Product\Models\Product;
use App\Http\Resources\InventoryObjectResource;

class InventoryApiController extends Controller
{
    public function __construct(
        protected ReservationService $reservationService,
        protected AllocationService $allocationService,
        protected TransferService $transferService,
        protected AdjustmentService $adjustmentService,
        protected InventoryCountService $countService,
        protected GraniteService $graniteService,
        protected ValuationService $valuationService
    ) {}

    /**
     * GET /api/inventory
     * Aggregated stock view grouped by product, warehouse, location, and batch.
     */
    public function index(Request $request)
    {
        $orgId = $request->header('X-Organization-Id') ?? $request->user()?->organization_id;

        $query = InventoryObject::with([
            'variant.baseUnit',
            'variant.salesUnit',
            'variant.purchaseUnit',
            'variant.category',
            'variant.currentCommercialPricing',
            'variant.attributeValues.attribute',
            'warehouse',
            'storageLocation',
            'slabDetail',
        ])->whereNotIn('status', ['CONSUMED', 'DISPOSED']);

        if ($orgId) {
            $query->where('organization_id', $orgId);
        } elseif ($request->has('organization_id')) {
            $query->where('organization_id', $request->input('organization_id'));
        }

        if ($request->filled('warehouse_id')) {
            $query->where('warehouse_id', $request->input('warehouse_id'));
        }

        if ($request->filled('category_id')) {
            $query->whereHas('variant', function ($q) use ($request) {
                $q->where('category_id', $request->input('category_id'));
            });
        }

        $inventoryObjects = $query->get();

        // Fetch active reservations
        $reservationQuery = InventoryReservation::where('status', 'PENDING');
        if ($orgId) {
            $reservationQuery->where('organization_id', $orgId);
        }
        $reservations = $reservationQuery->get()->groupBy('inventory_object_id');

        $grouped = [];

        foreach ($inventoryObjects as $obj) {
            $variant = $obj->variant;
            if (!$variant) continue;

            $key = implode('_', [
                $obj->product_variant_id,
                $obj->warehouse_id ?? 0,
                $obj->storage_location_id ?? 0,
                $obj->batch_number ?? 'DEFAULT'
            ]);

            if (!isset($grouped[$key])) {
                // Secondary product specs string
                $specsList = [];
                if ($variant->attributeValues && $variant->attributeValues->count() > 0) {
                    foreach ($variant->attributeValues as $av) {
                        if ($av->value) {
                            $attrName = $av->attribute?->name;
                            $specsList[] = $attrName ? "{$attrName}: {$av->value}" : $av->value;
                        }
                    }
                }
                if (empty($specsList) && $variant->currentCommercialPricing) {
                    $p = $variant->currentCommercialPricing;
                    if ($p->length_mm && $p->width_mm) {
                        $specsList[] = "{$p->length_mm} × {$p->width_mm} mm";
                    }
                }
                if (empty($specsList)) {
                    if ($variant->inventory_behavior === 'SLAB') {
                        $specsList[] = 'Granite slab';
                    } elseif ($variant->category) {
                        $specsList[] = $variant->category->name;
                    }
                }
                $productSpecs = implode(' | ', array_slice($specsList, 0, 2));

                // Packaging info
                $packagingInfo = null;
                if ($variant->pieces_per_box && $variant->pieces_per_box > 0) {
                    $packagingInfo = "1 Box = {$variant->pieces_per_box} Pieces";
                } elseif ($variant->currentCommercialPricing && $variant->currentCommercialPricing->pieces_per_box > 0) {
                    $packagingInfo = "1 Box = {$variant->currentCommercialPricing->pieces_per_box} Pieces";
                }

                // Unit symbol
                $unitSymbol = $variant->baseUnit?->symbol ?? $variant->baseUnit?->name ?? 'Units';
                if ($variant->inventory_behavior === 'SLAB') {
                    $unitSymbol = 'Slabs';
                }

                $grouped[$key] = [
                    'id' => $key,
                    'product_variant_id' => $variant->id,
                    'product_name' => $variant->name,
                    'variant_name' => $variant->name,
                    'sku' => $variant->sku,
                    'gtin' => $variant->gtin,
                    'barcode' => $variant->barcode,
                    'category_id' => $variant->category_id,
                    'category_name' => $variant->category?->name ?? 'Uncategorized',
                    'inventory_behavior' => $variant->inventory_behavior ?? 'STANDARD',
                    'is_slab' => $variant->inventory_behavior === 'SLAB',
                    'product_specs' => $productSpecs,
                    'packaging_info' => $packagingInfo,
                    'unit_symbol' => $unitSymbol,
                    'warehouse_id' => $obj->warehouse_id,
                    'warehouse_name' => $obj->warehouse?->name ?? 'Main Warehouse',
                    'storage_location_id' => $obj->storage_location_id,
                    'storage_location_code' => $obj->storageLocation?->code ?? '-',
                    'batch_number' => $obj->batch_number ?? '-',
                    'on_hand_qty' => 0,
                    'quantity' => 0,
                    'reserved_qty' => 0,
                    'available_qty' => 0,
                    'on_hand_area' => 0,
                    'area' => 0,
                    'reserved_area' => 0,
                    'available_area' => 0,
                    'length' => $obj->slabDetail ? (float) $obj->slabDetail->length : null,
                    'width' => $obj->slabDetail ? (float) $obj->slabDetail->width : null,
                    'thickness' => $obj->slabDetail ? (float) $obj->slabDetail->thickness : null,
                    'finish' => $obj->slabDetail?->finish,
                    'origin' => $obj->slabDetail?->origin,
                    'inventory_object_ids' => [],
                    'slabs' => [],
                ];
            }

            $qty = (float) $obj->quantity;
            $area = (float) $obj->area;

            $objReservations = $reservations->get($obj->id, collect());
            $objReservedQty = (float) $objReservations->sum('quantity');
            $objReservedArea = (float) $objReservations->sum('area');
            if ($obj->status === 'RESERVED' && $objReservedQty == 0) {
                $objReservedQty = $qty;
                $objReservedArea = $area;
            }

            $grouped[$key]['on_hand_qty'] += $qty;
            $grouped[$key]['quantity'] += $qty;
            $grouped[$key]['on_hand_area'] += $area;
            $grouped[$key]['area'] += $area;
            $grouped[$key]['reserved_qty'] += $objReservedQty;
            $grouped[$key]['reserved_area'] += $objReservedArea;
            $grouped[$key]['inventory_object_ids'][] = $obj->id;

            if ($variant->inventory_behavior === 'SLAB' && $obj->slabDetail) {
                $slab = $obj->slabDetail;
                $grouped[$key]['slabs'][] = [
                    'id' => $obj->id,
                    'slab_code' => $obj->object_code,
                    'length' => (float) $slab->length,
                    'width' => (float) $slab->width,
                    'thickness' => (float) $slab->thickness,
                    'area' => (float) $obj->area,
                    'finish' => $slab->finish ?? 'POLISHED',
                    'origin' => $slab->origin ?? '-',
                    'status' => $obj->status,
                    'storage_location_code' => $obj->storageLocation?->code ?? '-',
                ];
            }
        }

        $stockItems = [];
        $totalOnHand = 0;
        $totalAvailable = 0;
        $totalReserved = 0;
        $lowStockCount = 0;

        $search = strtolower(trim($request->input('search', '')));
        $statusFilter = strtoupper($request->input('status', 'ALL'));

        foreach ($grouped as $item) {
            $item['available_qty'] = max(0, $item['on_hand_qty'] - $item['reserved_qty']);
            $item['available_area'] = max(0, $item['on_hand_area'] - $item['reserved_area']);
            $item['slabs_count'] = count($item['slabs']);

            if ($item['available_qty'] <= 0) {
                $item['status'] = 'OUT_OF_STOCK';
                $item['stock_status'] = 'Out of Stock';
                $lowStockCount++;
            } else {
                $item['status'] = 'AVAILABLE';
                $item['stock_status'] = 'In Stock';
            }

            // Search filtering
            if ($search !== '') {
                $matchName = str_contains(strtolower($item['product_name']), $search);
                $matchSku = str_contains(strtolower($item['sku'] ?? ''), $search);
                $matchBarcode = str_contains(strtolower($item['barcode'] ?? ''), $search);
                $matchGtin = str_contains(strtolower($item['gtin'] ?? ''), $search);
                $matchBatch = str_contains(strtolower($item['batch_number'] ?? ''), $search);
                if (!$matchName && !$matchSku && !$matchBarcode && !$matchGtin && !$matchBatch) {
                    continue;
                }
            }

            // Status filtering
            if ($statusFilter === 'IN_STOCK' && $item['status'] !== 'In Stock') {
                continue;
            }
            if (($statusFilter === 'OUT_OF_STOCK' || $statusFilter === 'LOW_STOCK') && $item['status'] !== 'Out of Stock' && $item['status'] !== 'Low Stock') {
                continue;
            }

            $totalOnHand += $item['on_hand_qty'];
            $totalAvailable += $item['available_qty'];
            $totalReserved += $item['reserved_qty'];

            $stockItems[] = $item;
        }

        return response()->json([
            'success' => true,
            'summary_cards' => [
                'total_stock' => count($stockItems),
                'total_on_hand_qty' => $totalOnHand,
                'available_stock' => $totalAvailable,
                'reserved_stock' => $totalReserved,
                'low_stock_count' => $lowStockCount,
            ],
            'data' => $stockItems,
        ]);
    }

    /**
     * GET /api/inventory/form-data
     */
    public function getFormData(Request $request)
    {
        $orgId = $request->header('X-Organization-Id') ?? $request->user()?->organization_id;

        $warehouses = Warehouse::where('is_active', true)
            ->when($orgId, fn($q) => $q->where('organization_id', $orgId))
            ->orderBy('name')
            ->get();

        $categories = Category::orderBy('name')
            ->when($orgId, fn($q) => $q->where('organization_id', $orgId))
            ->get();

        $storageLocations = StorageLocation::orderBy('code')
            ->when($orgId, fn($q) => $q->where('organization_id', $orgId))
            ->get();

        $productVariants = Product::where('is_active', true)
            ->when($orgId, fn($q) => $q->where('organization_id', $orgId))
            ->with(['baseUnit', 'salesUnit', 'purchaseUnit', 'category', 'currentCommercialPricing'])
            ->orderBy('name')
            ->get();

        return response()->json([
            'success' => true,
            'warehouses' => $warehouses,
            'categories' => $categories,
            'storage_locations' => $storageLocations,
            'product_variants' => $productVariants,
        ]);
    }

    /**
     * GET /api/inventory/movements
     */
    public function getMovements(Request $request)
    {
        $orgId = $request->header('X-Organization-Id') ?? $request->user()?->organization_id;

        $query = InventoryMovement::with([
            'inventoryObject.variant.baseUnit',
            'fromWarehouse',
            'toWarehouse',
            'fromStorageLocation',
            'toStorageLocation',
            'user'
        ]);

        if ($orgId) {
            $query->where('organization_id', $orgId);
        }

        if ($request->filled('inventory_object_id')) {
            $query->where('inventory_object_id', $request->input('inventory_object_id'));
        }

        if ($request->filled('product_variant_id')) {
            $query->whereHas('inventoryObject', function ($q) use ($request) {
                $q->where('product_variant_id', $request->input('product_variant_id'));
            });
        }

        $movements = $query->orderBy('created_at', 'desc')->paginate($request->query('per_page', 25));

        $items = collect($movements->items())->map(function ($m) {
            $label = match ($m->movement_type) {
                'PURCHASE', 'RECEIPT' => 'Receipt',
                'SALE' => 'Sale',
                'TRANSFER' => 'Transfer',
                'RETURN' => 'Return',
                'ADJUSTMENT', 'COUNT_ADJUSTMENT' => 'Adjustment',
                'DAMAGE' => 'Damage',
                'RESERVATION' => 'Reservation',
                default => ucfirst(strtolower($m->movement_type)),
            };

            $referenceStr = '-';
            if ($m->reference_type && $m->reference_id) {
                $referenceStr = "{$m->reference_type} #{$m->reference_id}";
            }

            return [
                'id' => $m->id,
                'date' => $m->created_at ? $m->created_at->format('d M Y, H:i') : '-',
                'product_name' => $m->inventoryObject?->variant?->name ?? 'Unknown Product',
                'sku' => $m->inventoryObject?->variant?->sku ?? '-',
                'unit_symbol' => $m->inventoryObject?->variant?->baseUnit?->symbol ?? 'Units',
                'movement_type' => $m->movement_type,
                'movement_label' => $label,
                'quantity_delta' => (float) $m->quantity_delta,
                'area_delta' => (float) $m->area_delta,
                'from_warehouse' => $m->fromWarehouse?->name,
                'to_warehouse' => $m->toWarehouse?->name,
                'warehouse_name' => $m->toWarehouse?->name ?? $m->fromWarehouse?->name ?? 'Warehouse',
                'location_code' => $m->toStorageLocation?->code ?? $m->fromStorageLocation?->code ?? '-',
                'reference_type' => $m->reference_type,
                'reference_id' => $m->reference_id,
                'reference_label' => $referenceStr,
                'user_name' => $m->user?->name ?? 'System',
            ];
        });

        return response()->json([
            'success' => true,
            'data' => $items,
            'pagination' => [
                'current_page' => $movements->currentPage(),
                'last_page' => $movements->lastPage(),
                'per_page' => $movements->perPage(),
                'total' => $movements->total(),
            ]
        ]);
    }

    // 1. Reserves
    public function reserve(Request $request)
    {
        $validated = $request->validate([
            'inventory_object_id' => 'required|exists:inventory_objects,id',
            'quantity' => 'required|numeric|min:0.0001',
            'area' => 'nullable|numeric',
            'reservation_type' => 'required|string',
            'expires_at' => 'nullable|date'
        ]);

        $res = $this->reservationService->reserve(array_merge($validated, [
            'organization_id' => $request->header('X-Organization-Id', 1)
        ]));

        return response()->json(['success' => true, 'data' => $res]);
    }

    public function releaseReservation($id)
    {
        $this->reservationService->release($id);
        return response()->json(['success' => true, 'message' => 'Reservation successfully released.']);
    }

    // 2. Allocations
    public function allocate(Request $request)
    {
        $validated = $request->validate([
            'inventory_object_id' => 'required|exists:inventory_objects,id',
            'quantity' => 'required|numeric|min:0.0001',
            'area' => 'nullable|numeric',
            'reference_type' => 'nullable|string',
            'reference_id' => 'nullable|integer'
        ]);

        $alloc = $this->allocationService->allocate(array_merge($validated, [
            'organization_id' => $request->header('X-Organization-Id', 1)
        ]));

        return response()->json(['success' => true, 'data' => $alloc]);
    }

    public function completeAllocation($id)
    {
        $this->allocationService->complete($id);
        return response()->json(['success' => true, 'message' => 'Allocation completed, items dispatched.']);
    }

    // 3. Transfers
    public function initiateTransfer(Request $request)
    {
        $validated = $request->validate([
            'from_warehouse_id' => 'required|exists:warehouses,id',
            'to_warehouse_id' => 'required|exists:warehouses,id',
            'items' => 'required|array',
            'items.*.inventory_object_id' => 'required|exists:inventory_objects,id',
            'items.*.quantity' => 'required|numeric|min:0.0001'
        ]);

        $trf = $this->transferService->initiateTransfer(array_merge($validated, [
            'organization_id' => $request->header('X-Organization-Id', 1),
            'user_id' => $request->user()?->id ?? 1
        ]));

        return response()->json(['success' => true, 'data' => $trf]);
    }

    public function completeTransfer($id)
    {
        $this->transferService->completeTransfer($id);
        return response()->json(['success' => true, 'message' => 'Transfer items successfully received.']);
    }

    // 4. Adjustments
    public function initiateAdjustment(Request $request)
    {
        $validated = $request->validate([
            'warehouse_id' => 'required|exists:warehouses,id',
            'adjustment_type' => 'required|string',
            'reason' => 'nullable|string',
            'items' => 'required|array',
            'items.*.inventory_object_id' => 'required|exists:inventory_objects,id',
            'items.*.quantity_delta' => 'required|numeric',
            'items.*.area_delta' => 'nullable|numeric'
        ]);

        $adj = $this->adjustmentService->initiateAdjustment(array_merge($validated, [
            'organization_id' => $request->header('X-Organization-Id', 1),
            'user_id' => $request->user()?->id ?? 1
        ]));

        return response()->json(['success' => true, 'data' => $adj]);
    }

    public function approveAdjustment(Request $request, $id)
    {
        $approverId = $request->user()?->id ?? 1;
        $this->adjustmentService->approveAdjustment($id, $approverId);
        return response()->json(['success' => true, 'message' => 'Stock adjustment approved and posted.']);
    }

    // 5. Physical counts
    public function initiateCount(Request $request)
    {
        $validated = $request->validate([
            'warehouse_id' => 'required|exists:warehouses,id',
            'count_type' => 'required|string',
            'remarks' => 'nullable|string'
        ]);

        $cnt = $this->countService->initiateCount(array_merge($validated, [
            'organization_id' => $request->header('X-Organization-Id', 1),
            'user_id' => $request->user()?->id ?? 1
        ]));

        return response()->json(['success' => true, 'data' => $cnt]);
    }

    public function updateCountItem(Request $request, $itemId)
    {
        $validated = $request->validate([
            'counted_quantity' => 'required|numeric',
            'counted_area' => 'nullable|numeric'
        ]);

        $this->countService->updateCountQuantity($itemId, $validated['counted_quantity'], $validated['counted_area'] ?? 0);
        return response()->json(['success' => true, 'message' => 'Count item updated.']);
    }

    public function approveCount(Request $request, $id)
    {
        $approverId = $request->user()?->id ?? 1;
        $this->countService->approveCount($id, $approverId);
        return response()->json(['success' => true, 'message' => 'Physical stock count verified, variations adjusted.']);
    }

    // 6. Granite slabs cuts
    public function createSlab(Request $request)
    {
        $validated = $request->validate([
            'warehouse_id' => 'required|exists:warehouses,id',
            'product_variant_id' => 'required|exists:product_variants,id',
            'slab_code' => 'required|string',
            'length' => 'required|numeric',
            'width' => 'required|numeric',
            'thickness' => 'nullable|numeric',
            'area' => 'nullable|numeric',
            'finish' => 'nullable|string',
            'origin' => 'nullable|string'
        ]);

        $slab = $this->graniteService->createSlab(array_merge($validated, [
            'organization_id' => $request->header('X-Organization-Id', 1)
        ]));

        return response()->json(['success' => true, 'data' => $slab]);
    }

    public function cutSlab(Request $request, $id)
    {
        $validated = $request->validate([
            'cuts' => 'required|array',
            'cuts.*.length' => 'required|numeric',
            'cuts.*.width' => 'required|numeric',
            'cuts.*.area' => 'required|numeric'
        ]);

        $result = $this->graniteService->cutSlab($id, $validated['cuts']);
        return response()->json(['success' => true, 'data' => $result]);
    }

    // 7. Valuation
    public function getValuation(Request $request, $id)
    {
        $method = $request->query('method', 'SPECIFIC_ID');
        $val = $this->valuationService->calculateValuation($id, $method);
        return response()->json(['success' => true, 'data' => $val]);
    }
}
