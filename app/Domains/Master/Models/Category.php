<?php
namespace App\Domains\Master\Models;

use App\Domains\Master\Traits\BelongsToOrganization;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Category extends Model {
    use BelongsToOrganization;
    use SoftDeletes;
    protected $fillable = ['organization_id', 'parent_id', 'name', 'description', 'sort_order', 'is_active', 'slug'];

    public function organization(): BelongsTo {
        return $this->belongsTo(Organization::class);
    }
    public function parent(): BelongsTo {
        return $this->belongsTo(Category::class, 'parent_id');
    }
    public function children(): HasMany {
        return $this->hasMany(Category::class, 'parent_id');
    }
}
