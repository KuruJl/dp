<!DOCTYPE html>
<html lang="ru">
<head>
    <meta charset="UTF-8">
    <title>{{ $title }}</title>
    <style>
        body { font-family: DejaVu Sans, sans-serif; font-size: 9px; }
        .header { text-align: center; margin-bottom: 14px; }
        .header h1 { font-size: 15px; margin: 0 0 6px 0; }
        .header p { margin: 0; color: #444; font-size: 10px; }
        table { width: 100%; border-collapse: collapse; margin-top: 8px; }
        th, td { border: 1px solid #ccc; padding: 5px; text-align: left; vertical-align: top; }
        th { background: #f2f2f2; font-weight: bold; }
        td:nth-child(n+3) { text-align: right; }
    </style>
</head>
<body>
    <div class="header">
        <h1>{{ $title }}</h1>
        <p>Период: {{ $subtitle }}</p>
        <p>Сформировано: {{ now()->format('d.m.Y H:i') }}</p>
    </div>
    <table>
        <thead>
            <tr>
                @foreach ($columns as $col)
                    <th>{{ $col }}</th>
                @endforeach
            </tr>
        </thead>
        <tbody>
            @forelse ($rows as $row)
                <tr>
                    @foreach ($row as $cell)
                        <td>{{ $cell }}</td>
                    @endforeach
                </tr>
            @empty
                <tr><td colspan="{{ count($columns) }}">Нет данных за выбранный период.</td></tr>
            @endforelse
        </tbody>
    </table>
</body>
</html>
