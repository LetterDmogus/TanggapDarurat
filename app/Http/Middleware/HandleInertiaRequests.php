<?php

namespace App\Http\Middleware;

use App\Models\WebsiteSetting;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Schema;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that is loaded on the first page visit.
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determine the current asset version.
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        return [
            ...parent::share($request),
            'auth' => [
                'user' => $request->user(),
            ],
            'flash' => [
                'success' => fn () => $request->session()->get('success'),
                'error' => fn () => $request->session()->get('error'),
            ],
            'website' => fn () => (function () {
                if (!Schema::hasTable('website_settings')) {
                    return [
                        'site_name' => 'TanggapDarurat',
                        'logo_url' => null,
                        'contact_text' => null,
                        'hero_image_urls' => [],
                    ];
                }

                $setting = WebsiteSetting::singleton();

                return [
                    'site_name' => $setting->site_name,
                    'logo_url' => $setting->logoUrl(),
                    'contact_text' => $setting->contact_text,
                    'hero_image_urls' => array_values(array_filter($setting->heroImageUrls())),
                ];
            })(),
        ];
    }
}
