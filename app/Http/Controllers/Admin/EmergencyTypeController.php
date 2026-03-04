<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\EmergencyType;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;

class EmergencyTypeController extends Controller
{
    private function canViewRecycleBin(Request $request): bool
    {
        return $request->user()?->isSuperAdmin() ?? false;
    }

    public function index(Request $request)
    {
        $query = EmergencyType::query();

        if ($request->filled('search')) {
            $search = $request->string('search')->toString();
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('display_name', 'like', "%{$search}%")
                    ->orWhere('description', 'like', "%{$search}%");
            });
        }

        if ($request->filled('is_need_location')) {
            $query->where('is_need_location', $request->boolean('is_need_location'));
        }

        $canViewRecycleBin = $this->canViewRecycleBin($request);

        if ($request->trashed === 'true') {
            if (!$canViewRecycleBin) {
                abort(403, 'Only admin or superadmin can access recycle bin.');
            }
            $query->onlyTrashed();
        }

        return Inertia::render('Admin/EmergencyTypes/Index', [
            'items' => $query->latest()->paginate(10)->withQueryString(),
            'filters' => $request->only(['search', 'is_need_location', 'trashed']),
            'canViewRecycleBin' => $canViewRecycleBin,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255|unique:emergency_types,name',
            'display_name' => 'nullable|string|max:255',
            'description' => 'nullable|string',
            'is_need_location' => 'required|boolean',
            'form_schema_text' => 'nullable|string',
        ]);

        EmergencyType::create([
            'name' => $validated['name'],
            'display_name' => $validated['display_name'] ?? null,
            'description' => $validated['description'] ?? null,
            'is_need_location' => $validated['is_need_location'],
            'form_schema' => $this->decodeJsonNullable($validated['form_schema_text'] ?? null, 'form_schema_text'),
        ]);

        return back()->with('success', 'Emergency type created successfully.');
    }

    public function update(Request $request, EmergencyType $emergencyType)
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255', Rule::unique('emergency_types', 'name')->ignore($emergencyType->id)],
            'display_name' => 'nullable|string|max:255',
            'description' => 'nullable|string',
            'is_need_location' => 'required|boolean',
            'form_schema_text' => 'nullable|string',
        ]);

        $emergencyType->update([
            'name' => $validated['name'],
            'display_name' => $validated['display_name'] ?? null,
            'description' => $validated['description'] ?? null,
            'is_need_location' => $validated['is_need_location'],
            'form_schema' => $this->decodeJsonNullable($validated['form_schema_text'] ?? null, 'form_schema_text'),
        ]);

        return back()->with('success', 'Emergency type updated successfully.');
    }

    public function destroy(EmergencyType $emergencyType)
    {
        $emergencyType->delete();

        return back()->with('success', 'Emergency type moved to recycle bin.');
    }

    public function restore(int $id)
    {
        EmergencyType::withTrashed()->findOrFail($id)->restore();

        return back()->with('success', 'Emergency type restored successfully.');
    }

    public function forceDelete(int $id)
    {
        EmergencyType::withTrashed()->findOrFail($id)->forceDelete();

        return back()->with('success', 'Emergency type permanently deleted.');
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
