import { SidebarItemTypeValues } from '@/types';
import { LucideProps } from 'lucide-react';
import { ForwardRefExoticComponent, RefAttributes, memo, useCallback } from 'react';

interface MenuButtonProps {
  Icon: ForwardRefExoticComponent<Omit<LucideProps, 'ref'> & RefAttributes<SVGSVGElement>>;
  type: SidebarItemTypeValues;
  label: string;
  onClick: (type: SidebarItemTypeValues) => void;
  isActive: boolean;
  shouldShowSpan: boolean;
  children: React.ReactNode;
}

function MenuButton({ type, Icon, label, onClick, isActive, shouldShowSpan, children }: MenuButtonProps) {
  const handleClick = useCallback(() => {
    onClick(type);
  }, [onClick, type]);

  return (
    <button
      title={label}
      onClick={handleClick}
      className={`relative w-full flex items-center p-3 rounded-xl transition-all duration-200
                  border-2 ${!shouldShowSpan && 'justify-center'} ${
                    isActive
                      ? 'bg-white border-primary shadow-[2px_2px_0px_0px_#00214D]'
                      : 'border-transparent hover:bg-gray-4 hover:border-primary/30'
                  }`}
    >
      <Icon className="w-6 md:w-8 aspect-square" />
      {children}
      {shouldShowSpan && <span className="ml-4 font-bold whitespace-nowrap overflow-hidden">{label}</span>}
    </button>
  );
}

export default memo(MenuButton);
