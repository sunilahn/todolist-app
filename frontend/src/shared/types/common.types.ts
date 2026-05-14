export type Nullable<T> = T | null;

export interface SelectOption<T = string> {
  label: string;
  value: T;
}
