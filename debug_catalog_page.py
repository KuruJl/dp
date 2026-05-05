import requests

# Вставь свежие cookie!
COOKIE_STRING = """IsInterregionalPickupAllowed=true; current_path=605bfdc517d7e9e23947448a9bf1ce16ac36b884434a3fdb10db053793c50392a%3A2%3A%7Bi%3A0%3Bs%3A12%3A%22current_path%22%3Bi%3A1%3Bs%3A115%3A%22%7B%22city%22%3A%2230b7c1f3-03fb-11dc-95ee-00151716f9f5%22%2C%22cityName%22%3A%22%5Cu041c%5Cu043e%5Cu0441%5Cu043a%5Cu0432%5Cu0430%22%2C%22method%22%3A%22manual%22%7D%22%3B%7D; cartUserCookieIdent_v3=04d19f862f3a1e8267837581c3eec26b3f06155e3d51172843a001564cb7998da%3A2%3A%7Bi%3A0%3Bs%3A22%3A%22cartUserCookieIdent_v3%22%3Bi%3A1%3Bs%3A36%3A%228588f139-7795-3dfe-bd66-c1b4bd8ebdcf%22%3B%7D; phonesIdentV2=15651947-c770-4806-9109-928301823537; _ab__hitwobbler=hitwobbler_3; rsu-id=a9986266-2f7a-4931-9895-de5271e45abd; lang=ru; PHPSESSID=049dae940c5af7f75a10965b163e73bd; _csrf=87b6e40f05a4914f9059cb4e721ba98ea642860455facb144f378760cac7fa8ea%3A2%3A%7Bi%3A0%3Bs%3A5%3A%22_csrf%22%3Bi%3A1%3Bs%3A32%3A%22ImWGZqN-hJg0lQ-9klPFFfu_A_ccjTjM%22%3B%7D; ab_spa=%7B%22endless-feed-test%22%3A%22list_1%22%2C%22products_presearch%22%3A%22presearch_2%22%7D; _ab__monthly-payment=monthly-payment_1; city_path=moscow; qrator_jsid2=v2.0.1760259714.800.b2b892b1n0Tzke9t|rGUtJ7beo0ofb6hd|FjtFQZKZyNLW5PdUzz/qKwR36CpjJ48voHVgVWQ1l8LhvPWQ1s/hzMsXmzfNsN4H4+pT8YdcJDbLgrTdaGB13Bb2Yh34dwARzJFBMOJFs2HPnCjFbzrXZIQvExC3tLWCzl239rjD2kcAFIybQtseoRSthOSaPO6WqToW3NJfCaxdreeX6zKx5YUw2uHE1+8H-AHbhElPjwghA7K/ARGnLgvBfZjM="""

CATALOG_URL = 'https://www.dns-shop.ru/catalog/17a8943716404e77/monitory/'

HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36',
    'Cookie': COOKIE_STRING
}

print(f"Запрашиваем страницу каталога: {CATALOG_URL}")
try:
    response = requests.get(CATALOG_URL, headers=HEADERS)
    response.raise_for_status()
    
    with open('catalog_page.html', 'w', encoding='utf-8') as f:
        f.write(response.text)
        
    print("УСПЕХ! HTML-код страницы сохранен в файл 'catalog_page.html'")
    print("Теперь открой этот файл и поищи в нем URL картинки, например, 'c.dns-shop.ru'.")

except Exception as e:
    print(f"ОШИБКА: {e}")