export interface StaffMember {
  id: string;
  name: string;
}

export interface Prize {
  id: string;
  name: string;
  count: number;
  description?: string;
  colorTheme: string;
  accentBg: string;
}

export interface WinnerRecord {
  id: string;
  staffId: string;
  name: string;
  prizeId: string;
  prizeName: string;
  drawnAt: string;
}

export type DrawPhase =
  | 'idle'
  | 'rolling_intro'
  | 'char_1_revealed' // 1st character shown, waiting 2.5s
  | 'char_2_revealed' // 2nd character shown, waiting 1.0s
  | 'char_3_revealed' // 3rd character shown (all revealed)
  | 'completed';
