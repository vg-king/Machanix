async function request(path, options) {
  const response = await fetch(path, {
    ...options,
    credentials: 'include',
  });
  const data = await response.json();
  if (!response.ok) {
    const error = new Error(data.error || 'The request could not be completed.');
    error.status = response.status;
    error.fields = data.fields;
    throw error;
  }
  return data;
}

export function getHealth() {
  return request('/api/health');
}

export function getQuote({ car, serviceName, city }) {
  return request('/api/quote', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ car, serviceName, city }),
  });
}

export function createBooking({ customer, car, city, serviceName }) {
  return request('/api/bookings', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...customer, car, city, serviceName }),
  });
}

export function getSession() {
  return request('/api/auth/me');
}

export function loginUser({ email, password }) {
  return request('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
}

export function signupUser({ name, email, password }) {
  return request('/api/auth/signup', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, email, password }),
  });
}

export function logoutUser() {
  return request('/api/auth/logout', { method: 'POST' });
}

export function getMyBookings() {
  return request('/api/bookings/mine');
}

export function getAdminStats() {
  return request('/api/admin/stats');
}

export function getAdminBookings({ page = 1, limit = 20, status = '', search = '' } = {}) {
  const params = new URLSearchParams({ page: String(page), limit: String(limit) });
  if (status) params.set('status', status);
  if (search) params.set('search', search);
  return request(`/api/admin/bookings?${params}`);
}

export function updateAdminBookingStatus(id, status) {
  return request(`/api/admin/bookings/${encodeURIComponent(id)}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status }),
  });
}
