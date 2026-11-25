// One function per backend endpoint (see the backend README for the full list).
import { api } from './client';

const post = (p, b) => api(p, { method: 'POST', body: b });

export const Auth = {
  register: (b) => post('/api/auth/register', b),
  login: (b) => post('/api/auth/login', b),
  logout: (refreshToken) => post('/api/auth/logout', { refreshToken }),
};
export const Colleges = { list: () => api('/api/colleges') };
export const Users = {
  me: () => api('/api/users/me'),
  update: (b) => api('/api/users/me', { method: 'PUT', body: b }),
  profile: (id) => api('/api/public/users/' + id),
};
export const Verify = {
  sendOtp: () => post('/api/verification/otp'),
  confirm: (code) => post('/api/verification/otp/confirm', { code }),
  submitId: (docUrl) => post('/api/verification/id', { docUrl }),
};
export const Uploads = { signature: (folder) => api('/api/uploads/signature', { query: { folder } }) };
export const Listings = {
  search: (q) => api('/api/listings', { query: q }),
  get: (id) => api('/api/listings/' + id),
  categories: () => api('/api/listings/categories'),
  mine: () => api('/api/my/listings'),
  create: (b) => post('/api/listings', b),
  update: (id, b) => api('/api/listings/' + id, { method: 'PUT', body: b }),
  setStatus: (id, status) => api(`/api/listings/${id}/status`, { method: 'PATCH', body: { status } }),
  remove: (id) => api('/api/listings/' + id, { method: 'DELETE' }),
  report: (id, reason) => post(`/api/listings/${id}/report`, { reason }),
  reviews: (id) => api(`/api/listings/${id}/reviews`),
};
export const Saved = {
  list: () => api('/api/saved'),
  ids: () => api('/api/saved/ids'),
  add: (id) => post('/api/saved/' + id),
  remove: (id) => api('/api/saved/' + id, { method: 'DELETE' }),
};
export const Bookings = {
  create: (b) => post('/api/bookings', b),
  list: (q) => api('/api/bookings', { query: q }),
  get: (id) => api('/api/bookings/' + id),
  accept: (id) => post(`/api/bookings/${id}/accept`),
  decline: (id, reason) => post(`/api/bookings/${id}/decline`, { reason }),
  cancel: (id) => post(`/api/bookings/${id}/cancel`),
  pay: (id) => post(`/api/bookings/${id}/pay`),
  addPhoto: (id, b) => post(`/api/bookings/${id}/photos`, b),
  photos: (id) => api(`/api/bookings/${id}/photos`),
  comparison: (id) => api(`/api/bookings/${id}/comparison`),
  handover: (id) => post(`/api/bookings/${id}/handover`),
  returned: (id) => post(`/api/bookings/${id}/return`),
  release: (id) => post(`/api/bookings/${id}/settlement/release`),
  claim: (id, b) => post(`/api/bookings/${id}/settlement/claim`, b),
  respond: (id, b) => post(`/api/bookings/${id}/settlement/respond`, b),
  review: (id, b) => post(`/api/bookings/${id}/reviews`, b),
};
export const Payments = {
  verify: (b) => post('/api/payments/verify', b),
  transactions: (kind) => api('/api/transactions', { query: { kind } }),
};
export const Chat = {
  history: (id) => api(`/api/bookings/${id}/messages`),
  send: (id, content) => post(`/api/bookings/${id}/messages`, { content }),
};
export const Notifications = {
  list: () => api('/api/notifications'),
  unread: () => api('/api/notifications/unread-count'),
  read: (id) => post(`/api/notifications/${id}/read`),
  readAll: () => post('/api/notifications/read-all'),
};
export const Admin = {
  stats: () => api('/api/admin/stats'),
  users: (q) => api('/api/admin/users', { query: q }),
  verifyUser: (id) => post(`/api/admin/users/${id}/verify`),
  rejectUser: (id, reason) => post(`/api/admin/users/${id}/reject`, { reason }),
  suspend: (id, reason) => post(`/api/admin/users/${id}/suspend`, { reason }),
  unsuspend: (id) => post(`/api/admin/users/${id}/unsuspend`),
  listings: (q) => api('/api/admin/listings', { query: q }),
  moderate: (id, action, reason) => post(`/api/admin/listings/${id}/${action}`, { reason }),
  disputes: () => api('/api/admin/disputes'),
  dispute: (id) => api('/api/admin/disputes/' + id),
  resolve: (id, b) => post(`/api/admin/disputes/${id}/resolve`, b),
  actions: () => api('/api/admin/actions'),
};
