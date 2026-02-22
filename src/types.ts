
export interface Driver {
  id: number;
  name: string;
}

export type ShiftType = 'morning' | 'evening';

export interface DriverInfo {
  id: number;
  name: string;
}

export interface Shift {
  drivers: DriverInfo[];
}

export interface WeeklySchedule {
  [day: string]: {
    [key in ShiftType]?: Shift | null;
  };
}

export interface ScheduleTable {
  id: string;
  title: string;
  routeInfo?: string;
  schedule: WeeklySchedule;
  created_at?: string;
}
