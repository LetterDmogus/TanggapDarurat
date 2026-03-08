<?php

namespace App\Exports;

use Illuminate\Support\Collection;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\ShouldAutoSize;
use Maatwebsite\Excel\Concerns\WithHeadings;

class ManagerReportsExport implements FromCollection, ShouldAutoSize, WithHeadings
{
    public function __construct(private readonly Collection $reports)
    {
    }

    public function collection(): Collection
    {
        return $this->reports->map(function ($report) {
            return [
                'ID Laporan' => $report->id,
                'Tanggal' => optional($report->created_at)->format('Y-m-d H:i:s'),
                'Pelapor' => $report->user?->name ?? '-',
                'Jenis Darurat' => $report->emergencyType?->display_name ?? $report->emergencyType?->name ?? '-',
                'Status' => $report->status,
                'Deskripsi' => $report->description,
                'Latitude' => $report->latitude,
                'Longitude' => $report->longitude,
            ];
        });
    }

    public function headings(): array
    {
        return [
            'ID Laporan',
            'Tanggal',
            'Pelapor',
            'Jenis Darurat',
            'Status',
            'Deskripsi',
            'Latitude',
            'Longitude',
        ];
    }
}
