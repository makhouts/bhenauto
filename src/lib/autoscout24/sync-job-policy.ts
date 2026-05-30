export type AutoScoutSyncJobAction =
  | "upsert"
  | "set-publication"
  | "set-active"
  | "set-inactive"
  | "delete";

const PUBLICATION_ACTIONS: AutoScoutSyncJobAction[] = [
  "set-publication",
  "set-active",
  "set-inactive",
];

export function autoScoutSyncJobDedupeKey(input: {
  action: AutoScoutSyncJobAction;
  carId?: string | null;
  listingId?: string | null;
}) {
  if (input.carId && PUBLICATION_ACTIONS.includes(input.action)) {
    return `car:${input.carId}:publication`;
  }
  if (input.carId) return `car:${input.carId}:${input.action}`;
  if (input.listingId) return `listing:${input.listingId}:${input.action}`;
  return null;
}

export function supersededAutoScoutActions(action: AutoScoutSyncJobAction): AutoScoutSyncJobAction[] {
  if (action === "delete") {
    return ["upsert", ...PUBLICATION_ACTIONS];
  }
  if (PUBLICATION_ACTIONS.includes(action)) {
    return [...PUBLICATION_ACTIONS, "delete"];
  }
  return ["delete"];
}

export function desiredAutoScoutPublicationAction(car: { sold: boolean; reserved: boolean }) {
  if (car.sold) return "delete" as const;
  return car.reserved ? "Inactive" as const : "Active" as const;
}
