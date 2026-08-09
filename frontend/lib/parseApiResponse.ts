export async function parseApiResponse<T extends Record<string, unknown> = Record<string, unknown>>(
  res: Response
): Promise<T> {
  const text = await res.text();

  if (!text.trim()) {
    if (!res.ok) {
      throw new Error(`Request failed (${res.status})`);
    }
    return {} as T;
  }

  try {
    return JSON.parse(text) as T;
  } catch {
    const preview = text.slice(0, 120).replace(/\s+/g, ' ').trim();
    if (
      res.status >= 500 ||
      preview.toLowerCase().includes('internal server') ||
      preview.toLowerCase().includes('service unavailable')
    ) {
      throw new Error(
        'Server unavailable — the database may be offline. Try again in a moment.'
      );
    }
    throw new Error(preview || `Request failed (${res.status})`);
  }
}
