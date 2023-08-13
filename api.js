const express = require('express');
const axios = require('axios');
const jsdom = require('jsdom');
const { JSDOM } = jsdom;

const app = express();

app.get('/', async (req, res) => {
    try {
        const response = await axios.get('https://www.linkedin.com/posts/alpine-laser_just-completed-the-installation-of-two-femtosecond-activity-7084633761740423169-tC06', {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/78.0.3904.97 Safari/537.36',
            }
        });

        const dom = new JSDOM(response.data);

        const selectors = {
            "image_selector": '#main-content > section.core-rail.mx-auto.papabear\:w-core-rail-width.mamabear\:max-w-\[790px\].babybear\:max-w-\[790px\] > div > section.mb-3 > article > ul > li > img',
            "post_selector": '#main-content > section.core-rail.mx-auto.papabear\:w-core-rail-width.mamabear\:max-w-\[790px\].babybear\:max-w-\[790px\] > div > section.mb-3 > article > div.attributed-text-segment-list__container.relative.mt-1.mb-1\.5.babybear\:mt-0.babybear\:mb-0\.5 > p',
            "number_of_comments_selector": "#main-content > section.core-rail.mx-auto.papabear\:w-core-rail-width.mamabear\:max-w-\[790px\].babybear\:max-w-\[790px\] > div > section.mb-3 > article > div.flex.items-center.font-sans.text-sm.babybear\:text-xs.main-feed-activity-card__social-actions > a.flex.items-center.font-normal.text-color-text-low-emphasis.no-underline.visited\:text-color-text-low-emphasis.before\:middot.my-1",
            "number_of_reactions": "#main-content > section.core-rail.mx-auto.papabear\:w-core-rail-width.mamabear\:max-w-\[790px\].babybear\:max-w-\[790px\] > div > section.mb-3 > article > div.flex.items-center.font-sans.text-sm.babybear\:text-xs.main-feed-activity-card__social-actions > a:nth-child(1) > span"
        };

        const results = {};

        for (const name in selectors) {
            const elements = dom.window.document.querySelectorAll(selectors[name]);
            results[name] = Array.from(elements).map(item => item.tagName === 'IMG' ? item.src : item.textContent.trim());
        }

        res.json(results);
    } catch (error) {
        res.status(500).json({ error: 'An error occurred.' });
    }
});

app.listen(process.env.PORT || 3000, () => {
    console.log('Server is running on port 3000');
});
