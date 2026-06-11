export const Avatar = ({ name, size = 'md' }: { name: string; size?: 'sm' | 'md' | 'lg' }) => {
  const initials = name.split(' ').map((part) => part[0]).join('').slice(0, 2);
  const sizeClass = size === 'sm' ? 'h-8 w-8 text-xs' : size === 'lg' ? 'h-12 w-12 text-base' : 'h-10 w-10 text-sm';
  return <div className={`${sizeClass} grid place-items-center rounded-full border border-blue/30 bg-blue/15 font-bold text-blue`}>{initials}</div>;
};
