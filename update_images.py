"""
Заполняет поле image_url в JSON DNS для товаров, где его ещё нет.

Открывает страницу карточки товара в браузере (Selenium) и достаёт URL основной картинки.

Запуск (из корня проекта):
  python update_images.py cases
  python update_images.py carpet

Перед запуском обнови COOKIE_STRING в этом файле (куки с dns-shop.ru быстро протухают).
Файл msedgedriver.exe должен лежать в корне проекта рядом со скриптом (Microsoft Edge).

После парсинга синхронизация с БД:
  php artisan products:sync-images-from-json
"""

import argparse
import json
import random
import sys
import time
from pathlib import Path
from typing import List, Optional

from bs4 import BeautifulSoup
from selenium import webdriver
from selenium.webdriver.edge.options import Options as EdgeOptions
from selenium.webdriver.edge.service import Service
from selenium.webdriver.common.by import By
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.support.ui import WebDriverWait

BASE_DIR = Path(__file__).resolve().parent

# --- ВЫБОР КАТЕГОРИИ ПО УМОЛЧАНИЮ (перекрывается аргументом CLI) ---
DEFAULT_CATEGORY = "ssd_sata"

CONFIG = {
    "gpus": {"output_file": "gpus_dns_with_specs.json"},
    "cpus": {"output_file": "cpus_dns_with_specs.json"},
    "motherboards": {"output_file": "motherboards_dns_with_specs.json"},
    "ram": {"output_file": "ram_dns_with_specs.json"},
    "cases": {"output_file": "cases_dns_with_specs.json"},
    "carpet": {"output_file": "carpet_dns_with_specs.json"},
    "psu": {"output_file": "psu_dns_with_specs.json"},
    "culer": {"output_file": "culer_dns_with_specs.json"},
    "ssd_m2": {"output_file": "ssd_m2_dns_with_specs.json"},
    "ssd_sata": {"output_file": "ssd_sata_dns_with_specs.json"},
    "hdd": {"output_file": "hdd_dns_with_specs.json"},
    "monitors": {"output_file": "monitor_dns_with_specs.json"},
    "keyboards": {"output_file": "keyboards_dns_with_specs.json"},
    "mice": {"output_file": "mice_dns_with_specs.json"},
    "headphones": {"output_file": "headphoness_dns_with_specs.json"},
}

# --- ВСТАВЬ СЮДА СВЕЖИЕ КУКИ ПЕРЕД ЗАПУСКОМ ---
COOKIE_STRING = """cartUserCookieIdent_v3=c87f6369e3e3151a81002901b036186833201fbdfdb784ab32e86a5820d66541a%3A2%3A%7Bi%3A0%3Bs%3A22%3A%22cartUserCookieIdent_v3%22%3Bi%3A1%3Bs%3A36%3A%226fa3073b-25cc-3e61-9a2f-b470e0bded63%22%3B%7D; rrpvid=816915377113175; _gcl_au=1.1.260340936.1770724551; _ga=GA1.1.396767360.1770724551; tmr_lvid=9a0f9393a559471a84f695f119d5d998; tmr_lvidTS=1770724554750; _ym_uid=1770724555811244200; _ym_d=1770724555; _ymab_param=NvTZX2n0prz3biCcKZ62GJxnch3ODEogwRE8MatVMFS1OXPMhbTsGesMplZgINZR1MWAf7OEuo224tzK_v4GP_zU-_I; current_path=605bfdc517d7e9e23947448a9bf1ce16ac36b884434a3fdb10db053793c50392a%3A2%3A%7Bi%3A0%3Bs%3A12%3A%22current_path%22%3Bi%3A1%3Bs%3A115%3A%22%7B%22city%22%3A%2230b7c1f3-03fb-11dc-95ee-00151716f9f5%22%2C%22cityName%22%3A%22%5Cu041c%5Cu043e%5Cu0441%5Cu043a%5Cu0432%5Cu0430%22%2C%22method%22%3A%22manual%22%7D%22%3B%7D; wishlist-login-modal-closed=1; phonesIdentV2=239edc2a-b126-412a-945d-22077ce86035; PHPSESSID=e7a1f54f59cf76f336d62f80f59e1c70; rai=5d63e569dd086b5cec36b33f2383c8fd; domain_sid=n9OfEIUqnxL4UbUWIYp0v%3A1778326466704; _ab__auto-filters=auto_filters_testing; qrator_jsr=v2.0.1778404815.917.901f5609d5eEhe2Q|zKqQMf9mWSdJwEzt|eGfb4C0ybnpniMaBXSa1ECRvigfznQ6qy3/mOr2UiFnw6gV+jAdq5m781uY4Kd2HToWZJ7J27h7c3/x88tzxJA==-P7CTYJIJ3WXQdLiF9H414bDDtFI=-00; qrator_ssid2=v2.0.1778404817.568.901f56090KWMLADP|5TVuERVhAF6ghqsc|37gs6/ps9REn6S/99wgxYW/ZbV0A4z2DkSxAD3ek/78KFXgfWIX6jWUKL5lsln5wW+85InsVGVD5bOQsvZ4hdQ==-wbzDbq1XopmAoLbaqSVBc/U/qe0=; qrator_jsid2=v2.0.1778404815.917.901f5609d5eEhe2Q|uJgpI0q4XUAeTrTm|4Iqt2sLsbR/TDwGmQ1TLvdsD58MmONwVpJ3Qd8r1RcSgnpy0M+DalAiQTvmRpb2TVVH9OCQdR+yMszfXH52tYTdAV5+V8ftheQvd1hVqpbJjG7QHnHeuOodIa7zFkzJFLqdmlUculS4Js3PeQqvXsA==-M61MlOKzA5qZLWiFn8wFTgAeTWI=; lang=ru; city_path=moscow; chat-bot=jaicp; _ym_isad=2; _csrf=939dc6759d3485b25d0722ca967e97c63705e0cbeb5c8825f1a77b78d3a73aeba%3A2%3A%7Bi%3A0%3Bs%3A5%3A%22_csrf%22%3Bi%3A1%3Bs%3A32%3A%223kJyQnG1Rw2AwipBGqajGrGn67XX7CBP%22%3B%7D; _ym_visorc=b; rr-testCookie=testvalue; _ga_FLS4JETDHW=GS2.1.s1778404940$o7$g1$t1778404957$j43$l0$h2137394083; tmr_detect=0%7C1778404959789"""
# ----------------------------------------------------

# Паузы (секунды). После открытия карточки товара — даём DOM дорисоваться перед парсом картинки.
# Меньше значения → быстрее, но выше риск пустого img и блокировок DNS.
DELAY_AFTER_COOKIES_SEC = 1.0
DELAY_AFTER_PRODUCT_PAGE_MIN = 0.35
DELAY_AFTER_PRODUCT_PAGE_MAX = 0.9
DELAY_BETWEEN_PRODUCTS_MIN = 1.2
DELAY_BETWEEN_PRODUCTS_MAX = 3.0

IMAGE_CSS_SELECTORS = [
    "div.product-images-slider__main img",
    "div.product-images-slider img",
    ".product-page-gallery img",
    "picture.catalog-product-main-gallery-picture img",
    'img[itemprop="image"]',
]


def resolve_json_paths(filename: str) -> List[Path]:
    """Где может лежать файл — для импорта и для сидера."""
    candidates = [
        BASE_DIR / "storage" / "app" / "data" / filename,
        BASE_DIR / "imports" / filename,
    ]
    return [p for p in candidates if p.parent.is_dir()]


def pick_load_path(paths: List[Path]) -> Optional[Path]:
    for p in paths:
        if p.is_file():
            return p
    return None


def save_json_to_paths(paths: List[Path], data: list) -> None:
    text = json.dumps(data, ensure_ascii=False, indent=4)
    for p in paths:
        p.parent.mkdir(parents=True, exist_ok=True)
        p.write_text(text, encoding="utf-8")


def extract_image_url(driver, timeout: float = 12.0) -> Optional[str]:
    wait = WebDriverWait(driver, timeout)
    for selector in IMAGE_CSS_SELECTORS:
        try:
            el = wait.until(EC.presence_of_element_located((By.CSS_SELECTOR, selector)))
            url = el.get_attribute("src") or el.get_attribute("data-src")
            if url and url.startswith("http"):
                return url
        except Exception:
            continue

    soup = BeautifulSoup(driver.page_source, "lxml")
    og = soup.find("meta", property="og:image")
    if og and og.get("content"):
        return og["content"].strip()

    return None


def parse_args():
    p = argparse.ArgumentParser(description="DNS Shop: дописать image_url в JSON по ссылкам товаров.")
    p.add_argument(
        "category",
        nargs="?",
        default=DEFAULT_CATEGORY,
        help=f"Ключ категории из CONFIG (например: cases, carpet). По умолчанию: {DEFAULT_CATEGORY}",
    )
    p.add_argument(
        "--limit",
        type=int,
        default=0,
        help="Обработать только N товаров без картинки (0 = без лимита).",
    )
    return p.parse_args()


def main() -> None:
    args = parse_args()
    category = args.category.strip().lower()

    if category not in CONFIG:
        print(f"ОШИБКА: категория '{category}' не найдена. Доступно: {', '.join(sorted(CONFIG.keys()))}")
        sys.exit(1)

    filename = CONFIG[category]["output_file"]
    save_paths = resolve_json_paths(filename)
    load_path = pick_load_path(save_paths)

    if load_path is None:
        print(
            f"Файл '{filename}' не найден ни в storage/app/data, ни в imports.\n"
            "Скопируй JSON в одну из этих папок или сначала собери базовый файл."
        )
        sys.exit(1)

    all_products = json.loads(load_path.read_text(encoding="utf-8"))
    if not isinstance(all_products, list):
        print("ОШИБКА: JSON должен быть массивом объектов.")
        sys.exit(1)

    print(f"Загружено из: {load_path} ({len(all_products)} товаров)")
    print(f"Будем сохранять в: {', '.join(str(p) for p in save_paths)}")

    edge_driver = BASE_DIR / "msedgedriver.exe"
    if not edge_driver.is_file():
        print(f"Файл не найден: {edge_driver}")
        sys.exit(1)

    try:
        options = EdgeOptions()
        options.add_argument("--no-sandbox")
        options.add_argument("--disable-dev-shm-usage")
        options.add_argument("--disable-gpu")
        options.add_argument("--log-level=3")
        options.add_argument("--start-maximized")
        options.add_experimental_option("excludeSwitches", ["enable-automation", "enable-logging"])
        options.add_experimental_option("useAutomationExtension", False)

        driver = webdriver.Edge(
            service=Service(executable_path=str(edge_driver)),
            options=options,
        )
        driver.set_page_load_timeout(120)
        # selenium-stealth поддерживает только Chrome; для Edge не используем.
        print("Microsoft Edge WebDriver запущен.")
    except Exception as e:
        print(f"Ошибка запуска Selenium: {e}")
        sys.exit(1)

    driver.get("https://www.dns-shop.ru/")
    cookie_parts = [c.strip().split("=", 1) for c in COOKIE_STRING.split(";") if "=" in c]
    for part in cookie_parts:
        driver.add_cookie({"name": part[0], "value": part[1], "domain": ".dns-shop.ru"})
    time.sleep(DELAY_AFTER_COOKIES_SEC)

    processed_before = sum(1 for p in all_products if p.get("image_url"))
    print(f"Уже с картинкой: {processed_before} / {len(all_products)}")
    print("--- обновление ---")

    done_missing = 0
    for i, product in enumerate(all_products):
        if product.get("image_url"):
            continue
        if args.limit and done_missing >= args.limit:
            break

        link = product.get("link") or ""
        name = (product.get("name") or "")[:70]
        print(f"[{i + 1}/{len(all_products)}] {name}…")

        if not link.startswith("http"):
            print("    ! Нет валидной ссылки, пропуск.")
            continue

        try:
            driver.get(link)
            time.sleep(random.uniform(DELAY_AFTER_PRODUCT_PAGE_MIN, DELAY_AFTER_PRODUCT_PAGE_MAX))
            url = extract_image_url(driver)
            if url:
                product["image_url"] = url
                print(f"    OK {url[:72]}…")
                save_json_to_paths(save_paths, all_products)
                done_missing += 1
            else:
                print("    ! Картинка не найдена (селекторы + og:image).")
        except Exception as e:
            print(f"    ! Ошибка: {e}")

        time.sleep(random.uniform(DELAY_BETWEEN_PRODUCTS_MIN, DELAY_BETWEEN_PRODUCTS_MAX))

    driver.quit()
    processed_after = sum(1 for p in all_products if p.get("image_url"))
    print(f"\nГотово. С картинкой стало: {processed_after} / {len(all_products)}")
    print("Дальше обнови БД: php artisan products:sync-images-from-json")


if __name__ == "__main__":
    main()
