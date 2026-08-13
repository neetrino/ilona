import type { LandingTr } from './types';

export interface LandingProgramDisplay {
  id: string;
  title: string;
  details: string;
  price: number;
}

const LANDING_PROGRAMS = [
  {
    id: 'general-english',
    titleEn: 'General English',
    titleHy: 'Ընդհանուր Անգլերեն',
    detailsEn:
      'A group course with an individual approach. The course is based on the 4 English skills: grammar, speaking, listening, and reading. Groups are classified by language level and age. 2 days a week, 1:30 to 2 hours per session.',
    detailsHy:
      'Խմբային դասընթաց՝ անհատական մոտեցմամբ: Դասընթացը հիմնված է անգլերենի 4 հմտությունների վրա՝ քերականություն, խոսք, լսողական և ընթերցանություն: Խմբերը դասակարգված են ըստ լեզվի մակարդակի և տարիքի: Շաբաթական 2 օր՝ 1:30-ից 2 ժամ տևողությամբ:',
    price: 30000,
  },
  {
    id: 'english-with-adults',
    titleEn: 'English with Adults',
    titleHy: 'Անգլերեն Մեծահասակների հետ',
    detailsEn:
      'A group course with a special methodology designed to intensively develop speaking. Groups are classified by language level and age. 2 days a week, 1:30 to 2 hours per session.',
    detailsHy:
      'Դասընթացը խմբային է և մշակված է հատուկ մեթոդիկա՝ խոսքը ինտենսիվ կերպով զարգացնելու նպատակով: Խմբերը դասակարգված են ըստ լեզվի մակարդակի և տարիքի: Շաբաթական 2 օր՝ յուրաքանչյուր պարապմունքը  1:30-ից 2 ժամ տևողությամբ:',
    price: 30000,
  },
  {
    id: 'pre-university',
    titleEn: 'Pre-University English courses',
    titleHy: 'Նախաբուհական դասընթացներ',
    detailsEn:
      "A course based on mastering English entrance-exam collections with IEC's special methodology. 3 days a week, 1:30 to 2 hours per session.",
    detailsHy:
      'Դասընթաց հիմնված Անգլերենի շտեմարանները սերտելու վրա՝ IEC հատուկ մեթոդիկայով: Շաբաթական 3 օր՝ յուրաքանչյուր պարապմունքը  1:30-ից 2 ժամ տևողությամբ:',
    price: 45000,
  },
] as const;

export function createLandingPrograms(tr: LandingTr): LandingProgramDisplay[] {
  return LANDING_PROGRAMS.map((program) => ({
    id: program.id,
    title: tr(program.titleEn, program.titleHy),
    details: tr(program.detailsEn, program.detailsHy),
    price: program.price,
  }));
}
