const clientsByUserId = new Map();

function addClient(userId, res) {
  const key = String(userId);
  const set = clientsByUserId.get(key) || new Set();
  set.add(res);
  clientsByUserId.set(key, set);
}

function removeClient(userId, res) {
  const key = String(userId);
  const set = clientsByUserId.get(key);
  if (!set) return;
  set.delete(res);
  if (set.size === 0) clientsByUserId.delete(key);
}

function emit(userId, eventName, data) {
  const key = String(userId);
  const set = clientsByUserId.get(key);
  if (!set) return;

  const payload = `event: ${eventName}\ndata: ${JSON.stringify(data)}\n\n`;
  for (const res of set) {
    try {
      res.write(payload);
    } catch (e) {
      // ignore broken pipe
    }
  }
}

module.exports = { addClient, removeClient, emit };