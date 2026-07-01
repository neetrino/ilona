import { FAQ_ITEMS_EN, FAQ_ITEMS_HY } from './landingConstants';
import type { LandingTr } from './types';

export interface LandingFaqDisplayItem {
  id: string;
  question: string;
  answer: string;
}

const LANDING_FAQ_ENTRIES = [
  {
    id: 'age-groups',
    answerEn:
      'We welcome learners from age 6 through adults. Programs are grouped by age and level so every student studies with peers at a similar stage — from engaging starter classes for children to professional and exam-focused courses for adults.',
    answerHy:
      'Մենք աշխատում ենք տարբեր տարիքային խմբերի ուսանողների հետ՝ հաշվի առնելով նրանց գիտելիքների մակարդակը, նպատակները և ուսուցման տեմպը։ Մեր թիմը կօգնի ընտրել ամենահարմար խումբը կամ դասընթացը։',
  },
  {
    id: 'level-duration',
    answerEn:
      'Most students complete one CEFR level in 6–9 months with regular attendance (2–3 sessions per week). Your pace depends on your starting point, homework consistency, and active participation in class.',
    answerHy:
      'Մեկ մակարդակի ավարտման տևողությունը կախված է դասընթացի ձևաչափից, դասերի հաճախականությունից և ուսանողի առաջընթացից։ Գրանցման ընթացքում մենք կներկայացնենք ծրագրի կառուցվածքը և մոտավոր տևողությունը։',
  },
  {
    id: 'trial-lesson',
    answerEn:
      'Yes. Book a complimentary trial lesson to experience our teaching style, meet your potential teacher, and receive a short level assessment — with no obligation to enroll.',
    answerHy:
      'Այո, հնարավոր է մասնակցել փորձնական դասի՝ ծրագրի ձևաչափին, ուսուցչի մոտեցմանը և դասի ընթացքին ծանոթանալու համար։ Մանրամասները կարող եք ճշտել մեր թիմի հետ գրանցման փուլում։',
  },
  {
    id: 'class-sizes',
    answerEn:
      'Groups typically include 6–10 students. Smaller classes mean more speaking time, personalised feedback, and a supportive atmosphere where everyone participates.',
    answerHy:
      'Խմբերի չափը կազմվում է այնպես, որ յուրաքանչյուր ուսանող ստանա բավարար ուշադրություն և կարողանա ակտիվ մասնակցել դասին։ Խմբի վերջնական կազմը կարող է տարբեր լինել՝ կախված դասընթացից և մակարդակից։',
  },
  {
    id: 'switch-branch',
    answerEn:
      'Absolutely. You can transfer to any IEC branch in Yerevan if your schedule or location changes. Our team will help match you with a suitable group at your current level.',
    answerHy:
      'Այո, անհրաժեշտության դեպքում կարող ենք քննարկել մասնաճյուղը փոխելու հնարավորությունը։ Փոփոխությունը կախված է տվյալ մասնաճյուղում համապատասխան խմբի, մակարդակի և ազատ տեղերի առկայությունից։',
  },
  {
    id: 'materials',
    answerEn:
      'We provide core course books and digital resources. You will need a notebook and pen; headphones are recommended for online practice. Any additional materials will be communicated at enrollment.',
    answerHy:
      'Ուսումնական նյութերի ցանկը կախված է ընտրված դասընթացից և մակարդակից։ Դասընթացի մեկնարկից առաջ մեր թիմը կտրամադրի անհրաժեշտ տեղեկությունը և կօգնի ճիշտ պատրաստվել դասերին։',
  },
  {
    id: 'international-exams',
    answerEn:
      'Yes — we offer dedicated **IELTS**, **TOEFL**, and **Cambridge** exam preparation.\n\nYour program includes mock tests, writing workshops, and score-focused strategies tailored to your target grade and exam date.',
    answerHy:
      'Այո — մենք պատրաստում ենք **IELTS**, **TOEFL** և **Cambridge** միջազգային քննություններին։\n\nԾրագիրը ներառում է փորձնական թեստեր, գրավոր աշխատանքների արհեստաշարեր և ռազմավարություններ՝ հարմարեցված ձեր նպատակային միավորին և քննության ամսաթվին։',
  },
  {
    id: 'miss-class',
    answerEn:
      'Please notify us in advance when possible. Depending on your program, you may attend a makeup session or receive lesson materials to stay on track. Repeated absences may affect your progress.',
    answerHy:
      'Եթե բաց եք թողել դասը, անհրաժեշտ է տեղեկացնել մեր թիմին կամ ուսուցչին։ Մենք կօգնենք հասկանալ բաց թողած նյութը լրացնելու հնարավոր տարբերակները՝ ըստ դասընթացի կանոնների և խմբի ընթացքի։',
  },
  {
    id: 'discounts',
    answerEn:
      'We offer seasonal promotions, sibling discounts, and early enrollment benefits. Contact any branch or follow us on social media for current offers.',
    answerHy:
      'Զեղչերի և հատուկ առաջարկների առկայությունը կարող է տարբեր լինել՝ կախված ընթացիկ ծրագրերից, գրանցման պայմաններից կամ ընտրված դասընթացից։ Թարմ տեղեկությունը կարող եք ստանալ մեր թիմից։',
  },
  {
    id: 'track-progress',
    answerEn:
      'Through regular assessments, teacher feedback, and our student portal where you can view attendance, grades, and personalised recommendations after each unit.',
    answerHy:
      'Ուսանողի առաջընթացը գնահատվում է դասերի ընթացքում՝ ըստ մասնակցության, առաջադրանքների կատարման և ձեռք բերված գիտելիքների։ Անհրաժեշտության դեպքում մեր թիմը կամ ուսուցիչը կտրամադրի հետադարձ կապ և կօգնի հասկանալ հաջորդ քայլերը։',
  },
] as const;

export function createLandingFaqItems(tr: LandingTr): LandingFaqDisplayItem[] {
  return LANDING_FAQ_ENTRIES.map((entry, index) => ({
    id: entry.id,
    question: tr(FAQ_ITEMS_EN[index], FAQ_ITEMS_HY[index]),
    answer: tr(entry.answerEn, entry.answerHy),
  }));
}
