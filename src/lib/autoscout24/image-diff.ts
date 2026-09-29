export type ImportedImage = {
  url: string;
  sortOrder: number;
  sourceUrl: string | null;
  autoscoutImageId: string | null;
  sourceMd5: string | null;
};

// Match each stored row at most once, including duplicate URLs. Reused files
// keep their image IDs; a price-only listing update produces no image writes.
export function diffImportedImages(existing: Array<ImportedImage & { id: string }>, next: ImportedImage[]) {
  const remaining = new Map(existing.map((image) => [image.id, image]));
  const create: ImportedImage[] = [];
  const update: Array<{ where: { id: string }; data: ImportedImage }> = [];
  for (const image of next) {
    const match = [...remaining.values()].find((stored) => stored.url === image.url);
    if (!match) {
      create.push(image);
      continue;
    }
    remaining.delete(match.id);
    if (match.sortOrder !== image.sortOrder || match.sourceUrl !== image.sourceUrl ||
        match.autoscoutImageId !== image.autoscoutImageId || match.sourceMd5 !== image.sourceMd5) {
      update.push({ where: { id: match.id }, data: image });
    }
  }
  if (!create.length && !update.length && !remaining.size) return undefined;
  return {
    ...(create.length ? { create } : {}),
    ...(update.length ? { update } : {}),
    ...(remaining.size ? { deleteMany: { id: { in: [...remaining.keys()] } } } : {}),
  };
}
