/* Animated backgrounds.

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

   Both backgrounds stop when off screen or backgrounded, which the original
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

  /* Runs draw(seconds) on a frame loop, suspended while the host is off
     screen or the tab is in the background. */
  function loop(host, draw) {
    var onscreen = true;
    var start = null;

    if (window.IntersectionObserver) {
      new IntersectionObserver(function (entries) {
        onscreen = entries[0].isIntersecting;
      }).observe(host);
    }

    function frame(now) {
      requestAnimationFrame(frame);
      if (!onscreen || document.hidden) return;
      if (start === null) start = now;
      draw((now - start) / 1000);
    }

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

  function scanner(host) {
    var surface = makeCanvas(host, 'bg-scanner');
    var ctx = surface.ctx;
    var p = SCANNER;

    function draw(seconds) {
      var w = surface.width();
      var h = surface.height();
      var t = seconds * p.speed;

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
    loop(host, draw);
  }

  /* Letter glitch ------------------------------------------------------ */

  var GLITCH = {
    charWidth: 10,
    charHeight: 20,
    speed: 62,
    turnover: 0.05,
    palette: ['#142430', '#142430', '#e0a03c', '#52b6c4'],
    chars: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789<>/[]{}=+*^?#_'
  };

  /* A grid of monospace characters re-rolling at random. Recoloured from
     the original's greens to this page's own three, and weighted so most
     cells sit at the sunken navy, leaving the accents to read as sparks
     rather than confetti. */
  function letterGlitch(host) {
    var surface = makeCanvas(host, 'bg-glitch');
    var ctx = surface.ctx;
    var g = GLITCH;
    var cells = [];
    var cols = 0;
    var rows = 0;
    var last = -Infinity;

    function pick(list) { return list[Math.floor(Math.random() * list.length)]; }

    function build() {
      cols = Math.ceil(surface.width() / g.charWidth);
      rows = Math.ceil(surface.height() / g.charHeight);
      cells = new Array(cols * rows);
      for (var i = 0; i < cells.length; i++) {
        cells[i] = { ch: pick(g.chars), color: pick(g.palette) };
      }
    }

    function paint() {
      var w = surface.width();
      var h = surface.height();
      ctx.clearRect(0, 0, w, h);
      ctx.font = '400 13px "IBM Plex Mono", ui-monospace, monospace';
      ctx.textBaseline = 'top';

      for (var i = 0; i < cells.length; i++) {
        var cell = cells[i];
        ctx.fillStyle = cell.color;
        ctx.fillText(cell.ch, (i % cols) * g.charWidth, Math.floor(i / cols) * g.charHeight);
      }
    }

    function draw(seconds) {
      var ms = seconds * 1000;
      if (!cells.length || cols !== Math.ceil(surface.width() / g.charWidth)) build();
      /* Repainting the whole grid every frame is what makes the original
         expensive. It only changes on the glitch tick, so it only repaints
         on the glitch tick. */
      if (ms - last < g.speed) return;
      last = ms;

      var churn = Math.max(1, Math.floor(cells.length * g.turnover));
      for (var n = 0; n < churn; n++) {
        var cell = cells[Math.floor(Math.random() * cells.length)];
        cell.ch = pick(g.chars);
        cell.color = pick(g.palette);
      }
      paint();
    }

    build();
    if (reduced) { paint(); return; }
    loop(host, draw);
  }

  var hero = document.querySelector('.intro');
  if (hero) scanner(hero);

  var contact = document.querySelector('.contact');
  if (contact) letterGlitch(contact);
})();
