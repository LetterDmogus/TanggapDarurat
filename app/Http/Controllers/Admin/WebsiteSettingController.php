<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\WebsiteSetting;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;

class WebsiteSettingController extends Controller
{
    private function toDiskPath(?string $path): ?string
    {
        if (!$path) {
            return null;
        }

        $normalized = ltrim($path, '/');
        if (str_starts_with($normalized, 'storage/')) {
            return substr($normalized, strlen('storage/'));
        }

        return $normalized;
    }

    public function edit()
    {
        $setting = WebsiteSetting::singleton();

        return Inertia::render('Admin/WebsiteSettings/Edit', [
            'setting' => [
                'site_name' => $setting->site_name,
                'contact_text' => $setting->contact_text,
                'logo_url' => $setting->logoUrl(),
                'hero_image_urls' => array_values(array_filter($setting->heroImageUrls())),
            ],
        ]);
    }

    public function update(Request $request)
    {
        $setting = WebsiteSetting::singleton();

        $validated = $request->validate([
            'site_name' => 'required|string|max:255',
            'contact_text' => 'nullable|string|max:2000',
            'logo' => 'nullable|image|max:5120',
            'hero_images' => 'nullable|array|min:1|max:6',
            'hero_images.*' => 'required|image|max:5120',
            'remove_logo' => 'nullable|boolean',
            'remove_hero_images' => 'nullable|boolean',
        ]);

        $data = [
            'site_name' => $validated['site_name'],
            'contact_text' => $validated['contact_text'] ?? null,
        ];

        $removeLogo = (bool) ($validated['remove_logo'] ?? false);
        if ($removeLogo && $setting->logo_path) {
            $oldLogoDiskPath = $this->toDiskPath($setting->logo_path);
            if ($oldLogoDiskPath && !str_starts_with($oldLogoDiskPath, 'images/')) {
                Storage::disk('public')->delete($oldLogoDiskPath);
            }
            $data['logo_path'] = null;
        }

        if ($request->hasFile('logo')) {
            $oldLogoDiskPath = $this->toDiskPath($setting->logo_path);
            if ($oldLogoDiskPath && !str_starts_with($oldLogoDiskPath, 'images/')) {
                Storage::disk('public')->delete($oldLogoDiskPath);
            }
            $storedPath = $request->file('logo')->store('website', 'public');
            $data['logo_path'] = 'storage/'.$storedPath;
        }

        $removeHeroImages = (bool) ($validated['remove_hero_images'] ?? false);
        if ($removeHeroImages) {
            foreach ((array) $setting->hero_images as $oldImage) {
                if (is_string($oldImage)) {
                    $oldImageDiskPath = $this->toDiskPath($oldImage);
                    if ($oldImageDiskPath && !str_starts_with($oldImageDiskPath, 'images/')) {
                        Storage::disk('public')->delete($oldImageDiskPath);
                    }
                }
            }
            $data['hero_images'] = [];
        }

        if ($request->hasFile('hero_images')) {
            foreach ((array) $setting->hero_images as $oldImage) {
                if (is_string($oldImage)) {
                    $oldImageDiskPath = $this->toDiskPath($oldImage);
                    if ($oldImageDiskPath && !str_starts_with($oldImageDiskPath, 'images/')) {
                        Storage::disk('public')->delete($oldImageDiskPath);
                    }
                }
            }

            $data['hero_images'] = collect($request->file('hero_images'))
                ->map(fn ($file) => 'storage/'.$file->store('website/hero', 'public'))
                ->values()
                ->all();
        }

        $setting->update($data);

        return back()->with('success', 'Website settings updated.');
    }
}
