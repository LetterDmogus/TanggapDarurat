<?php

namespace Tests\Feature;

use App\Models\Agency;
use App\Models\AgencyBranch;
use App\Models\Assignment;
use App\Models\EmergencyType;
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

    public function test_routing_rule_assigns_nearest_active_agency_branch(): void
    {
        Storage::fake('public');

        $pelapor = User::factory()->create(['role' => 'pelapor']);
        $agency = Agency::create([
            'name' => 'BPBD Cabang',
            'type' => 'disaster',
            'area' => 'Batam',
        ]);
        $type = EmergencyType::create([
            'name' => 'banjir_cabang',
            'display_name' => 'Banjir Cabang',
            'is_need_location' => true,
            'form_schema' => ['fields' => []],
        ]);

        RoutingRule::create([
            'emergency_type_id' => $type->id,
            'agency_id' => $agency->id,
            'priority' => 1,
            'is_primary' => true,
        ]);

        $farBranch = AgencyBranch::create([
            'agency_id' => $agency->id,
            'name' => 'Cabang Jauh',
            'latitude' => 1.1500000,
            'longitude' => 104.1000000,
            'is_active' => true,
        ]);
        $nearBranch = AgencyBranch::create([
            'agency_id' => $agency->id,
            'name' => 'Cabang Dekat',
            'latitude' => 1.1300000,
            'longitude' => 104.0500000,
            'is_active' => true,
        ]);

        $response = $this->actingAs($pelapor)->post(route('pelapor.reports.store'), [
            'emergency_type_id' => $type->id,
            'description' => 'Banjir terjadi dekat pusat kota.',
            'latitude' => 1.1301000,
            'longitude' => 104.0501000,
            'metadata_text' => json_encode([]),
            'photos' => [
                UploadedFile::fake()->image('branch-1.jpg'),
            ],
        ]);

        $report = Report::query()->first();
        $response->assertRedirect(route('pelapor.reports.show', $report));

        $assignment = Assignment::query()->where('report_id', $report->id)->first();
        $this->assertNotNull($assignment);
        $this->assertSame($nearBranch->id, (int) $assignment->agency_branch_id);
        $this->assertNotNull($assignment->distance_km);
        $this->assertNotSame($farBranch->id, (int) $assignment->agency_branch_id);
    }

    public function test_branch_candidates_endpoint_returns_primary_branch_recommendation(): void
    {
        $pelapor = User::factory()->create(['role' => 'pelapor']);
        $primaryAgency = Agency::create([
            'name' => 'Primary Agency',
            'type' => 'disaster',
            'area' => 'Batam',
        ]);
        $secondaryAgency = Agency::create([
            'name' => 'Secondary Agency',
            'type' => 'disaster',
            'area' => 'Batam',
        ]);
        $type = EmergencyType::create([
            'name' => 'banjir_preview',
            'display_name' => 'Banjir Preview',
            'is_need_location' => true,
            'form_schema' => ['fields' => []],
        ]);

        RoutingRule::create([
            'emergency_type_id' => $type->id,
            'agency_id' => $primaryAgency->id,
            'priority' => 1,
            'is_primary' => true,
        ]);
        RoutingRule::create([
            'emergency_type_id' => $type->id,
            'agency_id' => $secondaryAgency->id,
            'priority' => 2,
            'is_primary' => false,
        ]);

        $nearPrimaryBranch = AgencyBranch::create([
            'agency_id' => $primaryAgency->id,
            'name' => 'Primary Near',
            'latitude' => 1.1300000,
            'longitude' => 104.0500000,
            'is_active' => true,
        ]);
        AgencyBranch::create([
            'agency_id' => $secondaryAgency->id,
            'name' => 'Secondary Near',
            'latitude' => 1.1300100,
            'longitude' => 104.0500100,
            'is_active' => true,
        ]);

        $response = $this->actingAs($pelapor)->get(route('pelapor.reports.branch-candidates', [
            'emergency_type_id' => $type->id,
            'latitude' => 1.1301000,
            'longitude' => 104.0501000,
        ]));

        $response->assertOk();
        $response->assertJsonPath('items.0.id', $nearPrimaryBranch->id);
        $response->assertJsonMissing(['name' => 'Secondary Near']);
    }
}
