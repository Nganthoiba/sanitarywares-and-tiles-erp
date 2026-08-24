<?php

namespace App\Http\Controllers\Api\Auth;

use App\Http\Controllers\Controller;
use App\Domains\Security\Models\Menu;
use App\Shared\Context\TenantContext;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\App;
use Illuminate\Support\Collection;

class NavigationController extends Controller
{
    /**
     * Get authorized database-driven navigation menu tree for current user.
     */
    public function index(Request $request)
    {
        $user = $request->user();

        $context = App::make(TenantContext::class);

        $isSuperAdmin = $user->organization_id === null || $user->roles()->where('slug', 'super-admin')->exists();

        $permissions = $context->getPermissions() ?? collect();
        if ($permissions->isEmpty()) {
            $user->load(['roles.permissions', 'defaultRole.permissions']);
            $activeRole = $user->defaultRole ?? $user->roles->first();

            if ($activeRole && $activeRole->relationLoaded('permissions')) {
                $permissions = $activeRole->permissions->pluck('slug')->filter()->unique();
            } else {
                $permissions = $user->roles->flatMap(fn($r) => $r->permissions)->pluck('slug')->filter()->unique();
            }
        }

        $topMenus = Menu::with(['children' => function ($query) {
            $query->where('enabled', true)->orderBy('order', 'asc');
        }, 'children.permission', 'permission'])
            ->whereNull('parent_id')
            ->where('enabled', true)
            ->orderBy('order', 'asc')
            ->get();

        $authorizedTree = $this->buildAuthorizedTree($topMenus, $isSuperAdmin, $permissions);

        return response()->json($authorizedTree);
    }

    /**
     * Recursively build authorized navigation tree.
     */
    private function buildAuthorizedTree(Collection $menus, bool $isSuperAdmin, Collection $userPermissions): array
    {
        $result = [];

        foreach ($menus as $menu) {
            if (!$menu->enabled) {
                continue;
            }

            $isAuthorized = $isSuperAdmin || !$menu->permission_id || $userPermissions->contains($menu->permission?->slug);

            if ($menu->menu_type === 'GROUP') {
                if (!$isAuthorized) {
                    continue;
                }

                $childrenCollection = $menu->children ? $menu->children->filter(fn($c) => $c->enabled) : collect();
                $authorizedChildren = $this->buildAuthorizedTree($childrenCollection, $isSuperAdmin, $userPermissions);

                // Parent GROUP menu is only displayed if it has at least one authorized child
                if (count($authorizedChildren) > 0) {
                    $result[] = [
                        'id'        => $menu->id,
                        'menu_name' => $menu->menu_name,
                        'menu_type' => 'GROUP',
                        'route_uri' => null,
                        'icon'      => $menu->icon,
                        'order'     => $menu->order,
                        'children'  => $authorizedChildren,
                    ];
                }
            } else {
                // PAGE menu
                if ($isAuthorized) {
                    $result[] = [
                        'id'        => $menu->id,
                        'menu_name' => $menu->menu_name,
                        'menu_type' => 'PAGE',
                        'route_uri' => $menu->route_uri,
                        'icon'      => $menu->icon,
                        'order'     => $menu->order,
                        'children'  => [],
                    ];
                }
            }
        }

        return $result;
    }
}
