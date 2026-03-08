<?php

namespace Tests\Feature;

use App\Models\Agency;
use App\Models\Assignment;
use App\Models\AssignmentPhoto;
use App\Models\EmergencyType;
use App\Models\Report;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class AdminReportValidationTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_validate_waiting_report(): void
    {
        Storage::fake('public');

        $admin = User::factory()->create(['role' => 'admin']);
        $agency = Agency::create(['name' => 'Instansi Validasi']);
        $pelapor = User::factory()->create(['role' => 'pelapor']);
        $type = EmergencyType::create(['name' => 'banjir', 'display_name' => 'Banjir', 'is_need_location' => false]);

        $report = Report::create([
            'emergency_type_id' => $type->id,
            'user_id' => $pelapor->id,
            'status' => 'resolved_waiting_validation',
            'description' => 'Siap validasi',
            'metadata' => [],
            'metadata_schema_version' => 1,
        ]);

        $assignment = Assignment::create([
            'report_id' => $report->id,
            'agency_id' => $agency->id,
            'is_primary' => true,
            'status' => Assignment::STATUS_RESOLVED,
            'admin_verification' => false,
        ]);
        $storedPath = 'assignments/proof-1.jpg';
        Storage::disk('public')->put($storedPath, 'proof-image-binary');
        AssignmentPhoto::create([
            'assignment_id' => $assignment->id,
            'file_path' => $storedPath,
            'uploaded_by' => $admin->id,
            'uploaded_at' => now(),
        ]);

        $this->actingAs($admin)
            ->patch(route('admin.reports.update-validation', $report), ['decision' => 'resolved'])
            ->assertRedirect();

        $this->assertDatabaseHas('reports', [
            'id' => $report->id,
            'status' => 'resolved',
        ]);
        $this->assertDatabaseHas('assignments', [
            'id' => $assignment->id,
            'admin_verification' => true,
        ]);
        $this->assertDatabaseHas('steps', [
            'report_id' => $report->id,
            'message' => 'Admin memvalidasi laporan. Status akhir: resolved.',
        ]);
    }

    public function test_admin_can_fail_validation_waiting_report(): void
    {
        Storage::fake('public');

        $admin = User::factory()->create(['role' => 'admin']);
        $agency = Agency::create(['name' => 'Instansi Fail']);
        $pelapor = User::factory()->create(['role' => 'pelapor']);
        $type = EmergencyType::create(['name' => 'longsor', 'display_name' => 'Longsor', 'is_need_location' => false]);

        $report = Report::create([
            'emergency_type_id' => $type->id,
            'user_id' => $pelapor->id,
            'status' => 'resolved_waiting_validation',
            'description' => 'Gagal validasi',
            'metadata' => [],
            'metadata_schema_version' => 1,
        ]);

        $assignment = Assignment::create([
            'report_id' => $report->id,
            'agency_id' => $agency->id,
            'is_primary' => true,
            'status' => Assignment::STATUS_RESOLVED,
            'admin_verification' => true,
        ]);
        $storedPath = 'assignments/proof-2.jpg';
        Storage::disk('public')->put($storedPath, 'proof-image-binary');
        AssignmentPhoto::create([
            'assignment_id' => $assignment->id,
            'file_path' => $storedPath,
            'uploaded_by' => $admin->id,
            'uploaded_at' => now(),
        ]);

        $this->actingAs($admin)
            ->patch(route('admin.reports.update-validation', $report), ['decision' => 'validation_failed'])
            ->assertRedirect();

        $this->assertDatabaseHas('reports', [
            'id' => $report->id,
            'status' => 'validation_failed',
        ]);
        $this->assertDatabaseHas('assignments', [
            'id' => $assignment->id,
            'status' => Assignment::STATUS_ON_PROGRESS,
            'admin_verification' => false,
        ]);
        $this->assertDatabaseHas('steps', [
            'report_id' => $report->id,
            'message' => 'Admin menolak validasi laporan. Status berubah menjadi validation_failed dan assignment dibuka kembali untuk perbaikan.',
        ]);
    }

    public function test_admin_cannot_validate_without_assignment_proof_photo(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $agency = Agency::create(['name' => 'Instansi Tanpa Bukti']);
        $pelapor = User::factory()->create(['role' => 'pelapor']);
        $type = EmergencyType::create(['name' => 'gempa', 'display_name' => 'Gempa', 'is_need_location' => false]);

        $report = Report::create([
            'emergency_type_id' => $type->id,
            'user_id' => $pelapor->id,
            'status' => 'resolved_waiting_validation',
            'description' => 'Tanpa bukti',
            'metadata' => [],
            'metadata_schema_version' => 1,
        ]);

        $assignment = Assignment::create([
            'report_id' => $report->id,
            'agency_id' => $agency->id,
            'is_primary' => true,
            'status' => Assignment::STATUS_RESOLVED,
            'admin_verification' => false,
        ]);

        $this->actingAs($admin)
            ->from(route('admin.reports.show', $report))
            ->patch(route('admin.reports.update-validation', $report), ['decision' => 'resolved'])
            ->assertRedirect(route('admin.reports.show', $report));

        $this->assertDatabaseHas('reports', [
            'id' => $report->id,
            'status' => 'resolved_waiting_validation',
        ]);
        $this->assertDatabaseHas('assignments', [
            'id' => $assignment->id,
            'status' => Assignment::STATUS_RESOLVED,
            'admin_verification' => false,
        ]);
    }
}
