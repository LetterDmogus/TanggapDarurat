<?php

use App\Models\AssignmentPhoto;
use App\Models\ReportPhoto;
use App\Services\ImageOptimizer;
use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

Artisan::command('photos:optimize-existing {--disk=public} {--dry-run}', function (ImageOptimizer $optimizer) {
    $disk = (string) $this->option('disk');
    $dryRun = (bool) $this->option('dry-run');

    $total = 0;
    $optimized = 0;
    $skipped = 0;

    $run = function (string $label, string $modelClass) use (&$total, &$optimized, &$skipped, $optimizer, $disk, $dryRun): void {
        $this->line("Processing {$label}...");

        $modelClass::query()->orderBy('id')->chunkById(200, function ($rows) use (&$total, &$optimized, &$skipped, $optimizer, $disk, $dryRun): void {
            foreach ($rows as $row) {
                $total++;

                if ($dryRun) {
                    $skipped++;
                    continue;
                }

                $wasOptimized = $optimizer->optimizeStoredFile($row->file_path, $disk);
                if ($wasOptimized) {
                    $optimized++;
                } else {
                    $skipped++;
                }
            }
        });
    };

    $run('report photos', ReportPhoto::class);
    $run('assignment photos', AssignmentPhoto::class);

    $this->newLine();
    $this->info("Done. Total: {$total}, Optimized: {$optimized}, Skipped: {$skipped}.");
    if ($dryRun) {
        $this->comment('Dry run mode: no files were changed.');
    }
})->purpose('Compress existing uploaded report/assignment photos in storage');
