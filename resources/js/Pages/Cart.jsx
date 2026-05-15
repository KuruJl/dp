import React from 'react';
import { Head, Link, useForm, router, usePage } from '@inertiajs/react';
import axios from 'axios';
import Header from '@/Components/Header';
import Footer from '@/Components/Footer';
import { formatRuPhone, ruPhoneToDigits } from '@/utils/phoneMask';

export default function Cart({ cart, total }) {
    const { flash } = usePage().props;
    const formatPrice = (val) => new Intl.NumberFormat('ru-RU').format(val || 0);
    const isCartEmpty = !cart || cart.length === 0;
    const [promoState, setPromoState] = React.useState({
        valid: false,
        message: '',
        discountAmount: 0,
        finalTotal: total || 0,
        loading: false,
        eligibleHint: '',
    });

    // Состояние формы для оформления заказа
    const { data, setData, post, processing, errors } = useForm({
        city: '',
        address_street: '',
        address_entrance: '',
        address_floor: '',
        address_apartment: '',
        pickup_point_id: '',
        pickup_city: '',
        name: '',
        phone: '',
        email: '',
        delivery_method: 'Доставка курьером',
        payment_method: 'Онлайн',
        promo_code: '',
        delivery_time: '',
        customer_comment: ''
    });

    const [pickupPoints, setPickupPoints] = React.useState([]);
    const isPickup = data.delivery_method === 'Пункт выдачи';

    React.useEffect(() => {
        if (!isPickup) return;
        axios
            .get('/api/pickup-points')
            .then((response) => {
                setPickupPoints(response.data?.points || []);
            })
            .catch(() => setPickupPoints([]));
    }, [isPickup]);

    const pickupCities = React.useMemo(() => {
        const cities = new Set();
        pickupPoints.forEach((p) => cities.add(p.city));
        return Array.from(cities).sort();
    }, [pickupPoints]);

    const filteredPickupPoints = React.useMemo(() => {
        if (!data.pickup_city) return pickupPoints;
        return pickupPoints.filter((p) => p.city === data.pickup_city);
    }, [pickupPoints, data.pickup_city]);

    const updateQuantity = (cartItemId, newQuantity, maxAvailable) => {
        if (newQuantity < 1) return removeItem(cartItemId);
        if (newQuantity > maxAvailable) {
            alert(`Максимально доступно: ${maxAvailable} шт.`);
            newQuantity = maxAvailable;
        }
        router.patch(`/cart/${cartItemId}`, { quantity: newQuantity }, { preserveScroll: true });
    };

    const removeItem = (cartItemId) => {
        if (confirm('Удалить этот товар из корзины?')) {
            router.delete(`/cart/${cartItemId}/remove`, { preserveScroll: true });
        }
    };

    const submitOrder = (e) => {
        e.preventDefault();

        let fullAddress = '';
        if (data.delivery_method === 'Пункт выдачи') {
            const selected = pickupPoints.find((p) => String(p.id) === String(data.pickup_point_id));
            if (!selected) {
                alert('Пожалуйста, выберите пункт выдачи из списка.');
                return;
            }
            fullAddress = `Пункт выдачи: г. ${selected.city}, ${selected.address}${selected.name ? ' («' + selected.name + '»)' : ''}`;
        } else {
            fullAddress = `${data.city}, ${data.address_street}, Подъезд: ${data.address_entrance}, Этаж: ${data.address_floor}, Кв: ${data.address_apartment}`;
        }

        // Бэкенду лучше отдавать очищенный номер
        const phoneDigits = ruPhoneToDigits(data.phone);

        router.post('/checkout', {
            ...data,
            phone: phoneDigits,
            delivery_address: fullAddress,
        }, {
            preserveScroll: true,
            onError: (err) => {
                if (err.cart) alert(err.cart);
                else alert('Пожалуйста, заполните все обязательные поля.');
            }
        });
    };

    const applyPromocode = async () => {
        setPromoState((prev) => ({ ...prev, loading: true, message: '', eligibleHint: '' }));
        try {
            const response = await axios.post('/api/cart/promocode-preview', { promo_code: data.promo_code });
            const payload = response.data;
            const eb = Number(payload.eligible_base ?? 0);
            const st = Number(payload.subtotal ?? total ?? 0);
            const eligibleHint =
                payload.valid && eb > 0 && st > 0 && eb + 0.001 < st
                    ? `Скидка считается с ${formatPrice(eb)} ₽ (товары выбранной категории), полная корзина ${formatPrice(st)} ₽.`
                    : '';
            setPromoState({
                valid: !!payload.valid,
                message: payload.message || '',
                discountAmount: payload.discount_amount || 0,
                finalTotal: payload.final_total ?? total,
                loading: false,
                eligibleHint,
            });
        } catch (error) {
            const message = error?.response?.data?.message || 'Не удалось проверить промокод.';
            setPromoState({
                valid: false,
                message,
                discountAmount: 0,
                finalTotal: total || 0,
                loading: false,
                eligibleHint: '',
            });
        }
    };

    React.useEffect(() => {
        setPromoState((prev) => ({
            ...prev,
            valid: false,
            discountAmount: 0,
            finalTotal: total || 0,
            eligibleHint: '',
            message: prev.message ? 'Состав корзины изменился, промокод нужно применить заново.' : '',
        }));
    }, [total]);

    // Универсальный компонент кастомной радио-кнопки (для доставки и оплаты)
    const CustomRadio = ({ title, subtitle, value, field }) => {
        const isSelected = data[field] === value;
        return (
            <div 
                onClick={() => setData(field, value)}
                className={`p-4 bg-white rounded-md cursor-pointer flex justify-between items-center transition-all border ${isSelected ? 'border-[#08004E] ring-1 ring-[#08004E]' : 'border-gray-400 hover:border-gray-500'}`}
            >
                <div>
                    <h4 className="font-bold text-black text-sm">{title}</h4>
                    {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
                </div>
                <div className={`w-5 h-5 shrink-0 rounded-full border-2 flex items-center justify-center ml-4 ${isSelected ? 'border-[#08004E]' : 'border-gray-400'}`}>
                    {isSelected && <div className="w-2.5 h-2.5 bg-[#08004E] rounded-full"></div>}
                </div>
            </div>
        );
    };

    return (
        <div className="min-h-screen flex flex-col font-man">
            <Head title="Корзина и Оформление" />
            <Header />

            <main className="flex-grow w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-14">
                <h1 className="text-3xl md:text-4xl font-extrabold text-black text-center mb-12">Корзина</h1>
                {flash?.success && (
                    <div className="mb-6 bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg text-sm font-medium">
                        {flash.success}
                    </div>
                )}
                {flash?.error && (
                    <div className="mb-6 bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg text-sm font-medium">
                        {flash.error}
                    </div>
                )}

                {isCartEmpty ? (
                    <div className="bg-white rounded-xl p-16 text-center shadow-sm border border-gray-200">
                        <svg className="w-20 h-20 mx-auto text-gray-300 mb-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 0a2 2 0 100 4 2 2 0 000-4z"></path></svg>
                        <p className="font-bold text-2xl text-black mb-4">Ваша корзина пуста</p>
                        <Link href="/catalog" className="inline-block bg-[#08004E] text-white font-bold px-8 py-3 rounded-lg hover:bg-opacity-90 transition">
                            Перейти в каталог
                        </Link>
                    </div>
                ) : (
                    <div className="flex flex-col lg:flex-row gap-8 items-start w-full">
                        
                        {/* ЛЕВАЯ КОЛОНКА (Товары и Форма) */}
                        <div className="flex-1 w-full flex flex-col gap-10 min-w-0">
                            
                            {/* СПИСОК ТОВАРОВ В КОРЗИНЕ */}
                            <div className="flex flex-col gap-4">
                                {cart.map(item => (
                                    <div key={item.id} className="bg-white rounded-xl p-4 sm:p-6 flex flex-col sm:flex-row items-center gap-4 sm:gap-6 shadow-sm border border-gray-200">
                                        <div className="w-22 h-18 sm:w-32 sm:h-24 shrink-0 flex items-center justify-center p-2">
                                            <img src={item.image || '/images/default_product.png'} alt={item.name} className="max-h-full max-w-full object-contain" />
                                        </div>

                                        {/* Инфо */}
                                        <div className="flex-1 w-full min-w-0">
                                            <Link href={`/products/${item.slug || item.product_id}`} className="text-sm sm:text-lg font-bold text-black hover:text-[#08004E] transition leading-snug line-clamp-2">
                                                {item.name}
                                            </Link>
                                            {item.spec_preview && item.spec_preview.length > 0 ? (
                                                <p
                                                    className="text-xs text-gray-600 mt-2 line-clamp-2 leading-snug"
                                                    title={item.spec_preview
                                                        .map((s) => `${String(s.name)}: ${String(s.value)}`)
                                                        .join(' · ')}
                                                >
                                                    {item.spec_preview.map((s, idx) => (
                                                        <span key={`${item.id}-${String(s.name)}-${idx}`}>
                                                            {idx > 0 ? <span className="text-gray-400 mx-1">·</span> : null}
                                                            <span className="text-gray-500">{String(s.name)}:</span>{' '}
                                                            <span className="text-gray-800">{String(s.value)}</span>
                                                        </span>
                                                    ))}
                                                </p>
                                            ) : (
                                                <p className="text-xs text-gray-400 mt-2 line-clamp-2 leading-snug">Для товара не указаны характеристики в каталоге.</p>
                                            )}
                                        </div>

                                        {/* Кол-во, Цена и Иконки */}
                                        <div className="flex items-center gap-6 shrink-0 w-full md:w-auto justify-between md:justify-end mt-4 md:mt-0">
                                            {/* Блок количества (Серый) */}
                                            <div className="flex items-center bg-[#EAEAEA] rounded-md h-8 px-1">
                                                <button onClick={() => updateQuantity(item.id, item.quantity - 1, item.max_available)} className="w-6 h-full font-bold text-black hover:text-[#08004E] transition">-</button>
                                                <div className="w-8 text-center text-sm font-bold text-black">{item.quantity}</div>
                                                <button onClick={() => updateQuantity(item.id, item.quantity + 1, item.max_available)} className="w-6 h-full font-bold text-black hover:text-[#08004E] transition">+</button>
                                            </div>

                                            {/* Блок цены и иконок */}
                                            <div className="flex flex-col items-end gap-2">
                                                <div className="text-lg sm:text-2xl font-extrabold text-black whitespace-nowrap">
                                                    {formatPrice(item.price * item.quantity)} ₽
                                                </div>
                                                <div className="flex items-center gap-3 text-black">
                                                    <button className="hover:text-red-500 transition"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z"></path></svg></button>
                                                    <button onClick={() => removeItem(item.id)} className="hover:text-red-500 transition"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.134-2.036-2.134H8.716C7.596 2.345 6.686 3.299 6.686 4.48v.916m7.5 0a48.667 48.667 0 00-7.5 0"></path></svg></button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* ФОРМА ОФОРМЛЕНИЯ ЗАКАЗА */}
                            <div>
                                <h2 className="text-2xl font-extrabold text-black mb-6">Оформление заказа</h2>
                                
                                <form id="checkout-form" onSubmit={submitOrder} className="flex flex-col gap-6">
                                    
                                    {/* Ряд 1: Способ получения */}
                                    <div>
                                        <label className="block text-sm font-bold text-black mb-2">Способ получения</label>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <CustomRadio title="Доставка курьером" subtitle="от 1100 ₽ / до 7 дней" value="Доставка курьером" field="delivery_method" />
                                            <CustomRadio title="Пункт выдачи заказов" subtitle="от 800 ₽ / до 7 дней" value="Пункт выдачи" field="delivery_method" />
                                        </div>
                                    </div>

                                    {/* Ряд 2: Адрес (условно) */}
                                    {isPickup ? (
                                        <div>
                                            <label className="block text-sm font-bold text-black mb-2">Выбор пункта выдачи</label>
                                            {pickupPoints.length === 0 ? (
                                                <div className="bg-amber-50 border border-amber-200 text-amber-700 text-sm px-4 py-3 rounded-lg">
                                                    Пока не добавлено ни одного пункта выдачи. Пожалуйста, выберите курьерскую доставку.
                                                </div>
                                            ) : (
                                                <div className="flex flex-col gap-4">
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                        <select
                                                            value={data.pickup_city}
                                                            onChange={(e) => {
                                                                setData('pickup_city', e.target.value);
                                                                setData('pickup_point_id', '');
                                                            }}
                                                            className="w-full bg-white border border-gray-400 rounded-md px-4 py-3 text-sm text-black focus:ring-[#08004E] focus:border-[#08004E]"
                                                        >
                                                            <option value="">Все города</option>
                                                            {pickupCities.map((city) => (
                                                                <option key={city} value={city}>{city}</option>
                                                            ))}
                                                        </select>
                                                        <div className="text-sm text-gray-600 flex items-center">
                                                            Выбрано пунктов: <span className="font-bold text-black ml-1">{filteredPickupPoints.length}</span>
                                                        </div>
                                                    </div>

                                                    <div className="grid grid-cols-1 gap-2 max-h-[320px] overflow-auto pr-1">
                                                        {filteredPickupPoints.map((p) => {
                                                            const isSelected = String(data.pickup_point_id) === String(p.id);
                                                            return (
                                                                <button
                                                                    type="button"
                                                                    key={p.id}
                                                                    onClick={() => setData('pickup_point_id', p.id)}
                                                                    className={`text-left p-4 rounded-md border transition flex gap-3 items-start ${
                                                                        isSelected
                                                                            ? 'border-[#08004E] ring-1 ring-[#08004E] bg-white'
                                                                            : 'border-gray-300 bg-white hover:border-gray-500'
                                                                    }`}
                                                                >
                                                                    <div className={`w-5 h-5 shrink-0 mt-1 rounded-full border-2 flex items-center justify-center ${
                                                                        isSelected ? 'border-[#08004E]' : 'border-gray-400'
                                                                    }`}>
                                                                        {isSelected && <div className="w-2.5 h-2.5 bg-[#08004E] rounded-full"></div>}
                                                                    </div>
                                                                    <div className="min-w-0 flex-1">
                                                                        <p className="text-sm font-bold text-black">
                                                                            г. {p.city}, {p.address}
                                                                        </p>
                                                                        {p.name && (
                                                                            <p className="text-xs text-gray-500 mt-0.5">«{p.name}»</p>
                                                                        )}
                                                                        <p className="text-xs text-gray-500 mt-1">
                                                                            {[p.working_hours, p.phone].filter(Boolean).join(' • ') || 'Часы работы не указаны'}
                                                                        </p>
                                                                    </div>
                                                                </button>
                                                            );
                                                        })}
                                                        {filteredPickupPoints.length === 0 && (
                                                            <p className="text-sm text-gray-500 px-1">В выбранном городе нет активных пунктов выдачи.</p>
                                                        )}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                            <div className="col-span-1">
                                                <label className="block text-sm font-bold text-black mb-2">Город доставки</label>
                                                <input type="text" required={!isPickup} value={data.city} onChange={e => setData('city', e.target.value)} placeholder="Введите город" className="w-full bg-white border border-gray-400 rounded-md px-4 py-3 text-sm text-black placeholder-gray-400 focus:ring-[#08004E] focus:border-[#08004E]" />
                                            </div>
                                            <div className="col-span-1 md:col-span-2">
                                                <label className="block text-sm font-bold text-black mb-2">Адрес доставки</label>
                                                <input type="text" required={!isPickup} value={data.address_street} onChange={e => setData('address_street', e.target.value)} placeholder="Введите адрес (улица, дом)" className="w-full bg-white border border-gray-400 rounded-md px-4 py-3 text-sm text-black placeholder-gray-400 focus:ring-[#08004E] focus:border-[#08004E] mb-4" />
                                                <div className="grid grid-cols-3 gap-4">
                                                    <input type="text" value={data.address_entrance} onChange={e => setData('address_entrance', e.target.value)} placeholder="Подъезд" className="w-full bg-white border border-gray-400 rounded-md px-4 py-3 text-sm text-black placeholder-gray-400 focus:ring-[#08004E] focus:border-[#08004E]" />
                                                    <input type="text" value={data.address_floor} onChange={e => setData('address_floor', e.target.value)} placeholder="Этаж" className="w-full bg-white border border-gray-400 rounded-md px-4 py-3 text-sm text-black placeholder-gray-400 focus:ring-[#08004E] focus:border-[#08004E]" />
                                                    <input type="text" value={data.address_apartment} onChange={e => setData('address_apartment', e.target.value)} placeholder="Квартира" className="w-full bg-white border border-gray-400 rounded-md px-4 py-3 text-sm text-black placeholder-gray-400 focus:ring-[#08004E] focus:border-[#08004E]" />
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Ряд 3: Реквизиты */}
                                    <div>
                                        <label className="block text-sm font-bold text-black mb-2">Реквизиты</label>
                                        <input type="text" required value={data.name} onChange={e => setData('name', e.target.value)} placeholder="ФИО" className="w-full bg-white border border-gray-400 rounded-md px-4 py-3 text-sm text-black placeholder-gray-400 focus:ring-[#08004E] focus:border-[#08004E] mb-4" />
                                        
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <input
                                                type="tel"
                                                required
                                                inputMode="tel"
                                                value={data.phone}
                                                onChange={(e) => setData('phone', formatRuPhone(e.target.value))}
                                                placeholder="8(910)123-12-12"
                                                className="w-full bg-white border border-gray-400 rounded-md px-4 py-3 text-sm text-black placeholder-gray-400 focus:ring-[#08004E] focus:border-[#08004E]"
                                            />
                                            <input type="email" required value={data.email} onChange={e => setData('email', e.target.value)} placeholder="Почта" className="w-full bg-white border border-gray-400 rounded-md px-4 py-3 text-sm text-black placeholder-gray-400 focus:ring-[#08004E] focus:border-[#08004E]" />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <label className="block text-sm font-bold text-black mb-2">
                                                Желаемые дата и время доставки <span className="font-normal text-gray-500">(необязательно)</span>
                                            </label>
                                            <input
                                                type="datetime-local"
                                                value={data.delivery_time}
                                                onChange={(e) => setData('delivery_time', e.target.value)}
                                                className="w-full bg-white border border-gray-400 rounded-md px-4 py-3 text-sm text-black focus:ring-[#08004E] focus:border-[#08004E]"
                                            />
                                            {errors.delivery_time && (
                                                <p className="text-red-600 text-xs mt-1">{errors.delivery_time}</p>
                                            )}
                                        </div>
                                        <div className="md:col-span-1 md:row-span-1 flex flex-col">
                                            <label className="block text-sm font-bold text-black mb-2">
                                                Комментарий к заказу <span className="font-normal text-gray-500">(необязательно)</span>
                                            </label>
                                            <textarea
                                                value={data.customer_comment}
                                                onChange={(e) => setData('customer_comment', e.target.value)}
                                                rows={4}
                                                placeholder="Уточнения по адресу, звонку перед доставкой и т.д."
                                                className="w-full flex-1 min-h-[104px] bg-white border border-gray-400 rounded-md px-4 py-3 text-sm text-black placeholder-gray-400 focus:ring-[#08004E] focus:border-[#08004E] resize-y"
                                            />
                                            {errors.customer_comment && (
                                                <p className="text-red-600 text-xs mt-1">{errors.customer_comment}</p>
                                            )}
                                        </div>
                                    </div>

                                    {/* Ряд 4: Способ оплаты */}
                                    <div>
                                        <label className="block text-sm font-bold text-black mb-2">Способ оплаты</label>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <CustomRadio title="Онлайн" subtitle="Безопасная оплата банковской картой онлайн" value="Онлайн" field="payment_method" />
                                            <CustomRadio title="При получении" subtitle="Оплата банковской картой или наличными курьеру" value="При получении" field="payment_method" />
                                        </div>
                                    </div>

                                </form>
                            </div>

                        </div>

                        {/* ПРАВАЯ КОЛОНКА (Итоговый блок) - ЖЕСТКО ЗАФИКСИРОВАНА */}
                        <aside className="w-full lg:w-[320px] shrink-0 bg-white rounded-xl p-6 border border-gray-200 shadow-sm sticky top-6">
                            
                            <div className="mb-6">
                                <label className="block text-xs font-bold text-black mb-2">Промокод</label>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={data.promo_code}
                                        onChange={e => setData('promo_code', e.target.value)}
                                        className="flex-1 h-9 bg-white border border-gray-400 rounded-sm px-2 text-sm text-black focus:ring-[#08004E] focus:border-[#08004E]"
                                    />
                                    <button
                                        type="button"
                                        onClick={applyPromocode}
                                        disabled={promoState.loading}
                                        className="h-9 px-3 bg-[#08004E] text-white text-xs font-semibold rounded-sm hover:bg-opacity-90 disabled:opacity-50"
                                    >
                                        {promoState.loading ? '...' : 'Применить'}
                                    </button>
                                </div>
                                {promoState.message && (
                                    <p className={`mt-2 text-xs ${promoState.valid ? 'text-green-600' : 'text-red-600'}`}>
                                        {promoState.message}
                                    </p>
                                )}
                                {promoState.eligibleHint ? (
                                    <p className="mt-1 text-xs text-gray-600">{promoState.eligibleHint}</p>
                                ) : null}
                            </div>

                            <div className="flex justify-between items-center text-sm text-black mb-3">
                                <span className="text-gray-500">Ваши товары ({cart.reduce((sum, item) => sum + item.quantity, 0)})</span>
                                <span className="font-bold">{formatPrice(total)} ₽</span>
                            </div>

                            <div className="flex justify-between items-center text-sm text-black mb-6 pb-6 border-b border-gray-200">
                                <span className="text-gray-500">Способ получения</span>
                                <span className="font-bold text-right">{data.delivery_method === 'Доставка курьером' ? 'Курьер' : 'Самовывоз'}</span>
                            </div>

                            {promoState.discountAmount > 0 && (
                                <div className="flex justify-between items-center text-sm text-black mb-3">
                                    <span className="text-gray-500">Скидка по промокоду</span>
                                    <span className="font-bold text-green-600">- {formatPrice(promoState.discountAmount)} ₽</span>
                                </div>
                            )}

                            <div className="flex justify-between items-end mb-6">
                                <span className="text-sm font-bold text-black">Итого к оплате:</span>
                                <span className="text-xl font-extrabold text-black">{formatPrice(promoState.valid ? promoState.finalTotal : total)} ₽</span>
                            </div>

                            {/* Кнопка связана с формой слева по ID */}
                            <button 
                                type="submit" 
                                form="checkout-form"
                                disabled={processing}
                                className="w-full bg-[#08004E] text-white font-bold py-3.5 rounded-lg hover:bg-opacity-90 active:scale-[0.98] transition-all disabled:opacity-50"
                            >
                                {processing ? 'Обработка...' : 'Оформить заказ'}
                            </button>

                        </aside>

                    </div>
                )}
            </main>

            <Footer />
        </div>
    );
}