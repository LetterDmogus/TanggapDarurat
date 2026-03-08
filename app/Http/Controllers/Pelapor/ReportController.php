<?php

namespace App\Http\Controllers\Pelapor;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreReportRequest;
use App\Models\Assignment;
use App\Models\EmergencyType;
use App\Models\Location;
use App\Models\Report;
use App\Models\ReportPhoto;
use App\Models\Step;
use App\Services\ImageOptimizer;
use App\Services\RoutingAssignmentEngine;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Inertia\Inertia;

class ReportController extends Controller
{
    private const AREA_MATCH_RADIUS_KM = 2.0;
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
            'locations' => Cache::remember('pelapor:locations:create', now()->addMinutes(10), fn () => Location::query()
                ->with('agency:id,name')
                ->whereNotNull('latitude')
                ->whereNotNull('longitude')
                ->orderBy('name')
                ->get(['id', 'name', 'location_type', 'longitude', 'latitude', 'agency_id'])
                ->map(fn (Location $location) => [
                    'id' => $location->id,
                    'name' => $location->name,
                    'location_type' => $location->location_type,
                    'longitude' => $location->longitude,
                    'latitude' => $location->latitude,
                    'agency' => $location->agency ? [
                        'id' => $location->agency->id,
                        'name' => $location->agency->name,
                    ] : null,
                ])->values()),
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

            $matchedLocation = $this->findNearestLocation(
                $request->input('latitude'),
                $request->input('longitude'),
            );

            $report = Report::create([
                'emergency_type_id' => $emergencyType->id,
                'user_id' => $request->user()->id,
                'location_id' => $matchedLocation?->id,
                'status' => $isOtherEmergency ? 'triage' : 'submitted',
                'is_other_emergency' => $isOtherEmergency,
                'description' => $request->string('description')->toString(),
                'other_emergency_title' => $isOtherEmergency ? trim((string) $request->input('other_emergency_title')) : null,
                'longitude' => $request->input('longitude'),
                'latitude' => $request->input('latitude'),
                'metadata' => $request->parsedMetadata(),
                'date' => now(),
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
                $createdAssignments = $routingEngine->routeReport($report);

                // Backward-compatible fallback for legacy area-auto assignment when no routing rule matches.
                if ($createdAssignments === 0) {
                    $this->createAreaAssignmentIfRelevant($report, $emergencyType, $matchedLocation);
                }
            }

            return $report;
        });

        return redirect()
            ->route('pelapor.reports.show', $report)
            ->with('success', 'Laporan berhasil dikirim.');
    }

    private function createAreaAssignmentIfRelevant(Report $report, EmergencyType $emergencyType, ?Location $location): void
    {
        if (!$location?->agency_id || !$this->isFireOrBuildingDamageType($emergencyType)) {
            return;
        }

        $assignment = Assignment::query()->firstOrCreate(
            [
                'report_id' => $report->id,
                'agency_id' => $location->agency_id,
            ],
            [
                'status' => 'pending',
                'is_primary' => true,
                'description' => 'Auto-assigned berdasarkan area lokasi laporan.',
                'admin_verification' => false,
                'date' => now(),
            ],
        );

        if ($assignment->wasRecentlyCreated) {
            Step::create([
                'report_id' => $report->id,
                'assignment_id' => $assignment->id,
                'message' => 'Instansi telah ditugaskan, menunggu status.',
            ]);
        }
    }

    private function findNearestLocation(mixed $latitude, mixed $longitude): ?Location
    {
        if (!is_numeric($latitude) || !is_numeric($longitude)) {
            return null;
        }

        $lat = (float) $latitude;
        $lng = (float) $longitude;

        $locations = Location::query()
            ->whereNotNull('agency_id')
            ->whereNotNull('latitude')
            ->whereNotNull('longitude')
            ->get(['id', 'agency_id', 'latitude', 'longitude']);

        $nearest = null;
        $nearestDistance = null;

        foreach ($locations as $location) {
            $distance = $this->distanceKm(
                $lat,
                $lng,
                (float) $location->latitude,
                (float) $location->longitude,
            );

            if ($nearestDistance === null || $distance < $nearestDistance) {
                $nearestDistance = $distance;
                $nearest = $location;
            }
        }

        if ($nearestDistance === null || $nearestDistance > self::AREA_MATCH_RADIUS_KM) {
            return null;
        }

        return $nearest;
    }

    private function isFireOrBuildingDamageType(EmergencyType $emergencyType): bool
    {
        $haystack = Str::lower(trim(($emergencyType->name ?? '').' '.($emergencyType->display_name ?? '')));

        return Str::contains($haystack, [
            'kebakaran',
            'fire',
            'bangunan rusak',
            'bangunan_rusak',
            'kerusakan bangunan',
            'building damage',
        ]);
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
