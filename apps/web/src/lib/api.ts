export type PublicUser = {
  id: string;
  email: string;
  displayName: string;
  username: string;
  role: string;
  status: string;
  emailVerified: boolean;
  oauthProvider?: string | null;
  hasPassword?: boolean;
  createdAt: string;
  updatedAt: string;
};

export type Profile = {
  id: string;
  userId: string;
  headline: string | null;
  bio: string | null;
  location: string | null;
  avatarUrl: string | null;
  remotePreference: string;
  experienceLevel: string;
  languages: string[];
  availability: string;
  visibility: string;
  skills: Array<{
    name: string;
    proficiency: string;
    yearsOfExperience: number;
  }>;
  interests: string[];
  user?: Pick<PublicUser, 'id' | 'displayName' | 'username' | 'email'>;
};

export type Project = {
  id: string;
  ownerId: string;
  name: string;
  shortDescription: string;
  detailedDescription: string;
  category: string;
  stage: string;
  goal: string;
  requiredRoles: string[];
  skills: string[];
  timeCommitment: string;
  status: string;
  createdAt: string;
  owner?: Pick<PublicUser, 'id' | 'displayName' | 'username' | 'email'>;
};

export type Application = {
  id: string;
  projectId: string;
  applicantId: string;
  introduction: string;
  skills: string[];
  availability: string;
  portfolioLinks: string[];
  status: string;
  createdAt: string;
  project?: Project;
  applicant?: PublicUser;
};

export type ProjectMember = {
  id: string;
  projectId: string;
  userId: string;
  role: string;
  createdAt: string;
  user?: PublicUser;
  project?: Project;
};

export type NotificationItem = {
  id: string;
  userId: string;
  type: string;
  title: string;
  body: string;
  link: string | null;
  readAt: string | null;
  createdAt: string;
};

export function oauthStartUrl(provider: 'google' | 'github'): string {
  return `${API_URL}/auth/${provider}`;
}

export type AuthResponse = {
  accessToken: string;
  refreshToken: string;
  expiresIn: string;
  tokenType: 'Bearer';
  user: PublicUser;
};

export type Paginated<T> = {
  data: T[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api/v1';

const API_ORIGIN = API_URL.replace(/\/api\/v1\/?$/, '');

export function mediaUrl(path: string | null | undefined): string | null {
  if (!path) return null;
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  return `${API_ORIGIN}${path.startsWith('/') ? path : `/${path}`}`;
}

export class ApiError extends Error {
  status: number;
  details: unknown;

  constructor(status: number, message: string, details?: unknown) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

type TokenGetter = () => {
  accessToken: string | null;
  refreshToken: string | null;
};
type TokenSetter = (tokens: {
  accessToken: string;
  refreshToken: string;
}) => void;
type TokenClearer = () => void;

let getTokens: TokenGetter = () => ({
  accessToken: null,
  refreshToken: null,
});
let setTokens: TokenSetter = () => undefined;
let clearTokens: TokenClearer = () => undefined;
let refreshPromise: Promise<string | null> | null = null;

export function bindAuthTokenHandlers(handlers: {
  getTokens: TokenGetter;
  setTokens: TokenSetter;
  clearTokens: TokenClearer;
}) {
  getTokens = handlers.getTokens;
  setTokens = handlers.setTokens;
  clearTokens = handlers.clearTokens;
}

async function refreshAccessToken(): Promise<string | null> {
  if (!refreshPromise) {
    refreshPromise = (async () => {
      const { refreshToken } = getTokens();
      if (!refreshToken) {
        clearTokens();
        return null;
      }

      const response = await fetch(`${API_URL}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      });

      if (!response.ok) {
        clearTokens();
        return null;
      }

      const data = (await response.json()) as AuthResponse;
      setTokens({
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
      });
      return data.accessToken;
    })().finally(() => {
      refreshPromise = null;
    });
  }

  return refreshPromise;
}

export async function apiFetch<T>(
  path: string,
  options: RequestInit & {
    token?: string | null;
    skipAuthRefresh?: boolean;
  } = {},
): Promise<T> {
  const { token, headers, skipAuthRefresh, ...rest } = options;
  const activeToken = token ?? getTokens().accessToken;

  const response = await fetch(`${API_URL}${path}`, {
    ...rest,
    headers: {
      'Content-Type': 'application/json',
      ...(activeToken ? { Authorization: `Bearer ${activeToken}` } : {}),
      ...headers,
    },
  });

  if (
    response.status === 401 &&
    !skipAuthRefresh &&
    !path.startsWith('/auth/login') &&
    !path.startsWith('/auth/register') &&
    !path.startsWith('/auth/refresh') &&
    !path.startsWith('/auth/logout')
  ) {
    const nextToken = await refreshAccessToken();
    if (nextToken) {
      return apiFetch<T>(path, {
        ...options,
        token: nextToken,
        skipAuthRefresh: true,
      });
    }
  }

  if (response.status === 204) {
    return undefined as T;
  }

  const data = (await response.json().catch(() => null)) as
    | { message?: string | string[] }
    | null;

  if (!response.ok) {
    const message = Array.isArray(data?.message)
      ? data.message.join(', ')
      : data?.message || 'Request failed';
    throw new ApiError(response.status, message, data);
  }

  return data as T;
}

export async function apiUpload<T>(
  path: string,
  formData: FormData,
  options: {
    token?: string | null;
    method?: 'POST' | 'PUT' | 'PATCH';
    skipAuthRefresh?: boolean;
  } = {},
): Promise<T> {
  const { token, method = 'POST', skipAuthRefresh } = options;
  const activeToken = token ?? getTokens().accessToken;

  const response = await fetch(`${API_URL}${path}`, {
    method,
    headers: {
      ...(activeToken ? { Authorization: `Bearer ${activeToken}` } : {}),
    },
    body: formData,
  });

  if (
    response.status === 401 &&
    !skipAuthRefresh &&
    !path.startsWith('/auth/')
  ) {
    const nextToken = await refreshAccessToken();
    if (nextToken) {
      return apiUpload<T>(path, formData, {
        ...options,
        token: nextToken,
        skipAuthRefresh: true,
      });
    }
  }

  const data = (await response.json().catch(() => null)) as
    | { message?: string | string[] }
    | null;

  if (!response.ok) {
    const message = Array.isArray(data?.message)
      ? data.message.join(', ')
      : data?.message || 'Request failed';
    throw new ApiError(response.status, message, data);
  }

  return data as T;
}
