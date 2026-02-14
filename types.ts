
export interface Driver {
  id: string;
  name: string;
  addedAt: string;
}

export type ShiftType = 'morning' | 'evening';

export interface DriverInfo {
  id: string;
  name: string;
}

export interface ShiftAssignment {
  drivers: DriverInfo[];
}

export type WeeklySchedule = Record<number, {
  morning?: ShiftAssignment | null;
  evening?: ShiftAssignment | null;
}>;

// Represents a single, named schedule table for a week
export interface ScheduleTable {
  id: string; // Unique ID for this table
  title: string; // User-defined title, e.g., "Car A", "Route 1"
  routeInfo: string; // The specific address/route for this table
  schedule: WeeklySchedule; // The existing schedule grid for this table
}
