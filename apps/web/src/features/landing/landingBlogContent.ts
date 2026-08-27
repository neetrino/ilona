import {
  NEWS_IMAGE_1,
  NEWS_IMAGE_1_OVERLAY,
  NEWS_IMAGE_2,
  NEWS_IMAGE_2_OVERLAY,
  NEWS_IMAGE_3,
  NEWS_IMAGE_3_OVERLAY,
} from './landingConstants';

export type LandingBlogPost = {
  slug: string;
  image: string;
  overlay: string;
  dateEn: string;
  dateHy: string;
  dateColor: string;
  titleEn: string;
  titleHy: string;
  excerptEn: string;
  excerptHy: string;
  bodyEn: readonly string[];
  bodyHy: readonly string[];
  imageClassName?: string;
};

export const LANDING_BLOG_POSTS: readonly LandingBlogPost[] = [
  {
    slug: 'summer-intensive',
    image: NEWS_IMAGE_1,
    overlay: NEWS_IMAGE_1_OVERLAY,
    dateEn: 'Apr 28, 2026',
    dateHy: '28 Ապր, 2026',
    dateColor: 'text-[#1447e6]',
    titleEn: 'Summer Intensive',
    titleHy: 'Ամարային ինտենսիվ',
    excerptEn: 'Read more about this...',
    excerptHy: 'Կարդալ ավելին...',
    bodyEn: [
      'Our Summer Intensive program is designed for students who want to make rapid progress during the break. Classes run four days a week with a focus on speaking, listening, and real-world communication.',
      'Each group is kept small so every student gets personal attention from our teachers. Morning and afternoon sessions are available at all branches.',
      'Registration opens in May. Contact your branch or reach out through our contact form to reserve a spot.',
    ],
    bodyHy: [
      'Մեր ամարային ինտենսիվ ծրագիրը նախատեսված է այն աշակերտների համար, ովքեր ցանկանում էն արձակուրդների ընթացի գրանցել արագ արաջքնթաց գրանցել:',
      'Յուրաքանչյուր խումբը փուկր է պահվում, որժեսզի յուրաքանչյուր աշակերտ ստանա ուսուցչի անհատական ուշադրություն: Դասերը հասանելի է բոլոր մասնաճյուգերում—արավոտյան և ցերեկային ժամերին:',
      'Գրանցումը բացվում է մայիս սկզբին: Կապվեք ձեր մասնաճյուգի հետ կամ լրացրեք կոնտակտային ձևը տեղը պահելու համար:',
    ],
  },
  {
    slug: 'achievement-awards',
    image: NEWS_IMAGE_2,
    overlay: NEWS_IMAGE_2_OVERLAY,
    dateEn: 'Apr 15, 2026',
    dateHy: '15 Ապր, 2026',
    dateColor: 'text-[#008236]',
    titleEn: 'Achievement Awards',
    titleHy: 'Հաջոեքության մրցանակաբաշխություն',
    excerptEn: 'Read more about this...',
    excerptHy: 'Կարդալ ավելին...',
    bodyEn: [
      'We celebrated our students’ achievements at the annual awards ceremony. Certificates were given for outstanding progress, perfect attendance, and top results in speaking competitions.',
      'Families joined us for an evening of speeches, performances, and congratulations. It was a wonderful reminder of how far our community has come together.',
      'Congratulations to all award winners — we are proud of every one of you.',
    ],
    bodyHy: [
      'Հաջոեքության մրցանակաբաշխության ժամանակ նշեղիրեքինք մեր աշակերտների հաջոեքությաները: Ուկայագրեր տրվել էին արտակարգ արաջքնթացի, կատարյալ հաճախելիության և խոսքի մրցույտների լավագույն արդյունքների համար:',
      'Ընտանիքները միացան մեզ մի երեկուանը—ելույթներըն, ներկայածումներըն և շնորհավորանքներըն: Դա հիանալի հիշելություն էր այն մասին, թե որքան հեորու ենքքեք միասին գնացել:',
      'Էնորհավորում ենք բոլոր մրցանակակիրներին — մենք հպարտ ենք ձեզնից յուրաքանչյուրոր:',
    ],
  },
  {
    slug: 'new-east-branch',
    image: NEWS_IMAGE_3,
    overlay: NEWS_IMAGE_3_OVERLAY,
    dateEn: 'Apr 1, 2026',
    dateHy: '1 Ապր, 2026',
    dateColor: 'text-[#8200db]',
    titleEn: 'New East Branch',
    titleHy: 'Նոր արեվելյան մասնաճյուգ',
    excerptEn: 'Read more about this...',
    excerptHy: 'Կարդալ ավելին...',
    imageClassName: 'object-cover object-bottom',
    bodyEn: [
      'Ilona English Centre is opening a new branch in the east of the city. The location offers modern classrooms, a comfortable waiting area, and easy access by public transport.',
      'Courses for children, teens, and adults will be available from day one. Our experienced teachers from other branches will lead the opening groups.',
      'Open house days are scheduled for the first week of April. Visit us to tour the space and meet the team.',
    ],
    bodyHy: [
      'Ilona English Centre-ը բացում է նոր մասնաճյուգ քաղաքի արեվելյան մասում: Տարացքը արաջարկում է անգամամբ դասարաններ, հարմար սպասման տարացք և խնդ մատչելի մատչելիություն հասարակական տրանսպորտով:',
      'Դասընթացներ երեխաների, դեղանուեանների և մեծահասակների համար հասանելի կլինեն արաջին օրից: Մեր ուրոխա ուսուցչները այլ մասնաճյուգերից կգեկավարեն բացման խմբերը:',
      'Բաց դրրների որերը նախատեսված է ապրիլի արաջին շաբաթվա համար: Այցելեք մեզ տարացքը դիտելու և թիմի հետ ծանոտանալու համար:',
    ],
  },
] as const;

export function getLandingBlogPost(slug: string): LandingBlogPost | undefined {
  return LANDING_BLOG_POSTS.find((post) => post.slug === slug);
}

export function getLandingBlogPostSlugs(): string[] {
  return LANDING_BLOG_POSTS.map((post) => post.slug);
}
