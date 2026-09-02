<?php

namespace App\Http\Controllers\Api\Platform;

use App\Http\Controllers\Controller;
use App\Domains\Security\Models\Menu;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class PlatformMenuController extends Controller
{
    /**
     * List all database menus for Super Admin.
     */
    public function index()
    {
        $tree = Menu::with(['children.children', 'permission', 'parent'])
            ->whereNull('parent_id')
            ->orderBy('order', 'asc')
            ->get();

        $flat = Menu::with(['permission', 'parent'])
            ->orderBy('order', 'asc')
            ->get();

        return response()->json([
            'tree' => $tree,
            'flat' => $flat,
        ]);
    }

    /**
     * Create a new menu item.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'menu_name'     => 'required|string|max:255',
            'menu_type'     => 'nullable|in:GROUP,PAGE',
            'route_uri'     => 'nullable|string|max:255',
            'icon'          => 'nullable|string|max:100',
            'parent_id'     => 'nullable|exists:menus,id',
            'permission_id' => 'nullable|exists:permissions,id',
            'order'         => 'nullable|integer',
            'enabled'       => 'nullable|boolean',
        ]);

        $menuType = $validated['menu_type'] ?? 'PAGE';
        if ($menuType === 'PAGE' && empty($validated['route_uri'])) {
            throw ValidationException::withMessages([
                'route_uri' => ['The route URI field is required when menu type is PAGE.']
            ]);
        }

        if ($menuType === 'GROUP') {
            $validated['route_uri'] = null;
            $validated['permission_id'] = null;
        }

        $menu = Menu::create([
            'menu_name'     => $validated['menu_name'],
            'menu_type'     => $menuType,
            'route_uri'     => $validated['route_uri'] ?? null,
            'icon'          => $validated['icon'] ?? null,
            'parent_id'     => $validated['parent_id'] ?? null,
            'permission_id' => $validated['permission_id'] ?? null,
            'order'         => $validated['order'] ?? 0,
            'enabled'       => $validated['enabled'] ?? true,
        ]);

        return response()->json([
            'message' => 'Menu item created successfully.',
            'menu'    => $menu->load(['permission', 'parent']),
        ], 201);
    }

    /**
     * Update an existing menu item.
     */
    public function update(Request $request, $id)
    {
        $menu = Menu::findOrFail($id);

        $validated = $request->validate([
            'menu_name'     => 'sometimes|required|string|max:255',
            'menu_type'     => 'sometimes|required|in:GROUP,PAGE',
            'route_uri'     => 'required_if:menu_type,PAGE|nullable|string|max:255',
            'icon'          => 'nullable|string|max:100',
            'parent_id'     => 'nullable|exists:menus,id',
            'permission_id' => 'nullable|exists:permissions,id',
            'order'         => 'sometimes|integer',
            'enabled'       => 'sometimes|boolean',
        ]);

        $parentId = array_key_exists('parent_id', $validated) ? $validated['parent_id'] : $menu->parent_id;

        if ($parentId !== null) {
            if ((int)$parentId === (int)$menu->id) {
                throw ValidationException::withMessages([
                    'parent_id' => ['A menu item cannot be its own parent.']
                ]);
            }

            if ($this->isDescendant($menu->id, (int)$parentId)) {
                throw ValidationException::withMessages([
                    'parent_id' => ['Circular parent hierarchy detected. A menu item cannot be placed under one of its descendants.']
                ]);
            }
        }

        $type = $validated['menu_type'] ?? $menu->menu_type;
        if ($type === 'GROUP') {
            $validated['route_uri'] = null;
            $validated['permission_id'] = null;
        }

        $menu->update($validated);

        return response()->json([
            'message' => 'Menu item updated successfully.',
            'menu'    => $menu->fresh()->load(['permission', 'parent']),
        ]);
    }

    /**
     * Batch reorder menu items.
     */
    public function reorder(Request $request)
    {
        $request->validate([
            'items' => 'required|array',
            'items.*.id' => 'required|exists:menus,id',
            'items.*.order' => 'required|integer',
            'items.*.parent_id' => 'nullable|exists:menus,id',
        ]);

        DB::transaction(function () use ($request) {
            foreach ($request->input('items') as $item) {
                Menu::where('id', $item['id'])->update([
                    'order' => $item['order'],
                    'parent_id' => $item['parent_id'] ?? null,
                ]);
            }
        });

        return response()->json([
            'message' => 'Menu order updated successfully.'
        ]);
    }

    /**
     * Delete a menu item safely.
     */
    public function destroy($id)
    {
        $menu = Menu::findOrFail($id);

        if ($menu->children()->exists()) {
            return response()->json([
                'message' => 'Cannot delete menu item because it contains submenus. Delete or reassign children first.'
            ], 422);
        }

        $menu->delete();

        return response()->json([
            'message' => 'Menu item deleted successfully.'
        ]);
    }

    /**
     * Toggle enabled status of a menu item.
     */
    public function toggle($id)
    {
        $menu = Menu::findOrFail($id);
        $menu->enabled = !$menu->enabled;
        $menu->save();

        return response()->json([
            'message' => $menu->enabled ? 'Menu item activated successfully.' : 'Menu item deactivated successfully.',
            'menu'    => $menu->fresh()->load(['permission', 'parent']),
        ]);
    }

    /**
     * Check if potentialParentId is a descendant of menuId.
     */
    private function isDescendant($menuId, $potentialParentId): bool
    {
        $currentParentId = $potentialParentId;

        while ($currentParentId !== null) {
            if ((int)$currentParentId === (int)$menuId) {
                return true;
            }
            $parent = Menu::find($currentParentId);
            $currentParentId = $parent ? $parent->parent_id : null;
        }

        return false;
    }
}
