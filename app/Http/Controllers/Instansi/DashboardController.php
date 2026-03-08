<?php

namespace App\Http\Controllers\Instansi;

use App\Http\Controllers\Controller;
use App\Models\Assignment;
use Inertia\Inertia;

class DashboardController extends Controller
{
    public function index()
    {
        $agencyId = auth()->user()?->agency_id;
        if (!$agencyId) {
            abort(403, 'Instansi account is not linked to any agency.');
        }

        $attentionQuery = Assignment::query()
            ->where('agency_id', $agencyId)
            ->whereIn('status', [Assignment::STATUS_PENDING, Assignment::STATUS_QUEUED]);

        return Inertia::render('Instansi/Dashboard', [
            'stats' => [
                'pending_count' => (clone $attentionQuery)->where('status', Assignment::STATUS_PENDING)->count(),
                'queued_count' => (clone $attentionQuery)->where('status', Assignment::STATUS_QUEUED)->count(),
                'attention_count' => $attentionQuery->count(),
            ],
            'attention_items' => Assignment::query()
                ->with([
                    'report:id,description,emergency_type_id,created_at',
                    'report.emergencyType:id,name,display_name',
                ])
                ->where('agency_id', $agencyId)
                ->whereIn('status', [Assignment::STATUS_PENDING, Assignment::STATUS_QUEUED])
                ->latest()
                ->limit(5)
                ->get()
                ->map(fn (Assignment $assignment) => [
                    'id' => $assignment->id,
                    'status' => $assignment->status,
                    'report' => $assignment->report ? [
                        'id' => $assignment->report->id,
                        'description' => $assignment->report->description,
                        'created_at' => $assignment->report->created_at?->toISOString(),
                        'emergency_type' => $assignment->report->emergencyType,
                    ] : null,
                ])
                ->values()
                ->all(),
        ]);
    }
}
