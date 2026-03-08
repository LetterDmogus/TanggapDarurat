<?php

namespace Tests\Feature;

use App\Models\Agency;
use App\Models\EmergencyType;
use App\Models\Report;
use App\Models\RoutingRule;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AdminOtherEmergencyClassificationTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_classify_other_report_to_existing_emergency_type_and_trigger_routing(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $pelapor = User::factory()->create(['role' => 'pelapor']);

        $otherType = EmergencyType::create([
            'name' => 'lainnya',
            'display_name' => 'Lainnya',
            'is_need_location' => false,
            'form_schema' => ['fields' => []],
        ]);
        $officialType = EmergencyType::create([
            'name' => 'insiden_teknis',
            'display_name' => 'Insiden Teknis',
            'is_need_location' => false,
            'form_schema' => ['fields' => []],
        ]);
        $agency = Agency::create(['name' => 'Tim Teknis']);
        RoutingRule::create([
            'emergency_type_id' => $officialType->id,
            'agency_id' => $agency->id,
            'priority' => 1,
            'is_primary' => true,
        ]);

        $report = Report::create([
            'emergency_type_id' => $otherType->id,
            'user_id' => $pelapor->id,
            'status' => 'triage',
            'is_other_emergency' => true,
            'other_emergency_title' => 'Kasus belum terklasifikasi',
            'description' => 'Perlu klasifikasi admin.',
            'metadata' => [],
            'metadata_schema_version' => 1,
        ]);

        $this->actingAs($admin)->patch(route('admin.reports.classify-other', $report), [
            'mode' => 'existing',
            'emergency_type_id' => $officialType->id,
        ])->assertRedirect(route('admin.routing-rules.index', ['emergency_type_id' => $officialType->id]));

        $this->assertDatabaseHas('reports', [
            'id' => $report->id,
            'emergency_type_id' => $officialType->id,
            'is_other_emergency' => false,
            'status' => 'assigned',
            'triaged_by' => $admin->id,
        ]);
        $this->assertDatabaseHas('assignments', [
            'report_id' => $report->id,
            'agency_id' => $agency->id,
            'status' => 'pending',
        ]);
    }

    public function test_admin_can_shortcut_create_new_emergency_type_from_other_report(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $pelapor = User::factory()->create(['role' => 'pelapor']);
        $otherType = EmergencyType::create([
            'name' => 'lainnya',
            'display_name' => 'Lainnya',
            'is_need_location' => false,
            'form_schema' => ['fields' => []],
        ]);

        $report = Report::create([
            'emergency_type_id' => $otherType->id,
            'user_id' => $pelapor->id,
            'status' => 'triage',
            'is_other_emergency' => true,
            'other_emergency_title' => 'Kasus baru',
            'description' => 'Belum ada tipe resmi.',
            'metadata' => [],
            'metadata_schema_version' => 1,
        ]);

        $response = $this->actingAs($admin)->patch(route('admin.reports.classify-other', $report), [
            'mode' => 'new',
            'new_name' => 'insiden satelit',
            'new_display_name' => 'Insiden Satelit',
            'new_description' => 'Gangguan layanan satelit',
            'new_is_need_location' => false,
            'new_form_schema' => [
                [
                    'title' => 'Dampak',
                    'type' => 'select',
                    'value_name' => 'dampak',
                    'options' => ['ringan', 'berat'],
                ],
            ],
        ]);

        $this->assertDatabaseHas('emergency_types', [
            'name' => 'insiden_satelit',
            'display_name' => 'Insiden Satelit',
        ]);

        $newType = EmergencyType::query()->where('name', 'insiden_satelit')->first();
        $this->assertNotNull($newType);
        $response->assertRedirect(route('admin.routing-rules.index', ['emergency_type_id' => $newType->id]));
        $this->assertSame('Dampak', data_get($newType->form_schema, 'fields.0.title'));

        $this->assertDatabaseHas('reports', [
            'id' => $report->id,
            'emergency_type_id' => $newType->id,
            'status' => 'submitted',
            'is_other_emergency' => false,
            'triaged_by' => $admin->id,
        ]);
    }

    public function test_creating_routing_rule_after_classification_backfills_unassigned_submitted_report(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $pelapor = User::factory()->create(['role' => 'pelapor']);
        $agency = Agency::create(['name' => 'Agency Backfill']);
        $otherType = EmergencyType::create([
            'name' => 'lainnya',
            'display_name' => 'Lainnya',
            'is_need_location' => false,
            'form_schema' => ['fields' => []],
        ]);

        $report = Report::create([
            'emergency_type_id' => $otherType->id,
            'user_id' => $pelapor->id,
            'status' => 'triage',
            'is_other_emergency' => true,
            'other_emergency_title' => 'Kasus backfill',
            'description' => 'Butuh klasifikasi lalu routing.',
            'metadata' => [],
            'metadata_schema_version' => 1,
        ]);

        $this->actingAs($admin)->patch(route('admin.reports.classify-other', $report), [
            'mode' => 'new',
            'new_name' => 'insiden sensor',
            'new_display_name' => 'Insiden Sensor',
            'new_is_need_location' => false,
        ])->assertRedirect();

        $newType = EmergencyType::query()->where('name', 'insiden_sensor')->first();
        $this->assertNotNull($newType);
        $this->assertDatabaseHas('reports', [
            'id' => $report->id,
            'status' => 'submitted',
            'emergency_type_id' => $newType->id,
        ]);
        $this->assertDatabaseMissing('assignments', [
            'report_id' => $report->id,
        ]);

        $this->actingAs($admin)->post(route('admin.routing-rules.store'), [
            'emergency_type_id' => $newType->id,
            'agency_id' => $agency->id,
            'priority' => 1,
            'is_primary' => true,
            'area' => null,
        ])->assertRedirect();

        $this->assertDatabaseHas('assignments', [
            'report_id' => $report->id,
            'agency_id' => $agency->id,
            'status' => 'pending',
        ]);
        $this->assertDatabaseHas('reports', [
            'id' => $report->id,
            'status' => 'assigned',
        ]);
    }
}
