import React, { useEffect, useState } from 'react';
import axios from 'axios';
import AdminLayout from '@/Layouts/Admin/AdminLayout';

export default function ReviewsIndex() {
    const [reviews, setReviews] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [status, setStatus] = useState('');

    const fetchReviews = () => {
        setIsLoading(true);
        axios.get('/api/admin/reviews', { params: { search, status } })
            .then((response) => setReviews(response.data.data || []))
            .finally(() => setIsLoading(false));
    };

    useEffect(() => {
        fetchReviews();
    }, []);

    const toggleApprove = (id) => axios.patch(`/api/admin/reviews/${id}/toggle-approve`).then(fetchReviews);
    const deleteReview = (id) => {
        if (!window.confirm('Удалить отзыв?')) return;
        axios.delete(`/api/admin/reviews/${id}`).then(fetchReviews);
    };

    return (
        <AdminLayout title="Админка - Отзывы" active="reviews">
            <div>
                <h2 className="text-2xl font-extrabold text-black mb-6">Отзывы</h2>

                <div className="flex flex-wrap gap-3 mb-5">
                    <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Поиск" className="bg-white border border-gray-200 rounded-md px-3 py-2 text-sm text-black placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#08004E]/20 focus:border-[#08004E]" />
                    <select value={status} onChange={(e) => setStatus(e.target.value)} className="bg-white border border-gray-200 rounded-md px-3 py-2 text-sm text-black focus:outline-none focus:ring-2 focus:ring-[#08004E]/20 focus:border-[#08004E]">
                        <option value="">Все</option>
                        <option value="approved">Опубликованные</option>
                        <option value="pending">На модерации</option>
                    </select>
                    <button onClick={fetchReviews} className="bg-[#08004E] hover:bg-[#060038] text-white rounded-md text-sm font-semibold px-4 py-2 transition">Применить</button>
                </div>

                {isLoading ? (
                    <p className="text-center text-gray-600 py-8">Загрузка отзывов...</p>
                ) : (
                    <div className="space-y-3">
                        {reviews.map((review) => (
                            <article key={review.id} className="border border-gray-200 rounded-lg p-4">
                                <div className="flex items-start justify-between gap-3 mb-2">
                                    <div>
                                        <p className="text-black font-semibold">{review.user?.name || 'Пользователь'} • {review.product?.name || 'Товар удален'}</p>
                                        <p className="text-xs text-gray-500">Оценка: {review.rating}/5</p>
                                    </div>
                                    <span className={`text-xs font-semibold px-2 py-1 rounded ${review.is_approved ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'}`}>
                                        {review.is_approved ? 'Опубликован' : 'На модерации'}
                                    </span>
                                </div>
                                <p className="text-sm text-gray-700 mb-3">{review.body}</p>
                                <div className="flex gap-3 text-sm">
                                    <button onClick={() => toggleApprove(review.id)} className="text-[#08004E] hover:underline">
                                        {review.is_approved ? 'Снять публикацию' : 'Опубликовать'}
                                    </button>
                                    <button onClick={() => deleteReview(review.id)} className="text-red-600 hover:underline">Удалить</button>
                                </div>
                            </article>
                        ))}
                    </div>
                )}
            </div>
        </AdminLayout>
    );
}
