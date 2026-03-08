<?php

namespace Tests\Feature;

use App\Models\ActivityLog;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ActivityLogTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_access_activity_log_page(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);

        $this->actingAs($admin)
            ->get(route('admin.activity-logs.index'))
            ->assertOk();
    }

    public function test_manager_cannot_access_activity_log_page(): void
    {
        $manager = User::factory()->create(['role' => 'manager']);

        $this->actingAs($manager)
            ->get(route('admin.activity-logs.index'))
            ->assertForbidden();
    }

    public function test_get_request_is_not_recorded_in_activity_log(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);

        $this->actingAs($admin)
            ->get(route('admin.dashboard'))
            ->assertOk();

        $this->assertDatabaseCount('activity_logs', 0);
    }

    public function test_post_request_is_recorded_in_activity_log(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);

        $this->actingAs($admin)
            ->post(route('admin.users.store'), [
                'name' => 'User Baru',
                'email' => 'new-user@example.com',
                'password' => 'password123',
                'role' => 'pelapor',
                'agency_id' => null,
            ])
            ->assertRedirect();

        $this->assertDatabaseHas('activity_logs', [
            'user_id' => $admin->id,
            'actor_role' => 'admin',
            'action' => 'admin.users.store',
            'method' => 'POST',
        ]);

        $log = ActivityLog::query()->latest()->first();
        $this->assertNotNull($log);
        $this->assertSame('/admin/users', $log->path);
    }

    public function test_patch_request_is_recorded_in_activity_log(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $target = User::factory()->create(['role' => 'pelapor']);

        $this->actingAs($admin)
            ->patch(route('admin.users.update', $target), [
                'name' => 'Updated Name',
                'email' => $target->email,
                'password' => '',
                'role' => 'pelapor',
                'agency_id' => null,
            ])
            ->assertRedirect();

        $this->assertDatabaseHas('activity_logs', [
            'user_id' => $admin->id,
            'action' => 'admin.users.update',
            'method' => 'PATCH',
        ]);
    }
}
