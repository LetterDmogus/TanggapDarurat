<?php

namespace App\Policies;

use App\Models\Report;
use App\Models\User;

class ReportPolicy
{
    public function viewAny(User $user): bool
    {
        return in_array($user->role, ['pelapor', 'admin', 'superadmin', 'manager'], true);
    }

    public function view(User $user, Report $report): bool
    {
        if (in_array($user->role, ['admin', 'superadmin', 'manager'], true)) {
            return true;
        }

        return $user->isPelapor() && $report->user_id === $user->id;
    }

    public function create(User $user): bool
    {
        return $user->isPelapor();
    }
}
