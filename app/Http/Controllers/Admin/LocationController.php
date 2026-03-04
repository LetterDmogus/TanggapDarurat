<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Agency;
use App\Models\Location;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;

class LocationController extends Controller
{
    private function canViewRecycleBin(Request $request): bool
    {
        return $request->user()?->isSuperAdmin() ?? false;
    }

    public function index(Request $request)
    {
        $query = Location::with('agency');

        if ($request->filled('search')) {
            $search = $request->string('search')->toString();
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('location_type', 'like', "%{$search}%");
            });
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

        return Inertia::render('Admin/Locations/Index', [
            'items' => $query->latest()->paginate(10)->withQueryString(),
            'filters' => $request->only(['search', 'agency_id', 'trashed']),
            'agencies' => Agency::orderBy('name')->get(['id', 'name']),
            'canViewRecycleBin' => $canViewRecycleBin,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'nullable|string|max:255',
            'location_type' => 'nullable|string|max:255',
            'longitude' => 'nullable|numeric|between:-180,180',
            'latitude' => 'nullable|numeric|between:-90,90',
            'agency_id' => 'nullable|exists:agencies,id',
            'metadata_text' => 'nullable|string',
        ]);

        Location::create([
            'name' => $validated['name'] ?? null,
            'location_type' => $validated['location_type'] ?? null,
            'longitude' => $validated['longitude'] ?? null,
            'latitude' => $validated['latitude'] ?? null,
            'agency_id' => $validated['agency_id'] ?? null,
            'metadata' => $this->decodeJsonNullable($validated['metadata_text'] ?? null, 'metadata_text'),
        ]);

        return back()->with('success', 'Location created successfully.');
    }

    public function update(Request $request, Location $location)
    {
        $validated = $request->validate([
            'name' => 'nullable|string|max:255',
            'location_type' => 'nullable|string|max:255',
            'longitude' => 'nullable|numeric|between:-180,180',
            'latitude' => 'nullable|numeric|between:-90,90',
            'agency_id' => 'nullable|exists:agencies,id',
            'metadata_text' => 'nullable|string',
        ]);

        $location->update([
            'name' => $validated['name'] ?? null,
            'location_type' => $validated['location_type'] ?? null,
            'longitude' => $validated['longitude'] ?? null,
            'latitude' => $validated['latitude'] ?? null,
            'agency_id' => $validated['agency_id'] ?? null,
            'metadata' => $this->decodeJsonNullable($validated['metadata_text'] ?? null, 'metadata_text'),
        ]);

        return back()->with('success', 'Location updated successfully.');
    }

    public function destroy(Location $location)
    {
        $location->delete();

        return back()->with('success', 'Location moved to recycle bin.');
    }

    public function restore(int $id)
    {
        Location::withTrashed()->findOrFail($id)->restore();

        return back()->with('success', 'Location restored successfully.');
    }

    public function forceDelete(int $id)
    {
        Location::withTrashed()->findOrFail($id)->forceDelete();

        return back()->with('success', 'Location permanently deleted.');
    }

    private function decodeJsonNullable(?string $value, string $field)
    {
        if ($value === null || trim($value) === '') {
            return null;
        }

        $decoded = json_decode($value, true);
        if (json_last_error() !== JSON_ERROR_NONE) {
            throw ValidationException::withMessages([
                $field => 'Invalid JSON format.',
            ]);
        }

        return $decoded;
    }
}
