import { LucideIcon } from "lucide-react";

export type SidebarItemType = {
  icon: LucideIcon;
  label: string;
  href: string;
};

export type SidebarSectionType = {
  title: string;
  items: SidebarItemType[];
};

export type SidebarProps = {
  sections?: SidebarSectionType[];
}; 