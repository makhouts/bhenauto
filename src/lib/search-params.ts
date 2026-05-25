export function buildPathWithQuery(pathname: string, queryString: string): string {
    return queryString ? `${pathname}?${queryString}` : pathname;
}

export function updateSearchParams(
    currentSearch: string,
    updates: Record<string, string | null | undefined>,
    keysToDelete: string[] = ["page"]
): string {
    const params = new URLSearchParams(currentSearch);

    for (const [key, value] of Object.entries(updates)) {
        if (value) {
            params.set(key, value);
        } else {
            params.delete(key);
        }
    }

    for (const key of keysToDelete) {
        params.delete(key);
    }

    return params.toString();
}
