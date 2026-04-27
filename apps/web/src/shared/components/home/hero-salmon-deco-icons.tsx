import { cn } from '@/shared/lib/utils';

const deco = 'h-[121.078px] w-[121.078px] shrink-0';

type DecoIconProps = {
  className?: string;
};

export function HeroDecoStarIcon({ className }: DecoIconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 122 122"
      fill="none"
      className={cn(deco, className)}
      aria-hidden
    >
      <path
        d="M60.5391 10.0898L74.6648 41.8729L110.988 46.4133L85.7637 70.6289L91.8176 105.943L60.5391 88.7906L29.2605 105.943L35.3145 70.6289L10.0898 46.4133L46.4133 41.8729L60.5391 10.0898Z"
        fill="#1A1614"
      />
    </svg>
  );
}

export function HeroDecoRingIcon({ className }: DecoIconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 122 122"
      fill="none"
      className={cn(deco, className)}
      aria-hidden
    >
      <path
        d="M60.5391 100.898C82.8289 100.898 100.898 82.8289 100.898 60.5391C100.898 38.2492 82.8289 20.1797 60.5391 20.1797C38.2492 20.1797 20.1797 38.2492 20.1797 60.5391C20.1797 82.8289 38.2492 100.898 60.5391 100.898Z"
        fill="#1A1614"
      />
      <path
        d="M60.5391 80.7188C71.684 80.7188 80.7188 71.684 80.7188 60.5391C80.7188 49.3941 71.684 40.3594 60.5391 40.3594C49.3941 40.3594 40.3594 49.3941 40.3594 60.5391C40.3594 71.684 49.3941 80.7188 60.5391 80.7188Z"
        fill="#FF8A6B"
      />
    </svg>
  );
}

export function HeroDecoTriangleIcon({ className }: DecoIconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 122 122"
      fill="none"
      className={cn(deco, className)}
      aria-hidden
    >
      <path d="M20.1797 100.898L60.5391 20.1797L100.898 100.898H20.1797Z" fill="#1A1614" />
    </svg>
  );
}
