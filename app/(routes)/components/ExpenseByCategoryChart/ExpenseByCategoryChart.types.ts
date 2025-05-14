export type ExpenseCategoryType = {
  name: string;
  value: number;
  color: string;
};
 
export type ExpenseByCategoryChartProps = {
  data?: ExpenseCategoryType[];
  height?: number | string;
}; 