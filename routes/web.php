<?php

use App\Http\Controllers\ProfileController;
use Illuminate\Foundation\Application;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    return Inertia::render('Welcome', [
        'canLogin' => Route::has('login'),
        'canRegister' => Route::has('register'),
        'laravelVersion' => Application::VERSION,
        'phpVersion' => PHP_VERSION,
    ]);
});

Route::get('/dashboard', function () {
    if (in_array(auth()->user()->role, ['admin', 'manager', 'super_admin'])) {
        return redirect()->route('admin.dashboard');
    }

    return Inertia::render('Dashboard');
})->middleware(['auth', 'verified'])->name('dashboard');

Route::middleware('auth')->group(function () {
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
});

Route::middleware(['auth', 'role:admin,manager,super_admin'])->prefix('admin')->name('admin.')->group(function () {
    Route::get('/dashboard', function () {
        return Inertia::render('Admin/Dashboard');
    })->name('dashboard');

    // Categories
    Route::post('categories/{id}/restore', [\App\Http\Controllers\Admin\CategoryController::class, 'restore'])->name('categories.restore');
    Route::delete('categories/{id}/force-delete', [\App\Http\Controllers\Admin\CategoryController::class, 'forceDelete'])->name('categories.force-delete');
    Route::resource('categories', \App\Http\Controllers\Admin\CategoryController::class)->except(['create', 'show', 'edit']);

    // Emergency Units
    Route::post('emergency-units/{id}/restore', [\App\Http\Controllers\Admin\EmergencyUnitController::class, 'restore'])->name('emergency-units.restore');
    Route::delete('emergency-units/{id}/force-delete', [\App\Http\Controllers\Admin\EmergencyUnitController::class, 'forceDelete'])->name('emergency-units.force-delete');
    Route::resource('emergency-units', \App\Http\Controllers\Admin\EmergencyUnitController::class)->except(['create', 'show', 'edit']);

    // Users
    Route::post('users/{id}/restore', [\App\Http\Controllers\Admin\UserController::class, 'restore'])->name('users.restore');
    Route::delete('users/{id}/force-delete', [\App\Http\Controllers\Admin\UserController::class, 'forceDelete'])->name('users.force-delete');
    Route::resource('users', \App\Http\Controllers\Admin\UserController::class)->except(['create', 'show', 'edit']);

    // Inventory
    Route::post('inventory/{id}/restore', [\App\Http\Controllers\Admin\InventoryController::class, 'restore'])->name('inventory.restore');
    Route::delete('inventory/{id}/force-delete', [\App\Http\Controllers\Admin\InventoryController::class, 'forceDelete'])->name('inventory.force-delete');
    Route::resource('inventory', \App\Http\Controllers\Admin\InventoryController::class)->except(['create', 'show', 'edit']);

    // Operational Costs
    Route::post('operational-costs/{id}/restore', [\App\Http\Controllers\Admin\OperationalCostController::class, 'restore'])->name('operational-costs.restore');
    Route::delete('operational-costs/{id}/force-delete', [\App\Http\Controllers\Admin\OperationalCostController::class, 'forceDelete'])->name('operational-costs.force-delete');
    Route::resource('operational-costs', \App\Http\Controllers\Admin\OperationalCostController::class)->except(['create', 'show', 'edit']);
});

require __DIR__ . '/auth.php';

