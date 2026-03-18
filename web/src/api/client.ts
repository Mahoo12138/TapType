import {
  QueryCache,
  QueryClient,
  type QueryFunction,
} from "@tanstack/react-query";
import { useAuthStore } from "@/store/auth";
import { refreshToken as callRefreshTokenApi } from "@/api/auth";

// Used to store pending token refresh requests to prevent concurrent refreshes
let isRefreshing = false;
let failedQueue: { resolve: (value: unknown) => void; reject: (reason?: any) => void; }[] = [];

const processQueue = (error: any | null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(true); // Token refreshed, retry original request
    }
  });
  failedQueue = [];
};

const responseHandler = async (response: Response) => {
  let data;
  try {
    data = await response.json();
  } catch {
    data = null;
  }
  // 1. HTTP 层错误
  if (!response.ok) {
    throw new Error((data && data.message) || response.statusText);
  }

  // 2. 业务层错误
  if (data && data.success === false) {
    throw new Error(data.message || '操作失败');
  }
  return data.data;
}

export const fetcher = async (
  url: string,
  options?: RequestInit
): Promise<any> => {
  const { accessToken, tokenExpires, refreshToken } = useAuthStore.getState().token || {};
  const authStore = useAuthStore.getState();

  const headers = new Headers(options?.headers);
  if (accessToken) {
    headers.set("Authorization", `Bearer ${accessToken}`);
  }

  // Check if token is about to expire (e.g., refresh 5 minutes before expiration)
  const isTokenExpired = tokenExpires && Date.now() >= tokenExpires;
  const isRefreshNeeded = isTokenExpired && refreshToken && !isRefreshing;

  if (isRefreshNeeded) {
    if (!isRefreshing) {
      isRefreshing = true;
      authStore.startLoading(); // Set loading state for auth store
      try {
        const refreshRes = await callRefreshTokenApi({ refreshToken });
        authStore.setToken({
          accessToken: refreshRes.accessToken,
          refreshToken: refreshRes.refreshToken,
          tokenExpires: refreshRes.tokenExpires,
        });
        processQueue(null); // Resolve all pending requests
      } catch (refreshError) {
        processQueue(refreshError); // Reject all pending requests
        authStore.logout(); // Refresh failed, logout user
        // You might want to navigate to login page here
        throw refreshError; // Re-throw to propagate the error
      } finally {
        isRefreshing = false;
        authStore.stopLoading(); // Clear loading state
      }
    }

    return new Promise((resolve, reject) => {
      failedQueue.push({ resolve, reject });
    }).then(() => {
      // Retry the original request with the new token
      const newAccessToken = useAuthStore.getState().token?.accessToken;
      if (newAccessToken) {
        headers.set("Authorization", `Bearer ${newAccessToken}`);
      }
      return fetch(url, { ...options, headers }).then((res) => {
        if (!res.ok) {
          throw new Error(res.statusText);
        }
        return res.json();
      });
    });
  }

  const response = await fetch(url, { ...options, headers });

  if (response.status === 401) {
    if (!refreshToken) {
      // 没有 refreshToken，直接登出并跳转
      authStore.logout();
      throw new Error('登录已失效，请重新登录');
    }
    if (!isRefreshing) {
      isRefreshing = true;
      authStore.startLoading(); // Set loading state for auth store
      try {
        const refreshRes = await callRefreshTokenApi({ refreshToken });
        authStore.setToken({
          accessToken: refreshRes.accessToken,
          refreshToken: refreshRes.refreshToken,
          tokenExpires: refreshRes.tokenExpires,
        });
        processQueue(null); // Resolve all pending requests
        // Retry the original request
        const newAccessToken = useAuthStore.getState().token?.accessToken;
        if (newAccessToken) {
          headers.set("Authorization", `Bearer ${newAccessToken}`);
        }
        return fetch(url, { ...options, headers }).then(responseHandler);
      } catch (refreshError) {
        processQueue(refreshError); // Reject all pending requests
        authStore.logout(); // Refresh failed, logout user
        // You might want to navigate to login page here
        throw refreshError; // Re-throw to propagate the error
      } finally {
        isRefreshing = false;
        authStore.stopLoading(); // Clear loading state
      }
    } else {
      return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      }).then(() => {
        // Retry the original request with the new token
        const newAccessToken = useAuthStore.getState().token?.accessToken;
        if (newAccessToken) {
          headers.set("Authorization", `Bearer ${newAccessToken}`);
        }
        return fetch(url, { ...options, headers }).then(responseHandler);
      });
    }
  }

  if (!response.ok) {
    throw new Error(response.statusText);
  }

  const data = await response.json();
  return data.data
};

const defaultQueryFn: QueryFunction = async ({ queryKey }) => {
  const [url, options] = queryKey;
  if (typeof url === "string") {
    return fetcher(url, options as RequestInit);
  }
  throw new Error("Invalid query key format");
};

export const queryClient = new QueryClient({
  queryCache: new QueryCache(),
  defaultOptions: {
    queries: {
      queryFn: defaultQueryFn,
      retry: (failureCount, error) => {
        // Only retry if it's not a 401 and not a refresh token failure
        const isAuthError = (error as any)?.message === "Unauthorized"; // Adjust error message as needed
        return failureCount < 3 && !isAuthError;
      },
    },
    mutations: {
      mutationFn: async (variables: unknown) => {
        const { url, options } = variables as { url: string; options?: RequestInit };
        return fetcher(url, options);
      },
      retry: (failureCount, error) => {
        const isAuthError = (error as any)?.message === "Unauthorized";
        return failureCount < 3 && !isAuthError;
      },
    },
  },
});