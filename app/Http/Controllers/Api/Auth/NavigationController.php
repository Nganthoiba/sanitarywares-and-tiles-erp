<?php

namespace App\Http\Controllers\Api\Auth;

use App\Http\Controllers\Controller;
use App\Domains\Security\Models\Menu;
use App\Shared\Context\TenantContext;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\App;

class NavigationController extends Controller
{
    /**
     * Get authorized database-driven navigation menu tree for current user.
     */
    public function index(Request $request)
    {
        $user = $request->user();

        $context = App::make(TenantContext::class);
        $contextUser = $context->getUser() ?? $user;

        $isSuperAdmin = $user->organization_id === null || $user->roles()->where('slug', 'super-admin')->exists();

        $permissions = $context->getPermissions() ?? collect();
        if ($permissions->isEmpty() && $user->relationLoaded('roles')) {
            $permissions = $user->roles->flatMap(fn($r) => $r->permissions)->pluck('slug')->filter()->unique();
        }

        $topMenus = Menu::with(['children' => function ($query) {
            $query->where('enabled', true)->orderBy('order', 'asc');
        }, 'permission'])
            ->whereNull('parent_id')
            ->where('enabled', true)
            ->orderBy('order', 'asc')
            ->get();

        $authorizedMenus = [];

        foreach ($topMenus as $menu) {
            $isParentAuthorized = $isSuperAdmin || !$menu->permission_id || $permissions->contains($menu->permission?->slug);

            $authorizedChildren = [];
            foreach ($menu->children as $child) {
                $isChildAuthorized = $isSuperAdmin || !$child->permission_id || $permissions->contains($child->permission?->slug);
                if ($isChildAuthorized) {
                    $authorizedChildren[] = [
                        'id' => $child->id,
                        'menu_name' => $child->menu_name,
                        'route_uri' => $child->route_uri,
                        'icon' => $child->icon,
                        'order' => $child->order,
                    ];
                }
            }

            // Include parent menu if it has authorized children or if the parent itself is directly authorized (and has no children)
            if ($isParentAuthorized || count($authorizedChildren) > 0) {
                $authorizedMenus[] = [
                    'id' => $menu->id,
                    'menu_name' => $menu->menu_name,
                    'route_uri' => $menu->route_uri,
                    'icon' => $menu->icon,
                    'group_name' => $menu->group_name,
                    'order' => $menu->order,
                    'children' => $authorizedChildren,
                ];
            }
        }

        return response()->json($authorizedMenus);
    }
}
