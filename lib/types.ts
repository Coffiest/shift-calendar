export type PeriodInfo = {
  id: string;
  storeId: string;
  storeName: string;
  year: number;
  month: number;
  open: boolean;
  days: number;
  holidays: Record<number, string>;
};
export type PeriodSummary = { id: string; year: number; month: number; open: boolean };
export type Member = { id: string; name: string; note: string; off: number[]; cuts?: number[] };
