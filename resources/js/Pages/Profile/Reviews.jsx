import React, { useState } from 'react';
import { Head, Link, router, usePage } from '@inertiajs/react';
import Header from '@/Components/Header';
import Footer from '@/Components/Footer';
import ProfileSidebar from '@/Components/ProfileSidebar';

function Star({ filled, onClick }) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={`p-0.5 rounded ${onClick ? 'cursor-pointer hover:opacity-80' : 'cursor-default'}`}
            aria-label={filled ? 'заполненная звезда' : 'пустая звезда'}
        >
            <svg
                className={`w-6 h-6 ${filled ? 'text-yellow-400' : 'text-gray-300'}`}
                fill="currentColor"
                viewBox="0 0 20 20"
            >
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
        </button>
    );
}

export default function Reviews({ reviews = [] }) {
    const { auth, flash } = usePage().props;
    const user = auth?.user;
    const stars = [1, 2, 3, 4, 5];

    const [editingId, setEditingId] = useState(null);
    const [editRating, setEditRating] = useState(5);
    const [editBody, setEditBody] = useState('');
    const [editErrors, setEditErrors] = useState({});
    const [saving, setSaving] = useState(false);
    const [deletingId, setDeletingId] = useState(null);

    const startEdit = (review) => {
        setEditingId(review.id);
        setEditRating(review.rating);
        setEditBody(review.body);
        setEditErrors({});
    };

    const cancelEdit = () => {
        setEditingId(null);
        setEditErrors({});
    };

    const saveEdit = (e) => {
        e.preventDefault();
        setSaving(true);
        setEditErrors({});
        router.patch(
            route('reviews.update', { review: editingId }),
            { rating: editRating, body: editBody },
            {
                preserveScroll: true,
                onSuccess: () => {
                    cancelEdit();
                },
                onError: (errors) => setEditErrors(errors),
                onFinish: () => setSaving(false),
            }
        );
    };

    const confirmDelete = (reviewId) => {
        if (!window.confirm('Удалить этот отзыв? Это действие нельзя отменить.')) {
            return;
        }
        setDeletingId(reviewId);
        router.delete(route('reviews.destroy', { review: reviewId }), {
            preserveScroll: true,
            onFinish: () => setDeletingId(null),
        });
    };

    return (
        <div className="min-h-screen flex flex-col bg-[#DEDEDE] font-man">
            <Head title="Мои отзывы" />
            <Header />

            <main className="flex-grow w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-14">
                <h1 className="text-3xl md:text-4xl font-extrabold text-black text-center mb-12">
                    Личный кабинет
                </h1>

                <div className="flex flex-col lg:flex-row gap-8 items-start w-full">
                    <ProfileSidebar user={user} activeTab="reviews" />

                    <section className="flex-1 w-full bg-white rounded-xl p-6 md:p-8 border border-gray-200 shadow-sm min-w-0">
                        <h2 className="text-2xl font-extrabold text-black mb-6">Мои отзывы</h2>

                        {flash?.success && (
                            <div className="mb-6 rounded-lg bg-green-50 border border-green-200 text-green-800 px-4 py-3 text-sm font-medium">
                                {flash.success}
                            </div>
                        )}

                        {reviews.length === 0 ? (
                            <div className="text-center py-12 border border-dashed border-gray-300 rounded-lg bg-gray-50">
                                <p className="text-gray-600 mb-4">Вы пока не оставляли отзывов.</p>
                                <Link href="/catalog" className="inline-block bg-[#08004E] text-white font-semibold px-6 py-3 rounded-lg hover:bg-opacity-90 transition">
                                    Выбрать товар
                                </Link>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {reviews.map((review) => (
                                    <article key={review.id} className="border border-gray-200 rounded-xl p-5">
                                        <div className="flex items-start justify-between gap-4 mb-2">
                                            <div className="min-w-0">
                                                {review.product_slug ? (
                                                    <Link href={`/products/${review.product_slug}`} className="font-bold text-black hover:text-[#08004E] transition line-clamp-1">
                                                        {review.product_name}
                                                    </Link>
                                                ) : (
                                                    <h3 className="font-bold text-black line-clamp-1">{review.product_name}</h3>
                                                )}
                                                <p className="text-xs text-gray-500">{review.created_at}</p>
                                            </div>
                                            <span className={`inline-flex px-2.5 py-1 rounded-full text-[11px] font-semibold whitespace-nowrap ${review.is_approved ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                                                {review.is_approved ? 'Опубликован' : 'На рассмотрении'}
                                            </span>
                                        </div>

                                        {editingId === review.id ? (
                                            <form onSubmit={saveEdit} className="space-y-4 mt-3">
                                                <div>
                                                    <label className="block text-sm font-bold text-gray-700 mb-2">Оценка</label>
                                                    <div className="flex gap-1">
                                                        {stars.map((star) => (
                                                            <Star key={star} filled={star <= editRating} onClick={() => setEditRating(star)} />
                                                        ))}
                                                    </div>
                                                    {editErrors.rating && <p className="text-red-500 text-xs mt-1">{editErrors.rating}</p>}
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-bold text-gray-700 mb-2">Текст</label>
                                                    <textarea
                                                        value={editBody}
                                                        onChange={(e) => setEditBody(e.target.value)}
                                                        rows={4}
                                                        className="w-full bg-white border border-gray-300 rounded-md px-4 py-3 text-sm text-black focus:ring-[#08004E] focus:border-[#08004E]"
                                                    />
                                                    {editErrors.body && <p className="text-red-500 text-xs mt-1">{editErrors.body}</p>}
                                                </div>
                                                <div className="flex flex-wrap gap-2">
                                                    <button
                                                        type="submit"
                                                        disabled={saving}
                                                        className="bg-[#08004E] text-white font-semibold py-2 px-5 rounded-lg hover:bg-opacity-90 disabled:opacity-50"
                                                    >
                                                        {saving ? 'Сохранение…' : 'Сохранить'}
                                                    </button>
                                                    <button type="button" onClick={cancelEdit} className="border border-gray-300 text-gray-800 font-semibold py-2 px-5 rounded-lg hover:bg-gray-50">
                                                        Отмена
                                                    </button>
                                                </div>
                                                <p className="text-xs text-gray-500">После сохранения отзыв снова отправится на модерацию.</p>
                                            </form>
                                        ) : (
                                            <>
                                                <p className="text-sm text-gray-700 leading-relaxed mb-3">{review.body}</p>
                                                <div className="flex flex-wrap items-center gap-3 justify-between">
                                                    <div className="flex items-center gap-2">
                                                        <div className="flex">
                                                            {stars.map((star) => (
                                                                <svg
                                                                    key={star}
                                                                    className={`w-4 h-4 ${star <= review.rating ? 'text-yellow-400' : 'text-gray-300'}`}
                                                                    fill="currentColor"
                                                                    viewBox="0 0 20 20"
                                                                >
                                                                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                                                </svg>
                                                            ))}
                                                        </div>
                                                        <p className="text-sm font-semibold text-black">{review.rating}/5</p>
                                                    </div>
                                                    <div className="flex gap-2">
                                                        <button
                                                            type="button"
                                                            onClick={() => startEdit(review)}
                                                            className="text-sm font-semibold text-[#08004E] hover:underline"
                                                        >
                                                            Изменить
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => confirmDelete(review.id)}
                                                            disabled={deletingId === review.id}
                                                            className="text-sm font-semibold text-red-600 hover:underline disabled:opacity-50"
                                                        >
                                                            {deletingId === review.id ? 'Удаление…' : 'Удалить'}
                                                        </button>
                                                    </div>
                                                </div>
                                            </>
                                        )}
                                    </article>
                                ))}
                            </div>
                        )}
                    </section>
                </div>
            </main>

            <Footer />
        </div>
    );
}
