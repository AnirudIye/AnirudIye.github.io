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

  /* Marquees. The track is duplicated so translateX(-50%) loops seamlessly,
     which only works if the copy is exact. */

  function buildMarquees() {
    var rows = document.querySelectorAll('.marquee');

    Array.prototype.forEach.call(rows, function (row) {
      var track = row.querySelector('.marquee-track');
      if (!track) return;

      track.style.setProperty('--speed', (row.dataset.speed || 60) + 's');

      if (reduced) {
        row.style.overflowX = 'auto';
        return;
      }

      var cards = Array.prototype.slice.call(track.children);
      cards.forEach(function (card) {
        var copy = card.cloneNode(true);
        copy.setAttribute('aria-hidden', 'true');
        track.appendChild(copy);
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
