<?php

namespace App\Http\Controllers\Api\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Domains\Security\Models\Role;
use App\Domains\Master\Models\Branch;
use App\Domains\Master\Models\Warehouse;
use App\Domains\Security\Models\UserScope;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

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
        $roles = Role::all();
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
        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|max:255|unique:users,email',
            'password' => 'required|string|min:8',
            'role_id' => 'required|exists:roles,id',
            'branch_id' => 'required|exists:branches,id',
            'warehouse_id' => 'required|exists:warehouses,id',
        ]);

        $orgId = $request->user()->organization_id;

        $user = DB::transaction(function () use ($request, $orgId) {
            $user = User::create([
                'organization_id' => $orgId,
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

        $request->validate([
            'name' => 'sometimes|required|string|max:255',
            'role_id' => 'sometimes|required|exists:roles,id',
            'branch_id' => 'sometimes|required|exists:branches,id',
            'warehouse_id' => 'sometimes|required|exists:warehouses,id',
        ]);

        DB::transaction(function () use ($request, $user) {
            if ($request->has('name')) {
                $user->name = $request->input('name');
                $user->save();
            }

            if ($request->has('role_id')) {
                $user->roles()->syncWithPivotValues([$request->input('role_id')], ['organization_id' => $user->organization_id]);
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
            $adminCount = User::whereHas('roles', function($q) {
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
}
