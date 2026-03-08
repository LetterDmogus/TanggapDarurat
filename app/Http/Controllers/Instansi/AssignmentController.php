<?php

namespace App\Http\Controllers\Instansi;

use App\Http\Controllers\Controller;
use App\Models\Assignment;
use App\Models\AssignmentPhoto;
use App\Models\EmergencyType;
use App\Models\Report;
use App\Models\ReportPhoto;
use App\Models\Step;
use App\Services\ImageOptimizer;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class AssignmentController extends Controller
{
    public function index(Request $request)
    {
        $agencyId = $request->user()?->agency_id;
        if (!$agencyId) {
            abort(403, 'Instansi account is not linked to any agency.');
        }

        $query = Assignment::query()
            ->with([
                'agency:id,name',
                'report:id,emergency_type_id,user_id,status,description,created_at',
                'report.emergencyType:id,name,display_name',
                'report.user:id,name',
            ])
            ->where('agency_id', $agencyId)
            ->latest();

        if ($request->filled('status')) {
            $query->where('status', $request->string('status')->toString());
        }
        if ($request->filled('q')) {
            $search = trim($request->string('q')->toString());
            if ($search !== '') {
                $query->whereHas('report', fn ($reportQuery) => $reportQuery->where('description', 'like', "%{$search}%"));
            }
        }
        if ($request->filled('emergency_type_id')) {
            $emergencyTypeId = (int) $request->integer('emergency_type_id');
            if ($emergencyTypeId > 0) {
                $query->whereHas('report', fn ($reportQuery) => $reportQuery->where('emergency_type_id', $emergencyTypeId));
            }
        }

        return Inertia::render('Instansi/Assignments/Index', [
            'items' => $query->paginate(10)->withQueryString()->through(function (Assignment $assignment) {
                $effectivePrimary = $this->isPrimaryForWorkflow($assignment);

                return [
                'id' => $assignment->id,
                'status' => $assignment->status,
                'is_primary' => $effectivePrimary,
                'description' => $assignment->description,
                'date' => $assignment->date?->toISOString(),
                'created_at' => $assignment->created_at?->toISOString(),
                'available_transitions' => array_values(array_filter(
                    Assignment::statuses(),
                    fn (string $nextStatus) => $this->canTransitionFromUI($assignment, $nextStatus),
                )),
                'can_submit_completion' => $this->canSubmitCompletion($assignment, $effectivePrimary),
                'agency' => $assignment->agency ? [
                    'id' => $assignment->agency->id,
                    'name' => $assignment->agency->name,
                ] : null,
                'report' => $assignment->report ? [
                    'id' => $assignment->report->id,
                    'status' => $assignment->report->status,
                    'description' => $assignment->report->description,
                    'created_at' => $assignment->report->created_at?->toISOString(),
                    'emergency_type' => $assignment->report->emergencyType,
                    'pelapor' => $assignment->report->user,
                ] : null,
                ];
            }),
            'filters' => $request->only(['status', 'q', 'emergency_type_id']),
            'statuses' => Assignment::statuses(),
            'emergency_types' => EmergencyType::query()
                ->orderBy('display_name')
                ->orderBy('name')
                ->get(['id', 'name', 'display_name'])
                ->map(fn (EmergencyType $type) => [
                    'id' => $type->id,
                    'name' => $type->name,
                    'display_name' => $type->display_name,
                ])
                ->all(),
        ]);
    }

    public function updateStatus(Request $request, Assignment $assignment)
    {
        $agencyId = $request->user()?->agency_id;
        if (!$agencyId || (int) $assignment->agency_id !== (int) $agencyId) {
            abort(403, 'You are not allowed to update this assignment.');
        }

        $validated = $request->validate([
            'status' => 'required|string|in:'.implode(',', Assignment::statuses()),
        ]);

        $nextStatus = $validated['status'];
        if (!$assignment->canTransitionTo($nextStatus)) {
            return back()->withErrors([
                'status' => "Invalid transition from {$assignment->status} to {$nextStatus}.",
            ]);
        }
        if (!$this->canTransitionFromUI($assignment, $nextStatus)) {
            return back()->withErrors([
                'status' => "Status {$nextStatus} untuk assignment {$assignment->status} tidak bisa diubah manual.",
            ]);
        }
        if (!$this->canTransitionWithBusinessRules($assignment, $nextStatus)) {
            return back()->withErrors([
                'status' => 'Transisi belum memenuhi prasyarat workflow.',
            ]);
        }

        $previousStatus = $assignment->status;
        $assignment->update([
            'status' => $nextStatus,
            'date' => now(),
        ]);

        $assignment->loadMissing('agency:id,name', 'report:id,status');

        Step::create([
            'report_id' => $assignment->report_id,
            'assignment_id' => $assignment->id,
            'message' => sprintf(
                'Instansi %s mengubah status assignment dari %s ke %s.',
                $assignment->agency?->name ?? 'terkait',
                $previousStatus,
                $nextStatus,
            ),
        ]);

        $isPrimary = $this->isPrimaryForWorkflow($assignment);

        if ($isPrimary && $nextStatus === Assignment::STATUS_ON_PROGRESS) {
            $this->promoteQueuedAssignmentsToPending($assignment);
        }
        if ($isPrimary && $nextStatus === Assignment::STATUS_REJECTED) {
            $this->rejectSecondaryAssignments($assignment);
        }

        if ($isPrimary) {
            $this->syncReportStatusFromPrimaryAssignment($assignment->report, $assignment);
        }

        return back()->with('success', 'Status assignment berhasil diperbarui.');
    }

    public function submitCompletion(Request $request, Assignment $assignment, ImageOptimizer $imageOptimizer)
    {
        $agencyId = $request->user()?->agency_id;
        if (!$agencyId || (int) $assignment->agency_id !== (int) $agencyId) {
            abort(403, 'You are not allowed to submit completion for this assignment.');
        }

        $isPrimary = $this->isPrimaryForWorkflow($assignment);

        if (!$this->canSubmitCompletion($assignment, $isPrimary)) {
            return back()->withErrors([
                'completion' => 'Assignment ini belum memenuhi syarat untuk submit hasil.',
            ]);
        }

        $validated = $request->validate([
            'result_note' => 'required|string|min:10|max:5000',
            'photos' => 'required|array|min:1|max:5',
            'photos.*' => 'required|image|max:5120',
        ]);

        $assignment->loadMissing('agency:id,name', 'report:id,status');
        $now = now();
        $actorId = (int) $request->user()->id;

        DB::transaction(function () use ($assignment, $validated, $now, $actorId, $imageOptimizer): void {
            $photoRows = [];
            foreach ($validated['photos'] as $photo) {
                $storedPath = $imageOptimizer->storeOptimized($photo, "assignments/{$assignment->id}", 'public');
                $photoRows[] = [
                    'assignment_id' => $assignment->id,
                    'file_path' => $storedPath,
                    'uploaded_by' => $actorId,
                    'uploaded_at' => $now,
                ];
            }

            if ($photoRows !== []) {
                AssignmentPhoto::insert($photoRows);
            }

            $assignment->update([
                'status' => Assignment::STATUS_RESOLVED,
                'description' => trim($validated['result_note']),
                'date' => $now,
                'admin_verification' => false,
            ]);

            Step::create([
                'report_id' => $assignment->report_id,
                'assignment_id' => $assignment->id,
                'message' => sprintf(
                    'Instansi %s mengirim hasil penanganan dan bukti untuk validasi admin.',
                    $assignment->agency?->name ?? 'terkait',
                ),
            ]);
        });

        if ($isPrimary) {
            $assignment->refresh();
            $report = Report::query()->find($assignment->report_id);
            if ($report) {
                $this->syncReportStatusFromPrimaryAssignment($report, $assignment);
            }
        }

        return back()->with('success', 'Hasil penanganan berhasil dikirim. Menunggu validasi admin.');
    }

    public function addStepNote(Request $request, Assignment $assignment)
    {
        $agencyId = $request->user()?->agency_id;
        if (!$agencyId || (int) $assignment->agency_id !== (int) $agencyId) {
            abort(403, 'You are not allowed to add note to this assignment.');
        }

        $validated = $request->validate([
            'message' => 'required|string|min:3|max:1000',
        ]);

        $assignment->loadMissing('agency:id,name');

        Step::create([
            'report_id' => $assignment->report_id,
            'assignment_id' => $assignment->id,
            'message' => sprintf(
                'Update status %s: %s',
                $assignment->agency?->name ?? 'terkait',
                trim($validated['message']),
            ),
        ]);

        return back()->with('success', 'Catatan tahapan berhasil ditambahkan.');
    }

    public function showReport(Request $request, Report $report)
    {
        $agencyId = $request->user()?->agency_id;
        if (!$agencyId) {
            abort(403, 'Instansi account is not linked to any agency.');
        }

        $hasAccess = Assignment::query()
            ->where('report_id', $report->id)
            ->where('agency_id', $agencyId)
            ->exists();

        if (!$hasAccess) {
            abort(403, 'You are not allowed to view this report.');
        }

        $report->load([
            'emergencyType:id,name,display_name',
            'user:id,name,email',
            'photos:id,report_id,file_path,uploaded_at',
            'steps:id,report_id,assignment_id,message,created_at',
            'assignments:id,report_id,agency_id,is_primary,status,description,date,created_at',
            'assignments.agency:id,name',
        ]);

        return Inertia::render('Instansi/Reports/Show', [
            'report' => [
                'id' => $report->id,
                'status' => $report->status,
                'description' => $report->description,
                'metadata' => $report->metadata ?? [],
                'created_at' => $report->created_at?->toISOString(),
                'date' => $report->date?->toISOString(),
                'latitude' => $report->latitude,
                'longitude' => $report->longitude,
                'emergency_type' => $report->emergencyType,
                'pelapor' => $report->user,
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
                'assignments' => $report->assignments->map(fn (Assignment $assignment) => [
                    'id' => $assignment->id,
                    'is_primary' => (bool) $assignment->is_primary,
                    'status' => $assignment->status,
                    'description' => $assignment->description,
                    'date' => $assignment->date?->toISOString(),
                    'can_manage' => (int) $assignment->agency_id === (int) $agencyId,
                    'available_transitions' => (int) $assignment->agency_id === (int) $agencyId
                        ? array_values(array_filter(
                            Assignment::statuses(),
                            fn (string $nextStatus) => $this->canTransitionFromUI($assignment, $nextStatus),
                        ))
                        : [],
                    'can_submit_completion' => (int) $assignment->agency_id === (int) $agencyId
                        ? $this->canSubmitCompletion($assignment, $this->isPrimaryForWorkflow($assignment))
                        : false,
                    'agency' => $assignment->agency ? [
                        'id' => $assignment->agency->id,
                        'name' => $assignment->agency->name,
                    ] : null,
                ])->values()->all(),
            ],
        ]);
    }

    public function showLocation(Request $request, Report $report)
    {
        $agencyId = $request->user()?->agency_id;
        if (!$agencyId) {
            abort(403, 'Instansi account is not linked to any agency.');
        }

        $hasAccess = Assignment::query()
            ->where('report_id', $report->id)
            ->where('agency_id', $agencyId)
            ->exists();

        if (!$hasAccess) {
            abort(403, 'You are not allowed to view this report location.');
        }

        $report->load([
            'emergencyType:id,name,display_name',
        ]);

        return Inertia::render('Instansi/Reports/Location', [
            'report' => [
                'id' => $report->id,
                'latitude' => $report->latitude,
                'longitude' => $report->longitude,
                'description' => $report->description,
                'emergency_type' => $report->emergencyType,
            ],
        ]);
    }

    private function canTransitionFromUI(Assignment $assignment, string $nextStatus): bool
    {
        if (!$assignment->canTransitionTo($nextStatus)) {
            return false;
        }

        // resolved must be submitted with result note + proof photos.
        if ($nextStatus === Assignment::STATUS_RESOLVED) {
            return false;
        }

        // queued -> pending must be automated after primary accepts task.
        if ($assignment->status === Assignment::STATUS_QUEUED && $nextStatus === Assignment::STATUS_PENDING) {
            return false;
        }

        return true;
    }

    private function canTransitionWithBusinessRules(Assignment $assignment, string $nextStatus): bool
    {
        return true;
    }

    private function areSecondaryAssignmentsFinal(int $reportId): bool
    {
        $nonFinalCount = Assignment::query()
            ->where('report_id', $reportId)
            ->where('is_primary', false)
            ->whereNotIn('status', [Assignment::STATUS_RESOLVED, Assignment::STATUS_REJECTED])
            ->count();

        return $nonFinalCount === 0;
    }

    private function promoteQueuedAssignmentsToPending(Assignment $primaryAssignment): void
    {
        $queuedAssignments = Assignment::query()
            ->with('agency:id,name')
            ->where('report_id', $primaryAssignment->report_id)
            ->where('id', '!=', $primaryAssignment->id)
            ->where('status', Assignment::STATUS_QUEUED)
            ->get();

        foreach ($queuedAssignments as $assignment) {
            $assignment->update([
                'status' => Assignment::STATUS_PENDING,
                'date' => now(),
            ]);

            Step::create([
                'report_id' => $assignment->report_id,
                'assignment_id' => $assignment->id,
                'message' => sprintf(
                    'Assignment instansi %s berubah dari queued ke pending setelah primary menerima tugas.',
                    $assignment->agency?->name ?? 'terkait',
                ),
            ]);
        }
    }

    private function rejectSecondaryAssignments(Assignment $primaryAssignment): void
    {
        $secondaryAssignments = Assignment::query()
            ->with('agency:id,name')
            ->where('report_id', $primaryAssignment->report_id)
            ->where('id', '!=', $primaryAssignment->id)
            ->whereNotIn('status', [Assignment::STATUS_RESOLVED, Assignment::STATUS_REJECTED])
            ->get();

        foreach ($secondaryAssignments as $assignment) {
            $previousStatus = $assignment->status;
            $assignment->update([
                'status' => Assignment::STATUS_REJECTED,
                'date' => now(),
            ]);

            Step::create([
                'report_id' => $assignment->report_id,
                'assignment_id' => $assignment->id,
                'message' => sprintf(
                    'Assignment instansi %s otomatis ditolak karena primary menolak laporan (%s -> rejected).',
                    $assignment->agency?->name ?? 'terkait',
                    $previousStatus,
                ),
            ]);
        }
    }

    private function syncReportStatusFromPrimaryAssignment(Report $report, Assignment $primaryAssignment): void
    {
        if ($primaryAssignment->status === Assignment::STATUS_ON_PROGRESS) {
            $nextReportStatus = 'in_progress';
        } elseif ($primaryAssignment->status === Assignment::STATUS_RESOLVED) {
            $nextReportStatus = 'resolved_waiting_validation';
        } elseif ($primaryAssignment->status === Assignment::STATUS_REJECTED) {
            $nextReportStatus = 'rejected';
        } else {
            $nextReportStatus = 'assigned';
        }

        if ($report->status !== $nextReportStatus) {
            $report->update(['status' => $nextReportStatus]);

            Step::create([
                'report_id' => $report->id,
                'message' => "Status laporan diperbarui menjadi {$nextReportStatus}.",
            ]);
        }
    }

    private function canSubmitCompletion(Assignment $assignment, bool $isPrimary): bool
    {
        if ($assignment->status !== Assignment::STATUS_ON_PROGRESS) {
            return false;
        }

        if (!$isPrimary) {
            return true;
        }

        return $this->areSecondaryAssignmentsFinal($assignment->report_id);
    }

    private function isPrimaryForWorkflow(Assignment $assignment): bool
    {
        if ((bool) $assignment->is_primary) {
            return true;
        }

        $hasExplicitPrimary = Assignment::query()
            ->where('report_id', $assignment->report_id)
            ->where('is_primary', true)
            ->exists();

        if ($hasExplicitPrimary) {
            return false;
        }

        $fallbackPrimaryId = Assignment::query()
            ->where('report_id', $assignment->report_id)
            ->orderBy('id')
            ->value('id');

        return (int) $assignment->id === (int) $fallbackPrimaryId;
    }
}
