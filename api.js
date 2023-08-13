const express = require('express');
const puppeteer = require('puppeteer');

const app = express();

app.get('/', async (req, res) => {
    try {
        const browser = await puppeteer.launch();
        const page = await browser.newPage();
        await page.goto('https://www.linkedin.com/posts/alpine-laser_just-completed-the-installation-of-two-femtosecond-activity-7084633761740423169-tC06');

        const selectors = {
            "image_selector": '#main-content > section.core-rail.mx-auto.papabear\\:w-core-rail-width.mamabear\\:max-w-\\[790px\\].babybear\\:max-w-\\[790px\\] > div > section.mb-3 > article > ul > li > img',
            "post_selector": '#main-content > section.core-rail.mx-auto.papabear\\:w-core-rail-width.mamabear\\:max-w-\\[790px\\].babybear\\:max-w-\\[790px\\] > div > section.mb-3 > article > div.attributed-text-segment-list__container.relative.mt-1.mb-1\\.5.babybear\\:mt-0.babybear\\:mb-0\\.5 > p',
            "number_of_comments_selector": "#main-content > section.core-rail.mx-auto.papabear\\:w-core-rail-width.mamabear\\:max-w-\\[790px\\].babybear\\:max-w-\\[790px\\] > div > section.mb-3 > article > div.flex.items-center.font-sans.text-sm.babybear\\:text-xs.main-feed-activity-card__social-actions > a.flex.items-center.font-normal.text-color-text-low-emphasis.no-underline.visited\\:text-color-text-low-emphasis.before\\:middot.my-1",
            "number_of_reactions": "#main-content > section.core-rail.mx-auto.papabear\\:w-core-rail-width.mamabear\\:max-w-\\[790px\\].babybear\\:max-w-\\[790px\\] > div > section.mb-3 > article > div.flex.items-center.font-sans.text-sm.babybear\\:text-xs.main-feed-activity-card__social-actions > a:nth-child(1) > span"
        };

        const results = {};

        for (const name in selectors) {
            const elements = await page.$$eval(selectors[name], nodes => nodes.map(n => n.innerText));
            results[name] = elements;
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
