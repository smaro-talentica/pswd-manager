export async function unregisterDevServiceWorkers() {
  if (!import.meta.env.DEV || !('serviceWorker' in navigator)) {
    return false
  }
  const registrations = await navigator.serviceWorker.getRegistrations()
  if (registrations.length === 0) {
    return false
  }
  await Promise.all(registrations.map((registration) => registration.unregister()))
  return true
}
