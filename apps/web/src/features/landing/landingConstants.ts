import { LANDING_ASSETS } from './landingAssets';

export const BUTTON_HOVER_CLASS =
  'transition-transform duration-200 ease-out hover:-translate-y-1';

export const CONTACT_PHONE = '+37493462061';
export const CONTACT_PHONE_DISPLAY = '+374 (93) 462-061';
export const CONTACT_EMAIL = 'ilona.ed.centre@gmail.com';

export const HERO_PERSON_IMAGE = LANDING_ASSETS.heroPerson;
export const HERO_UK_BADGE_IMAGE = LANDING_ASSETS.heroUkBadge;
export const HERO_US_BADGE_IMAGE = LANDING_ASSETS.heroUsBadge;
export const ABOUT_BIG_BEN_IMAGE = LANDING_ASSETS.aboutBigBen;
export const ABOUT_FLAG_IMAGE = LANDING_ASSETS.aboutFlag;
export const ABOUT_SUCCESS_ICON = LANDING_ASSETS.aboutSuccessIcon;
export const ABOUT_BRANCHES_ICON = LANDING_ASSETS.aboutBranchesIcon;
export const WHY_METHODS_IMAGE = LANDING_ASSETS.whyMethods;
export const WHY_RESULTS_IMAGE = LANDING_ASSETS.whyResults;
export const WHY_TEACHERS_IMAGE = LANDING_ASSETS.whyTeachers;
export const WHY_SCHEDULE_IMAGE = LANDING_ASSETS.whySchedule;
export const WHY_PLATFORM_IMAGE = LANDING_ASSETS.whyPlatform;
export const STUDENT_SUCCESS_IMAGE = LANDING_ASSETS.studentSuccess;
export const REGISTER_ARROW_IMAGE = LANDING_ASSETS.registerArrow;
export const BRANCH_CLASSROOM_IMAGE = '/branch-classroom-main.webp';
export const BRANCH_SIDE_IMAGE = BRANCH_CLASSROOM_IMAGE;
export const BRANCH_CENTER_IMAGE = BRANCH_CLASSROOM_IMAGE;
export const BRANCH_CENTER_IMAGE_ALT = BRANCH_CLASSROOM_IMAGE;
export const BRANCH_NAV_ARROW = LANDING_ASSETS.branchNavArrow;
export const TEAM_CHECK_ICON = LANDING_ASSETS.teamCheckIcon;
export const NEWS_IMAGE_1 = LANDING_ASSETS.newsImage1;
export const NEWS_IMAGE_1_OVERLAY = LANDING_ASSETS.newsImage1Overlay;
export const NEWS_IMAGE_2 = LANDING_ASSETS.newsImage2;
export const NEWS_IMAGE_2_OVERLAY = LANDING_ASSETS.newsImage2Overlay;
export const NEWS_IMAGE_3 = LANDING_ASSETS.newsImage3;
export const NEWS_IMAGE_3_OVERLAY = LANDING_ASSETS.newsImage3Overlay;
export const NEWS_ARROW_ICON = LANDING_ASSETS.newsArrowIcon;
export const FAQ_DROPDOWN_ICON = LANDING_ASSETS.faqDropdownIcon;
export const FOOTER_LOGO_IMAGE = LANDING_ASSETS.footerLogo;
export const FOOTER_FLAG_USA = LANDING_ASSETS.footerFlagUsa;
export const FOOTER_FLAG_UK = LANDING_ASSETS.footerFlagUk;

export const BRANCH_CAROUSEL_ITEMS = [
  {
    shortLabel: 'Andranik 40',
    shortLabelHy: 'Անդրանիկի 40',
    branchName: 'Andranik Branch',
    branchNameHy: 'Անդրանիկի մասնաճյուղ',
    address: '40 Zoravar Andranik Street, Yerevan',
    addressHy: 'Զորավար Անդրանիկի 40, Երևան',
    image: BRANCH_CENTER_IMAGE,
    mapUrl: 'https://maps.google.com/?q=40+Zoravar+Andranik+Street,+Yerevan',
  },
  {
    shortLabel: 'Hanrapetutyan 67/3',
    shortLabelHy: 'Հանրապետության 67/3',
    branchName: 'Hanrapetutyan Branch',
    branchNameHy: 'Հանրապետության մասնաճյուղ',
    address: '67/3 Hanrapetutyan Street, Yerevan',
    addressHy: 'Հանրապետության 67/3, Երևան',
    image: BRANCH_CENTER_IMAGE_ALT,
    mapUrl: 'https://maps.google.com/?q=67/3+Hanrapetutyan+Street,+Yerevan',
  },
  {
    shortLabel: 'Ervand Qochar 23/2',
    shortLabelHy: 'Երվանդ Քոչարի 23/2',
    branchName: 'Ervand Qochar Branch',
    branchNameHy: 'Երվանդ Քոչարի 23/2',
    address: '23/2 Ervand Qochar Street, Yerevan',
    addressHy: 'Երվանդ Քոչարի 23/2',
    image: BRANCH_SIDE_IMAGE,
    mapUrl: 'https://maps.google.com/?q=23/2+Ervand+Qochar+Street,+Yerevan',
  },
  {
    shortLabel: 'Z. Andranik 131/8',
    shortLabelHy: 'Անդրանիկի 131/8',
    branchName: 'Zoravar Andranik Branch',
    branchNameHy: 'Զորավար Անդրանիկի մասնաճյուղ',
    address: '131/8 Zoravar Andranik Street, Yerevan',
    addressHy: 'Զորավար Անդրանիկի 131/8',
    image: BRANCH_CENTER_IMAGE,
    mapUrl: 'https://maps.google.com/?q=131/8+Zoravar+Andranik+Street,+Yerevan',
  },
] as const;
