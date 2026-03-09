<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Agency;
use App\Models\AgencyBranch;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;

class AgencyBranchController extends Controller
{
    public function index(Request $request)
    {
        $perPage = max(1, min(100, $request->integer('per_page', 10)));

        $query = AgencyBranch::query()
            ->with(['agency:id,name', 'users:id,name,agency_id'])
            ->latest();

        if ($request->filled('agency_id')) {
            $query->where('agency_id', $request->integer('agency_id'));
        }

        if ($request->filled('search')) {
            $search = $request->string('search')->toString();
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('address', 'like', "%{$search}%")
                    ->orWhereHas('agency', fn ($aq) => $aq->where('name', 'like', "%{$search}%"));
            });
        }

        return Inertia::render('Admin/AgencyBranches/Index', [
            'items' => $query->paginate($perPage)->withQueryString()->through(fn (AgencyBranch $branch) => [
                'id' => $branch->id,
                'name' => $branch->name,
                'address' => $branch->address,
                'latitude' => $branch->latitude,
                'longitude' => $branch->longitude,
                'is_active' => (bool) $branch->is_active,
                'coverage_radius_km' => $branch->coverage_radius_km,
                'agency' => $branch->agency ? [
                    'id' => $branch->agency->id,
                    'name' => $branch->agency->name,
                ] : null,
                'members' => $branch->users->map(fn (User $user) => [
                    'id' => $user->id,
                    'name' => $user->name,
                ])->values()->all(),
                'created_at' => $branch->created_at?->toISOString(),
            ]),
            'filters' => $request->only(['search', 'agency_id', 'per_page']),
            'agencies' => Agency::query()->orderBy('name')->get(['id', 'name'])->map(fn (Agency $agency) => [
                'id' => $agency->id,
                'name' => $agency->name,
            ])->values()->all(),
            'instansiUsers' => User::query()
                ->where('role', 'instansi')
                ->whereNotNull('agency_id')
                ->orderBy('name')
                ->get(['id', 'name', 'agency_id'])
                ->map(fn (User $user) => [
                    'id' => $user->id,
                    'name' => $user->name,
                    'agency_id' => $user->agency_id,
                ])->values()->all(),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'agency_id' => 'required|exists:agencies,id',
            'name' => 'required|string|max:255',
            'address' => 'nullable|string|max:255',
            'latitude' => 'nullable|numeric|between:-90,90',
            'longitude' => 'nullable|numeric|between:-180,180',
            'is_active' => 'required|boolean',
            'coverage_radius_km' => 'nullable|numeric|min:0',
            'member_user_ids' => 'nullable|array',
            'member_user_ids.*' => 'integer|exists:users,id',
        ]);

        $branch = AgencyBranch::create([
            'agency_id' => $validated['agency_id'],
            'name' => $validated['name'],
            'address' => $validated['address'] ?? null,
            'latitude' => $validated['latitude'] ?? null,
            'longitude' => $validated['longitude'] ?? null,
            'is_active' => (bool) $validated['is_active'],
            'coverage_radius_km' => $validated['coverage_radius_km'] ?? null,
        ]);

        $memberIds = collect($validated['member_user_ids'] ?? [])
            ->map(fn ($id) => (int) $id)
            ->all();

        $allowedMembers = User::query()
            ->whereIn('id', $memberIds)
            ->where('role', 'instansi')
            ->where('agency_id', $branch->agency_id)
            ->pluck('id')
            ->map(fn ($id) => (int) $id)
            ->all();

        if ($allowedMembers !== []) {
            $syncData = [];
            foreach ($allowedMembers as $index => $userId) {
                $syncData[$userId] = ['is_primary_branch' => $index === 0];
            }
            $branch->users()->sync($syncData);
        }

        return back()->with('success', 'Branch created successfully.');
    }

    public function update(Request $request, AgencyBranch $agencyBranch)
    {
        $validated = $request->validate([
            'agency_id' => 'required|exists:agencies,id',
            'name' => 'required|string|max:255',
            'address' => 'nullable|string|max:255',
            'latitude' => 'nullable|numeric|between:-90,90',
            'longitude' => 'nullable|numeric|between:-180,180',
            'is_active' => 'required|boolean',
            'coverage_radius_km' => 'nullable|numeric|min:0',
            'member_user_ids' => 'nullable|array',
            'member_user_ids.*' => 'integer|exists:users,id',
        ]);

        $agencyBranch->update([
            'agency_id' => $validated['agency_id'],
            'name' => $validated['name'],
            'address' => $validated['address'] ?? null,
            'latitude' => $validated['latitude'] ?? null,
            'longitude' => $validated['longitude'] ?? null,
            'is_active' => (bool) $validated['is_active'],
            'coverage_radius_km' => $validated['coverage_radius_km'] ?? null,
        ]);

        $memberIds = collect($validated['member_user_ids'] ?? [])
            ->map(fn ($id) => (int) $id)
            ->all();

        $allowedMembers = User::query()
            ->whereIn('id', $memberIds)
            ->where('role', 'instansi')
            ->where('agency_id', $agencyBranch->agency_id)
            ->pluck('id')
            ->map(fn ($id) => (int) $id)
            ->all();

        $syncData = [];
        foreach ($allowedMembers as $index => $userId) {
            $syncData[$userId] = ['is_primary_branch' => $index === 0];
        }
        $agencyBranch->users()->sync($syncData);

        return back()->with('success', 'Branch updated successfully.');
    }

    public function destroy(AgencyBranch $agencyBranch)
    {
        $agencyBranch->users()->detach();
        $agencyBranch->delete();

        return back()->with('success', 'Branch deleted successfully.');
    }
}
