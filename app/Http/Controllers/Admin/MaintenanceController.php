<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Agency;
use App\Models\EmergencyType;
use App\Models\Location;
use App\Models\RoutingRule;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;

class MaintenanceController extends Controller
{
    private string $backupPath = 'backups';

    public function index()
    {
        $backupFiles = [];

        if (Storage::exists($this->backupPath)) {
            $files = Storage::files($this->backupPath);
            foreach ($files as $file) {
                $backupFiles[] = [
                    'filename' => basename($file),
                    'size' => $this->formatBytes(Storage::size($file)),
                    'created_at' => date('Y-m-d H:i:s', Storage::lastModified($file)),
                ];
            }
        }

        usort($backupFiles, fn ($a, $b) => strcmp($b['created_at'], $a['created_at']));

        return Inertia::render('Admin/Maintenance/Index', [
            'backups' => $backupFiles,
        ]);
    }

    public function runBackup()
    {
        $binary = env('MYSQLDUMP_BINARY', 'C:\\laragon\\bin\\mysql\\mysql-8.4.3-winx64\\bin\\mysqldump.exe');
        $filename = 'backup_'.time().'.sql';
        Storage::makeDirectory($this->backupPath);
        $outputPath = Storage::path($this->backupPath.'/'.$filename);
        $db = config('database.connections.mysql.database');
        $user = config('database.connections.mysql.username');
        $pass = config('database.connections.mysql.password');

        if (blank($db) || blank($user)) {
            return back()->with('error', 'Database config mysql tidak lengkap untuk proses backup.');
        }

        $passwordPart = filled($pass) ? "-p{$pass}" : '';
        $command = "\"{$binary}\" -h 127.0.0.1 -u {$user} {$passwordPart} {$db} > ".escapeshellarg($outputPath).' 2>&1';
        $output = shell_exec($command);

        if (Storage::exists($this->backupPath.'/'.$filename) && Storage::size($this->backupPath.'/'.$filename) > 0) {
            return back()->with('success', "Backup created! File: {$filename}");
        }

        return back()->with('error', 'Failed. System says: '.($output ?: 'Unknown Error'));
    }

    public function downloadBackup(string $filename)
    {
        $path = $this->backupPath.'/'.$filename;

        if (!Storage::exists($path)) {
            abort(404);
        }

        return Storage::download($path);
    }

    public function deleteBackup(string $filename)
    {
        $path = $this->backupPath.'/'.$filename;

        if (Storage::exists($path)) {
            Storage::delete($path);
            return back()->with('success', 'Backup deleted successfully.');
        }

        return back()->with('error', 'Backup file not found.');
    }

    public function exportCoreCsv()
    {
        $fileName = 'core_export_'.date('Y-m-d_H-i-s').'.csv';

        $headers = [
            'Content-type' => 'text/csv',
            'Content-Disposition' => "attachment; filename={$fileName}",
            'Pragma' => 'no-cache',
            'Cache-Control' => 'must-revalidate, post-check=0, pre-check=0',
            'Expires' => '0',
        ];

        $columns = [
            'record_type',
            'agency_name',
            'agency_type',
            'agency_area',
            'agency_contact',
            'user_name',
            'user_email',
            'user_role',
            'user_email_verified_at',
            'user_password',
            'user_agency_name',
            'location_name',
            'location_type',
            'location_latitude',
            'location_longitude',
            'location_agency_name',
            'location_metadata_json',
            'deleted_at',
        ];

        $agencies = Agency::withTrashed()->orderBy('id')->get();
        $users = User::withTrashed()->orderBy('id')->get();
        $locations = Location::withTrashed()->orderBy('id')->get();

        $callback = function () use ($columns, $agencies, $users, $locations): void {
            $file = fopen('php://output', 'w');
            fputcsv($file, $columns);

            foreach ($agencies as $agency) {
                fputcsv($file, [
                    'agency',
                    $agency->name,
                    $agency->type,
                    $agency->area,
                    $agency->contact,
                    '',
                    '',
                    '',
                    '',
                    '',
                    '',
                    '',
                    '',
                    '',
                    '',
                    '',
                    '',
                    optional($agency->deleted_at)?->toDateTimeString(),
                ]);
            }

            foreach ($users as $user) {
                fputcsv($file, [
                    'user',
                    '',
                    '',
                    '',
                    '',
                    $user->name,
                    $user->email,
                    $user->role,
                    optional($user->email_verified_at)?->toDateTimeString(),
                    '',
                    optional($user->agency)->name,
                    '',
                    '',
                    '',
                    '',
                    '',
                    '',
                    optional($user->deleted_at)?->toDateTimeString(),
                ]);
            }

            foreach ($locations as $location) {
                fputcsv($file, [
                    'location',
                    '',
                    '',
                    '',
                    '',
                    '',
                    '',
                    '',
                    '',
                    '',
                    '',
                    $location->name,
                    $location->location_type,
                    $location->latitude,
                    $location->longitude,
                    optional($location->agency)->name,
                    $location->metadata ? json_encode($location->metadata, JSON_UNESCAPED_UNICODE) : '',
                    optional($location->deleted_at)?->toDateTimeString(),
                ]);
            }

            fclose($file);
        };

        return response()->stream($callback, 200, $headers);
    }

    public function importCoreCsv(Request $request)
    {
        $request->validate([
            'file' => 'required|mimes:csv,txt',
        ]);

        $file = $request->file('file');
        $handle = fopen($file->getRealPath(), 'r');

        if ($handle === false) {
            return back()->with('error', 'File CSV tidak bisa dibaca.');
        }

        $header = fgetcsv($handle);
        if (!$header) {
            fclose($handle);
            return back()->with('error', 'Header CSV tidak valid.');
        }

        $successCount = 0;
        $errorCount = 0;

        DB::beginTransaction();
        try {
            while (($row = fgetcsv($handle)) !== false) {
                try {
                    $data = array_combine($header, $row);
                    if ($data === false) {
                        $errorCount++;
                        continue;
                    }

                    $recordType = strtolower(trim((string) ($data['record_type'] ?? '')));

                    if ($recordType === 'agency') {
                        $this->importAgencyRow($data);
                    } elseif ($recordType === 'user') {
                        $this->importUserRow($data);
                    } elseif ($recordType === 'location') {
                        $this->importLocationRow($data);
                    } else {
                        $errorCount++;
                        continue;
                    }

                    $successCount++;
                } catch (\Throwable) {
                    $errorCount++;
                }
            }

            DB::commit();
        } catch (\Throwable $e) {
            DB::rollBack();
            fclose($handle);
            return back()->with('error', 'Import gagal: '.$e->getMessage());
        }

        fclose($handle);

        return back()->with('success', "Import core selesai. Success: {$successCount}, Errors: {$errorCount}");
    }

    public function exportEmergencyRoutingCsv()
    {
        $fileName = 'emergency_routing_export_'.date('Y-m-d_H-i-s').'.csv';

        $headers = [
            'Content-type' => 'text/csv',
            'Content-Disposition' => "attachment; filename={$fileName}",
            'Pragma' => 'no-cache',
            'Cache-Control' => 'must-revalidate, post-check=0, pre-check=0',
            'Expires' => '0',
        ];

        $columns = [
            'record_type',
            'emergency_name',
            'emergency_display_name',
            'emergency_description',
            'emergency_is_need_location',
            'emergency_form_schema_json',
            'routing_emergency_name',
            'routing_agency_name',
            'routing_priority',
            'routing_is_primary',
            'routing_area',
            'deleted_at',
        ];

        $emergencyTypes = EmergencyType::withTrashed()->orderBy('id')->get();
        $routingRules = RoutingRule::withTrashed()->with(['emergencyType', 'agency'])->orderBy('id')->get();

        $callback = function () use ($columns, $emergencyTypes, $routingRules): void {
            $file = fopen('php://output', 'w');
            fputcsv($file, $columns);

            foreach ($emergencyTypes as $type) {
                fputcsv($file, [
                    'emergency_type',
                    $type->name,
                    $type->display_name,
                    $type->description,
                    $type->is_need_location ? '1' : '0',
                    $type->form_schema ? json_encode($type->form_schema, JSON_UNESCAPED_UNICODE) : '',
                    '',
                    '',
                    '',
                    '',
                    '',
                    optional($type->deleted_at)?->toDateTimeString(),
                ]);
            }

            foreach ($routingRules as $rule) {
                fputcsv($file, [
                    'routing_rule',
                    '',
                    '',
                    '',
                    '',
                    '',
                    optional($rule->emergencyType)->name,
                    optional($rule->agency)->name,
                    $rule->priority,
                    $rule->is_primary ? '1' : '0',
                    $rule->area,
                    optional($rule->deleted_at)?->toDateTimeString(),
                ]);
            }

            fclose($file);
        };

        return response()->stream($callback, 200, $headers);
    }

    public function importEmergencyRoutingCsv(Request $request)
    {
        $request->validate([
            'file' => 'required|mimes:csv,txt',
        ]);

        $file = $request->file('file');
        $handle = fopen($file->getRealPath(), 'r');

        if ($handle === false) {
            return back()->with('error', 'File CSV tidak bisa dibaca.');
        }

        $header = fgetcsv($handle);
        if (!$header) {
            fclose($handle);
            return back()->with('error', 'Header CSV tidak valid.');
        }

        $successCount = 0;
        $errorCount = 0;

        DB::beginTransaction();
        try {
            while (($row = fgetcsv($handle)) !== false) {
                try {
                    $data = array_combine($header, $row);
                    if ($data === false) {
                        $errorCount++;
                        continue;
                    }

                    $recordType = strtolower(trim((string) ($data['record_type'] ?? '')));

                    if ($recordType === 'emergency_type') {
                        $this->importEmergencyTypeRow($data);
                    } elseif ($recordType === 'routing_rule') {
                        $this->importRoutingRuleRow($data);
                    } else {
                        $errorCount++;
                        continue;
                    }

                    $successCount++;
                } catch (\Throwable) {
                    $errorCount++;
                }
            }

            DB::commit();
        } catch (\Throwable $e) {
            DB::rollBack();
            fclose($handle);
            return back()->with('error', 'Import gagal: '.$e->getMessage());
        }

        fclose($handle);

        return back()->with('success', "Import emergency+routing selesai. Success: {$successCount}, Errors: {$errorCount}");
    }

    public function resetSystem()
    {
        try {
            Artisan::call('cache:clear');
            Artisan::call('migrate:fresh', ['--force' => true, '--seed' => true]);

            return back()->with('success', 'System has been reset to default successfully.');
        } catch (\Exception $e) {
            return back()->with('error', 'Reset failed: '.$e->getMessage());
        }
    }

    private function importAgencyRow(array $data): void
    {
        $name = trim((string) ($data['agency_name'] ?? ''));
        if ($name === '') {
            throw new \RuntimeException('agency_name kosong');
        }

        $agency = Agency::withTrashed()->firstOrNew(['name' => $name]);
        $agency->type = $this->emptyToNull($data['agency_type'] ?? null);
        $agency->area = $this->emptyToNull($data['agency_area'] ?? null);
        $agency->contact = $this->emptyToNull($data['agency_contact'] ?? null);
        $agency->save();

        $this->applySoftDeleteState($agency, $data['deleted_at'] ?? null);
    }

    private function importUserRow(array $data): void
    {
        $email = trim((string) ($data['user_email'] ?? ''));
        if ($email === '') {
            throw new \RuntimeException('user_email kosong');
        }

        $agency = null;
        $agencyName = trim((string) ($data['user_agency_name'] ?? ''));
        if ($agencyName !== '') {
            $agency = Agency::withTrashed()->firstOrCreate(['name' => $agencyName]);
        }

        $user = User::withTrashed()->firstOrNew(['email' => $email]);
        $user->name = trim((string) ($data['user_name'] ?? $user->name ?? ''));
        $role = trim((string) ($data['user_role'] ?? 'pelapor'));
        $user->role = in_array($role, ['superadmin', 'admin', 'manager', 'instansi', 'pelapor'], true) ? $role : 'pelapor';
        $user->agency_id = $agency?->id;

        $verifiedAt = $this->emptyToNull($data['user_email_verified_at'] ?? null);
        $user->email_verified_at = $verifiedAt;

        $password = trim((string) ($data['user_password'] ?? ''));
        if ($password !== '') {
            $user->password = Hash::make($password);
        } elseif (!$user->exists) {
            $user->password = Hash::make('password');
        }

        $user->save();
        $this->applySoftDeleteState($user, $data['deleted_at'] ?? null);
    }

    private function importLocationRow(array $data): void
    {
        $name = trim((string) ($data['location_name'] ?? ''));
        if ($name === '') {
            throw new \RuntimeException('location_name kosong');
        }

        $agency = null;
        $agencyName = trim((string) ($data['location_agency_name'] ?? ''));
        if ($agencyName !== '') {
            $agency = Agency::withTrashed()->firstOrCreate(['name' => $agencyName]);
        }

        $latitude = $this->toNullableFloat($data['location_latitude'] ?? null);
        $longitude = $this->toNullableFloat($data['location_longitude'] ?? null);

        $location = Location::withTrashed()->firstOrNew([
            'name' => $name,
            'agency_id' => $agency?->id,
            'latitude' => $latitude,
            'longitude' => $longitude,
        ]);

        $location->location_type = $this->emptyToNull($data['location_type'] ?? null);
        $location->agency_id = $agency?->id;
        $location->latitude = $latitude;
        $location->longitude = $longitude;

        $metadataJson = trim((string) ($data['location_metadata_json'] ?? ''));
        $location->metadata = $metadataJson !== '' ? (json_decode($metadataJson, true) ?: null) : null;

        $location->save();
        $this->applySoftDeleteState($location, $data['deleted_at'] ?? null);
    }

    private function importEmergencyTypeRow(array $data): void
    {
        $name = trim((string) ($data['emergency_name'] ?? ''));
        if ($name === '') {
            throw new \RuntimeException('emergency_name kosong');
        }

        $type = EmergencyType::withTrashed()->firstOrNew(['name' => $name]);
        $type->display_name = $this->emptyToNull($data['emergency_display_name'] ?? null);
        $type->description = $this->emptyToNull($data['emergency_description'] ?? null);
        $type->is_need_location = $this->toBoolean($data['emergency_is_need_location'] ?? false);

        $schemaJson = trim((string) ($data['emergency_form_schema_json'] ?? ''));
        $type->form_schema = $schemaJson !== '' ? (json_decode($schemaJson, true) ?: null) : null;

        $type->save();
        $this->applySoftDeleteState($type, $data['deleted_at'] ?? null);
    }

    private function importRoutingRuleRow(array $data): void
    {
        $emergencyName = trim((string) ($data['routing_emergency_name'] ?? ''));
        $agencyName = trim((string) ($data['routing_agency_name'] ?? ''));
        if ($emergencyName === '' || $agencyName === '') {
            throw new \RuntimeException('routing_emergency_name atau routing_agency_name kosong');
        }

        $emergencyType = EmergencyType::withTrashed()->firstOrCreate(['name' => $emergencyName], [
            'display_name' => $emergencyName,
        ]);
        $agency = Agency::withTrashed()->firstOrCreate(['name' => $agencyName]);

        $priority = (int) ($data['routing_priority'] ?? 1);
        if ($priority < 1) {
            $priority = 1;
        }

        $area = $this->emptyToNull($data['routing_area'] ?? null);

        $rule = RoutingRule::withTrashed()->firstOrNew([
            'emergency_type_id' => $emergencyType->id,
            'agency_id' => $agency->id,
            'priority' => $priority,
            'area' => $area,
        ]);

        $rule->is_primary = $this->toBoolean($data['routing_is_primary'] ?? false);
        $rule->save();
        $this->applySoftDeleteState($rule, $data['deleted_at'] ?? null);
    }

    private function applySoftDeleteState($model, mixed $deletedAt): void
    {
        $deletedAt = $this->emptyToNull($deletedAt);
        if ($deletedAt) {
            if (!$model->trashed()) {
                $model->delete();
            }

            return;
        }

        if ($model->trashed()) {
            $model->restore();
        }
    }

    private function emptyToNull(mixed $value): mixed
    {
        if ($value === null) {
            return null;
        }

        $string = trim((string) $value);
        return $string === '' ? null : $string;
    }

    private function toNullableFloat(mixed $value): ?float
    {
        $value = $this->emptyToNull($value);
        if ($value === null) {
            return null;
        }

        return (float) $value;
    }

    private function toBoolean(mixed $value): bool
    {
        if (is_bool($value)) {
            return $value;
        }

        $normalized = strtolower(trim((string) $value));
        return in_array($normalized, ['1', 'true', 'yes', 'y'], true);
    }

    private function formatBytes(int $bytes, int $precision = 2): string
    {
        $units = ['B', 'KB', 'MB', 'GB', 'TB'];
        $bytes = max($bytes, 0);
        $pow = floor(($bytes ? log($bytes) : 0) / log(1024));
        $pow = min($pow, count($units) - 1);
        $bytes /= (1 << (10 * $pow));

        return round($bytes, $precision).' '.$units[$pow];
    }
}
