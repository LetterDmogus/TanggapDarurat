<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Print Laporan Manager</title>
    <style>
        body { font-family: Arial, sans-serif; color: #111827; margin: 24px; }
        h1 { margin: 0 0 4px; font-size: 24px; }
        .meta { margin-bottom: 16px; font-size: 13px; color: #374151; }
        table { width: 100%; border-collapse: collapse; font-size: 12px; }
        th, td { border: 1px solid #d1d5db; padding: 8px; text-align: left; vertical-align: top; }
        th { background: #f3f4f6; }
    </style>
</head>
<body>
    <h1>Kumpulan Laporan Manager</h1>
    <div class="meta">
        Periode: {{ $dateFrom->format('Y-m-d') }} s/d {{ $dateTo->format('Y-m-d') }}<br>
        Total data: {{ $reports->count() }} laporan<br>
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

    <script>
        window.onload = () => window.print();
    </script>
</body>
</html>
