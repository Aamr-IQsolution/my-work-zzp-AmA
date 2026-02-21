
export interface Driver {
  id: number; // Changed to number to match Supabase
  name: string;
  addedAt: string;
}

export type ShiftType = 'morning' | 'evening';

export interface DriverInfo {
  id: number; // Changed to number to match Supabase
  name: string;
}

export interface ShiftAssignment {
  drivers: DriverInfo[];
}

export type WeeklySchedule = Record<string, { // Changed key from number to string (YYYY-MM-DD)
  morning?: ShiftAssignment | null;
  evening?: ShiftAssignment | null;
}>;

// Represents a single, named schedule table for a week
export interface ScheduleTable {
  id: string; // This is UUID, so it's a string
  title: string; // User-defined title, e.g., "Car A", "Route 1"
  routeInfo: string; // The specific address/route for this table
  schedule: WeeklySchedule; // The existing schedule grid for this table
  created_at?: string; // Added from Supabase
}
