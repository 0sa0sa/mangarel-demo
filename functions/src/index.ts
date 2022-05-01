import * as functions from 'firebase-functions';
import admin from 'firebase-admin';
import puppeteer from 'puppeteer';

// import { collectionName } from './services/mangarel/constants';
import { feedCalendar } from './crawlers/kodansha-calendar';
import { saveFeedMemo } from './firestore-admin/feed-memo';

// // Start writing Firebase Functions
// // https://firebase.google.com/docs/functions/typescript
//

const PUPPETEER_OPTIONS = {
  args: [
    '--disable-gpu',
    '--disable-dev-shm-usage',
    '--disable-setuid-sandbox',
    '--no-first-run',
    '--no-sandbox',
    '--no-zygote',
    '--single-process',
  ],
  headless: true,
};

admin.initializeApp();

export const fetchCalendar = functions
  .region('asia-northeast1')
  .runWith({
    timeoutSeconds: 300,
    memory: '2GB',
  })
  .pubsub.schedule('0 2 1,10,20 * *')
  .timeZone('Asia/Tokyo')
  .onRun(async () => {
    const browser = await puppeteer.launch(PUPPETEER_OPTIONS);
    const page = await browser.newPage();
    const db = admin.firestore();

    const memos = await feedCalendar(page);
    const fetchCount = await saveFeedMemo(db, memos, 'kodansha');

    await browser.close();

    console.log(`Fetched Kodansha calendar. Wrote ${fetchCount} memos.`);
  });
