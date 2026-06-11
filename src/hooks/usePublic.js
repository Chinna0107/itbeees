import { useCallback } from 'react';
import useFetch from './useFetch';
import useAsync from './useAsync';
import { publicApi } from '../utils/api';

// ── Courses ────────────────────────────────────────────────────
export const useCourses = () => useFetch(publicApi.getCourses);

// ── Jobs ───────────────────────────────────────────────────────
export const useJobs = () => useFetch(publicApi.getJobs);

export const useJobById = (id) =>
  useFetch(useCallback(() => publicApi.getJobById(id), [id]), [id]);

export const useApplyJob = () => useAsync(publicApi.applyJob);

// ── Templates ──────────────────────────────────────────────────
export const useTemplates = () => useFetch(publicApi.getTemplates);

export const useTemplateById = (id) =>
  useFetch(useCallback(() => publicApi.getTemplateById(id), [id]), [id]);

// ── Assessments ────────────────────────────────────────────────
export const useAssessments = () => useFetch(publicApi.getAssessments);

export const useAssessmentDetails = (id) =>
  useFetch(useCallback(() => publicApi.getAssessmentDetails(id), [id]), [id]);

export const useCheckEnrollment = () => useAsync(publicApi.checkEnrollment);

export const useSubmitAssessment = () => useAsync(publicApi.submitAssessment);

// ── Inquiry ────────────────────────────────────────────────────
export const useSubmitInquiry = () => useAsync(publicApi.submitInquiry);

// ── Purchase (Course) ──────────────────────────────────────────
export const useRequestPurchaseOtp = () => useAsync(publicApi.requestPurchaseOtp);
export const useInitiatePurchase = () => useAsync(publicApi.initiatePurchase);
export const useVerifyPayment = () => useAsync(publicApi.verifyPayment);

// ── Purchase (Template) ────────────────────────────────────────
export const useInitiateTemplatePurchase = () => useAsync(publicApi.initiateTemplatePurchase);
export const useVerifyTemplatePayment = () => useAsync(publicApi.verifyTemplatePayment);
