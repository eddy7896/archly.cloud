/**
 * API Client for frontend calls to backend
 * Handles requests, errors, authentication
 */

interface RequestOptions extends RequestInit {
  params?: Record<string, string | number | boolean>;
}

async function apiCall(
  endpoint: string,
  options: RequestOptions = {}
): Promise<any> {
  const { params, ...fetchOptions } = options;

  // Build URL with query params
  const url = new URL(
    endpoint,
    process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002/api'
  );

  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== null && value !== undefined) {
        url.searchParams.append(key, String(value));
      }
    });
  }

  // Default headers
  const headers = {
    'Content-Type': 'application/json',
    ...fetchOptions.headers,
  };

  try {
    const response = await fetch(url.toString(), {
      ...fetchOptions,
      headers,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({
        message: response.statusText,
      }));
      throw new Error(error.message || `API error: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error(`API call failed: ${endpoint}`, error);
    throw error;
  }
}

// Projects API
export const projectsApi = {
  list: (teamId: string) =>
    apiCall('/projects', {
      params: { teamId },
      method: 'GET',
    }),

  get: (id: string) =>
    apiCall(`/projects/${id}`, {
      method: 'GET',
    }),

  create: (data: {
    teamId: string;
    name: string;
    description?: string;
  }) =>
    apiCall('/projects', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  update: (id: string, data: { name?: string; description?: string }) =>
    apiCall(`/projects/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  delete: (id: string) =>
    apiCall(`/projects/${id}`, {
      method: 'DELETE',
    }),

  clone: (sourceId: string, teamId: string) =>
    apiCall('/projects/clone', {
      method: 'POST',
      body: JSON.stringify({ sourceId, teamId }),
    }),

  publish: (id: string, data: { title: string; description?: string }) =>
    apiCall(`/projects/${id}/publish`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  unpublish: (id: string) =>
    apiCall(`/projects/${id}/publish`, {
      method: 'DELETE',
    }),

  getUploadUrl: (id: string, filename: string) =>
    apiCall(`/projects/${id}/upload-url`, {
      params: { filename },
      method: 'GET',
    }),

  getDocumentState: (id: string) =>
    apiCall(`/projects/${id}/state`, {
      method: 'GET',
    }),

  saveDocumentState: (id: string, state: ArrayBuffer) =>
    apiCall(`/projects/${id}/state`, {
      method: 'POST',
      body: state,
      headers: { 'Content-Type': 'application/octet-stream' },
    }),
};

// Teams API
export const teamsApi = {
  list: (organizationId: string) =>
    apiCall('/teams', {
      params: { organizationId },
      method: 'GET',
    }),

  get: (id: string) =>
    apiCall(`/teams/${id}`, {
      method: 'GET',
    }),

  create: (data: { organizationId: string; name: string }) =>
    apiCall('/teams', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  update: (id: string, data: { name: string }) =>
    apiCall(`/teams/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  delete: (id: string) =>
    apiCall(`/teams/${id}`, {
      method: 'DELETE',
    }),

  getMembers: (id: string) =>
    apiCall(`/teams/${id}/members`, {
      method: 'GET',
    }),

  inviteMember: (
    id: string,
    data: { email: string; role: 'owner' | 'editor' | 'viewer' }
  ) =>
    apiCall(`/teams/${id}/members/invite`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
};

// Organizations API
export const organizationsApi = {
  get: (id: string) =>
    apiCall(`/organizations/${id}`, {
      method: 'GET',
    }),

  create: (data: { name: string }) =>
    apiCall('/organizations', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  update: (id: string, data: { name?: string; billingPlan?: string }) =>
    apiCall(`/organizations/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
};

// Marketplace API
export const marketplaceApi = {
  search: (query: string, category?: string) =>
    apiCall('/marketplace/search', {
      params: { query, category: category || '' },
      method: 'GET',
    }),

  getFeatured: () =>
    apiCall('/marketplace/featured', {
      method: 'GET',
    }),

  getProject: (id: string) =>
    apiCall(`/marketplace/${id}`, {
      method: 'GET',
    }),

  getCreator: (userId: string) =>
    apiCall(`/marketplace/creators/${userId}`, {
      method: 'GET',
    }),
};

// User API
export const userApi = {
  getMe: () =>
    apiCall('/users/me', {
      method: 'GET',
    }),

  update: (data: { name?: string; avatarUrl?: string }) =>
    apiCall('/users/me', {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
};

// Asset API
export const assetsApi = {
  generateUploadUrl: (filename: string, contentType: string) =>
    apiCall('/assets/upload-url', {
      params: { filename, contentType },
      method: 'GET',
    }),

  deleteAsset: (assetId: string) =>
    apiCall(`/assets/${assetId}`, {
      method: 'DELETE',
    }),
};

export { apiCall };
