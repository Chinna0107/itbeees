import { useCallback } from 'react';
import useFetch from './useFetch';
import useAsync from './useAsync';
import { adminApi } from '../utils/api';

export const useRequestAssignmentOtp = () => useAsync(adminApi.requestAssignmentOtp);

export const useMyAssignments = (email, otp) =>
  useFetch(
    useCallback(() => adminApi.getMyAssignments(email, otp), [email, otp]),
    [email, otp]
  );

export const useAssignmentById = (id, email, otp) =>
  useFetch(
    useCallback(() => adminApi.getAssignmentById(id, email, otp), [id, email, otp]),
    [id, email, otp]
  );

export const useSubmitAssignment = () => useAsync(adminApi.submitAssignment);
