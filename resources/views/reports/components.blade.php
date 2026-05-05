<!DOCTYPE html>
<html lang="ru">
<head>
    <meta charset="UTF-8">
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8"/>
    <title>Отчет по комплектующим</title>
    <style>
        /* Стили для PDF */
        body { font-family: DejaVu Sans, sans-serif; font-size: 10px; }
        .header { text-align: center; margin-bottom: 20px; }
        .header h1 { font-size: 18px; }
        .header p { font-size: 12px; color: #555; }
        table { width: 100%; border-collapse: collapse; }
        th, td { border: 1px solid #ddd; padding: 6px; text-align: left; }
        th { background-color: #f2f2f2; font-weight: bold; }
        .price { text-align: right; }
    </style>
</head>
<body>
    <div class="header">
        <h1>Отчет по комплектующим</h1>
        <p>Сформировано: {{ date('d.m.Y H:i') }}</p>
        @if(!empty($filters))
            <p>Фильтры: {{ implode(', ', $filters) }}</p>
        @endif
    </div>

    <table>
        <thead>
            <tr>
                <th>ID</th>
                <th>Название</th>
                <th>Производитель</th>
                <th class="price">Цена</th>
            </tr>
        </thead>
        <tbody>
            @forelse ($components as $component)
                <tr>
                    <td>{{ $component->id }}</td>
                    <td>{{ $component->name }}</td>
                    <td>{{ $component->manufacturer->name ?? 'Не указан' }}</td>
                    <td class="price">{{ number_format($component->price, 0, ',', ' ') }} ₽</td>
                </tr>
            @empty
                <tr>
                    <td colspan="4" style="text-align: center;">Данные по заданным фильтрам не найдены.</td>
                </tr>
            @endforelse
        </tbody>
    </table>
</body>
</html>