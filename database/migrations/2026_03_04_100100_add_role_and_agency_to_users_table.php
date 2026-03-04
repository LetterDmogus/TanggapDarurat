<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->enum('role', ['superadmin', 'admin', 'manager', 'instansi', 'pelapor'])
                ->default('pelapor')
                ->after('email');
            $table->foreignId('agency_id')
                ->nullable()
                ->after('role')
                ->constrained('agencies')
                ->nullOnDelete();
            $table->softDeletes();

            $table->index('role');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropForeign(['agency_id']);
            $table->dropIndex(['role']);
            $table->dropColumn(['role', 'agency_id']);
            $table->dropSoftDeletes();
        });
    }
};
