/* Text effects: the name draws itself, and one phrase in the lede rotates.

   Both are ports of React Bits components, rebuilt in plain JS and CSS
   because this site has no build step and no React.

   StrokeText there is GSAP driving stroke-dashoffset per character plus a
   clipPath rect that grows to wipe the fill in. None of that needs a
   library: give each character its index as --i and CSS transition delays
   do the stagger, and a clip-path inset does the wipe. GSAP's power2.out is
   a cubic out, which is cubic-bezier(.33, 1, .68, 1).

   RotatingText there is framer-motion, using a spring at stiffness 300 and
   damping 25. With mass 1 that is a damping ratio of 25 / (2 * sqrt(300)),
   about 0.72, so it is underdamped and overshoots roughly 4% before it
   settles near 380ms. cubic-bezier(.22, 1.2, .36, 1) over 400ms is visually
   the same thing at this size, and the 1.2 control point is where the
   overshoot comes from.

   Both effects live inside the terminal, which starts as [hidden] while the
   command types. A hidden subtree has no layout, so getBBox and
   getBoundingClientRect both return zero there, which silently produces a
   0x0 viewBox and a 0px-wide rotator. Everything measurable is therefore
   deferred until the reveal actually lands. */

(function () {
  'use strict';

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var SVG_NS = 'http://www.w3.org/2000/svg';

  /* Runs fn once the terminal has revealed its output, or straight away if
     it already has. */
  function whenRevealed(fn) {
    var reveal = document.getElementById('reveal');
    if (!reveal || !reveal.hidden) { fn(); return; }

    new MutationObserver(function (records, observer) {
      if (!reveal.hidden) {
        observer.disconnect();
        fn();
      }
    }).observe(reveal, { attributes: true, attributeFilter: ['hidden'] });
  }

  /* The name, drawn.

     Two overlaid copies of the text in one SVG: a stroked copy whose
     dashoffset runs to zero character by character, and a filled copy
     revealed by a clip-path wipe once the outline is most of the way in.

     Two copies is inherent to the effect, and it does mean the string sits
     in the DOM twice. The heading therefore carries an explicit aria-label
     and the SVG is aria-hidden, so the accessible name is the string once,
     correctly, rather than whatever the duplication would otherwise read as. */
  function strokeName() {
    var h1 = document.querySelector('.term-reveal h1');
    if (!h1 || h1.dataset.stroked) return;

    var text = h1.textContent.trim();
    if (!text) return;

    h1.dataset.stroked = '1';
    h1.setAttribute('aria-label', text);

    if (reduced) return;

    var svg = document.createElementNS(SVG_NS, 'svg');
    svg.setAttribute('class', 'stroke-name');
    svg.setAttribute('aria-hidden', 'true');

    function build(cls) {
      var node = document.createElementNS(SVG_NS, 'text');
      node.setAttribute('class', cls);
      node.setAttribute('x', '0');
      node.setAttribute('y', '0.82em');
      for (var i = 0; i < text.length; i++) {
        var tspan = document.createElementNS(SVG_NS, 'tspan');
        tspan.style.setProperty('--i', i);
        tspan.textContent = text[i];
        node.appendChild(tspan);
      }
      return node;
    }

    var outline = build('sn-stroke');
    var fill = build('sn-fill');
    svg.appendChild(outline);
    svg.appendChild(fill);

    h1.textContent = '';
    h1.appendChild(svg);

    /* The viewBox has to be measured, and measured against the real font.
       Archivo is materially narrower than the fallback, so fitting this
       before the webfont lands leaves the box too wide. */
    function fit() {
      var box = outline.getBBox();
      if (!box.width) return false;

      var pad = box.height * 0.14;
      var w = box.width + pad * 2;
      var h = box.height + pad * 2;

      svg.setAttribute('viewBox', [
        (box.x - pad).toFixed(1),
        (box.y - pad).toFixed(1),
        w.toFixed(1),
        h.toFixed(1)
      ].join(' '));

      /* Size it to the measurement rather than letting it fill the column.
         SVG user units are CSS pixels here, so pinning width and height to
         the box renders the name at the 46px it is set in. Left to
         width:100% it stretches to the container and the name comes out
         near 80px, which is not the size anything else was drawn against.
         max-width in the stylesheet still lets it shrink on narrow screens. */
      svg.style.width = w.toFixed(1) + 'px';
      svg.style.height = h.toFixed(1) + 'px';
      return true;
    }

    fit();
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(fit);
    window.addEventListener('resize', fit);

    /* Draw on the next frame so the transition has a start state to move
       away from; setting both ends in one frame skips the animation. */
    requestAnimationFrame(function () {
      requestAnimationFrame(function () { svg.classList.add('is-drawn'); });
    });
  }

  /* One rotating phrase in the lede.

     The outgoing word leaves upward and the incoming one arrives from
     below, so it reads as a single column of type advancing rather than a
     crossfade. The container width animates with it, which is the detail
     that keeps the rest of the sentence still; without it the effect is
     unusable mid-paragraph. */
  function rotatingPhrase() {
    var host = document.querySelector('[data-rotate]');
    if (!host || host.dataset.rotating) return;

    var phrases;
    try {
      phrases = JSON.parse(host.dataset.rotate);
    } catch (err) {
      return;
    }
    if (!phrases || phrases.length < 2) return;

    host.dataset.rotating = '1';

    var current = document.createElement('span');
    current.className = 'rot-word';
    current.textContent = phrases[0];

    /* Screen readers get the full set once, since hearing a single word
       swap itself every few seconds conveys nothing. */
    var reader = document.createElement('span');
    reader.className = 'sr-only';
    reader.textContent = phrases.join(', ');

    host.textContent = '';
    host.appendChild(reader);
    host.appendChild(current);

    function measure(word) {
      var probe = document.createElement('span');
      probe.className = 'rot-word rot-probe';
      probe.textContent = word;
      host.appendChild(probe);
      var width = probe.getBoundingClientRect().width;
      probe.remove();
      return width;
    }

    function sizeTo(word) {
      var width = measure(word);
      if (width) host.style.width = width + 'px';
    }

    sizeTo(phrases[0]);
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(function () { sizeTo(current.textContent); });
    }

    if (reduced) return;

    var index = 0;

    setInterval(function () {
      /* Skip while backgrounded, otherwise the phrase advances unseen and
         the visitor returns to a half-finished transition. */
      if (document.hidden) return;

      index = (index + 1) % phrases.length;
      var next = phrases[index];

      var incoming = document.createElement('span');
      incoming.className = 'rot-word is-entering';
      incoming.textContent = next;
      host.appendChild(incoming);

      sizeTo(next);
      current.classList.add('is-leaving');

      /* Force layout so the entering position is committed before the
         class that animates away from it lands in the same frame. */
      void incoming.offsetWidth;
      incoming.classList.remove('is-entering');

      var leaving = current;
      current = incoming;
      setTimeout(function () { leaving.remove(); }, 460);
    }, 2600);
  }

  /* Particle text.

     React Bits builds this by drawing the string to an offscreen canvas,
     reading it back with getImageData, and turning every pixel above an
     alpha threshold into a particle target. That part is already
     framework-free, so it ports directly.

     The randomness is seeded rather than Math.random, exactly as the
     original does it, so the same heading scatters the same way on every
     load instead of shimmering differently each time. */
  function particleText(el) {
    if (!el || el.dataset.particled) return;
    el.dataset.particled = '1';

    var text = el.textContent.trim();
    if (!text || reduced) return;

    var style = window.getComputedStyle(el);
    var font = style.fontWeight + ' ' + style.fontSize + ' ' + style.fontFamily;

    var canvas = document.createElement('canvas');
    canvas.className = 'particle-text';
    canvas.setAttribute('aria-hidden', 'true');
    var ctx = canvas.getContext('2d');

    /* The real text stays in the DOM and keeps its box, so the heading is
       still a heading to a crawler and a screen reader. It is only made
       transparent, not removed, which also means the layout below does not
       depend on the canvas at all. */
    el.classList.add('is-particled');
    el.appendChild(canvas);

    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var particles = [];
    var w = 0;
    var h = 0;
    var started = null;

    function sample() {
      var box = el.getBoundingClientRect();
      w = Math.max(1, Math.round(box.width));
      h = Math.max(1, Math.round(box.height));

      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      canvas.style.width = w + 'px';
      canvas.style.height = h + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      var off = document.createElement('canvas');
      off.width = w;
      off.height = h;
      var octx = off.getContext('2d');
      octx.font = font;
      octx.textBaseline = 'middle';
      octx.fillStyle = '#fff';
      octx.fillText(text, 0, h / 2);

      var data = octx.getImageData(0, 0, w, h).data;
      /* Sampling stride. The original ships 4, which suits the display
         sizes it is demoed at; at a section-heading size that lands about
         one particle per stroke and the letterforms stop being readable.
         2 is the coarsest stride that still resolves a stem. */
      var step = 2;
      var targets = [];
      for (var y = 0; y < h; y += step) {
        for (var x = 0; x < w; x += step) {
          if (data[(y * w + x) * 4 + 3] > 40) targets.push({ x: x, y: y });
        }
      }

      particles = targets.map(function (target, i) {
        /* The original's seeded pseudo-random, kept verbatim so the
           scatter is stable across reloads. */
        var seed = ((i * 9301 + 49297) % 233280) / 233280;
        var angle = seed * Math.PI * 2;
        var radius = 60 + seed * 120;
        return {
          x: target.x + Math.cos(angle) * radius,
          y: target.y + Math.sin(angle) * radius,
          tx: target.x,
          ty: target.y,
          seed: seed,
          delay: seed * 420
        };
      });
    }

    function easeOutCubic(t) { return 1 - Math.pow(1 - t, 3); }

    function draw(now) {
      if (started === null) started = now;
      var elapsed = now - started;

      ctx.clearRect(0, 0, w, h);

      for (var i = 0; i < particles.length; i++) {
        var p = particles[i];
        var local = Math.max(0, Math.min(1, (elapsed - p.delay) / 1600));
        var eased = easeOutCubic(local);

        var x = p.x + (p.tx - p.x) * eased;
        var y = p.y + (p.ty - p.y) * eased;

        /* Once gathered they breathe rather than freezing, which is what
           stops it looking like a still image of a heading. */
        if (local >= 1) {
          var drift = elapsed / 1000;
          x += Math.sin(drift * 0.9 + p.seed * 10) * 0.7;
          y += Math.cos(drift * 0.7 + p.seed * 8) * 0.5;
        }

        ctx.globalAlpha = Math.min(1, 0.35 + eased * 0.65);
        ctx.fillStyle = p.seed > 0.82 ? '#e0a03c' : '#dbe4ea';
        /* fillRect rather than arc: at two pixels the shape is
           indistinguishable and the cost is not. */
        ctx.fillRect(x, y, 2, 2);
      }
      ctx.globalAlpha = 1;
    }

    sample();
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(sample);

    var running = false;
    function frame(now) {
      requestAnimationFrame(frame);
      if (!running || document.hidden) return;
      draw(now);
    }

    /* Gathers when it first arrives, not on load, so the effect is seen. */
    if (window.IntersectionObserver) {
      new IntersectionObserver(function (entries) {
        running = entries[0].isIntersecting;
        if (running && started === null) started = performance.now();
      }, { threshold: 0.25 }).observe(el);
    } else {
      running = true;
    }

    requestAnimationFrame(frame);
  }

  whenRevealed(function () {
    strokeName();
    rotatingPhrase();
  });

  particleText(document.querySelector('[data-particles]'));
})();
