<?php

namespace Tests\Feature;

use App\Models\Agency;
use App\Models\Assignment;
use App\Models\EmergencyType;
use App\Models\Location;
use App\Models\Report;
use App\Models\RoutingRule;
use App\Models\Step;
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
        $this->assertDatabaseHas('steps', [
            'report_id' => $report->id,
            'message' => 'Laporan dikirim.',
        ]);
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

    public function test_admin_can_view_report_detail_page(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $pelapor = User::factory()->create(['role' => 'pelapor']);
        $type = EmergencyType::create([
            'name' => 'kebakaran',
            'display_name' => 'Kebakaran',
            'is_need_location' => true,
        ]);

        $report = Report::create([
            'emergency_type_id' => $type->id,
            'user_id' => $pelapor->id,
            'status' => 'submitted',
            'description' => 'Laporan untuk diuji di halaman detail admin.',
            'metadata' => [],
            'metadata_schema_version' => 1,
        ]);

        $this->actingAs($admin)->get(route('admin.reports.show', $report))->assertOk();
    }

    public function test_admin_can_view_assignments_grouped_by_report_page(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);

        $this->actingAs($admin)->get(route('admin.assignments.index'))->assertOk();
    }

    public function test_fire_or_building_damage_report_is_also_sent_to_area_agency(): void
    {
        Storage::fake('public');

        $pelapor = User::factory()->create(['role' => 'pelapor']);
        $agency = Agency::create([
            'name' => 'Dinas Pemadam Kebakaran Test',
            'type' => 'fire',
            'area' => 'Batam',
            'contact' => '0778-113',
        ]);

        $location = Location::create([
            'name' => 'Area Cakupan Damkar',
            'location_type' => 'coverage',
            'latitude' => 1.1301000,
            'longitude' => 104.0510000,
            'agency_id' => $agency->id,
        ]);

        $type = EmergencyType::create([
            'name' => 'kebakaran',
            'display_name' => 'Kebakaran',
            'description' => 'Insiden kebakaran',
            'is_need_location' => true,
            'form_schema' => [
                'fields' => [
                    ['title' => 'Tingkat Api', 'name' => 'severity', 'type' => 'select', 'options' => ['ringan', 'sedang', 'berat']],
                ],
            ],
        ]);

        $response = $this->actingAs($pelapor)->post(route('pelapor.reports.store'), [
            'emergency_type_id' => $type->id,
            'description' => 'Kebakaran ruko dekat area yang sudah dipetakan.',
            'latitude' => 1.1301167,
            'longitude' => 104.0510473,
            'metadata_text' => json_encode([
                'severity' => 'sedang',
            ]),
            'photos' => [
                UploadedFile::fake()->image('photo-1.jpg'),
            ],
        ]);

        $report = Report::first();

        $response->assertRedirect(route('pelapor.reports.show', $report));
        $this->assertDatabaseHas('reports', [
            'id' => $report->id,
            'location_id' => $location->id,
        ]);

        $this->assertDatabaseHas('assignments', [
            'report_id' => $report->id,
            'agency_id' => $agency->id,
            'status' => 'pending',
        ]);

        $this->assertSame(1, Assignment::query()->count());
        $this->assertGreaterThanOrEqual(2, Step::query()->where('report_id', $report->id)->count());
    }

    public function test_routing_rules_create_prioritized_assignments_and_update_report_status(): void
    {
        Storage::fake('public');

        $pelapor = User::factory()->create(['role' => 'pelapor']);
        $agencyPrimary = Agency::create([
            'name' => 'BPBD Primary',
            'type' => 'disaster',
            'area' => 'Batam',
            'contact' => '0778-117',
        ]);
        $agencySecondary = Agency::create([
            'name' => 'BPBD Backup',
            'type' => 'disaster',
            'area' => 'Batam',
            'contact' => '0778-118',
        ]);

        $type = EmergencyType::create([
            'name' => 'banjir_prioritas',
            'display_name' => 'Banjir Prioritas',
            'description' => 'Insiden banjir',
            'is_need_location' => false,
            'form_schema' => [
                'fields' => [
                    ['title' => 'Ketinggian Air', 'name' => 'water_level', 'type' => 'number'],
                ],
            ],
        ]);

        RoutingRule::create([
            'emergency_type_id' => $type->id,
            'agency_id' => $agencyPrimary->id,
            'priority' => 1,
            'is_primary' => true,
            'area' => null,
        ]);
        RoutingRule::create([
            'emergency_type_id' => $type->id,
            'agency_id' => $agencySecondary->id,
            'priority' => 2,
            'is_primary' => false,
            'area' => null,
        ]);

        $response = $this->actingAs($pelapor)->post(route('pelapor.reports.store'), [
            'emergency_type_id' => $type->id,
            'description' => 'Banjir cukup parah di beberapa titik.',
            'metadata_text' => json_encode([
                'water_level' => 70,
            ]),
            'photos' => [
                UploadedFile::fake()->image('banjir-1.jpg'),
            ],
        ]);

        $report = Report::query()->first();
        $response->assertRedirect(route('pelapor.reports.show', $report));

        $this->assertDatabaseHas('reports', [
            'id' => $report->id,
            'status' => 'assigned',
        ]);

        $this->assertDatabaseHas('assignments', [
            'report_id' => $report->id,
            'agency_id' => $agencyPrimary->id,
            'status' => 'pending',
        ]);
        $this->assertDatabaseHas('assignments', [
            'report_id' => $report->id,
            'agency_id' => $agencySecondary->id,
            'status' => 'queued',
        ]);
        $this->assertDatabaseHas('steps', [
            'report_id' => $report->id,
            'message' => 'Instansi BPBD Primary telah ditugaskan, menunggu status.',
        ]);
    }

    public function test_non_location_report_still_assigns_when_only_area_rules_exist(): void
    {
        Storage::fake('public');

        $pelapor = User::factory()->create(['role' => 'pelapor']);
        $agencyCyber = Agency::create([
            'name' => 'Diskominfo Incident Response',
            'type' => 'digital',
            'area' => 'Batam',
            'contact' => '0778-1500',
        ]);

        $type = EmergencyType::create([
            'name' => 'insiden_siber',
            'display_name' => 'Insiden Siber',
            'description' => 'Laporan phishing / malware / kebocoran akun',
            'is_need_location' => false,
            'form_schema' => [
                'fields' => [
                    ['title' => 'Platform', 'name' => 'platform', 'type' => 'text'],
                ],
            ],
        ]);

        RoutingRule::create([
            'emergency_type_id' => $type->id,
            'agency_id' => $agencyCyber->id,
            'priority' => 1,
            'is_primary' => true,
            'area' => 'Batam',
        ]);

        $response = $this->actingAs($pelapor)->post(route('pelapor.reports.store'), [
            'emergency_type_id' => $type->id,
            'description' => 'Ada upaya phishing melalui tautan palsu layanan publik.',
            'metadata_text' => json_encode([
                'platform' => 'WhatsApp',
            ]),
            'photos' => [
                UploadedFile::fake()->image('siber-1.jpg'),
            ],
        ]);

        $report = Report::query()->first();
        $response->assertRedirect(route('pelapor.reports.show', $report));

        $this->assertDatabaseHas('reports', [
            'id' => $report->id,
            'status' => 'assigned',
        ]);
        $this->assertDatabaseHas('assignments', [
            'report_id' => $report->id,
            'agency_id' => $agencyCyber->id,
            'status' => 'pending',
        ]);
        $this->assertDatabaseHas('steps', [
            'report_id' => $report->id,
            'message' => 'Instansi Diskominfo Incident Response telah ditugaskan, menunggu status.',
        ]);
    }

    public function test_pelapor_can_submit_other_emergency_report_to_triage_queue(): void
    {
        Storage::fake('public');

        $pelapor = User::factory()->create(['role' => 'pelapor']);

        $response = $this->actingAs($pelapor)->post(route('pelapor.reports.store'), [
            'emergency_type_id' => 'others',
            'other_emergency_title' => 'Gangguan layanan komunikasi massal',
            'description' => 'Terdapat gangguan komunikasi massal lintas kecamatan, belum jelas kategori resminya.',
            'metadata_text' => '{}',
            'photos' => [
                UploadedFile::fake()->image('other-1.jpg'),
            ],
        ]);

        $report = Report::query()->first();
        $response->assertRedirect(route('pelapor.reports.show', $report));

        $this->assertDatabaseHas('reports', [
            'id' => $report->id,
            'status' => 'triage',
            'is_other_emergency' => true,
            'other_emergency_title' => 'Gangguan layanan komunikasi massal',
        ]);
        $this->assertDatabaseCount('assignments', 0);
        $this->assertDatabaseHas('steps', [
            'report_id' => $report->id,
            'message' => 'Laporan dikirim sebagai kategori Lainnya. Menunggu klasifikasi admin.',
        ]);
    }
}
