<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class RoleRoutingTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_role_redirects_to_admin_dashboard(): void
    {
        $user = User::factory()->create([
            'role' => 'admin',
        ]);

        $response = $this->actingAs($user)->get('/dashboard');

        $response->assertRedirect(route('admin.dashboard', absolute: false));
    }

    public function test_instansi_role_redirects_to_instansi_dashboard(): void
    {
        $user = User::factory()->create([
            'role' => 'instansi',
        ]);

        $response = $this->actingAs($user)->get('/dashboard');

        $response->assertRedirect(route('instansi.dashboard', absolute: false));
    }

    public function test_pelapor_role_redirects_to_pelapor_dashboard(): void
    {
        $user = User::factory()->create([
            'role' => 'pelapor',
        ]);

        $response = $this->actingAs($user)->get('/dashboard');

        $response->assertRedirect(route('pelapor.dashboard', absolute: false));
    }

    public function test_pelapor_cannot_access_admin_dashboard(): void
    {
        $user = User::factory()->create([
            'role' => 'pelapor',
        ]);

        $response = $this->actingAs($user)->get('/admin/dashboard');

        $response->assertForbidden();
    }
}
