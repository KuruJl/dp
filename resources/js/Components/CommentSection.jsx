// resources/js/Components/CommentSection.jsx

import React, { useState, useEffect } from 'react';
import { usePage } from '@inertiajs/react';
import axios from 'axios';

export default function CommentSection({ assemblyId }) {
    const { auth } = usePage().props;
    const [comments, setComments] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [newComment, setNewComment] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        axios.get(`/api/assemblies/${assemblyId}/comments`)
            .then(response => {
                setComments(response.data);
            })
            .finally(() => setIsLoading(false));
    }, [assemblyId]);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!newComment.trim() || !auth.user) {
            if (!auth.user) alert('Войдите, чтобы оставить комментарий.');
            return;
        }

        setIsSubmitting(true);
        axios.post(`/api/assemblies/${assemblyId}/comments`, { body: newComment })
            .then(response => {
                setComments(prev => [response.data, ...prev]); // Добавляем новый коммент в начало
                setNewComment(''); // Очищаем поле ввода
            })
            .catch(error => {
                console.error("Ошибка при отправке комментария:", error);
                alert('Не удалось отправить комментарий.');
            })
            .finally(() => setIsSubmitting(false));
    };

    return (
        <div className="mt-4 pt-4 border-t border-gray-700">
            {auth.user && (
                <form onSubmit={handleSubmit} className="mb-4">
                    <textarea
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        placeholder="Оставьте ваш комментарий..."
                        rows="3"
                        className="w-full p-2 bg-gray-900 border border-gray-600 rounded-md text-white resize-none"
                    />
                    <button
                        type="submit"
                        disabled={isSubmitting || !newComment.trim()}
                        className="mt-2 px-4 py-2 bg-sky-600 rounded-md hover:bg-sky-500 disabled:bg-gray-500 disabled:cursor-not-allowed"
                    >
                        {isSubmitting ? 'Отправка...' : 'Отправить'}
                    </button>
                </form>
            )}

            {isLoading ? (
                <p className="text-gray-400">Загрузка комментариев...</p>
            ) : (
                <div className="space-y-4">
                    {comments.length > 0 ? comments.map(comment => (
                        <div key={comment.id} className="flex items-start space-x-3">
                            <div className="w-10 h-10 rounded-full bg-gray-600 flex items-center justify-center font-bold text-white shrink-0">
                                {comment.user.name.charAt(0).toUpperCase()}
                            </div>
                            <div className="bg-gray-900 p-3 rounded-lg w-full">
                                <p className="font-bold text-white">{comment.user.name}</p>
                                <p className="text-gray-300 whitespace-pre-wrap">{comment.body}</p>
                            </div>
                        </div>
                    )) : (
                        <p className="text-gray-500">Комментариев пока нет.</p>
                    )}
                </div>
            )}
        </div>
    );
}