<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Agency;
use Illuminate\Http\Request;
use Inertia\Inertia;

class AgencyController extends Controller
{
    private function canViewRecycleBin(Request $request): bool
    {
        return $request->user()?->isSuperAdmin() ?? false;
    }

    public function index(Request $request)
    {
        $query = Agency::query();

        if ($request->filled('search')) {
            $search = $request->string('search')->toString();
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('type', 'like', "%{$search}%")
                    ->orWhere('area', 'like', "%{$search}%")
                    ->orWhere('contact', 'like', "%{$search}%");
            });
        }

        $canViewRecycleBin = $this->canViewRecycleBin($request);

        if ($request->trashed === 'true') {
            if (!$canViewRecycleBin) {
                abort(403, 'Only admin or superadmin can access recycle bin.');
            }
            $query->onlyTrashed();
        }

        return Inertia::render('Admin/Agencies/Index', [
            'items' => $query->latest()->paginate(10)->withQueryString(),
            'filters' => $request->only(['search', 'trashed']),
            'canViewRecycleBin' => $canViewRecycleBin,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'type' => 'nullable|string|max:255',
            'area' => 'nullable|string|max:255',
            'contact' => 'nullable|string|max:255',
        ]);

        Agency::create($validated);

        return back()->with('success', 'Agency created successfully.');
    }

    public function update(Request $request, Agency $agency)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'type' => 'nullable|string|max:255',
            'area' => 'nullable|string|max:255',
            'contact' => 'nullable|string|max:255',
        ]);

        $agency->update($validated);

        return back()->with('success', 'Agency updated successfully.');
    }

    public function destroy(Agency $agency)
    {
        $agency->delete();

        return back()->with('success', 'Agency moved to recycle bin.');
    }

    public function restore(int $id)
    {
        Agency::withTrashed()->findOrFail($id)->restore();

        return back()->with('success', 'Agency restored successfully.');
    }

    public function forceDelete(int $id)
    {
        Agency::withTrashed()->findOrFail($id)->forceDelete();

        return back()->with('success', 'Agency permanently deleted.');
    }
}
