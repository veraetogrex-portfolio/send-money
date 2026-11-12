// Send Money — github.com/veraetogrex-portfolio · zero dependencies
// Slide to send. The amount turns into a coin and flies to your friend, the ring around
// their photo closes, they say thanks, and the slider melts into a slot that prints the receipt.

const root   = document.querySelector('#send');
const slide  = root.querySelector('.tx-slide');
const thumb  = root.querySelector('.tx-thumb');
const fill   = root.querySelector('.tx-fill');
const label  = root.querySelector('.tx-label');
const amt    = root.querySelector('.tx-amt');
const ava    = root.querySelector('.tx-ava');
const ring   = root.querySelector('.tx-ava .ring');
const bal    = root.querySelector('.tx-bal b');
const paper  = root.querySelector('.tx-paper');
const flood  = root.querySelector('.tx-flood');

const AMOUNT = 120, BALANCE = 2480, MAX = 640 - 92;        // thumb travel, px
let timers = [], drag = null, done = false;
const later = (fn, ms) => timers.push(setTimeout(fn, ms));
const money = v => '$' + v.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

function reset() {
  timers.forEach(clearTimeout); timers = []; drag = null; done = false;
  root.querySelectorAll('.tx-coin, .tx-spark').forEach(el => el.remove());
  root.classList.remove('is-sent', 'is-thanked', 'is-torn');
  slide.classList.remove('is-back');
  setX(0);
  ring.getAnimations().forEach(a => a.cancel()); ring.style.strokeDashoffset = 389.6;
  paper.getAnimations().forEach(a => a.cancel()); paper.style.transform = ''; paper.style.clipPath = ''; paper.style.visibility = 'hidden';
  flood.getAnimations().forEach(a => a.cancel()); flood.style.opacity = 0;
  bal.textContent = money(BALANCE); bal.classList.remove('is-down');
}

function setX(x) {
  const p = x / MAX;
  thumb.style.transform = `translateX(${x}px)`; fill.style.width = 92 + x + 'px';
  label.style.opacity = 1 - p * 1.4; slide.setAttribute('aria-valuenow', Math.round(p * 100));
}

// ── dragging the thumb ─────────────────────────────
function local(e) { const r = slide.getBoundingClientRect(); return (e.clientX - r.left) / (r.width / slide.offsetWidth); }
thumb.addEventListener('pointerdown', e => {
  if (done) return;
  slide.classList.remove('is-back');
  drag = { dx: local(e) - (parseFloat(thumb.style.transform.slice(11)) || 0) };
  addEventListener('pointermove', onMove); addEventListener('pointerup', onUp, { once: true });
});
function onMove(e) { if (drag) setX(Math.max(0, Math.min(MAX, local(e) - drag.dx))); }
function onUp() {
  removeEventListener('pointermove', onMove);
  if (!drag) return;
  const x = parseFloat(thumb.style.transform.slice(11)) || 0; drag = null;
  if (x > MAX * .86) { setX(MAX); send(); }
  else { slide.classList.add('is-back'); setX(0); }      // not far enough: springs back
}
slide.addEventListener('keydown', e => { if ((e.key === 'Enter' || e.key === ' ') && !done) { setX(MAX); send(); } });

// ── the send sequence ──────────────────────────────
function send() {
  done = true;
  const from = center(amt), to = center(ava);
  root.classList.add('is-sent');                          // amount dissolves, slider melts into a slot
  later(() => fly(from, to), 120);
  later(() => land(), 120 + 860);
  later(() => printReceipt(), 1450);
}

function center(el) { const r = el.getBoundingClientRect(), s = root.getBoundingClientRect(), k = s.width / root.offsetWidth;
  return { x: (r.left - s.left + r.width / 2) / k, y: (r.top - s.top + r.height / 2) / k }; }

function fly(a, b) {
  const coin = document.createElement('div'); coin.className = 'tx-coin'; coin.textContent = '$'; root.appendChild(coin);
  const c = { x: (a.x + b.x) / 2 + 240, y: (a.y + b.y) / 2 + 60 };    // curve out to the right, then up
  const at = t => ({ x: (1 - t) ** 2 * a.x + 2 * (1 - t) * t * c.x + t * t * b.x, y: (1 - t) ** 2 * a.y + 2 * (1 - t) * t * c.y + t * t * b.y });
  const frames = [];
  for (let k = 0; k <= 12; k++) {
    const t = k / 12, p = at(t), s = k === 0 ? .2 : 1 - .45 * t, spin = Math.cos(t * Math.PI * 3);
    frames.push({ transform: `translate(${p.x}px,${p.y}px) scale(${s * (.35 + .65 * Math.abs(spin))}, ${s})`, offset: t });
  }
  coin.animate(frames, { duration: 860, easing: 'cubic-bezier(.5,0,.3,1)', fill: 'forwards' });
  // a trail of sparks behind the coin
  for (let k = 1; k < 16; k++) later(() => {
    const p = at(Math.min(1, k / 16 + .02)), s = document.createElement('i'); s.className = 'tx-spark'; root.appendChild(s);
    s.animate([{ transform: `translate(${p.x}px,${p.y}px) scale(1)`, opacity: 1 }, { transform: `translate(${p.x + (Math.random() - .5) * 40}px,${p.y + 30 + Math.random() * 30}px) scale(0)`, opacity: 0 }],
      { duration: 650, easing: 'ease-out', fill: 'forwards' }).onfinish = () => s.remove();
  }, k * 42);
  later(() => coin.remove(), 880);
  countDown();
}

function countDown() {
  bal.classList.add('is-down');
  const t0 = performance.now();
  const tick = now => { const p = Math.min(1, (now - t0) / 700), e = 1 - (1 - p) ** 3;
    bal.textContent = money(BALANCE - AMOUNT * e); if (p < 1 && done) requestAnimationFrame(tick); };
  requestAnimationFrame(tick);
}

function land() {
  ava.classList.remove('is-bump'); void ava.offsetWidth; ava.classList.add('is-bump');
  ring.animate([{ strokeDashoffset: 389.6 }, { strokeDashoffset: 0 }], { duration: 520, easing: 'cubic-bezier(.65,0,.35,1)', fill: 'forwards' });
  flood.animate([{ opacity: 0 }, { opacity: 1, offset: .25 }, { opacity: .55 }], { duration: 1600, easing: 'ease-out', fill: 'forwards' });
  const p = center(ava);
  for (let k = 0; k < 18; k++) {                           // a ring of light bursts out of the avatar
    const a = k / 18 * Math.PI * 2, s = document.createElement('i'); s.className = 'tx-spark'; s.style.background = 'var(--ok)'; root.appendChild(s);
    s.animate([{ transform: `translate(${p.x + Math.cos(a) * 66}px,${p.y + Math.sin(a) * 66}px) scale(1.4)`, opacity: 1 },
               { transform: `translate(${p.x + Math.cos(a) * 130}px,${p.y + Math.sin(a) * 130}px) scale(0)`, opacity: 0 }], { duration: 600, easing: 'cubic-bezier(.2,.8,.2,1)', fill: 'forwards' }).onfinish = () => s.remove();
  }
  later(() => root.classList.add('is-thanked'), 260);
}

function printReceipt() {
  // the paper unrolls from the slot in small jerks, header first
  const frames = [], steps = 9;
  for (let k = 0; k <= steps; k++) {
    const shown = 100 - 100 * k / steps;
    frames.push({ clipPath: `inset(0 0 ${shown}% 0)`, transform: `translateY(${k % 2 ? 2 : 0}px)`, offset: k / steps * .92 });
    if (k < steps) frames.push({ clipPath: `inset(0 0 ${shown}% 0)`, transform: 'translateY(0px)', offset: (k + .5) / steps * .92 });
  }
  frames.push({ clipPath: 'inset(0 0 0% 0)', transform: 'translateY(0px)', offset: 1 });
  paper.style.visibility = 'visible';
  paper.animate(frames, { duration: 1000, easing: 'linear', fill: 'forwards' }).onfinish = () => {
    paper.getAnimations().forEach(a => a.cancel()); paper.style.clipPath = 'none'; paper.style.transform = '';
    later(() => root.classList.add('is-torn'), 120);          // tear it off: it drops and the stamp lands
  };
}

// fade everything back to the first frame (used when a demo loops)
function rewind() {
  root.animate([{ opacity: 1, filter: 'blur(0px)' }, { opacity: 0, filter: 'blur(8px)', offset: .45 }, { opacity: 0, filter: 'blur(8px)', offset: .55 }, { opacity: 1, filter: 'blur(0px)' }], { duration: 700, easing: 'ease-in-out' });
  setTimeout(reset, 320);
}

reset();
root.send = { reset, rewind, thumb, end: () => { const r = slide.getBoundingClientRect(); return r; } };   // for scripted demos
