<?php

namespace App\Services;

use App\Models\ActivityLog;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class DiscordActivityLogNotifier
{
    public function notify(ActivityLog $activity): void
    {
        $webhookUrl = config('services.discord.activity_webhook_url') ?: env('DISCORD_ACTIVITY_WEBHOOK_URL');
        if (blank($webhookUrl)) {
            return;
        }

        $content = $this->buildMessage($activity);
        $verifySsl = (bool) config('services.discord.activity_verify_ssl', true);

        try {
            $response = $this->send($webhookUrl, $content, $verifySsl);

            if (!$response->successful() && $response->status() !== 204) {
                Log::warning('Discord activity webhook failed.', [
                    'status' => $response->status(),
                    'body' => $response->body(),
                    'activity_log_id' => $activity->id,
                ]);
            }
        } catch (\Throwable $e) {
            if ($verifySsl && $this->isCertificateError($e->getMessage())) {
                try {
                    $fallbackResponse = $this->send($webhookUrl, $content, false);
                    if ($fallbackResponse->successful() || $fallbackResponse->status() === 204) {
                        Log::warning('Discord webhook sent with SSL verify disabled fallback.', [
                            'activity_log_id' => $activity->id,
                        ]);

                        return;
                    }
                } catch (\Throwable $retryException) {
                    Log::error('Discord activity webhook fallback exception.', [
                        'activity_log_id' => $activity->id,
                        'message' => $retryException->getMessage(),
                    ]);
                }
            }

            Log::error('Discord activity webhook exception.', [
                'activity_log_id' => $activity->id,
                'message' => $e->getMessage(),
            ]);
        }
    }

    private function buildMessage(ActivityLog $activity): string
    {
        $actor = $activity->actor_name ?: 'Unknown';
        $email = $activity->actor_email ?: '-';
        $role = $activity->actor_role ?: '-';

        return implode("\n", [
            '**Activity Log User**',
            "User: {$actor} ({$email})",
            "Role: {$role}",
            "Action: {$activity->action}",
            "Method/Path: {$activity->method} {$activity->path}",
            "Status: {$activity->status_code}",
            'Waktu: '.$activity->created_at?->format('Y-m-d H:i:s'),
        ]);
    }

    private function send(string $webhookUrl, string $content, bool $verifySsl)
    {
        return Http::timeout(8)
            ->withOptions(['verify' => $verifySsl])
            ->asJson()
            ->post($webhookUrl, [
                'content' => $content,
            ]);
    }

    private function isCertificateError(string $message): bool
    {
        return str_contains($message, 'cURL error 77')
            || str_contains($message, 'SSL certificate')
            || str_contains($message, 'certificate file');
    }
}
