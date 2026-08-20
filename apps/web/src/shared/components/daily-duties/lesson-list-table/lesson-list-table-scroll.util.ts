import { PORTAL_CONTENT_SCROLL_ID } from '@/shared/lib/portal-mobile-layout';

const LIST_SCROLL_GAP_PX = 12;

function getScrollablePortal(): HTMLElement | null {
  const scroller = document.getElementById(PORTAL_CONTENT_SCROLL_ID);
  if (!scroller) return null;
  if (scroller.scrollHeight - scroller.clientHeight <= 1) return null;
  return scroller;
}

export function scrollElementToListStart(element: HTMLElement | null): void {
  if (!element) return;

  const scroller = getScrollablePortal();
  if (!scroller) {
    element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    return;
  }

  const top =
    element.getBoundingClientRect().top -
    scroller.getBoundingClientRect().top +
    scroller.scrollTop -
    LIST_SCROLL_GAP_PX;
  scroller.scrollTo({ top: Math.max(0, top), behavior: 'smooth' });
}
