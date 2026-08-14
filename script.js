/* Anirud Iyengar. Terminal intro, Waterloo clock, marquee rows, mailto form. */

(function () {
  'use strict';

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* Terminal intro. Types the command, then reveals the name block. */

  function typeIntro() {
    var target = document.getElementById('typed');
    var reveal = document.getElementById('reveal');
    if (!target || !reveal) return;

    var command = './anirud --intro';

    if (reduced) {
      target.textContent = command;
      reveal.hidden = false;
      return;
    }

    var i = 0;
    (function step() {
      target.textContent = command.slice(0, i);
      if (i++ < command.length) {
        setTimeout(step, 70);
      } else {
        setTimeout(function () { reveal.hidden = false; }, 260);
      }
    })();
  }

  /* Local time in Waterloo, so the status bar means something. */

  function startClock() {
    var el = document.getElementById('clock');
    if (!el) return;

    function tick() {
      el.textContent = new Date().toLocaleTimeString('en-CA', {
        timeZone: 'America/Toronto',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      });
    }

    tick();
    setInterval(tick, 30000);
  }

  /* Achievement rows, looping with no visible seam.

     Built on the wrap trick React Bits uses in TextLoop: it draws the text
     twice on one SVG path and keeps the second copy exactly one path length
     behind the first, so the seam always lands on identical pixels. Same
     idea here in one dimension.

     This measures one set of cards and clones sets until the track overruns
     the row, then hands that measured width to CSS as --shift. The keyframe
     travels exactly that far, so at the reset the next set is sitting where
     the last one was and the two frames are the same image.

     Measuring is the whole point. The earlier version animated to -50%,
     which is only correct when the track happens to be exactly two sets
     wide; anything else lands mid-card and snaps.

     Three things hide the content repeat on top of that: the rows run at
     different speeds, they hold different numbers of cards (5/5/4) so the
     pattern across rows almost never recurs, and every other row runs
     backwards. */

  function buildMarquees() {
    var rows = document.querySelectorAll('.marquee');

    Array.prototype.forEach.call(rows, function (row, index) {
      var track = row.querySelector('.marquee-track');
      if (!track) return;

      var originals = Array.prototype.slice.call(track.children);
      if (!originals.length) return;

      if (reduced) {
        row.style.overflowX = 'auto';
        return;
      }

      function outerWidth(el) {
        return el.offsetWidth + parseFloat(getComputedStyle(el).marginRight || 0);
      }

      function measureSet() {
        return originals.reduce(function (sum, el) {
          return sum + outerWidth(el);
        }, 0);
      }

      /* One set width is the wrap distance. Clone until the track overruns
         the row, then add one more set so there is always a card entering
         from the far side at the moment the offset wraps. */
      var unit = measureSet();
      var sets = Math.ceil(row.offsetWidth / unit) + 1;

      for (var s = 0; s < sets; s++) {
        originals.forEach(function (card) {
          var copy = card.cloneNode(true);
          copy.setAttribute('aria-hidden', 'true');
          track.appendChild(copy);
        });
      }

      /* Hand the measured distance and the pace to CSS. data-speed is
         seconds per set, carried over so the rows keep the pace they were
         tuned at. Every other row runs backwards. */
      function apply() {
        track.style.setProperty('--shift', measureSet() + 'px');
        track.style.setProperty('--dur', (parseFloat(row.dataset.speed) || 60) + 's');
      }

      if (index % 2) track.dataset.dir = 'right';
      apply();

      /* Card widths are fixed, but the trailing margin and the font can
         both settle late. Re-measure once the fonts are in, and on resize. */
      if (document.fonts && document.fonts.ready) document.fonts.ready.then(apply);

      var resizeTimer;
      window.addEventListener('resize', function () {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(apply, 150);
      });
    });
  }

  /* The form has no backend. Rather than pretend it sends, it hands the
     message to the visitor's mail client with everything filled in. */

  function wireForm() {
    var form = document.getElementById('contact-form');
    if (!form) return;

    form.addEventListener('submit', function (e) {
      e.preventDefault();

      var data = new FormData(form);
      var name = (data.get('name') || '').trim();
      var email = (data.get('email') || '').trim();
      var message = (data.get('message') || '').trim();

      var subject = 'Site message from ' + name;
      var body = message + '\n\n' + name + '\n' + email;

      window.location.href = 'mailto:iyengar.anirud@gmail.com'
        + '?subject=' + encodeURIComponent(subject)
        + '&body=' + encodeURIComponent(body);
    });
  }

  typeIntro();
  startClock();
  buildMarquees();
  wireForm();
})();
