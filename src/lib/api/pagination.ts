import { NextRequest } from "next/server";

export interface PaginationParams {
  limit: number;
  cursor?: string;
  page?: number;
}

export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;

export function parsePaginationParams(req: NextRequest): PaginationParams {
  const { searchParams } = req.nextUrl;
  
  let limit = parseInt(searchParams.get("limit") || `${DEFAULT_PAGE_SIZE}`, 10);
  if (isNaN(limit) || limit < 1) limit = DEFAULT_PAGE_SIZE;
  if (limit > MAX_PAGE_SIZE) limit = MAX_PAGE_SIZE;

  const cursor = searchParams.get("cursor") || undefined;
  
  let page: number | undefined = undefined;
  const pageParam = searchParams.get("page");
  if (pageParam) {
    const parsedPage = parseInt(pageParam, 10);
    if (!isNaN(parsedPage) && parsedPage > 0) {
      page = parsedPage;
    }
  }

  return { limit, cursor, page };
}

export function buildCursorPaginationMeta<T extends { id: string }>(
  items: T[],
  limit: number
): { data: T[]; nextCursor: string | null } {
  const hasMore = items.length > limit;
  const data = hasMore ? items.slice(0, limit) : items;
  const nextCursor = hasMore ? data[data.length - 1].id : null;

  return { data, nextCursor };
}
