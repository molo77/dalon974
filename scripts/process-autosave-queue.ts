/**
 * Script to process colocAutosaveQueue: aggregates recent queue entries per uid
 * and writes a single merged payload into colocProfiles/{uid}.
 *
 * Usage: run periodically (cron) or as a long-running worker.
 * Requires GOOGLE_APPLICATION_CREDENTIALS to be set for admin SDK.
 */
import * as admin from "firebase-admin";

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.applicationDefault(),
  });
}

const db = admin.firestore();

async function processBatch() {
  try {
    // fetch oldest unprocessed items (limit for safe processing)
    const q = db.collection('colocAutosaveQueue').orderBy('createdAt').limit(100);
    const snap = await q.get();
    if (snap.empty) {
      console.log('No autosave items');
      return;
    }

    // group by uid
    const byUid: Record<string, any[]> = {};
    snap.docs.forEach(d => {
      const data = d.data();
      const uid = data.uid;
      if (!uid) return;
      if (!byUid[uid]) byUid[uid] = [];
      byUid[uid].push({ id: d.id, payload: data.payload, createdAt: data.createdAt });
    });

    const processedIds: string[] = [];
    for (const uid of Object.keys(byUid)) {
      const entries = byUid[uid];
      // merge payloads: shallow merge, later entries override earlier
      const merged: any = {};
      entries.forEach(e => {
        Object.assign(merged, e.payload || {});
        processedIds.push(e.id);
      });

      // apply sanitization: remove empty/undefined fields
      Object.keys(merged).forEach(k => {
        const v = merged[k];
        if (v === undefined || v === null || (Array.isArray(v) && v.length === 0) || v === '') delete merged[k];
      });

      // write merged payload to colocProfiles/{uid}
      const ref = db.collection('colocProfiles').doc(uid);
      await ref.set({ ...merged, updatedAt: admin.firestore.FieldValue.serverTimestamp() }, { merge: true });
      console.log('Wrote colocProfiles/', uid);
    }

    // delete processed queue documents
    if (processedIds.length) {
      const batch = db.batch();
      processedIds.forEach(id => batch.delete(db.collection('colocAutosaveQueue').doc(id)));
      await batch.commit();
      console.log('Deleted processed queue items:', processedIds.length);
    }
  } catch (e) {
    console.error('processBatch error', e);
  }
}

// run once (for cron)
if (require.main === module) {
  processBatch().then(() => process.exit(0)).catch(() => process.exit(1));
}

export { processBatch };
