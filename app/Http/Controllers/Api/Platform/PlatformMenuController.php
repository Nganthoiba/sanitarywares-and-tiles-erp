<?php

namespace App\Http\Controllers\Api\Platform;

use App\Http\Controllers\Controller;
use App\Domains\Security\Models\Menu;
use Illuminate\Http\Request;

class PlatformMenuController extends Controller
{
    /**
     * List all database menus for Super Admin.
     */
    public function index()
    {
        $menus = Menu::with(['children', 'permission', 'parent'])->whereNull('parent_id')->orderBy('order', 'asc')->get();
        $allMenus = Menu::with(['permission', 'parent'])->orderBy('order', 'asc')->get();

        return response()->json([
            'tree' => $menus,
            'flat' => $allMenus,
        ]);
    }

    /**
     * Create a new menu item.
     */
    public function store(Request $request)
    {
        $request->validate([
            'menu_name' => 'required|string|max:255',
            'route_uri' => 'required|string|max:255',
            'icon' => 'nullable|string|max:100',
            'group_name' => 'nullable|string|max:100',
            'parent_id' => 'nullable|exists:menus,id',
            'permission_id' => 'nullable|exists:permissions,id',
            'order' => 'nullable|integer',
            'enabled' => 'nullable|boolean',
        ]);

        $menu = Menu::create([
            'menu_name' => $request->input('menu_name'),
            'route_uri' => $request->input('route_uri'),
            'icon' => $request->input('icon'),
            'group_name' => $request->input('group_name'),
            'parent_id' => $request->input('parent_id'),
            'permission_id' => $request->input('permission_id'),
            'order' => $request->input('order', 0),
            'enabled' => $request->input('enabled', true),
        ]);

        return response()->json([
            'message' => 'Menu item created successfully.',
            'menu' => $menu->load(['permission', 'parent']),
        ], 201);
    }

    /**
     * Update an existing menu item.
     */
    public function update(Request $request, $id)
    {
        $menu = Menu::findOrFail($id);

        $request->validate([
            'menu_name' => 'sometimes|required|string|max:255',
            'route_uri' => 'sometimes|required|string|max:255',
            'icon' => 'nullable|string|max:100',
            'group_name' => 'nullable|string|max:100',
            'parent_id' => 'nullable|exists:menus,id',
            'permission_id' => 'nullable|exists:permissions,id',
            'order' => 'sometimes|integer',
            'enabled' => 'sometimes|boolean',
        ]);

        $menu->update($request->only(['menu_name', 'route_uri', 'icon', 'group_name', 'parent_id', 'permission_id', 'order', 'enabled']));

        return response()->json([
            'message' => 'Menu item updated successfully.',
            'menu' => $menu->load(['permission', 'parent']),
        ]);
    }

    /**
     * Delete a menu item.
     */
    public function destroy($id)
    {
        $menu = Menu::findOrFail($id);

        if ($menu->children()->exists()) {
            return response()->json([
                'message' => 'Cannot delete menu item because it has child submenus. Delete or reassign children first.'
            ], 400);
        }

        $menu->delete();

        return response()->json([
            'message' => 'Menu item deleted successfully.'
        ]);
    }
}
