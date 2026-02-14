
export interface Driver {
  id: string;
  name: string;
  addedAt: string;
}

export type ShiftType = 'morning' | 'evening';

export interface ShiftAssignment {
  driverId: string;
  driverName: string;
}

export type WeeklySchedule = Record<number, Record<ShiftType, ShiftAssignment | null>>;

export interface AppState {
  drivers: Driver[];
  schedule: WeeklySchedule;
}
