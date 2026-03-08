<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Report;
use Carbon\Carbon;
use Carbon\CarbonImmutable;
use Inertia\Inertia;

class DashboardController extends Controller
{
    public function index()
    {
        $today = CarbonImmutable::today();
        $yesterday = $today->subDay();
        $lastMonth = $today->subMonthNoOverflow();

        $thisWeekStart = $today->startOfWeek(Carbon::MONDAY);
        $lastWeekStart = $thisWeekStart->subWeek();

        return Inertia::render('Admin/Dashboard', [
            'analytics' => [
                'summary' => [
                    'today_reports' => Report::query()->whereBetween('created_at', [$today->startOfDay(), $today->endOfDay()])->count(),
                    'yesterday_reports' => Report::query()->whereBetween('created_at', [$yesterday->startOfDay(), $yesterday->endOfDay()])->count(),
                    'last_month_reports' => Report::query()->whereBetween('created_at', [$lastMonth->startOfMonth(), $lastMonth->endOfMonth()])->count(),
                    'triage_reports' => Report::query()->where('status', 'triage')->count(),
                    'waiting_validation_reports' => Report::query()->where('status', 'resolved_waiting_validation')->count(),
                ],
                'daily' => [
                    'today' => $this->buildHourlySeries($today),
                    'yesterday' => $this->buildHourlySeries($yesterday),
                ],
                'weekly' => [
                    'this_week' => $this->buildWeeklySeries($thisWeekStart),
                    'last_week' => $this->buildWeeklySeries($lastWeekStart),
                ],
            ],
        ]);
    }

    private function buildHourlySeries(CarbonImmutable $day): array
    {
        $counts = array_fill(0, 24, 0);

        $reports = Report::query()
            ->whereBetween('created_at', [$day->startOfDay(), $day->endOfDay()])
            ->get(['created_at']);

        foreach ($reports as $report) {
            $hour = (int) CarbonImmutable::parse($report->created_at)->hour;
            $counts[$hour]++;
        }

        $series = [];
        foreach (range(0, 23) as $hour) {
            $series[] = [
                'label' => str_pad((string) $hour, 2, '0', STR_PAD_LEFT).':00',
                'value' => $counts[$hour],
            ];
        }

        return $series;
    }

    private function buildWeeklySeries(CarbonImmutable $weekStart): array
    {
        $counts = [];
        foreach (range(0, 6) as $offset) {
            $day = $weekStart->addDays($offset)->startOfDay();
            $counts[$day->toDateString()] = 0;
        }

        $reports = Report::query()
            ->whereBetween('created_at', [$weekStart->startOfDay(), $weekStart->addDays(6)->endOfDay()])
            ->get(['created_at']);

        foreach ($reports as $report) {
            $key = CarbonImmutable::parse($report->created_at)->toDateString();
            if (array_key_exists($key, $counts)) {
                $counts[$key]++;
            }
        }

        $series = [];
        foreach (range(0, 6) as $offset) {
            $day = $weekStart->addDays($offset);
            $key = $day->toDateString();
            $series[] = [
                'label' => $day->isoFormat('ddd'),
                'date' => $key,
                'value' => $counts[$key] ?? 0,
            ];
        }

        return $series;
    }
}
