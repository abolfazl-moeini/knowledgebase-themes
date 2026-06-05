/* Voyager — interactive bits
   - Code snippet → playground sync
   - Scrollspy + fake REPL
   - Search shortcut + mobile drawer
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
    const input = document.querySelector('.search-bar input');
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
      e.preventDefault();
      focusOrRedirectSearch();
    });
  });

  document.querySelectorAll('.search-bar').forEach((wrap) => {
    wrap.addEventListener('click', (e) => {
      const input = wrap.querySelector('input');
      if (input && e.target !== input) input.focus();
    });
  });

  if (window.location.pathname.includes('search.html')) {
    const input = document.querySelector('.search-bar input');
    if (input) input.focus();
  }

  const editor = document.querySelector('.pg__editor');
  const output = document.querySelector('.pg__output');
  const langSelect = document.querySelector('.pg__lang select');
  const runBtn = document.querySelector('.pg__run');
  const clearBtn = document.querySelector('.pg__clear');
  const tabs = document.querySelectorAll('.pg__tab');

  const snippets = {};
  document.querySelectorAll('.snippet[data-snippet-id]').forEach((el) => {
    const id = el.dataset.snippetId;
    const lang = el.dataset.lang || 'javascript';
    const code = el.querySelector('pre code')?.innerText || el.querySelector('pre')?.innerText || '';
    const expected = el.dataset.output || '';
    snippets[id] = { lang, code, expected, el };
  });

  const firstSnippetId = Object.keys(snippets)[0];
  let currentSnippetId = firstSnippetId;
  if (currentSnippetId && editor) {
    loadSnippet(currentSnippetId);
  }

  function loadSnippet(id) {
    if (!snippets[id]) return;
    currentSnippetId = id;
    const s = snippets[id];
    if (editor) editor.textContent = s.code;
    if (langSelect) langSelect.value = s.lang;
    document.querySelectorAll('.snippet').forEach((el) => {
      el.classList.toggle('is-active', el.dataset.snippetId === id);
    });
  }

  document.querySelectorAll('.snippet__run').forEach((btn) => {
    btn.addEventListener('click', () => {
      const id = btn.closest('.snippet').dataset.snippetId;
      loadSnippet(id);
      runSnippet();
    });
  });

  tabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      tabs.forEach((t) => {
        t.classList.remove('is-active');
        t.setAttribute('aria-selected', 'false');
      });
      tab.classList.add('is-active');
      tab.setAttribute('aria-selected', 'true');
    });
  });

  const snippetEls = document.querySelectorAll('.snippet[data-snippet-id]');
  if (snippetEls.length > 0) {
    const observer = new IntersectionObserver((entries) => {
      const visible = entries.filter((e) => e.isIntersecting);
      if (visible.length > 0) {
        const active = visible[0].target;
        const id = active.dataset.snippetId;
        if (snippets[id] && id !== currentSnippetId && !document.body.dataset.manualSnippet) {
          loadSnippet(id);
        }
      }
    }, { rootMargin: '-100px 0px -60% 0px' });
    snippetEls.forEach((el) => observer.observe(el));
  }

  function appendOutput(text, kind) {
    if (!output) return;
    const line = document.createElement('span');
    line.className = 'pg__output-line pg__output-line--' + (kind || 'out');
    line.textContent = text;
    output.appendChild(line);
    output.appendChild(document.createTextNode('\n'));
    output.scrollTop = output.scrollHeight;
  }

  function clearOutput() {
    if (output) output.innerHTML = '';
  }

  function runSnippet() {
    if (!editor) return;
    const code = editor.innerText.trim();
    if (!code) return;
    clearOutput();
    const t0 = performance.now();
    appendOutput('$ ' + code.split('\n')[0] + (code.includes('\n') ? '  …' : ''), 'prompt');

    const delay = 200 + Math.random() * 400;
    setTimeout(() => {
      const s = snippets[currentSnippetId];
      const expected = s?.expected || '';
      if (expected) {
        expected.split('\n').forEach((line) => {
          if (line.startsWith('!')) appendOutput(line.slice(1), 'err');
          else if (line.startsWith('✓') || line.startsWith('✔')) appendOutput(line, 'ok');
          else appendOutput(line, 'out');
        });
      } else {
        appendOutput('// executed in ' + Math.round(delay) + 'ms', 'time');
        appendOutput('{', 'out');
        appendOutput('  "id": "obj_example_project_id",', 'out');
        appendOutput('  "object": "project",', 'out');
        appendOutput('  "active": true', 'out');
        appendOutput('}', 'out');
        appendOutput('// ok', 'ok');
      }
      appendOutput(`\n// ${(performance.now() - t0).toFixed(0)}ms`, 'time');
    }, delay);

    document.body.dataset.manualSnippet = currentSnippetId;
    setTimeout(() => { delete document.body.dataset.manualSnippet; }, 5000);
  }

  if (runBtn) runBtn.addEventListener('click', runSnippet);
  if (clearBtn) clearBtn.addEventListener('click', clearOutput);

  if (editor) {
    editor.addEventListener('keydown', (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        e.preventDefault();
        runSnippet();
      }
    });
  }

  // ---------- Theme toggle (dark <-> light) ----------
  const THEME_KEY = 'voyager-theme';
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
