<?php

namespace Database\Seeders;

use App\Models\Agency;
use App\Models\AgencyBranch;
use App\Models\Assignment;
use App\Models\AssignmentPhoto;
use App\Models\EmergencyType;
use App\Models\Report;
use App\Models\ReportPhoto;
use App\Models\RoutingRule;
use App\Models\Step;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

class LargeDummyDataSeeder extends Seeder
{
    public function run(): void
    {
        $now = Carbon::now();

        $agencies = $this->seedAgencies();
        $branchesByAgency = $this->seedBranches($agencies);
        $types = $this->seedEmergencyTypes();
        [$instansiUsers, $pelaporUsers] = $this->seedUsers($agencies, $branchesByAgency, $now);
        $this->seedRoutingRules($types, $agencies);
        $this->seedReportsAndFlows($types, $agencies, $branchesByAgency, $pelaporUsers, $instansiUsers, $now);
    }

    private function seedAgencies(): array
    {
        $agencySeeds = [
            ['name' => 'Damkar Batam Utara', 'type' => 'fire', 'area' => 'Batam Utara', 'contact' => '0778-1001'],
            ['name' => 'Damkar Batam Tengah', 'type' => 'fire', 'area' => 'Batam Tengah', 'contact' => '0778-1002'],
            ['name' => 'BPBD Batam Pusat', 'type' => 'disaster', 'area' => 'Batam Pusat', 'contact' => '0778-1003'],
            ['name' => 'BPBD Batam Barat', 'type' => 'disaster', 'area' => 'Batam Barat', 'contact' => '0778-1004'],
            ['name' => 'Polresta Barelang', 'type' => 'law', 'area' => 'Batam', 'contact' => '0778-1100'],
            ['name' => 'Dinas Kesehatan Batam', 'type' => 'health', 'area' => 'Batam', 'contact' => '0778-1190'],
            ['name' => 'Diskominfo Batam', 'type' => 'digital', 'area' => 'Batam', 'contact' => '0778-1500'],
            ['name' => 'Satpol PP Batam', 'type' => 'public_order', 'area' => 'Batam', 'contact' => '0778-1300'],
            ['name' => 'PLN Quick Response Batam', 'type' => 'utility', 'area' => 'Batam', 'contact' => '0778-1401'],
            ['name' => 'PDAM Darurat Batam', 'type' => 'utility', 'area' => 'Batam', 'contact' => '0778-1402'],
            ['name' => 'Basarnas Batam', 'type' => 'rescue', 'area' => 'Batam', 'contact' => '0778-115'],
            ['name' => 'TNI AL Lantamal Batam', 'type' => 'security', 'area' => 'Batam', 'contact' => '0778-1601'],
            ['name' => 'PMI Batam', 'type' => 'health', 'area' => 'Batam', 'contact' => '0778-1701'],
            ['name' => 'Dinas Perhubungan Batam', 'type' => 'transport', 'area' => 'Batam', 'contact' => '0778-1801'],
            ['name' => 'Cyber Response Kepri', 'type' => 'digital', 'area' => 'Kepri', 'contact' => '0778-1901'],
        ];

        $agencies = [];
        foreach ($agencySeeds as $row) {
            $agencies[] = Agency::updateOrCreate(
                ['name' => $row['name']],
                $row
            );
        }

        return $agencies;
    }

    private function seedBranches(array $agencies): array
    {
        if (!Schema::hasTable('agency_branches')) {
            return [];
        }

        $branchesByAgency = [];
        foreach ($agencies as $agency) {
            $branches = [];
            for ($i = 1; $i <= 2; $i++) {
                [$latitude, $longitude] = $this->randomBatamLandCoordinate();

                $branches[] = AgencyBranch::updateOrCreate(
                    [
                        'agency_id' => $agency->id,
                        'name' => "Cabang {$i} {$agency->name}",
                    ],
                    [
                        'address' => "Jl. Operasional {$i}, {$agency->area}",
                        'latitude' => $latitude,
                        'longitude' => $longitude,
                        'is_active' => true,
                        'coverage_radius_km' => 15 + $i,
                        'metadata' => ['shift' => '24/7'],
                    ]
                );
            }

            $branchesByAgency[$agency->id] = $branches;
        }

        return $branchesByAgency;
    }

    private function seedEmergencyTypes(): array
    {
        $seeds = [
            ['kebakaran', 'Kebakaran', true],
            ['banjir', 'Banjir', true],
            ['longsor', 'Longsor', true],
            ['gempa', 'Gempa', true],
            ['kecelakaan_lalu_lintas', 'Kecelakaan Lalu Lintas', true],
            ['darurat_medis', 'Darurat Medis', true],
            ['gangguan_kamtibmas', 'Gangguan Kamtibmas', true],
            ['insiden_siber', 'Insiden Siber', false],
            ['gangguan_listrik', 'Gangguan Listrik', true],
            ['gangguan_air', 'Gangguan Air', true],
            ['kebocoran_gas', 'Kebocoran Gas', true],
            ['tumpahan_bahan_kimia', 'Tumpahan Bahan Kimia', true],
            ['evakuasi_medis', 'Evakuasi Medis', true],
            ['kerusuhan_massa', 'Kerusuhan Massa', true],
            ['kecelakaan_laut', 'Kecelakaan Laut', true],
            ['kecelakaan_industri', 'Kecelakaan Industri', true],
            ['hoaks_digital', 'Hoaks Digital', false],
            ['kerusakan_infrastruktur', 'Kerusakan Infrastruktur', true],
            ['krisis_transportasi', 'Krisis Transportasi', true],
            ['lainnya', 'Lainnya', false],
        ];

        $types = [];
        foreach ($seeds as [$name, $displayName, $needLocation]) {
            $schemaFields = $needLocation
                ? [
                    ['title' => 'Urgensi', 'type' => 'select', 'value_name' => 'urgensi', 'options' => ['rendah', 'sedang', 'tinggi']],
                    ['title' => 'Catatan Tambahan', 'type' => 'text', 'value_name' => 'catatan'],
                ]
                : [
                    ['title' => 'Platform', 'type' => 'text', 'value_name' => 'platform'],
                ];

            $types[] = EmergencyType::updateOrCreate(
                ['name' => $name],
                [
                    'display_name' => $displayName,
                    'description' => "Dummy description {$displayName}.",
                    'is_need_location' => $needLocation,
                    'form_schema' => ['fields' => $name === 'lainnya' ? [] : $schemaFields],
                ]
            );
        }

        return $types;
    }

    private function seedUsers(array $agencies, array $branchesByAgency, Carbon $now): array
    {
        $instansiUsers = [];
        $pelaporUsers = [];

        User::updateOrCreate(
            ['email' => 'manager.demo@tanggapdarurat.com'],
            [
                'name' => 'Manager Demo',
                'password' => Hash::make('password'),
                'role' => 'manager',
                'agency_id' => null,
                'email_verified_at' => $now,
            ]
        );

        for ($i = 1; $i <= 30; $i++) {
            $agency = $agencies[$i % count($agencies)];
            $user = User::updateOrCreate(
                ['email' => "instansi{$i}@dummy.local"],
                [
                    'name' => "Instansi User {$i}",
                    'password' => Hash::make('password'),
                    'role' => 'instansi',
                    'agency_id' => $agency->id,
                    'email_verified_at' => $now,
                ]
            );
            $instansiUsers[] = $user;

            if (Schema::hasTable('agency_branch_user') && isset($branchesByAgency[$agency->id])) {
                $branches = $branchesByAgency[$agency->id];
                $target = $branches[$i % count($branches)] ?? null;
                if ($target) {
                    DB::table('agency_branch_user')->updateOrInsert(
                        [
                            'agency_branch_id' => $target->id,
                            'user_id' => $user->id,
                        ],
                        [
                            'is_primary_branch' => true,
                            'created_at' => $now,
                            'updated_at' => $now,
                        ]
                    );
                }
            }
        }

        for ($i = 1; $i <= 25; $i++) {
            $pelaporUsers[] = User::updateOrCreate(
                ['email' => "pelapor{$i}@dummy.local"],
                [
                    'name' => "Pelapor Dummy {$i}",
                    'password' => Hash::make('password'),
                    'role' => 'pelapor',
                    'agency_id' => null,
                    'email_verified_at' => $now,
                ]
            );
        }

        return [$instansiUsers, $pelaporUsers];
    }

    private function seedRoutingRules(array $types, array $agencies): void
    {
        $eligibleTypes = collect($types)->filter(fn (EmergencyType $type) => $type->name !== 'lainnya')->values();

        foreach ($eligibleTypes as $type) {
            RoutingRule::withTrashed()->where('emergency_type_id', $type->id)->forceDelete();

            $agencyPool = collect($agencies)
                ->shuffle()
                ->unique('id')
                ->take(min(3, count($agencies)))
                ->values();
            $priority = 1;

            foreach ($agencyPool as $agencyIndex => $agency) {
                RoutingRule::create([
                    'emergency_type_id' => $type->id,
                    'agency_id' => $agency->id,
                    'area' => null,
                    'priority' => $priority,
                    'is_primary' => $agencyIndex === 0,
                ]);

                $priority++;
            }
        }
    }

    private function randomBatamLandCoordinate(): array
    {
        // Titik acuan area daratan Batam (inland/semi-inland), lalu diberi jitter kecil.
        $anchors = [
            [1.1301167, 104.0510473], // Batam Center
            [1.1466285, 104.0146040], // Nagoya
            [1.1380000, 104.0320000], // Sungai Panas
            [1.1207000, 104.0693000], // Botania
            [1.1080000, 104.0008000], // Muka Kuning
            [1.1027000, 104.0382000], // Batamindo
            [1.1138000, 103.9672000], // Tiban
            [1.1230000, 103.9340000], // Sekupang
            [1.0457000, 103.9528000], // Batu Aji
            [1.1327000, 104.1116000], // Batu Besar
            [1.1679000, 104.1210000], // Nongsa
        ];

        $attempts = 0;
        while ($attempts < 25) {
            [$baseLat, $baseLng] = $anchors[array_rand($anchors)];

            $lat = $baseLat + (mt_rand(-220, 220) / 100000); // ~ +/- 244m
            $lng = $baseLng + (mt_rand(-220, 220) / 100000);

            if ($this->isLikelyBatamLandCoordinate($lat, $lng)) {
                return [round($lat, 7), round($lng, 7)];
            }

            $attempts++;
        }

        return [1.1301167, 104.0510473];
    }

    private function isLikelyBatamLandCoordinate(float $lat, float $lng): bool
    {
        // Guard sederhana agar titik tetap di koridor daratan Batam, bukan area laut jauh.
        return $lat >= 1.0200
            && $lat <= 1.1850
            && $lng >= 103.9200
            && $lng <= 104.1600;
    }

    private function seedReportsAndFlows(
        array $types,
        array $agencies,
        array $branchesByAgency,
        array $pelaporUsers,
        array $instansiUsers,
        Carbon $now
    ): void {
        $reportStatuses = [
            'triage',
            'submitted',
            'assigned',
            'in_progress',
            'resolved_waiting_validation',
            'resolved',
            'validation_failed',
            'rejected',
        ];

        for ($i = 1; $i <= 80; $i++) {
            $type = $types[$i % count($types)];
            $pelapor = $pelaporUsers[$i % count($pelaporUsers)];
            $primaryAgency = $agencies[$i % count($agencies)];
            $primaryBranch = $branchesByAgency[$primaryAgency->id][0] ?? null;
            $status = $reportStatuses[$i % count($reportStatuses)];
            $reportedAt = $now->copy()->subDays(rand(0, 20))->subMinutes(rand(1, 1200));
            $hasLocation = $type->is_need_location;

            $report = Report::create([
                'emergency_type_id' => $type->id,
                'user_id' => $pelapor->id,
                'status' => $type->name === 'lainnya' ? 'triage' : $status,
                'is_other_emergency' => $type->name === 'lainnya',
                'description' => "Dummy laporan {$i} untuk {$type->display_name}.",
                'other_emergency_title' => $type->name === 'lainnya' ? "Judul Lainnya {$i}" : null,
                'longitude' => $hasLocation ? ($primaryBranch?->longitude ?? 104.0510473) : null,
                'latitude' => $hasLocation ? ($primaryBranch?->latitude ?? 1.1301167) : null,
                'metadata' => $this->buildMetadataFromSchema($type->form_schema),
                'metadata_schema_version' => 1,
                'date' => $reportedAt,
                'client_reported_at' => $reportedAt,
                'client_timezone' => 'Asia/Bangkok',
                'client_utc_offset_minutes' => 420,
                'geo_accuracy_m' => $hasLocation ? rand(5, 120) : null,
                'geo_source' => $hasLocation ? 'browser' : 'fallback',
                'server_received_at' => $reportedAt->copy()->addSeconds(rand(5, 300)),
            ]);

            Step::create([
                'report_id' => $report->id,
                'message' => $report->is_other_emergency
                    ? 'Laporan dikirim sebagai kategori Lainnya. Menunggu klasifikasi admin.'
                    : 'Laporan dikirim.',
            ]);

            $photoCount = rand(1, 3);
            for ($p = 1; $p <= $photoCount; $p++) {
                ReportPhoto::create([
                    'report_id' => $report->id,
                    'file_path' => "sample/reports/report-{$report->id}-{$p}.jpg",
                    'uploaded_by' => $pelapor->id,
                    'uploaded_at' => $reportedAt->copy()->addMinutes($p),
                ]);
            }

            if (in_array($report->status, ['assigned', 'in_progress', 'resolved_waiting_validation', 'resolved', 'validation_failed', 'rejected'], true)) {
                $this->seedAssignmentsForReport($report, $agencies, $branchesByAgency, $instansiUsers, $now);
            }
        }
    }

    private function seedAssignmentsForReport(Report $report, array $agencies, array $branchesByAgency, array $instansiUsers, Carbon $now): void
    {
        $assignmentCount = rand(1, 3);
        $selectedAgencies = collect($agencies)->shuffle()->take($assignmentCount)->values();

        foreach ($selectedAgencies as $index => $agency) {
            $branch = $branchesByAgency[$agency->id][0] ?? null;
            $status = match ($report->status) {
                'assigned' => $index === 0 ? Assignment::STATUS_PENDING : Assignment::STATUS_QUEUED,
                'in_progress' => $index === 0 ? Assignment::STATUS_ON_PROGRESS : Assignment::STATUS_PENDING,
                'resolved_waiting_validation', 'resolved', 'validation_failed' => Assignment::STATUS_RESOLVED,
                'rejected' => Assignment::STATUS_REJECTED,
                default => Assignment::STATUS_PENDING,
            };

            $assignment = Assignment::create([
                'report_id' => $report->id,
                'agency_id' => $agency->id,
                'agency_branch_id' => $branch?->id,
                'is_primary' => $index === 0,
                'status' => $status,
                'description' => "Dummy assignment {$agency->name}",
                'distance_km' => $report->latitude && $branch?->latitude ? rand(1, 250) / 10 : null,
                'admin_verification' => $report->status === 'resolved',
                'date' => $now->copy()->subMinutes(rand(5, 600)),
            ]);

            Step::create([
                'report_id' => $report->id,
                'assignment_id' => $assignment->id,
                'message' => "Instansi {$agency->name} ditugaskan dengan status {$status}.",
            ]);

            if ($status === Assignment::STATUS_RESOLVED) {
                $uploader = collect($instansiUsers)->first(fn (User $u) => (int) $u->agency_id === (int) $agency->id);
                $photoCount = rand(1, 2);
                for ($p = 1; $p <= $photoCount; $p++) {
                    AssignmentPhoto::create([
                        'assignment_id' => $assignment->id,
                        'file_path' => "sample/assignments/assignment-{$assignment->id}-{$p}.jpg",
                        'uploaded_by' => $uploader?->id,
                        'uploaded_at' => $now->copy()->subMinutes(rand(1, 240)),
                    ]);
                }
            }
        }
    }

    private function buildMetadataFromSchema(?array $schema): array
    {
        $fields = data_get($schema, 'fields', []);
        if (!is_array($fields)) {
            return [];
        }

        $metadata = [];
        foreach ($fields as $field) {
            if (!is_array($field)) {
                continue;
            }

            $name = (string) ($field['value_name'] ?? $field['name'] ?? '');
            if ($name === '') {
                continue;
            }

            $type = strtolower((string) ($field['type'] ?? 'text'));
            $metadata[$name] = match ($type) {
                'number' => rand(1, 100),
                'boolean' => (bool) rand(0, 1),
                'date' => Carbon::now()->subDays(rand(0, 30))->toDateString(),
                'select' => collect($field['options'] ?? [])->filter()->values()->get(0, 'opsi_1'),
                default => 'dummy_'.Str::random(6),
            };
        }

        return $metadata;
    }
}
