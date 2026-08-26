import { cn } from '@/shared/lib/utils';

const LANGUAGE_SKILLS = ['speaking', 'listening', 'reading', 'writing'] as const;

type LandingAboutCopyProps = {
  intro: string;
  method: string;
  cert: string;
  groups: string;
  isHy: boolean;
  compact?: boolean;
};

export function LandingAboutCopy({
  intro,
  method,
  cert,
  groups,
  isHy,
  compact = false,
}: LandingAboutCopyProps) {
  const bodyClass = compact
    ? isHy
      ? 'text-[14px] leading-[22px]'
      : 'text-[15px] leading-[23px]'
    : isHy
      ? 'text-[16px] leading-[27px]'
      : 'text-[17px] leading-[28px]';

  return (
      <div className={compact ? 'space-y-2.5' : 'space-y-5'}>
      <p className={cn(bodyClass, 'font-medium tracking-[-0.2px] text-[#101828]')}>{intro}</p>

      <div>
        <p className={cn(bodyClass, 'tracking-[-0.2px] text-[#4a5565]')}>{method}</p>
        <ul className={cn(compact ? 'mt-2 grid w-fit grid-cols-2 gap-1.5' : 'mt-3 flex flex-wrap gap-2')}>
          {LANGUAGE_SKILLS.map((skill) => (
            <li
              key={skill}
              className={cn(
                'rounded-full bg-white font-semibold capitalize text-[#0025db]',
                compact
                  ? 'px-2.5 py-1 text-[11px] leading-4'
                  : 'px-3.5 py-1.5 text-[13px] leading-[18px] tracking-[-0.15px]',
              )}
            >
              {skill}
            </li>
          ))}
        </ul>
      </div>

      <p
        className={cn(
          bodyClass,
          'border-l-[3px] border-[#0025db] tracking-[-0.2px] text-[#364153]',
          compact ? 'pl-3' : 'pl-4',
        )}
      >
        {cert}
      </p>

      <p
        className={cn(
          'font-semibold tracking-[-0.2px] text-[#093394]',
          compact ? 'text-[13px] leading-5' : 'text-[16px] leading-6',
        )}
      >
        {groups}
      </p>
    </div>
  );
}
