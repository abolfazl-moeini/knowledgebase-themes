/* Drift — interactive bits
   - Sidebar collapsible groups
   - Code copy buttons
   - TOC scrollspy
   - Search shortcut
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
    const input = document.querySelector('.topnav__search input, .search-bar input');
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
  document.querySelectorAll('[data-search-trigger]').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      if (btn.tagName === 'DIV') return;
      e.preventDefault();
      focusOrRedirectSearch();
    });
  });
  document.querySelectorAll('.topnav__search[data-search-trigger]').forEach((wrap) => {
    wrap.addEventListener('click', (e) => {
      const input = wrap.querySelector('input');
      if (input && e.target !== input) input.focus();
    });
  });

  if (window.location.pathname.includes('search.html')) {
    const input = document.querySelector('.search-bar input');
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
        copyBtn.textContent = isMac ? '⌘C' : 'Ctrl+C';
      }
    });
  });

  document.querySelectorAll('.prose pre').forEach((pre) => {
    if (pre.querySelector('.code-copy')) return;
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'code-copy';
    btn.textContent = 'Copy';
    btn.setAttribute('aria-label', 'Copy code');
    pre.appendChild(btn);
    btn.addEventListener('click', async () => {
      const code = pre.querySelector('code') || pre;
      try {
        await navigator.clipboard.writeText(code.innerText);
        btn.textContent = 'Copied';
        setTimeout(() => { btn.textContent = 'Copy'; }, 1500);
      } catch (e) {
        btn.textContent = isMac ? '⌘C' : 'Ctrl+C';
      }
    });
  });

  document.querySelectorAll('.support-actions .btn').forEach((btn) => {
    if (btn.tagName !== 'BUTTON') return;
    btn.addEventListener('click', () => {
      btn.setAttribute('aria-pressed', 'true');
      btn.parentElement.querySelectorAll('button').forEach((sibling) => {
        if (sibling !== btn) sibling.setAttribute('aria-pressed', 'false');
      });
    });
  });

  const tocLinks = document.querySelectorAll('.article-toc a[href^="#"]');
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
            const matching = document.querySelector(`.article-toc a[href="#${active.id}"]`);
            if (matching) matching.classList.add('is-active');
          } catch (e) {}
        }
      }
    }, { rootMargin: '-100px 0px -70% 0px' });

    headings.forEach((h) => observer.observe(h));
  }

  // ---------- Theme toggle (dark <-> light) ----------
  const THEME_KEY = 'drift-theme';
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
