export function getHashId(to = '') {
  const index = String(to).indexOf('#')
  return index >= 0 ? decodeURIComponent(String(to).slice(index + 1)) : ''
}

export function scrollToHash(id, behavior = 'smooth') {
  if (!id || id === 'home') {
    const home = document.getElementById('home')
    if (home) {
      home.scrollIntoView({ behavior, block: 'start' })
      return true
    }
    window.scrollTo({ top: 0, behavior })
    return true
  }

  const el = document.getElementById(id)
  if (!el) return false
  el.scrollIntoView({ behavior, block: 'start' })
  return true
}

export function scrollToHashWhenReady(id, { timeout = 2000, signal } = {}) {
  return new Promise((resolve) => {
    const started = performance.now()
    const tick = () => {
      if (signal?.aborted) {
        resolve(false)
        return
      }
      if (scrollToHash(id)) {
        resolve(true)
        return
      }
      if (performance.now() - started > timeout) {
        resolve(false)
        return
      }
      requestAnimationFrame(tick)
    }
    tick()
  })
}
