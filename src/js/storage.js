import { clone } from './model.js';
export class ProjectStore {
  constructor() {
    this.db = null;
    this.seq = new Map();
    this.channel = typeof BroadcastChannel !== 'undefined' ? new BroadcastChannel('interfacebench-projects') : null;
  }
  async open() {
    if (!globalThis.indexedDB) throw Error('Local storage is unavailable. Keep JSON backups.');
    this.db = await new Promise((resolve, reject) => {
      const r = indexedDB.open('interfacebench', 2);
      r.onupgradeneeded = () => {
        for (const s of ['projects', 'recovery', 'settings', 'library', 'history']) if (!r.result.objectStoreNames.contains(s)) r.result.createObjectStore(s, {
          keyPath: 'id'
        });
      };
      r.onsuccess = () => resolve(r.result);
      r.onerror = () => reject(r.error);
      r.onblocked = () => reject(Error('Close other INTERFACEBENCH tabs to upgrade local storage.'));
    });
    this.db.onversionchange = () => this.db.close();
    return this;
  }
  read(store, id) {
    return new Promise((resolve, reject) => {
      const r = this.db.transaction(store).objectStore(store).get(id);
      r.onsuccess = () => resolve(r.result);
      r.onerror = () => reject(r.error);
    });
  }
  all(store) {
    return new Promise((resolve, reject) => {
      const r = this.db.transaction(store).objectStore(store).getAll();
      r.onsuccess = () => resolve(r.result);
      r.onerror = () => reject(r.error);
    });
  }
  put(store, value) {
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction(store, 'readwrite');
      tx.objectStore(store).put(value);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(tx.error || Error('Storage transaction interrupted.'));
    });
  }
  async load(id) {
    const r = await this.read('projects', id);
    if (r) this.seq.set(id, r.seq);
    return r?.project;
  }
  save(project) {
    const copy = clone(project);
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction(['projects', 'recovery'], 'readwrite');
      const ps = tx.objectStore('projects'),
        rs = tx.objectStore('recovery');
      const r = ps.get(project.id);
      let error, seq;
      r.onsuccess = () => {
        const old = r.result,
          expected = this.seq.get(project.id) || 0;
        if (old && old.seq !== expected) {
          error = Error('Another tab saved this project. Reopen the latest copy or save your work as a new project.');
          error.code = 'CONFLICT';
          tx.abort();
          return;
        }
        seq = (old?.seq || 0) + 1;
        if (old) rs.put({
          id: project.id + '-' + (seq - 1) % 10,
          project: old.project,
          date: new Date().toISOString(),
          seq: old.seq
        });
        ps.put({
          id: project.id,
          seq,
          project: copy,
          date: new Date().toISOString()
        });
      };
      tx.oncomplete = () => {
        this.seq.set(project.id, seq);
        this.channel?.postMessage({
          id: project.id,
          seq
        });
        resolve(seq);
      };
      tx.onerror = () => reject(error || tx.error);
      tx.onabort = () => reject(error || tx.error || Error('Save interrupted; previous save is preserved.'));
    });
  }
}
