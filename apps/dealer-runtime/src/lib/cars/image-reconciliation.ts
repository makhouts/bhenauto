export type ExistingCarImage = {
  id: string;
  url: string;
  sortOrder: number;
};

export function reconcileCarImages(existingImages: ExistingCarImage[], nextUrls: string[]) {
  const availableByUrl = new Map<string, ExistingCarImage[]>();
  for (const image of existingImages) {
    const matches = availableByUrl.get(image.url) ?? [];
    matches.push(image);
    availableByUrl.set(image.url, matches);
  }

  const updates: Array<{ id: string; sortOrder: number }> = [];
  const creates: Array<{ url: string; sortOrder: number }> = [];

  nextUrls.forEach((url, sortOrder) => {
    const existing = availableByUrl.get(url)?.shift();
    if (!existing) {
      creates.push({ url, sortOrder });
      return;
    }
    if (existing.sortOrder !== sortOrder) {
      updates.push({ id: existing.id, sortOrder });
    }
  });

  const nextUrlSet = new Set(nextUrls);
  const removedImages = [...availableByUrl.values()].flat();

  return {
    updates,
    creates,
    deleteIds: removedImages.map((image) => image.id),
    removedUrls: [...new Set(
      removedImages
        .map((image) => image.url)
        .filter((url) => !nextUrlSet.has(url)),
    )],
  };
}
