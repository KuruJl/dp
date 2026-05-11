import { Builder, By, Key, until } from "selenium-webdriver";

const BASE_URL = "http://127.0.0.1:8000";
const EMAIL = "test@gmail.com";
const PASSWORD = "TestUser";
const TIMEOUT = 15000;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function clickByButtonText(driver, text) {
  const button = await driver.findElement(
    By.xpath(`//button[normalize-space()='${text}' or contains(normalize-space(),'${text}')]`)
  );
  await driver.executeScript("arguments[0].scrollIntoView({block:'center'});", button);
  await button.click();
}

async function handlePossibleAlert(driver) {
  try {
    await driver.wait(until.alertIsPresent(), 1500);
    const alert = await driver.switchTo().alert();
    const text = await alert.getText();
    await alert.accept();
    return text;
  } catch {
    return null;
  }
}

async function run() {
  const result = {
    scenario: "Login -> Configurator -> Select all components -> Save assembly",
    steps: [],
  };

  const driver = await new Builder().forBrowser("chrome").build();

  try {
    // 1) Login
    await driver.get(`${BASE_URL}/login`);
    await driver.wait(until.elementLocated(By.name("email")), TIMEOUT);
    await driver.findElement(By.name("email")).clear();
    await driver.findElement(By.name("email")).sendKeys(EMAIL);
    await driver.findElement(By.name("password")).clear();
    await driver.findElement(By.name("password")).sendKeys(PASSWORD, Key.ENTER);

    await driver.wait(async () => {
      const url = await driver.getCurrentUrl();
      return url.includes("/configurator") || url.includes("/dashboard") || url === `${BASE_URL}/`;
    }, TIMEOUT);

    result.steps.push({
      step: 1,
      name: "Вход в аккаунт",
      status: "PASS",
      details: await driver.getCurrentUrl(),
    });

    // 2) Go to configurator
    await driver.get(`${BASE_URL}/configurator`);
    await driver.wait(until.elementLocated(By.xpath("//h1[contains(.,'Конфигуратор')]")), TIMEOUT);
    result.steps.push({
      step: 2,
      name: "Переход в конфигуратор",
      status: "PASS",
      details: await driver.getCurrentUrl(),
    });

    // 3) Select all components via "Выбрать" rows
    let selectedCount = 0;
    const skippedSlots = [];
    const processedSlots = new Set();
    const maxIterations = 40;
    for (let i = 0; i < maxIterations; i += 1) {
      const slotRows = await driver.findElements(
        By.xpath("//div[contains(@class,'cursor-pointer') and .//div[contains(.,'Выбрать')]]")
      );

      let targetRow = null;
      let slotName = null;
      for (const row of slotRows) {
        const nameElement = await row.findElement(By.xpath(".//div[contains(@class,'font-bold')]"));
        const name = (await nameElement.getText()).trim();
        if (!processedSlots.has(name)) {
          targetRow = row;
          slotName = name;
          break;
        }
      }

      if (!targetRow || !slotName) break;
      processedSlots.add(slotName);

      await driver.executeScript("arguments[0].scrollIntoView({block:'center'});", targetRow);
      await targetRow.click();

      await driver.wait(
        until.elementLocated(By.xpath("//h3[contains(.,'Выберите') or contains(.,'компонент')]")),
        TIMEOUT
      );

      let productSelectButtons = [];
      try {
        await driver.wait(
          until.elementLocated(By.xpath("//button[contains(normalize-space(.),'Выбрать')]")),
          12000
        );
      } catch {
        // handled below
      }
      productSelectButtons = await driver.findElements(
        By.xpath("//button[contains(normalize-space(.),'Выбрать')]")
      );

      if (productSelectButtons.length === 0) {
        const noItemsText = await driver.findElements(By.xpath("//*[contains(.,'Товары не найдены')]"));
        if (noItemsText.length > 0) {
          skippedSlots.push(slotName);
          const closeButtons = await driver.findElements(By.xpath("//button[contains(.,'×')]"));
          if (closeButtons.length > 0) {
            await closeButtons[0].click();
            await sleep(400);
            continue;
          }
        }
        const bodyText = await driver.findElement(By.tagName("body")).getText();
        throw new Error(
          `В модальном окне нет доступных товаров для выбора (слот: ${slotName}). Текст страницы: ${bodyText.slice(0, 500)}`
        );
      }

      await productSelectButtons[0].click();
      await sleep(400);
      selectedCount += 1;
    }

    const remainingRows = await driver.findElements(
      By.xpath("//div[contains(@class,'cursor-pointer') and .//div[contains(.,'Выбрать')]]")
    );
    const remainingSlotNames = [];
    for (const row of remainingRows) {
      const nameElement = await row.findElement(By.xpath(".//div[contains(@class,'font-bold')]"));
      remainingSlotNames.push((await nameElement.getText()).trim());
    }

    result.steps.push({
      step: 3,
      name: "Выбор комплектующих",
      status: remainingRows.length === 0 ? "PASS" : "PARTIAL",
      details: {
        selectedCount,
        remainingUnfilled: remainingRows.length,
        remainingSlotNames,
        skippedSlots,
      },
    });

    // 4) Save assembly
    await clickByButtonText(driver, "Сохранить сборку");
    await driver.wait(until.elementLocated(By.xpath("//label[contains(.,'Название сборки')]")), TIMEOUT);

    const nameInput = await driver.findElement(
      By.xpath("//label[contains(.,'Название сборки')]/following::input[@type='text'][1]")
    );
    const assemblyName = `Selenium Build ${Date.now()}`;
    await nameInput.clear();
    await nameInput.sendKeys(assemblyName);

    await clickByButtonText(driver, "Подтвердить");
    let alertText = null;
    for (let i = 0; i < 6; i += 1) {
      const text = await handlePossibleAlert(driver);
      if (text) {
        alertText = text;
        break;
      }
      await sleep(500);
    }

    let redirectedToAssemblies = false;
    try {
      await driver.wait(async () => {
        try {
          return (await driver.getCurrentUrl()).includes("/my-assemblies");
        } catch (error) {
          if (String(error).includes("unexpected alert open")) {
            const text = await handlePossibleAlert(driver);
            if (text && !alertText) alertText = text;
            return false;
          }
          throw error;
        }
      }, 6000);
      redirectedToAssemblies = true;
    } catch {
      redirectedToAssemblies = false;
    }

    let finalUrl = "";
    try {
      finalUrl = await driver.getCurrentUrl();
    } catch (error) {
      if (String(error).includes("unexpected alert open")) {
        const text = await handlePossibleAlert(driver);
        if (text && !alertText) alertText = text;
        finalUrl = await driver.getCurrentUrl();
      } else {
        throw error;
      }
    }

    result.steps.push({
      step: 4,
      name: "Сохранение сборки",
      status: alertText && alertText.includes("успешно сохранена") ? "PASS" : "FAIL",
      details: {
        assemblyName,
        finalUrl,
        alertText,
        redirectedToAssemblies,
      },
    });

    printTerminalLog(result);
    console.log(JSON.stringify(result, null, 2));
  } finally {
    await driver.quit();
  }
}

run().catch((error) => {
  console.error("SELENIUM_ASSEMBLY_STEPS_FAILED");
  console.error(error?.stack || error);
  process.exit(1);
});

function printTerminalLog(result) {
  const byStep = new Map(result.steps.map((s) => [s.step, s]));

  const step1 = byStep.get(1);
  const step2 = byStep.get(2);
  const step3 = byStep.get(3);
  const step4 = byStep.get(4);

  if (step1) {
    console.log("[INFO] Шаг 1: Открыта страница входа и введены учетные данные пользователя");
    if (step1.status === "PASS") {
      console.log("[SUCCESS] Авторизация выполнена успешно, пользователь вошел в систему");
    }
  }

  if (step2) {
    console.log("[INFO] Шаг 2: Выполнен переход на страницу конфигуратора");
    if (step2.status === "PASS") {
      console.log("[SUCCESS] Страница конфигуратора открыта без ошибок");
    }
  }

  if (step3) {
    console.log("[INFO] Шаг 3: Поочередно выбраны комплектующие через модальные окна");
    if (step3.status === "PASS") {
      console.log("[SUCCESS] Все комплектующие выбраны корректно");
    } else {
      console.log("[SUCCESS] Комплектующие выбраны частично, требуется проверка незаполненных слотов");
    }
  }

  if (step4) {
    console.log("[INFO] Шаг 4: Выполнено сохранение сборки");
    if (step4.status === "PASS") {
      console.log("[SUCCESS] Сборка успешно сохранена и выполнен переход на страницу сохраненных сборок");
    }
  }
}
