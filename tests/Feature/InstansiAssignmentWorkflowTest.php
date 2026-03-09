<?php

namespace Tests\Feature;

use App\Models\Agency;
use App\Models\AgencyBranch;
use App\Models\Assignment;
use App\Models\EmergencyType;
use App\Models\Report;
use App\Models\Step;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class InstansiAssignmentWorkflowTest extends TestCase
{
    use RefreshDatabase;

    public function test_instansi_can_only_see_its_own_assignments(): void
    {
        $agencyA = Agency::create(['name' => 'Instansi A']);
        $agencyB = Agency::create(['name' => 'Instansi B']);

        $instansiA = User::factory()->create(['role' => 'instansi', 'agency_id' => $agencyA->id]);
        $pelapor = User::factory()->create(['role' => 'pelapor']);
        $type = EmergencyType::create(['name' => 'banjir', 'display_name' => 'Banjir', 'is_need_location' => false]);

        $reportA = Report::create([
            'emergency_type_id' => $type->id,
            'user_id' => $pelapor->id,
            'status' => 'assigned',
            'description' => 'Laporan A',
            'metadata' => [],
            'metadata_schema_version' => 1,
        ]);
        $reportB = Report::create([
            'emergency_type_id' => $type->id,
            'user_id' => $pelapor->id,
            'status' => 'assigned',
            'description' => 'Laporan B',
            'metadata' => [],
            'metadata_schema_version' => 1,
        ]);

        Assignment::create([
            'report_id' => $reportA->id,
            'agency_id' => $agencyA->id,
            'is_primary' => true,
            'status' => Assignment::STATUS_PENDING,
        ]);
        Assignment::create([
            'report_id' => $reportB->id,
            'agency_id' => $agencyB->id,
            'is_primary' => true,
            'status' => Assignment::STATUS_PENDING,
        ]);

        $response = $this->actingAs($instansiA)->get(route('instansi.assignments.index'));
        $response->assertOk();
        $response->assertSee('Laporan A');
        $response->assertDontSee('Laporan B');
    }

    public function test_instansi_can_transition_assignment_status_and_report_syncs(): void
    {
        Storage::fake('public');

        $agency = Agency::create(['name' => 'Instansi Workflow']);
        $instansi = User::factory()->create(['role' => 'instansi', 'agency_id' => $agency->id]);
        $pelapor = User::factory()->create(['role' => 'pelapor']);
        $type = EmergencyType::create(['name' => 'kebakaran', 'display_name' => 'Kebakaran', 'is_need_location' => false]);

        $report = Report::create([
            'emergency_type_id' => $type->id,
            'user_id' => $pelapor->id,
            'status' => 'assigned',
            'description' => 'Laporan workflow',
            'metadata' => [],
            'metadata_schema_version' => 1,
        ]);

        $assignment = Assignment::create([
            'report_id' => $report->id,
            'agency_id' => $agency->id,
            'is_primary' => true,
            'status' => Assignment::STATUS_PENDING,
        ]);

        $this->actingAs($instansi)
            ->patch(route('instansi.assignments.update-status', $assignment), ['status' => Assignment::STATUS_ON_PROGRESS])
            ->assertRedirect();

        $this->assertDatabaseHas('assignments', [
            'id' => $assignment->id,
            'status' => Assignment::STATUS_ON_PROGRESS,
        ]);
        $this->assertDatabaseHas('reports', [
            'id' => $report->id,
            'status' => 'in_progress',
        ]);
        $this->assertDatabaseHas('steps', [
            'report_id' => $report->id,
            'assignment_id' => $assignment->id,
            'message' => 'Instansi Instansi Workflow mengubah status assignment dari pending ke on_progress.',
        ]);

        $this->actingAs($instansi)
            ->post(route('instansi.assignments.submit-completion', $assignment), [
                'result_note' => 'Penanganan selesai, area aman, warga sudah dievakuasi.',
                'photos' => [UploadedFile::fake()->image('bukti-1.jpg')],
            ])
            ->assertRedirect();

        $this->assertDatabaseHas('assignments', [
            'id' => $assignment->id,
            'status' => Assignment::STATUS_RESOLVED,
        ]);
        $this->assertDatabaseHas('reports', [
            'id' => $report->id,
            'status' => 'resolved_waiting_validation',
        ]);
        $this->assertDatabaseCount('assignment_photos', 1);
        $storedPhoto = \App\Models\AssignmentPhoto::query()->first();
        $this->assertNotNull($storedPhoto);
        Storage::disk('public')->assertExists($storedPhoto->file_path);
        $this->assertDatabaseHas('steps', [
            'report_id' => $report->id,
            'assignment_id' => $assignment->id,
            'message' => 'Instansi Instansi Workflow mengirim hasil penanganan dan bukti untuk validasi admin.',
        ]);
        $this->assertGreaterThanOrEqual(3, Step::query()->where('report_id', $report->id)->count());
    }

    public function test_instansi_cannot_apply_invalid_transition(): void
    {
        $agency = Agency::create(['name' => 'Instansi Invalid']);
        $instansi = User::factory()->create(['role' => 'instansi', 'agency_id' => $agency->id]);
        $pelapor = User::factory()->create(['role' => 'pelapor']);
        $type = EmergencyType::create(['name' => 'medis', 'display_name' => 'Darurat Medis', 'is_need_location' => false]);

        $report = Report::create([
            'emergency_type_id' => $type->id,
            'user_id' => $pelapor->id,
            'status' => 'assigned',
            'description' => 'Laporan invalid',
            'metadata' => [],
            'metadata_schema_version' => 1,
        ]);

        $assignment = Assignment::create([
            'report_id' => $report->id,
            'agency_id' => $agency->id,
            'is_primary' => true,
            'status' => Assignment::STATUS_PENDING,
        ]);

        $this->actingAs($instansi)
            ->from(route('instansi.assignments.index'))
            ->patch(route('instansi.assignments.update-status', $assignment), ['status' => Assignment::STATUS_RESOLVED])
            ->assertRedirect(route('instansi.assignments.index'));

        $this->assertDatabaseHas('assignments', [
            'id' => $assignment->id,
            'status' => Assignment::STATUS_PENDING,
        ]);
    }

    public function test_secondary_assignment_changes_do_not_update_report_status(): void
    {
        $agencyPrimary = Agency::create(['name' => 'Primary Agency']);
        $agencySecondary = Agency::create(['name' => 'Secondary Agency']);
        $instansiSecondary = User::factory()->create(['role' => 'instansi', 'agency_id' => $agencySecondary->id]);
        $pelapor = User::factory()->create(['role' => 'pelapor']);
        $type = EmergencyType::create(['name' => 'banjir', 'display_name' => 'Banjir', 'is_need_location' => false]);

        $report = Report::create([
            'emergency_type_id' => $type->id,
            'user_id' => $pelapor->id,
            'status' => 'assigned',
            'description' => 'Laporan secondary',
            'metadata' => [],
            'metadata_schema_version' => 1,
        ]);

        Assignment::create([
            'report_id' => $report->id,
            'agency_id' => $agencyPrimary->id,
            'is_primary' => true,
            'status' => Assignment::STATUS_PENDING,
        ]);
        $secondary = Assignment::create([
            'report_id' => $report->id,
            'agency_id' => $agencySecondary->id,
            'is_primary' => false,
            'status' => Assignment::STATUS_QUEUED,
        ]);

        $this->actingAs($instansiSecondary)
            ->patch(route('instansi.assignments.update-status', $secondary), ['status' => Assignment::STATUS_REJECTED])
            ->assertRedirect();

        $this->assertDatabaseHas('reports', [
            'id' => $report->id,
            'status' => 'assigned',
        ]);
    }

    public function test_queued_assignment_auto_promotes_to_pending_when_primary_accepts(): void
    {
        $agencyPrimary = Agency::create(['name' => 'Primary Promote']);
        $agencySecondary = Agency::create(['name' => 'Secondary Promote']);
        $instansiPrimary = User::factory()->create(['role' => 'instansi', 'agency_id' => $agencyPrimary->id]);
        $pelapor = User::factory()->create(['role' => 'pelapor']);
        $type = EmergencyType::create(['name' => 'kecelakaan', 'display_name' => 'Kecelakaan', 'is_need_location' => false]);

        $report = Report::create([
            'emergency_type_id' => $type->id,
            'user_id' => $pelapor->id,
            'status' => 'assigned',
            'description' => 'Laporan promote',
            'metadata' => [],
            'metadata_schema_version' => 1,
        ]);

        $primary = Assignment::create([
            'report_id' => $report->id,
            'agency_id' => $agencyPrimary->id,
            'is_primary' => true,
            'status' => Assignment::STATUS_PENDING,
        ]);
        $secondary = Assignment::create([
            'report_id' => $report->id,
            'agency_id' => $agencySecondary->id,
            'is_primary' => false,
            'status' => Assignment::STATUS_QUEUED,
        ]);

        $this->actingAs($instansiPrimary)
            ->patch(route('instansi.assignments.update-status', $primary), ['status' => Assignment::STATUS_ON_PROGRESS])
            ->assertRedirect();

        $this->assertDatabaseHas('assignments', [
            'id' => $secondary->id,
            'status' => Assignment::STATUS_PENDING,
        ]);
    }

    public function test_queued_assignment_cannot_be_manually_changed_to_pending(): void
    {
        $agencySecondary = Agency::create(['name' => 'Secondary Manual']);
        $instansiSecondary = User::factory()->create(['role' => 'instansi', 'agency_id' => $agencySecondary->id]);
        $pelapor = User::factory()->create(['role' => 'pelapor']);
        $type = EmergencyType::create(['name' => 'banjir2', 'display_name' => 'Banjir 2', 'is_need_location' => false]);

        $report = Report::create([
            'emergency_type_id' => $type->id,
            'user_id' => $pelapor->id,
            'status' => 'assigned',
            'description' => 'Laporan queued manual',
            'metadata' => [],
            'metadata_schema_version' => 1,
        ]);

        $secondary = Assignment::create([
            'report_id' => $report->id,
            'agency_id' => $agencySecondary->id,
            'is_primary' => false,
            'status' => Assignment::STATUS_QUEUED,
        ]);

        $this->actingAs($instansiSecondary)
            ->from(route('instansi.assignments.index'))
            ->patch(route('instansi.assignments.update-status', $secondary), ['status' => Assignment::STATUS_PENDING])
            ->assertRedirect(route('instansi.assignments.index'));

        $this->assertDatabaseHas('assignments', [
            'id' => $secondary->id,
            'status' => Assignment::STATUS_QUEUED,
        ]);
    }

    public function test_primary_cannot_resolve_before_secondary_are_final(): void
    {
        $agencyPrimary = Agency::create(['name' => 'Primary Resolve Guard']);
        $agencySecondary = Agency::create(['name' => 'Secondary Resolve Guard']);
        $instansiPrimary = User::factory()->create(['role' => 'instansi', 'agency_id' => $agencyPrimary->id]);
        $pelapor = User::factory()->create(['role' => 'pelapor']);
        $type = EmergencyType::create(['name' => 'guard', 'display_name' => 'Guard', 'is_need_location' => false]);

        $report = Report::create([
            'emergency_type_id' => $type->id,
            'user_id' => $pelapor->id,
            'status' => 'in_progress',
            'description' => 'Resolve guard case',
            'metadata' => [],
            'metadata_schema_version' => 1,
        ]);

        $primary = Assignment::create([
            'report_id' => $report->id,
            'agency_id' => $agencyPrimary->id,
            'is_primary' => true,
            'status' => Assignment::STATUS_ON_PROGRESS,
        ]);
        Assignment::create([
            'report_id' => $report->id,
            'agency_id' => $agencySecondary->id,
            'is_primary' => false,
            'status' => Assignment::STATUS_PENDING,
        ]);

        $this->actingAs($instansiPrimary)
            ->from(route('instansi.assignments.index'))
            ->patch(route('instansi.assignments.update-status', $primary), ['status' => Assignment::STATUS_RESOLVED])
            ->assertRedirect(route('instansi.assignments.index'));

        $this->assertDatabaseHas('assignments', [
            'id' => $primary->id,
            'status' => Assignment::STATUS_ON_PROGRESS,
        ]);
    }

    public function test_primary_reject_cascades_secondary_and_rejects_report(): void
    {
        $agencyPrimary = Agency::create(['name' => 'Primary Reject']);
        $agencySecondary = Agency::create(['name' => 'Secondary Reject']);
        $instansiPrimary = User::factory()->create(['role' => 'instansi', 'agency_id' => $agencyPrimary->id]);
        $pelapor = User::factory()->create(['role' => 'pelapor']);
        $type = EmergencyType::create(['name' => 'reject_case', 'display_name' => 'Reject Case', 'is_need_location' => false]);

        $report = Report::create([
            'emergency_type_id' => $type->id,
            'user_id' => $pelapor->id,
            'status' => 'assigned',
            'description' => 'Primary reject case',
            'metadata' => [],
            'metadata_schema_version' => 1,
        ]);

        $primary = Assignment::create([
            'report_id' => $report->id,
            'agency_id' => $agencyPrimary->id,
            'is_primary' => true,
            'status' => Assignment::STATUS_PENDING,
        ]);
        $secondary = Assignment::create([
            'report_id' => $report->id,
            'agency_id' => $agencySecondary->id,
            'is_primary' => false,
            'status' => Assignment::STATUS_PENDING,
        ]);

        $this->actingAs($instansiPrimary)
            ->patch(route('instansi.assignments.update-status', $primary), ['status' => Assignment::STATUS_REJECTED])
            ->assertRedirect();

        $this->assertDatabaseHas('assignments', [
            'id' => $primary->id,
            'status' => Assignment::STATUS_REJECTED,
        ]);
        $this->assertDatabaseHas('assignments', [
            'id' => $secondary->id,
            'status' => Assignment::STATUS_REJECTED,
        ]);
        $this->assertDatabaseHas('reports', [
            'id' => $report->id,
            'status' => 'rejected',
        ]);
    }

    public function test_primary_reject_assignment_only_moves_to_other_branch_in_same_agency(): void
    {
        $agencyPrimary = Agency::create(['name' => 'Primary Reject Assignment Only']);
        $instansiPrimary = User::factory()->create(['role' => 'instansi', 'agency_id' => $agencyPrimary->id]);
        $pelapor = User::factory()->create(['role' => 'pelapor']);
        $type = EmergencyType::create(['name' => 'reject_assignment_only_case', 'display_name' => 'Reject Assignment Only Case', 'is_need_location' => false]);

        $branchA = AgencyBranch::create([
            'agency_id' => $agencyPrimary->id,
            'name' => 'Primary Branch A',
            'latitude' => 1.1300000,
            'longitude' => 104.0500000,
            'is_active' => true,
        ]);
        $branchB = AgencyBranch::create([
            'agency_id' => $agencyPrimary->id,
            'name' => 'Primary Branch B',
            'latitude' => 1.1310000,
            'longitude' => 104.0510000,
            'is_active' => true,
        ]);

        $report = Report::create([
            'emergency_type_id' => $type->id,
            'user_id' => $pelapor->id,
            'status' => 'assigned',
            'description' => 'Primary reject assignment only case',
            'latitude' => 1.1309000,
            'longitude' => 104.0509000,
            'metadata' => [],
            'metadata_schema_version' => 1,
        ]);

        $primary = Assignment::create([
            'report_id' => $report->id,
            'agency_id' => $agencyPrimary->id,
            'agency_branch_id' => $branchA->id,
            'is_primary' => true,
            'status' => Assignment::STATUS_PENDING,
        ]);

        DB::table('agency_branch_user')->insert([
            'agency_branch_id' => $branchA->id,
            'user_id' => $instansiPrimary->id,
            'is_primary_branch' => true,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $this->actingAs($instansiPrimary)
            ->patch(route('instansi.assignments.update-status', $primary), [
                'status' => Assignment::STATUS_REJECTED,
                'reject_type' => 'assignment_only',
            ])
            ->assertRedirect();

        $this->assertDatabaseHas('assignments', [
            'id' => $primary->id,
            'status' => Assignment::STATUS_REJECTED,
            'is_primary' => false,
        ]);

        $fallback = Assignment::query()
            ->where('report_id', $report->id)
            ->where('id', '!=', $primary->id)
            ->first();

        $this->assertNotNull($fallback);
        $this->assertDatabaseHas('assignments', [
            'id' => $fallback->id,
            'agency_id' => $agencyPrimary->id,
            'agency_branch_id' => $branchB->id,
            'status' => Assignment::STATUS_PENDING,
            'is_primary' => true,
        ]);
        $this->assertDatabaseHas('reports', [
            'id' => $report->id,
            'status' => 'assigned',
        ]);
    }

    public function test_instansi_can_add_manual_step_note(): void
    {
        $agency = Agency::create(['name' => 'Instansi Catatan']);
        $instansi = User::factory()->create(['role' => 'instansi', 'agency_id' => $agency->id]);
        $pelapor = User::factory()->create(['role' => 'pelapor']);
        $type = EmergencyType::create(['name' => 'note_case', 'display_name' => 'Note Case', 'is_need_location' => false]);

        $report = Report::create([
            'emergency_type_id' => $type->id,
            'user_id' => $pelapor->id,
            'status' => 'assigned',
            'description' => 'Manual note case',
            'metadata' => [],
            'metadata_schema_version' => 1,
        ]);
        $assignment = Assignment::create([
            'report_id' => $report->id,
            'agency_id' => $agency->id,
            'is_primary' => true,
            'status' => Assignment::STATUS_PENDING,
        ]);

        $this->actingAs($instansi)
            ->post(route('instansi.assignments.add-step', $assignment), ['message' => 'Tim sedang briefing sebelum berangkat'])
            ->assertRedirect();

        $this->assertDatabaseHas('steps', [
            'report_id' => $report->id,
            'assignment_id' => $assignment->id,
            'message' => 'Update status Instansi Catatan: Tim sedang briefing sebelum berangkat',
        ]);
    }

    public function test_instansi_can_view_assigned_report_detail(): void
    {
        $agency = Agency::create(['name' => 'Instansi Detail']);
        $instansi = User::factory()->create(['role' => 'instansi', 'agency_id' => $agency->id]);
        $pelapor = User::factory()->create(['role' => 'pelapor']);
        $type = EmergencyType::create(['name' => 'detail_case', 'display_name' => 'Detail Case', 'is_need_location' => false]);

        $report = Report::create([
            'emergency_type_id' => $type->id,
            'user_id' => $pelapor->id,
            'status' => 'assigned',
            'description' => 'Laporan detail',
            'metadata' => [],
            'metadata_schema_version' => 1,
        ]);
        Assignment::create([
            'report_id' => $report->id,
            'agency_id' => $agency->id,
            'is_primary' => true,
            'status' => Assignment::STATUS_PENDING,
        ]);

        $this->actingAs($instansi)
            ->get(route('instansi.reports.show', $report))
            ->assertOk()
            ->assertSee('Laporan detail');
    }
}
