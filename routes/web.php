<?php

use App\Http\Controllers\Admin\AgencyController;
use App\Http\Controllers\Admin\EmergencyTypeController;
use App\Http\Controllers\Admin\LocationController;
use App\Http\Controllers\Admin\ReportController as AdminReportController;
use App\Http\Controllers\Admin\RoutingRuleController;
use App\Http\Controllers\Admin\UserController;
use App\Http\Controllers\Pelapor\ReportController as PelaporReportController;
use App\Http\Controllers\ProfileController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    return Inertia::render('Welcome');
});

Route::get('/dashboard', function () {
    $role = auth()->user()->role;

    if (in_array($role, ['superadmin', 'admin', 'manager'], true)) {
        return redirect()->route('admin.dashboard');
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

Route::middleware(['auth', 'role:superadmin,admin,manager'])->prefix('admin')->name('admin.')->group(function () {
    Route::get('/dashboard', function () {
        return Inertia::render('Admin/Dashboard');
    })->name('dashboard');

    Route::resource('agencies', AgencyController::class)->except(['create', 'show', 'edit']);
    Route::post('agencies/{id}/restore', [AgencyController::class, 'restore'])->name('agencies.restore');
    Route::delete('agencies/{id}/force-delete', [AgencyController::class, 'forceDelete'])->name('agencies.force-delete');

    Route::resource('emergency-types', EmergencyTypeController::class)->except(['create', 'show', 'edit']);
    Route::post('emergency-types/{id}/restore', [EmergencyTypeController::class, 'restore'])->name('emergency-types.restore');
    Route::delete('emergency-types/{id}/force-delete', [EmergencyTypeController::class, 'forceDelete'])->name('emergency-types.force-delete');

    Route::resource('locations', LocationController::class)->except(['create', 'show', 'edit']);
    Route::post('locations/{id}/restore', [LocationController::class, 'restore'])->name('locations.restore');
    Route::delete('locations/{id}/force-delete', [LocationController::class, 'forceDelete'])->name('locations.force-delete');

    Route::resource('routing-rules', RoutingRuleController::class)->except(['create', 'show', 'edit']);
    Route::post('routing-rules/{id}/restore', [RoutingRuleController::class, 'restore'])->name('routing-rules.restore');
    Route::delete('routing-rules/{id}/force-delete', [RoutingRuleController::class, 'forceDelete'])->name('routing-rules.force-delete');

    Route::post('users/{id}/restore', [UserController::class, 'restore'])->name('users.restore');
    Route::delete('users/{id}/force-delete', [UserController::class, 'forceDelete'])->name('users.force-delete');
    Route::resource('users', UserController::class)->except(['create', 'show', 'edit']);
    Route::get('reports', [AdminReportController::class, 'index'])->name('reports.index');
});

Route::middleware(['auth', 'role:instansi'])->prefix('instansi')->name('instansi.')->group(function () {
    Route::get('/dashboard', function () {
        return Inertia::render('Instansi/Dashboard');
    })->name('dashboard');
});

Route::middleware(['auth', 'role:pelapor'])->prefix('pelapor')->name('pelapor.')->group(function () {
    Route::get('/dashboard', function () {
        return Inertia::render('Pelapor/Dashboard');
    })->name('dashboard');

    Route::get('/reports', [PelaporReportController::class, 'index'])->name('reports.index');
    Route::get('/reports/create', [PelaporReportController::class, 'create'])->name('reports.create');
    Route::post('/reports', [PelaporReportController::class, 'store'])->name('reports.store');
    Route::get('/reports/{report}', [PelaporReportController::class, 'show'])->name('reports.show');
});

require __DIR__.'/auth.php';
