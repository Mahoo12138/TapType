import type { Dictionary, Word } from "@/typings";
import { type QueryFunction } from "@tanstack/react-query";

export const dictListQueryFn: QueryFunction<Dictionary[], string[]> = async (
  context
): Promise<Dictionary[]> => {
  const [url] = context.queryKey;
  const response = await fetch(url);
  const { data } = await response.json();
  return data as Dictionary[];
};

export const wordListQueryFn: QueryFunction<Word[], string[]> = async (
  context
): Promise<Word[]> => {
  const [url, dictId] = context.queryKey;
  const response = await fetch(`${url}/${dictId}`);
  const { data } = await response.json();
  return data as Word[];
};
