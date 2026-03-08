<?php

namespace Database\Seeders;

use App\Models\Agency;
use App\Models\Assignment;
use App\Models\AssignmentPhoto;
use App\Models\EmergencyType;
use App\Models\Location;
use App\Models\Report;
use App\Models\ReportPhoto;
use App\Models\RoutingRule;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Schema;

class SampleDataSeeder extends Seeder
{
    public function run(): void
    {
        $now = Carbon::now();
        $hasMetadataSchemaVersion = Schema::hasColumn('reports', 'metadata_schema_version');

        $agencies = [
            'damkar' => Agency::updateOrCreate(
                ['name' => 'Dinas Pemadam Kebakaran'],
                ['type' => 'fire', 'area' => 'Batam Kota', 'contact' => '0778-113']
            ),
            'bpbd' => Agency::updateOrCreate(
                ['name' => 'BPBD Kota Batam'],
                ['type' => 'disaster', 'area' => 'Batam', 'contact' => '0778-117']
            ),
            'polisi' => Agency::updateOrCreate(
                ['name' => 'Polresta Barelang'],
                ['type' => 'law', 'area' => 'Batam', 'contact' => '0778-110']
            ),
            'dinkes' => Agency::updateOrCreate(
                ['name' => 'Dinas Kesehatan'],
                ['type' => 'health', 'area' => 'Batam', 'contact' => '0778-119']
            ),
            'diskominfo' => Agency::updateOrCreate(
                ['name' => 'Diskominfo Batam'],
                ['type' => 'digital', 'area' => 'Batam', 'contact' => '0778-1500']
            ),
        ];

        $emergencyTypes = [
            'kebakaran' => EmergencyType::updateOrCreate(
                ['name' => 'kebakaran'],
                [
                    'display_name' => 'Kebakaran',
                    'description' => 'Kejadian kebakaran rumah, gedung, atau lahan.',
                    'is_need_location' => true,
                    'form_schema' => [
                        'fields' => [
                            ['title' => 'Skala Api', 'type' => 'select', 'name' => 'fire_scale', 'options' => ['kecil', 'sedang', 'besar']],
                            ['title' => 'Sumber Api', 'type' => 'text', 'name' => 'source'],
                        ],
                    ],
                ]
            ),
            'banjir' => EmergencyType::updateOrCreate(
                ['name' => 'banjir'],
                [
                    'display_name' => 'Banjir',
                    'description' => 'Genangan atau banjir yang mengganggu aktivitas warga.',
                    'is_need_location' => true,
                    'form_schema' => [
                        'fields' => [
                            ['title' => 'Ketinggian Air (cm)', 'type' => 'number', 'name' => 'water_level_cm'],
                            ['title' => 'Arus Deras', 'type' => 'select', 'name' => 'strong_current', 'options' => ['ya', 'tidak']],
                        ],
                    ],
                ]
            ),
            'kecelakaan_lalu_lintas' => EmergencyType::updateOrCreate(
                ['name' => 'kecelakaan_lalu_lintas'],
                [
                    'display_name' => 'Kecelakaan Lalu Lintas',
                    'description' => 'Insiden tabrakan kendaraan atau korban di jalan.',
                    'is_need_location' => true,
                    'form_schema' => [
                        'fields' => [
                            ['title' => 'Jumlah Kendaraan', 'type' => 'number', 'name' => 'vehicle_count'],
                            ['title' => 'Ada Korban', 'type' => 'select', 'name' => 'has_victim', 'options' => ['ya', 'tidak']],
                        ],
                    ],
                ]
            ),
            'gangguan_kamtibmas' => EmergencyType::updateOrCreate(
                ['name' => 'gangguan_kamtibmas'],
                [
                    'display_name' => 'Gangguan Kamtibmas',
                    'description' => 'Keributan, ancaman, atau gangguan keamanan lingkungan.',
                    'is_need_location' => true,
                    'form_schema' => [
                        'fields' => [
                            ['title' => 'Tingkat Urgensi', 'type' => 'select', 'name' => 'urgency', 'options' => ['rendah', 'sedang', 'tinggi']],
                        ],
                    ],
                ]
            ),
            'hoaks_siber' => EmergencyType::updateOrCreate(
                ['name' => 'hoaks_siber'],
                [
                    'display_name' => 'Hoaks / Insiden Siber',
                    'description' => 'Laporan hoaks, phishing, pembajakan akun, atau kebocoran data.',
                    'is_need_location' => false,
                    'form_schema' => [
                        'fields' => [
                            ['title' => 'Platform', 'type' => 'text', 'name' => 'platform'],
                            ['title' => 'URL/Link', 'type' => 'text', 'name' => 'url'],
                        ],
                    ],
                ]
            ),
            'darurat_medis' => EmergencyType::updateOrCreate(
                ['name' => 'darurat_medis'],
                [
                    'display_name' => 'Darurat Medis',
                    'description' => 'Kondisi medis mendesak yang membutuhkan respon cepat.',
                    'is_need_location' => true,
                    'form_schema' => [
                        'fields' => [
                            ['title' => 'Kesadaran Pasien', 'type' => 'select', 'name' => 'consciousness', 'options' => ['sadar', 'tidak_sadar']],
                            ['title' => 'Perlu Ambulans', 'type' => 'select', 'name' => 'need_ambulance', 'options' => ['ya', 'tidak']],
                        ],
                    ],
                ]
            ),
        ];

        $locations = [
            'batam_center' => Location::updateOrCreate(
                ['name' => 'Alun-Alun Batam Center'],
                [
                    'location_type' => 'public_area',
                    'longitude' => 104.0510473,
                    'latitude' => 1.1301167,
                    'agency_id' => null,
                    'metadata' => ['zone' => 'A', 'landmark' => 'Mega Mall'],
                ]
            ),
            'nagoya' => Location::updateOrCreate(
                ['name' => 'Nagoya Hill'],
                [
                    'location_type' => 'commercial',
                    'longitude' => 104.0146040,
                    'latitude' => 1.1466285,
                    'agency_id' => null,
                    'metadata' => ['zone' => 'B', 'crowd' => 'high'],
                ]
            ),
            'damkar_pos_1' => Location::updateOrCreate(
                ['name' => 'Pos Damkar Batam Kota'],
                [
                    'location_type' => 'station',
                    'longitude' => 104.0555800,
                    'latitude' => 1.1298200,
                    'agency_id' => $agencies['damkar']->id,
                    'metadata' => ['unit' => 'fire-01'],
                ]
            ),
            'rsud' => Location::updateOrCreate(
                ['name' => 'RSUD Embung Fatimah'],
                [
                    'location_type' => 'hospital',
                    'longitude' => 104.0409770,
                    'latitude' => 1.0986070,
                    'agency_id' => $agencies['dinkes']->id,
                    'metadata' => ['er' => true],
                ]
            ),
        ];

        RoutingRule::updateOrCreate(
            ['emergency_type_id' => $emergencyTypes['kebakaran']->id, 'agency_id' => $agencies['damkar']->id, 'area' => 'Batam'],
            ['priority' => 1, 'is_primary' => true]
        );
        RoutingRule::updateOrCreate(
            ['emergency_type_id' => $emergencyTypes['banjir']->id, 'agency_id' => $agencies['bpbd']->id, 'area' => 'Batam'],
            ['priority' => 1, 'is_primary' => true]
        );
        RoutingRule::updateOrCreate(
            ['emergency_type_id' => $emergencyTypes['kecelakaan_lalu_lintas']->id, 'agency_id' => $agencies['polisi']->id, 'area' => 'Batam'],
            ['priority' => 1, 'is_primary' => true]
        );
        RoutingRule::updateOrCreate(
            ['emergency_type_id' => $emergencyTypes['darurat_medis']->id, 'agency_id' => $agencies['dinkes']->id, 'area' => 'Batam'],
            ['priority' => 1, 'is_primary' => true]
        );
        RoutingRule::updateOrCreate(
            ['emergency_type_id' => $emergencyTypes['hoaks_siber']->id, 'agency_id' => $agencies['diskominfo']->id, 'area' => 'Batam'],
            ['priority' => 1, 'is_primary' => true]
        );
        RoutingRule::updateOrCreate(
            ['emergency_type_id' => $emergencyTypes['kebakaran']->id, 'agency_id' => $agencies['bpbd']->id, 'area' => 'Batam'],
            ['priority' => 2, 'is_primary' => false]
        );

        $users = [
            'superadmin' => User::withTrashed()->updateOrCreate(
                ['email' => 'superadmin@tanggapdarurat.com'],
                [
                    'name' => 'Super Admin TD',
                    'password' => Hash::make('password'),
                    'role' => 'superadmin',
                    'agency_id' => null,
                    'email_verified_at' => $now,
                    'deleted_at' => null,
                ]
            ),
            'admin' => User::withTrashed()->updateOrCreate(
                ['email' => 'admin.operasional@tanggapdarurat.com'],
                [
                    'name' => 'Admin Operasional',
                    'password' => Hash::make('password'),
                    'role' => 'admin',
                    'agency_id' => null,
                    'email_verified_at' => $now,
                    'deleted_at' => null,
                ]
            ),
            'manager' => User::withTrashed()->updateOrCreate(
                ['email' => 'manager@tanggapdarurat.com'],
                [
                    'name' => 'Manager Kota',
                    'password' => Hash::make('password'),
                    'role' => 'manager',
                    'agency_id' => null,
                    'email_verified_at' => $now,
                    'deleted_at' => null,
                ]
            ),
            'instansi_damkar' => User::withTrashed()->updateOrCreate(
                ['email' => 'petugas.damkar@tanggapdarurat.com'],
                [
                    'name' => 'Petugas Damkar',
                    'password' => Hash::make('password'),
                    'role' => 'instansi',
                    'agency_id' => $agencies['damkar']->id,
                    'email_verified_at' => $now,
                    'deleted_at' => null,
                ]
            ),
            'instansi_bpbd' => User::withTrashed()->updateOrCreate(
                ['email' => 'petugas.bpbd@tanggapdarurat.com'],
                [
                    'name' => 'Petugas BPBD',
                    'password' => Hash::make('password'),
                    'role' => 'instansi',
                    'agency_id' => $agencies['bpbd']->id,
                    'email_verified_at' => $now,
                    'deleted_at' => null,
                ]
            ),
            'pelapor_1' => User::withTrashed()->updateOrCreate(
                ['email' => 'pelapor1@example.com'],
                [
                    'name' => 'Pelapor Satu',
                    'password' => Hash::make('password'),
                    'role' => 'pelapor',
                    'agency_id' => null,
                    'email_verified_at' => $now,
                    'deleted_at' => null,
                ]
            ),
            'pelapor_2' => User::withTrashed()->updateOrCreate(
                ['email' => 'pelapor2@example.com'],
                [
                    'name' => 'Pelapor Dua',
                    'password' => Hash::make('password'),
                    'role' => 'pelapor',
                    'agency_id' => null,
                    'email_verified_at' => $now,
                    'deleted_at' => null,
                ]
            ),
        ];

        $reportFirePayload = [
            'location_id' => $locations['batam_center']->id,
            'status' => 'pending',
            'description' => 'Terlihat asap tebal dari ruko lantai dua.',
            'longitude' => 104.0510473,
            'latitude' => 1.1301167,
            'metadata' => ['fire_scale' => 'sedang', 'source' => 'arus pendek listrik'],
        ];
        if ($hasMetadataSchemaVersion) {
            $reportFirePayload['metadata_schema_version'] = 1;
        }

        $reportFire = Report::updateOrCreate(
            ['user_id' => $users['pelapor_1']->id, 'emergency_type_id' => $emergencyTypes['kebakaran']->id, 'date' => $now->copy()->subHours(6)],
            $reportFirePayload
        );

        $reportFloodPayload = [
            'location_id' => $locations['nagoya']->id,
            'status' => 'assigned',
            'description' => 'Jalan utama tergenang, kendaraan sulit lewat.',
            'longitude' => 104.0146040,
            'latitude' => 1.1466285,
            'metadata' => ['water_level_cm' => 45, 'strong_current' => 'tidak'],
        ];
        if ($hasMetadataSchemaVersion) {
            $reportFloodPayload['metadata_schema_version'] = 1;
        }

        $reportFlood = Report::updateOrCreate(
            ['user_id' => $users['pelapor_2']->id, 'emergency_type_id' => $emergencyTypes['banjir']->id, 'date' => $now->copy()->subHours(3)],
            $reportFloodPayload
        );

        $reportCyberPayload = [
            'location_id' => null,
            'status' => 'review',
            'description' => 'Ada link phishing mengatasnamakan layanan pemerintah.',
            'longitude' => null,
            'latitude' => null,
            'metadata' => ['platform' => 'WhatsApp', 'url' => 'https://contoh-phishing.test'],
        ];
        if ($hasMetadataSchemaVersion) {
            $reportCyberPayload['metadata_schema_version'] = 1;
        }

        $reportCyber = Report::updateOrCreate(
            ['user_id' => $users['pelapor_1']->id, 'emergency_type_id' => $emergencyTypes['hoaks_siber']->id, 'date' => $now->copy()->subHours(2)],
            $reportCyberPayload
        );

        $assignmentFlood = Assignment::updateOrCreate(
            ['report_id' => $reportFlood->id, 'agency_id' => $agencies['bpbd']->id],
            [
                'status' => 'on_progress',
                'description' => 'Tim lapangan menuju lokasi dengan pompa portable.',
                'admin_verification' => true,
                'date' => $now->copy()->subHours(2),
            ]
        );

        Assignment::updateOrCreate(
            ['report_id' => $reportCyber->id, 'agency_id' => $agencies['diskominfo']->id],
            [
                'status' => 'pending',
                'description' => 'Menunggu verifikasi evidence digital.',
                'admin_verification' => false,
                'date' => $now->copy()->subHour(),
            ]
        );

        ReportPhoto::updateOrCreate(
            ['report_id' => $reportFire->id, 'file_path' => 'sample/reports/fire-1.jpg'],
            ['uploaded_by' => $users['pelapor_1']->id, 'uploaded_at' => $now->copy()->subHours(6)]
        );
        ReportPhoto::updateOrCreate(
            ['report_id' => $reportFlood->id, 'file_path' => 'sample/reports/flood-1.jpg'],
            ['uploaded_by' => $users['pelapor_2']->id, 'uploaded_at' => $now->copy()->subHours(3)]
        );

        AssignmentPhoto::updateOrCreate(
            ['assignment_id' => $assignmentFlood->id, 'file_path' => 'sample/assignments/flood-response-1.jpg'],
            ['uploaded_by' => $users['instansi_bpbd']->id, 'uploaded_at' => $now->copy()->subMinutes(90)]
        );
    }
}
