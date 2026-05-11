<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\User;
use Barryvdh\DomPDF\Facade\Pdf;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response as InertiaResponse;
use Symfony\Component\HttpFoundation\StreamedResponse;

class ReportController extends Controller
{
    public function page(): InertiaResponse
    {
        return Inertia::render('Admin/Reports/Index');
    }

    public function export(Request $request, string $type): Response|StreamedResponse
    {
        $format = strtolower((string) $request->query('format', 'csv'));
        if (! in_array($format, ['pdf', 'csv'], true)) {
            $format = 'csv';
        }

        $to = $request->query('to');
        $from = $request->query('from');

        $end = $to ? Carbon::parse($to)->endOfDay() : now()->endOfDay();
        $start = $from ? Carbon::parse($from)->startOfDay() : $end->copy()->subDays(30)->startOfDay();

        return match ($type) {
            'sales' => $this->exportSales($start, $end, $format),
            'popular-products' => $this->exportPopularProducts($start, $end, $format),
            'user-activity' => $this->exportUserActivity($start, $end, $format),
            default => abort(404),
        };
    }

    private function exportSales(Carbon $start, Carbon $end, string $format): Response|StreamedResponse
    {
        $orders = Order::query()
            ->where('status', '!=', 'отменен')
            ->whereBetween('created_at', [$start, $end])
            ->orderBy('created_at')
            ->get(['created_at', 'order_number', 'total_amount', 'status']);

        $grouped = [];
        foreach ($orders as $o) {
            $key = $o->created_at->format('Y-m-d');
            if (! isset($grouped[$key])) {
                $grouped[$key] = ['date' => $key, 'orders_count' => 0, 'revenue' => 0.0];
            }
            $grouped[$key]['orders_count']++;
            $grouped[$key]['revenue'] += (float) $o->total_amount;
        }
        $rows = array_values($grouped);

        $title = 'Продажи по дням';
        $subtitle = $start->format('d.m.Y') . ' — ' . $end->format('d.m.Y');

        if ($format === 'pdf') {
            $pdf = Pdf::loadView('admin.reports.sales', [
                'title' => $title,
                'subtitle' => $subtitle,
                'rows' => $rows,
                'columns' => ['Дата', 'Заказов', 'Выручка, ₽'],
            ])->setPaper('a4', 'landscape');

            return $pdf->download('report-sales-' . $start->format('Y-m-d') . '.pdf');
        }

        return response()->streamDownload(function () use ($rows) {
            $out = fopen('php://output', 'w');
            fprintf($out, chr(0xEF) . chr(0xBB) . chr(0xBF));
            fputcsv($out, ['Дата', 'Заказов', 'Выручка (₽)'], ';');
            foreach ($rows as $r) {
                fputcsv($out, [$r['date'], $r['orders_count'], number_format($r['revenue'], 2, '.', '')], ';');
            }
            fclose($out);
        }, 'report-sales-' . $start->format('Y-m-d') . '.csv', [
            'Content-Type' => 'text/csv; charset=UTF-8',
        ]);
    }

    private function exportPopularProducts(Carbon $start, Carbon $end, string $format): Response|StreamedResponse
    {
        $rows = DB::table('order_items')
            ->join('orders', 'orders.id', '=', 'order_items.order_id')
            ->where('orders.status', '!=', 'отменен')
            ->whereBetween('orders.created_at', [$start, $end])
            ->groupBy('order_items.product_id', 'order_items.product_name')
            ->orderByDesc(DB::raw('SUM(order_items.quantity)'))
            ->limit(100)
            ->selectRaw('
                order_items.product_id as product_id,
                order_items.product_name as title,
                SUM(order_items.quantity) as qty,
                SUM(order_items.price * order_items.quantity) as revenue
            ')
            ->get()
            ->map(fn ($r) => [
                'product_id' => $r->product_id,
                'title' => $r->title,
                'qty' => (int) $r->qty,
                'revenue' => (float) $r->revenue,
            ])
            ->all();

        $title = 'Популярные товары';
        $subtitle = $start->format('d.m.Y') . ' — ' . $end->format('d.m.Y');

        if ($format === 'pdf') {
            $pdf = Pdf::loadView('admin.reports.table-generic', [
                'title' => $title,
                'subtitle' => $subtitle,
                'columns' => ['ID товара', 'Название', 'Продано шт.', 'Выручка, ₽'],
                'rows' => array_map(fn ($r) => [
                    $r['product_id'] ?? '—',
                    $r['title'],
                    $r['qty'],
                    number_format($r['revenue'], 2, '.', ' '),
                ], $rows),
            ])->setPaper('a4', 'landscape');

            return $pdf->download('report-popular-products-' . $start->format('Y-m-d') . '.pdf');
        }

        return response()->streamDownload(function () use ($rows) {
            $out = fopen('php://output', 'w');
            fprintf($out, chr(0xEF) . chr(0xBB) . chr(0xBF));
            fputcsv($out, ['ID товара', 'Название', 'Продано шт.', 'Выручка (₽)'], ';');
            foreach ($rows as $r) {
                fputcsv($out, [
                    $r['product_id'] ?? '',
                    $r['title'],
                    $r['qty'],
                    number_format($r['revenue'], 2, '.', ''),
                ], ';');
            }
            fclose($out);
        }, 'report-popular-products-' . $start->format('Y-m-d') . '.csv', [
            'Content-Type' => 'text/csv; charset=UTF-8',
        ]);
    }

    private function exportUserActivity(Carbon $start, Carbon $end, string $format): Response|StreamedResponse
    {
        $period = [];
        for ($d = $start->copy()->startOfDay(); $d->lte($end); $d->addDay()) {
            $period[$d->format('Y-m-d')] = ['date' => $d->format('Y-m-d'), 'new_users' => 0, 'new_orders' => 0];
        }

        User::query()
            ->whereBetween('created_at', [$start, $end])
            ->get(['created_at'])
            ->each(function ($u) use (&$period) {
                $key = $u->created_at->format('Y-m-d');
                if (isset($period[$key])) {
                    $period[$key]['new_users']++;
                }
            });

        Order::query()
            ->whereBetween('created_at', [$start, $end])
            ->get(['created_at'])
            ->each(function ($o) use (&$period) {
                $key = $o->created_at->format('Y-m-d');
                if (isset($period[$key])) {
                    $period[$key]['new_orders']++;
                }
            });

        $rows = array_values($period);

        $title = 'Активность пользователей и заказов';
        $subtitle = $start->format('d.m.Y') . ' — ' . $end->format('d.m.Y');

        if ($format === 'pdf') {
            $pdf = Pdf::loadView('admin.reports.table-generic', [
                'title' => $title,
                'subtitle' => $subtitle,
                'columns' => ['Дата', 'Новых регистраций', 'Новых заказов'],
                'rows' => array_map(fn ($r) => [$r['date'], $r['new_users'], $r['new_orders']], $rows),
            ])->setPaper('a4', 'landscape');

            return $pdf->download('report-user-activity-' . $start->format('Y-m-d') . '.pdf');
        }

        return response()->streamDownload(function () use ($rows) {
            $out = fopen('php://output', 'w');
            fprintf($out, chr(0xEF) . chr(0xBB) . chr(0xBF));
            fputcsv($out, ['Дата', 'Новых регистраций', 'Новых заказов'], ';');
            foreach ($rows as $r) {
                fputcsv($out, [$r['date'], $r['new_users'], $r['new_orders']], ';');
            }
            fclose($out);
        }, 'report-user-activity-' . $start->format('Y-m-d') . '.csv', [
            'Content-Type' => 'text/csv; charset=UTF-8',
        ]);
    }
}
