<?php

namespace App\Http\Controllers\Api\Product;

use App\Http\Controllers\Controller;
use App\Domains\Product\Models\ProductBatchPrice;
use Illuminate\Http\Request;

class ProductBatchPriceApiController extends Controller
{
    /**
     * Display a listing of batch prices.
     */
    public function index(Request $request)
    {
        $query = ProductBatchPrice::with(['productVariant.baseUnit', 'creator', 'updater']);

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('batch_number', 'like', "%{$search}%")
                  ->orWhereHas('productVariant', function ($vq) use ($search) {
                      $vq->where('name', 'like', "%{$search}%")
                        ->orWhere('sku', 'like', "%{$search}%");
                  });
            });
        }

        if ($request->filled('product_variant_id')) {
            $query->where('product_variant_id', $request->product_variant_id);
        }

        if ($request->filled('batch_number')) {
            $query->where('batch_number', $request->batch_number);
        }

        if ($request->filled('status')) {
            if ($request->status === 'unpriced') {
                $query->where(function ($q) {
                    $q->whereNull('cost_price')->orWhereNull('sale_price');
                });
            } elseif ($request->status === 'priced') {
                $query->whereNotNull('cost_price')->whereNotNull('sale_price');
            }
        }

        $batchPrices = $query->orderBy('created_at', 'desc')->paginate($request->query('per_page', 15));

        return response()->json($batchPrices);
    }

    /**
     * Update specified batch cost & sale price.
     */
    public function update(Request $request, $id)
    {
        $validated = $request->validate([
            'cost_price' => ['nullable', 'numeric', 'min:0'],
            'sale_price' => ['nullable', 'numeric', 'min:0'],
        ]);

        $batchPrice = ProductBatchPrice::findOrFail($id);

        $batchPrice->update([
            'cost_price' => $validated['cost_price'] ?? null,
            'sale_price' => $validated['sale_price'] ?? null,
            'updated_by' => auth()->id(),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Batch prices updated successfully.',
            'data' => $batchPrice->fresh(['productVariant.baseUnit', 'creator', 'updater']),
        ]);
    }

    /**
     * Bulk update multiple batch prices.
     */
    public function bulkUpdate(Request $request)
    {
        $validated = $request->validate([
            'prices' => ['required', 'array', 'min:1'],
            'prices.*.id' => ['required', 'exists:product_batch_prices,id'],
            'prices.*.cost_price' => ['nullable', 'numeric', 'min:0'],
            'prices.*.sale_price' => ['nullable', 'numeric', 'min:0'],
        ]);

        $updated = [];
        foreach ($validated['prices'] as $item) {
            $bp = ProductBatchPrice::find($item['id']);
            if ($bp) {
                $bp->update([
                    'cost_price' => $item['cost_price'] ?? null,
                    'sale_price' => $item['sale_price'] ?? null,
                    'updated_by' => auth()->id(),
                ]);
                $updated[] = $bp;
            }
        }

        return response()->json([
            'success' => true,
            'message' => count($updated) . ' batch prices updated successfully.',
        ]);
    }
}
