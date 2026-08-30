import { memo, useCallback } from 'react';
import type { MenuItem, SidebarItemTypeValues } from '@/types/sidebar';

interface MenuButtonProps {
  item: MenuItem;
  onClick: (type: SidebarItemTypeValues) => void;
  isActive: boolean;
  shouldShowSpan: boolean;
  children: React.ReactNode;
}

function MenuButton({ item, onClick, isActive, shouldShowSpan, children }: MenuButtonProps) {
  const { type, icon: Icon, label } = item;

  const handleClick = useCallback(() => {
    onClick(type);
  }, [onClick, type]);

  return (
    <button
      title={label}
      onClick={handleClick}
      className={`relative w-full flex items-center p-3 rounded-xl transition-all duration-200
                  border-2 ${
                    isActive
                      ? 'bg-white border-primary shadow-[2px_2px_0px_0px_#00214D]'
                      : 'border-transparent hover:bg-gray-4 hover:border-primary/30'
                  }`}
    >
      <Icon className="sidebar-icon" />
      {children}
      {shouldShowSpan && <span className="ml-4 text-sm md:text-base font-bold whitespace-nowrap overflow-hidden">{label}</span>}
    </button>
  );
}

export default memo(MenuButton);
