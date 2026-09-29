// Preserve the existing three available / one sold ordering while reading
// only this page from each group. Exhausted groups spill into the other.
export function getInventoryWindow(available: number, sold: number, offset: number, size: number) {
  const total = available + sold;
  const start = Math.min(offset, total);
  const end = Math.min(start + size, total);
  const availableBefore = (position: number) =>
    Math.min(available, position - Math.min(sold, Math.floor(position / 4)));
  const availableSkip = availableBefore(start);
  const availableTake = availableBefore(end) - availableSkip;
  return {
    available: { skip: availableSkip, take: availableTake },
    sold: { skip: start - availableSkip, take: end - start - availableTake },
    // true means take the next sold car; false takes the next available car.
    order: Array.from({ length: end - start }, (_, i) =>
      availableBefore(start + i + 1) === availableBefore(start + i)),
    total,
    hasMore: end < total,
  };
}
