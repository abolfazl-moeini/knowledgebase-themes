/* Terminal — interactive bits
   - Command palette (cmd/ctrl + k)
   - Code copy buttons
   - TOC scrollspy
   - File tree expand/collapse
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

  const cmdk = document.querySelector('.cmdk');
  const cmdkInput = cmdk ? cmdk.querySelector('input') : null;
  const cmdkResults = cmdk ? cmdk.querySelectorAll('.cmdk__result') : [];
  let cmdkTrigger = null;
  let cmdkIdx = 0;

  const setCmdkOpen = (open) => {
    if (!cmdk) return;
    cmdk.classList.toggle('is-open', open);
    cmdk.setAttribute('aria-hidden', open ? 'false' : 'true');
    if (open && cmdkInput) {
      cmdkInput.focus();
      cmdkIdx = 0;
      cmdkResults.forEach((r) => r.classList.remove('is-focused'));
      if (cmdkResults[0]) cmdkResults[0].classList.add('is-focused');
    } else if (!open && cmdkTrigger) {
      cmdkTrigger.focus();
    }
  };

  const openCmdk = () => setCmdkOpen(true);
  const closeCmdk = () => {
    setCmdkOpen(false);
    setSidebarOpen(false);
  };

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      if (cmdk && cmdk.classList.contains('is-open')) closeCmdk();
      else setSidebarOpen(false);
    }
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      if (cmdk && cmdk.classList.contains('is-open')) closeCmdk();
      else openCmdk();
    }
    if (e.key === '/' && !['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName)) {
      e.preventDefault();
      const input = document.querySelector('.topnav__search input, .search-page__bar input');
      if (input) input.focus();
    }
    if (cmdk && cmdk.classList.contains('is-open') && e.key === 'Tab') {
      const focusable = cmdk.querySelectorAll('input, a, button');
      if (focusable.length < 2) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  });

  if (cmdk) {
    cmdk.addEventListener('click', (e) => {
      if (e.target === cmdk) closeCmdk();
    });
  }

  document.querySelectorAll('[data-search-trigger]').forEach((btn) => {
    if (btn.classList.contains('topnav__search-cmdk')) cmdkTrigger = btn;
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      if (cmdk) openCmdk();
      else {
        const input = document.querySelector('.topnav__search input, .search-page__bar input');
        if (input) input.focus();
        else window.location.href = 'search.html';
      }
    });
  });

  if (cmdkInput) {
    cmdkInput.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        cmdkIdx = Math.min(cmdkIdx + 1, cmdkResults.length - 1);
        cmdkResults.forEach((r) => r.classList.remove('is-focused'));
        if (cmdkResults[cmdkIdx]) cmdkResults[cmdkIdx].classList.add('is-focused');
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        cmdkIdx = Math.max(cmdkIdx - 1, 0);
        cmdkResults.forEach((r) => r.classList.remove('is-focused'));
        if (cmdkResults[cmdkIdx]) cmdkResults[cmdkIdx].classList.add('is-focused');
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (cmdkResults[cmdkIdx]) window.location.href = cmdkResults[cmdkIdx].getAttribute('href') || '#';
      }
    });
  }

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
        copyBtn.textContent = '✓ copied';
        copyBtn.classList.add('is-copied');
        setTimeout(() => {
          copyBtn.textContent = 'copy';
          copyBtn.classList.remove('is-copied');
        }, 1500);
      } catch (e) {
        copyBtn.textContent = isMac ? '⌘C' : 'Ctrl+C';
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

  document.querySelectorAll('.tree__dir').forEach((dir) => {
    const icon = dir.querySelector('.tree__icon');
    if (!icon) return;
    dir.addEventListener('click', (e) => {
      if (e.target.closest('a')) return;
      dir.classList.toggle('collapsed');
    });
  });

  // ---------- Theme toggle (dark <-> light) ----------
  const THEME_KEY = 'terminal-theme';
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
