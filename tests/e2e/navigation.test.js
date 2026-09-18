const { Builder, By, until } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');
const { expect } = require('chai');

describe('E2E - parcours utilisateur ShopNow', function () {
    this.timeout(30000);

    let driver;

    async function element(testId) {
        const locator = By.css(`[data-testid="${testId}"]`);
        const found = await driver.wait(until.elementLocated(locator), 10000);
        return driver.wait(until.elementIsVisible(found), 10000);
    }

    before(async function () {
        const options = new chrome.Options();
        const chromiumBinary = process.env.CHROMIUM_BINARY
            || '/snap/chromium/3529/usr/lib/chromium-browser/chrome';

        options.setChromeBinaryPath(chromiumBinary);
        options.addArguments(
            '--headless',
            '--no-sandbox',
            '--disable-dev-shm-usage',
            '--disable-gpu',
            '--user-data-dir=/tmp/shopnow-e2e-chrome'
        );

        driver = await new Builder()
            .forBrowser('chrome')
            .setChromeOptions(options)
            .build();
    });

    after(async function () {
        if (driver) {
            await driver.quit();
        }
    });

    it('doit réaliser un parcours complet avec le panier', async function () {
        await driver.get('http://localhost:8081');
        await driver.executeScript('localStorage.clear();');
        await driver.navigate().refresh();

        const homePage = await element('home-page');
        expect(await homePage.isDisplayed()).to.equal(true);

        await (await element('login-link')).click();
        await driver.wait(until.urlContains('login.html'), 10000);
        await (await element('login-submit')).click();
        await driver.wait(until.urlContains('products.html'), 10000);

        const loggedUser = await element('logged-user');
        expect(await loggedUser.getText()).to.contain('Bonjour Demo');

        const productsPage = await element('products-page');
        expect(await productsPage.isDisplayed()).to.equal(true);
        await (await element('view-product-1')).click();
        await driver.wait(until.urlContains('product.html?id=1'), 10000);

        const productName = await element('product-name');
        expect(await productName.getText()).to.equal('Laptop Pro 14"');
        expect(await (await element('product-price')).getText()).to.contain('1\u202f299,99');

        await (await element('add-to-cart-1')).click();
        await driver.wait(until.alertIsPresent(), 10000);
        await driver.switchTo().alert().accept();
        await (await element('cart-link')).click();
        await driver.wait(until.urlContains('cart.html'), 10000);

        const quantity = await element('quantity-1');
        expect(await quantity.getText()).to.equal('1');
        await (await element('increase-1')).click();
        await driver.wait(
            async () => (await (await element('quantity-1')).getText()) === '2',
            10000
        );
        expect(await (await element('quantity-1')).getText()).to.equal('2');

        const total = await element('cart-total');
        expect(await total.getText()).to.contain('2\u202f599,98');

        await (await element('remove-item-1')).click();
        const emptyCart = await element('empty-cart');
        expect(await emptyCart.isDisplayed()).to.equal(true);
    });
});
