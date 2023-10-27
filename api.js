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

  const textContent = await lastPost.evaluate(el => el.innerText);
  if (textContent.includes(companyName)) {
    return true;
  }

  const allAttributes = await lastPost.evaluate(el => {
    const attributes = Array.from(el.attributes);
    return attributes.map(attr => attr.value);
  });

  for (const attr of allAttributes) {
    if (attr.includes(companyName)) {
      return true;
    }
  }

  return false;
}

app.post('/scrape', async (req, res) => {
  const { secret_key, url, selectorsArray, attributesArray, namesArray, postSelector } = req.body;
  

  if (secret_key !== 'test') {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.goto(url, { timeout: 60000 });

    let results = [];
    let posts = [];
    while (true) {
      await page.evaluate(() => {
        window.scrollBy(0, window.innerHeight);
      });

      try {
        await page.waitForTimeout(3000);
      } catch (error) {
        break;
      }

      let currentHeight = await page.evaluate('document.body.scrollHeight');
      let viewportHeight = await page.evaluate('window.innerHeight');
      let scrollPosition = await page.evaluate('window.scrollY');
      condition = await checkLastPostForCompany(page,postSelector,"Alpine Laser")
    
      if (currentHeight <= viewportHeight + scrollPosition || condition == false) {
        console.log(condition)
        posts = await page.$$(postSelector);
        console.log(`Found ${posts.length} posts.`);
        break;
      }
      
      

    }

    for (const post of posts) {
      const itemData = {};

      for (let i = 0; i < selectorsArray.length; i++) {
        const selector = selectorsArray[i];
        const attribute = attributesArray[i];
        const name = namesArray[i];

        try {
          const elements = await post.$$(selector);
          let values = [];

          for (let element of elements) {
            let value;

            if (attribute === 'innerText') {
              value = await element.evaluate(el => el.innerText);
            } else {
              value = await element.evaluate((el, attr) => el.getAttribute(attr), attribute);
            }

            if (value && value.trim() !== '') {
              values.push(value);
            }
          }

          if (values.length > 0) {
            itemData[name] = values;
          }
        } catch (error) {
          console.error(`Error retrieving data for selector "${selector}": ${error.message}`);
        }
      }

      if (Object.keys(itemData).length > 0 && !results.some(result => JSON.stringify(result) === JSON.stringify(itemData))) {
        results.push(itemData);
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
