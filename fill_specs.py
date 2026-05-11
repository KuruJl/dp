import time
import random
import json
import os.path
from bs4 import BeautifulSoup

from selenium import webdriver
from selenium.webdriver.edge.service import Service
from selenium.webdriver.edge.options import Options as EdgeOptions
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

# --- КОНФИГУРАЦИЯ ---
CURRENT_CATEGORY = 'mice'

CONFIG = {
    'mice': { 'output_file': 'mice_dns_with_specs.json' },
    'keyboards': { 'output_file': 'keyboards_dns_with_specs.json' },
    'monitors': { 'output_file': 'monitors_dns_with_specs.json' },
}
# -------------------------

# --- ВСТАВЬ СЮДА СВЕЖИЕ ДАННЫЕ ПЕРЕД ЗАПУСКОМ ---
COOKIE_STRING = """IsInterregionalPickupAllowed=true; current_path=605bfdc517d7e9e23947448a9bf1ce16ac36b884434a3fdb10db053793c50392a%3A2%3A%7Bi%3A0%3Bs%3A12%3A%22current_path%22%3Bi%3A1%3Bs%3A115%3A%22%7B%22city%22%3A%2230b7c1f3-03fb-11dc-95ee-00151716f9f5%22%2C%22cityName%22%3A%22%5Cu041c%5Cu043e%5Cu0441%5Cu043a%5Cu0432%5Cu0430%22%2C%22method%22%3A%22manual%22%7D%22%3B%7D; cartUserCookieIdent_v3=04d19f862f3a1e8267837581c3eec26b3f06155e3d51172843a001564cb7998da%3A2%3A%7Bi%3A0%3Bs%3A22%3A%22cartUserCookieIdent_v3%22%3Bi%3A1%3Bs%3A36%3A%228588f139-7795-3dfe-bd66-c1b4bd8ebdcf%22%3B%7D; phonesIdentV2=15651947-c770-4806-9109-928301823537; _ab__hitwobbler=hitwobbler_3; rsu-id=a9986266-2f7a-4931-9895-de5271e45abd; lang=ru; PHPSESSID=049dae940c5af7f75a10965b163e73bd; _csrf=87b6e40f05a4914f9059cb4e721ba98ea642860455facb144f378760cac7fa8ea%3A2%3A%7Bi%3A0%3Bs%3A5%3A%22_csrf%22%3Bi%3A1%3Bs%3A32%3A%22ImWGZqN-hJg0lQ-9klPFFfu_A_ccjTjM%22%3B%7D; ab_spa=%7B%22endless-feed-test%22%3A%22list_1%22%2C%22products_presearch%22%3A%22presearch_2%22%7D; _ab__monthly-payment=monthly-payment_1; city_path=moscow; qrator_jsr=v2.0.1760272268.135.b2b892b1ersyfR1i|djTXzEG0qTVaGB5f|32/2EN7dymZl4EudMShaHE6I3l26lfizUbp8L3v/WzbiSlhQGTaUmjzZCfjkwRiRUs8RiKWjnd5S+GUzE+CdI38mxhJOcgCGtvIdg3NElc4=-pzPP+7esJMKuMOnj5bBhTmxVebo=-00; qrator_jsid2=v2.0.1760272268.135.b2b892b1ersyfR1i|0LrMLzBjENPKL9xj|PA4uFx2NZBws8yO4GzvhaUEKwD/NZCNDMeBLoOsryYe5Pn33sRFLFcYIYreO4yfE55zmDcSgAF/uNEnHNJePB6hNZuIQaRhBRqNfClLmvOFg7NP2Bulhr6vuyDVO+82BlXIHH38wNF0IMzJobSD5gw==-UdzsMXEe6r9uVFptdfhbR/EgczI="""
# ----------------------------------------------------

def parse_specs_from_product_page(html):
    specs = {}
    soup = BeautifulSoup(html, 'lxml')
    characteristic_rows = soup.find_all('li', class_='product-characteristics__spec')
    for row in characteristic_rows:
        title_tag = row.find('div', class_='product-characteristics__spec-title')
        value_tag = row.find('div', class_='product-characteristics__spec-value')
        if title_tag and value_tag:
            specs[title_tag.get_text(strip=True)] = value_tag.get_text(strip=True)
    return specs

if __name__ == "__main__":
    if CURRENT_CATEGORY not in CONFIG:
        print(f"ОШИБКА: Категория '{CURRENT_CATEGORY}' не найдена в CONFIG. Выход.")
        exit()
    config = CONFIG[CURRENT_CATEGORY]
    RESULT_FILE = 'storage/app/data/' + config['output_file']

    try:
        service = Service(executable_path='msedgedriver.exe')
        options = EdgeOptions()
        options.add_argument('--no-sandbox'); options.add_argument('--disable-dev-shm-usage'); options.add_argument('--disable-gpu'); options.add_argument('--log-level=3'); options.add_argument("--start-maximized")
        options.add_experimental_option("excludeSwitches", ["enable-automation", "enable-logging"]); options.add_experimental_option('useAutomationExtension', False)
        driver = webdriver.Edge(service=service, options=options)
        driver.set_page_load_timeout(120)
        print(f"Microsoft Edge WebDriver запущен для категории: {CURRENT_CATEGORY.upper()}")
    except Exception as e:
        print(f"КРИТИЧЕСКАЯ ОШИБКА ПРИ ЗАПУСКЕ SELENIUM: {e}")
        print("Убедись, что файл 'msedgedriver.exe' находится в той же папке, что и скрипт, и соответствует версии Microsoft Edge.")
        exit()

    all_products_info = []
    if os.path.exists(RESULT_FILE):
        with open(RESULT_FILE, 'r', encoding='utf-8') as f: all_products_info = json.load(f)
        print(f"Загружено {len(all_products_info)} товаров из '{RESULT_FILE}'.")
    else:
        print(f"Файл '{RESULT_FILE}' не найден. Сначала запустите create_base_file.py"); driver.quit(); exit()

    if all_products_info:
        print("\n--- ЭТАП 4: Сбор подробных характеристик ---")
        driver.get("https://www.dns-shop.ru/"); cookie_parts = [c.strip().split('=', 1) for c in COOKIE_STRING.split(';') if '=' in c]
        for part in cookie_parts: driver.add_cookie({'name': part[0], 'value': part[1], 'domain': '.dns-shop.ru'})
        time.sleep(3)
        processed_count = sum(1 for p in all_products_info if p.get('specifications')); print(f"Уже обработано: {processed_count} из {len(all_products_info)} товаров.")

        for i, product in enumerate(all_products_info):
            if product.get('specifications'): continue
            print(f"Обработка товара {i+1}/{len(all_products_info)}: {product['name'][:50]}...")
            try:
                driver.get(product['link']); time.sleep(3); print("    > Быстрая прокрутка...");
                for _ in range(3): driver.execute_script("window.scrollBy(0, 500);"); time.sleep(0.5)
                try:
                    wait = WebDriverWait(driver, 10); expand_button = wait.until(EC.element_to_be_clickable((By.CLASS_NAME, "product-characteristics__expand")))
                    driver.execute_script("arguments[0].click();", expand_button); print(f"    > Кнопка найдена и нажата."); time.sleep(2)
                except Exception:
                    print("    > Кнопка не найдена, продолжаем...")
                html = driver.page_source; specs = parse_specs_from_product_page(html)
                if not specs: print("    ! Характеристики не найдены.")
                product['specifications'] = specs
                with open(RESULT_FILE, 'w', encoding='utf-8') as f: json.dump(all_products_info, f, ensure_ascii=False, indent=4)
                time.sleep(random.uniform(1, 4))
            except Exception as e:
                print(f"    ! Критическая ошибка: {e}"); driver.quit(); exit()
        print(f"\nПОЛНЫЙ УСПЕХ! Все характеристики для {CURRENT_CATEGORY} собраны."); driver.quit()