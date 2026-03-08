<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Agency;
use App\Models\EmergencyType;
use App\Models\Report;
use App\Models\RoutingRule;
use App\Services\RoutingAssignmentEngine;
use Illuminate\Http\Request;
use Inertia\Inertia;

class RoutingRuleController extends Controller
{
    private function assertRecycleBinAccess(Request $request): void
    {
        if (!$this->canViewRecycleBin($request)) {
            abort(403, 'Only superadmin can access recycle bin.');
        }
    }

    private function canViewRecycleBin(Request $request): bool
    {
        return $request->user()?->isSuperAdmin() ?? false;
    }

    public function index(Request $request)
    {
        $perPage = max(1, min(100, $request->integer('per_page', 10)));
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
            $this->assertRecycleBinAccess($request);
            $query->onlyTrashed();
        }

        return Inertia::render('Admin/RoutingRules/Index', [
            'items' => $query->latest()->paginate($perPage)->withQueryString(),
            'filters' => $request->only(['search', 'emergency_type_id', 'agency_id', 'trashed', 'per_page']),
            'emergencyTypes' => EmergencyType::orderBy('name')->get(['id', 'name', 'display_name']),
            'agencies' => Agency::orderBy('name')->get(['id', 'name']),
            'canViewRecycleBin' => $canViewRecycleBin,
        ]);
    }

    public function store(Request $request, RoutingAssignmentEngine $routingEngine)
    {
        $validated = $request->validate([
            'emergency_type_id' => 'required|exists:emergency_types,id',
            'agency_id' => 'required|exists:agencies,id',
            'priority' => 'required|integer|min:1',
            'is_primary' => 'required|boolean',
            'area' => 'nullable|string|max:255',
        ]);

        RoutingRule::create($validated);
        $this->backfillAssignmentsForEmergencyType((int) $validated['emergency_type_id'], $routingEngine);

        return back()->with('success', 'Routing rule created successfully.');
    }

    public function update(Request $request, RoutingRule $routingRule, RoutingAssignmentEngine $routingEngine)
    {
        $validated = $request->validate([
            'emergency_type_id' => 'required|exists:emergency_types,id',
            'agency_id' => 'required|exists:agencies,id',
            'priority' => 'required|integer|min:1',
            'is_primary' => 'required|boolean',
            'area' => 'nullable|string|max:255',
        ]);

        $routingRule->update($validated);
        $this->backfillAssignmentsForEmergencyType((int) $validated['emergency_type_id'], $routingEngine);

        return back()->with('success', 'Routing rule updated successfully.');
    }

    public function destroy(RoutingRule $routingRule)
    {
        $routingRule->delete();

        return back()->with('success', 'Routing rule moved to recycle bin.');
    }

    public function restore(Request $request, int $id)
    {
        $this->assertRecycleBinAccess($request);
        RoutingRule::withTrashed()->findOrFail($id)->restore();

        return back()->with('success', 'Routing rule restored successfully.');
    }

    public function forceDelete(Request $request, int $id)
    {
        $this->assertRecycleBinAccess($request);
        RoutingRule::withTrashed()->findOrFail($id)->forceDelete();

        return back()->with('success', 'Routing rule permanently deleted.');
    }

    private function backfillAssignmentsForEmergencyType(int $emergencyTypeId, RoutingAssignmentEngine $routingEngine): void
    {
        Report::query()
            ->where('emergency_type_id', $emergencyTypeId)
            ->where('status', 'submitted')
            ->whereDoesntHave('assignments')
            ->orderBy('id')
            ->chunkById(100, function ($reports) use ($routingEngine): void {
                foreach ($reports as $report) {
                    $routingEngine->routeReport($report);
                }
            });
    }
}
