const TOKEN_KEY = 'linfi-admin-token'

export function getAdminToken() {
  return localStorage.getItem(TOKEN_KEY) || ''
}

export function setAdminToken(token) {
  if (token) localStorage.setItem(TOKEN_KEY, token)
  else localStorage.removeItem(TOKEN_KEY)
}

async function request(path, { method = 'GET', body, auth = false } = {}) {
  const headers = { 'Content-Type': 'application/json' }
  if (auth) {
    const token = getAdminToken()
    if (token) headers.Authorization = `Bearer ${token}`
  }

  const response = await fetch(path, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  }).catch(() => {
    const error = new Error('Could not reach the server. Check your connection and try again.')
    error.status = 0
    throw error
  })

  if (response.status === 204) return null

  const text = await response.text()
  let data = {}
  try {
    data = text ? JSON.parse(text) : {}
  } catch {
    data = {}
  }
  if (!response.ok) {
    const error = new Error(data.error || 'Request failed.')
    error.status = response.status
    throw error
  }
  return data
}

export function createBooking(payload) {
  return request('/api/bookings', { method: 'POST', body: payload })
}

export function adminLogin(password) {
  return request('/api/admin/login', { method: 'POST', body: { password } })
}

export function wakeAdminApi() {
  return fetch('/api/health').catch(() => null)
}

export function listAdminJobs() {
  return request('/api/admin/jobs', { auth: true })
}

export function getAdminJob(id) {
  return request(`/api/admin/jobs/${id}`, { auth: true })
}

export function createAdminJob(payload) {
  return request('/api/admin/jobs', { method: 'POST', auth: true, body: payload })
}

export function updateAdminJob(id, payload) {
  return request(`/api/admin/jobs/${id}`, { method: 'PATCH', auth: true, body: payload })
}

export function deleteAdminJob(id) {
  return request(`/api/admin/jobs/${id}`, { method: 'DELETE', auth: true })
}

export function listAdminWorkers() {
  return request('/api/admin/workers', { auth: true })
}

export function createAdminWorker(payload) {
  return request('/api/admin/workers', { method: 'POST', auth: true, body: payload })
}

export function updateAdminWorker(id, payload) {
  return request(`/api/admin/workers/${id}`, { method: 'PATCH', auth: true, body: payload })
}

export function deleteAdminWorker(id) {
  return request(`/api/admin/workers/${id}`, { method: 'DELETE', auth: true })
}
