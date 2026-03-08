<?php

namespace App\Http\Controllers\Manager;

use App\Exports\ManagerReportsExport;
use App\Http\Controllers\Controller;
use App\Models\Report;
use Barryvdh\DomPDF\Facade\Pdf;
use Carbon\CarbonImmutable;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Maatwebsite\Excel\Facades\Excel;

class ReportController extends Controller
{
    public function index(Request $request)
    {
        $perPage = max(1, min(100, $request->integer('per_page', 10)));
        [$dateFrom, $dateTo] = $this->resolvePeriod($request);

        $baseQuery = $this->buildFilteredQuery($request, $dateFrom, $dateTo);
        $paginatedQuery = (clone $baseQuery)->latest();

        return Inertia::render('Manager/Reports/Index', [
            'items' => $paginatedQuery->paginate($perPage)->withQueryString()->through(fn (Report $report) => [
                'id' => $report->id,
                'status' => $report->status,
                'description' => $report->description,
                'latitude' => $report->latitude,
                'longitude' => $report->longitude,
                'created_at' => $report->created_at?->toISOString(),
                'emergency_type' => $report->emergencyType,
                'pelapor' => $report->user,
            ]),
            'filters' => [
                ...$request->only(['search', 'status', 'period', 'per_page']),
                'date_from' => $dateFrom->toDateString(),
                'date_to' => $dateTo->toDateString(),
            ],
            'statuses' => ['triage', 'submitted', 'assigned', 'in_progress', 'resolved_waiting_validation', 'resolved', 'validation_failed', 'rejected'],
            'summary' => [
                'total_reports' => (clone $baseQuery)->count(),
                'date_from' => $dateFrom->toDateString(),
                'date_to' => $dateTo->toDateString(),
            ],
        ]);
    }

    public function print(Request $request)
    {
        [$dateFrom, $dateTo] = $this->resolvePeriod($request);
        $reports = $this->buildFilteredQuery($request, $dateFrom, $dateTo)
            ->latest()
            ->get();

        return response()->view('manager.reports.print', [
            'reports' => $reports,
            'dateFrom' => $dateFrom,
            'dateTo' => $dateTo,
            'printedAt' => now(),
        ]);
    }

    public function exportExcel(Request $request)
    {
        [$dateFrom, $dateTo] = $this->resolvePeriod($request);
        $reports = $this->buildFilteredQuery($request, $dateFrom, $dateTo)
            ->latest()
            ->get();

        $filename = sprintf('manager-laporan-%s-sd-%s.xlsx', $dateFrom->format('Ymd'), $dateTo->format('Ymd'));

        return Excel::download(new ManagerReportsExport($reports), $filename);
    }

    public function exportPdf(Request $request)
    {
        [$dateFrom, $dateTo] = $this->resolvePeriod($request);
        $reports = $this->buildFilteredQuery($request, $dateFrom, $dateTo)
            ->latest()
            ->get();

        $filename = sprintf('manager-laporan-%s-sd-%s.pdf', $dateFrom->format('Ymd'), $dateTo->format('Ymd'));
        $pdf = Pdf::loadView('manager.reports.pdf', [
            'reports' => $reports,
            'dateFrom' => $dateFrom,
            'dateTo' => $dateTo,
            'printedAt' => now(),
        ])->setPaper('a4', 'landscape');

        return $pdf->download($filename);
    }

    private function buildFilteredQuery(Request $request, CarbonImmutable $dateFrom, CarbonImmutable $dateTo)
    {
        $query = Report::query()
            ->with(['emergencyType:id,name,display_name', 'user:id,name,email'])
            ->whereDate('created_at', '>=', $dateFrom->toDateString())
            ->whereDate('created_at', '<=', $dateTo->toDateString());

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

        return $query;
    }

    private function resolvePeriod(Request $request): array
    {
        $today = CarbonImmutable::today();
        $period = $request->string('period')->toString();

        if ($period === '') {
            $period = 'this_month';
        }

        return match ($period) {
            'today' => [$today, $today],
            'this_week' => [$today->startOfWeek(), $today->endOfWeek()],
            'this_month' => [$today->startOfMonth(), $today->endOfMonth()],
            'custom' => $this->resolveCustomDateRange($request, $today),
            default => [$today->startOfMonth(), $today->endOfMonth()],
        };
    }

    private function resolveCustomDateRange(Request $request, CarbonImmutable $fallbackDate): array
    {
        $dateFrom = $request->date('date_from');
        $dateTo = $request->date('date_to');

        $start = $dateFrom ? CarbonImmutable::instance($dateFrom)->startOfDay() : $fallbackDate->startOfMonth();
        $end = $dateTo ? CarbonImmutable::instance($dateTo)->endOfDay() : $fallbackDate->endOfDay();

        if ($start->greaterThan($end)) {
            [$start, $end] = [$end->startOfDay(), $start->endOfDay()];
        }

        return [$start, $end];
    }
}
