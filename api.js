const express = require('express');
const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());
const app = express();
const port = 3001;

app.use(express.json());

async function checkLastPostForCompany(page, postSelector, companyName) {
  const posts = await page.$$(postSelector);
  const lastPost = posts[posts.length - 1];
  const [textContent, allAttributes] = await lastPost.evaluate(el => {
    const attributes = Array.from(el.attributes).map(attr => attr.value);
    return [el.innerText, attributes];
  });

  return textContent.includes(companyName) || allAttributes.some(attr => attr.includes(companyName));
}

app.post('/scrape', async (req, res) => {
  const { secret_key, url, selectorsArray, attributesArray, namesArray, postSelector } = req.body;
  
  if (secret_key !== 'hVT2aJmjT-lNHwQh12spPNR7Kz0umU9ZDaf95MFPC8g') {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.goto(url, { timeout: 60000 });

    let results = [];
    let posts = [];
    let uniqueResults = new Set();

    while (true) {
      await page.evaluate(() => window.scrollBy(0, window.innerHeight));
      await page.waitForTimeout(3000);

      const { currentHeight, viewportHeight, scrollPosition } = await page.evaluate(() => ({
        currentHeight: document.body.scrollHeight,
        viewportHeight: window.innerHeight,
        scrollPosition: window.scrollY
      }));

      const condition = await checkLastPostForCompany(page, postSelector, "Alpine Laser");

      if (currentHeight <= viewportHeight + scrollPosition || !condition) {
        posts = await page.$$(postSelector);
        break;
      }
    }

    for (const post of posts) {
      const itemData = await post.evaluate((selectors, attributes, names) => {
        const item = {};
        for (let i = 0; i < selectors.length; i++) {
          const elements = Array.from(document.querySelectorAll(selectors[i]));
          const values = elements.map(el => attributes[i] === 'innerText' ? el.innerText : el.getAttribute(attributes[i])).filter(value => value && value.trim() !== '');
          if (values.length > 0) {
            item[names[i]] = values;
          }
        }
        return item;
      }, selectorsArray, attributesArray, namesArray);

      const itemString = JSON.stringify(itemData);
      if (Object.keys(itemData).length > 0 && !uniqueResults.has(itemString)) {
        results.push(itemData);
        uniqueResults.add(itemString);
      }
    }

    await browser.close();
    res.json({ results });
    
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.listen(port, () => {
  console.log(`Server is listening on port ${port}`);
});
