/* The ambient field.

   One effect, mounted three times at three strengths: behind the intro,
   behind the work section, and faintly behind the contact section. It is
   the page's single ambient signature, so it is placed by role rather than
   painted behind everything, and the sections that carry dense reading are
   left on clean ground.

   React Bits' Scanner is a WebGL2 fragment shader running through OGL, and
   47 of its 53 backgrounds are WebGL of one kind or another. Shipping a GL
   context and a shader compiler onto a page that is otherwise three files
   and no build step is the wrong trade, so Scanner is rebuilt here in
   canvas 2D.

   The approximation is cheap because the effect is fundamentally lines. The
   shader evaluates a band function per pixel; the same picture comes out of
   stroking about fifteen wavy polylines. The parts that carry the character
   are kept exactly:

     - the four-sine warp field, coefficients unchanged from the shader, so
       the lines ripple like contours rather than sitting flat
     - the travelling sweep envelope, one pass roughly every eight seconds,
       which is what makes it read as a scan rather than a pattern
     - the chromatic split, each line stroked three times at small offsets
       in cyan, amber and chalk, so edges shimmer through the palette

   Dropped: the diffuse haze term and the pointer sharpening, both of which
   need per-pixel evaluation to look right and neither of which survives at
   the opacity this sits at.

   The palette maps the original violet to pink to white onto this site's
   trace cyan to signal amber to chalk.

   Every mount stops when off screen or backgrounded, which the original
   also does and most of the library does not. */

(function () {
  'use strict';

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* Shared canvas setup. Device pixel ratio matters here: without it the
     hairlines are soft on a retina display, which is the single most common
     flaw in the canvas backgrounds this is drawn from. */
  function makeCanvas(host, className) {
    var canvas = document.createElement('canvas');
    canvas.className = className;
    canvas.setAttribute('aria-hidden', 'true');
    host.insertBefore(canvas, host.firstChild);

    var ctx = canvas.getContext('2d');
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var w = 0;
    var h = 0;

    function resize() {
      var box = host.getBoundingClientRect();
      w = Math.max(1, Math.round(box.width));
      h = Math.max(1, Math.round(box.height));
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      canvas.style.width = w + 'px';
      canvas.style.height = h + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    resize();
    if (window.ResizeObserver) new ResizeObserver(resize).observe(host);
    else window.addEventListener('resize', resize);

    return {
      ctx: ctx,
      canvas: canvas,
      width: function () { return w; },
      height: function () { return h; }
    };
  }

  /* One loop for the whole page. Every mount registers its host and its
     draw here, and a single frame chain walks the registry, so three fields
     cost one loop rather than three and they all share a clock. A host that
     is off screen and a tab that is in the background are skipped rather
     than drawn, so a field costs nothing while nobody can see it.

     One observer for all of them too: the registry entry is found by target,
     which is what the single-callback version could not do. */
  var mounts = [];
  var running = false;
  var start = null;
  var watcher = null;

  if (window.IntersectionObserver) {
    watcher = new IntersectionObserver(function (entries) {
      for (var i = 0; i < entries.length; i++) {
        for (var m = 0; m < mounts.length; m++) {
          if (mounts[m].host === entries[i].target) {
            mounts[m].onscreen = entries[i].isIntersecting;
          }
        }
      }
    });
  }

  function frame(now) {
    requestAnimationFrame(frame);
    if (document.hidden) return;
    if (start === null) start = now;

    var seconds = (now - start) / 1000;
    for (var i = 0; i < mounts.length; i++) {
      if (mounts[i].onscreen) mounts[i].draw(seconds);
    }
  }

  function register(host, draw) {
    mounts.push({ host: host, draw: draw, onscreen: true });
    if (watcher) watcher.observe(host);
    if (running) return;
    running = true;
    requestAnimationFrame(frame);
  }

  /* Scanner ------------------------------------------------------------ */

  var SCANNER = {
    speed: 0.5,
    sweepSpeed: 0.25,
    sweepWidth: 1.6,
    sweepFalloff: 6,
    scale: 1.5,
    frequency: 2,
    ripple: 0.22,
    bandDensity: 11,
    colorSpread: 0.7,
    segments: 46,
    channels: ['#52b6c4', '#e0a03c', '#dbe4ea']
  };

  /* The shader's signalField, coefficients unchanged. Four sines drifting
     against each other at unrelated rates, which is why the pattern never
     visibly repeats. */
  function signalField(x, y, t) {
    return (
      Math.sin(x * 1.3 + t * 0.7) +
      Math.sin(y * 1.7 - t * 0.52) * 0.8 +
      Math.sin((x + y) * 0.9 + t * 0.91) * 0.6 +
      Math.sin((x - y) * 1.53 - t * 0.63) * 0.42
    ) * 0.35;
  }

  function scanner(host, phase) {
    var surface = makeCanvas(host, 'bg-scanner');
    var ctx = surface.ctx;
    var p = SCANNER;
    /* A constant time offset for this mount, so the fields down the page do
       not run their sweep envelopes in unison. Held under a second name
       because draw() has a local phase of its own. */
    var lead = phase || 0;

    function draw(seconds) {
      var w = surface.width();
      var h = surface.height();
      var t = (seconds + lead) * p.speed;

      ctx.clearRect(0, 0, w, h);
      /* Additive, standing in for the shader's premultiplied output: dark
         areas stay transparent so this reads as a glow over the page
         colour rather than a black rectangle sitting on top of it. */
      ctx.globalCompositeOperation = 'lighter';
      ctx.lineWidth = 1;

      var aspect = w / h;
      var bands = Math.ceil(p.bandDensity * 1.5);
      var split = p.colorSpread * 0.16 / p.bandDensity;

      for (var i = -bands; i <= bands; i++) {
        var base = i / p.bandDensity;

        /* One travelling envelope, about eight seconds per pass. Lines
           outside it contribute nothing, so they cost nothing. */
        var phase = base / p.sweepWidth - t * p.sweepSpeed;
        var env = Math.pow(0.5 + 0.5 * Math.cos(phase * Math.PI * 2), p.sweepFalloff);
        if (env < 0.012) continue;

        for (var c = 0; c < 3; c++) {
          var offset = (c - 1) * split;
          ctx.beginPath();

          for (var s = 0; s <= p.segments; s++) {
            var nx = (s / p.segments * 2 - 1) * aspect / p.scale;
            var ny = base + offset;
            var warp = signalField(nx * p.frequency, ny * p.frequency, t);
            var y = (ny + warp * p.ripple) * p.scale;

            var px = (nx * p.scale / aspect + 1) * 0.5 * w;
            var py = (y + 1) * 0.5 * h;
            if (s) ctx.lineTo(px, py); else ctx.moveTo(px, py);
          }

          ctx.strokeStyle = p.channels[c];
          /* Two passes rather than shadowBlur, which is the expensive part
             of the original and the first thing to cost frames here. A wide
             faint stroke under a tight bright one reads the same. */
          ctx.globalAlpha = env * 0.10;
          ctx.lineWidth = 6;
          ctx.stroke();

          ctx.globalAlpha = env * 0.55;
          ctx.lineWidth = 1;
          ctx.stroke();
        }
      }

      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = 'source-over';
    }

    if (reduced) { draw(0); return; }
    register(host, draw);
  }

  /* The top field runs from the very top of the document down to the
     bottom of the work section, so the header, the intro and the two
     project cards all sit on one unbroken piece of it.

     It cannot be hosted on any of them. The header is a sibling of main
     rather than a child, so no single element wraps the header and the
     intro; and .work is capped at --maxw and centred, so a canvas inside
     it would stop 80px short of each edge on a wide screen while the
     header above it ran full bleed. This layer is pinned to the document
     instead, which is edge to edge by construction.

     One canvas rather than two also means the contour lines carry through
     the intro-to-work seam instead of restarting at it, which is the whole
     reason it reads as one field.

     Height is measured rather than guessed: the header is not a fixed
     height across breakpoints, and the intro grows when the webfont lands
     and when the rotating phrase changes the lede's line count. */
  function topField() {
    var intro = document.querySelector('.intro');
    var work = document.querySelector('.work');
    var header = document.querySelector('.site-head');
    var last = work || intro;
    if (!intro || !last) return null;

    var field = document.createElement('div');
    field.className = 'hero-bg';
    field.setAttribute('aria-hidden', 'true');
    document.body.insertBefore(field, document.body.firstChild);

    function size() {
      /* Document-space bottom edges, so this stays correct whatever the
         page is scrolled to when it recomputes. */
      var scrolled = window.pageYOffset;
      var bottom = last.getBoundingClientRect().bottom + scrolled;
      var hold = intro.getBoundingClientRect().bottom + scrolled;

      field.style.height = Math.round(bottom) + 'px';
      /* Where the field stops being the hero's and starts being the work
         section's. The mask in the stylesheet holds full strength above
         this and eases to a quieter one below it, so the two readings
         differ without the canvas being cut in half. */
      field.style.setProperty('--field-hold', (hold / bottom * 100).toFixed(2) + '%');
    }

    size();
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(size);

    if (window.ResizeObserver) {
      /* The header and the intro too: neither resizes often, but when
         either does everything below it moves without its own box
         changing, and an observer on the last element alone would never
         fire. */
      var ro = new ResizeObserver(size);
      ro.observe(last);
      ro.observe(intro);
      if (header) ro.observe(header);
    }
    window.addEventListener('resize', size);

    return field;
  }

  /* Two mounts: everything above the achievement rows, and contact. The
     phase offset is an arbitrary constant, only large enough that the two
     sweeps never land together. */
  var field = topField();
  if (field) scanner(field, 0);

  var contact = document.querySelector('.contact');
  if (contact) scanner(contact, 71);
})();
