<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;

class RecaptchaVerifier
{
    public function verify(?string $token, ?string $ip = null, ?string $expectedAction = null): bool
    {
        $secret = (string) config('services.recaptcha.secret_key', '');
        $minScore = (float) config('services.recaptcha.min_score', 0.5);
        $strict = (bool) config('services.recaptcha.strict', false);

        if ($secret === '') {
            return app()->environment('local');
        }

        if (!$token) {
            return false;
        }

        $response = null;
        $endpoints = [
            'https://www.google.com/recaptcha/api/siteverify',
            'https://www.recaptcha.net/recaptcha/api/siteverify',
        ];

        foreach ($endpoints as $endpoint) {
            try {
                $candidate = Http::asForm()
                    ->timeout(8)
                    ->post($endpoint, [
                        'secret' => $secret,
                        'response' => $token,
                        'remoteip' => $ip,
                    ]);
            } catch (\Throwable) {
                continue;
            }

            if ($candidate->ok()) {
                $response = $candidate;
                break;
            }
        }

        if (!$response) {
            return !$strict;
        }

        $payload = $response->json();
        $success = (bool) data_get($payload, 'success', false);
        if (!$success) {
            return false;
        }

        $score = (float) data_get($payload, 'score', 0);
        if ($score < $minScore) {
            return false;
        }

        if ($expectedAction !== null) {
            $action = (string) data_get($payload, 'action', '');
            if ($action !== $expectedAction) {
                return false;
            }
        }

        return true;
    }
}
