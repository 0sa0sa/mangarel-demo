import { firestore } from 'firebase-admin';

export type Publisher = {
  id?: string;
  name: string;
  nameReading: string | null;
  website: string | null;

  createdAt: firestore.Timestamp | null;
  updatedAt: firestore.Timestamp | null;
};
