/* Lumen — interactive bits
   - Mobile nav toggle
   - Code copy buttons
   - Smooth TOC active highlighting (scrollspy)
   - Search shortcut (cmd/ctrl + k)
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

  const focusOrRedirectSearch = () => {
    const input = document.querySelector('.hero__search input, .search-page__bar input');
    if (input) {
      input.focus();
    } else {
      window.location.href = 'search.html';
    }
  };

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      setSidebarOpen(false);
    }
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      focusOrRedirectSearch();
    }
    if (e.key === '/' && !['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName)) {
      e.preventDefault();
      focusOrRedirectSearch();
    }
  });
  document.querySelectorAll('[data-search-trigger]').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      focusOrRedirectSearch();
    });
  });

  document.querySelectorAll('.topnav__search, .utilitybar__search, .landing-hero__search').forEach((wrap) => {
    wrap.addEventListener('click', (e) => {
      const input = wrap.querySelector('input');
      if (input && e.target !== input) input.focus();
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
        copyBtn.classList.add('is-copied');
        setTimeout(() => {
          copyBtn.textContent = 'Copy';
          copyBtn.classList.remove('is-copied');
        }, 1500);
      } catch (err) {
        copyBtn.textContent = isMac ? 'Press ⌘C' : 'Press Ctrl+C';
      }
    });
  });

  const tocLinks = document.querySelectorAll('.toc a[href^="#"]');
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
            const matching = document.querySelector(`.toc a[href="#${active.id}"]`);
            if (matching) matching.classList.add('is-active');
          } catch (e) {}
        }
      }
    }, { rootMargin: '-100px 0px -70% 0px' });

    headings.forEach((h) => observer.observe(h));
  }

  // ---------- Theme toggle (light <-> dark) ----------
  const THEME_KEY = 'lumen-theme';
  const root = document.documentElement;
  const applyTheme = (theme) => {
    if (theme === 'dark') {
      root.setAttribute('data-theme', 'dark');
    } else {
      root.removeAttribute('data-theme');
    }
    try { localStorage.setItem(THEME_KEY, theme); } catch (e) {}
  };
  let currentTheme = 'light';
  try {
    const stored = localStorage.getItem(THEME_KEY);
    if (stored === 'dark') {
      applyTheme('dark');
      currentTheme = 'dark';
    }
  } catch (e) {}
  document.querySelectorAll('[data-theme-toggle]').forEach((btn) => {
    btn.addEventListener('click', () => {
      currentTheme = currentTheme === 'dark' ? 'light' : 'dark';
      applyTheme(currentTheme);
    });
  });
})();
