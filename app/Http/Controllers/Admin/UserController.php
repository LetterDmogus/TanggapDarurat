<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Agency;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class UserController extends Controller
{
    private function canViewRecycleBin(Request $request): bool
    {
        return $request->user()?->isSuperAdmin() ?? false;
    }

    public function index(Request $request)
    {
        $query = User::with('agency');

        if ($request->filled('search')) {
            $search = $request->string('search')->toString();
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%")
                    ->orWhereHas('agency', function ($agencyQuery) use ($search) {
                        $agencyQuery->where('name', 'like', "%{$search}%");
                    });
            });
        }

        if ($request->filled('role')) {
            $query->where('role', $request->string('role')->toString());
        }

        if ($request->filled('agency_id')) {
            $query->where('agency_id', $request->integer('agency_id'));
        }

        $canViewRecycleBin = $this->canViewRecycleBin($request);

        if ($request->trashed === 'true') {
            if (!$canViewRecycleBin) {
                abort(403, 'Only admin or superadmin can access recycle bin.');
            }
            $query->onlyTrashed();
        }

        return Inertia::render('Admin/Users/Index', [
            'items' => $query->latest()->paginate(10)->withQueryString(),
            'filters' => $request->only(['search', 'role', 'agency_id', 'trashed']),
            'agencies' => Agency::orderBy('name')->get(['id', 'name']),
            'roles' => ['superadmin', 'admin', 'manager', 'instansi', 'pelapor'],
            'canViewRecycleBin' => $canViewRecycleBin,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users,email',
            'password' => 'required|string|min:8',
            'role' => 'required|in:superadmin,admin,manager,instansi,pelapor',
            'agency_id' => 'nullable|exists:agencies,id',
        ]);

        $validated['password'] = bcrypt($validated['password']);

        User::create($validated);

        return back()->with('success', 'User created successfully.');
    }

    public function update(Request $request, User $user)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => ['required', 'string', 'email', 'max:255', Rule::unique('users', 'email')->ignore($user->id)],
            'password' => 'nullable|string|min:8',
            'role' => 'required|in:superadmin,admin,manager,instansi,pelapor',
            'agency_id' => 'nullable|exists:agencies,id',
        ]);

        if (empty($validated['password'])) {
            unset($validated['password']);
        } else {
            $validated['password'] = bcrypt($validated['password']);
        }

        $user->update($validated);

        return back()->with('success', 'User updated successfully.');
    }

    public function destroy(User $user)
    {
        if ($user->id === auth()->id()) {
            return back()->withErrors(['error' => 'You cannot delete your own account.']);
        }

        $user->delete();

        return back()->with('success', 'User moved to recycle bin.');
    }

    public function restore(int $id)
    {
        User::withTrashed()->findOrFail($id)->restore();

        return back()->with('success', 'User restored successfully.');
    }

    public function forceDelete(int $id)
    {
        $user = User::withTrashed()->findOrFail($id);
        if ($user->id === auth()->id()) {
            return back()->withErrors(['error' => 'You cannot permanently delete your own account.']);
        }

        $user->forceDelete();

        return back()->with('success', 'User permanently deleted.');
    }
}
