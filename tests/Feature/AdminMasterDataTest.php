<?php

namespace Tests\Feature;

use App\Models\Agency;
use App\Models\EmergencyType;
use App\Models\Location;
use App\Models\RoutingRule;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AdminMasterDataTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_access_master_data_pages(): void
    {
        $admin = User::factory()->create([
            'role' => 'admin',
        ]);

        $this->actingAs($admin)->get(route('admin.agencies.index'))->assertOk();
        $this->actingAs($admin)->get(route('admin.emergency-types.index'))->assertOk();
        $this->actingAs($admin)->get(route('admin.locations.index'))->assertOk();
        $this->actingAs($admin)->get(route('admin.routing-rules.index'))->assertOk();
        $this->actingAs($admin)->get(route('admin.users.index'))->assertOk();
    }

    public function test_pelapor_cannot_access_master_data_pages(): void
    {
        $pelapor = User::factory()->create([
            'role' => 'pelapor',
        ]);

        $this->actingAs($pelapor)->get(route('admin.agencies.index'))->assertForbidden();
        $this->actingAs($pelapor)->get(route('admin.emergency-types.index'))->assertForbidden();
        $this->actingAs($pelapor)->get(route('admin.locations.index'))->assertForbidden();
        $this->actingAs($pelapor)->get(route('admin.routing-rules.index'))->assertForbidden();
        $this->actingAs($pelapor)->get(route('admin.users.index'))->assertForbidden();
    }

    public function test_only_superadmin_can_open_recycle_bin_filters(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $superadmin = User::factory()->create(['role' => 'superadmin']);
        $manager = User::factory()->create(['role' => 'manager']);

        $this->actingAs($superadmin)->get(route('admin.agencies.index', ['trashed' => 'true']))->assertOk();
        $this->actingAs($superadmin)->get(route('admin.emergency-types.index', ['trashed' => 'true']))->assertOk();
        $this->actingAs($superadmin)->get(route('admin.locations.index', ['trashed' => 'true']))->assertOk();
        $this->actingAs($superadmin)->get(route('admin.routing-rules.index', ['trashed' => 'true']))->assertOk();
        $this->actingAs($superadmin)->get(route('admin.users.index', ['trashed' => 'true']))->assertOk();

        $this->actingAs($admin)->get(route('admin.agencies.index', ['trashed' => 'true']))->assertForbidden();
        $this->actingAs($admin)->get(route('admin.emergency-types.index', ['trashed' => 'true']))->assertForbidden();
        $this->actingAs($admin)->get(route('admin.locations.index', ['trashed' => 'true']))->assertForbidden();
        $this->actingAs($admin)->get(route('admin.routing-rules.index', ['trashed' => 'true']))->assertForbidden();
        $this->actingAs($admin)->get(route('admin.users.index', ['trashed' => 'true']))->assertForbidden();

        $this->actingAs($manager)->get(route('admin.agencies.index', ['trashed' => 'true']))->assertForbidden();
        $this->actingAs($manager)->get(route('admin.emergency-types.index', ['trashed' => 'true']))->assertForbidden();
        $this->actingAs($manager)->get(route('admin.locations.index', ['trashed' => 'true']))->assertForbidden();
        $this->actingAs($manager)->get(route('admin.routing-rules.index', ['trashed' => 'true']))->assertForbidden();
        $this->actingAs($manager)->get(route('admin.users.index', ['trashed' => 'true']))->assertForbidden();
    }

    public function test_admin_can_create_master_data_records(): void
    {
        $admin = User::factory()->create([
            'role' => 'admin',
        ]);

        $this->actingAs($admin)->post(route('admin.agencies.store'), [
            'name' => 'Dinas Pemadam',
            'type' => 'fire',
            'area' => 'Jakarta Selatan',
            'contact' => '021-555-1000',
        ])->assertRedirect();

        $agency = Agency::first();

        $this->assertNotNull($agency);
        $this->assertDatabaseHas('agencies', ['name' => 'Dinas Pemadam']);

        $this->actingAs($admin)->post(route('admin.emergency-types.store'), [
            'name' => 'kebakaran',
            'display_name' => 'Kebakaran',
            'description' => 'Kondisi kebakaran',
            'is_need_location' => true,
            'form_schema_text' => '{"fields":[{"name":"severity","type":"text"}]}',
        ])->assertRedirect();

        $emergencyType = EmergencyType::first();

        $this->assertNotNull($emergencyType);
        $this->assertDatabaseHas('emergency_types', ['name' => 'kebakaran']);

        $this->actingAs($admin)->post(route('admin.locations.store'), [
            'name' => 'Pos 1',
            'location_type' => 'station',
            'longitude' => 106.8166667,
            'latitude' => -6.2,
            'agency_id' => $agency->id,
            'metadata_text' => '{"zone":"A"}',
        ])->assertRedirect();

        $location = Location::first();

        $this->assertNotNull($location);
        $this->assertDatabaseHas('locations', ['name' => 'Pos 1']);

        $this->actingAs($admin)->post(route('admin.routing-rules.store'), [
            'emergency_type_id' => $emergencyType->id,
            'agency_id' => $agency->id,
            'priority' => 1,
            'is_primary' => true,
            'area' => 'Jakarta Selatan',
        ])->assertRedirect();

        $this->assertDatabaseHas('routing_rules', [
            'emergency_type_id' => $emergencyType->id,
            'agency_id' => $agency->id,
            'priority' => 1,
        ]);
        $this->assertSame(1, RoutingRule::count());

        $this->actingAs($admin)->post(route('admin.users.store'), [
            'name' => 'Petugas Instansi',
            'email' => 'instansi@example.com',
            'password' => 'password123',
            'role' => 'instansi',
            'agency_id' => $agency->id,
        ])->assertRedirect();

        $this->assertDatabaseHas('users', [
            'email' => 'instansi@example.com',
            'role' => 'instansi',
            'agency_id' => $agency->id,
        ]);
    }

    public function test_soft_delete_restore_and_force_delete_work_for_agencies(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $agency = Agency::create([
            'name' => 'BPBD',
            'type' => 'disaster',
            'area' => 'Bandung',
            'contact' => '0800-111',
        ]);

        $this->actingAs($admin)->delete(route('admin.agencies.destroy', $agency->id))->assertRedirect();
        $this->assertSoftDeleted('agencies', ['id' => $agency->id]);

        $this->actingAs($admin)->post(route('admin.agencies.restore', $agency->id))->assertRedirect();
        $this->assertDatabaseHas('agencies', ['id' => $agency->id, 'deleted_at' => null]);

        $this->actingAs($admin)->delete(route('admin.agencies.destroy', $agency->id))->assertRedirect();
        $this->actingAs($admin)->delete(route('admin.agencies.force-delete', $agency->id))->assertRedirect();
        $this->assertDatabaseMissing('agencies', ['id' => $agency->id]);
    }
}
