<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('assignments', function (Blueprint $table) {
            $table->foreignId('agency_branch_id')->nullable()->after('agency_id')->constrained('agency_branches')->nullOnDelete();
            $table->decimal('distance_km', 10, 3)->nullable()->after('description');

            $table->index('agency_branch_id');
            $table->index('distance_km');
        });
    }

    public function down(): void
    {
        Schema::table('assignments', function (Blueprint $table) {
            $table->dropIndex(['agency_branch_id']);
            $table->dropIndex(['distance_km']);
            $table->dropConstrainedForeignId('agency_branch_id');
            $table->dropColumn('distance_km');
        });
    }
};
