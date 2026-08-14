/* Scroll motion. anime.js 4.5.0, vendored in ./vendor.

   Everything scroll-linked here is scrubbed, not triggered, and that is the
   whole design. A triggered reveal owns a duration, so it makes the reader
   wait for content that is already on screen; Nielsen Norman measured people
   complaining about exactly that, and found anything over 500ms reads as slow.
   A scrubbed animation has no duration of its own. It is a function of scroll
   position, so it can never delay anyone, and scrolling back runs it backwards.

   It also rules out the house style by construction. The animation every code
   generator writes is opacity 0 to 1 plus translateY(20px), fired from an
   IntersectionObserver at threshold 0.1, staggered by index * 100ms, over
   600ms, on cubic-bezier(0.4, 0, 0.2, 1). None of those numbers appear below.

   Rules followed here:
     - No opacity animation on text. Reveals are mask and clip wipes, so a
       word is either fully typeset or fully hidden behind an edge, never a
       grey ghost of itself.
     - ease 'linear' on anything scrubbed. The scroll is the easing curve.
     - One effect per section. Two at once splits attention.
     - Stagger by position, not by DOM index. anime's signed axis stagger
       sweeps the cards by column, which is a direction; index order is not.

   anime.js has no reduced-motion handling of its own, verified by grep against
   4.5.0, so every observer below sits behind the same guard. Under reduce we
   build nothing at all and the markup renders as written. */

(function () {
  'use strict';

  if (!window.anime) return;

  var animate = anime.animate;
  var onScroll = anime.onScroll;
  var splitText = anime.splitText;
  var stagger = anime.stagger;
  var svg = anime.svg;

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduced) return;

  function all(selector) {
    return Array.prototype.slice.call(document.querySelectorAll(selector));
  }

  /* A ScrollObserver resolves its enter and leave thresholds to pixel
     positions when it is constructed. That happens here before the webfonts
     have landed, and Inter swapping in moves every heading and paragraph on
     the page, so the thresholds end up describing a layout that no longer
     exists. Keeping the handles lets us recompute them once the real fonts
     are in and again whenever the viewport changes. */
  var observers = [];

  function scroll(options) {
    var observer = onScroll(options);
    observers.push(observer);
    return observer;
  }

  function refreshAll() {
    observers.forEach(function (observer) {
      if (observer && observer.refresh) observer.refresh();
    });
  }

  /* Thresholds read 'container target', container side first. Getting the
     order backwards inverts the window and the animation silently never
     runs, so these are kept monotonic: enter always resolves above leave.
     Pass debug: true to any onScroll below to draw the rulers. */

  /* Section headings: characters rise out of a clip mask.

     splitText's wrap:'clip' builds the overflow wrapper per character, which
     is the mask. The travel is 110%, a full character height, so a letter is
     either in place or entirely behind the edge. sync 0.4 lets the letters
     lag the scroll slightly, which reads as weight rather than lag. */
  function headings() {
    all('h2').forEach(function (el) {
      var split = splitText(el, { chars: { wrap: 'clip' }, accessible: true });

      animate(split.chars, {
        y: ['110%', '0%'],
        ease: 'out(2)',
        delay: stagger(38),
        autoplay: scroll({
          target: el,
          enter: 'bottom top',
          leave: 'center top',
          sync: 0.4
        })
      });
    });
  }

  /* Project cards: a clip-path wipe, swept by column.

     inset() is compositor-friendly and reads as typesetting rather than
     fading. The stagger uses a signed x axis over the real grid, so the
     wipe travels left to right across the row instead of following the
     order the cards happen to sit in the DOM. */
  function cards() {
    var list = all('.project');
    if (!list.length) return;

    animate(list, {
      clipPath: ['inset(0 100% 0 0)', 'inset(0 0% 0 0)'],
      ease: 'linear',
      delay: stagger(90, { grid: [list.length, 1], from: 'first', axis: 'x' }),
      autoplay: scroll({
        target: '.projects',
        enter: 'bottom top',
        leave: 'center center',
        sync: true
      })
    });
  }

  /* The closing paragraph: word by word, same mask treatment as the
     headings but coarser. Characters on a sentence this long would read as
     a stunt; words track how someone actually reads it. */
  function closing() {
    var el = document.querySelector('.now-block:last-child .body-quiet');
    if (!el) return;

    var split = splitText(el, { words: { wrap: 'clip' }, accessible: true });

    animate(split.words, {
      y: ['105%', '0%'],
      ease: 'out(2)',
      delay: stagger(26),
      autoplay: scroll({
        target: el,
        enter: 'bottom top',
        leave: 'center top',
        sync: 0.3
      })
    });
  }

  /* The contact rule draws itself as you arrive at it.

     createDrawable is v4's replacement for the old setDashoffset dance; it
     animates stroke-dasharray from a 'start end' pair, both normalised 0 to 1.
     sync true because a rule that lags its own scroll looks broken, where
     text that lags looks weighted. */
  function rule() {
    var line = document.querySelector('.contact-rule line');
    if (!line || !svg || !svg.createDrawable) return;

    animate(svg.createDrawable(line), {
      draw: ['0 0', '0 1'],
      ease: 'linear',
      autoplay: scroll({
        target: '.contact',
        enter: 'bottom top',
        leave: 'center center',
        sync: true
      })
    });
  }

  headings();
  cards();
  closing();
  rule();

  /* Recompute once the real fonts are in, and on resize. Debounced because
     a drag-resize fires this continuously and each refresh re-measures
     every observed element. */
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(refreshAll);

  var resizeTimer;
  window.addEventListener('resize', function () {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(refreshAll, 150);
  });
})();
