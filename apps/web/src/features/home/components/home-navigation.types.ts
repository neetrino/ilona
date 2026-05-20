export type NavItemKey =
  | 'navHome'
  | 'navAbout'
  | 'navCourses'
  | 'navTeachers'
  | 'navBranches'
  | 'navContact'
  | 'navBlog';

export interface NavItem {
  key: NavItemKey;
  hash: string;
}

export const HOME_NAV_ITEMS: NavItem[] = [
  { key: 'navHome', hash: '' },
  { key: 'navAbout', hash: '#about' },
  { key: 'navCourses', hash: '#courses' },
  { key: 'navTeachers', hash: '#teachers' },
  { key: 'navBranches', hash: '#branches' },
  { key: 'navContact', hash: '#contact' },
  { key: 'navBlog', hash: '#blog' },
];
