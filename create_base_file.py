import requests
from bs4 import BeautifulSoup
import json
import time
import random

# --- КОНФИГУРАЦИЯ ---
# 1. Выбери, какую категорию парсить, написав ее имя здесь
CURRENT_CATEGORY = 'keyboard'

# 2. Опиши здесь все твои категории
CONFIG = {
    'keyboard': {
        'url': 'https://www.dns-shop.ru/catalog/17a8a69116404e77/myshi/',
        'pages': 12,
        'output_file': 'mice_dns_with_specs.json'
    },
    'headphone': {
        'url': 'https://www.dns-shop.ru/catalog/17a9ef1716404e77/naushniki-i-garnitury/?virtual_category_uid=111b91dae7f88dda',
        'pages': 5,
        'output_file': 'headphone_dns_with_specs.json'
    },
    'monitors': {
        'url': 'https://www.dns-shop.ru/catalog/17a8943716404e77/monitory/',
        'pages': 12,
        'output_file': 'monitors_dns_with_specs.json'
    },
}
# -------------------------

# --- ВСТАВЬ СЮДА СВЕЖИЕ ДАННЫЕ ПЕРЕД ЗАПУСКОМ ---
COOKIE_STRING = """IsInterregionalPickupAllowed=true; current_path=605bfdc517d7e9e23947448a9bf1ce16ac36b884434a3fdb10db053793c50392a%3A2%3A%7Bi%3A0%3Bs%3A12%3A%22current_path%22%3Bi%3A1%3Bs%3A115%3A%22%7B%22city%22%3A%2230b7c1f3-03fb-11dc-95ee-00151716f9f5%22%2C%22cityName%22%3A%22%5Cu041c%5Cu043e%5Cu0441%5Cu043a%5Cu0432%5Cu0430%22%2C%22method%22%3A%22manual%22%7D%22%3B%7D; cartUserCookieIdent_v3=04d19f862f3a1e8267837581c3eec26b3f06155e3d51172843a001564cb7998da%3A2%3A%7Bi%3A0%3Bs%3A22%3A%22cartUserCookieIdent_v3%22%3Bi%3A1%3Bs%3A36%3A%228588f139-7795-3dfe-bd66-c1b4bd8ebdcf%22%3B%7D; phonesIdentV2=15651947-c770-4806-9109-928301823537; _ab__hitwobbler=hitwobbler_3; rsu-id=a9986266-2f7a-4931-9895-de5271e45abd; ab_spa=%7B%22endless-feed-test%22%3A%22list_1%22%2C%22products_presearch%22%3A%22presearch_2%22%7D; _ab__monthly-payment=monthly-payment_1; lang=ru; PHPSESSID=dfd00079e0ee93e0d8668240175c29be; _csrf=1162cbcb7fa3356233817132beb377bac0c78278f9978fab5f2b7e3662aaef2ba%3A2%3A%7Bi%3A0%3Bs%3A5%3A%22_csrf%22%3Bi%3A1%3Bs%3A32%3A%22O6HHy4hudPBz0ejweC7a3cb-dD79QKhZ%22%3B%7D; city_path=moscow; qrator_ssid2=v2.0.1760441632.181.413102158m9Taeq9|MUdBl1yJUcTMSjGG|KIsvwmfGntIdYjyUSJn2pnyD7dU5iGKrGlpYB95vBZIFoNs9MUluiDj4PUjUMfkUMS7aze3Bjx3xOfcDpVarIEqcuPInDxdR6Y2zHRnsH/XHJI0K5Hq15V0sL0tUR/P/QSBx0CuO8ALJqO/aZ9M1rQ==-c1suFGWNqtQ+JUhUZJEJ4RhivHs=; qrator_jsr=v2.0.1760441632.181.413102158m9Taeq9|sNmjl9GiOxwY5POb|WSNYCJJnY1A/dwQEyRgKG+M/ErDRkwMJpkFlWwoj7xp41NfVzs8TWeqVnqfe57cHhbV5FEJHbV7oVqZMMI1+0mi2zFDTqaKlsfPx0qlLHsMKh5f9dkqj+rWmd7XE+TYRTXYSJnqau77MlFfiJYdSRg==-uCinCF/SsQDuSm+zN1uQoPr0kG8=-00; qrator_jsid2=v2.0.1760441632.181.413102158m9Taeq9|cSAYpSE9OCLx2zPS|2eGmjrR+VzzMlFYGynTwHck9K1A1Olp04S78Yt2/TgFVxHEQpEbBN/qFQEH0E+Ld8joBZKKNbpL78bMtXmbimIZA1Q+HqN9f+Al6VjdCcDU6kPx3SePPUzwmZAinXi4EwWPMH2CO7CYh8rmboZDnoQ==-PC4UddmQ2GkZ+A6Lz+c7OZTpRIo="""
CSRF_TOKEN_STRING = "2JnCRuU-sBQvslWISDefaXo5rq_5OAky4_PD70M2Mm6Xr4oOnArYYUviF_J4UvUeH3qZzspbax-Ht_TWEn1aNA=="
# ----------------------------------------------------

def get_products_from_html(html):
    soup = BeautifulSoup(html, 'lxml')
    products = soup.find_all('div', class_='catalog-product')
    
    page_products = []
    for product in products:
        short_id = product.get('data-code')
        long_id = product.get('data-product')
        if not short_id or not long_id: continue
        
        name_tag = product.find('a', class_='catalog-product__name')
        name = name_tag.get_text(strip=True) if name_tag else 'N/A'
        link = "https://www.dns-shop.ru" + name_tag['href'] if name_tag and 'href' in name_tag.attrs else 'N/A'
        
        # --- НОВЫЙ, НАДЕЖНЫЙ ПОИСК КАРТИНКИ ---
        image_url = None
        # 1. Находим родительскую ссылку-обертку
        image_link_tag = product.find('a', class_='catalog-product__image-link')
        if image_link_tag:
            # 2. Внутри нее ищем тег img
            image_tag = image_link_tag.find('img')
            if image_tag:
                # 3. Приоритетно берем data-src, затем src
                image_url = image_tag.get('data-src') or image_tag.get('src')
        # ------------------------------------

        page_products.append({
            'short_id': short_id, 
            'long_id': long_id, 
            'name': name, 
            'price': 0, 
            'link': link, 
            'image_url': image_url,
            'specifications': {}
        })
    return page_products

if __name__ == "__main__":
    if CURRENT_CATEGORY not in CONFIG:
        print(f"ОШИБКА: Категория '{CURRENT_CATEGORY}' не найдена в CONFIG. Выход.")
        exit()
    
    config = CONFIG[CURRENT_CATEGORY]
    BASE_URL = config['url']
    PAGES_TO_PARSE = config['pages']
    RESULT_FILE = 'storage/app/data/' + config['output_file']

    print(f"--- ЗАПУСК ПАРСЕРА ДЛЯ КАТЕГОРИИ: {CURRENT_CATEGORY.upper()} ---")
    print(f"Сохраняем в файл: {RESULT_FILE}")

    session = requests.Session()
    session.headers.update({
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36',
        'Cookie': COOKIE_STRING
    })

    API_URL = 'https://www.dns-shop.ru/ajax-state/product-buy/'
    all_products_info = []

    print("--- ЭТАП 1: Сбор ID, названий и ссылок ---")
    for page_num in range(1, PAGES_TO_PARSE + 1):
        url = f"{BASE_URL}?p={page_num}" if page_num > 1 else BASE_URL
        print(f"Парсим страницу {page_num} из {PAGES_TO_PARSE}...")
        try:
            response_get = session.get(url, headers={'Referer': BASE_URL})
            response_get.raise_for_status()
            page_products = get_products_from_html(response_get.text)
            if not page_products: break
            all_products_info.extend(page_products)
            time.sleep(random.uniform(1, 3))
        except Exception as e:
            print(f"Ошибка на странице {page_num}: {e}. Выход."); exit()
    
    if not all_products_info:
        print("Не удалось собрать информацию о товарах. Выход."); exit()
    
    print(f"\n--- ЭТАП 2: Запрос цен через API ---")
    session.headers.update({
        'Accept': 'application/json, text/javascript, */*; q=0.01',
        'X-Requested-With': 'XMLHttpRequest', 'Referer': BASE_URL,
        'x-csrf-token': CSRF_TOKEN_STRING,
        'content-type': 'application/x-www-form-urlencoded'
    })

    product_short_ids = [p['short_id'] for p in all_products_info]
    prices = {}
    CHUNK_SIZE = 100
    for i in range(0, len(product_short_ids), CHUNK_SIZE):
        chunk = product_short_ids[i:i + CHUNK_SIZE]
        containers = [{"id": f"as-{i}", "data": {"id": pid}} for i, pid in enumerate(chunk)]
        post_data = {'data': json.dumps({"type": "product-buy", "containers": containers})}
        try:
            response = session.post(API_URL, data=post_data)
            response.raise_for_status()
            price_data = response.json()
            if price_data.get('data') and isinstance(price_data['data'].get('states'), list):
                for item in price_data['data']['states']:
                    if not item: continue
                    data_dict = item.get('data')
                    if not data_dict: continue
                    long_id = data_dict.get('id')
                    price_dict = data_dict.get('price')
                    if not long_id or not price_dict: continue
                    current_price = price_dict.get('current')
                    if current_price is not None: prices[long_id] = current_price
            time.sleep(random.uniform(1, 2))
        except Exception as e:
            print(f"Ошибка при запросе порции цен: {e}")
    
    print("\n--- ЭТАП 3: Объединение и сохранение базового файла ---")
    updated_count = 0
    for product in all_products_info:
        if product['long_id'] in prices:
            product['price'] = prices[product['long_id']]; updated_count += 1
    
    with open(RESULT_FILE, 'w', encoding='utf-8') as f:
        json.dump(all_products_info, f, ensure_ascii=False, indent=4)
    
    print(f"\nУСПЕХ! Базовый файл '{RESULT_FILE}' создан.")
    print(f"Всего товаров: {len(all_products_info)}. Цены найдены для {updated_count} товаров.")