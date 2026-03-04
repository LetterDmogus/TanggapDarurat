<?php

namespace Database\Seeders\Legacy;

use App\Models\Legacy\Category;
use Illuminate\Database\Seeder;

class CategorySeeder extends Seeder
{
    public function run(): void
    {
        $categories = [
            ['name' => 'Medis', 'icon' => 'heart-pulse', 'color' => '#EF4444'],
            ['name' => 'Kebakaran', 'icon' => 'flame', 'color' => '#F97316'],
            ['name' => 'Kriminal', 'icon' => 'shield-alert', 'color' => '#8B5CF6'],
            ['name' => 'Bencana Alam', 'icon' => 'cloud-lightning', 'color' => '#3B82F6'],
            ['name' => 'Kecelakaan Lalu Lintas', 'icon' => 'car', 'color' => '#EAB308'],
        ];

        foreach ($categories as $category) {
            Category::updateOrCreate(
                ['name' => $category['name']],
                $category
            );
        }
    }
}

