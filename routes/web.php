<?php

use App\Http\Controllers\Admin\AgencyController;
use App\Http\Controllers\Admin\AgencyBranchController;
use App\Http\Controllers\Admin\ActivityLogController;
use App\Http\Controllers\Admin\AssignmentController as AdminAssignmentController;
use App\Http\Controllers\Admin\DashboardController as AdminDashboardController;
use App\Http\Controllers\Admin\EmergencyTypeController;
use App\Http\Controllers\Admin\MaintenanceController;
use App\Http\Controllers\Admin\ReportController as AdminReportController;
use App\Http\Controllers\Admin\RoutingRuleController;
use App\Http\Controllers\Admin\UserController;
use App\Http\Controllers\Admin\WebsiteSettingController;
use App\Http\Controllers\Instansi\AssignmentController as InstansiAssignmentController;
use App\Http\Controllers\Instansi\DashboardController as InstansiDashboardController;
use App\Http\Controllers\Manager\DashboardController as ManagerDashboardController;
use App\Http\Controllers\Manager\ReportController as ManagerReportController;
use App\Http\Controllers\Pelapor\ReportController as PelaporReportController;
use App\Models\WebsiteSetting;
use App\Http\Controllers\ProfileController;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Schema;
use Inertia\Inertia;

Route::get('/', function () {
    if (!Schema::hasTable('website_settings')) {
        return Inertia::render('Welcome', [
            'website' => [
                'site_name' => 'TanggapDarurat',
                'logo_url' => null,
                'contact_text' => null,
                'hero_image_urls' => [],
            ],
        ]);
    }

    $setting = WebsiteSetting::singleton();

    return Inertia::render('Welcome', [
        'website' => [
            'site_name' => $setting->site_name,
            'logo_url' => $setting->logoUrl(),
            'contact_text' => $setting->contact_text,
            'hero_image_urls' => array_values(array_filter($setting->heroImageUrls())),
        ],
    ]);
});

Route::get('/dashboard', function () {
    $role = auth()->user()->role;

    if (in_array($role, ['superadmin', 'admin'], true)) {
        return redirect()->route('admin.dashboard');
    }

    if ($role === 'manager') {
        return redirect()->route('manager.dashboard');
    }

    if ($role === 'instansi') {
        return redirect()->route('instansi.dashboard');
    }

    if ($role === 'pelapor') {
        return redirect()->route('pelapor.dashboard');
    }

    return Inertia::render('Dashboard');
})->middleware(['auth', 'verified'])->name('dashboard');

Route::middleware('auth')->group(function () {
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
});

Route::middleware(['auth', 'verified', 'role:superadmin,admin'])->prefix('admin')->name('admin.')->group(function () {
    Route::get('/dashboard', [AdminDashboardController::class, 'index'])->name('dashboard');

    Route::resource('agencies', AgencyController::class)->except(['create', 'show', 'edit']);
    Route::post('agencies/{id}/restore', [AgencyController::class, 'restore'])->name('agencies.restore');
    Route::delete('agencies/{id}/force-delete', [AgencyController::class, 'forceDelete'])->name('agencies.force-delete');
    Route::resource('agency-branches', AgencyBranchController::class)->except(['create', 'show', 'edit']);

    Route::resource('emergency-types', EmergencyTypeController::class)->except(['create', 'show', 'edit']);
    Route::post('emergency-types/{id}/restore', [EmergencyTypeController::class, 'restore'])->name('emergency-types.restore');
    Route::delete('emergency-types/{id}/force-delete', [EmergencyTypeController::class, 'forceDelete'])->name('emergency-types.force-delete');

    Route::resource('routing-rules', RoutingRuleController::class)->except(['create', 'show', 'edit']);
    Route::post('routing-rules/{id}/restore', [RoutingRuleController::class, 'restore'])->name('routing-rules.restore');
    Route::delete('routing-rules/{id}/force-delete', [RoutingRuleController::class, 'forceDelete'])->name('routing-rules.force-delete');

    Route::post('users/{id}/restore', [UserController::class, 'restore'])->name('users.restore');
    Route::delete('users/{id}/force-delete', [UserController::class, 'forceDelete'])->name('users.force-delete');
    Route::resource('users', UserController::class)->except(['create', 'show', 'edit']);
    Route::get('reports', [AdminReportController::class, 'index'])->name('reports.index');
    Route::get('reports/{report}', [AdminReportController::class, 'show'])->name('reports.show');
    Route::patch('reports/{report}/classify-other', [AdminReportController::class, 'classifyOther'])->name('reports.classify-other');
    Route::patch('reports/{report}/validation', [AdminReportController::class, 'updateValidation'])->name('reports.update-validation');
    Route::get('assignments', [AdminAssignmentController::class, 'index'])->name('assignments.index');
    Route::get('activity-logs', [ActivityLogController::class, 'index'])->name('activity-logs.index');
});

Route::middleware(['auth', 'verified', 'role:superadmin'])->prefix('admin')->name('admin.')->group(function () {
    Route::get('website-settings', [WebsiteSettingController::class, 'edit'])->name('website-settings.edit');
    Route::post('website-settings', [WebsiteSettingController::class, 'update'])->name('website-settings.update');

    Route::get('maintenance', [MaintenanceController::class, 'index'])->name('maintenance.index');
    Route::post('maintenance/backup', [MaintenanceController::class, 'runBackup'])->name('maintenance.run-backup');
    Route::get('maintenance/backup/{filename}', [MaintenanceController::class, 'downloadBackup'])->name('maintenance.download-backup');
    Route::delete('maintenance/backup/{filename}', [MaintenanceController::class, 'deleteBackup'])->name('maintenance.delete-backup');
    Route::get('maintenance/export/core', [MaintenanceController::class, 'exportCoreCsv'])->name('maintenance.export-core');
    Route::post('maintenance/import/core', [MaintenanceController::class, 'importCoreCsv'])->name('maintenance.import-core');
    Route::get('maintenance/export/emergency-routing', [MaintenanceController::class, 'exportEmergencyRoutingCsv'])->name('maintenance.export-emergency-routing');
    Route::post('maintenance/import/emergency-routing', [MaintenanceController::class, 'importEmergencyRoutingCsv'])->name('maintenance.import-emergency-routing');
    Route::post('maintenance/reset', [MaintenanceController::class, 'resetSystem'])->name('maintenance.reset');
});

Route::middleware(['auth', 'verified', 'role:manager'])->prefix('manager')->name('manager.')->group(function () {
    Route::get('/dashboard', [ManagerDashboardController::class, 'index'])->name('dashboard');
    Route::get('/reports', [ManagerReportController::class, 'index'])->name('reports.index');
    Route::get('/reports/print', [ManagerReportController::class, 'print'])->name('reports.print');
    Route::get('/reports/export/excel', [ManagerReportController::class, 'exportExcel'])->name('reports.export.excel');
    Route::get('/reports/export/pdf', [ManagerReportController::class, 'exportPdf'])->name('reports.export.pdf');
});

Route::middleware(['auth', 'verified', 'role:instansi'])->prefix('instansi')->name('instansi.')->group(function () {
    Route::get('/dashboard', [InstansiDashboardController::class, 'index'])->name('dashboard');

    Route::get('/assignments', [InstansiAssignmentController::class, 'index'])->name('assignments.index');
    Route::get('/assignments/agency', [InstansiAssignmentController::class, 'indexAllBranches'])->name('assignments.index-agency');
    Route::patch('/assignments/{assignment}/status', [InstansiAssignmentController::class, 'updateStatus'])->name('assignments.update-status');
    Route::post('/assignments/{assignment}/completion', [InstansiAssignmentController::class, 'submitCompletion'])->name('assignments.submit-completion');
    Route::post('/assignments/{assignment}/steps', [InstansiAssignmentController::class, 'addStepNote'])->name('assignments.add-step');
    Route::get('/reports/{report}', [InstansiAssignmentController::class, 'showReport'])->name('reports.show');
    Route::get('/reports/{report}/location', [InstansiAssignmentController::class, 'showLocation'])->name('reports.location');
});

Route::middleware(['auth', 'verified', 'role:pelapor'])->prefix('pelapor')->name('pelapor.')->group(function () {
    Route::get('/dashboard', function () {
        return Inertia::render('Pelapor/Dashboard');
    })->name('dashboard');

    Route::get('/reports', [PelaporReportController::class, 'index'])->name('reports.index');
    Route::get('/reports/create', [PelaporReportController::class, 'create'])->name('reports.create');
    Route::get('/reports/branch-candidates', [PelaporReportController::class, 'branchCandidates'])->name('reports.branch-candidates');
    Route::post('/reports', [PelaporReportController::class, 'store'])->name('reports.store');
    Route::get('/reports/{report}', [PelaporReportController::class, 'show'])->name('reports.show');
});

require __DIR__.'/auth.php';
