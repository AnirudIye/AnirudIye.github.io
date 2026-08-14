/* Button and link interactions.

   What this deliberately is not. The generated house style for a button is
   some combination of hover:scale-105, a shadow-lg lift, translateY(-2px),
   a background fade on an untouched token, and a gradient shine sweep. On
   GitHub, hover:scale-105 alone runs to millions of files. None of them are
   here, and the two that would look worst on this page are the lift and the
   glow: a drop shadow needs a light source, and on a #081119 ground there
   isn't one, so it renders as grey mud rather than elevation.

   The hover work is CSS. It is compositor-driven, it survives a busy main
   thread, and it still does something if this file never loads. JavaScript
   is only used where CSS genuinely cannot reach: particles emitted from the
   exact pointer coordinate, and a label that reports what it just did.

   Three effects, all drawn from the terminal the rest of the page is built
   around rather than from a component library:

   1. Caret sweep. A block cursor runs through a monospace label, inverting
      each character for about 90ms as it passes. This only works cleanly in
      a monospace face, because the per-character backgrounds tile edge to
      edge with no gaps and no reflow. In a proportional font it looks
      broken, which is exactly why it reads as built for this page.

   2. Border trace. On hover an underline grows out from bottom-left, turns
      the corner, and closes the frame. For the first third it reads as an
      ordinary editorial underline before it reveals itself.

   3. Glyph burst. Mousedown fires a handful of monospace glyphs out of the
      pointer, shrinking as they go. React Bits' ClickSpark does this with
      line segments rather than dots; glyphs carry the same idea further
      into this page's vocabulary. Ellipse rather than circle, because a
      circular burst sits oddly under a wide button. */

(function () {
  'use strict';

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function all(selector) {
    return Array.prototype.slice.call(document.querySelectorAll(selector));
  }

  /* Caret sweep.

     Splits into per-character spans and hands the index to CSS as --i, so
     the keyframe delay staggers without a timer. Not using anime's
     splitText here: it appends a visually hidden copy of the full string
     for screen readers, which means reading textContent afterwards returns
     the label twice. These labels get read back elsewhere, so the split
     stays hand-rolled and the original text is preserved on a data
     attribute before anything is touched. */
  function caretSweep() {
    all('[data-sweep]').forEach(function (el) {
      var text = el.textContent;
      if (!text || el.dataset.swept) return;

      el.dataset.label = text;
      el.dataset.swept = '1';

      if (reduced) return;

      var frag = document.createDocumentFragment();
      for (var i = 0; i < text.length; i++) {
        var span = document.createElement('span');
        span.className = 'swept-char';
        span.style.setProperty('--i', i);
        /* A collapsed space would break the tiling, so spaces get held
           open rather than rendered as an empty inline box. */
        span.textContent = text[i] === ' ' ? ' ' : text[i];
        frag.appendChild(span);
      }

      el.textContent = '';
      el.appendChild(frag);
    });
  }

  /* Border trace. The frame is injected rather than written into the markup
     so the buttons stay plain anchors and buttons in the HTML. */
  function borderTrace() {
    if (reduced) return;

    all('[data-trace]').forEach(function (el) {
      if (el.querySelector('.trace')) return;

      var ns = 'http://www.w3.org/2000/svg';
      var svg = document.createElementNS(ns, 'svg');
      svg.setAttribute('class', 'trace');
      svg.setAttribute('viewBox', '0 0 100 40');
      svg.setAttribute('preserveAspectRatio', 'none');
      svg.setAttribute('aria-hidden', 'true');

      /* Starts at bottom-left and runs right, so the first stretch reads as
         an underline before it turns the corner. */
      var path = document.createElementNS(ns, 'path');
      path.setAttribute('d', 'M0,39.5 H99.5 V0.5 H0.5 V39.5');
      /* non-scaling-stroke keeps the hairline a hairline: without it,
         preserveAspectRatio="none" stretches the 1px stroke into a wedge
         that is thick on the horizontals and thin on the verticals. */
      path.setAttribute('vector-effect', 'non-scaling-stroke');
      /* Normalises the path to a length of 1 so the dash offset is a plain
         0 to 1 in CSS, with no need to measure the real length in JS. */
      path.setAttribute('pathLength', '1');

      svg.appendChild(path);
      el.appendChild(svg);
    });
  }

  /* Glyph burst. anime.js earns its place here: the particles start from
     the exact pointer coordinate, which CSS has no way to know. */
  function glyphBurst() {
    if (reduced || !window.anime) return;

    var animate = anime.animate;
    var stagger = anime.stagger;
    var glyphs = ['+', '>', '_', '/', '*'];

    all('[data-burst]').forEach(function (el) {
      el.addEventListener('pointerdown', function (event) {
        var box = el.getBoundingClientRect();
        var originX = event.clientX - box.left;
        var originY = event.clientY - box.top;

        var count = 10;
        var nodes = [];
        var vectors = [];

        for (var i = 0; i < count; i++) {
          var node = document.createElement('span');
          node.className = 'tick';
          node.textContent = glyphs[i % glyphs.length];
          node.style.left = originX + 'px';
          node.style.top = originY + 'px';
          el.appendChild(node);
          nodes.push(node);

          var angle = (i / count) * Math.PI * 2 + (Math.random() - 0.5) * 0.5;
          var distance = 22 + Math.random() * 26;
          vectors.push({
            x: Math.cos(angle) * distance,
            /* Flattened on y so the burst is an ellipse. A circle looks
               wrong escaping a wide, short button. */
            y: Math.sin(angle) * distance * 0.7
          });
        }

        animate(nodes, {
          x: function (target, i) { return vectors[i].x; },
          y: function (target, i) { return vectors[i].y; },
          opacity: [{ to: 1, duration: 1 }, { to: 0, duration: 260, delay: 90 }],
          scale: [{ to: 1, duration: 1 }, { to: 0.6, duration: 340 }],
          duration: 420,
          /* Front-loaded, so it reads as an impact rather than a drift. */
          ease: 'outExpo',
          delay: stagger(12, { from: 'center' }),
          onComplete: function () {
            nodes.forEach(function (node) { node.remove(); });
          }
        });
      });
    });
  }

  caretSweep();
  borderTrace();
  glyphBurst();
})();
