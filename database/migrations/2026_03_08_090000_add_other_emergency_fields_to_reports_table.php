<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('reports', function (Blueprint $table) {
            $table->boolean('is_other_emergency')->default(false)->after('status');
            $table->string('other_emergency_title')->nullable()->after('description');
            $table->foreignId('triaged_by')->nullable()->after('other_emergency_title')->constrained('users')->nullOnDelete();
            $table->dateTime('triaged_at')->nullable()->after('triaged_by');

            $table->index('is_other_emergency');
            $table->index('triaged_by');
            $table->index('triaged_at');
        });
    }

    public function down(): void
    {
        Schema::table('reports', function (Blueprint $table) {
            $table->dropIndex(['is_other_emergency']);
            $table->dropIndex(['triaged_by']);
            $table->dropIndex(['triaged_at']);
            $table->dropConstrainedForeignId('triaged_by');
            $table->dropColumn(['is_other_emergency', 'other_emergency_title', 'triaged_at']);
        });
    }
};
