<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Assignment;
use App\Models\EmergencyType;
use App\Models\Report;
use App\Models\Step;
use App\Services\RoutingAssignmentEngine;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Inertia\Inertia;

class ReportController extends Controller
{
    public function index(Request $request)
    {
        $perPage = max(1, min(100, $request->integer('per_page', 10)));
        $query = Report::query()
            ->with(['emergencyType:id,name,display_name', 'user:id,name,email'])
            ->latest();

        if ($request->filled('search')) {
            $search = $request->string('search')->toString();

            $query->where(function ($q) use ($search) {
                $q->where('description', 'like', "%{$search}%")
                    ->orWhere('status', 'like', "%{$search}%")
                    ->orWhereHas('user', fn ($u) => $u->where('name', 'like', "%{$search}%"))
                    ->orWhereHas('emergencyType', fn ($t) => $t->where('display_name', 'like', "%{$search}%"));
            });
        }

        if ($request->filled('status')) {
            $query->where('status', $request->string('status')->toString());
        }

        if ($request->filled('date_from')) {
            $query->whereDate('created_at', '>=', $request->string('date_from')->toString());
        }

        if ($request->filled('date_to')) {
            $query->whereDate('created_at', '<=', $request->string('date_to')->toString());
        }

        return Inertia::render('Admin/Reports/Index', [
            'items' => $query->paginate($perPage)->withQueryString()->through(fn (Report $report) => [
                'id' => $report->id,
                'status' => $report->status,
                'description' => $report->description,
                'latitude' => $report->latitude,
                'longitude' => $report->longitude,
                'created_at' => $report->created_at?->toISOString(),
                'emergency_type' => $report->emergencyType,
                'pelapor' => $report->user,
            ]),
            'filters' => $request->only(['search', 'status', 'date_from', 'date_to', 'per_page']),
            'statuses' => ['triage', 'submitted', 'assigned', 'in_progress', 'resolved_waiting_validation', 'resolved', 'validation_failed', 'rejected'],
        ]);
    }

    public function show(Report $report)
    {
        $report->load([
            'emergencyType:id,name,display_name,description,is_need_location',
            'user:id,name,email',
            'photos:id,report_id,file_path,uploaded_at',
            'assignments:id,report_id,agency_id,agency_branch_id,is_primary,status,description,distance_km,admin_verification,date,created_at',
            'assignments.agency:id,name,type,area,contact',
            'assignments.branch:id,agency_id,name',
            'assignments.photos:id,assignment_id,file_path,uploaded_by,uploaded_at',
        ]);

        return Inertia::render('Admin/Reports/Show', [
            'report' => [
                'id' => $report->id,
                'status' => $report->status,
                'is_other_emergency' => (bool) $report->is_other_emergency,
                'other_emergency_title' => $report->other_emergency_title,
                'description' => $report->description,
                'latitude' => $report->latitude,
                'longitude' => $report->longitude,
                'metadata' => $report->metadata ?? [],
                'date' => $report->date?->toISOString(),
                'created_at' => $report->created_at?->toISOString(),
                'emergency_type' => $report->emergencyType,
                'pelapor' => $report->user,
                'photos' => $report->photos->map(fn ($photo) => [
                    'id' => $photo->id,
                    'url' => '/storage/'.ltrim($photo->file_path, '/'),
                    'uploaded_at' => $photo->uploaded_at?->toISOString(),
                ])->all(),
                'assignments' => $report->assignments->map(fn ($assignment) => [
                    'id' => $assignment->id,
                    'is_primary' => (bool) $assignment->is_primary,
                    'status' => $assignment->status,
                    'description' => $assignment->description,
                    'distance_km' => $assignment->distance_km,
                    'admin_verification' => (bool) $assignment->admin_verification,
                    'date' => $assignment->date?->toISOString(),
                    'created_at' => $assignment->created_at?->toISOString(),
                    'agency' => $assignment->agency ? [
                        'id' => $assignment->agency->id,
                        'name' => $assignment->agency->name,
                        'type' => $assignment->agency->type,
                        'area' => $assignment->agency->area,
                        'contact' => $assignment->agency->contact,
                    ] : null,
                    'branch' => $assignment->branch ? [
                        'id' => $assignment->branch->id,
                        'name' => $assignment->branch->name,
                    ] : null,
                    'photos' => $assignment->photos->map(fn ($photo) => [
                        'id' => $photo->id,
                        'url' => '/storage/'.ltrim($photo->file_path, '/'),
                        'uploaded_at' => $photo->uploaded_at?->toISOString(),
                    ])->values()->all(),
                ])->all(),
                'triaged_at' => $report->triaged_at?->toISOString(),
                'triaged_by' => $report->triaged_by,
            ],
            'emergencyTypes' => EmergencyType::query()
                ->whereNull('deleted_at')
                ->where('name', '!=', 'lainnya')
                ->orderBy('display_name')
                ->get(['id', 'name', 'display_name'])
                ->map(fn (EmergencyType $type) => [
                    'id' => $type->id,
                    'name' => $type->name,
                    'display_name' => $type->display_name,
                ])->values()->all(),
        ]);
    }

    public function classifyOther(Request $request, Report $report, RoutingAssignmentEngine $routingEngine)
    {
        if (!$report->is_other_emergency) {
            return back()->withErrors([
                'classification' => 'Laporan ini bukan kategori Lainnya.',
            ]);
        }

        $validated = $request->validate([
            'mode' => 'required|string|in:existing,new',
            'emergency_type_id' => 'nullable|integer|exists:emergency_types,id',
            'new_name' => 'nullable|string|min:3|max:120',
            'new_display_name' => 'nullable|string|min:3|max:120',
            'new_description' => 'nullable|string|max:1000',
            'new_is_need_location' => 'nullable|boolean',
            'new_form_schema' => 'nullable|array',
            'new_form_schema.*.title' => 'nullable|string|max:120',
            'new_form_schema.*.type' => 'nullable|string|in:text,number,boolean,date,select',
            'new_form_schema.*.value_name' => 'nullable|string|max:120',
            'new_form_schema.*.options' => 'nullable|array',
            'new_form_schema.*.options.*' => 'nullable|string|max:120',
        ]);

        $selectedType = null;
        if ($validated['mode'] === 'existing') {
            $selectedType = EmergencyType::query()
                ->whereNull('deleted_at')
                ->where('name', '!=', 'lainnya')
                ->find($validated['emergency_type_id'] ?? null);

            if (!$selectedType) {
                return back()->withErrors([
                    'emergency_type_id' => 'Pilih emergency type resmi yang valid.',
                ]);
            }
        } else {
            if (blank($validated['new_name'] ?? null) || blank($validated['new_display_name'] ?? null)) {
                return back()->withErrors([
                    'new_name' => 'Nama dan display name emergency type baru wajib diisi.',
                ]);
            }

            $slugName = Str::slug((string) $validated['new_name'], '_');
            if ($slugName === 'lainnya' || $slugName === '') {
                return back()->withErrors([
                    'new_name' => 'Nama tipe tidak boleh "lainnya".',
                ]);
            }

            $exists = EmergencyType::query()->where('name', $slugName)->exists();
            if ($exists) {
                return back()->withErrors([
                    'new_name' => 'Nama emergency type sudah ada.',
                ]);
            }

            $schemaFields = collect($validated['new_form_schema'] ?? [])
                ->map(function ($row) {
                    $title = trim((string) ($row['title'] ?? ''));
                    $type = strtolower(trim((string) ($row['type'] ?? 'text')));
                    $valueName = Str::snake(trim((string) ($row['value_name'] ?? '')));
                    $options = collect($row['options'] ?? [])
                        ->map(fn ($item) => trim((string) $item))
                        ->filter(fn ($item) => $item !== '')
                        ->values()
                        ->all();

                    return [
                        'title' => $title,
                        'type' => $type,
                        'value_name' => $valueName,
                        'options' => $options,
                    ];
                })
                ->filter(fn ($row) => $row['title'] !== '' || $row['value_name'] !== '')
                ->values();

            foreach ($schemaFields as $index => $row) {
                if ($row['title'] === '' || $row['value_name'] === '') {
                    return back()->withErrors([
                        "new_form_schema.{$index}.title" => 'Field title dan value name wajib diisi.',
                    ]);
                }

                if ($row['type'] === 'select' && $row['options'] === []) {
                    return back()->withErrors([
                        "new_form_schema.{$index}.options" => 'Field select wajib memiliki minimal 1 opsi.',
                    ]);
                }
            }

            $selectedType = EmergencyType::create([
                'name' => $slugName,
                'display_name' => trim((string) $validated['new_display_name']),
                'description' => $validated['new_description'] ?? null,
                'is_need_location' => (bool) ($validated['new_is_need_location'] ?? false),
                'form_schema' => ['fields' => $schemaFields->map(function ($row) {
                    $payload = [
                        'title' => $row['title'],
                        'type' => $row['type'],
                        'value_name' => $row['value_name'],
                    ];
                    if ($row['type'] === 'select') {
                        $payload['options'] = $row['options'];
                    }

                    return $payload;
                })->all()],
            ]);
        }

        DB::transaction(function () use ($report, $selectedType, $request, $routingEngine, $validated): void {
            $report->update([
                'emergency_type_id' => $selectedType->id,
                'is_other_emergency' => false,
                'status' => 'submitted',
                'triaged_at' => now(),
                'triaged_by' => $request->user()?->id,
            ]);

            Step::create([
                'report_id' => $report->id,
                'message' => $validated['mode'] === 'new'
                    ? sprintf('Admin membuat emergency type baru (%s) dan mengklasifikasikan laporan.', $selectedType->display_name ?: $selectedType->name)
                    : sprintf('Admin mengklasifikasikan laporan ke emergency type resmi: %s.', $selectedType->display_name ?: $selectedType->name),
            ]);

            $routingEngine->routeReport($report->fresh());
        });

        return redirect()
            ->route('admin.routing-rules.index', ['emergency_type_id' => $selectedType->id])
            ->with('success', 'Klasifikasi laporan berhasil disimpan. Lanjutkan atur routing rules.');
    }

    public function updateValidation(Request $request, Report $report)
    {
        $validated = $request->validate([
            'decision' => 'required|string|in:resolved,validation_failed',
        ]);

        if ($report->status !== 'resolved_waiting_validation') {
            return back()->withErrors([
                'decision' => 'Laporan tidak berada pada status menunggu validasi admin.',
            ]);
        }

        $decision = $validated['decision'];
        $resolvedAssignments = Assignment::query()
            ->withCount('photos')
            ->where('report_id', $report->id)
            ->where('status', Assignment::STATUS_RESOLVED)
            ->get();

        if ($resolvedAssignments->isEmpty()) {
            return back()->withErrors([
                'decision' => 'Belum ada assignment selesai yang bisa divalidasi.',
            ]);
        }

        $missingProofCount = $resolvedAssignments->where('photos_count', 0)->count();
        if ($missingProofCount > 0) {
            return back()->withErrors([
                'decision' => 'Ada assignment selesai tanpa foto bukti. Mohon lengkapi bukti sebelum validasi admin.',
            ]);
        }

        DB::transaction(function () use ($report, $decision): void {
            $report->update([
                'status' => $decision,
            ]);

            if ($decision === 'resolved') {
                Assignment::query()
                    ->where('report_id', $report->id)
                    ->where('status', Assignment::STATUS_RESOLVED)
                    ->update([
                        'admin_verification' => true,
                        'date' => now(),
                    ]);

                Step::create([
                    'report_id' => $report->id,
                    'message' => 'Admin memvalidasi laporan. Status akhir: resolved.',
                ]);

                return;
            }

            // Re-open assignments for rework so instansi can resubmit proof after failed validation.
            Assignment::query()
                ->where('report_id', $report->id)
                ->where('status', Assignment::STATUS_RESOLVED)
                ->update([
                    'status' => Assignment::STATUS_ON_PROGRESS,
                    'admin_verification' => false,
                    'date' => now(),
                ]);

            Step::create([
                'report_id' => $report->id,
                'message' => 'Admin menolak validasi laporan. Status berubah menjadi validation_failed dan assignment dibuka kembali untuk perbaikan.',
            ]);
        });

        return back()->with('success', 'Keputusan validasi admin berhasil disimpan.');
    }
}
