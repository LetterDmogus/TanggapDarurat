<?php

namespace App\Services;

use App\Models\Assignment;
use App\Models\AgencyBranch;
use App\Models\Report;
use App\Models\RoutingRule;
use App\Models\Step;
use Illuminate\Support\Collection;
use Illuminate\Support\Str;

class RoutingAssignmentEngine
{
    public function routeReport(Report $report): int
    {
        $rules = RoutingRule::query()
            ->with(['agency:id,name', 'agency.branches:id,agency_id,name,latitude,longitude,is_active'])
            ->where('emergency_type_id', $report->emergency_type_id)
            ->orderBy('priority')
            ->orderByDesc('is_primary')
            ->get(['id', 'agency_id', 'priority', 'is_primary', 'area']);

        if ($rules->isEmpty()) {
            return 0;
        }

        $filteredRules = $this->filterRulesByAreaContext($rules, $report);

        $created = 0;
        $now = now();
        $reportLatitude = $this->resolveReportLatitude($report);
        $reportLongitude = $this->resolveReportLongitude($report);

        foreach ($filteredRules->values() as $index => $rule) {
            [$selectedBranch, $distanceKm] = $this->resolveNearestBranch($rule->agency?->branches ?? collect(), $reportLatitude, $reportLongitude);

            $assignment = Assignment::query()->firstOrCreate(
                [
                    'report_id' => $report->id,
                    'agency_id' => $rule->agency_id,
                ],
                [
                    'agency_branch_id' => $selectedBranch?->id,
                    'status' => $index === 0 ? Assignment::STATUS_PENDING : Assignment::STATUS_QUEUED,
                    'is_primary' => (bool) $rule->is_primary,
                    'description' => $this->buildDescription($rule, $selectedBranch, $distanceKm),
                    'distance_km' => $distanceKm,
                    'admin_verification' => false,
                    'date' => $now,
                ],
            );

            if ($assignment->wasRecentlyCreated) {
                Step::create([
                    'report_id' => $report->id,
                    'assignment_id' => $assignment->id,
                    'message' => sprintf(
                        'Instansi %s telah ditugaskan, menunggu status.',
                        $rule->agency?->name ?? 'terkait'
                    ),
                ]);
                $created++;
            }
        }

        if ($created > 0 && $report->status === 'submitted') {
            $report->update(['status' => 'assigned']);
        }

        return $created;
    }

    private function resolveReportLatitude(Report $report): ?float
    {
        if (is_numeric($report->latitude)) {
            return (float) $report->latitude;
        }

        return null;
    }

    private function resolveReportLongitude(Report $report): ?float
    {
        if (is_numeric($report->longitude)) {
            return (float) $report->longitude;
        }

        return null;
    }

    private function resolveNearestBranch(Collection $branches, ?float $reportLatitude, ?float $reportLongitude): array
    {
        if ($reportLatitude === null || $reportLongitude === null) {
            return [null, null];
        }

        $activeBranches = $branches
            ->filter(fn (AgencyBranch $branch) => $branch->is_active && is_numeric($branch->latitude) && is_numeric($branch->longitude))
            ->values();

        if ($activeBranches->isEmpty()) {
            return [null, null];
        }

        $nearestBranch = null;
        $nearestDistance = null;
        foreach ($activeBranches as $branch) {
            $distance = $this->distanceKm(
                $reportLatitude,
                $reportLongitude,
                (float) $branch->latitude,
                (float) $branch->longitude,
            );

            if ($nearestDistance === null || $distance < $nearestDistance) {
                $nearestDistance = $distance;
                $nearestBranch = $branch;
            }
        }

        return [$nearestBranch, $nearestDistance];
    }

    private function filterRulesByAreaContext(Collection $rules, Report $report): Collection
    {
        $globalRules = $rules->filter(fn (RoutingRule $rule) => blank($rule->area));
        $reportHaystack = Str::lower(trim(
            ($report->description ?? '').' '.$this->stringifyMetadata($report->metadata)
        ));

        if ($reportHaystack === '') {
            return $globalRules->isNotEmpty() ? $globalRules : $rules;
        }

        $areaMatched = $rules->filter(function (RoutingRule $rule) use ($reportHaystack) {
            if (blank($rule->area)) {
                return false;
            }

            return Str::contains($reportHaystack, Str::lower(trim((string) $rule->area)));
        });

        if ($areaMatched->isNotEmpty()) {
            return $areaMatched;
        }

        return $globalRules->isNotEmpty() ? $globalRules : $rules;
    }

    private function stringifyMetadata(mixed $metadata): string
    {
        if (!is_array($metadata)) {
            return '';
        }

        return Str::lower(implode(' ', array_map(fn ($v) => (string) $v, $metadata)));
    }

    private function buildDescription(RoutingRule $rule, ?AgencyBranch $branch, ?float $distanceKm): string
    {
        $parts = ['Auto-assigned by routing rule'];
        if ($rule->is_primary) {
            $parts[] = 'primary';
        }
        if (!blank($rule->area)) {
            $parts[] = 'area: '.trim((string) $rule->area);
        }
        if ($branch) {
            $parts[] = 'branch: '.$branch->name;
        }
        if ($distanceKm !== null) {
            $parts[] = 'distance: '.number_format($distanceKm, 2).' km';
        }

        return implode(' | ', $parts).'.';
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
}
