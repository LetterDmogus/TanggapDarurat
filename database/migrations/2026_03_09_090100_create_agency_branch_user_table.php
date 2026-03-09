<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('agency_branch_user', function (Blueprint $table) {
            $table->id();
            $table->foreignId('agency_branch_id')->constrained('agency_branches')->cascadeOnDelete();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->boolean('is_primary_branch')->default(false);
            $table->timestamps();

            $table->unique(['agency_branch_id', 'user_id']);
            $table->index('user_id');
            $table->index('is_primary_branch');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('agency_branch_user');
    }
};
