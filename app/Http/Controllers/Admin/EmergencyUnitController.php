<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\EmergencyUnit;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;

class EmergencyUnitController extends Controller
{
    public function index(Request $request)
    {
        $query = EmergencyUnit::with('user');

        if ($request->search) {
            $query->where('unit_name', 'like', '%' . $request->search . '%')
                ->orWhere('location_name', 'like', '%' . $request->search . '%');
        }

        if ($request->type) {
            $query->where('type', $request->type);
        }

        if ($request->status) {
            $query->where('status', $request->status);
        }

        if ($request->trashed === 'true') {
            $query->onlyTrashed();
        }

        return Inertia::render('Admin/EmergencyUnits/Index', [
            'items' => $query->latest()->paginate(10)->withQueryString(),
            'filters' => $request->only(['search', 'type', 'status', 'trashed']),
            'responders' => User::where('role', 'responder')->get(['id', 'name']),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'unit_name' => 'required|string|max:255',
            'type' => 'required|in:ambulance,fire_truck,police_car',
            'status' => 'required|in:available,busy,offline',
            'user_id' => 'nullable|exists:users,id',
            'location_name' => 'nullable|string|max:255',
            'current_latitude' => 'nullable|numeric|between:-90,90',
            'current_longitude' => 'nullable|numeric|between:-180,180',
        ]);

        EmergencyUnit::create($validated);

        return back()->with('success', 'Emergency unit created successfully.');
    }

    public function update(Request $request, EmergencyUnit $emergencyUnit)
    {
        $validated = $request->validate([
            'unit_name' => 'required|string|max:255',
            'type' => 'required|in:ambulance,fire_truck,police_car',
            'status' => 'required|in:available,busy,offline',
            'user_id' => 'nullable|exists:users,id',
            'location_name' => 'nullable|string|max:255',
            'current_latitude' => 'nullable|numeric|between:-90,90',
            'current_longitude' => 'nullable|numeric|between:-180,180',
        ]);

        $emergencyUnit->update($validated);

        return back()->with('success', 'Emergency unit updated successfully.');
    }

    public function destroy(EmergencyUnit $emergencyUnit)
    {
        $emergencyUnit->delete();
        return back()->with('success', 'Unit moved to trash.');
    }

    public function restore($id)
    {
        EmergencyUnit::withTrashed()->findOrFail($id)->restore();
        return back()->with('success', 'Unit restored successfully.');
    }

    public function forceDelete($id)
    {
        EmergencyUnit::withTrashed()->findOrFail($id)->forceDelete();
        return back()->with('success', 'Unit permanently deleted.');
    }
}
