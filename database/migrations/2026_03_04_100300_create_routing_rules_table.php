<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('routing_rules', function (Blueprint $table) {
            $table->id();
            $table->foreignId('emergency_type_id')->constrained('emergency_types')->cascadeOnDelete();
            $table->foreignId('agency_id')->constrained('agencies')->cascadeOnDelete();
            $table->unsignedInteger('priority')->default(1);
            $table->boolean('is_primary')->default(false);
            $table->string('area')->nullable();
            $table->timestamps();

            $table->index(['emergency_type_id', 'priority']);
            $table->index(['agency_id', 'area']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('routing_rules');
    }
};
