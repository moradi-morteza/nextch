// IndexedDB utility for storing draft conversations and messages
class ChatStorage {
  constructor() {
    this.dbName = 'NextChatDB';
    this.version = 1;
    this.db = null;
  }

  async init() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve(this.db);
      };

      request.onupgradeneeded = (event) => {
        const db = event.target.result;

        // Create conversations store
        if (!db.objectStoreNames.contains('conversations')) {
          const conversationStore = db.createObjectStore('conversations', { keyPath: 'id' });
          conversationStore.createIndex('recipient_id', 'recipient_id', { unique: false });
          conversationStore.createIndex('status', 'status', { unique: false });
          conversationStore.createIndex('created_at', 'created_at', { unique: false });
        }

        // Create messages store
        if (!db.objectStoreNames.contains('messages')) {
          const messageStore = db.createObjectStore('messages', { keyPath: 'id', autoIncrement: true });
          messageStore.createIndex('conversation_id', 'conversation_id', { unique: false });
          messageStore.createIndex('created_at', 'created_at', { unique: false });
        }
      };
    });
  }

  async ensureDB() {
    if (!this.db) {
      await this.init();
    }
    return this.db;
  }

  // Conversation methods
  async saveConversation(conversation) {
    const db = await this.ensureDB();
    const transaction = db.transaction(['conversations'], 'readwrite');
    const store = transaction.objectStore('conversations');
    
    return new Promise((resolve, reject) => {
      const request = store.put(conversation);
      request.onsuccess = () => resolve(conversation);
      request.onerror = () => reject(request.error);
    });
  }

  async getConversation(conversationId) {
    const db = await this.ensureDB();
    const transaction = db.transaction(['conversations'], 'readonly');
    const store = transaction.objectStore('conversations');
    
    return new Promise((resolve, reject) => {
      const request = store.get(conversationId);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async getConversationByRecipient(recipientId) {
    const db = await this.ensureDB();
    const transaction = db.transaction(['conversations'], 'readonly');
    const store = transaction.objectStore('conversations');
    const index = store.index('recipient_id');
    
    return new Promise((resolve, reject) => {
      const request = index.get(recipientId);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async deleteConversation(conversationId) {
    const db = await this.ensureDB();
    const transaction = db.transaction(['conversations', 'messages'], 'readwrite');
    
    // Delete conversation
    const conversationStore = transaction.objectStore('conversations');
    conversationStore.delete(conversationId);
    
    // Delete all messages in this conversation
    const messageStore = transaction.objectStore('messages');
    const messageIndex = messageStore.index('conversation_id');
    const messageRequest = messageIndex.openCursor(conversationId);
    
    return new Promise((resolve, reject) => {
      messageRequest.onsuccess = (event) => {
        const cursor = event.target.result;
        if (cursor) {
          cursor.delete();
          cursor.continue();
        } else {
          resolve();
        }
      };
      messageRequest.onerror = () => reject(messageRequest.error);
    });
  }

  // Message methods
  async saveMessage(message) {
    const db = await this.ensureDB();
    const transaction = db.transaction(['messages'], 'readwrite');
    const store = transaction.objectStore('messages');
    
    return new Promise((resolve, reject) => {
      const request = store.put(message);
      request.onsuccess = () => resolve({ ...message, id: request.result });
      request.onerror = () => reject(request.error);
    });
  }

  async getMessages(conversationId) {
    const db = await this.ensureDB();
    const transaction = db.transaction(['messages'], 'readonly');
    const store = transaction.objectStore('messages');
    const index = store.index('conversation_id');
    
    return new Promise((resolve, reject) => {
      const request = index.getAll(conversationId);
      request.onsuccess = () => {
        const messages = request.result.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
        resolve(messages);
      };
      request.onerror = () => reject(request.error);
    });
  }

  async deleteMessage(messageId) {
    const db = await this.ensureDB();
    const transaction = db.transaction(['messages'], 'readwrite');
    const store = transaction.objectStore('messages');
    
    return new Promise((resolve, reject) => {
      const request = store.delete(messageId);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // Utility methods
  generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c == 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  createDraftConversation(currentUserId, recipientId, recipientData) {
    return {
      id: this.generateUUID(),
      starter_id: currentUserId,
      recipient_id: recipientId,
      recipient_data: recipientData,
      status: 'draft',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
  }

  createMessage(conversationId, senderId, text, type = 'text') {
    return {
      conversation_id: conversationId,
      sender_id: senderId,
      type: type,
      body: text,
      status: 'draft',
      created_at: new Date().toISOString()
    };
  }
}

// Export singleton instance
const chatStorage = new ChatStorage();
export default chatStorage;