<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Storage;

class WebsiteSetting extends Model
{
    protected $fillable = [
        'site_name',
        'logo_path',
        'contact_text',
        'hero_images',
    ];

    protected $casts = [
        'hero_images' => 'array',
    ];

    public static function singleton(): self
    {
        return static::query()->firstOrCreate(
            ['id' => 1],
            [
                'site_name' => 'TanggapDarurat',
                'contact_text' => 'Need rollout planning or a live demo for your response team? Reach us at command@tanggapdarurat.id.',
                'hero_images' => [
                    '/images/slide-1.jpg',
                    '/images/slide-2.jpg',
                    '/images/slide-3.jpg',
                ],
            ],
        );
    }

    public function logoUrl(): ?string
    {
        if (!$this->logo_path) {
            return null;
        }

        return $this->toPublicUrl($this->logo_path);
    }

    public function heroImageUrls(): array
    {
        $items = array_values(array_filter((array) $this->hero_images));

        return array_map(fn ($path) => is_string($path) ? $this->toPublicUrl($path) : null, $items);
    }

    private function toPublicUrl(string $path): string
    {
        if (str_starts_with($path, 'http://') || str_starts_with($path, 'https://')) {
            return $path;
        }

        if (str_starts_with($path, '/')) {
            return $path;
        }

        if (str_starts_with($path, 'storage/')) {
            return '/'.$path;
        }

        return Storage::disk('public')->url($path);
    }
}
