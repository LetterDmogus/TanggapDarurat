<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use Inertia\Inertia;
use Illuminate\Http\Request;

class ActivityLogController extends Controller
{
    public function index(Request $request)
    {
        $perPage = max(1, min(100, $request->integer('per_page', 10)));

        $query = ActivityLog::query()->latest();

        if ($request->filled('search')) {
            $search = $request->string('search')->toString();
            $query->where(function ($q) use ($search) {
                $q->where('actor_name', 'like', "%{$search}%")
                    ->orWhere('actor_email', 'like', "%{$search}%")
                    ->orWhere('action', 'like', "%{$search}%")
                    ->orWhere('path', 'like', "%{$search}%");
            });
        }

        if ($request->filled('role')) {
            $query->where('actor_role', $request->string('role')->toString());
        }

        if ($request->filled('method')) {
            $query->where('method', strtoupper($request->string('method')->toString()));
        }

        if ($request->filled('date_from')) {
            $query->whereDate('created_at', '>=', $request->string('date_from')->toString());
        }

        if ($request->filled('date_to')) {
            $query->whereDate('created_at', '<=', $request->string('date_to')->toString());
        }

        return Inertia::render('Admin/ActivityLogs/Index', [
            'items' => $query->paginate($perPage)->withQueryString()->through(fn (ActivityLog $item) => [
                'id' => $item->id,
                'actor_name' => $item->actor_name,
                'actor_email' => $item->actor_email,
                'actor_role' => $item->actor_role,
                'action' => $item->action,
                'method' => $item->method,
                'path' => $item->path,
                'status_code' => $item->status_code,
                'ip_address' => $item->ip_address,
                'user_agent' => $item->user_agent,
                'payload' => $item->payload,
                'created_at' => $item->created_at?->toISOString(),
            ]),
            'filters' => $request->only(['search', 'role', 'method', 'date_from', 'date_to', 'per_page']),
            'roles' => ['superadmin', 'admin', 'manager', 'instansi', 'pelapor'],
            'methods' => ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
        ]);
    }
}
