/**
 * OAT Paper Showcase — Main JavaScript
 *
 * Responsibilities:
 *   - Scroll spy: highlight active TOC link as user scrolls
 *   - Theory cards: click to expand proof panel with MathJax
 *   - Mobile sidebar: toggle the frosted-glass TOC on small screens
 *   - Copy-to-clipboard: BibTeX citation with visual feedback
 *   - Smooth internal links
 *   - MathJax re-render inside proof panel
 */

(function () {
  'use strict';

  /* ============================================================
     DOM refs
     ============================================================ */
  const tocLinks    = document.querySelectorAll('.oat-toc-list a[href^="#"]');
  const sections    = document.querySelectorAll(
    '#top, #background, #design, #method, #experiments, #citation, .exp-subsection[id]'
  );
  const theoryCards = document.querySelectorAll('.theory-card[data-proof-id]');
  const proofPanel  = document.getElementById('proof-panel');
  const proofBody   = document.getElementById('proof-panel-body');
  const proofTitle  = document.getElementById('proof-panel-title');
  const proofClose  = document.getElementById('proof-panel-close');
  const mobileToggle= document.getElementById('oat-mobile-toggle');
  const tocSidebar  = document.getElementById('oat-toc');
  const tocOverlay  = document.getElementById('oat-toc-overlay');
  const copyBtn     = document.getElementById('citation-copy-btn');
  const citationEl  = document.getElementById('bibtex-citation');

  /* ============================================================
     Scroll spy
     ============================================================ */
  function onScroll() {
    var current = '';
    var offset  = window.scrollY + 120;
    sections.forEach(function (sec) {
      if (sec.offsetTop <= offset) {
        current = sec.getAttribute('id');
      }
    });
    tocLinks.forEach(function (link) {
      var href = link.getAttribute('href');
      link.classList.toggle('active', href === '#' + current);
    });
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll(); // fire on load

  /* ============================================================
     Theory cards — proof panel
     ============================================================ */

  // Build proof data from DOM data attributes on each card
  var proofs = {};

  theoryCards.forEach(function (card) {
    var id  = card.getAttribute('data-proof-id');
    var raw = card.getAttribute('data-proof-body');
    if (!id || !raw) return;
    try {
      proofs[id] = JSON.parse(raw);
    } catch (e) {
      // If JSON parse fails, treat as raw HTML string
      proofs[id] = { title: 'Proof', steps: [raw] };
    }
  });

  // Click handler
  theoryCards.forEach(function (card) {
    card.addEventListener('click', function () {
      var id = card.getAttribute('data-proof-id');
      if (!id || !proofs[id]) return;
      openProof(id);
    });
  });

  function openProof(id) {
    var data = proofs[id];
    if (!data || !proofPanel || !proofBody) return;

    proofTitle.textContent = data.title || 'Proof';
    proofBody.innerHTML = (data.steps || []).map(function (step, i) {
      return '<div class="proof-step">'
           +   '<div class="step-label">Step ' + (i + 1) + '</div>'
           +   '<div>' + step + '</div>'
           + '</div>';
    }).join('');

    proofPanel.classList.add('visible');

    // Scroll proof panel into view
    proofPanel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

    // Re-render MathJax in the injected HTML
    if (window.MathJax && MathJax.typesetPromise) {
      MathJax.typesetPromise([proofPanel]).catch(function () {});
    }
  }

  function closeProof() {
    if (!proofPanel) return;
    proofPanel.classList.remove('visible');
    if (proofBody) proofBody.innerHTML = '';
  }

  if (proofClose) {
    proofClose.addEventListener('click', function (e) {
      e.stopPropagation();
      closeProof();
    });
  }

  // Close on Escape
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') closeProof();
  });

  /* ============================================================
     Mobile sidebar toggle
     ============================================================ */
  function openToc() {
    if (tocSidebar) tocSidebar.classList.add('open');
    if (tocOverlay) tocOverlay.classList.add('show');
    document.body.style.overflow = 'hidden';
  }

  function closeToc() {
    if (tocSidebar) tocSidebar.classList.remove('open');
    if (tocOverlay) tocOverlay.classList.remove('show');
    document.body.style.overflow = '';
  }

  if (mobileToggle) {
    mobileToggle.addEventListener('click', function () {
      if (tocSidebar && tocSidebar.classList.contains('open')) {
        closeToc();
      } else {
        openToc();
      }
    });
  }

  if (tocOverlay) {
    tocOverlay.addEventListener('click', closeToc);
  }

  // Close sidebar when a TOC link is clicked (mobile)
  tocLinks.forEach(function (link) {
    link.addEventListener('click', function () {
      if (window.innerWidth <= 1024) closeToc();
    });
  });

  /* ============================================================
     Copy to clipboard — BibTeX
     ============================================================ */
  if (copyBtn && citationEl) {
    copyBtn.addEventListener('click', function () {
      var text = (citationEl.textContent || citationEl.innerText || '').trim();

      var doShowCopied = function () {
        copyBtn.classList.add('copied');
        var orig = copyBtn.innerHTML;
        copyBtn.innerHTML = '<i class="fas fa-check"></i> Copied!';
        setTimeout(function () {
          copyBtn.classList.remove('copied');
          copyBtn.innerHTML = orig;
        }, 2000);
      };

      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(doShowCopied).catch(function () {
          // fallback
          fallbackCopy(text, doShowCopied);
        });
      } else {
        fallbackCopy(text, doShowCopied);
      }
    });
  }

  function fallbackCopy(text, cb) {
    var ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.left = '-9999px';
    ta.style.top = '0';
    document.body.appendChild(ta);
    ta.focus();
    ta.select();
    try {
      document.execCommand('copy');
      if (cb) cb();
    } catch (e) {
      /* silently fail */
    }
    document.body.removeChild(ta);
  }

  /* ============================================================
     Smooth scroll for all internal anchor links
     ============================================================ */
  document.querySelectorAll('a[href^="#"]').forEach(function (a) {
    a.addEventListener('click', function (e) {
      var targetId = this.getAttribute('href');
      if (!targetId || targetId === '#') return;
      var target = document.querySelector(targetId);
      if (!target) return;
      e.preventDefault();
      var top = target.getBoundingClientRect().top + window.pageYOffset - 64;
      window.scrollTo({ top: top, behavior: 'smooth' });
      if (history.pushState) {
        history.pushState(null, null, targetId);
      }
    });
  });

  /* ============================================================
     Init MathJax (if needed)
     ============================================================ */
  if (window.MathJax && MathJax.typesetPromise) {
    MathJax.typesetPromise().catch(function () {});
  }

  /* ============================================================
     Approach comparison — method tabs
     ============================================================ */
  var compareTabs = document.querySelectorAll('.compare-tab[data-compare-target]');

  if (compareTabs.length) {
    var compareData = {
      classical: { spatial: 'No',  temporal: 'No',  training: 'Yes', acceleration: 'Yes', guidance: 'Yes' },
      kuramoto:  { spatial: 'Yes', temporal: 'Yes', training: 'No',  acceleration: 'No',  guidance: 'No'  },
      kddm:      { spatial: 'Yes', temporal: 'Yes', training: 'Yes', acceleration: 'Yes', guidance: 'Yes' }
    };

    var compareLabels = {};
    ['spatial', 'temporal', 'training', 'acceleration', 'guidance'].forEach(function (key) {
      compareLabels[key] = document.querySelector('.compare-grid [data-compare-label="' + key + '"]');
    });

    var comparePanel = document.getElementById('compare-panel');

    function activateCompare(key) {
      var selected = compareData[key] || compareData.classical;

      compareTabs.forEach(function (tab) {
        var isActive = tab.getAttribute('data-compare-target') === key;
        tab.classList.toggle('is-active', isActive);
        tab.setAttribute('aria-selected', String(isActive));
        tab.tabIndex = isActive ? 0 : -1;
        if (isActive && comparePanel && tab.id) {
          comparePanel.setAttribute('aria-labelledby', tab.id);
        }
      });

      Object.keys(compareLabels).forEach(function (metric) {
        var el = compareLabels[metric];
        if (el && selected[metric]) el.textContent = selected[metric];
      });
    }

    var compareTabList = Array.prototype.slice.call(compareTabs);

    compareTabs.forEach(function (tab) {
      tab.addEventListener('click', function () {
        activateCompare(tab.getAttribute('data-compare-target'));
      });

      tab.addEventListener('keydown', function (event) {
        var i    = compareTabList.indexOf(tab);
        var last = compareTabList.length - 1;
        var next = i;

        if (event.key === 'ArrowRight')      next = (i === last) ? 0 : i + 1;
        else if (event.key === 'ArrowLeft')  next = (i === 0) ? last : i - 1;
        else if (event.key === 'Home')       next = 0;
        else if (event.key === 'End')        next = last;
        else return;

        event.preventDefault();
        compareTabList[next].focus();
        activateCompare(compareTabList[next].getAttribute('data-compare-target'));
      });
    });

    activateCompare('classical');
  }

  console.log('OAT paper showcase ready.');
})();
