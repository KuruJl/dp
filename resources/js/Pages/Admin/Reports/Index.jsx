import React, { useMemo, useState } from 'react';
import AdminLayout from '@/Layouts/Admin/AdminLayout';

function formatDateInput(d) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
}

export default function ReportsIndex() {
    const defaults = useMemo(() => {
        const to = new Date();
        const from = new Date();
        from.setDate(from.getDate() - 30);
        return { from: formatDateInput(from), to: formatDateInput(to) };
    }, []);

    const [from, setFrom] = useState(defaults.from);
    const [to, setTo] = useState(defaults.to);

    const buildUrl = (type, format) => {
        const params = new URLSearchParams({ from, to, format });
        return `/api/admin/reports/export/${type}?${params.toString()}`;
    };

    const ReportCard = ({ title, description, type }) => (
        <div className="rounded-xl border border-gray-200 bg-gray-50/80 p-5 flex flex-col gap-4">
            <div>
                <h3 className="text-lg font-bold text-black">{title}</h3>
                <p className="text-sm text-gray-600 mt-1">{description}</p>
            </div>
            <div className="flex flex-wrap gap-2">
                <a
                    href={buildUrl(type, 'csv')}
                    className="inline-flex items-center justify-center rounded-md bg-white border border-gray-300 px-4 py-2 text-sm font-semibold text-black hover:bg-gray-50 transition"
                >
                    Скачать CSV
                </a>
                <a
                    href={buildUrl(type, 'pdf')}
                    className="inline-flex items-center justify-center rounded-md bg-[#08004E] px-4 py-2 text-sm font-semibold text-white hover:bg-opacity-90 transition"
                >
                    Скачать PDF
                </a>
            </div>
        </div>
    );

    return (
        <AdminLayout title="Админка - Отчёты" active="reports">
            <div>
                <h2 className="text-2xl font-extrabold text-black mb-2">Отчётность</h2>
                <p className="text-sm text-gray-600 mb-6">
                    Выберите период (по дате создания заказа / регистрации). Экспорт в CSV удобно открыть в Excel.
                </p>

                <div className="flex flex-wrap gap-4 mb-8 items-end">
                    <div>
                        <label className="block text-xs font-bold text-gray-600 mb-1">С даты</label>
                        <input
                            type="date"
                            value={from}
                            onChange={(e) => setFrom(e.target.value)}
                            className="bg-white border border-gray-200 rounded-md px-3 py-2 text-sm text-black"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-600 mb-1">По дату</label>
                        <input
                            type="date"
                            value={to}
                            onChange={(e) => setTo(e.target.value)}
                            className="bg-white border border-gray-200 rounded-md px-3 py-2 text-sm text-black"
                        />
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                    <ReportCard
                        type="sales"
                        title="Продажи по дням"
                        description="Число заказов и суммарная выручка по календарным дням (заказы со статусом не «отменен»)."
                    />
                    <ReportCard
                        type="popular-products"
                        title="Популярные товары"
                        description="Топ позиций по количеству продаж за период (по строкам заказов)."
                    />
                    <ReportCard
                        type="user-activity"
                        title="Активность пользователей"
                        description="Новые регистрации и число созданных заказов по дням."
                    />
                </div>
            </div>
        </AdminLayout>
    );
}
