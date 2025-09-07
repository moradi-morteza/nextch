import { openDB } from 'idb';

const DB_NAME = 'MediaStorage';
const DB_VERSION = 1;
const STORE_NAME = 'media';

let dbPromise;

function getDB() {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const store = db.createObjectStore(STORE_NAME, {
            keyPath: 'id',
            autoIncrement: false,
          });
          store.createIndex('timestamp', 'timestamp');
          store.createIndex('type', 'type');
        }
      },
    });
  }
  return dbPromise;
}

export async function saveMedia(id, blob, metadata = {}) {
  try {
    const db = await getDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    
    const data = {
      id,
      blob,
      timestamp: Date.now(),
      ...metadata
    };
    
    await store.put(data);
    await tx.done;
    
    return id;
  } catch (error) {
    console.error('Error saving media to IndexedDB:', error);
    throw error;
  }
}

export async function getMedia(id) {
  try {
    const db = await getDB();
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    
    const data = await store.get(id);
    if (!data) {
      throw new Error(`Media with id ${id} not found`);
    }
    
    return data;
  } catch (error) {
    console.error('Error getting media from IndexedDB:', error);
    throw error;
  }
}

export async function getMediaUrl(id) {
  try {
    const data = await getMedia(id);
    return URL.createObjectURL(data.blob);
  } catch (error) {
    console.error('Error creating URL for media:', error);
    throw error;
  }
}

export async function deleteMedia(id) {
  try {
    const db = await getDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    
    await store.delete(id);
    await tx.done;
  } catch (error) {
    console.error('Error deleting media from IndexedDB:', error);
    throw error;
  }
}

export async function getAllMedia() {
  try {
    const db = await getDB();
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    
    return await store.getAll();
  } catch (error) {
    console.error('Error getting all media from IndexedDB:', error);
    throw error;
  }
}

export async function clearOldMedia(maxAgeMs = 7 * 24 * 60 * 60 * 1000) { // 7 days default
  try {
    const db = await getDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const index = store.index('timestamp');
    
    const cutoffTime = Date.now() - maxAgeMs;
    const range = IDBKeyRange.upperBound(cutoffTime);
    
    let cursor = await index.openCursor(range);
    const toDelete = [];
    
    while (cursor) {
      toDelete.push(cursor.value.id);
      cursor = await cursor.continue();
    }
    
    for (const id of toDelete) {
      await store.delete(id);
    }
    
    await tx.done;
    return toDelete.length;
  } catch (error) {
    console.error('Error clearing old media from IndexedDB:', error);
    throw error;
  }
}