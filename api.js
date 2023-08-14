const express = require('express');
const puppeteer = require('puppeteer');

const app = express();

app.post('/', express.json(), async (req, res) => {
    const { url, secretKey } = req.body;
    const correctSecretKey = 'PzoiJcU2ocfOeWj6AQQdkQ';

    if (secretKey !== correctSecretKey) {
        return res.status(403).json({ error: 'Invalid secret key.' });
    }

    try {
        const browser = await puppeteer.launch();
        const page = await browser.newPage();
        await page.goto(url);
        // Scroll down the page
        await page.evaluate(() => window.scrollBy(0, window.innerHeight));
        // Sleep for one second
        await page.waitForTimeout(1000);

        const selectors = {
            "image_selector": '#main-content > section.core-rail.mx-auto.papabear\\:w-core-rail-width.mamabear\\:max-w-\\[790px\\].babybear\\:max-w-\\[790px\\] > div > section.mb-3 > article > ul > li > img',
            "post_selector": '#main-content > section.core-rail.mx-auto.papabear\\:w-core-rail-width.mamabear\\:max-w-\\[790px\\].babybear\\:max-w-\\[790px\\] > div > section.mb-3 > article > div.attributed-text-segment-list__container.relative.mt-1.mb-1\\.5.babybear\\:mt-0.babybear\\:mb-0\\.5 > p',
            "number_of_comments_selector": "#main-content > section.core-rail.mx-auto.papabear\\:w-core-rail-width.mamabear\\:max-w-\\[790px\\].babybear\\:max-w-\\[790px\\] > div > section.mb-3 > article > div.flex.items-center.font-sans.text-sm.babybear\\:text-xs.main-feed-activity-card__social-actions > a.flex.items-center.font-normal.text-color-text-low-emphasis.no-underline.visited\\:text-color-text-low-emphasis.before\\:middot.my-1",
            "number_of_reactions": "#main-content > section.core-rail.mx-auto.papabear\\:w-core-rail-width.mamabear\\:max-w-\\[790px\\].babybear\\:max-w-\\[790px\\] > div > section.mb-3 > article > div.flex.items-center.font-sans.text-sm.babybear\\:text-xs.main-feed-activity-card__social-actions > a:nth-child(1) > span",
            "new_selector_1": "#ember262 > div.relative > div.ph5 > div.org-top-card__primary-content.org-top-card-primary-content--zero-height-logo.org-top-card__improved-primary-content--ia > div.org-top-card-primary-content__logo-container > img",
            "new_selector_2": "div.scaffold-layout.scaffold-layout--breakpoint-none.scaffold-layout--sidebar-main-aside.scaffold-layout--single-column.scaffold-layout--reflow > div > div > div > div > div > div > div > div.link-without-hover-visited > p > span:nth-child(1) > span",
            "new_selector_3": "div > div.update-components-actor.display-flex.update-components-actor--with-control-menu > a > div.update-components-actor__meta.relative > span.update-components-actor__sub-description.t-black--light.t-12.t-normal > div > span > span:nth-child(1)"
        };

        const results = {};

        for (const name in selectors) {
            if (name === 'image_selector') {
                const elements = await page.$$eval(selectors[name], nodes => nodes.map(n => n.src));
                results[name] = elements;
            } else {
                const elements = await page.$$eval(selectors[name], nodes => nodes.map(n => n.innerText));
                results[name] = elements;
            }
        }

        await browser.close();

        res.json(results);
    } catch (error) {
        res.status(500).json({ error: 'An error occurred.', details: error.message });
    }
});

app.listen(process.env.PORT || 3000, () => {
    console.log('Server is running on port 3000');
});
