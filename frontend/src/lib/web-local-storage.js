// Browser-local persistence for the static GitHub Pages build.
// Never makes network requests. The native Capacitor build does not use this module.
const DB = 'opengym-web-local'
const STORE = 'files'
const openDb = () => new Promise((resolve, reject) => {
  const request = indexedDB.open(DB, 1)
  request.onupgradeneeded = () => request.result.createObjectStore(STORE)
  request.onsuccess = () => resolve(request.result)
  request.onerror = () => reject(request.error)
})
async function operation(mode, fn) {
  const db = await openDb()
  try {
    return await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, mode)
      const req = fn(tx.objectStore(STORE))
      req.onsuccess = () => resolve(req.result)
      req.onerror = () => reject(req.error)
      tx.onerror = () => reject(tx.error)
    })
  } finally { db.close() }
}
export const readLocalFile = async key => {
  try { return (await operation('readonly', s => s.get(key))) ?? null }
  catch { return null }
}
export const writeLocalFile = async (key, value) =>
  operation('readwrite', s => s.put(value, key))
