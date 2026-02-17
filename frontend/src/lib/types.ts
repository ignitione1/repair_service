export type UserRole = "dispatcher" | "master";

export type AuthUser = {
  id: string;
  name: string;
  role: UserRole;
};

export type RequestStatus =
  | "new"
  | "assigned"
  | "in_progress"
  | "done"
  | "canceled";

export type RepairRequest = {
  id: string;
  clientName: string;
  phone: string;
  address: string;
  problemText: string;
  status: RequestStatus;
  assignedToId: string | null;
  createdAt: string;
  updatedAt: string;
  takenAt: string | null;
  assignedTo?: { id: string; name: string; role: UserRole } | null;
};
