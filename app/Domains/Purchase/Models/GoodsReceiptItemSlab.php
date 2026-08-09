<?php
namespace App\Domains\Purchase\Models;

use App\Domains\Master\Traits\BelongsToOrganization;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use App\Domains\Master\Models\Organization;

class GoodsReceiptItemSlab extends Model {
    use BelongsToOrganization;
    use SoftDeletes;

    protected $table = 'goods_receipt_item_slabs';

    protected $fillable = [
        'organization_id',
        'goods_receipt_item_id',
        'length',
        'width',
        'thickness',
        'finish',
        'origin',
        'slab_code'
    ];

    protected $casts = [
        'length' => 'decimal:2',
        'width' => 'decimal:2',
        'thickness' => 'decimal:2'
    ];

    public function organization(): BelongsTo {
        return $this->belongsTo(Organization::class);
    }

    public function item(): BelongsTo {
        return $this->belongsTo(GoodsReceiptItem::class, 'goods_receipt_item_id');
    }
}
