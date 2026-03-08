<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <title>Export PDF Laporan Manager</title>
    <style>
        body { font-family: DejaVu Sans, sans-serif; font-size: 11px; color: #111827; }
        h1 { margin: 0 0 6px; font-size: 18px; }
        .meta { margin-bottom: 12px; font-size: 10px; }
        table { width: 100%; border-collapse: collapse; }
        th, td { border: 1px solid #cbd5e1; padding: 6px; vertical-align: top; }
        th { background: #f1f5f9; font-size: 10px; }
    </style>
</head>
<body>
    <h1>Kumpulan Laporan Manager</h1>
    <div class="meta">
        Periode: {{ $dateFrom->format('Y-m-d') }} s/d {{ $dateTo->format('Y-m-d') }} |
        Total: {{ $reports->count() }} laporan |
        Dicetak: {{ $printedAt->format('Y-m-d H:i:s') }}
    </div>

    <table>
        <thead>
            <tr>
                <th>ID</th>
                <th>Tanggal</th>
                <th>Pelapor</th>
                <th>Jenis Darurat</th>
                <th>Status</th>
                <th>Deskripsi</th>
                <th>Koordinat</th>
            </tr>
        </thead>
        <tbody>
            @forelse($reports as $report)
                <tr>
                    <td>#{{ $report->id }}</td>
                    <td>{{ optional($report->created_at)->format('Y-m-d H:i:s') }}</td>
                    <td>{{ $report->user?->name ?? '-' }}</td>
                    <td>{{ $report->emergencyType?->display_name ?? $report->emergencyType?->name ?? '-' }}</td>
                    <td>{{ $report->status }}</td>
                    <td>{{ $report->description }}</td>
                    <td>{{ $report->latitude }}, {{ $report->longitude }}</td>
                </tr>
            @empty
                <tr>
                    <td colspan="7" style="text-align: center;">Tidak ada data laporan pada periode ini.</td>
                </tr>
            @endforelse
        </tbody>
    </table>
</body>
</html>
