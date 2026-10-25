// Illustrative photography for the homepage. None of these show the cafés
// listed in The Spot, so they are never used on café cards or detail pages.
// Unsplash photos are free to use under the Unsplash License
// (https://unsplash.com/license); credits are shown on the page anyway.

import heroWide from '../assets/photos/hero-wide.webp'
import heroTall from '../assets/photos/hero-tall.webp'
import calmInterior from '../assets/photos/calm-interior.webp'
import planStudy from '../assets/photos/plan-study.webp'
import planWork from '../assets/photos/plan-work.webp'
import planReunion from '../assets/photos/plan-reunion.webp'
import planSolo from '../assets/photos/plan-solo.webp'

function unsplash(name, url) {
  return { name, url, source: 'Unsplash' }
}

export const PHOTOS = {
  hero: {
    src: heroWide,
    width: 1600,
    height: 1000,
    // Taller crop for phones, so the room still fills the screen
    tallSrc: heroTall,
    tallWidth: 900,
    tallHeight: 1300,
    alt: 'Sunlit café with pendant lamps and wooden tables by a tall window',
    credit: unsplash('Nikita Pishchugin', 'https://unsplash.com/photos/cafe-interior-with-tables-and-chairs-near-window-B5giYHNQPvA'),
  },
  calm: {
    src: calmInterior,
    width: 1000,
    height: 1250,
    alt: 'Quiet café corner with wooden chairs, a round mirror and a soft pendant light',
    credit: unsplash('Kouji Tsuru', 'https://unsplash.com/photos/a-cozy-cafe-interior-with-warm-lighting-and-furniture-0i5clWZBit0'),
  },
  study: {
    src: planStudy,
    width: 800,
    height: 1000,
    alt: 'Café with tall wooden bookshelves and a long shared table',
    credit: unsplash('Raymond Yeung', 'https://unsplash.com/photos/a-library-themed-cafe-with-wooden-shelves-NtCXVLvJfdQ'),
  },
  work: {
    src: planWork,
    width: 800,
    height: 1000,
    alt: 'Two people working together on a laptop at a bright café table',
    credit: unsplash(
      'Chidera Faustina Okeke',
      'https://unsplash.com/photos/two-women-studying-together-at-a-table-with-laptop-2FDdgn0-W_o',
    ),
  },
  reunion: {
    src: planReunion,
    width: 1200,
    height: 720,
    alt: 'Four friends sharing coffee at a long wooden café table',
    credit: unsplash('Vitaly Gariev', 'https://unsplash.com/photos/four-friends-are-sitting-together-at-a-table-wAntJVFnMh8'),
  },
  solo: {
    src: planSolo,
    width: 800,
    height: 1000,
    alt: 'Close-up of someone reading a book in low, warm light',
    credit: unsplash('Ivan Le', 'https://unsplash.com/photos/a-person-reading-a-book-Z4LY9zQ3sIg'),
  },
  latte: {
    // The site's own photo, shared with the favicon in /public
    src: '/latte-art.jpg',
    width: 735,
    height: 713,
    alt: 'Latte art shaped like a heart and leaves',
    credit: { name: 'The Spot', url: null, source: null },
  },
}
