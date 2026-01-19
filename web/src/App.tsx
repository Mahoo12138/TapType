import { createRouter, RouterProvider } from "@tanstack/react-router";

import { routeTree } from "./routeTree.gen";
import { useAuthStore } from './store/auth';
import { useGlobalStore } from './store/global';
import ErrorBoundary from "./components/ErrorBoundary";
import { useEffect } from "react";
import i18n from "@/i18n";
import Loading from './components/Loading';
import type { Status } from './typings/status';
import { useQuery } from '@tanstack/react-query';


export const router = createRouter({
  routeTree,
  context: { token: null, host: null },
});

export function App() {
  const {
    appearance,
    locale,
    isAppInit,
    setIsAppInit,
    setStatus,
    status,
  } = useGlobalStore();

  const { token } = useAuthStore();


  const { data, isLoading, error } = useQuery<Status>({
    queryKey: ["status"], // 唯一的 query key
    queryFn: async () => {
      const response = await fetch("/api/v1/status");
      if (!response.ok) {
        // 如果请求失败，抛出错误
        throw new Error("Failed to fetch status");
      }
      const data = await response.json();
      return data.data as Status;
    },
    staleTime: Infinity, // 数据永不过期
    refetchOnWindowFocus: false, // 窗口聚焦时不重新请求
    retry: 0, // 请求失败不重试
  });

  useEffect(() => {
    console.log('data', data);
    if (isLoading) {
      setIsAppInit(true);
    } else if (error) {
      console.error("Error fetching status:", error);
      setStatus(null); // 请求失败时设置状态数据为 null
      setIsAppInit(false); // 请求失败也结束加载状态
    } else if (data) {
      setStatus(data); // 请求成功时设置状态数据
      setIsAppInit(false); // 请求成功结束加载状态
    }
  }, [data, isLoading, error]);


  useEffect(() => {
    if (locale) {
      i18n.changeLanguage(locale);
    }
  }, [locale]);

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove("light", "dark");

    if (appearance === "system") {
      const systemTheme = window.matchMedia("(prefers-color-scheme: dark)")
        .matches
        ? "dark"
        : "light";
      root.classList.add(systemTheme);
      return;
    }

    root.classList.add(appearance);
  }, [appearance]);


  if (isAppInit) {
    return <Loading />;
  }

  return (
    <ErrorBoundary>
      <RouterProvider
        router={router}
        context={{ token, host: status?.host }}
      />
    </ErrorBoundary>
  );
}

export default App;