// apps/client/src/lib/clientId.js
export function getClientId() {
    const key = 'kickstats_client_id';
    let id = localStorage.getItem(key);
    if (!id) {
      id = 'cid_' + Math.random().toString(36).slice(2) + Date.now().toString(36);
      localStorage.setItem(key, id);
    }
    return id;
  }
  