const express = require('express');
const puppeteer = require('puppeteer');
const cors = require('cors');

const app = express();
app.use(cors());

app.use((req, res, next) => {
  res.setHeader(
    "Access-Control-Allow-Origin",
    "*"
  );
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS,CONNECT,TRACE"
  );
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization, X-Content-Type-Options, Accept, X-Requested-With, Origin, Access-Control-Request-Method, Access-Control-Request-Headers"
  );
  res.setHeader("Access-Control-Allow-Credentials", true);
  res.setHeader("Access-Control-Allow-Private-Network", true);
  //  Firefox caps this at 24 hours (86400 seconds). Chromium (starting in v76) caps at 2 hours (7200 seconds). The default value is 5 seconds.
  res.setHeader("Access-Control-Max-Age", 7200);

  next();
});
async function scrollUntilElement(page, selector){
    await page.evaluate(async (selector) => {
        await new Promise((resolve, reject) => {
            var totalHeight = 0;
            var distance = 100;
            var timer = setInterval(() => {
                var scrollHeight = document.body.scrollHeight;
                window.scrollBy(0, distance);
                totalHeight += distance;

                if(document.querySelector(selector) || totalHeight >= scrollHeight){
                    clearInterval(timer);
                    resolve();
                }
            }, 100);
        });
    }, selector);
}
app.post('/', express.json(), async (req, res) => {

    const { url, secretKey } = req.body;

    const correctSecretKey = 'PzoiJcU2ocfOeWj6AQQdkQ';

    if (secretKey !== correctSecretKey) {
        return res.status(403).json({ error: 'Invalid secret key' });
    }

    try {

        const browser = await puppeteer.launch();
        const page = await browser.newPage();
        await page.goto(url, { timeout: 60000 });
        setTimeout(() => {
            console.log("Delayed for 2 second.");
          }, 2000);
      /*  await page.evaluate(() => {
            window.scrollTo(0, document.body.scrollHeight);
          }); */
	 await scrollUntilElement(page, 'ul[data-test-id="feed-images-content"]');

        // Scroll and wait before scraping
        await page.evaluate(() => {
            window.scrollBy(0, window.innerHeight);
        });

        const result = {};

        const idElement = await page.$('link[rel="canonical"]');
        result.url = idElement ? await page.evaluate(el => el.href.split('?').pop(), idElement) : 'Element not found';
        const authorScriptElement = await page.$('script[type="application/ld+json"]');
        const authorScriptContent = authorScriptElement ? await page.evaluate(el => JSON.parse(el.textContent), authorScriptElement) : null;
        result.author = authorScriptContent ? authorScriptContent.author.name : 'Element not found';
        result.username = authorScriptContent ? authorScriptContent.author.url.split('/').pop() : 'Element not found';
        result.age = await page.$eval('time', el => el.textContent.replace(/\s/g, ''));
        result.profilePicture = authorScriptContent ? authorScriptContent.author.image.url : 'Element not found';
        result.copy = await page.$eval('.attributed-text-segment-list__content', el => {
            let text = el.textContent;
            text = text.replace(/\s\s+/g, ' '); // remove line breaks and spaces
            text = text.replace(/<[^>]*>?/gm, ''); // remove HTML tags and their content
            return text;
        });

       /*   result.images = await page.$$eval('.feed-images-content img', imgs => {
            return imgs.map(img => img.src)
        }); */
      

      const images1 = await page.$$eval('ul[data-test-id="feed-images-content"] img', imgs => imgs.map(img => img.src));
      //const images2 = await page.$$eval('.feed-images-content img', imgs => imgs.map(img => img.src));
      result.images = [...new Set(images1)];
      
     

//images2 = arraysAreEqual(images1, images2) ? [] : images2;


        const reactionsElement = await page.$('span[data-test-id="social-actions__reaction-count"]');
        const reactions = reactionsElement ? await page.evaluate(el => parseInt(el.textContent.trim(), 10), reactionsElement) : 'Element not found';
        result.reactions = reactions;

        const commentsElement = await page.$('a[data-test-id="social-actions__comments"]');
        const comments = commentsElement ? await page.evaluate(el => parseInt(el.getAttribute('data-num-comments'), 10), commentsElement) : 'Element not found';
        result.comments = comments;

        await browser.close();

        res.json(result);
    } catch (error) {
        res.status(500).json({ error: 'An error occurred.', details: error.message });
    }
});

//app.listen(3000);

app.listen(process.env.PORT || 3000, () => {
    console.log('Server is running on port 3000');
});
