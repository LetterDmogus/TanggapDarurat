<?php

namespace App\Http\Controllers\Pelapor;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreReportRequest;
use App\Models\AgencyBranch;
use App\Models\EmergencyType;
use App\Models\Report;
use App\Models\ReportPhoto;
use App\Models\RoutingRule;
use App\Models\Step;
use App\Services\ImageOptimizer;
use App\Services\RoutingAssignmentEngine;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class ReportController extends Controller
{
    private const OTHER_EMERGENCY_NAME = 'lainnya';

    public function index(Request $request)
    {
        $this->authorize('viewAny', Report::class);

        $query = Report::query()
            ->where('user_id', $request->user()->id)
            ->with(['emergencyType:id,name,display_name'])
            ->withCount('photos')
            ->latest();

        if ($request->filled('status')) {
            $query->where('status', $request->string('status')->toString());
        }

        if ($request->filled('date_from')) {
            $query->whereDate('created_at', '>=', $request->string('date_from')->toString());
        }

        if ($request->filled('date_to')) {
            $query->whereDate('created_at', '<=', $request->string('date_to')->toString());
        }

        return Inertia::render('Pelapor/Reports/Index', [
            'items' => $query->paginate(10)->withQueryString()->through(fn (Report $report) => [
                'id' => $report->id,
                'status' => $report->status,
                'is_other_emergency' => (bool) $report->is_other_emergency,
                'other_emergency_title' => $report->other_emergency_title,
                'description' => $report->description,
                'latitude' => $report->latitude,
                'longitude' => $report->longitude,
                'created_at' => $report->created_at?->toISOString(),
                'emergency_type' => $report->emergencyType,
                'photos_count' => $report->photos_count,
            ]),
            'filters' => $request->only(['status', 'date_from', 'date_to']),
            'statuses' => ['triage', 'submitted', 'assigned', 'in_progress', 'resolved_waiting_validation', 'resolved', 'validation_failed', 'rejected'],
        ]);
    }

    public function create()
    {
        $this->authorize('create', Report::class);

        return Inertia::render('Pelapor/Reports/Create', [
            'emergencyTypes' => Cache::remember('pelapor:emergency-types:create', now()->addMinutes(10), fn () => EmergencyType::query()
                ->select('id', 'name', 'display_name', 'description', 'is_need_location', 'form_schema')
                ->where('name', '!=', self::OTHER_EMERGENCY_NAME)
                ->orderBy('display_name')
                ->get()),
        ]);
    }

    public function branchCandidates(Request $request)
    {
        $this->authorize('create', Report::class);

        $validated = $request->validate([
            'emergency_type_id' => ['required', 'integer', 'exists:emergency_types,id'],
            'latitude' => ['required', 'numeric', 'between:-90,90'],
            'longitude' => ['required', 'numeric', 'between:-180,180'],
        ]);

        $reportLat = (float) $validated['latitude'];
        $reportLng = (float) $validated['longitude'];

        $primaryAgencyIds = RoutingRule::query()
            ->where('emergency_type_id', (int) $validated['emergency_type_id'])
            ->where('is_primary', true)
            ->pluck('agency_id')
            ->unique()
            ->values();

        if ($primaryAgencyIds->isEmpty()) {
            return response()->json([
                'items' => [],
                'meta' => ['message' => 'Belum ada routing rule primary untuk tipe emergency ini.'],
            ]);
        }

        $branches = AgencyBranch::query()
            ->with('agency:id,name')
            ->whereIn('agency_id', $primaryAgencyIds->all())
            ->where('is_active', true)
            ->whereNotNull('latitude')
            ->whereNotNull('longitude')
            ->get(['id', 'agency_id', 'name', 'address', 'latitude', 'longitude']);

        $items = $branches
            ->map(function (AgencyBranch $branch) use ($reportLat, $reportLng) {
                $distanceKm = $this->distanceKm(
                    $reportLat,
                    $reportLng,
                    (float) $branch->latitude,
                    (float) $branch->longitude,
                );

                return [
                    'id' => $branch->id,
                    'name' => $branch->name,
                    'address' => $branch->address,
                    'latitude' => $branch->latitude,
                    'longitude' => $branch->longitude,
                    'agency' => $branch->agency ? [
                        'id' => $branch->agency->id,
                        'name' => $branch->agency->name,
                    ] : null,
                    'distance_km' => round($distanceKm, 2),
                ];
            })
            ->sortBy('distance_km')
            ->take(20)
            ->values()
            ->all();

        return response()->json([
            'items' => $items,
            'meta' => ['message' => count($items) > 0 ? null : 'Belum ada cabang aktif untuk routing primary.'],
        ]);
    }

    public function store(StoreReportRequest $request, RoutingAssignmentEngine $routingEngine, ImageOptimizer $imageOptimizer)
    {
        $this->authorize('create', Report::class);

        $report = DB::transaction(function () use ($request, $routingEngine, $imageOptimizer) {
            $isOtherEmergency = $request->isOtherEmergencySelection();

            $emergencyType = $isOtherEmergency
                ? $this->getOrCreateOtherEmergencyType()
                : EmergencyType::query()->select('id', 'name', 'display_name')->findOrFail($request->integer('emergency_type_id'));

            $report = Report::create([
                'emergency_type_id' => $emergencyType->id,
                'user_id' => $request->user()->id,
                'status' => $isOtherEmergency ? 'triage' : 'submitted',
                'is_other_emergency' => $isOtherEmergency,
                'description' => $request->string('description')->toString(),
                'other_emergency_title' => $isOtherEmergency ? trim((string) $request->input('other_emergency_title')) : null,
                'longitude' => $request->input('longitude'),
                'latitude' => $request->input('latitude'),
                'metadata' => $request->parsedMetadata(),
                'date' => now(),
                'client_reported_at' => $request->input('client_reported_at'),
                'client_timezone' => $request->input('client_timezone'),
                'client_utc_offset_minutes' => $request->input('client_utc_offset_minutes'),
                'geo_accuracy_m' => $request->input('geo_accuracy_m'),
                'geo_source' => $request->input('geo_source') ?: ((is_numeric($request->input('latitude')) && is_numeric($request->input('longitude'))) ? 'manual' : 'fallback'),
                'server_received_at' => now(),
            ]);

            Step::create([
                'report_id' => $report->id,
                'message' => $isOtherEmergency
                    ? 'Laporan dikirim sebagai kategori Lainnya. Menunggu klasifikasi admin.'
                    : 'Laporan dikirim.',
            ]);

            $uploadedAt = now();
            $photoRows = [];
            foreach ($request->file('photos', []) as $photo) {
                $storedPath = $imageOptimizer->storeOptimized($photo, "reports/{$report->id}", 'public');

                $photoRows[] = [
                    'report_id' => $report->id,
                    'file_path' => $storedPath,
                    'uploaded_by' => $request->user()->id,
                    'uploaded_at' => $uploadedAt,
                ];
            }

            if ($photoRows !== []) {
                ReportPhoto::insert($photoRows);
            }

            if (!$isOtherEmergency) {
                $routingEngine->routeReport($report);
            }

            return $report;
        });

        return redirect()
            ->route('pelapor.reports.show', $report)
            ->with('success', 'Laporan berhasil dikirim.');
    }

    private function distanceKm(float $lat1, float $lng1, float $lat2, float $lng2): float
    {
        $earthRadiusKm = 6371;
        $latDelta = deg2rad($lat2 - $lat1);
        $lngDelta = deg2rad($lng2 - $lng1);
        $a = sin($latDelta / 2) ** 2
            + cos(deg2rad($lat1)) * cos(deg2rad($lat2)) * sin($lngDelta / 2) ** 2;

        return 2 * $earthRadiusKm * asin(min(1, sqrt($a)));
    }

    public function show(Report $report)
    {
        $this->authorize('view', $report);

        $report->load([
            'emergencyType:id,name,display_name,is_need_location,form_schema',
            'user:id,name,email',
            'photos:id,report_id,file_path,uploaded_at',
            'steps:id,report_id,assignment_id,message,created_at',
        ]);

        return Inertia::render('Pelapor/Reports/Show', [
            'report' => [
                'id' => $report->id,
                'status' => $report->status,
                'description' => $report->description,
                'is_other_emergency' => (bool) $report->is_other_emergency,
                'other_emergency_title' => $report->other_emergency_title,
                'latitude' => $report->latitude,
                'longitude' => $report->longitude,
                'metadata' => $report->metadata ?? [],
                'metadata_schema_version' => $report->metadata_schema_version,
                'date' => $report->date?->toISOString(),
                'created_at' => $report->created_at?->toISOString(),
                'emergency_type' => $report->emergencyType,
                'photos' => $report->photos->map(fn (ReportPhoto $photo) => [
                    'id' => $photo->id,
                    'url' => '/storage/'.ltrim($photo->file_path, '/'),
                    'uploaded_at' => $photo->uploaded_at?->toISOString(),
                ])->all(),
                'steps' => $report->steps
                    ->sortBy('created_at')
                    ->values()
                    ->map(fn (Step $step) => [
                        'id' => $step->id,
                        'message' => $step->message,
                        'created_at' => $step->created_at?->toISOString(),
                    ])->all(),
            ],
        ]);
    }

    private function getOrCreateOtherEmergencyType(): EmergencyType
    {
        $type = EmergencyType::withTrashed()->firstOrCreate(
            ['name' => self::OTHER_EMERGENCY_NAME],
            [
                'display_name' => 'Lainnya',
                'description' => 'Kategori fallback untuk laporan yang belum sesuai tipe resmi.',
                'is_need_location' => false,
                'form_schema' => ['fields' => []],
            ],
        );

        if ($type->trashed()) {
            $type->restore();
        }

        return $type;
    }
}
