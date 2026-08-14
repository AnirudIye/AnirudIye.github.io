/* Section motion. anime.js 4.5.0, vendored in ./vendor.

   Everything scroll-linked here is scrubbed, not triggered, and that is the
   whole design. A triggered reveal owns a duration, so it makes the reader
   wait for content that is already on screen; Nielsen Norman measured people
   complaining about exactly that, and found anything over 500ms reads as slow.
   A scrubbed animation has no duration of its own. It is a function of scroll
   position, so it can never delay anyone, and scrolling back runs it backwards.

   The work section is the one piece of motion here that is not scroll-linked
   at all, and it follows from the same reasoning rather than contradicting it.
   Its cards are the reason this page exists and they sit below the fold on a
   laptop, so anything scroll-linked leaves them unfinished for a reader who
   does not scroll. They are therefore fully drawn at first paint and plot()
   runs a load-time entrance over the top of them, decorating content that is
   already legible instead of gating it.

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
     - Stagger by position, not by DOM index. The work deposits are timed
       from measured geometry, so they follow the thing crossing them; index
       order is not a direction and would only look like one by accident.

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
     have landed, and Archivo swapping in moves every heading and paragraph on
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
     Pass debug: true to any scroll() below to draw the rulers.

     No observer passes an explicit target. In 4.5.0 doing so makes
     refresh() throw on a null internal reference, whether the target is a
     selector or a resolved element; omitting it is the only form that
     survives a refresh. It also happens to be the right scope here, since
     each observer then measures the very elements it animates. */

  /* Section headings: characters rise out of a clip mask.

     splitText's wrap:'clip' builds the overflow wrapper per character, which
     is the mask. The travel is 110%, a full character height, so a letter is
     either in place or entirely behind the edge. sync 0.4 lets the letters
     lag the scroll slightly, which reads as weight rather than lag. */
  function headings() {
    /* The particled heading renders itself, and the work heading is typeset
       by the plot sequence below on its own clock; giving either a mask wipe
       too would be two treatments fighting over one element. */
    all('h2:not([data-particles]):not([data-plot])').forEach(function (el) {
      var split = splitText(el, { chars: { wrap: 'clip' }, accessible: true });

      animate(split.chars, {
        y: ['110%', '0%'],
        ease: 'out(2)',
        delay: stagger(38),
        autoplay: scroll({
          enter: 'bottom top',
          leave: 'center top',
          sync: 0.4
        })
      });
    });
  }

  /* The work section: a plot pass over cards that are already legible.

     This is the one entrance on the page that is triggered rather than
     scrubbed, and it is worth being precise about why that is allowed here.
     The rule at the top of this file exists so a reader is never made to wait
     for something already on screen. Nothing here waits: both project cards
     are fully rendered at frame one and stay that way at every scroll
     position, and what plays over them is decoration. The clip wipe this
     replaced had them roughly 91% and 100% clipped at scrollY 0 on a 1440x900
     viewport, so a recruiter who did not scroll read two slivers of the only
     thing on the page worth reading.

     The conceit is a sheet coming off a plotter. Registration marks land on
     the card corners, a plotter head runs down the sheet, and every element it
     crosses is deposited in amber and settles into its resting colour behind
     it. One idea with synchronised parts rather than four unrelated effects,
     which is what keeps it from reading as busy.

     The deposits are timed from where the bar actually is instead of from
     offsets picked by hand. That is what makes the sequence look engineered,
     and it stays correct when a card changes height or the copy grows.

     All of it is gated on document.fonts.ready, because every offset below is
     measured and Archivo swapping in moves all of them. */
  function plot() {
    var section = document.querySelector('.work');
    var list = all('.project');
    if (!section || !list.length) return;

    var ns = 'http://www.w3.org/2000/svg';
    var scanStart = 320;
    var scanTravel = 760;
    /* Card 2 runs behind card 1 by this much, so the pair reads as a sweep
       across the row rather than as one doubled animation. */
    var cardOffset = 160;

    function bracket(corner) {
      var el = document.createElementNS(ns, 'svg');
      el.setAttribute('class', 'plot-mark plot-mark-' + corner);
      el.setAttribute('viewBox', '0 0 14 14');
      el.setAttribute('aria-hidden', 'true');

      var path = document.createElementNS(ns, 'path');
      path.setAttribute('d', 'M0.5 13.5 V0.5 H13.5');
      /* Same pair the border trace uses: pathLength normalises the draw to a
         plain 0 to 1, and non-scaling-stroke keeps the hairline a hairline. */
      path.setAttribute('pathLength', '1');
      path.setAttribute('vector-effect', 'non-scaling-stroke');

      el.appendChild(path);
      return el;
    }

    /* The moment the bar's line actually reaches the middle of el, in ms from
       the sequence start.

       The obvious form of this divides the element's centre by the card height
       and multiplies by the travel time, which is what a bar moving at a
       constant rate would do. This one is eased inOut(2), so that estimate
       runs early through the first half of the pass and badly late through the
       second, which is exactly where the stack chips sit. Measured on the live
       page it put card one's chips 133ms behind the line and started card
       two's whole cascade after the bar had already faded out. Inverting the
       ease is the difference between deposits that land under the line and
       deposits that trail it.

       lead is the distance from the bar's transform origin down to the amber
       hairline along its bottom edge, so the timing follows the edge the
       reader is actually watching rather than the top of an invisible box.

       offsetTop resolves against .project because styles.css positions the
       card, which is what that rule is there for. */
    function crossAt(el, cardHeight, lead, cardStart) {
      var reach = (el.offsetTop + el.offsetHeight / 2 - lead) / cardHeight;
      var progress;

      if (reach <= 0) progress = 0;
      else if (reach >= 1) progress = 1;
      /* Inverse of inOut(2), which is 2p^2 up to the midpoint and
         1 - 2(1 - p)^2 after it. */
      else if (reach < 0.5) progress = Math.sqrt(reach / 2);
      else progress = 1 - Math.sqrt((1 - reach) / 2);

      return cardStart + scanStart + progress * scanTravel;
    }

    function sequence() {
      var heading = section.querySelector('h2');
      if (heading) {
        var split = splitText(heading, { chars: { wrap: 'clip' }, accessible: true });

        animate(split.chars, {
          y: ['110%', '0%'],
          ease: 'out(2)',
          duration: 540,
          delay: stagger(30)
        });
      }

      list.forEach(function (card, index) {
        /* Measured before anything is injected, and nothing below can be
           timed against a card of no height. */
        var cardHeight = card.offsetHeight;
        if (!cardHeight) return;

        var cardStart = index * cardOffset;

        if (svg && svg.createDrawable) {
          var paths = ['tl', 'tr', 'br', 'bl'].map(function (corner) {
            var el = bracket(corner);
            card.appendChild(el);
            return el.firstChild;
          });

          animate(svg.createDrawable(paths), {
            draw: ['0 0', '0 1'],
            ease: 'out(2)',
            duration: 340,
            delay: stagger(40, { start: cardStart + 200 })
          });
        }

        var bar = document.createElement('div');
        bar.className = 'plot-scan';
        bar.setAttribute('aria-hidden', 'true');
        card.appendChild(bar);

        /* Read off the element rather than restated here, so the stylesheet
           stays the only place the head's size is set. */
        var lead = bar.offsetHeight - 1;

        animate(bar, {
          y: [0, cardHeight],
          /* Held at full for most of the pass and faded only at the end, so
             the head neither pops into existence nor snaps off the bottom
             edge of the card. */
          opacity: [{ to: 1, duration: 1 }, { to: 1, duration: 620 }, { to: 0, duration: 140 }],
          ease: 'inOut(2)',
          duration: scanTravel,
          delay: cardStart + scanStart,
          /* It has no job once it has passed, and leaving it parked at the
             bottom of the card would sit under the next hover. */
          onComplete: function () { bar.remove(); }
        });

        /* The deposits. Every "to" is the colour the stylesheet already
           holds, so the pass settles back into the resting state.

           Written in the comma form of rgb() rather than the space-separated
           form the stylesheet uses: anime 4.5.0 matches colours with
           comma-only regexes and throws on the modern syntax. Same colours,
           parser-legible spelling.

           Each one then hands the property back. anime writes what it
           animates as an inline style and leaves it there, and settling on
           the right value is not the same as leaving the element alone. Two
           things break if it stays. An inline colour outranks every selector
           without !important, so .live:hover would stop going amber, and
           these are the only two links to the shipped work. And the palette
           stops being three edits: retuning --sunken or --trace would no
           longer reach an element pinned to the value it happened to have.
           Removing the property restores the stylesheet's own value exactly,
           which is verifiable: the computed colour does not change. */
        function deposit(el, params, property) {
          params.onComplete = function () { el.style.removeProperty(property); };
          animate(el, params);
        }

        var shot = card.querySelector('.shot');
        if (shot) {
          deposit(shot, {
            borderColor: ['rgba(224, 160, 60, 0.5)', 'rgba(219, 228, 234, 0.16)'],
            duration: 420,
            delay: crossAt(shot, cardHeight, lead, cardStart)
          }, 'border-color');
        }

        var live = card.querySelector('.live');
        if (live) {
          deposit(live, {
            color: ['rgb(224, 160, 60)', 'rgb(82, 182, 196)'],
            duration: 320,
            delay: crossAt(live, cardHeight, lead, cardStart)
          }, 'color');
        }

        /* Timed off the row rather than off its first chip, so the start
           still lands under the bar when the chips wrap on a narrow screen.
           The 44ms stagger is the beat that carries the whole sequence: the
           chips light one after another as the bar crosses them.

           onComplete fires once for the whole set rather than per chip, so
           this clears all of them. */
        var stack = card.querySelector('.stack');
        var chips = stack ? Array.prototype.slice.call(stack.children) : [];
        if (chips.length) {
          animate(chips, {
            backgroundColor: ['rgba(224, 160, 60, 0.22)', '#142430'],
            duration: 300,
            delay: stagger(44, { start: crossAt(stack, cardHeight, lead, cardStart) }),
            onComplete: function () {
              chips.forEach(function (chip) { chip.style.removeProperty('background-color'); });
            }
          });
        }
      });
    }

    /* threshold 0, fired once. On a laptop .work is already intersecting at
       load, so this runs immediately, which is the whole point: the builds
       draw themselves without the reader doing anything. On a short or mobile
       viewport it waits until they arrive. Either way it never runs twice, so
       scrolling back finds the cards as it left them. */
    function arm() {
      if (!window.IntersectionObserver) {
        sequence();
        return;
      }

      var observer = new IntersectionObserver(function (entries) {
        for (var i = 0; i < entries.length; i++) {
          if (!entries[i].isIntersecting) continue;
          observer.disconnect();
          sequence();
          return;
        }
      }, { threshold: 0 });

      observer.observe(section);
    }

    if (document.fonts && document.fonts.ready) document.fonts.ready.then(arm);
    else arm();
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
        enter: 'bottom top',
        leave: 'center center',
        sync: true
      })
    });
  }

  headings();
  plot();
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
