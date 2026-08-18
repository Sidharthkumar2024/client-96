/* =========================================================
   BILLION GROUP — interactions
   ========================================================= */
(function () {
  "use strict";
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- NAV: scrolled state ---------- */
  const nav = document.getElementById("nav");
  const onScroll = () => {
    if (window.scrollY > 60) nav.classList.add("scrolled");
    else nav.classList.remove("scrolled");
  };
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });

  /* ---------- MOBILE MENU ---------- */
  const burger = document.getElementById("burger");
  const menu = document.getElementById("mobileMenu");
  const toggleMenu = (force) => {
    const open = force !== undefined ? force : !menu.classList.contains("open");
    menu.classList.toggle("open", open);
    burger.setAttribute("aria-expanded", String(open));
    menu.setAttribute("aria-hidden", String(!open));
    document.body.style.overflow = open ? "hidden" : "";
  };
  burger.addEventListener("click", () => toggleMenu());
  menu.querySelectorAll("a").forEach((a) => a.addEventListener("click", () => toggleMenu(false)));

  /* ---------- SCROLL REVEAL ---------- */
  const reveals = document.querySelectorAll(".reveal");
  if (reduce) {
    reveals.forEach((el) => el.classList.add("in"));
  } else {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            const d = parseInt(e.target.dataset.delay || "0", 10);
            setTimeout(() => e.target.classList.add("in"), d);
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -8% 0px" }
    );
    reveals.forEach((el) => io.observe(el));
  }

  /* ---------- ANIMATED COUNTERS ---------- */
  const nums = document.querySelectorAll(".stat__num");
  const runCount = (el) => {
    const target = parseInt(el.dataset.count, 10);
    const suffix = el.dataset.suffix || "";
    const pad = parseInt(el.dataset.pad || "0", 10);
    const dur = 1600;
    const start = performance.now();
    const fmt = (v) => {
      let s = String(v);
      if (pad) s = s.padStart(pad, "0");
      return s + suffix;
    };
    const tick = (now) => {
      const p = Math.min((now - start) / dur, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      el.textContent = fmt(Math.round(target * eased));
      if (p < 1) requestAnimationFrame(tick);
      else el.textContent = fmt(target);
    };
    requestAnimationFrame(tick);
  };
  if (reduce) {
    nums.forEach((el) => {
      const pad = parseInt(el.dataset.pad || "0", 10);
      let s = String(el.dataset.count);
      if (pad) s = s.padStart(pad, "0");
      el.textContent = s + (el.dataset.suffix || "");
    });
  } else {
    const cio = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            runCount(e.target);
            cio.unobserve(e.target);
          }
        });
      },
      { threshold: 0.6 }
    );
    nums.forEach((el) => cio.observe(el));
  }

  /* ---------- WORD-BY-WORD STATEMENT REVEAL (scroll scrub) ---------- */
  document.querySelectorAll(".words").forEach((container) => {
    const html = container.innerHTML;
    // wrap each word in a span
    container.innerHTML = html.replace(/(\S+)/g, '<span class="word">$1</span>');
  });
  const wordGroups = document.querySelectorAll(".words");
  const litWords = () => {
    const vh = window.innerHeight;
    wordGroups.forEach((group) => {
      const words = group.querySelectorAll(".word");
      const rect = group.getBoundingClientRect();
      // progress: 0 when group top at 82% of viewport, 1 when group bottom near top
      const start = vh * 0.82;
      const end = vh * 0.28;
      const total = words.length;
      const prog = (start - rect.top) / (start - end + rect.height);
      const clamped = Math.max(0, Math.min(1, prog));
      const litCount = Math.round(clamped * total);
      words.forEach((w, i) => w.classList.toggle("lit", i < litCount));
    });
  };
  if (reduce) {
    document.querySelectorAll(".word").forEach((w) => w.classList.add("lit"));
  } else {
    litWords();
    window.addEventListener("scroll", litWords, { passive: true });
    window.addEventListener("resize", litWords);
  }

  /* ---------- FAQ ACCORDION ---------- */
  document.querySelectorAll(".faq__item").forEach((item) => {
    const q = item.querySelector(".faq__q");
    const a = item.querySelector(".faq__a");
    q.addEventListener("click", () => {
      const isOpen = item.classList.contains("open");
      // close siblings
      document.querySelectorAll(".faq__item.open").forEach((o) => {
        if (o !== item) {
          o.classList.remove("open");
          o.querySelector(".faq__a").style.maxHeight = null;
        }
      });
      item.classList.toggle("open", !isOpen);
      a.style.maxHeight = !isOpen ? a.scrollHeight + "px" : null;
    });
  });

  /* ---------- TESTIMONIAL CAROUSEL ---------- */
  const track = document.getElementById("ttrack");
  if (track) {
    const cards = Array.from(track.children);
    const dotsWrap = document.getElementById("tdots");
    const prevBtn = document.querySelector(".tprev");
    const nextBtn = document.querySelector(".tnext");
    let index = 0;

    const perView = () => {
      const cardW = cards[0].getBoundingClientRect().width;
      const gap = parseFloat(getComputedStyle(track).gap) || 28;
      const viewW = track.parentElement.getBoundingClientRect().width;
      return { cardW, gap, count: Math.max(1, Math.round(viewW / (cardW + gap))) };
    };
    const maxIndex = () => {
      const { count } = perView();
      return Math.max(0, cards.length - count);
    };

    // build dots
    const buildDots = () => {
      dotsWrap.innerHTML = "";
      for (let i = 0; i <= maxIndex(); i++) {
        const d = document.createElement("i");
        d.addEventListener("click", () => go(i));
        dotsWrap.appendChild(d);
      }
    };
    const update = () => {
      const { cardW, gap } = perView();
      track.style.transform = `translateX(${-index * (cardW + gap)}px)`;
      dotsWrap.querySelectorAll("i").forEach((d, i) => d.classList.toggle("on", i === index));
    };
    const go = (i) => {
      index = Math.max(0, Math.min(i, maxIndex()));
      update();
    };
    prevBtn.addEventListener("click", () => go(index - 1));
    nextBtn.addEventListener("click", () => go(index + 1));

    // drag / swipe
    let startX = 0, dragging = false;
    track.addEventListener("pointerdown", (e) => { dragging = true; startX = e.clientX; track.style.transition = "none"; });
    window.addEventListener("pointerup", (e) => {
      if (!dragging) return;
      dragging = false;
      track.style.transition = "";
      const dx = e.clientX - startX;
      if (Math.abs(dx) > 60) go(index + (dx < 0 ? 1 : -1));
      else update();
    });

    let rt;
    window.addEventListener("resize", () => {
      clearTimeout(rt);
      rt = setTimeout(() => { buildDots(); if (index > maxIndex()) index = maxIndex(); update(); }, 150);
    });
    buildDots();
    update();

    // autoplay
    if (!reduce) {
      let timer = setInterval(() => go(index >= maxIndex() ? 0 : index + 1), 5000);
      const carousel = document.getElementById("tcarousel");
      carousel.addEventListener("mouseenter", () => clearInterval(timer));
      carousel.addEventListener("mouseleave", () => { timer = setInterval(() => go(index >= maxIndex() ? 0 : index + 1), 5000); });
    }
  }

  /* ---------- FORMS (demo handlers) ---------- */
  const cform = document.getElementById("cform");
  if (cform) {
    cform.addEventListener("submit", (e) => {
      e.preventDefault();
      const ok = document.getElementById("cformOk");
      ok.hidden = false;
      cform.reset();
      setTimeout(() => (ok.hidden = true), 5000);
    });
  }
  const news = document.getElementById("news");
  if (news) news.addEventListener("submit", (e) => { e.preventDefault(); news.reset(); });

  /* ---------- subtle hero parallax on wordmark bg ---------- */
  if (!reduce) {
    const words = document.querySelectorAll(".hero__wordmark .w");
    window.addEventListener("scroll", () => {
      const y = window.scrollY;
      words.forEach((w) => (w.style.backgroundPositionY = `${40 + y * 0.02}%`));
    }, { passive: true });
  }
})();
