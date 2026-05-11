import { Builder, By, until } from "selenium-webdriver";

const baseUrl = "http://127.0.0.1:8000";
const browsers = ["chrome", "MicrosoftEdge", "firefox"];

async function createDriver() {
  let lastError = null;
  for (const browser of browsers) {
    try {
      const builder = new Builder().forBrowser(browser);
      const driver = await builder.build();
      return { driver, browser };
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError ?? new Error("No browser could be started");
}

async function run() {
  const { driver, browser } = await createDriver();
  const result = {
    browser,
    scenarios: [],
  };

  try {
    await driver.get(`${baseUrl}/admin/dashboard`);
    await driver.wait(until.urlContains("/login"), 10000);
    result.scenarios.push({
      name: "Guest cannot access admin dashboard",
      status: "PASS",
      details: await driver.getCurrentUrl(),
    });

    await driver.get(`${baseUrl}/catalog/search`);
    await driver.wait(until.elementLocated(By.tagName("body")), 10000);
    const source = await driver.getPageSource();
    const hasErrorMarkers = /Server Error|Exception|Whoops/i.test(source);
    result.scenarios.push({
      name: "Catalog page loads",
      status: hasErrorMarkers ? "FAIL" : "PASS",
      details: hasErrorMarkers ? "Error markers found in HTML" : "Page loaded without server error markers",
    });

    const email = `selenium_${Date.now()}@example.com`;
    await driver.get(`${baseUrl}/register`);
    await driver.findElement(By.name("name")).sendKeys("Selenium User");
    await driver.findElement(By.name("email")).sendKeys(email);
    await driver.findElement(By.name("password")).sendKeys("Password123!");
    await driver.findElement(By.name("password_confirmation")).sendKeys("Password123!");
    const submitButton = await driver.findElement(
      By.xpath("//form//button[@type='submit' or contains(., 'Зарегистр') or contains(., 'Register')]")
    );
    await submitButton.click();

    await driver.wait(async () => {
      const current = await driver.getCurrentUrl();
      return current.includes("/dashboard") || current === `${baseUrl}/`;
    }, 10000);

    result.scenarios.push({
      name: "Register flow",
      status: "PASS",
      details: await driver.getCurrentUrl(),
    });
  } finally {
    await driver.quit();
  }

  console.log(JSON.stringify(result, null, 2));
}

run().catch((error) => {
  console.error("SELENIUM_SMOKE_FAILED");
  console.error(error?.stack || error);
  process.exit(1);
});
