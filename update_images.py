import time
import random
import json
import os.path
from bs4 import BeautifulSoup

from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium_stealth import stealth

# --- КОНФИГУРАЦИЯ ---
# 1. Выбери, какой файл обновлять, написав его ключ здесь
CURRENT_CATEGORY = 'mice'

# 2. Убедись, что имена файлов здесь совпадают с твоими
CONFIG = {
    'gpus': {'output_file': 'gpus_dns_with_specs.json'},
    'cpus': {'output_file': 'cpus_dns_with_specs.json'},
    'motherboards': {'output_file': 'motherboards_dns_with_specs.json'},
    'ram': {'output_file': 'ram_dns_with_specs.json'},
    'cases': {'output_file': 'cases_dns_with_specs.json'},
    'psu': {'output_file': 'psu_dns_with_specs.json'},
    'culer': {'output_file': 'culer_dns_with_specs.json'},
    'ssd_m2': {'output_file': 'ssd_m2_dns_with_specs.json'},
    'ssd_sata': {'output_file': 'ssd_sata_dns_with_specs.json'},
    'hdd': {'output_file': 'hdd_dns_with_specs.json'},
    'monitors': {'output_file': 'monitor_dns_with_specs.json'},
    'keyboards': {'output_file': 'keyboards_dns_with_specs.json'},
    'mice': {'output_file': 'mice_dns_with_specs.json'},
    'headphones': {'output_file': 'headphoness_dns_with_specs.json'},
}
# -------------------------

# --- ВСТАВЬ СЮДА СВЕЖИЕ ДАННЫЕ ПЕРЕД ЗАПУСКОМ ---
# Важно! Куки живут недолго, возможно, придется обновить
COOKIE_STRING = """IsInterregionalPickupAllowed=true; current_path=605bfdc517d7e9e23947448a9bf1ce16ac36b884434a3fdb10db053793c50392a%3A2%3A%7Bi%3A0%3Bs%3A12%3A%22current_path%22%3Bi%3A1%3Bs%3A115%3A%22%7B%22city%22%3A%2230b7c1f3-03fb-11dc-95ee-00151716f9f5%22%2C%22cityName%22%3A%22%5Cu041c%5Cu043e%5Cu0441%5Cu043a%5Cu0432%5Cu0430%22%2C%22method%22%3A%22manual%22%7D%22%3B%7D; cartUserCookieIdent_v3=04d19f862f3a1e8267837581c3eec26b3f06155e3d51172843a001564cb7998da%3A2%3A%7Bi%3A0%3Bs%3A22%3A%22cartUserCookieIdent_v3%22%3Bi%3A1%3Bs%3A36%3A%228588f139-7795-3dfe-bd66-c1b4bd8ebdcf%22%3B%7D; phonesIdentV2=15651947-c770-4806-9109-928301823537; _ab__hitwobbler=hitwobbler_3; rsu-id=a9986266-2f7a-4931-9895-de5271e45abd; ab_spa=%7B%22endless-feed-test%22%3A%22list_1%22%2C%22products_presearch%22%3A%22presearch_2%22%7D; _ab__monthly-payment=monthly-payment_1; lang=ru; PHPSESSID=dfd00079e0ee93e0d8668240175c29be; _csrf=1162cbcb7fa3356233817132beb377bac0c78278f9978fab5f2b7e3662aaef2ba%3A2%3A%7Bi%3A0%3Bs%3A5%3A%22_csrf%22%3Bi%3A1%3Bs%3A32%3A%22O6HHy4hudPBz0ejweC7a3cb-dD79QKhZ%22%3B%7D; city_path=moscow; qrator_ssid2=v2.0.1760441632.181.413102158m9Taeq9|MUdBl1yJUcTMSjGG|KIsvwmfGntIdYjyUSJn2pnyD7dU5iGKrGlpYB95vBZIFoNs9MUluiDj4PUjUMfkUMS7aze3Bjx3xOfcDpVarIEqcuPInDxdR6Y2zHRnsH/XHJI0K5Hq15V0sL0tUR/P/QSBx0CuO8ALJqO/aZ9M1rQ==-c1suFGWNqtQ+JUhUZJEJ4RhivHs=; qrator_jsr=v2.0.1760441632.181.413102158m9Taeq9|sNmjl9GiOxwY5POb|WSNYCJJnY1A/dwQEyRgKG+M/ErDRkwMJpkFlWwoj7xp41NfVzs8TWeqVnqfe57cHhbV5FEJHbV7oVqZMMI1+0mi2zFDTqaKlsfPx0qlLHsMKh5f9dkqj+rWmd7XE+TYRTXYSJnqau77MlFfiJYdSRg==-uCinCF/SsQDuSm+zN1uQoPr0kG8=-00; qrator_jsid2=v2.0.1760441632.181.413102158m9Taeq9|cSAYpSE9OCLx2zPS|2eGmjrR+VzzMlFYGynTwHck9K1A1Olp04S78Yt2/TgFVxHEQpEbBN/qFQEH0E+Ld8joBZKKNbpL78bMtXmbimIZA1Q+HqN9f+Al6VjdCcDU6kPx3SePPUzwmZAinXi4EwWPMH2CO7CYh8rmboZDnoQ==-PC4UddmQ2GkZ+A6Lz+c7OZTpRIo="""
# ----------------------------------------------------

if __name__ == "__main__":
    if CURRENT_CATEGORY not in CONFIG:
        print(f"ОШИБКА: Категория '{CURRENT_CATEGORY}' не найдена в CONFIG. Выход.")
        exit()
        
    config = CONFIG[CURRENT_CATEGORY]
    # Путь к файлу теперь относительный от корня проекта Laravel
    RESULT_FILE = os.path.join('storage', 'app', 'data', config['output_file'])

    all_products_info = []
    if os.path.exists(RESULT_FILE):
        with open(RESULT_FILE, 'r', encoding='utf-8') as f:
            all_products_info = json.load(f)
        print(f"Загружено {len(all_products_info)} товаров из '{RESULT_FILE}'.")
    else:
        print(f"Файл '{RESULT_FILE}' не найден. Сначала запустите create_base_file.py");
        exit()

    try:
        service = Service(executable_path='chromedriver.exe')
        options = Options()
        options.add_argument('--no-sandbox'); options.add_argument('--disable-dev-shm-usage'); options.add_argument('--disable-gpu'); options.add_argument('--log-level=3'); options.add_argument("start-maximized")
        options.add_experimental_option("excludeSwitches", ["enable-automation", "enable-logging"]); options.add_experimental_option('useAutomationExtension', False)
        driver = webdriver.Chrome(service=service, options=options)
        driver.set_page_load_timeout(120)
        stealth(driver, languages=["ru-RU", "ru"], vendor="Google Inc.", platform="Win32", webgl_vendor="Intel Inc.", renderer="Intel Iris OpenGL Engine", fix_hairline=True)
        print(f"Selenium-stealth WebDriver запущен для обновления картинок: {CURRENT_CATEGORY.upper()}")
    except Exception as e:
        print(f"КРИТИЧЕСКАЯ ОШИБКА ПРИ ЗАПУСКЕ SELENIUM: {e}"); exit()

    # Устанавливаем куки для сессии
    driver.get("https://www.dns-shop.ru/")
    cookie_parts = [c.strip().split('=', 1) for c in COOKIE_STRING.split(';') if '=' in c]
    for part in cookie_parts:
        driver.add_cookie({'name': part[0], 'value': part[1], 'domain': '.dns-shop.ru'})
    time.sleep(2)

    processed_count = sum(1 for p in all_products_info if p.get('image_url'))
    print(f"Картинки уже есть у {processed_count} из {len(all_products_info)} товаров.")
    print("\n--- НАЧИНАЕМ ОБНОВЛЕНИЕ КАРТИНОК ---")
    
    for i, product in enumerate(all_products_info):
        # Пропускаем товар, если картинка уже есть
        if product.get('image_url'):
            continue

        print(f"Обработка товара {i+1}/{len(all_products_info)}: {product['name'][:60]}...")
        
        try:
            driver.get(product['link'])
            
            # Ждем, пока главная картинка товара не появится на странице
            wait = WebDriverWait(driver, 10)
            image_element = wait.until(EC.presence_of_element_located((By.CSS_SELECTOR, 'div.product-images-slider__main img')))
            
            image_url = image_element.get_attribute('src')
            
            if image_url:
                print(f"    > Картинка найдена: {image_url[:50]}...")
                product['image_url'] = image_url
                
                # Сохраняем прогресс после каждого найденного товара
                with open(RESULT_FILE, 'w', encoding='utf-8') as f:
                    json.dump(all_products_info, f, ensure_ascii=False, indent=4)
            else:
                print("    ! Не удалось извлечь URL из тега картинки.")

            # Пауза, чтобы не забанили
            time.sleep(random.uniform(2, 5))

        except Exception as e:
            print(f"    ! Ошибка при обработке товара: {e}")
            # Если ошибка критическая (например, капча), можно остановить скрипт
            # driver.quit()
            # exit()
    
    driver.quit()
    print(f"\nГОТОВО! Обновление картинок для '{CURRENT_CATEGORY}' завершено.")