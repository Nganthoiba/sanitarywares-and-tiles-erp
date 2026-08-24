<?php

namespace App\Http\Controllers\Api\Platform;

use App\Http\Controllers\Controller;
use App\Domains\Security\Models\PermissionGroup;
use App\Domains\Security\Models\Permission;
use Illuminate\Http\Request;

class PlatformPermissionController extends Controller
{
    /**
     * List all permissions and permission groups.
     */
    public function index()
    {
        $groups = PermissionGroup::with('permissions')->get();
        $permissions = Permission::with('group')->get();

        return response()->json([
            'groups' => $groups,
            'permissions' => $permissions,
        ]);
    }

    /**
     * Create a new permission group.
     */
    public function storeGroup(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255|unique:permission_groups,name',
        ]);

        $group = PermissionGroup::create([
            'name' => $request->input('name'),
            'enabled' => true,
        ]);

        return response()->json([
            'message' => 'Permission group created successfully.',
            'group' => $group,
        ], 201);
    }

    /**
     * Update an existing permission group.
     */
    public function updateGroup(Request $request, $id)
    {
        $group = PermissionGroup::findOrFail($id);

        $request->validate([
            'name' => 'required|string|max:255|unique:permission_groups,name,' . $id,
            'enabled' => 'sometimes|boolean',
        ]);

        $group->update($request->only(['name', 'enabled']));

        return response()->json([
            'message' => 'Permission group updated successfully.',
            'group' => $group,
        ]);
    }

    /**
     * Create a new permission.
     */
    public function storePermission(Request $request)
    {
        $request->validate([
            'permission_group_id' => 'required|exists:permission_groups,id',
            'name' => 'required|string|max:255|unique:permissions,slug',
            'display_name' => 'required|string|max:255',
            'description' => 'nullable|string',
        ]);

        $slug = $request->input('name');

        $permission = Permission::create([
            'permission_group_id' => $request->input('permission_group_id'),
            //'name' => $slug,
            'slug' => $slug,
            'display_name' => $request->input('display_name'),
            'description' => $request->input('description'),
            'enabled' => true,
        ]);

        return response()->json([
            'message' => 'Permission created successfully.',
            'permission' => $permission->load('group'),
        ], 201);
    }

    /**
     * Update an existing permission.
     */
    public function updatePermission(Request $request, $id)
    {
        $permission = Permission::findOrFail($id);

        $request->validate([
            'permission_group_id' => 'sometimes|required|exists:permission_groups,id',
            'display_name' => 'sometimes|required|string|max:255',
            'description' => 'nullable|string',
            'enabled' => 'sometimes|boolean',
        ]);

        $permission->update($request->only(['permission_group_id', 'display_name', 'description', 'enabled']));

        return response()->json([
            'message' => 'Permission updated successfully.',
            'permission' => $permission->load('group'),
        ]);
    }

    /**
     * Enable or disable a permission safely.
     */
    public function togglePermission($id)
    {
        $permission = Permission::findOrFail($id);
        $permission->enabled = !$permission->enabled;
        $permission->save();

        return response()->json([
            'message' => "Permission '{$permission->slug}' " . ($permission->enabled ? 'enabled' : 'disabled') . '.',
            'permission' => $permission,
        ]);
    }

    /**
     * Delete a permission group if empty.
     */
    public function destroyGroup($id)
    {
        $group = PermissionGroup::withCount('permissions')->findOrFail($id);

        if ($group->permissions_count > 0) {
            return response()->json([
                'message' => "Cannot delete group '{$group->name}' because it contains {$group->permissions_count} permission(s). Please reassign or delete the permissions first."
            ], 422);
        }

        $group->delete();

        return response()->json([
            'message' => "Permission group '{$group->name}' deleted successfully."
        ]);
    }

    /**
     * Delete a permission if not linked to roles or menus.
     */
    public function destroyPermission($id)
    {
        $permission = Permission::withCount(['roles', 'menus'])->findOrFail($id);

        if ($permission->roles_count > 0) {
            return response()->json([
                'message' => "Cannot delete permission '{$permission->slug}' because it is assigned to {$permission->roles_count} role(s)."
            ], 422);
        }

        if ($permission->menus_count > 0) {
            return response()->json([
                'message' => "Cannot delete permission '{$permission->slug}' because it is linked to {$permission->menus_count} navigation menu(s)."
            ], 422);
        }

        $permission->delete();

        return response()->json([
            'message' => "Permission '{$permission->slug}' deleted successfully."
        ]);
    }
}
