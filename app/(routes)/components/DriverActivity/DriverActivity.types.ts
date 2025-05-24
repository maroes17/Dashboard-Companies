import { LucideIcon } from "lucide-react";

export type DriverActivityItemType = {
  id: string;
  driverName: string;
  action: string;
  details: string;
  time: string;
  icon: LucideIcon;
  status: 'success' | 'inProgress' | 'warning' | 'error' | 'info';
};

export type DriverActivityProps = {
  activities?: DriverActivityItemType[];
}; 