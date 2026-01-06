import { ReactElement } from 'react';

export default function Drawer({ isOpen, isSidebarExpanded, children }: { isOpen: boolean; isSidebarExpanded: boolean; children: ReactElement }) {
  return (
    <div
      className={`
          absolute top-0 ${isSidebarExpanded ? 'left-64' : 'left-20'} h-full bg-white border-r-2 border-primary z-30 transition-all duration-300 ease-in-out shadow-[8px_0px_20px_rgba(0,0,0,0.05)]
          ${isOpen ? 'translate-x-0 w-100' : '-translate-x-full w-100 opacity-0 pointer-events-none'}
        `}
    >
      {children}
    </div>
  );
}
