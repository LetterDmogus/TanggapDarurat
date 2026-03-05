<?php

namespace App\Http\Controllers\Pelapor;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreReportRequest;
use App\Models\EmergencyType;
use App\Models\Report;
use App\Models\ReportPhoto;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;

class ReportController extends Controller
{
    public function index(Request $request)
    {
        $this->authorize('viewAny', Report::class);

        $query = Report::query()
            ->where('user_id', $request->user()->id)
            ->with(['emergencyType:id,name,display_name', 'photos:id,report_id,file_path'])
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
                'description' => $report->description,
                'latitude' => $report->latitude,
                'longitude' => $report->longitude,
                'created_at' => $report->created_at?->toISOString(),
                'emergency_type' => $report->emergencyType,
                'photos_count' => $report->photos->count(),
            ]),
            'filters' => $request->only(['status', 'date_from', 'date_to']),
            'statuses' => ['submitted', 'assigned', 'in_progress', 'resolved', 'rejected'],
        ]);
    }

    public function create()
    {
        $this->authorize('create', Report::class);

        return Inertia::render('Pelapor/Reports/Create', [
            'emergencyTypes' => EmergencyType::query()
                ->select('id', 'name', 'display_name', 'description', 'is_need_location', 'form_schema')
                ->orderBy('display_name')
                ->get(),
        ]);
    }

    public function store(StoreReportRequest $request)
    {
        $this->authorize('create', Report::class);

        $report = DB::transaction(function () use ($request) {
            $report = Report::create([
                'emergency_type_id' => $request->integer('emergency_type_id'),
                'user_id' => $request->user()->id,
                'status' => 'submitted',
                'description' => $request->string('description')->toString(),
                'longitude' => $request->input('longitude'),
                'latitude' => $request->input('latitude'),
                'metadata' => $request->parsedMetadata(),
                'metadata_schema_version' => 1,
                'date' => now(),
            ]);

            foreach ($request->file('photos', []) as $photo) {
                $storedPath = $photo->store("reports/{$report->id}", 'public');

                ReportPhoto::create([
                    'report_id' => $report->id,
                    'file_path' => $storedPath,
                    'uploaded_by' => $request->user()->id,
                    'uploaded_at' => now(),
                ]);
            }

            return $report;
        });

        return redirect()
            ->route('pelapor.reports.show', $report)
            ->with('success', 'Laporan berhasil dikirim.');
    }

    public function show(Report $report)
    {
        $this->authorize('view', $report);

        $report->load([
            'emergencyType:id,name,display_name,is_need_location,form_schema',
            'user:id,name,email',
            'photos:id,report_id,file_path,uploaded_at',
        ]);

        return Inertia::render('Pelapor/Reports/Show', [
            'report' => [
                'id' => $report->id,
                'status' => $report->status,
                'description' => $report->description,
                'latitude' => $report->latitude,
                'longitude' => $report->longitude,
                'metadata' => $report->metadata ?? [],
                'metadata_schema_version' => $report->metadata_schema_version,
                'date' => $report->date?->toISOString(),
                'created_at' => $report->created_at?->toISOString(),
                'emergency_type' => $report->emergencyType,
                'photos' => $report->photos->map(fn (ReportPhoto $photo) => [
                    'id' => $photo->id,
                    'url' => Storage::disk('public')->url($photo->file_path),
                    'uploaded_at' => $photo->uploaded_at?->toISOString(),
                ])->all(),
            ],
        ]);
    }
}
