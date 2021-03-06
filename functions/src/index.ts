import * as functions from 'firebase-functions';
import admin from 'firebase-admin';
import { subDays } from 'date-fns';

import { collectionName } from './services/mangarel/constants';
import { FeedMemo } from './services/mangarel/models/feed-memo';
import { findBookItem } from './services/rakuten/api';
import { findOrCreateAuthors } from './firestore-admin/author';
import { findPublisher } from './firestore-admin/publisher';
import { createBook } from './firestore-admin/book';
import { sleep } from './utils/timer';

// // Start writing Firebase Functions
// // https://firebase.google.com/docs/functions/typescript

// Insert /secrets/AppID
const RAKUTEN_APP_ID = 'XXXXXXXXXXX';

admin.initializeApp();

export const registerBooks = functions
  .region('asia-northeast1')
  .runWith({
    timeoutSeconds: 500,
    memory: '1GB',
  })
  .pubsub.schedule('5,10,15 2 1,10,20 * *')
  .timeZone('Asia/Tokyo')
  .onRun(async () => {
    const db = admin.firestore();
    const yesterday = subDays(new Date(), 1);
    const snap = await db
      .collection(collectionName.feedMemos)
      .where('isbn', '==', null)
      .where('fetchedAt', '<', yesterday)
      .limit(200)
      .get();
    let count = 0;

    for await (const doc of snap.docs) {
      const memo = doc.data() as FeedMemo;
      const title = memo.title || '';
      const publisherName = memo.publisher || '';

      const bookItem = await findBookItem(
        { title, publisherName },
        RAKUTEN_APP_ID,
      );

      if (bookItem) {
        const authors = await findOrCreateAuthors(db, bookItem);
        const publisher = await findPublisher(db, 'kodansha');
        const book = await createBook(db, memo, bookItem, authors, publisher);
        await doc.ref.update({
          isbn: book.isbn,
          fetchedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        count += 1;
      } else {
        await doc.ref.update({
          fetchedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
      }
      await sleep(1000);
    }

    console.log(`Registered ${count} books.`);
  });
