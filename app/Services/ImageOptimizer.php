<?php

namespace App\Services;

use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class ImageOptimizer
{
    private const MAX_DIMENSION = 1920;
    private const JPEG_WEBP_QUALITY = 80;
    private const PNG_COMPRESSION = 7;

    public function storeOptimized(UploadedFile $file, string $directory, string $disk = 'public'): string
    {
        if (!$this->gdAvailable()) {
            return $file->store($directory, $disk);
        }

        $binary = @file_get_contents($file->getRealPath());
        if ($binary === false) {
            return $file->store($directory, $disk);
        }

        $optimized = $this->optimizeBinary($binary);
        if ($optimized === null) {
            return $file->store($directory, $disk);
        }

        $targetPath = trim($directory, '/').'/'.Str::uuid().'.'.$optimized['extension'];
        Storage::disk($disk)->put($targetPath, $optimized['binary']);

        return $targetPath;
    }

    public function optimizeStoredFile(string $path, string $disk = 'public'): bool
    {
        if (!$this->gdAvailable() || !Storage::disk($disk)->exists($path)) {
            return false;
        }

        $original = Storage::disk($disk)->get($path);
        $optimized = $this->optimizeBinary($original);
        if ($optimized === null) {
            return false;
        }

        if (strlen($optimized['binary']) >= strlen($original)) {
            return false;
        }

        Storage::disk($disk)->put($path, $optimized['binary']);

        return true;
    }

    private function optimizeBinary(string $binary): ?array
    {
        $imageInfo = @getimagesizefromstring($binary);
        if ($imageInfo === false) {
            return null;
        }

        $mime = $imageInfo['mime'] ?? null;
        if (!is_string($mime) || !in_array($mime, ['image/jpeg', 'image/png', 'image/webp', 'image/gif'], true)) {
            return null;
        }

        // Skip GIF to avoid breaking animation frames.
        if ($mime === 'image/gif') {
            return null;
        }

        $source = @imagecreatefromstring($binary);
        if ($source === false) {
            return null;
        }

        $srcWidth = imagesx($source);
        $srcHeight = imagesy($source);
        [$dstWidth, $dstHeight] = $this->calculateTargetDimensions($srcWidth, $srcHeight);

        $output = imagecreatetruecolor($dstWidth, $dstHeight);
        if ($output === false) {
            imagedestroy($source);

            return null;
        }

        if (in_array($mime, ['image/png', 'image/webp'], true)) {
            imagealphablending($output, false);
            imagesavealpha($output, true);
            $transparent = imagecolorallocatealpha($output, 0, 0, 0, 127);
            imagefilledrectangle($output, 0, 0, $dstWidth, $dstHeight, $transparent);
        }

        imagecopyresampled($output, $source, 0, 0, 0, 0, $dstWidth, $dstHeight, $srcWidth, $srcHeight);

        ob_start();
        $written = false;
        $extension = 'jpg';
        if ($mime === 'image/jpeg') {
            $written = imagejpeg($output, null, self::JPEG_WEBP_QUALITY);
            $extension = 'jpg';
        } elseif ($mime === 'image/png') {
            $written = imagepng($output, null, self::PNG_COMPRESSION);
            $extension = 'png';
        } elseif ($mime === 'image/webp' && function_exists('imagewebp')) {
            $written = imagewebp($output, null, self::JPEG_WEBP_QUALITY);
            $extension = 'webp';
        }
        $encoded = ob_get_clean();

        imagedestroy($source);
        imagedestroy($output);

        if (!$written || !is_string($encoded) || $encoded === '') {
            return null;
        }

        return [
            'binary' => $encoded,
            'extension' => $extension,
        ];
    }

    private function calculateTargetDimensions(int $width, int $height): array
    {
        $max = max($width, $height);
        if ($max <= self::MAX_DIMENSION) {
            return [$width, $height];
        }

        $ratio = self::MAX_DIMENSION / $max;

        return [
            max(1, (int) round($width * $ratio)),
            max(1, (int) round($height * $ratio)),
        ];
    }

    private function gdAvailable(): bool
    {
        return function_exists('gd_info') && function_exists('imagecreatefromstring');
    }
}
