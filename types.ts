export interface Driver {
  id: string;
  name: string;
  addedAt: string;
}

export type ShiftType = 'morning' | 'evening';

// Represents a single driver assigned to a shift
export interface DriverInfo {
  id: string;
  name: string;
}

// A shift can now have multiple drivers
export interface ShiftAssignment {
  drivers: DriverInfo[];
}

// The schedule structure remains similar, but the shift assignment object is updated
export type WeeklySchedule = Record<number, {
  morning?: ShiftAssignment | null;
  evening?: ShiftAssignment | null;
}>;

export interface AppState {
  drivers: Driver[];
  schedule: WeeklySchedule;
}
