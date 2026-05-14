import { cn } from "@redwood/shad-ui/lib/utils";
import type { ReactNode } from "react";

const menuItemClassName = "transition-all duration-150";

const menuItemStateClassNames = {
  closed: "pointer-events-none translate-y-2 scale-95 opacity-0",
  open: "translate-y-0 scale-100 opacity-100",
};

type MenuItemProps = {
  children: ReactNode;
  isOpen: boolean;
};

export function MenuItem({ children, isOpen }: MenuItemProps) {
  return <div className={cn(menuItemClassName, isOpen ? menuItemStateClassNames.open : menuItemStateClassNames.closed)}>{children}</div>;
}
