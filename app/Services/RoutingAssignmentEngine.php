<?php

namespace App\Services;

use App\Models\Assignment;
use App\Models\Location;
use App\Models\Report;
use App\Models\RoutingRule;
use App\Models\Step;
use Illuminate\Support\Collection;
use Illuminate\Support\Str;

class RoutingAssignmentEngine
{
    public function routeReport(Report $report): int
    {
        $report->loadMissing('location:id,name,location_type,metadata');

        $rules = RoutingRule::query()
            ->with('agency:id,name')
            ->where('emergency_type_id', $report->emergency_type_id)
            ->orderBy('priority')
            ->orderByDesc('is_primary')
            ->get(['id', 'agency_id', 'priority', 'is_primary', 'area']);

        if ($rules->isEmpty()) {
            return 0;
        }

        $filteredRules = $this->filterRulesByAreaContext($rules, $report->location);

        $created = 0;
        $now = now();
        foreach ($filteredRules->values() as $index => $rule) {
            $assignment = Assignment::query()->firstOrCreate(
                [
                    'report_id' => $report->id,
                    'agency_id' => $rule->agency_id,
                ],
                [
                    'status' => $index === 0 ? Assignment::STATUS_PENDING : Assignment::STATUS_QUEUED,
                    'is_primary' => (bool) $rule->is_primary,
                    'description' => $this->buildDescription($rule),
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

    private function filterRulesByAreaContext(Collection $rules, ?Location $location): Collection
    {
        if (!$location) {
            $globalRules = $rules->filter(fn (RoutingRule $rule) => blank($rule->area));

            return $globalRules->isNotEmpty() ? $globalRules : $rules;
        }

        $locationHaystack = Str::lower(trim(
            ($location->name ?? '').' '.($location->location_type ?? '').' '.$this->stringifyMetadata($location->metadata)
        ));

        $areaMatched = $rules->filter(function (RoutingRule $rule) use ($locationHaystack) {
            if (blank($rule->area)) {
                return false;
            }

            return Str::contains($locationHaystack, Str::lower(trim((string) $rule->area)));
        });

        if ($areaMatched->isNotEmpty()) {
            return $areaMatched;
        }

        $globalRules = $rules->filter(fn (RoutingRule $rule) => blank($rule->area));

        return $globalRules->isNotEmpty() ? $globalRules : $rules;
    }

    private function stringifyMetadata(mixed $metadata): string
    {
        if (!is_array($metadata)) {
            return '';
        }

        return Str::lower(implode(' ', array_map(fn ($v) => (string) $v, $metadata)));
    }

    private function buildDescription(RoutingRule $rule): string
    {
        $parts = ['Auto-assigned by routing rule'];
        if ($rule->is_primary) {
            $parts[] = 'primary';
        }
        if (!blank($rule->area)) {
            $parts[] = 'area: '.trim((string) $rule->area);
        }

        return implode(' | ', $parts).'.';
    }
}
