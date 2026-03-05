<?php

namespace Tests\Feature;

use App\Models\EmergencyType;
use App\Models\Report;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class ReportFlowTest extends TestCase
{
    use RefreshDatabase;

    public function test_pelapor_can_access_report_pages(): void
    {
        $pelapor = User::factory()->create(['role' => 'pelapor']);

        $this->actingAs($pelapor)->get(route('pelapor.reports.create'))->assertOk();
        $this->actingAs($pelapor)->get(route('pelapor.reports.index'))->assertOk();
    }

    public function test_pelapor_can_submit_report_with_photos_and_metadata(): void
    {
        Storage::fake('public');

        $pelapor = User::factory()->create(['role' => 'pelapor']);
        $type = EmergencyType::create([
            'name' => 'kebakaran',
            'display_name' => 'Kebakaran',
            'description' => 'Insiden kebakaran',
            'is_need_location' => true,
            'form_schema' => [
                'fields' => [
                    ['title' => 'Tingkat Api', 'name' => 'severity', 'type' => 'select', 'options' => ['ringan', 'sedang', 'berat']],
                    ['title' => 'Korban', 'name' => 'victims', 'type' => 'number'],
                ],
            ],
        ]);

        $response = $this->actingAs($pelapor)->post(route('pelapor.reports.store'), [
            'emergency_type_id' => $type->id,
            'description' => 'Terjadi kebakaran di lantai 2 gedung ruko.',
            'latitude' => -6.2000000,
            'longitude' => 106.8166667,
            'metadata_text' => json_encode([
                'severity' => 'sedang',
                'victims' => 2,
            ]),
            'photos' => [
                UploadedFile::fake()->image('photo-1.jpg'),
                UploadedFile::fake()->image('photo-2.jpg'),
            ],
        ]);

        $report = Report::first();

        $response->assertRedirect(route('pelapor.reports.show', $report));
        $this->assertNotNull($report);
        $this->assertDatabaseHas('reports', [
            'id' => $report->id,
            'user_id' => $pelapor->id,
            'emergency_type_id' => $type->id,
            'status' => 'submitted',
            'metadata_schema_version' => 1,
        ]);

        $this->assertCount(2, $report->photos);
        foreach ($report->photos as $photo) {
            Storage::disk('public')->assertExists($photo->file_path);
        }
    }

    public function test_pelapor_cannot_view_other_pelapor_report(): void
    {
        $owner = User::factory()->create(['role' => 'pelapor']);
        $other = User::factory()->create(['role' => 'pelapor']);
        $type = EmergencyType::create([
            'name' => 'banjir',
            'display_name' => 'Banjir',
            'is_need_location' => false,
        ]);

        $report = Report::create([
            'emergency_type_id' => $type->id,
            'user_id' => $owner->id,
            'status' => 'submitted',
            'description' => 'Banjir di area pemukiman.',
            'metadata' => [],
            'metadata_schema_version' => 1,
        ]);

        $this->actingAs($other)
            ->get(route('pelapor.reports.show', $report))
            ->assertForbidden();
    }

    public function test_admin_can_view_reports_index_page(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);

        $this->actingAs($admin)->get(route('admin.reports.index'))->assertOk();
    }
}
