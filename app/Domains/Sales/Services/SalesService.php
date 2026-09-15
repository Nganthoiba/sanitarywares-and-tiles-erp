<?php

namespace App\Domains\Sales\Services;

use App\Domains\Sales\Models\Invoice;
use App\Domains\Sales\Models\InvoiceItem;
use App\Domains\Sales\Models\Dispatch;
use App\Domains\Sales\Models\DispatchItem;
use App\Domains\Sales\Models\SalesOrder;
use App\Domains\Sales\Models\Quotation;
use App\Domains\Sales\Models\SalesReturn;
use App\Domains\Sales\Models\SalesReturnItem;
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

use App\Domains\Inventory\Services\ReservationService;
use App\Domains\Inventory\Services\ValuationService;
use App\Domains\Master\Services\DocumentNumberService;

class SalesService
{
    protected DocumentNumberService $documentNumberService;

    public function __construct(
        protected InventoryService $inventoryService,
        protected PostingService $postingService,
        protected ?ReservationService $reservationService = null,
        protected ?ValuationService $valuationService = null,
        ?DocumentNumberService $documentNumberService = null
    ) {
        $this->reservationService = $reservationService ?? new ReservationService();
        $this->valuationService = $valuationService ?? new ValuationService();
        $this->documentNumberService = $documentNumberService ?? new DocumentNumberService();
    }

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

            // Determine Tax & GST Parameters
            $placeOfSupplyState = $data['place_of_supply_state'] ?? $customer->state ?? $organization->state ?? 'Manipur';
            $supplierGstin = $data['supplier_gstin'] ?? $organization->gstin ?? null;
            $customerGstin = $data['customer_gstin'] ?? $customer->gstin ?? null;
            $gstRegistrationType = $data['gst_registration_type'] ?? $customer->gst_registration_type ?? (!empty($customerGstin) ? 'REGISTERED_REGULAR' : 'UNREGISTERED');
            $invoiceType = $data['invoice_type'] ?? 'REGULAR';
            $isReverseCharge = (bool) ($data['is_reverse_charge'] ?? false);
            $isTaxInclusive = (bool) ($data['is_tax_inclusive'] ?? true);

            $customerState = trim(strtolower($customer->state ?? ''));
            $posState = trim(strtolower($placeOfSupplyState));
            $orgState = trim(strtolower($organization->state ?? ''));
            $isInterState = isset($data['is_inter_state']) ? (bool) $data['is_inter_state'] : (!empty($posState) && !empty($orgState) && $posState !== $orgState);
            $supplyType = $isInterState ? 'INTER_STATE' : 'INTRA_STATE';

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

                $taxCategory = $item['tax_category'] ?? 'TAXABLE';
                $itemTaxInclusive = isset($item['is_tax_inclusive']) ? (bool) $item['is_tax_inclusive'] : $isTaxInclusive;
                $hsnSacCode = $item['hsn_sac_code'] ?? $variant->taxProfile->hsn_code ?? $variant->sku;

                if (in_array($taxCategory, ['EXEMPT', 'NIL_RATED', 'NON_GST'])) {
                    $taxRate = 0.0;
                } else {
                    $taxRate = isset($item['tax_rate']) ? (float) $item['tax_rate'] : (float) ($variant->taxProfile->rate ?? 18.00);
                }

                if ($quantity <= 0) {
                    throw new Exception("Quantity must be greater than zero for product: {$variant->name}");
                }

                // Inventory Stock Check with Concurrency Protection (lockForUpdate)
                if ($variant->inventory_behavior === 'SLAB') {
                    $slabIds = $item['slab_ids'] ?? [];
                    if (count($slabIds) !== (int) $quantity) {
                        throw new Exception("Slab selection count (" . count($slabIds) . ") must match quantity ({$quantity}) for slab product: {$variant->name}");
                    }

                    $slabs = InventoryObject::where('organization_id', $organizationId)
                        ->where('warehouse_id', $warehouseId)
                        ->where('status', 'AVAILABLE')
                        ->whereIn('id', $slabIds)
                        ->lockForUpdate()
                        ->get();

                    if ($slabs->count() !== count($slabIds)) {
                        throw new Exception("One or more selected slabs are no longer available in warehouse.");
                    }

                    $stockDeductionTasks[] = [
                        'behavior' => 'SLAB',
                        'variant' => $variant,
                        'slabs' => $slabs,
                    ];
                } else {
                    $convFactor = 1.0;
                    if ($unitId !== $variant->base_unit_id) {
                        $conversion = \App\Domains\Master\Models\UnitConversion::where('product_variant_id', $variant->id)
                            ->where('from_unit_id', $unitId)
                            ->where('to_unit_id', $variant->base_unit_id)
                            ->first();
                        if ($conversion) {
                            $convFactor = (float) $conversion->factor;
                        }
                    }
                    $baseUnitQty = $quantity * $convFactor;

                    // Lock & calculate total available bulk stock in warehouse atomically
                    $availableObjects = InventoryObject::where('organization_id', $organizationId)
                        ->where('product_variant_id', $variant->id)
                        ->where('warehouse_id', $warehouseId)
                        ->where('status', 'AVAILABLE')
                        ->where('quantity', '>', 0)
                        ->orderBy('id', 'asc')
                        ->lockForUpdate()
                        ->get();

                    $totalAvailableStock = $availableObjects->sum('quantity');

                    if ((float)$totalAvailableStock < $baseUnitQty) {
                        throw new Exception("Insufficient stock for product {$variant->name} in selected warehouse. Available: {$totalAvailableStock}, Requested: {$baseUnitQty}");
                    }

                    $stockDeductionTasks[] = [
                        'behavior' => 'BULK',
                        'variant' => $variant,
                        'unit_id' => $unitId,
                        'quantity' => $quantity,
                        'base_quantity' => $baseUnitQty,
                        'objects' => $availableObjects,
                    ];
                }

                // Amount & GST Tax Calculations
                $lineGross = $quantity * $unitPrice;
                $lineGrossAfterDiscount = max(0, $lineGross - $discountAmount);

                $cgstRate = 0.0;
                $cgstAmount = 0.0;
                $sgstRate = 0.0;
                $sgstAmount = 0.0;
                $igstRate = 0.0;
                $igstAmount = 0.0;
                $lineTaxable = $lineGrossAfterDiscount;
                $lineTax = 0.0;

                if ($taxRate > 0) {
                    if ($itemTaxInclusive) {
                        $lineTaxable = round($lineGrossAfterDiscount / (1 + ($taxRate / 100.0)), 4);
                        $lineTax = $lineGrossAfterDiscount - $lineTaxable;
                        $lineSubtotal = $lineGrossAfterDiscount;
                    } else {
                        $lineTaxable = $lineGrossAfterDiscount;
                        $lineTax = round($lineTaxable * ($taxRate / 100.0), 4);
                        $lineSubtotal = $lineTaxable + $lineTax;
                    }

                    if ($isInterState) {
                        $igstRate = $taxRate;
                        $igstAmount = round($lineTax, 4);
                    } else {
                        $cgstRate = round($taxRate / 2.0, 2);
                        $sgstRate = round($taxRate / 2.0, 2);
                        $cgstAmount = round($lineTax / 2.0, 4);
                        $sgstAmount = round($lineTax / 2.0, 4);
                    }
                } else {
                    $lineSubtotal = $lineGrossAfterDiscount;
                }

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
                    'hsn_sac_code' => $hsnSacCode,
                    'tax_category' => $taxCategory,
                    'is_tax_inclusive' => $itemTaxInclusive,
                    'product_name_snapshot' => $variant->name,
                    'sku_snapshot' => $variant->sku,
                    'variant_specs_snapshot' => [
                        'inventory_behavior' => $variant->inventory_behavior,
                        'pieces_per_box' => $variant->pieces_per_box,
                        'sqft_per_box' => $variant->sqft_per_box,
                    ],
                ];
            }

            $overallDiscount = isset($data['total_discount_amount']) ? (float) $data['total_discount_amount'] : (isset($data['discount_amount']) ? (float) $data['discount_amount'] : 0.0);
            $finalDiscount = $totalDiscount + $overallDiscount;
            $unroundedTotal = max(0, $totalInvoiceAmount - $overallDiscount);

            $roundedTotal = round($unroundedTotal);
            $roundOffAmount = round($roundedTotal - $unroundedTotal, 4);
            $finalGrandTotal = $roundedTotal;

            if (round($paidAmount, 2) > round($finalGrandTotal, 2)) {
                throw new Exception("Amount paid (₹" . number_format($paidAmount, 2) . ") cannot be greater than the grand total amount (₹" . number_format($finalGrandTotal, 2) . ").");
            }

            $dueAmount = max(0, $finalGrandTotal - $paidAmount);
            $paymentStatus = 'UNPAID';
            if ($paidAmount >= $finalGrandTotal) {
                $paymentStatus = 'PAID';
                $dueAmount = 0.0;
            } elseif ($paidAmount > 0) {
                $paymentStatus = 'PARTIALLY_PAID';
            }

            // Generate concurrency-safe FY-integrated document numbers
            $invoiceNumber = $this->documentNumberService->generateNextNumber($organizationId, 'INV', $invoiceDate);
            $dispatchNumber = $this->documentNumberService->generateNextNumber($organizationId, 'DSP', $invoiceDate);

            // Create Invoice
            $invoice = Invoice::create([
                'organization_id' => $organizationId,
                'customer_id' => $customerId,
                'warehouse_id' => $warehouseId,
                'invoice_number' => $invoiceNumber,
                'invoice_date' => $invoiceDate,
                'subtotal' => $totalSubtotal,
                'discount_amount' => $finalDiscount,
                'taxable_amount' => max(0, $totalTaxable - $overallDiscount),
                'tax_amount' => $totalTax,
                'cgst_amount' => $totalCGST,
                'sgst_amount' => $totalSGST,
                'igst_amount' => $totalIGST,
                'total_amount' => $finalGrandTotal,
                'round_off_amount' => $roundOffAmount,
                'paid_amount' => $paidAmount,
                'due_amount' => $dueAmount,
                'status' => 'APPROVED',
                'payment_status' => $paymentStatus,
                'payment_method' => $paymentMethod,
                'notes' => $data['notes'] ?? null,
                'billing_address' => $data['billing_address'] ?? $customer->address,
                'shipping_address' => $data['shipping_address'] ?? $customer->address,
                'supplier_gstin' => $supplierGstin,
                'customer_gstin' => $customerGstin,
                'place_of_supply_state' => $placeOfSupplyState,
                'gst_registration_type' => $gstRegistrationType,
                'supply_type' => $supplyType,
                'invoice_type' => $invoiceType,
                'is_reverse_charge' => $isReverseCharge,
                'is_tax_inclusive' => $isTaxInclusive,
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
                    $availableObjects = $task['objects'] ?? InventoryObject::where('organization_id', $organizationId)
                        ->where('product_variant_id', $task['variant']->id)
                        ->where('warehouse_id', $warehouseId)
                        ->where('status', 'AVAILABLE')
                        ->where('quantity', '>', 0)
                        ->orderBy('id', 'asc')
                        ->lockForUpdate()
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

            // Consume active customer reservations for the sold products
            foreach ($processedItems as $procItem) {
                $vId = $procItem['product_variant_id'];
                $soldQty = $procItem['quantity'];

                $resQuery = \App\Domains\Inventory\Models\InventoryReservation::where('organization_id', $organizationId)
                    ->where('product_variant_id', $vId)
                    ->where('warehouse_id', $warehouseId)
                    ->whereIn('status', ['ACTIVE', 'PENDING', 'PARTIALLY_FULFILLED']);

                if ($customerId) {
                    $resQuery->where('customer_id', $customerId);
                }

                $activeRes = $resQuery->orderBy('created_at', 'asc')->get();
                $qtyToFulfill = $soldQty;

                foreach ($activeRes as $res) {
                    if ($qtyToFulfill <= 0) break;
                    $rem = $res->remaining_quantity;
                    if ($rem <= 0) continue;

                    $take = min($rem, $qtyToFulfill);
                    $this->reservationService->fulfill($res->id, $take);
                    $qtyToFulfill -= $take;
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

                $rcpNumber = $this->documentNumberService->generateNextNumber($organizationId, 'RCP', $invoiceDate);
                $this->postingService->postReceipt(
                    $organizationId,
                    1,
                    $paidAmount,
                    $paymentAccount->id,
                    $customerAccount->id,
                    $rcpNumber,
                    $invoiceDate
                );
            }

            // Post Cost of Goods Sold (COGS) Entry
            $cogsAccount = $this->resolveAccount($organizationId, 'EXP-COGS-01', 'Cost of Goods Sold A/c', 'EXPENSE', 'Direct Expenses');
            $inventoryAssetAccount = $this->resolveAccount($organizationId, 'INV-01', 'Inventory Asset A/c', 'ASSET', 'Current Assets');

            $cogsAmount = 0.0;
            foreach ($stockDeductionTasks as $task) {
                $variant = $task['variant'];
                if ($task['behavior'] === 'SLAB') {
                    foreach ($task['slabs'] as $slab) {
                        $unitCost = $this->valuationService->getUnitCost($variant, $slab);
                        $cogsAmount += $unitCost;
                    }
                } else {
                    $unitCost = $this->valuationService->getUnitCost($variant);
                    $baseQty = (float) $task['base_quantity'];
                    $cogsAmount += $baseQty * $unitCost;
                }
            }

            if ($cogsAmount <= 0) {
                $cogsAmount = (float) $totalSubtotal * 0.70;
            }

            $this->postingService->postCOGS(
                $organizationId,
                $cogsAmount,
                $cogsAccount->id,
                $inventoryAssetAccount->id,
                $invoiceNumber,
                $invoiceDate,
                $invoice->id
            );

            return $invoice->load(['organization', 'customer', 'warehouse', 'items.unit', 'items.variant', 'dispatches']);
        });
    }

    /**
     * Helper to resolve or create GL Accounts
     */
    protected function resolveAccount(int $organizationId, string $code, string $name, string $groupType, string $groupName): Account
    {
        return $this->postingService->resolveOrCreateAccount($organizationId, $code, $name, $groupType, $groupName);
    }

    /**
     * List paginated invoices with filters
     */
    public function listInvoices(int $organizationId, array $filters = []): \Illuminate\Contracts\Pagination\LengthAwarePaginator
    {
        $query = Invoice::where('organization_id', $organizationId)
            ->with(['organization', 'customer', 'warehouse']);

        if (!empty($filters['status'])) {
            $query->where('status', $filters['status']);
        }

        if (!empty($filters['payment_status'])) {
            $query->where('payment_status', $filters['payment_status']);
        }

        $startDate = $filters['start_date'] ?? $filters['from_date'] ?? null;
        $endDate = $filters['end_date'] ?? $filters['to_date'] ?? null;

        if (!empty($startDate)) {
            $query->whereDate('invoice_date', '>=', $startDate);
        }

        if (!empty($endDate)) {
            $query->whereDate('invoice_date', '<=', $endDate);
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
            ->with(['organization', 'customer', 'warehouse', 'items.unit', 'items.variant.taxProfile', 'dispatches.items'])
            ->findOrFail($invoiceId);
    }

    // ==========================================
    // TRACK 1: FULL SALES WORKFLOW METHODS
    // ==========================================

    /**
     * Create a Quotation
     */
    public function createQuotation(array $data, int $organizationId): Quotation
    {
        return DB::transaction(function () use ($data, $organizationId) {
            $customerId = (int) $data['customer_id'];
            $branchId = isset($data['branch_id']) ? (int) $data['branch_id'] : null;
            $quotationDate = $data['quotation_date'] ?? date('Y-m-d');
            $expiryDate = $data['expiry_date'] ?? date('Y-m-d', strtotime('+30 days'));
            $remarks = $data['remarks'] ?? null;
            $items = $data['items'] ?? [];

            if (empty($items)) {
                throw new Exception("Quotation must contain at least one line item.");
            }

            $quotationNumber = $this->documentNumberService->generateNextNumber($organizationId, 'QTN', $quotationDate);

            $totalAmount = 0.0;
            $processedItems = [];

            foreach ($items as $item) {
                $variantId = (int) $item['product_variant_id'];
                $quantity = (float) $item['quantity'];
                $unitPrice = (float) $item['unit_price'];
                $unitId = isset($item['unit_id']) ? (int) $item['unit_id'] : null;
                $taxAmount = isset($item['tax_amount']) ? (float) $item['tax_amount'] : 0.0;
                $subtotal = ($quantity * $unitPrice) + $taxAmount;

                $totalAmount += $subtotal;
                $processedItems[] = [
                    'organization_id' => $organizationId,
                    'product_variant_id' => $variantId,
                    'quantity' => $quantity,
                    'unit_id' => $unitId,
                    'unit_price' => $unitPrice,
                    'tax_amount' => $taxAmount,
                    'subtotal' => $subtotal,
                ];
            }

            $quotation = Quotation::create([
                'organization_id' => $organizationId,
                'branch_id' => $branchId,
                'customer_id' => $customerId,
                'quotation_number' => $quotationNumber,
                'quotation_date' => $quotationDate,
                'expiry_date' => $expiryDate,
                'total_amount' => $totalAmount,
                'status' => 'DRAFT',
                'remarks' => $remarks,
            ]);

            foreach ($processedItems as $row) {
                $quotation->items()->create($row);
            }

            return $quotation->load(['customer', 'items.variant', 'items.unit']);
        });
    }

    /**
     * List Quotations
     */
    public function listQuotations(int $organizationId, array $filters = []): \Illuminate\Contracts\Pagination\LengthAwarePaginator
    {
        $query = Quotation::where('organization_id', $organizationId)->with(['customer', 'items.variant']);
        if (!empty($filters['status'])) {
            $query->where('status', $filters['status']);
        }
        return $query->orderBy('id', 'desc')->paginate($filters['per_page'] ?? 15);
    }

    /**
     * Create a Sales Order
     */
    public function createSalesOrder(array $data, int $organizationId): SalesOrder
    {
        return DB::transaction(function () use ($data, $organizationId) {
            $customerId = (int) $data['customer_id'];
            $branchId = isset($data['branch_id']) ? (int) $data['branch_id'] : null;
            $quotationId = isset($data['quotation_id']) ? (int) $data['quotation_id'] : null;
            $soDate = $data['so_date'] ?? date('Y-m-d');
            $remarks = $data['remarks'] ?? null;
            $items = $data['items'] ?? [];

            if (empty($items)) {
                throw new Exception("Sales order must contain at least one line item.");
            }

            $soNumber = $this->documentNumberService->generateNextNumber($organizationId, 'SO', $soDate);

            $totalAmount = 0.0;
            $processedItems = [];

            foreach ($items as $item) {
                $variantId = (int) $item['product_variant_id'];
                $quantity = (float) $item['quantity'];
                $unitPrice = (float) $item['unit_price'];
                $unitId = isset($item['unit_id']) ? (int) $item['unit_id'] : null;
                $taxAmount = isset($item['tax_amount']) ? (float) $item['tax_amount'] : 0.0;
                $subtotal = ($quantity * $unitPrice) + $taxAmount;

                $totalAmount += $subtotal;
                $processedItems[] = [
                    'organization_id' => $organizationId,
                    'product_variant_id' => $variantId,
                    'quantity' => $quantity,
                    'allocated_quantity' => 0.0,
                    'dispatched_quantity' => 0.0,
                    'unit_id' => $unitId,
                    'unit_price' => $unitPrice,
                    'tax_amount' => $taxAmount,
                    'subtotal' => $subtotal,
                ];
            }

            $so = SalesOrder::create([
                'organization_id' => $organizationId,
                'branch_id' => $branchId,
                'customer_id' => $customerId,
                'quotation_id' => $quotationId,
                'so_number' => $soNumber,
                'so_date' => $soDate,
                'total_amount' => $totalAmount,
                'status' => 'CONFIRMED',
                'remarks' => $remarks,
            ]);

            foreach ($processedItems as $row) {
                $so->items()->create($row);
            }

            if ($quotationId) {
                Quotation::where('organization_id', $organizationId)
                    ->where('id', $quotationId)
                    ->update(['status' => 'ACCEPTED']);
            }

            return $so->load(['customer', 'items.variant', 'items.unit']);
        });
    }

    /**
     * Convert Quotation to Sales Order
     */
    public function convertQuotationToSalesOrder(int $quotationId, int $organizationId): SalesOrder
    {
        $quotation = Quotation::where('organization_id', $organizationId)
            ->with('items')
            ->findOrFail($quotationId);

        $soData = [
            'customer_id' => $quotation->customer_id,
            'branch_id' => $quotation->branch_id,
            'quotation_id' => $quotation->id,
            'so_date' => date('Y-m-d'),
            'remarks' => "Converted from Quotation #{$quotation->quotation_number}",
            'items' => $quotation->items->map(function ($item) {
                return [
                    'product_variant_id' => $item->product_variant_id,
                    'quantity' => $item->quantity,
                    'unit_id' => $item->unit_id,
                    'unit_price' => $item->unit_price,
                    'tax_amount' => $item->tax_amount,
                ];
            })->toArray(),
        ];

        return $this->createSalesOrder($soData, $organizationId);
    }

    /**
     * List Sales Orders
     */
    public function listSalesOrders(int $organizationId, array $filters = []): \Illuminate\Contracts\Pagination\LengthAwarePaginator
    {
        $query = SalesOrder::where('organization_id', $organizationId)->with(['customer', 'items.variant', 'quotation']);
        if (!empty($filters['status'])) {
            $query->where('status', $filters['status']);
        }
        return $query->orderBy('id', 'desc')->paginate($filters['per_page'] ?? 15);
    }

    /**
     * Reserve Stock for Sales Order
     */
    public function reserveStockForSalesOrder(int $salesOrderId, int $warehouseId, int $organizationId): array
    {
        $so = SalesOrder::where('organization_id', $organizationId)
            ->with('items')
            ->findOrFail($salesOrderId);

        $reservations = [];
        foreach ($so->items as $item) {
            $res = $this->reservationService->reserve([
                'organization_id' => $organizationId,
                'customer_id' => $so->customer_id,
                'warehouse_id' => $warehouseId,
                'product_variant_id' => $item->product_variant_id,
                'unit_id' => $item->unit_id,
                'quantity' => $item->quantity,
                'source_type' => 'SalesOrder',
                'source_id' => $so->id,
                'notes' => "Reservation for Sales Order #{$so->so_number}",
            ]);

            $item->allocated_quantity = $item->quantity;
            $item->save();
            $reservations[] = $res;
        }

        $so->status = 'RESERVED';
        $so->save();

        return $reservations;
    }

    /**
     * Create Dispatch from Sales Order
     */
    public function createDispatchFromSalesOrder(array $data, int $organizationId): Dispatch
    {
        return DB::transaction(function () use ($data, $organizationId) {
            $salesOrderId = (int) $data['sales_order_id'];
            $warehouseId = (int) $data['warehouse_id'];
            $dispatchDate = $data['dispatch_date'] ?? date('Y-m-d');
            $remarks = $data['remarks'] ?? null;

            $so = SalesOrder::where('organization_id', $organizationId)
                ->with('items.variant')
                ->findOrFail($salesOrderId);

            $dispatchNumber = $this->documentNumberService->generateNextNumber($organizationId, 'DSP', $dispatchDate);

            $dispatch = Dispatch::create([
                'organization_id' => $organizationId,
                'warehouse_id' => $warehouseId,
                'sales_order_id' => $so->id,
                'dispatch_number' => $dispatchNumber,
                'dispatch_date' => $dispatchDate,
                'status' => 'DELIVERED',
                'remarks' => $remarks ?? "Dispatch for Sales Order #{$so->so_number}",
            ]);

            foreach ($so->items as $soItem) {
                $variant = $soItem->variant;
                $qtyToDispatch = (float) ($soItem->quantity - $soItem->dispatched_quantity);
                if ($qtyToDispatch <= 0) continue;

                if ($variant->inventory_behavior === 'SLAB') {
                    $slabs = InventoryObject::where('organization_id', $organizationId)
                        ->where('warehouse_id', $warehouseId)
                        ->where('product_variant_id', $variant->id)
                        ->where('status', 'AVAILABLE')
                        ->lockForUpdate()
                        ->take((int) $qtyToDispatch)
                        ->get();

                    if ($slabs->count() < (int) $qtyToDispatch) {
                        throw new Exception("Insufficient available slabs for product {$variant->name} during dispatch. Required: {$qtyToDispatch}, Available: {$slabs->count()}");
                    }

                    foreach ($slabs as $slab) {
                        $slab->status = 'DISPATCHED';
                        $slab->save();

                        DispatchItem::create([
                            'organization_id' => $organizationId,
                            'dispatch_id' => $dispatch->id,
                            'product_variant_id' => $variant->id,
                            'quantity' => 1.0,
                            'unit_id' => $soItem->unit_id,
                        ]);

                        InventoryMovement::create([
                            'organization_id' => $organizationId,
                            'inventory_object_id' => $slab->id,
                            'movement_type' => 'SALE',
                            'quantity_delta' => -1.0,
                            'area_delta' => -$slab->area,
                            'from_warehouse_id' => $warehouseId,
                            'reference_type' => 'Dispatch',
                            'reference_id' => $dispatch->id,
                        ]);
                    }
                } else {
                    $baseQty = $this->inventoryService->convertQuantity($qtyToDispatch, $soItem->unit_id, $variant->base_unit_id, $variant->id, $organizationId);

                    $objects = InventoryObject::where('organization_id', $organizationId)
                        ->where('product_variant_id', $variant->id)
                        ->where('warehouse_id', $warehouseId)
                        ->where('status', 'AVAILABLE')
                        ->where('quantity', '>', 0)
                        ->orderBy('id', 'asc')
                        ->lockForUpdate()
                        ->get();

                    $totalAvailable = $objects->sum('quantity');
                    if ((float) $totalAvailable < $baseQty) {
                        throw new Exception("Insufficient stock for product {$variant->name} during dispatch. Available: {$totalAvailable}, Required: {$baseQty}");
                    }

                    $remaining = $baseQty;

                    foreach ($objects as $obj) {
                        if ($remaining <= 0) break;
                        $deduct = min((float) $obj->quantity, $remaining);
                        $areaDeduct = $this->inventoryService->getAreaForQuantity($deduct, $variant->base_unit_id, $variant->id, $organizationId);

                        $obj->quantity = max(0, (float) $obj->quantity - $deduct);
                        $obj->area = max(0, (float) $obj->area - $areaDeduct);
                        if ($obj->quantity <= 0) {
                            $obj->status = 'DISPATCHED';
                        }
                        $obj->save();
                        $remaining -= $deduct;

                        InventoryMovement::create([
                            'organization_id' => $organizationId,
                            'inventory_object_id' => $obj->id,
                            'movement_type' => 'SALE',
                            'quantity_delta' => -$deduct,
                            'area_delta' => -$areaDeduct,
                            'from_warehouse_id' => $warehouseId,
                            'reference_type' => 'Dispatch',
                            'reference_id' => $dispatch->id,
                        ]);
                    }

                    DispatchItem::create([
                        'organization_id' => $organizationId,
                        'dispatch_id' => $dispatch->id,
                        'product_variant_id' => $variant->id,
                        'quantity' => $qtyToDispatch,
                        'unit_id' => $soItem->unit_id,
                    ]);
                }

                $soItem->dispatched_quantity += $qtyToDispatch;
                $soItem->save();

                // Fulfill active reservations for this sales order item
                $resQuery = \App\Domains\Inventory\Models\InventoryReservation::where('organization_id', $organizationId)
                    ->where('source_type', 'SalesOrder')
                    ->where('source_id', $so->id)
                    ->where('product_variant_id', $variant->id)
                    ->whereIn('status', ['ACTIVE', 'PENDING', 'PARTIALLY_FULFILLED']);

                foreach ($resQuery->get() as $res) {
                    $rem = $res->remaining_quantity;
                    if ($rem > 0) {
                        $this->reservationService->fulfill($res->id, min($rem, $qtyToDispatch));
                    }
                }
            }

            $allDispatched = $so->items->every(fn($i) => (float)$i->dispatched_quantity >= (float)$i->quantity);
            $so->status = $allDispatched ? 'DISPATCHED' : 'PARTIALLY_DISPATCHED';
            $so->save();

            return $dispatch->load(['warehouse', 'order', 'items.variant']);
        });
    }

    /**
     * List Dispatches
     */
    public function listDispatches(int $organizationId, array $filters = []): \Illuminate\Contracts\Pagination\LengthAwarePaginator
    {
        $query = Dispatch::where('organization_id', $organizationId)->with(['warehouse', 'order', 'invoice', 'items.variant']);
        if (!empty($filters['status'])) {
            $query->where('status', $filters['status']);
        }
        return $query->orderBy('id', 'desc')->paginate($filters['per_page'] ?? 15);
    }

    /**
     * Create Invoice from Dispatch
     */
    public function createInvoiceFromDispatch(int $dispatchId, array $invoiceData, int $organizationId): Invoice
    {
        return DB::transaction(function () use ($dispatchId, $invoiceData, $organizationId) {
            $dispatch = Dispatch::where('organization_id', $organizationId)
                ->with(['order.items.variant.taxProfile', 'order.customer', 'items'])
                ->findOrFail($dispatchId);

            $so = $dispatch->order;
            $customer = $so ? $so->customer : Customer::where('organization_id', $organizationId)->findOrFail($invoiceData['customer_id']);
            $warehouseId = $dispatch->warehouse_id;
            $organization = Organization::findOrFail($organizationId);

            $placeOfSupplyState = $invoiceData['place_of_supply_state'] ?? $customer->state ?? $organization->state ?? 'Manipur';
            $supplierGstin = $invoiceData['supplier_gstin'] ?? $organization->gstin ?? null;
            $customerGstin = $invoiceData['customer_gstin'] ?? $customer->gstin ?? null;
            $gstRegistrationType = $invoiceData['gst_registration_type'] ?? $customer->gst_registration_type ?? (!empty($customerGstin) ? 'REGISTERED_REGULAR' : 'UNREGISTERED');
            $invoiceType = $invoiceData['invoice_type'] ?? 'REGULAR';
            $isReverseCharge = (bool) ($invoiceData['is_reverse_charge'] ?? false);
            $isTaxInclusive = (bool) ($invoiceData['is_tax_inclusive'] ?? true);

            $posState = trim(strtolower($placeOfSupplyState));
            $orgState = trim(strtolower($organization->state ?? ''));
            $isInterState = isset($invoiceData['is_inter_state']) ? (bool) $invoiceData['is_inter_state'] : (!empty($posState) && !empty($orgState) && $posState !== $orgState);
            $supplyType = $isInterState ? 'INTER_STATE' : 'INTRA_STATE';

            $invoiceDate = $invoiceData['invoice_date'] ?? date('Y-m-d');
            $paymentMethod = $invoiceData['payment_method'] ?? 'CASH';
            $paidAmount = isset($invoiceData['paid_amount']) ? (float) $invoiceData['paid_amount'] : 0.0;

            $totalSubtotal = 0.0;
            $totalTaxable = 0.0;
            $totalCGST = 0.0;
            $totalSGST = 0.0;
            $totalIGST = 0.0;
            $totalTax = 0.0;
            $totalInvoiceAmount = 0.0;

            $processedItems = [];

            foreach ($dispatch->items as $dispItem) {
                $variant = Product::where('organization_id', $organizationId)->with('taxProfile')->findOrFail($dispItem->product_variant_id);
                $soItem = $so ? $so->items->firstWhere('product_variant_id', $variant->id) : null;
                $unitPrice = $soItem ? (float) $soItem->unit_price : (float) ($variant->pricings->first()->selling_price ?? 0);
                $quantity = (float) $dispItem->quantity;
                $taxCategory = 'TAXABLE';
                $taxRate = (float) ($variant->taxProfile->rate ?? 18.00);
                $hsnSacCode = $variant->taxProfile->hsn_code ?? $variant->sku;

                $lineGross = $quantity * $unitPrice;
                $lineTaxable = round($lineGross / (1 + ($taxRate / 100.0)), 4);
                $lineTax = $lineGross - $lineTaxable;

                if ($isInterState) {
                    $cgstRate = 0; $cgstAmount = 0; $sgstRate = 0; $sgstAmount = 0;
                    $igstRate = $taxRate; $igstAmount = round($lineTax, 4);
                } else {
                    $cgstRate = round($taxRate / 2.0, 2); $sgstRate = round($taxRate / 2.0, 2);
                    $cgstAmount = round($lineTax / 2.0, 4); $sgstAmount = round($lineTax / 2.0, 4);
                    $igstRate = 0; $igstAmount = 0;
                }

                $totalSubtotal += $lineGross;
                $totalTaxable += $lineTaxable;
                $totalCGST += $cgstAmount;
                $totalSGST += $sgstAmount;
                $totalIGST += $igstAmount;
                $totalTax += $lineTax;
                $totalInvoiceAmount += $lineGross;

                $processedItems[] = [
                    'product_variant_id' => $variant->id,
                    'unit_id' => $dispItem->unit_id,
                    'price_basis' => 'PCS',
                    'quantity' => $quantity,
                    'unit_price' => $unitPrice,
                    'discount_amount' => 0.0,
                    'taxable_amount' => $lineTaxable,
                    'tax_rate' => $taxRate,
                    'cgst_rate' => $cgstRate,
                    'cgst_amount' => $cgstAmount,
                    'sgst_rate' => $sgstRate,
                    'sgst_amount' => $sgstAmount,
                    'igst_rate' => $igstRate,
                    'igst_amount' => $igstAmount,
                    'tax_amount' => $lineTax,
                    'subtotal' => $lineGross,
                    'hsn_sac_code' => $hsnSacCode,
                    'tax_category' => $taxCategory,
                    'is_tax_inclusive' => $isTaxInclusive,
                    'product_name_snapshot' => $variant->name,
                    'sku_snapshot' => $variant->sku,
                ];
            }

            $invoiceNumber = $this->documentNumberService->generateNextNumber($organizationId, 'INV', $invoiceDate);

            $unroundedTotal = $totalInvoiceAmount;
            $roundedTotal = round($unroundedTotal);
            $roundOffAmount = round($roundedTotal - $unroundedTotal, 4);
            $finalGrandTotal = $roundedTotal;

            $dueAmount = max(0, $finalGrandTotal - $paidAmount);
            $paymentStatus = 'UNPAID';
            if ($paidAmount >= $finalGrandTotal) {
                $paymentStatus = 'PAID';
                $dueAmount = 0.0;
            } elseif ($paidAmount > 0) {
                $paymentStatus = 'PARTIALLY_PAID';
            }

            $invoice = Invoice::create([
                'organization_id' => $organizationId,
                'customer_id' => $customer->id,
                'warehouse_id' => $warehouseId,
                'invoice_number' => $invoiceNumber,
                'invoice_date' => $invoiceDate,
                'subtotal' => $totalSubtotal,
                'discount_amount' => 0.0,
                'taxable_amount' => $totalTaxable,
                'tax_amount' => $totalTax,
                'cgst_amount' => $totalCGST,
                'sgst_amount' => $totalSGST,
                'igst_amount' => $totalIGST,
                'total_amount' => $finalGrandTotal,
                'round_off_amount' => $roundOffAmount,
                'paid_amount' => $paidAmount,
                'due_amount' => $dueAmount,
                'status' => 'APPROVED',
                'payment_status' => $paymentStatus,
                'payment_method' => $paymentMethod,
                'billing_address' => $customer->address,
                'shipping_address' => $customer->address,
                'supplier_gstin' => $supplierGstin,
                'customer_gstin' => $customerGstin,
                'place_of_supply_state' => $placeOfSupplyState,
                'gst_registration_type' => $gstRegistrationType,
                'supply_type' => $supplyType,
                'invoice_type' => $invoiceType,
                'is_reverse_charge' => $isReverseCharge,
                'is_tax_inclusive' => $isTaxInclusive,
                'is_direct_sale' => false,
            ]);

            foreach ($processedItems as $row) {
                $row['organization_id'] = $organizationId;
                $invoice->items()->create($row);
            }

            $dispatch->invoice_id = $invoice->id;
            $dispatch->save();

            if ($so) {
                $so->status = 'INVOICED';
                $so->save();
            }

            // Post Sales GL Entry
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

            // Post Receipt if paid
            if ($paidAmount > 0) {
                $paymentAccCode = ($paymentMethod === 'CASH') ? 'CASH-01' : 'BANK-01';
                $paymentAccName = ($paymentMethod === 'CASH') ? 'Cash in Hand' : 'Main Bank Account';
                $paymentAccount = $this->resolveAccount($organizationId, $paymentAccCode, $paymentAccName, 'ASSET', 'Bank Accounts');

                $rcpNumber = $this->documentNumberService->generateNextNumber($organizationId, 'RCP', $invoiceDate);
                $this->postingService->postReceipt(
                    $organizationId,
                    1,
                    $paidAmount,
                    $paymentAccount->id,
                    $customerAccount->id,
                    $rcpNumber,
                    $invoiceDate
                );
            }

            // Post COGS Entry
            $cogsAccount = $this->resolveAccount($organizationId, 'EXP-COGS-01', 'Cost of Goods Sold A/c', 'EXPENSE', 'Direct Expenses');
            $inventoryAssetAccount = $this->resolveAccount($organizationId, 'INV-01', 'Inventory Asset A/c', 'ASSET', 'Current Assets');
            $cogsAmount = (float) $totalSubtotal * 0.70;

            $this->postingService->postCOGS(
                $organizationId,
                $cogsAmount,
                $cogsAccount->id,
                $inventoryAssetAccount->id,
                $invoiceNumber,
                $invoiceDate,
                $invoice->id
            );

            return $invoice->load(['organization', 'customer', 'warehouse', 'items.unit', 'items.variant']);
        });
    }

    /**
     * Create Sales Return
     */
    public function createSalesReturn(array $data, int $organizationId): SalesReturn
    {
        return DB::transaction(function () use ($data, $organizationId) {
            $invoiceId = (int) $data['invoice_id'];
            $returnDate = $data['return_date'] ?? date('Y-m-d');
            $remarks = $data['remarks'] ?? null;

            $invoice = Invoice::where('organization_id', $organizationId)
                ->with(['items.variant', 'customer'])
                ->findOrFail($invoiceId);

            $returnNumber = $this->documentNumberService->generateNextNumber($organizationId, 'RET', $returnDate);

            $totalReturnAmount = 0.0;
            $processedReturnItems = [];

            foreach ($data['items'] ?? [] as $retItem) {
                $invoiceItemId = (int) $retItem['invoice_item_id'];
                $qty = (float) $retItem['quantity'];

                $invItem = $invoice->items->firstWhere('id', $invoiceItemId);
                if (!$invItem) continue;

                $itemSubtotal = $qty * (float) $invItem->unit_price;
                $totalReturnAmount += $itemSubtotal;

                $objId = $retItem['inventory_object_id'] ?? null;
                if (!$objId && $invItem) {
                    $invObj = InventoryObject::where('organization_id', $organizationId)
                        ->where('warehouse_id', $invoice->warehouse_id)
                        ->where('product_variant_id', $invItem->product_variant_id)
                        ->first();
                    if ($invObj) {
                        $objId = $invObj->id;
                        $invObj->quantity = (float) $invObj->quantity + $qty;
                        $invObj->status = 'AVAILABLE';
                        $invObj->save();
                    }
                } elseif ($objId) {
                    $obj = InventoryObject::find($objId);
                    if ($obj) {
                        $obj->status = 'AVAILABLE';
                        $obj->save();
                    }
                }

                $processedReturnItems[] = [
                    'organization_id' => $organizationId,
                    'invoice_item_id' => $invoiceItemId,
                    'inventory_object_id' => $objId,
                    'quantity' => $qty,
                ];

                if ($objId) {
                    InventoryMovement::create([
                        'organization_id' => $organizationId,
                        'inventory_object_id' => $objId,
                        'movement_type' => 'ADJUSTMENT',
                        'quantity_delta' => $qty,
                        'to_warehouse_id' => $invoice->warehouse_id,
                        'reference_type' => 'SalesReturn',
                        'reference_id' => $invoice->id,
                        'reason' => 'Sales Return',
                    ]);
                }
            }

            $salesReturn = SalesReturn::create([
                'organization_id' => $organizationId,
                'customer_id' => $invoice->customer_id,
                'invoice_id' => $invoice->id,
                'return_number' => $returnNumber,
                'return_date' => $returnDate,
                'total_amount' => $totalReturnAmount,
                'status' => 'APPROVED',
            ]);

            foreach ($processedReturnItems as $row) {
                $salesReturn->items()->create($row);
            }

            // Post Accounting Sales Return Entry & COGS Restoration Entry
            $salesReturnAccount = $this->resolveAccount($organizationId, 'SRET-01', 'Sales Return A/c', 'INCOME', 'Direct Income');
            $customerAccount = $this->resolveAccount($organizationId, 'CUST-' . $invoice->customer_id, $invoice->customer->name, 'ASSET', 'Accounts Receivable');
            $gstOutputAccount = $this->resolveAccount($organizationId, 'DUTY-GST-OUT-01', 'Output GST A/c', 'LIABILITY', 'Duties and Taxes');
            $cogsAccount = $this->resolveAccount($organizationId, 'EXP-COGS-01', 'Cost of Goods Sold A/c', 'EXPENSE', 'Direct Expenses');
            $inventoryAssetAccount = $this->resolveAccount($organizationId, 'INV-01', 'Inventory Asset A/c', 'ASSET', 'Current Assets');

            $cogsRestoration = $totalReturnAmount * 0.70;

            $this->postingService->postSalesReturn(
                $organizationId,
                $totalReturnAmount,
                $cogsRestoration,
                $customerAccount->id,
                $salesReturnAccount->id,
                $gstOutputAccount->id,
                0.0,
                $inventoryAssetAccount->id,
                $cogsAccount->id,
                $returnNumber,
                $returnDate,
                $salesReturn->id
            );

            return $salesReturn->load(['customer', 'invoice', 'items']);
        });
    }
}
