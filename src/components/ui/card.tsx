import { clsx } from 'clsx';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  hover?: boolean;
  glow?: boolean;
}

export function Card({ hover, glow, className, children, ...props }: CardProps) {
  return (
    <div
      className={clsx(
        'rounded-2xl border border-[#1E1E1E] bg-[#141414] p-6',
        hover && 'card-hover hover:bg-bg-card-hover hover:border-border-primary cursor-pointer',
        glow && 'glow',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
