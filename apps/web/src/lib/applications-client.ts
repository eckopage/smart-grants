import { apiFetch } from './api-client';
import type { Application, RecommendedCompany } from '../types/application';

export function createApplication(
  grantId: string,
  accessToken: string,
): Promise<Application> {
  return apiFetch<Application>('/applications', {
    method: 'POST',
    accessToken,
    body: JSON.stringify({ grantId }),
  });
}

export function fetchMyApplications(accessToken: string): Promise<Application[]> {
  return apiFetch<Application[]>('/applications/me', { accessToken });
}

export function fetchApplication(id: string, accessToken: string): Promise<Application> {
  return apiFetch<Application>(`/applications/${id}`, { accessToken });
}

export function fetchRecommendedCompanies(slug: string): Promise<RecommendedCompany[]> {
  return apiFetch<RecommendedCompany[]>(`/grants/${slug}/recommended-companies`);
}

export function addTimelineItem(
  applicationId: string,
  accessToken: string,
  input: { title: string; assignedTo: 'user' | 'company'; dueDate?: string },
): Promise<Application> {
  return apiFetch<Application>(`/applications/${applicationId}/timeline`, {
    method: 'POST',
    accessToken,
    body: JSON.stringify(input),
  });
}

export function updateTimelineItemStatus(
  applicationId: string,
  itemId: string,
  status: 'pending' | 'done' | 'overdue',
  accessToken: string,
): Promise<Application> {
  return apiFetch<Application>(`/applications/${applicationId}/timeline/${itemId}`, {
    method: 'PATCH',
    accessToken,
    body: JSON.stringify({ status }),
  });
}

export function addMessage(
  applicationId: string,
  content: string,
  accessToken: string,
): Promise<Application> {
  return apiFetch<Application>(`/applications/${applicationId}/messages`, {
    method: 'POST',
    accessToken,
    body: JSON.stringify({ content }),
  });
}

export function requestDocumentUploadUrl(
  applicationId: string,
  input: { fileName: string; contentType: string; category: string },
  accessToken: string,
): Promise<{ uploadUrl: string; key: string }> {
  return apiFetch(`/applications/${applicationId}/documents/upload-url`, {
    method: 'POST',
    accessToken,
    body: JSON.stringify(input),
  });
}

export function registerDocument(
  applicationId: string,
  input: { fileName: string; key: string; category: string },
  accessToken: string,
): Promise<Application> {
  return apiFetch<Application>(`/applications/${applicationId}/documents`, {
    method: 'POST',
    accessToken,
    body: JSON.stringify(input),
  });
}

export function getDocumentDownloadUrl(
  applicationId: string,
  documentId: string,
  accessToken: string,
): Promise<{ url: string }> {
  return apiFetch(`/applications/${applicationId}/documents/${documentId}/download-url`, {
    accessToken,
  });
}
