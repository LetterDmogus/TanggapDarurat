<?php

namespace App\Http\Middleware;

use App\Models\ActivityLog;
use App\Services\DiscordActivityLogNotifier;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Http\UploadedFile;
use Symfony\Component\HttpFoundation\Response;

class LogUserActivity
{
    public function __construct(private readonly DiscordActivityLogNotifier $discordNotifier)
    {
    }

    public function handle(Request $request, Closure $next): Response
    {
        $response = $next($request);

        $this->storeActivity($request, $response);

        return $response;
    }

    private function storeActivity(Request $request, Response $response): void
    {
        $user = $request->user();
        $route = $request->route();

        if (!$user || !$route) {
            return;
        }

        if (in_array($request->method(), ['HEAD', 'OPTIONS'], true)) {
            return;
        }

        if (!$this->shouldLog($request)) {
            return;
        }

        $activity = ActivityLog::create([
            'user_id' => $user->id,
            'actor_name' => $user->name,
            'actor_email' => $user->email,
            'actor_role' => $user->role,
            'action' => $route->getName() ?: 'unknown',
            'method' => $request->method(),
            'path' => '/'.ltrim($request->path(), '/'),
            'status_code' => $response->getStatusCode(),
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
            'payload' => $this->buildPayload($request),
        ]);

        $this->discordNotifier->notify($activity);
    }

    private function shouldLog(Request $request): bool
    {
        $method = strtoupper($request->method());

        return in_array($method, ['POST', 'PUT', 'PATCH', 'DELETE'], true);
    }

    private function buildPayload(Request $request): array
    {
        $input = $request->except([
            'password',
            'password_confirmation',
            '_token',
            'current_password',
        ]);

        return [
            'query' => $this->sanitizePayload($request->query()),
            'input' => $this->sanitizePayload($input),
        ];
    }

    private function sanitizePayload(mixed $value): mixed
    {
        if (is_array($value)) {
            $result = [];
            foreach ($value as $key => $item) {
                $result[$key] = $this->sanitizePayload($item);
            }

            return $result;
        }

        if ($value instanceof UploadedFile) {
            return [
                'file_name' => $value->getClientOriginalName(),
                'mime_type' => $value->getClientMimeType(),
                'size' => $value->getSize(),
            ];
        }

        if (is_object($value)) {
            return (string) $value;
        }

        return $value;
    }
}
