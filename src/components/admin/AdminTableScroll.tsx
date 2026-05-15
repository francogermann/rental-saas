import type { ReactNode } from 'react';

type AdminTableScrollProps = {
  children: ReactNode;
};

export function AdminTableScroll({ children }: AdminTableScrollProps) {
  return <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">{children}</div>;
}
