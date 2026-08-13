import type { LandingTr } from './types';

export interface LandingFaqDisplayItem {
  id: string;
  question: string;
  answer: string;
}

const LANDING_FAQ_ENTRIES = [
  {
    id: 'age-groups',
    questionEn: 'What age groups do you teach?',
    questionHy: 'Ո՞ր տարիքային խմբերի հետ եք աշխատում։',
    answerEn:
      'Instruction at our centre starts from age 8, with no upper age limit. Groups are formed according to students’ level, age, and abilities.',
    answerHy:
      'Մեզ մոտ ուսուցումն իրականացվում է 8 տարեկանից սկսած՝ առանց տարիքային սահմանափակման: Մեր խմբերը դասակարգվում են ըստ ուսանողների մակարդակի, տարիքի և կարողությունների:',
  },
  {
    id: 'level-duration',
    questionEn: 'How long does it take to complete a level?',
    questionHy: 'Որքա՞ն ժամանակ է պահանջվում մեկ մակարդակ ավարտելու համար։',
    answerEn:
      'The centre’s approach to each learner’s progress is individual, and the duration of a level depends on the student. On average, however, completing one level takes 6 months.',
    answerHy:
      'Կենտրոնի մոտեցումը սովորողի առաջընթացին ինդիվիդուալ է, և մակարդակի տևողությունը կախված է ուսանողից։ Այնուամենայնիվ, միջինում մեկ մակարդակն ավարտելու համար պահանջվում է 6 ամիս:',
  },
  {
    id: 'trial-lesson',
    questionEn: 'Do you offer a free trial lesson?',
    questionHy: 'Առաջարկու՞մ եք անվճար փորձնական դաս։',
    answerEn:
      'The first trial lesson is free if you do not wish to continue afterwards. If you do wish to continue, the student is enrolled at the centre according to the relevant procedure.',
    answerHy:
      'Առաջին փորձնական դասը համարվում է անվճար, եթե դրանից հետո չեք ցանկանում շարունակել ուսուցումը: Իսկ ուսումնառությունը շարունակելու ցանկության դեպքում սովորողը ընդունվում է կենտրոն ըստ համապատասխան կարգի։',
  },
  {
    id: 'class-sizes',
    questionEn: 'What are your class sizes?',
    questionHy: 'Քանի՞ ուսանող է լինում մեկ խմբում։',
    answerEn:
      'To ensure maximum effectiveness, each group includes 5–8 students. Groups are formed by level, age, and abilities.',
    answerHy:
      'Առավելագույն արդյունավետությունն ապահովելու համար մեկ խմբում ընդգրկվում է 5-8 սովորող: Խմբերը ձևավորվում են ըստ մակարդակի, տարիքի և կարողությունների:',
  },
  {
    id: 'international-exams',
    questionEn: 'Do you prepare students for international exams?',
    questionHy: 'Պատրաստու՞մ եք ուսանողներին միջազգային քննությունների։',
    answerEn:
      'Yes, we run preparatory courses that develop the skills needed for international exams (for example TOEFL, IELTS, Cambridge, and others).',
    answerHy:
      'Այո, մենք իրականացնում ենք նախապատրաստական դասընթացներ միջազգային քննությունների հմտությունները զարգացնելով (օրինակ՝ TOEFL, IELTS, Cambridge և այլն):',
  },
  {
    id: 'miss-class',
    questionEn: 'What if I miss a class?',
    questionHy: 'Ի՞նչ անել, եթե բաց եմ թողել դասը։',
    answerEn:
      'Missed lessons are not made up, except in cases of being out of the country for a set number of days, a medical appointment, 1–2 weeks’ absence during the summer holidays, and other urgent or unexpected situations.',
    answerHy:
      'Բաց թողնված դասերը չեն լրացվում, բացառությամբ՝ երկրից որոշակի օրերով բացակայելու, բժշկական նշանակման, ամառային արձակուրդներին 1-2 շաբաթով բացակայելու, և այլ անհետաձգելի/հանկարծակի դեպքերի:',
  },
] as const;

export function createLandingFaqItems(tr: LandingTr): LandingFaqDisplayItem[] {
  return LANDING_FAQ_ENTRIES.map((entry) => ({
    id: entry.id,
    question: tr(entry.questionEn, entry.questionHy),
    answer: tr(entry.answerEn, entry.answerHy),
  }));
}
