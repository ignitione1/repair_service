import type { RequestStatus } from "@/lib/types";

export function statusLabel(status: RequestStatus): string {
  switch (status) {
    case "new":
      return "Новая";
    case "assigned":
      return "Назначена";
    case "in_progress":
      return "В работе";
    case "done":
      return "Готово";
    case "canceled":
      return "Отменена";
    default: {
      const _exhaustive: never = status;
      return _exhaustive;
    }
  }
}

export function statusBadgeClass(status: RequestStatus): string {
  return `badge badge-${status}`;
}
