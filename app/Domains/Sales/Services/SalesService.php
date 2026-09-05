<?php

namespace App\Domains\Sales\Services;

use App\Domains\Sales\Models\Invoice;
use App\Domains\Sales\Models\InvoiceItem;
use App\Domains\Sales\Models\Dispatch;
use App\Domains\Sales\Models\DispatchItem;
use App\Domains\Sales\Models\SalesOrder;
use App\Domains\Sales\Models\Quotation;
use App\Domains\Master\Models\Customer;
use App\Domains\Master\Models\Warehouse;
use App\Domains\Master\Models\Unit;
use App\Domains\Master\Models\Organization;
use App\Domains\Product\Models\Product;
use App\Domains\Inventory\Models\InventoryObject;
use App\Domains\Inventory\Models\InventoryMovement;
use App\Domains\Inventory\Services\InventoryService;
use App\Domains\Accounting\Services\PostingService;
use App\Domains\Accounting\Models\Account;
use App\Domains\Accounting\Models\AccountGroup;
use App\Domains\Product\Services\TileDimensionService;
use Illuminate\Support\Facades\DB;
use Exception;

class SalesService
{
    public function __construct(
        protected InventoryService $inventoryService,
        protected PostingService $postingService
    ) {}

    /**
     * Get data required for Sales forms (customers, warehouses, units, products with stock).
     */
    public function getSalesFormData(int $organizationId): array
    {
        $customers = Customer::where('organization_id', $organizationId)
            ->where('is_active', true)
            ->get();

        $warehouses = Warehouse::where('organization_id', $organizationId)
            ->where('is_active', true)
            ->get();

        $units = Unit::all();

        $organization = Organization::find($organizationId);

        // Fetch products with attribute values and pricings
        $products = Product::where('organization_id', $organizationId)
            ->where('is_active', true)
            ->with(['taxProfile', 'baseUnit', 'category.parent', 'attributeValues.attribute', 'pricings'])
            ->get();

        // Calculate available stock per warehouse for each product variant
        $productsData = $products->map(function ($product) use ($organizationId) {
            $stockByWarehouse = DB::table('inventory_objects')
                ->where('organization_id', $organizationId)
                ->where('product_variant_id', $product->id)
                ->where('status', 'AVAILABLE')
                ->select('warehouse_id', DB::raw('SUM(quantity) as total_qty'), DB::raw('SUM(area) as total_area'), DB::raw('COUNT(id) as slab_count'))
                ->groupBy('warehouse_id')
                ->get()
                ->keyBy('warehouse_id');

            // For slab products, fetch individual available slabs
            $availableSlabs = [];
            if ($product->inventory_behavior === 'SLAB') {
                $availableSlabs = InventoryObject::where('organization_id', $organizationId)
                    ->where('product_variant_id', $product->id)
                    ->where('status', 'AVAILABLE')
                    ->with('slabDetail')
                    ->get()
                    ->map(function ($obj) {
                        return [
                            'id' => $obj->id,
                            'warehouse_id' => $obj->warehouse_id,
                            'object_code' => $obj->object_code,
                            'length' => $obj->slabDetail->length ?? 0,
                            'width' => $obj->slabDetail->width ?? 0,
                            'thickness' => $obj->slabDetail->thickness ?? 0,
                            'area' => $obj->area,
                            'finish' => $obj->slabDetail->finish ?? '',
                            'batch_number' => $obj->batch_number,
                        ];
                    });
            }

            // Extract dimension and packaging attributes
            $piecesPerBox = $product->pieces_per_box;
            $length = null;
            $width = null;
            $dimUnit = 'mm';

            if (!empty($product->attributeValues)) {
                foreach ($product->attributeValues as $av) {
                    $slug = strtolower($av->attribute->slug ?? $av->attribute->name ?? '');
                    $val = trim($av->value ?? '');

                    if (in_array($slug, ['pieces_per_box', 'pieces-per-box', 'box_pieces', 'pieces'])) {
                        if (!$piecesPerBox && is_numeric($val)) {
                            $piecesPerBox = (int) $val;
                        }
                    }
                    if (in_array($slug, ['length', 'tile_length', 'l'])) {
                        if (is_numeric($val)) $length = (float) $val;
                    }
                    if (in_array($slug, ['width', 'tile_width', 'w'])) {
                        if (is_numeric($val)) $width = (float) $val;
                    }
                    if (in_array($slug, ['dimension_unit', 'unit_symbol', 'size_unit'])) {
                        if ($val) $dimUnit = $val;
                    }
                }
            }

            $currentPricing = $product->currentCommercialPricing
                ?? $product->pricings->where('is_current', true)->first()
                ?? $product->pricings->first();

            if (!$piecesPerBox && $currentPricing && $currentPricing->pieces_per_box) {
                $piecesPerBox = $currentPricing->pieces_per_box;
            }
            $piecesPerBox = $piecesPerBox ?: 1;

            $sqftPerPiece = 0.0;
            $sqftPerBox = 0.0;

            if ($length && $width) {
                $dimInfo = TileDimensionService::normalizeDimensions($length, $width, $dimUnit);
                $sqftPerPiece = $dimInfo['coverage_area_sqft'];
                $sqftPerBox = round($sqftPerPiece * $piecesPerBox, 4);
            }

            return [
                'id' => $product->id,
                'name' => $product->name,
                'sku' => $product->sku,
                'inventory_behavior' => $product->inventory_behavior,
                'base_unit_id' => $product->base_unit_id,
                'base_unit_name' => $product->baseUnit->name ?? 'PCS',
                'base_unit_symbol' => $product->baseUnit->symbol ?? 'PCS',
                'pieces_per_box' => $piecesPerBox,
                'sqft_per_piece' => $sqftPerPiece,
                'sqft_per_box' => $sqftPerBox,
                'tax_rate' => $product->taxProfile->rate ?? 18.00,
                'category_name' => $product->category->name ?? '',
                'current_pricing' => $currentPricing ? [
                    'cost_price' => (float) ($currentPricing->cost_price ?? 0),
                    'selling_price' => (float) ($currentPricing->selling_price ?? 0),
                    'price_basis' => strtoupper($currentPricing->price_basis ?? 'PCS'),
                    'pieces_per_box' => $currentPricing->pieces_per_box ?? $piecesPerBox,
                ] : null,
                'pricings' => $product->pricings,
                'stock_by_warehouse' => $stockByWarehouse,
                'available_slabs' => $availableSlabs,
                'attribute_values' => $product->attributeValues,
            ];
        });

        return [
            'customers' => $customers,
            'warehouses' => $warehouses,
            'units' => $units,
            'organization' => $organization,
            'products' => $productsData,
        ];
    }

    /**
     * Create a Direct Counter Sale (Invoice + Dispatch + Payment + Accounting).
     */
    public function createDirectSale(array $data, int $organizationId): Invoice
    {
        return DB::transaction(function () use ($data, $organizationId) {
            $customerId = (int) $data['customer_id'];
            $warehouseId = (int) $data['warehouse_id'];
            $invoiceDate = $data['invoice_date'] ?? date('Y-m-d');
            $paymentMethod = $data['payment_method'] ?? 'CASH';
            $paidAmount = isset($data['paid_amount']) ? (float) $data['paid_amount'] : 0.0;
            $itemsData = $data['items'] ?? [];

            if (empty($itemsData)) {
                throw new Exception("Sales invoice must contain at least one line item.");
            }

            $customer = Customer::where('organization_id', $organizationId)->findOrFail($customerId);
            $warehouse = Warehouse::where('organization_id', $organizationId)->findOrFail($warehouseId);
            $organization = Organization::findOrFail($organizationId);

            // Determine Tax Split (Intra-state vs Inter-state)
            $customerState = trim(strtolower($customer->state ?? ''));
            $orgState = trim(strtolower($organization->state ?? ''));
            $isInterState = (!empty($customerState) && !empty($orgState) && $customerState !== $orgState);

            // Calculate Item Level Details & Validate Stock
            $totalSubtotal = 0.0;
            $totalDiscount = 0.0;
            $totalTaxable = 0.0;
            $totalCGST = 0.0;
            $totalSGST = 0.0;
            $totalIGST = 0.0;
            $totalTax = 0.0;
            $totalInvoiceAmount = 0.0;

            $processedItems = [];
            $stockDeductionTasks = [];

            foreach ($itemsData as $item) {
                $variantId = (int) $item['product_variant_id'];
                $variant = Product::where('organization_id', $organizationId)->with('taxProfile')->findOrFail($variantId);
                $unitId = isset($item['unit_id']) ? (int) $item['unit_id'] : $variant->base_unit_id;
                $priceBasis = $item['price_basis'] ?? 'PCS';
                $quantity = (float) $item['quantity'];
                $unitPrice = (float) $item['unit_price'];
                $discountAmount = isset($item['discount_amount']) ? (float) $item['discount_amount'] : 0.0;
                $taxRate = (float) ($variant->taxProfile->rate ?? 18.00);

                if ($quantity <= 0) {
                    throw new Exception("Quantity must be greater than zero for product: {$variant->name}");
                }

                // Inventory Stock Check
                if ($variant->inventory_behavior === 'SLAB') {
                    $slabIds = $item['slab_ids'] ?? [];
                    if (count($slabIds) !== (int) $quantity) {
                        throw new Exception("Slab selection count (" . count($slabIds) . ") must match quantity ({$quantity}) for slab product: {$variant->name}");
                    }

                    $slabs = InventoryObject::where('organization_id', $organizationId)
                        ->where('warehouse_id', $warehouseId)
                        ->where('status', 'AVAILABLE')
                        ->whereIn('id', $slabIds)
                        ->get();

                    if ($slabs->count() !== count($slabIds)) {
                        throw new Exception("One or more selected slabs for {$variant->name} are no longer available in the selected warehouse.");
                    }

                    $stockDeductionTasks[] = [
                        'behavior' => 'SLAB',
                        'variant' => $variant,
                        'slabs' => $slabs,
                    ];
                } else {
                    // Convert selling qty to base unit for stock deduction
                    $baseUnitQty = $this->inventoryService->convertQuantity($quantity, $unitId, $variant->base_unit_id, $variant->id, $organizationId);

                    // Check total available bulk stock in warehouse
                    $totalAvailableStock = DB::table('inventory_objects')
                        ->where('organization_id', $organizationId)
                        ->where('product_variant_id', $variant->id)
                        ->where('warehouse_id', $warehouseId)
                        ->where('status', 'AVAILABLE')
                        ->sum('quantity');

                    if ((float)$totalAvailableStock < $baseUnitQty) {
                        throw new Exception("Insufficient stock for product {$variant->name} in selected warehouse. Available: {$totalAvailableStock}, Requested: {$baseUnitQty}");
                    }

                    $stockDeductionTasks[] = [
                        'behavior' => 'BULK',
                        'variant' => $variant,
                        'unit_id' => $unitId,
                        'quantity' => $quantity,
                        'base_quantity' => $baseUnitQty,
                    ];
                }

                // Amount calculations
                $lineGross = $quantity * $unitPrice;
                $lineTaxable = max(0, $lineGross - $discountAmount);

                $cgstRate = 0.0;
                $cgstAmount = 0.0;
                $sgstRate = 0.0;
                $sgstAmount = 0.0;
                $igstRate = 0.0;
                $igstAmount = 0.0;

                if ($isInterState) {
                    $igstRate = $taxRate;
                    $igstAmount = round($lineTaxable * ($igstRate / 100.0), 4);
                    $lineTax = $igstAmount;
                } else {
                    $cgstRate = round($taxRate / 2.0, 2);
                    $sgstRate = round($taxRate / 2.0, 2);
                    $cgstAmount = round($lineTaxable * ($cgstRate / 100.0), 4);
                    $sgstAmount = round($lineTaxable * ($sgstRate / 100.0), 4);
                    $lineTax = $cgstAmount + $sgstAmount;
                }

                $lineSubtotal = $lineTaxable + $lineTax;

                $totalSubtotal += $lineGross;
                $totalDiscount += $discountAmount;
                $totalTaxable += $lineTaxable;
                $totalCGST += $cgstAmount;
                $totalSGST += $sgstAmount;
                $totalIGST += $igstAmount;
                $totalTax += $lineTax;
                $totalInvoiceAmount += $lineSubtotal;

                $processedItems[] = [
                    'product_variant_id' => $variant->id,
                    'unit_id' => $unitId,
                    'price_basis' => $priceBasis,
                    'quantity' => $quantity,
                    'unit_price' => $unitPrice,
                    'discount_amount' => $discountAmount,
                    'taxable_amount' => $lineTaxable,
                    'tax_rate' => $taxRate,
                    'cgst_rate' => $cgstRate,
                    'cgst_amount' => $cgstAmount,
                    'sgst_rate' => $sgstRate,
                    'sgst_amount' => $sgstAmount,
                    'igst_rate' => $igstRate,
                    'igst_amount' => $igstAmount,
                    'tax_amount' => $lineTax,
                    'subtotal' => $lineSubtotal,
                    'product_name_snapshot' => $variant->name,
                    'sku_snapshot' => $variant->sku,
                    'variant_specs_snapshot' => [
                        'inventory_behavior' => $variant->inventory_behavior,
                        'pieces_per_box' => $variant->pieces_per_box,
                        'sqft_per_box' => $variant->sqft_per_box,
                    ],
                ];
            }

            $dueAmount = max(0, $totalInvoiceAmount - $paidAmount);
            $paymentStatus = 'UNPAID';
            if ($paidAmount >= $totalInvoiceAmount) {
                $paymentStatus = 'PAID';
                $dueAmount = 0.0;
            } elseif ($paidAmount > 0) {
                $paymentStatus = 'PARTIALLY_PAID';
            }

            // Generate unique numbers
            $invSeq = DB::table('invoices')->where('organization_id', $organizationId)->count() + 1;
            $invoiceNumber = 'INV-' . date('Ymd') . '-' . str_pad($invSeq, 4, '0', STR_PAD_LEFT);
            $dispatchNumber = 'DSP-' . date('Ymd') . '-' . str_pad($invSeq, 4, '0', STR_PAD_LEFT);

            // Create Invoice
            $invoice = Invoice::create([
                'organization_id' => $organizationId,
                'customer_id' => $customerId,
                'warehouse_id' => $warehouseId,
                'invoice_number' => $invoiceNumber,
                'invoice_date' => $invoiceDate,
                'subtotal' => $totalSubtotal,
                'discount_amount' => $totalDiscount,
                'taxable_amount' => $totalTaxable,
                'tax_amount' => $totalTax,
                'cgst_amount' => $totalCGST,
                'sgst_amount' => $totalSGST,
                'igst_amount' => $totalIGST,
                'total_amount' => $totalInvoiceAmount,
                'paid_amount' => $paidAmount,
                'due_amount' => $dueAmount,
                'status' => 'APPROVED',
                'payment_status' => $paymentStatus,
                'payment_method' => $paymentMethod,
                'notes' => $data['notes'] ?? null,
                'billing_address' => $data['billing_address'] ?? $customer->address,
                'shipping_address' => $data['shipping_address'] ?? $customer->address,
                'is_direct_sale' => true,
            ]);

            // Create Invoice Items
            foreach ($processedItems as $itemRow) {
                $itemRow['organization_id'] = $organizationId;
                $invoice->items()->create($itemRow);
            }

            // Create Physical Dispatch Record & Execute Stock Deduction
            $dispatch = Dispatch::create([
                'organization_id' => $organizationId,
                'warehouse_id' => $warehouseId,
                'invoice_id' => $invoice->id,
                'dispatch_number' => $dispatchNumber,
                'dispatch_date' => $invoiceDate,
                'status' => 'DELIVERED',
                'remarks' => "Direct Sale Invoice #{$invoiceNumber}",
            ]);

            foreach ($stockDeductionTasks as $task) {
                if ($task['behavior'] === 'SLAB') {
                    foreach ($task['slabs'] as $slab) {
                        $slab->status = 'DISPATCHED';
                        $slab->save();

                        DispatchItem::create([
                            'organization_id' => $organizationId,
                            'dispatch_id' => $dispatch->id,
                            'product_variant_id' => $task['variant']->id,
                            'quantity' => 1.0,
                            'unit_id' => $task['variant']->base_unit_id,
                        ]);

                        InventoryMovement::create([
                            'organization_id' => $organizationId,
                            'inventory_object_id' => $slab->id,
                            'movement_type' => 'SALE',
                            'quantity_delta' => -1.0,
                            'area_delta' => -$slab->area,
                            'from_warehouse_id' => $warehouseId,
                            'reference_type' => 'Invoice',
                            'reference_id' => $invoice->id,
                        ]);
                    }
                } else {
                    $remainingQtyToDeduct = $task['base_quantity'];

                    $availableObjects = InventoryObject::where('organization_id', $organizationId)
                        ->where('product_variant_id', $task['variant']->id)
                        ->where('warehouse_id', $warehouseId)
                        ->where('status', 'AVAILABLE')
                        ->orderBy('id', 'asc')
                        ->get();

                    foreach ($availableObjects as $obj) {
                        if ($remainingQtyToDeduct <= 0) break;

                        $deduct = min((float)$obj->quantity, $remainingQtyToDeduct);
                        $areaDeduct = $this->inventoryService->getAreaForQuantity($deduct, $task['variant']->base_unit_id, $task['variant']->id, $organizationId);

                        $obj->quantity = max(0, (float)$obj->quantity - $deduct);
                        $obj->area = max(0, (float)$obj->area - $areaDeduct);
                        if ($obj->quantity <= 0) {
                            $obj->status = 'DISPATCHED';
                        }
                        $obj->save();

                        $remainingQtyToDeduct -= $deduct;

                        InventoryMovement::create([
                            'organization_id' => $organizationId,
                            'inventory_object_id' => $obj->id,
                            'movement_type' => 'SALE',
                            'quantity_delta' => -$deduct,
                            'area_delta' => -$areaDeduct,
                            'from_warehouse_id' => $warehouseId,
                            'reference_type' => 'Invoice',
                            'reference_id' => $invoice->id,
                        ]);
                    }

                    DispatchItem::create([
                        'organization_id' => $organizationId,
                        'dispatch_id' => $dispatch->id,
                        'product_variant_id' => $task['variant']->id,
                        'quantity' => $task['quantity'],
                        'unit_id' => $task['unit_id'],
                    ]);
                }
            }

            // Post Accounting Journal Entries via PostingService
            $customerAccount = $this->resolveAccount($organizationId, 'CUST-' . $customer->id, $customer->name, 'ASSET', 'Accounts Receivable');
            $salesAccount = $this->resolveAccount($organizationId, 'REV-SALES-01', 'Sales Income A/c', 'INCOME', 'Direct Income');
            $gstOutputAccount = $this->resolveAccount($organizationId, 'DUTY-GST-OUT-01', 'Output GST A/c', 'LIABILITY', 'Duties and Taxes');

            $this->postingService->postSales(
                $organizationId,
                1,
                (float) $totalInvoiceAmount,
                $customerAccount->id,
                $salesAccount->id,
                $gstOutputAccount->id,
                (float) $totalTax,
                $invoiceNumber,
                $invoiceDate
            );

            // Post Customer Receipt Entry if payment received
            if ($paidAmount > 0) {
                $paymentAccCode = ($paymentMethod === 'CASH') ? 'CASH-01' : 'BANK-01';
                $paymentAccName = ($paymentMethod === 'CASH') ? 'Cash in Hand' : 'Main Bank Account';
                $paymentAccount = $this->resolveAccount($organizationId, $paymentAccCode, $paymentAccName, 'ASSET', 'Bank Accounts');

                $this->postingService->postReceipt(
                    $organizationId,
                    1,
                    $paidAmount,
                    $paymentAccount->id,
                    $customerAccount->id,
                    'RCP-' . $invoiceNumber,
                    $invoiceDate
                );
            }

            return $invoice->load(['customer', 'warehouse', 'items.unit', 'items.variant', 'dispatches']);
        });
    }

    /**
     * Helper to resolve or create GL Accounts
     */
    protected function resolveAccount(int $organizationId, string $code, string $name, string $groupType, string $groupName): Account
    {
        $account = Account::where('organization_id', $organizationId)
            ->where(function ($q) use ($code, $name) {
                $q->where('code', $code)->orWhere('name', $name);
            })->first();

        if (!$account) {
            $group = AccountGroup::firstOrCreate([
                'organization_id' => $organizationId,
                'type' => $groupType,
            ], [
                'name' => $groupName,
                'code' => strtoupper(substr($groupName, 0, 3)) . '-01',
            ]);

            $account = Account::create([
                'organization_id' => $organizationId,
                'account_group_id' => $group->id,
                'code' => $code,
                'name' => $name,
                'currency' => 'INR',
            ]);
        }

        return $account;
    }

    /**
     * List paginated invoices with filters
     */
    public function listInvoices(int $organizationId, array $filters = []): \Illuminate\Contracts\Pagination\LengthAwarePaginator
    {
        $query = Invoice::where('organization_id', $organizationId)
            ->with(['customer', 'warehouse']);

        if (!empty($filters['status'])) {
            $query->where('status', $filters['status']);
        }

        if (!empty($filters['payment_status'])) {
            $query->where('payment_status', $filters['payment_status']);
        }

        if (!empty($filters['search'])) {
            $search = $filters['search'];
            $query->where(function ($q) use ($search) {
                $q->where('invoice_number', 'like', "%{$search}%")
                    ->orWhereHas('customer', function ($cq) use ($search) {
                        $cq->where('name', 'like', "%{$search}%")
                            ->orWhere('phone', 'like', "%{$search}%");
                    });
            });
        }

        return $query->orderBy('id', 'desc')->paginate($filters['per_page'] ?? 15);
    }

    /**
     * Get single invoice details with relationships
     */
    public function getInvoiceDetails(int $invoiceId, int $organizationId): Invoice
    {
        return Invoice::where('organization_id', $organizationId)
            ->with(['customer', 'warehouse', 'items.unit', 'items.variant.taxProfile', 'dispatches.items'])
            ->findOrFail($invoiceId);
    }
}
