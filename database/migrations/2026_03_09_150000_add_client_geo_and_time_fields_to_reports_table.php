<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('reports', function (Blueprint $table) {
            $table->dateTime('client_reported_at')->nullable()->after('date');
            $table->string('client_timezone', 64)->nullable()->after('client_reported_at');
            $table->integer('client_utc_offset_minutes')->nullable()->after('client_timezone');
            $table->decimal('geo_accuracy_m', 10, 2)->nullable()->after('client_utc_offset_minutes');
            $table->string('geo_source', 20)->nullable()->after('geo_accuracy_m');
            $table->dateTime('server_received_at')->useCurrent()->after('geo_source');

            $table->index('client_reported_at');
            $table->index('server_received_at');
            $table->index('geo_source');
        });
    }

    public function down(): void
    {
        Schema::table('reports', function (Blueprint $table) {
            $table->dropIndex(['client_reported_at']);
            $table->dropIndex(['server_received_at']);
            $table->dropIndex(['geo_source']);
            $table->dropColumn([
                'client_reported_at',
                'client_timezone',
                'client_utc_offset_minutes',
                'geo_accuracy_m',
                'geo_source',
                'server_received_at',
            ]);
        });
    }
};
