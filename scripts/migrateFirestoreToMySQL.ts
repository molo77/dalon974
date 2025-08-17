
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import prisma from '../lib/prismaClient';

// Charger .env local si présent
dotenv.config();

const serviceAccountPath = process.env.FIREBASE_ADMIN_CREDENTIALS || './serviceAccountKey.json';
if (!fs.existsSync(serviceAccountPath)) {
  console.error('FIREBASE_ADMIN_CREDENTIALS not found. Place your service account JSON or set the env var.');
  process.exit(1);
}

// Read the service account JSON and parse it (avoid require in ESM)
const serviceAccountRaw = fs.readFileSync(path.resolve(serviceAccountPath), 'utf8');
let serviceAccountJson: any;
try {
  serviceAccountJson = JSON.parse(serviceAccountRaw);
} catch (e) {
  console.error('Failed to parse service account JSON:', e);
  process.exit(1);
}

initializeApp({ credential: cert(serviceAccountJson) });
const db = getFirestore();



function tsToDate(ts: any) {
  if (!ts) return null;
  if (ts instanceof Timestamp) return ts.toDate();
  if (ts._seconds) return new Date(ts._seconds * 1000);
  return new Date(ts);
}

async function migrateColocProfiles(dry = true) {
  const snap = await db.collection('colocProfiles').get();
  console.log('Found colocProfiles:', snap.size);
  let count = 0;
  for (const doc of snap.docs) {
    const data = doc.data();
    const id = doc.id;
    const createdAt = tsToDate(data.createdAt);
    const updatedAt = tsToDate(data.updatedAt);
    const photos = Array.isArray(data.photos) ? data.photos : [];
    console.log(`-> Migrating colocProfiles/${id}`);
    if (!dry) {
      await prisma.colocProfile.create({
        data: {
          id: id,
          userId: data.userId || null,
          title: data.title || null,
          description: data.description || null,
          imageUrl: data.imageUrl || null,
          photos: photos,
          mainPhotoIdx: data.mainPhotoIdx ?? null,
          createdAt: createdAt ?? undefined,
          updatedAt: updatedAt ?? undefined,
        }
      });
    }
    // migrate images subcollection
    const imgsSnap = await db.collection('colocProfiles').doc(id).collection('images').get();
    for (const imgDoc of imgsSnap.docs) {
      const img = imgDoc.data();
      console.log(`   - image ${imgDoc.id} -> ${img.url}`);
      if (!dry) {
        await prisma.colocImage.create({
          data: {
            url: img.url || '',
            filename: img.filename || null,
            createdAt: tsToDate(img.createdAt) ?? undefined,
            uploadedBy: img.uploadedBy || null,
            isMain: !!img.isMain,
            size: img.size || null,
            type: img.type || null,
            storagePath: img.storagePath || null,
            colocProfileId: id,
          }
        });
      }
    }
    count++;
  }
  console.log('migrated colocProfiles:', count);
}

async function migrateAnnonces(dry = true) {
  const snap = await db.collection('annonces').get();
  console.log('Found annonces:', snap.size);
  for (const doc of snap.docs) {
    const data = doc.data();
    const id = doc.id;
    console.log(`-> Migrating annonce/${id}`);
    if (!dry) {
      await prisma.annonce.create({
        data: {
          id: id,
          userId: data.userId || null,
          title: data.title || null,
          description: data.description || null,
          imageUrl: data.imageUrl || null,
          photos: Array.isArray(data.photos) ? data.photos : [],
          createdAt: tsToDate(data.createdAt) ?? undefined,
          updatedAt: tsToDate(data.updatedAt) ?? undefined,
        }
      });
    }

    const imgsSnap = await db.collection('annonces').doc(id).collection('images').get();
    for (const imgDoc of imgsSnap.docs) {
      const img = imgDoc.data();
      console.log(`   - image ${imgDoc.id} -> ${img.url}`);
      if (!dry) {
        await prisma.annonceImage.create({
          data: {
            url: img.url || '',
            filename: img.filename || null,
            createdAt: tsToDate(img.createdAt) ?? undefined,
            uploadedBy: img.uploadedBy || null,
            isMain: !!img.isMain,
            size: img.size || null,
            type: img.type || null,
            storagePath: img.storagePath || null,
            annonceId: id,
          }
        });
      }
    }
  }
}

async function migrateAutosaveQueue(dry = true) {
  const snap = await db.collection('colocAutosaveQueue').get();
  console.log('Found colocAutosaveQueue:', snap.size);
  for (const doc of snap.docs) {
    const data = doc.data();
    console.log(' -> enqueue', doc.id, data.uid);
    if (!dry) {
      await prisma.colocAutosaveQueue.create({
        data: {
          uid: data.uid,
          payload: data.payload || {},
          createdAt: tsToDate(data.createdAt) ?? new Date(),
        }
      });
    }
  }
}

async function main() {
  const dry = process.argv.includes('--apply') ? false : true;
  console.log('Dry run:', dry);
  await migrateColocProfiles(dry);
  await migrateAnnonces(dry);
  await migrateAutosaveQueue(dry);
  console.log('Done');
  }

  main().catch(err => { console.error(err); process.exit(1); });
