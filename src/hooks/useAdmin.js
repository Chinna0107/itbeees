import { useCallback } from 'react';
import useFetch from './useFetch';
import useAsync from './useAsync';
import { adminApi, apiFetch } from '../utils/api';

// ── Courses ────────────────────────────────────────────────────
export const useAdminCourses = () => useFetch(() => apiFetch('/admin/courses'));
export const useAdminCourseById = (id) =>
  useFetch(useCallback(() => apiFetch(`/admin/courses/${id}`), [id]), [id]);
export const useCreateCourse = () => useAsync(adminApi.createCourse);
export const useUpdateCourse = () => useAsync((id, data) => adminApi.updateCourse(id, data));
export const useArchiveCourse = () => useAsync(adminApi.archiveCourse);
export const useDeleteCourse = () => useAsync(adminApi.deleteCourse);

// ── Templates ──────────────────────────────────────────────────
export const useAdminTemplates = () => useFetch(adminApi.getTemplates);
export const useAdminTemplateById = (id) =>
  useFetch(useCallback(() => apiFetch(`/admin/templates/${id}`), [id]), [id]);
export const useCreateTemplate = () => useAsync(adminApi.createTemplate);
export const useUpdateTemplate = () => useAsync((id, data) => adminApi.updateTemplate(id, data));
export const useDeleteTemplate = () => useAsync(adminApi.deleteTemplate);

// ── Jobs ───────────────────────────────────────────────────────
export const useCreateJob = () => useAsync(adminApi.createJob);
export const useUpdateJob = () => useAsync((id, data) => adminApi.updateJob(id, data));
export const useDeleteJob = () => useAsync(adminApi.deleteJob);

// ── Inquiries ──────────────────────────────────────────────────
export const useInquiries = () => useFetch(adminApi.getInquiries);
export const useArchiveInquiry = () => useAsync(adminApi.archiveInquiry);

// ── Applications ───────────────────────────────────────────────
export const useApplications = () => useFetch(adminApi.getApplications);
export const useUpdateApplication = () => useAsync((id, data) => adminApi.updateApplication(id, data));
export const useUpdateApplicationStatus = () => useAsync((id, status) => adminApi.updateApplicationStatus(id, status));
export const useDeleteApplication = () => useAsync(adminApi.deleteApplication);

// ── Purchases & Trainees ───────────────────────────────────────
export const usePurchases = () => useFetch(adminApi.getPurchases);
export const useTrainees = () => useFetch(adminApi.getTrainees);

// ── Certificates ───────────────────────────────────────────────
export const useCertificates = () => useFetch(adminApi.getSentCertificates);
export const useSendCertificate = () => useAsync(adminApi.sendCertificate);

// ── Assessments ────────────────────────────────────────────────
export const useAdminAssessments = () => useFetch(() => apiFetch('/admin/assessments'));
export const useAdminAssessmentById = (id) =>
  useFetch(useCallback(() => apiFetch(`/admin/assessments/${id}`), [id]), [id]);
export const useCreateCategory = () => useAsync(adminApi.createCategory);
export const useCreateAssessment = () => useAsync(adminApi.createAssessment);
export const useUpdateAssessment = () => useAsync((id, data) => apiFetch(`/admin/assessments/${id}`, { method: 'PUT', body: JSON.stringify(data) }));
export const useDeleteAssessment = () => useAsync((id) => apiFetch(`/admin/assessments/${id}`, { method: 'DELETE' }));
export const useAddQuestion = () => useAsync(adminApi.addQuestion);
export const useUpdateQuestion = () => useAsync((aId, qId, data) => apiFetch(`/admin/assessments/${aId}/questions/${qId}`, { method: 'PUT', body: JSON.stringify(data) }));
export const useDeleteQuestion = () => useAsync((aId, qId) => apiFetch(`/admin/assessments/${aId}/questions/${qId}`, { method: 'DELETE' }));
export const useAssessmentAttempts = (id) =>
  useFetch(useCallback(() => adminApi.getAttempts(id), [id]), [id]);

// ── Admin Assignments ──────────────────────────────────────────
export const useAdminAssignments = () => useFetch(adminApi.getAssignments);
export const useCreateAssignment = () => useAsync(adminApi.createAssignment);
export const useDeleteAssignment = () => useAsync(adminApi.deleteAssignment);
export const useAddAssignmentQuestion = () => useAsync((id, data) => adminApi.addAssignmentQuestion(id, data));
export const useDeleteAssignmentQuestion = () => useAsync((id, qid) => adminApi.deleteAssignmentQuestion(id, qid));
export const useAssignmentSubmissions = (id) =>
  useFetch(useCallback(() => adminApi.getAssignmentSubmissions(id), [id]), [id]);

// ── Uploads ────────────────────────────────────────────────────
export const useUploadImage = () => useAsync(adminApi.uploadImage);
export const useUploadTemplate = () => useAsync(adminApi.uploadTemplate);

// ── Audit Logs ─────────────────────────────────────────────────
export const useAuditLogs = (limit) =>
  useFetch(useCallback(() => adminApi.getAuditLogs(limit), [limit]), [limit]);
