<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Report;
use Illuminate\Http\Request;
use Inertia\Inertia;

class AssignmentController extends Controller
{
    public function index(Request $request)
    {
        $perPage = max(1, min(50, $request->integer('per_page', 10)));

        $query = Report::query()
            ->with([
                'emergencyType:id,name,display_name',
                'user:id,name,email',
                'assignments:id,report_id,agency_id,status,description,admin_verification,date,created_at',
                'assignments.agency:id,name,type,area,contact',
            ])
            ->whereHas('assignments')
            ->latest();

        if ($request->filled('search')) {
            $search = $request->string('search')->toString();

            $query->where(function ($q) use ($search) {
                $q->where('description', 'like', "%{$search}%")
                    ->orWhere('status', 'like', "%{$search}%")
                    ->orWhereHas('user', fn ($u) => $u->where('name', 'like', "%{$search}%"))
                    ->orWhereHas('emergencyType', fn ($t) => $t->where('display_name', 'like', "%{$search}%"))
                    ->orWhereHas('assignments.agency', fn ($a) => $a->where('name', 'like', "%{$search}%"));
            });
        }

        if ($request->filled('status')) {
            $query->where('status', $request->string('status')->toString());
        }

        return Inertia::render('Admin/Assignments/Index', [
            'items' => $query->paginate($perPage)->withQueryString()->through(fn (Report $report) => [
                'id' => $report->id,
                'status' => $report->status,
                'description' => $report->description,
                'created_at' => $report->created_at?->toISOString(),
                'emergency_type' => $report->emergencyType,
                'pelapor' => $report->user,
                'assignments' => $report->assignments->map(fn ($assignment) => [
                    'id' => $assignment->id,
                    'status' => $assignment->status,
                    'description' => $assignment->description,
                    'admin_verification' => (bool) $assignment->admin_verification,
                    'date' => $assignment->date?->toISOString(),
                    'created_at' => $assignment->created_at?->toISOString(),
                    'agency' => $assignment->agency ? [
                        'id' => $assignment->agency->id,
                        'name' => $assignment->agency->name,
                        'type' => $assignment->agency->type,
                        'area' => $assignment->agency->area,
                        'contact' => $assignment->agency->contact,
                    ] : null,
                ])->all(),
            ]),
            'filters' => $request->only(['search', 'status', 'per_page']),
            'statuses' => ['submitted', 'assigned', 'in_progress', 'resolved_waiting_validation', 'resolved', 'validation_failed', 'rejected'],
        ]);
    }
}
