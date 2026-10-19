export type ParentReportFacts = {
  topics: string[];
  skills: string[];
  challenges: string[];
  achievements: string[];
};

export type ParentReportLetter = {
  subject: string;
  html: string;
  text: string;
};

const CLOSING =
  'Սիրելի՛ ծնող, Ձեր երեխայի առաջընթացը թե՛ Ձեր, թե՛ մեր առաջնահերթությունն է։ Եկե՛ք շարունակենք մեր եռակողմ աշխատանքը և աջակցենք մեր սովորողներին՝ բացահայտելու և լավագույնս օգտագործելու իրենց ներուժը։';

export function buildParentReportLetter(input: {
  parentName: string | null;
  studentName: string;
  quarterKey: string;
  current: ParentReportFacts;
  previous: ParentReportFacts;
}): ParentReportLetter {
  const parent = input.parentName?.trim() || 'ծնող';
  const months = quarterMonthsText(input.quarterKey);
  const greeting = `Սիրելի ${parent}, ${months} ամիսներին Ձեր երեխան սերտել է հետևյալ թեմաներն ու հմտությունները։`;
  const comparison = comparisonText(input.current, input.previous);
  const sections = [
    section('Թեմաներ', input.current.topics, 'Այս եռամսյակում օրական պլանի թեմաներ չեն գրանցվել։'),
    section('Հմտություններ', input.current.skills, 'Հմտություններ դեռ չեն գրանցվել։'),
    section('Ունեցել ենք մարտահրավերներ՝', input.current.challenges, 'Այս եռամսյակում առանձին մարտահրավերներ չեն նշվել։'),
    section(
      'Աշխատել ենք այդ հմտությունների վրա և ունեցել նման ձեռքբերումներ:',
      input.current.achievements,
      'Այս եռամսյակում առանձին ձեռքբերումներ դեռ չեն գրանցվել։',
    ),
    section('Համեմատություն նախորդ եռամսյակի հետ', [comparison], comparison),
  ];
  const text = [greeting, ...sections.map((item) => item.text), CLOSING].join('\n\n');
  const html = `<div style="font-family:Arial,sans-serif;line-height:1.5;color:#1f2937">
    <p>${escapeHtml(greeting)}</p>
    ${sections.map((item) => item.html).join('')}
    <p>${escapeHtml(CLOSING)}</p>
  </div>`;
  return {
    subject: `Եռամսյակային հաշվետվություն — ${input.studentName} (${months})`,
    html,
    text,
  };
}

const MONTH_NAMES = [
  'հունվար',
  'փետրվար',
  'մարտ',
  'ապրիլ',
  'մայիս',
  'հունիս',
  'հուլիս',
  'օգոստոս',
  'սեպտեմբեր',
  'հոկտեմբեր',
  'նոյեմբեր',
  'դեկտեմբեր',
];

function quarterMonthsText(quarterKey: string): string {
  const quarter = Number(quarterKey.slice(6));
  const start = (quarter - 1) * 3;
  return MONTH_NAMES.slice(start, start + 3).join(', ');
}

function comparisonText(current: ParentReportFacts, previous: ParentReportFacts): string {
  if (previous.topics.length === 0 && previous.skills.length === 0) {
    return 'Նախորդ եռամսյակի համեմատության համար բավարար տվյալներ չկան։';
  }
  return `Նախորդ եռամսյակում սերտվել է ${previous.topics.length} թեմա և ${previous.skills.length} հմտություն, այս եռամսյակում՝ ${current.topics.length} թեմա և ${current.skills.length} հմտություն։`;
}

function section(title: string, items: string[], empty: string): { html: string; text: string } {
  const lines = items.length > 0 ? items : [empty];
  return {
    text: `${title}\n${lines.map((line) => `• ${line}`).join('\n')}`,
    html: `<h3 style="margin:16px 0 8px">${escapeHtml(title)}</h3><ul>${lines
      .map((line) => `<li>${escapeHtml(line)}</li>`)
      .join('')}</ul>`,
  };
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
