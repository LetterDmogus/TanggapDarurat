<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Agency;
use App\Models\EmergencyType;
use App\Models\RoutingRule;
use Illuminate\Http\Request;
use Inertia\Inertia;

class RoutingRuleController extends Controller
{
    private function canViewRecycleBin(Request $request): bool
    {
        return $request->user()?->isSuperAdmin() ?? false;
    }

    public function index(Request $request)
    {
        $query = RoutingRule::with(['emergencyType', 'agency']);

        if ($request->filled('emergency_type_id')) {
            $query->where('emergency_type_id', $request->integer('emergency_type_id'));
        }

        if ($request->filled('agency_id')) {
            $query->where('agency_id', $request->integer('agency_id'));
        }

        if ($request->filled('search')) {
            $search = $request->string('search')->toString();
            $query->where(function ($q) use ($search) {
                $q->where('area', 'like', "%{$search}%")
                    ->orWhereHas('emergencyType', function ($sub) use ($search) {
                        $sub->where('name', 'like', "%{$search}%")
                            ->orWhere('display_name', 'like', "%{$search}%");
                    })
                    ->orWhereHas('agency', function ($sub) use ($search) {
                        $sub->where('name', 'like', "%{$search}%");
                    });
            });
        }

        $canViewRecycleBin = $this->canViewRecycleBin($request);

        if ($request->trashed === 'true') {
            if (!$canViewRecycleBin) {
                abort(403, 'Only admin or superadmin can access recycle bin.');
            }
            $query->onlyTrashed();
        }

        return Inertia::render('Admin/RoutingRules/Index', [
            'items' => $query->latest()->paginate(10)->withQueryString(),
            'filters' => $request->only(['search', 'emergency_type_id', 'agency_id', 'trashed']),
            'emergencyTypes' => EmergencyType::orderBy('name')->get(['id', 'name', 'display_name']),
            'agencies' => Agency::orderBy('name')->get(['id', 'name']),
            'canViewRecycleBin' => $canViewRecycleBin,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'emergency_type_id' => 'required|exists:emergency_types,id',
            'agency_id' => 'required|exists:agencies,id',
            'priority' => 'required|integer|min:1',
            'is_primary' => 'required|boolean',
            'area' => 'nullable|string|max:255',
        ]);

        RoutingRule::create($validated);

        return back()->with('success', 'Routing rule created successfully.');
    }

    public function update(Request $request, RoutingRule $routingRule)
    {
        $validated = $request->validate([
            'emergency_type_id' => 'required|exists:emergency_types,id',
            'agency_id' => 'required|exists:agencies,id',
            'priority' => 'required|integer|min:1',
            'is_primary' => 'required|boolean',
            'area' => 'nullable|string|max:255',
        ]);

        $routingRule->update($validated);

        return back()->with('success', 'Routing rule updated successfully.');
    }

    public function destroy(RoutingRule $routingRule)
    {
        $routingRule->delete();

        return back()->with('success', 'Routing rule moved to recycle bin.');
    }

    public function restore(int $id)
    {
        RoutingRule::withTrashed()->findOrFail($id)->restore();

        return back()->with('success', 'Routing rule restored successfully.');
    }

    public function forceDelete(int $id)
    {
        RoutingRule::withTrashed()->findOrFail($id)->forceDelete();

        return back()->with('success', 'Routing rule permanently deleted.');
    }
}
