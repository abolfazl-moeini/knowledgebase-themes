/* Inkwell — interactive bits
   - Reading progress bar
   - Code copy buttons
   - TOC scrollspy
   - Search shortcut (cmd/ctrl + k, /)
*/
(function () {
  'use strict';

  const isMac = /Mac|iPhone|iPad|iPod/.test(navigator.platform || '');
  document.querySelectorAll('kbd').forEach((kbd) => {
    const text = kbd.textContent.trim();
    if (text.includes('⌘')) {
      kbd.textContent = isMac ? text : text.replace(/⌘/g, 'Ctrl+');
    }
  });

  const setSidebarOpen = (open) => {
    document.body.classList.toggle('sidebar-open', open);
    document.querySelectorAll('[data-sidebar-toggle]').forEach((btn) => {
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
  };
  document.querySelectorAll('[data-sidebar-toggle]').forEach((btn) => {
    btn.addEventListener('click', () => setSidebarOpen(!document.body.classList.contains('sidebar-open')));
  });
  document.querySelectorAll('[data-sidebar-close]').forEach((el) => {
    el.addEventListener('click', () => setSidebarOpen(false));
  });

  const bar = document.querySelector('.read-progress');
  if (bar) {
    const onScroll = () => {
      const h = document.documentElement.scrollHeight - window.innerHeight;
      const pct = h > 0 ? (window.scrollY / h) * 100 : 0;
      bar.style.width = pct + '%';
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  const focusOrRedirectSearch = () => {
    const input = document.querySelector('.hero__search input, .search-page__bar input');
    if (input) {
      input.focus();
    } else {
      window.location.href = 'search.html';
    }
  };

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') setSidebarOpen(false);
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      focusOrRedirectSearch();
    }
    if (e.key === '/' && !['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName)) {
      e.preventDefault();
      focusOrRedirectSearch();
    }
  });

  document.querySelectorAll('[data-search-trigger], .topnav__search').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      focusOrRedirectSearch();
    });
  });

  if (window.location.pathname.includes('search.html')) {
    const input = document.querySelector('.search-page__bar input');
    if (input) input.focus();
  }

  document.querySelectorAll('.codeblock').forEach((block) => {
    const copyBtn = block.querySelector('.codeblock__copy');
    if (!copyBtn) return;
    copyBtn.addEventListener('click', async () => {
      const code = block.querySelector('pre code') || block.querySelector('pre');
      if (!code) return;
      try {
        await navigator.clipboard.writeText(code.innerText);
        copyBtn.textContent = 'Copied';
        setTimeout(() => { copyBtn.textContent = 'Copy'; }, 1500);
      } catch (e) {
        copyBtn.textContent = isMac ? 'Press ⌘C' : 'Press Ctrl+C';
      }
    });
  });

  const tocLinks = document.querySelectorAll('.toc-rail a[href^="#"]');
  if (tocLinks.length > 0) {
    const headings = Array.from(tocLinks)
      .map((link) => {
        const href = link.getAttribute('href');
        if (href === '#' || !href.startsWith('#')) return null;
        try {
          return document.querySelector(href);
        } catch (e) {
          return null;
        }
      })
      .filter(Boolean);

    const observer = new IntersectionObserver((entries) => {
      const visible = entries.filter((e) => e.isIntersecting);
      if (visible.length > 0) {
        const active = visible[0].target;
        tocLinks.forEach((link) => link.classList.remove('is-active'));
        if (active.id) {
          try {
            const matching = document.querySelector(`.toc-rail a[href="#${active.id}"]`);
            if (matching) matching.classList.add('is-active');
          } catch (e) {}
        }
      }
    }, { rootMargin: '-100px 0px -70% 0px' });

    headings.forEach((h) => observer.observe(h));
  }

  // ---------- Theme toggle (dark <-> light) ----------
  const THEME_KEY = 'inkwell-theme';
  const root = document.documentElement;
  const applyTheme = (theme) => {
    if (theme === 'light') root.setAttribute('data-theme', 'light');
    else root.removeAttribute('data-theme');
    try { localStorage.setItem(THEME_KEY, theme); } catch (e) {}
  };
  let currentTheme = 'dark';
  try {
    const stored = localStorage.getItem(THEME_KEY);
    if (stored === 'light') { applyTheme('light'); currentTheme = 'light'; }
  } catch (e) {}
  document.querySelectorAll('[data-theme-toggle]').forEach((btn) => {
    btn.addEventListener('click', () => {
      currentTheme = currentTheme === 'light' ? 'dark' : 'light';
      applyTheme(currentTheme);
    });
  });
})();
