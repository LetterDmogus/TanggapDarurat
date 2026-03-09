<?php

namespace App\Http\Controllers\Instansi;

use App\Http\Controllers\Controller;
use App\Models\AgencyBranch;
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
        return $this->renderIndex($request, 'branch');
    }

    public function indexAllBranches(Request $request)
    {
        return $this->renderIndex($request, 'agency');
    }

    private function renderIndex(Request $request, string $scope)
    {
        $agencyId = $request->user()?->agency_id;
        if (!$agencyId) {
            abort(403, 'Instansi account is not linked to any agency.');
        }

        $userBranchIds = $this->resolveUserBranchIds($request, (int) $agencyId);

        $query = Assignment::query()
            ->with([
                'agency:id,name',
                'branch:id,agency_id,name',
                'report:id,emergency_type_id,user_id,status,description,created_at',
                'report.emergencyType:id,name,display_name',
                'report.user:id,name',
            ])
            ->where('agency_id', $agencyId)
            ->latest();

        if ($scope === 'branch') {
            if ($userBranchIds === []) {
                $query->whereNull('agency_branch_id');
            } else {
                $query->whereIn('agency_branch_id', $userBranchIds);
            }
        }

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
            'items' => $query->paginate(10)->withQueryString()->through(function (Assignment $assignment) use ($agencyId, $userBranchIds) {
                $effectivePrimary = $this->isPrimaryForWorkflow($assignment);
                $canManage = $this->canManageAssignmentByBranchIds($assignment, (int) $agencyId, $userBranchIds);

                return [
                    'id' => $assignment->id,
                    'status' => $assignment->status,
                    'is_primary' => $effectivePrimary,
                    'can_manage' => $canManage,
                    'description' => $assignment->description,
                    'distance_km' => $assignment->distance_km,
                    'date' => $assignment->date?->toISOString(),
                    'created_at' => $assignment->created_at?->toISOString(),
                    'available_transitions' => $canManage
                        ? array_values(array_filter(
                            Assignment::statuses(),
                            fn (string $nextStatus) => $this->canTransitionFromUI($assignment, $nextStatus),
                        ))
                        : [],
                    'can_submit_completion' => $canManage
                        ? $this->canSubmitCompletion($assignment, $effectivePrimary)
                        : false,
                    'agency' => $assignment->agency ? [
                        'id' => $assignment->agency->id,
                        'name' => $assignment->agency->name,
                    ] : null,
                    'branch' => $assignment->branch ? [
                        'id' => $assignment->branch->id,
                        'name' => $assignment->branch->name,
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
            'scope' => $scope,
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
        if (!$this->canManageAssignment($request, $assignment)) {
            abort(403, 'You are not allowed to update this assignment.');
        }

        $validated = $request->validate([
            'status' => 'required|string|in:'.implode(',', Assignment::statuses()),
            'reject_type' => 'nullable|string|in:assignment_only,report_reject',
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

        $isPrimary = $this->isPrimaryForWorkflow($assignment);
        $rejectType = $nextStatus === Assignment::STATUS_REJECTED
            ? ($validated['reject_type'] ?? ($isPrimary ? 'report_reject' : 'assignment_only'))
            : null;

        if ($nextStatus === Assignment::STATUS_REJECTED && $rejectType === 'report_reject' && !$isPrimary) {
            return back()->withErrors([
                'reject_type' => 'Reject report hanya tersedia untuk assignment primary.',
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

        if ($isPrimary && $nextStatus === Assignment::STATUS_ON_PROGRESS) {
            $this->promoteQueuedAssignmentsToPending($assignment);
        }
        if ($isPrimary && $nextStatus === Assignment::STATUS_REJECTED && $rejectType === 'report_reject') {
            $this->rejectSecondaryAssignments($assignment);
        }

        if ($isPrimary && $nextStatus === Assignment::STATUS_REJECTED && $rejectType === 'assignment_only') {
            $this->transferPrimaryAfterAssignmentReject($assignment);
        } elseif ($isPrimary) {
            $this->syncReportStatusFromPrimaryAssignment($assignment->report, $assignment);
        }

        return back()->with('success', 'Status assignment berhasil diperbarui.');
    }

    public function submitCompletion(Request $request, Assignment $assignment, ImageOptimizer $imageOptimizer)
    {
        if (!$this->canManageAssignment($request, $assignment)) {
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
        if (!$this->canManageAssignment($request, $assignment)) {
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
            'assignments:id,report_id,agency_id,agency_branch_id,is_primary,status,description,distance_km,date,created_at',
            'assignments.agency:id,name',
            'assignments.branch:id,agency_id,name',
        ]);

        $userBranchIds = $this->resolveUserBranchIds($request, (int) $agencyId);

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
                    'distance_km' => $assignment->distance_km,
                    'date' => $assignment->date?->toISOString(),
                    'can_manage' => $this->canManageAssignmentByBranchIds($assignment, (int) $agencyId, $userBranchIds),
                    'available_transitions' => $this->canManageAssignmentByBranchIds($assignment, (int) $agencyId, $userBranchIds)
                        ? array_values(array_filter(
                            Assignment::statuses(),
                            fn (string $nextStatus) => $this->canTransitionFromUI($assignment, $nextStatus),
                        ))
                        : [],
                    'can_submit_completion' => $this->canManageAssignmentByBranchIds($assignment, (int) $agencyId, $userBranchIds)
                        ? $this->canSubmitCompletion($assignment, $this->isPrimaryForWorkflow($assignment))
                        : false,
                    'agency' => $assignment->agency ? [
                        'id' => $assignment->agency->id,
                        'name' => $assignment->agency->name,
                    ] : null,
                    'branch' => $assignment->branch ? [
                        'id' => $assignment->branch->id,
                        'name' => $assignment->branch->name,
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

    private function transferPrimaryAfterAssignmentReject(Assignment $rejectedPrimary): void
    {
        $report = Report::query()->find($rejectedPrimary->report_id);
        if (!$report) {
            return;
        }

        $fallbackBranch = $this->resolveFallbackBranchInSameAgency($rejectedPrimary, $report);

        if (!$fallbackBranch) {
            if ($report->status !== 'rejected') {
                $report->update(['status' => 'rejected']);
            }
            Step::create([
                'report_id' => $report->id,
                'message' => 'Primary reject assignment-only, tetapi tidak ada cabang aktif pengganti dalam agency yang sama. Status laporan menjadi rejected.',
            ]);

            return;
        }

        $rejectedPrimary->update(['is_primary' => false]);

        $distanceKm = null;
        if (is_numeric($report->latitude) && is_numeric($report->longitude) && is_numeric($fallbackBranch->latitude) && is_numeric($fallbackBranch->longitude)) {
            $distanceKm = $this->distanceKm(
                (float) $report->latitude,
                (float) $report->longitude,
                (float) $fallbackBranch->latitude,
                (float) $fallbackBranch->longitude,
            );
        }

        $fallback = Assignment::create([
            'report_id' => $rejectedPrimary->report_id,
            'agency_id' => $rejectedPrimary->agency_id,
            'agency_branch_id' => $fallbackBranch->id,
            'is_primary' => true,
            'status' => Assignment::STATUS_PENDING,
            'description' => 'Auto fallback: primary assignment dipindahkan ke cabang aktif lain.',
            'distance_km' => $distanceKm,
            'admin_verification' => false,
            'date' => now(),
        ]);

        Step::create([
            'report_id' => $report->id,
            'assignment_id' => $fallback->id,
            'message' => sprintf(
                'Primary dipindahkan ke cabang %s (agency yang sama) setelah assignment primary sebelumnya ditolak.',
                $fallbackBranch->name,
            ),
        ]);

        $this->syncReportStatusFromPrimaryAssignment($report, $fallback);
    }

    private function resolveFallbackBranchInSameAgency(Assignment $rejectedPrimary, Report $report): ?AgencyBranch
    {
        $branches = AgencyBranch::query()
            ->where('agency_id', $rejectedPrimary->agency_id)
            ->where('is_active', true)
            ->whereNotNull('latitude')
            ->whereNotNull('longitude')
            ->when($rejectedPrimary->agency_branch_id, fn ($q) => $q->where('id', '!=', $rejectedPrimary->agency_branch_id))
            ->get();

        if ($branches->isEmpty()) {
            return null;
        }

        if (!is_numeric($report->latitude) || !is_numeric($report->longitude)) {
            return $branches->sortBy('id')->first();
        }

        $reportLat = (float) $report->latitude;
        $reportLng = (float) $report->longitude;

        return $branches->sortBy(function (AgencyBranch $branch) use ($reportLat, $reportLng) {
            return $this->distanceKm(
                $reportLat,
                $reportLng,
                (float) $branch->latitude,
                (float) $branch->longitude,
            );
        })->first();
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

    private function resolveUserBranchIds(Request $request, int $agencyId): array
    {
        $user = $request->user();
        if (!$user || (int) $user->agency_id !== $agencyId) {
            return [];
        }

        return $user->branches()
            ->where('agency_id', $agencyId)
            ->pluck('agency_branches.id')
            ->map(fn ($id) => (int) $id)
            ->all();
    }

    private function canManageAssignment(Request $request, Assignment $assignment): bool
    {
        $agencyId = $request->user()?->agency_id;
        if (!$agencyId || (int) $assignment->agency_id !== (int) $agencyId) {
            return false;
        }

        $userBranchIds = $this->resolveUserBranchIds($request, (int) $agencyId);

        return $this->canManageAssignmentByBranchIds($assignment, (int) $agencyId, $userBranchIds);
    }

    private function canManageAssignmentByBranchIds(Assignment $assignment, int $agencyId, array $userBranchIds): bool
    {
        if ((int) $assignment->agency_id !== $agencyId) {
            return false;
        }

        if ($userBranchIds === []) {
            // If user has no branch membership mapping, only allow legacy no-branch assignments.
            return $assignment->agency_branch_id === null;
        }

        return $assignment->agency_branch_id !== null
            && in_array((int) $assignment->agency_branch_id, $userBranchIds, true);
    }
}
