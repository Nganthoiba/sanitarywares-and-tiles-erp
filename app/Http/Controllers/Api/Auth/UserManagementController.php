<?php

namespace App\Http\Controllers\Api\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Domains\Security\Models\Role;
use App\Domains\Security\Models\Permission;
use App\Domains\Master\Models\Branch;
use App\Domains\Master\Models\Warehouse;
use App\Domains\Security\Models\UserScope;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class UserManagementController extends Controller
{
    /**
     * List all users in the organization.
     */
    public function index(Request $request)
    {
        $users = User::with(['roles', 'scopes.branch', 'scopes.warehouse'])->get();

        return response()->json($users);
    }

    /**
     * List all roles in the organization.
     */
    public function roles(Request $request)
    {
        $roles = Role::with('permissions')->get();
        return response()->json($roles);
    }

    /**
     * List branches in the organization.
     */
    public function branches(Request $request)
    {
        $branches = Branch::all();
        return response()->json($branches);
    }

    /**
     * List warehouses in the organization.
     */
    public function warehouses(Request $request)
    {
        $warehouses = Warehouse::all();
        return response()->json($warehouses);
    }

    /**
     * Create employee directly (admin bypass).
     */
    public function store(Request $request)
    {
        $orgId = $request->user()->organization_id;

        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|max:255|unique:users,email',
            'password' => 'required|string|min:8',
            'role_id' => [
                'required',
                Rule::exists('roles', 'id')->where(function ($q) use ($orgId) {
                    $q->where('organization_id', $orgId)->orWhereNull('organization_id');
                })
            ],
            'branch_id' => [
                'required',
                Rule::exists('branches', 'id')->where('organization_id', $orgId)
            ],
            'warehouse_id' => [
                'required',
                Rule::exists('warehouses', 'id')->where('organization_id', $orgId)->where('branch_id', $request->input('branch_id'))
            ],
        ]);

        $user = DB::transaction(function () use ($request, $orgId) {
            $user = User::create([
                'organization_id' => $orgId,
                'default_role_id' => $request->input('role_id'),
                'name' => $request->input('name'),
                'email' => $request->input('email'),
                'password' => Hash::make($request->input('password')),
            ]);

            $user->roles()->attach($request->input('role_id'), ['organization_id' => $orgId]);

            UserScope::create([
                'organization_id' => $orgId,
                'user_id' => $user->id,
                'branch_id' => $request->input('branch_id'),
                'warehouse_id' => $request->input('warehouse_id'),
            ]);

            return $user;
        });

        return response()->json([
            'message' => 'Employee created successfully.',
            'user' => $user->load(['roles', 'scopes.branch', 'scopes.warehouse'])
        ], 201);
    }

    /**
     * Update employee scopes or roles.
     */
    public function update(Request $request, $id)
    {
        $user = User::findOrFail($id);
        $orgId = $request->user()->organization_id;

        $request->validate([
            'name' => 'sometimes|required|string|max:255',
            'role_id' => [
                'sometimes',
                'required',
                Rule::exists('roles', 'id')->where(function ($q) use ($orgId) {
                    $q->where('organization_id', $orgId)->orWhereNull('organization_id');
                })
            ],
            'branch_id' => [
                'sometimes',
                'required',
                Rule::exists('branches', 'id')->where('organization_id', $orgId)
            ],
            'warehouse_id' => [
                'sometimes',
                'required',
                Rule::exists('warehouses', 'id')->where('organization_id', $orgId)
            ],
        ]);

        DB::transaction(function () use ($request, $user) {
            if ($request->has('name')) {
                $user->name = $request->input('name');
                $user->save();
            }

            if ($request->has('role_id')) {
                $user->roles()->syncWithPivotValues([$request->input('role_id')], ['organization_id' => $user->organization_id]);
                $user->default_role_id = $request->input('role_id');
                $user->save();
            }

            if ($request->has('branch_id') || $request->has('warehouse_id')) {
                $scope = UserScope::where('user_id', $user->id)->first();
                if ($scope) {
                    if ($request->has('branch_id')) {
                        $scope->branch_id = $request->input('branch_id');
                    }
                    if ($request->has('warehouse_id')) {
                        $scope->warehouse_id = $request->input('warehouse_id');
                    }
                    $scope->save();
                } else {
                    UserScope::create([
                        'organization_id' => $user->organization_id,
                        'user_id' => $user->id,
                        'branch_id' => $request->input('branch_id'),
                        'warehouse_id' => $request->input('warehouse_id'),
                    ]);
                }
            }
        });

        return response()->json([
            'message' => 'Employee updated successfully.',
            'user' => $user->load(['roles', 'scopes.branch', 'scopes.warehouse'])
        ]);
    }

    /**
     * Delete employee.
     */
    public function destroy(Request $request, $id)
    {
        $user = User::findOrFail($id);

        if ($user->id === $request->user()->id) {
            return response()->json(['message' => 'You cannot delete yourself.'], 400);
        }

        // Verify if they are trying to delete the administrator owner
        $isAdmin = $user->roles()->where('slug', 'administrator')->exists();
        if ($isAdmin) {
            // Count administrators to prevent deleting the last admin/owner
            $adminCount = User::whereHas('roles', function ($q) {
                $q->where('slug', 'administrator');
            })->count();

            if ($adminCount <= 1) {
                return response()->json(['message' => 'Cannot delete the organization owner account.'], 400);
            }
        }

        $user->delete();

        return response()->json([
            'message' => 'Employee deleted successfully.'
        ]);
    }

    /**
     * Create a new role for the organization.
     */
    public function storeRole(Request $request)
    {
        $orgId = $request->user()->organization_id;

        $request->validate([
            'name' => 'required|string|max:255',
            'permissions' => 'nullable|array',
            'permissions.*' => [
                'integer',
                Rule::exists('permissions', 'id')
            ],
        ]);

        $slug = Str::slug($request->input('name'));

        // Check uniqueness of slug within organization
        $exists = Role::where('slug', $slug)->exists();
        if ($exists) {
            return response()->json([
                'message' => 'The validation failed.',
                'errors' => [
                    'name' => ['A role with a similar name already exists in your organization.']
                ]
            ], 422);
        }

        $role = DB::transaction(function () use ($request, $orgId, $slug) {
            $role = Role::create([
                'organization_id' => $orgId,
                'name' => $request->input('name'),
                'slug' => $slug,
                'is_system' => false,
            ]);

            if ($request->has('permissions')) {
                $role->permissions()->syncWithPivotValues($request->input('permissions') ?? [], ['organization_id' => $orgId]);
            }

            return $role;
        });

        return response()->json($role->load('permissions'), 201);
    }

    /**
     * Update an existing role for the organization.
     */
    public function updateRole(Request $request, $id)
    {
        $role = Role::findOrFail($id);

        // If the role is system role and the user is not a System Administrator / Super Admin, return error.
        if ($role->is_system && !in_array($request->user()->defaultRole?->slug, ['super-administrator', 'super-admin'])) {
            return response()->json([
                'message' => 'System roles cannot be modified by you. Please contact the Super Administrator.'
            ], 403);
        }

        $orgId = $request->user()->organization_id;

        $request->validate([
            'name' => 'sometimes|required|string|max:255',
            'permissions' => 'sometimes|nullable|array',
            'permissions.*' => [
                'integer',
                Rule::exists('permissions', 'id')
            ],
        ]);

        if ($request->has('name')) {
            $slug = Str::slug($request->input('name'));
            $exists = Role::where('slug', $slug)->where('id', '!=', $role->id)->exists();
            if ($exists) {
                return response()->json([
                    'message' => 'The validation failed.',
                    'errors' => [
                        'name' => ['A role with a similar name already exists in your organization.']
                    ]
                ], 422);
            }
        }

        DB::transaction(function () use ($request, $role, $orgId) {
            if ($request->has('name')) {
                $role->name = $request->input('name');
                $role->slug = Str::slug($request->input('name'));
                $role->save();
            }

            if ($request->has('permissions')) {
                $role->permissions()->syncWithPivotValues($request->input('permissions') ?? [], ['organization_id' => $orgId]);
            }
        });

        return response()->json($role->load('permissions'));
    }

    /**
     * Delete a role from the organization.
     */
    public function destroyRole(Request $request, $id)
    {
        $role = Role::findOrFail($id);

        if ($role->is_system) {
            return response()->json([
                'message' => 'System roles cannot be deleted.'
            ], 403);
        }

        if ($role->users()->exists()) {
            return response()->json([
                'message' => 'Cannot delete role because it is currently assigned to one or more staff members.'
            ], 400);
        }

        $role->delete();

        return response()->json([
            'message' => 'Role deleted successfully.'
        ]);
    }

    /**
     * List all permissions in the system.
     */
    public function permissions(Request $request)
    {
        $permissions = Permission::with('group')->where('enabled', true)->get();
        return response()->json($permissions);
    }
}
