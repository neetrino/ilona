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
      'Մենք ընդունում ենք 6 տարեկանից մինչև մեծահասակներ։ Ըրագրերը խմբավորված են տարիքի և մակարդակի համադեյն, որպեսզի յուրաքանչյուր ուսանոխը սովորի իր տարիքային խմբի հետ՝ սկսնական դասերից մինչև մասնագիտական և քննության նպատակով դասընթացներ։',
  },
  {
    id: 'level-duration',
    answerEn:
      'Most students complete one CEFR level in 6–9 months with regular attendance (2–3 sessions per week). Your pace depends on your starting point, homework consistency, and active participation in class.',
    answerHy:
      'Մեգամասնությունը մեկ CEFR մակարդակն ավարտում է 6–9 ամսու՝ կանունավոր հաճարակման դեպքում (շաբաթական 2–3 դաս)։ Արագությունը կախված է սկզբական մակարդակից, տնային աշխատանքից և դասերում ակտիվ մասնակցությանից։',
  },
  {
    id: 'trial-lesson',
    answerEn:
      'Yes. Book a complimentary trial lesson to experience our teaching style, meet your potential teacher, and receive a short level assessment — with no obligation to enroll.',
    answerHy:
      'Այո։ Կարոխ եք ամրագրել անյչար ությունակ դաս՝ ձերանոթնալու մեր դասավանդման ոճինը, հանդիպելու հնարավոր ուսուչի։ և ստանալու կարտ մակարդակի գնահատում՝ արանց պարտադիր գրանցման։',
  },
  {
    id: 'class-sizes',
    answerEn:
      'Groups typically include 6–10 students. Smaller classes mean more speaking time, personalised feedback, and a supportive atmosphere where everyone participates.',
    answerHy:
      'Խմբերը սովորաբար 6–10 ուսանոխ են բաղկանց։ Փուքր խմբերը ավելի խոսելու հնարավորություն, անհատական արագանի և աջակցութ միջավայր է ապահովում։',
  },
  {
    id: 'switch-branch',
    answerEn:
      'Absolutely. You can transfer to any IEC branch in Yerevan if your schedule or location changes. Our team will help match you with a suitable group at your current level.',
    answerHy:
      'Անշուշտ։ Եթե ձեր գրանցման կամ տեխակարդակը կամ տեխադրությունը ևննագելի դեպքում է, կարոխ եք տեխապոխվել IEC-ի ցանկացաց մասնագրության։ Մեր թիմը կյողնի գտնել ձեր մակարդակին համապատասխան խմբ։',
  },
  {
    id: 'materials',
    answerEn:
      'We provide core course books and digital resources. You will need a notebook and pen; headphones are recommended for online practice. Any additional materials will be communicated at enrollment.',
    answerHy:
      'Մենք ապահովում ենք հիմնական դասագրքեր և թվային րեսուրսներ։ Դեզ անհրաջեշտ են նոտատետր և գրիչ, իսկ ականջակալները խորուրդ են տրվում արցանց վարջություների համա։ Լրացուցիչ նյութերի մասին կտելեկացնենք գրանցման ժամանակ։',
  },
  {
    id: 'international-exams',
    answerEn:
      'Yes. We offer dedicated IELTS, TOEFL, and Cambridge preparation with mock tests, writing workshops, and strategies tailored to your target score and exam date.',
    answerHy:
      'Այո։ Մենք արաջարկում ենք IELTS, TOEFL և Cambridge քննությաների նպատակով պատրաստում՝ պորդզնական թեստերով, գրավոր աշխատանքի դասերով և ձեր նպակային միավորին համապատասխան րազմավանդություներով։',
  },
  {
    id: 'miss-class',
    answerEn:
      'Please notify us in advance when possible. Depending on your program, you may attend a makeup session or receive lesson materials to stay on track. Repeated absences may affect your progress.',
    answerHy:
      'Հնարավորության դեպքում խնդրում ենք արացակից տեբեակացնել։ Դեզ ալիքական կարագրից կախված՝ կարոխ եք մասնակածել փուխհատության դասին կամ ստանալ դասի նյութերը։ Կնդական բաց թոեխնումները կարոբ են ազդել արաջընթացի վրա։',
  },
  {
    id: 'discounts',
    answerEn:
      'We offer seasonal promotions, sibling discounts, and early enrollment benefits. Contact any branch or follow us on social media for current offers.',
    answerHy:
      'Մենք արաջարկում ենք սեզոնային ակցիաներ, եղբայր-եխպորի զեղչեր և արաջակի գրանցման հոնարներ։ Ընտացիք արաջարկների համար կապվեցը ցանկացաց մասնագրության թե կամ հետեվեցը մեզ սոծիալիական անգներում։',
  },
  {
    id: 'track-progress',
    answerEn:
      'Through regular assessments, teacher feedback, and our student portal where you can view attendance, grades, and personalised recommendations after each unit.',
    answerHy:
      'Կանունավոր գնահատումների, ուսուչի արագանի և ուսանոխական պորտալի միջոցով, որտեղ կարոբ եք տեսնել հաճարակմանը, գնահատակաները և անհատական խորհուրդները յուրաքանչյուր բլոկից հետ։',
  },
] as const;

export function createLandingFaqItems(tr: LandingTr): LandingFaqDisplayItem[] {
  return LANDING_FAQ_ENTRIES.map((entry, index) => ({
    id: entry.id,
    question: tr(FAQ_ITEMS_EN[index], FAQ_ITEMS_HY[index]),
    answer: tr(entry.answerEn, entry.answerHy),
  }));
}
