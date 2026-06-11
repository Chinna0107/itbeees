const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const getAuthHeaders = () => {
  const auth = localStorage.getItem('itbees_auth');
  if (auth) {
    const { accessToken } = JSON.parse(auth);
    return { 'Authorization': `Bearer ${accessToken}` };
  }
  return {};
};

// Generic fetch wrapper with automatic token refresh
export const apiFetch = async (endpoint, options = {}) => {
  const isFormData = options.body instanceof FormData;

  const headers = {
    ...getAuthHeaders(),
    ...options.headers,
  };

  if (!isFormData) {
    headers['Content-Type'] = 'application/json';
  }

  let response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });

  // Handle Token Refresh
  if (response.status === 401 && !endpoint.includes('/admin/login')) {
    const auth = localStorage.getItem('itbees_auth');
    if (auth) {
      const { refreshToken } = JSON.parse(auth);
      const refreshRes = await fetch(`${API_URL}/admin/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      });

      if (refreshRes.ok) {
        const { data } = await refreshRes.json();
        const updatedAuth = { ...JSON.parse(auth), accessToken: data.accessToken };
        localStorage.setItem('itbees_auth', JSON.stringify(updatedAuth));

        // Retry the original request
        headers['Authorization'] = `Bearer ${data.accessToken}`;
        response = await fetch(`${API_URL}${endpoint}`, {
          ...options,
          headers,
        });
      } else {
        localStorage.removeItem('itbees_auth');
        window.location.href = '/login';
      }
    }
  }

  if (!response.ok) {
    let parsed;
    try {
      parsed = await response.json();
    } catch (_err) {
      try {
        const txt = await response.text();
        const msg = txt ? `${txt}` : `Request failed with status ${response.status}`;
        const err = new Error(msg);
        err.status = response.status;
        throw err;
      } catch (__err) {
        const err = new Error(`Request failed with status ${response.status}`);
        err.status = response.status;
        throw err;
      }
    }
    const message = parsed && parsed.message ? parsed.message : `Request failed with status ${response.status}`;
    const err = new Error(message);
    err.status = response.status;
    err.body = parsed;
    throw err;
  }
  return response.json();
};

// Public APIs
export const publicApi = {
  getCourses: () => apiFetch('/public/courses'),
  getJobs: () => apiFetch('/public/jobs'),
  getJobById: (id) => apiFetch(`/public/jobs/${id}`),
  getTemplates: () => apiFetch('/public/templates'),
  getTemplateById: (id) => apiFetch(`/public/templates/${id}`),
  getAssessments: () => apiFetch('/public/assessments'),
  getAssessmentDetails: (id) => apiFetch(`/public/assessments/${id}`),
  checkEnrollment: (data) => apiFetch('/public/assessments/check-enrollment', { method: 'POST', body: JSON.stringify(data) }),
  submitInquiry: (data) => apiFetch('/public/inquiries', { method: 'POST', body: JSON.stringify(data) }),
  applyJob: (formData) => apiFetch('/public/jobs/apply', { method: 'POST', body: formData }),
  requestPurchaseOtp: (email) => apiFetch('/public/purchase/otp', { method: 'POST', body: JSON.stringify({ email }) }),
  initiatePurchase: (data) => apiFetch('/public/purchase/initiate', { method: 'POST', body: JSON.stringify(data) }),
  verifyPayment: (data) => apiFetch('/public/purchase/verify', { method: 'POST', body: JSON.stringify(data) }),
  initiateTemplatePurchase: (data) => apiFetch('/public/purchase-template/initiate', { method: 'POST', body: JSON.stringify(data) }),
  verifyTemplatePayment: (data) => apiFetch('/public/purchase-template/verify', { method: 'POST', body: JSON.stringify(data) }),
  submitAssessment: (data) => apiFetch('/public/assessments/submit', { method: 'POST', body: JSON.stringify(data) }),
};

// Admin APIs
export const adminApi = {
  login: (data) => apiFetch('/admin/login', { method: 'POST', body: JSON.stringify(data) }),
  logout: (refreshToken) => apiFetch('/admin/logout', { method: 'POST', body: JSON.stringify({ refreshToken }) }),

  // Password reset flow (3 steps: email â†’ OTP â†’ new password)
  forgotPassword:   (email)         => apiFetch('/admin/forgot-password',  { method: 'POST', body: JSON.stringify({ email }) }),
  verifyResetOtp:  (email, otp)    => apiFetch('/admin/verify-reset-otp', { method: 'POST', body: JSON.stringify({ email, otp }) }),
  resetPassword:    (email, otp, newPassword) => apiFetch('/admin/reset-password', { method: 'POST', body: JSON.stringify({ email, otp, newPassword }) }),

  // Courses
  createCourse: (data) => apiFetch('/admin/courses', { method: 'POST', body: JSON.stringify(data) }),
  updateCourse: (id, data) => apiFetch(`/admin/courses/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  archiveCourse: (id) => apiFetch(`/admin/courses/${id}/archive`, { method: 'PATCH' }),
  deleteCourse: (id) => apiFetch(`/admin/courses/${id}`, { method: 'DELETE' }),

  // Templates
  getTemplates: () => apiFetch('/admin/templates'),
  createTemplate: (data) => apiFetch('/admin/templates', { method: 'POST', body: JSON.stringify(data) }),
  updateTemplate: (id, data) => apiFetch(`/admin/templates/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteTemplate: (id) => apiFetch(`/admin/templates/${id}`, { method: 'DELETE' }),

  // Jobs
  createJob: (data) => apiFetch('/admin/jobs', { method: 'POST', body: JSON.stringify(data) }),
  updateJob: (id, data) => apiFetch(`/admin/jobs/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteJob: (id) => apiFetch(`/admin/jobs/${id}`, { method: 'DELETE' }),

  // Management
  getInquiries: () => apiFetch('/admin/inquiries'),
  archiveInquiry: (id) => apiFetch(`/admin/inquiries/${id}/archive`, { method: 'PATCH' }),
  getApplications: () => apiFetch('/admin/applications'),
  updateApplication: (id, data) => apiFetch(`/admin/applications/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  updateApplicationStatus: (id, status) => apiFetch(`/admin/applications/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),
  deleteApplication: (id) => apiFetch(`/admin/applications/${id}`, { method: 'DELETE' }),
  getPurchases: () => apiFetch('/admin/purchases'),
  downloadInvoice: (purchaseId) => `${API_URL}/admin/purchases/${purchaseId}/invoice`,
  getTrainees: () => apiFetch('/admin/trainees'),
  getSentCertificates: () => apiFetch('/admin/certificates'),
  sendCertificate: (purchaseId) => apiFetch(`/admin/certificates/send/${purchaseId}`, { method: 'POST' }),
  getAuditLogs: (limit = 500) => apiFetch(`/admin/audit-logs?limit=${limit}`),

  uploadImage: (formData) => apiFetch('/admin/upload/image', { method: 'POST', body: formData }),
  uploadTemplate: async (formData) => {
    try {
      return await apiFetch('/admin/upload/template', { method: 'POST', body: formData });
    } catch (err) {
      if (err.status === 404) {
        const file = formData.get('template');
        const fallbackForm = new FormData();
        fallbackForm.append('image', file);
        return await apiFetch('/admin/upload/image', { method: 'POST', body: fallbackForm });
      }
      throw err;
    }
  },

  // Assignments
  getAssignments: () => apiFetch('/admin/assignments'),
  createAssignment: (data) => apiFetch('/admin/assignments', { method: 'POST', body: JSON.stringify(data) }),
  updateAssignment: (id, data) => apiFetch(`/admin/assignments/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteAssignment: (id) => apiFetch(`/admin/assignments/${id}`, { method: 'DELETE' }),
  addAssignmentQuestion: (id, data) => apiFetch(`/admin/assignments/${id}/questions`, { method: 'POST', body: JSON.stringify(data) }),
  deleteAssignmentQuestion: (id, qid) => apiFetch(`/admin/assignments/${id}/questions/${qid}`, { method: 'DELETE' }),
  getAssignmentSubmissions: (id) => apiFetch(`/admin/assignments/${id}/submissions`),

  // Public: assignments
  requestAssignmentOtp: (email) => apiFetch('/public/assignments/otp', { method: 'POST', body: JSON.stringify({ email }) }),
  getMyAssignments: (email, otp) => apiFetch(`/public/assignments?email=${encodeURIComponent(email)}&otp=${encodeURIComponent(otp)}`),
  getAssignmentById: (id, email, otp) => apiFetch(`/public/assignments/${id}?email=${encodeURIComponent(email)}&otp=${encodeURIComponent(otp)}`),
  submitAssignment: (id, data) => apiFetch(`/public/assignments/${id}/submit`, { method: 'POST', body: JSON.stringify(data) }),

  // Assessment Management
  createCategory: (data) => apiFetch('/admin/assessments/categories', { method: 'POST', body: JSON.stringify(data) }),
  createAssessment: (data) => apiFetch('/admin/assessments', { method: 'POST', body: JSON.stringify(data) }),
  addQuestion: (assessmentId, data) => apiFetch(`/admin/assessments/${assessmentId}/questions`, { method: 'POST', body: JSON.stringify(data) }),
  getAttempts: (assessmentId) => apiFetch(`/admin/assessments/${assessmentId}/attempts`),
};
