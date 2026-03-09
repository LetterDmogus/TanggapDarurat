<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('reports') && Schema::hasColumn('reports', 'location_id')) {
            Schema::table('reports', function (Blueprint $table) {
                $table->dropForeign(['location_id']);
                $table->dropIndex(['location_id']);
                $table->dropColumn('location_id');
            });
        }

        if (Schema::hasTable('locations')) {
            Schema::drop('locations');
        }
    }

    public function down(): void
    {
        if (!Schema::hasTable('locations')) {
            Schema::create('locations', function (Blueprint $table) {
                $table->id();
                $table->string('name');
                $table->string('location_type')->nullable();
                $table->decimal('longitude', 11, 7)->nullable();
                $table->decimal('latitude', 10, 7)->nullable();
                $table->foreignId('agency_id')->nullable()->constrained('agencies')->nullOnDelete();
                $table->json('metadata')->nullable();
                $table->timestamps();
                $table->softDeletes();

                $table->index('name');
                $table->index('location_type');
                $table->index(['latitude', 'longitude']);
            });
        }

        if (Schema::hasTable('reports') && !Schema::hasColumn('reports', 'location_id')) {
            Schema::table('reports', function (Blueprint $table) {
                $table->foreignId('location_id')->nullable()->after('user_id')->constrained('locations')->nullOnDelete();
                $table->index('location_id');
            });
        }
    }
};
