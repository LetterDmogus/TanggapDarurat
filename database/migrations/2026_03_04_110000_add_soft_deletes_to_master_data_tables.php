<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('agencies', function (Blueprint $table) {
            $table->softDeletes();
        });

        Schema::table('emergency_types', function (Blueprint $table) {
            $table->softDeletes();
        });

        Schema::table('locations', function (Blueprint $table) {
            $table->softDeletes();
        });

        Schema::table('routing_rules', function (Blueprint $table) {
            $table->softDeletes();
        });
    }

    public function down(): void
    {
        Schema::table('agencies', function (Blueprint $table) {
            $table->dropSoftDeletes();
        });

        Schema::table('emergency_types', function (Blueprint $table) {
            $table->dropSoftDeletes();
        });

        Schema::table('locations', function (Blueprint $table) {
            $table->dropSoftDeletes();
        });

        Schema::table('routing_rules', function (Blueprint $table) {
            $table->dropSoftDeletes();
        });
    }
};
