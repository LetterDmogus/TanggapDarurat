<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('inventory', function (Blueprint $table) {
            $table->id();
            $table->string('item_name');
            $table->string('sku')->nullable()->unique();
            $table->decimal('unit_price', 15, 2)->default(0);
            $table->integer('stock_quantity')->default(0);
            $table->string('unit')->default('pcs');
            $table->integer('min_stock')->default(10);
            $table->text('description')->nullable();
            $table->timestamps();
            $table->softDeletes();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('inventory');
    }
};
