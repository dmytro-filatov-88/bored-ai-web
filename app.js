(function () {
  var deployedSites = [];
  var queuedIdeas = [];
  var visitedSlugs = [];

  try {
    visitedSlugs = JSON.parse(localStorage.getItem('bored_ai_visited') || '[]');
  } catch (e) {
    visitedSlugs = [];
  }

  function playTeleportSound() {
    try {
      var Ctx = window.AudioContext || window.webkitAudioContext;
      var ctx = new Ctx();
      var osc = ctx.createOscillator();
      var gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(220, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.18);
      gain.gain.setValueAtTime(0.18, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.2);
    } catch (e) {}
  }

  function pickRandomSite() {
    if (!deployedSites.length) {
      alert('The AI is deploying its first batch of websites right now! Check back in a minute.');
      return;
    }
    var unvisited = deployedSites.filter(function (s) {
      return visitedSlugs.indexOf(s.slug) === -1;
    });

    if (unvisited.length === 0) {
      visitedSlugs = [];
      unvisited = deployedSites.slice();
    }

    var pick = unvisited[Math.floor(Math.random() * unvisited.length)];
    visitedSlugs.push(pick.slug);
    try {
      localStorage.setItem('bored_ai_visited', JSON.stringify(visitedSlugs));
    } catch (e) {}

    playTeleportSound();
    window.open(pick.url, '_blank', 'noopener');
    updateHint();
  }

  function updateHint() {
    var hint = document.getElementById('last-visited-hint');
    if (!hint || !deployedSites.length) return;
    var remaining = deployedSites.filter(function (s) {
      return visitedSlugs.indexOf(s.slug) === -1;
    }).length;
    hint.textContent =
      remaining + ' of ' + deployedSites.length + ' unvisited sites left in your deck.';
  }

  function reportBrokenSite(slug, url) {
    var note = window.prompt(
      'What is broken on "' + slug + '"? (The AI repair subagent will read this and fix it)',
      ''
    );
    if (note === null) return;
    var title = '[BROKEN] ' + slug + (note ? ': ' + note.slice(0, 60) : '');
    var body = [
      '### Broken Site Report (From Hub)',
      '- **Slug**: `' + slug + '`',
      '- **URL**: ' + url,
      '- **User Note**: ' + (note || '_Reported from Bored AI Web Hub._')
    ].join('\n');

    var issueUrl =
      'https://github.com/dmytro-filatov-88/bored-ai-web/issues/new?labels=broken-site&title=' +
      encodeURIComponent(title) +
      '&body=' +
      encodeURIComponent(body);
    window.open(issueUrl, '_blank', 'noopener');
  }

  function renderDeployed() {
    var grid = document.getElementById('deployed-grid');
    document.getElementById('stat-deployed').textContent = deployedSites.length + ' Sites Built';
    document.getElementById('badge-deployed').textContent = deployedSites.length;

    if (!deployedSites.length) {
      grid.innerHTML =
        '<div class="site-card"><p class="card-desc">Autonomous agent is building initial sites...</p></div>';
      return;
    }

    var sorted = deployedSites.slice().reverse();
    grid.innerHTML = sorted
      .map(function (site) {
        return (
          '<article class="site-card">' +
          '<div>' +
          '<div class="card-meta">' +
          '<span class="tag">' + escapeHtml(site.category || 'Experiment') + '</span>' +
          '<span class="model-badge">⚡ ' + escapeHtml(site.model || 'flash') + ' • ' + escapeHtml(site.date || '') + '</span>' +
          '</div>' +
          '<h2 class="card-title">' + escapeHtml(site.title) + '</h2>' +
          '<p class="card-desc" style="margin-top:8px">' + escapeHtml(site.description) + '</p>' +
          '</div>' +
          '<div class="card-actions">' +
          '<a class="launch-link" href="' + escapeHtml(site.url) + '" target="_blank" rel="noopener">Launch Site ↗</a>' +
          '<button class="bug-btn" type="button" data-slug="' + escapeHtml(site.slug) + '" data-url="' + escapeHtml(site.url) + '">🐛 Fix</button>' +
          '</div>' +
          '</article>'
        );
      })
      .join('');

    grid.querySelectorAll('.bug-btn').forEach(function (b) {
      b.addEventListener('click', function () {
        reportBrokenSite(b.getAttribute('data-slug'), b.getAttribute('data-url'));
      });
    });

    updateHint();
  }

  function renderQueue() {
    var list = document.getElementById('queue-list');
    document.getElementById('stat-queued').textContent = queuedIdeas.length + ' In Queue';
    document.getElementById('badge-queue').textContent = queuedIdeas.length;

    if (!queuedIdeas.length) {
      list.innerHTML = '<p class="card-desc">Queue is empty — flash_lite will refill it shortly.</p>';
      return;
    }

    list.innerHTML = queuedIdeas
      .map(function (item, idx) {
        var isNext = idx === 0;
        var compClass = 'comp-' + (item.complexity || 'simple');
        var modelLabel = item.complexity === 'complex' ? 'pro / argon' : 'flash';
        return (
          '<div class="queue-item ' + (isNext ? 'next-up' : '') + '">' +
          '<div class="queue-left">' +
          '<div class="rank-badge">#' + item.rank + '</div>' +
          '<div class="queue-info">' +
          '<h3>' +
          escapeHtml(item.title) +
          (isNext ? ' <span class="tag">NEXT UP TOMORROW</span>' : '') +
          ' <span class="comp-badge ' + compClass + '">' + escapeHtml(item.complexity) + ' → ' + modelLabel + '</span>' +
          '</h3>' +
          '<p>' + escapeHtml(item.description) + '</p>' +
          '</div>' +
          '</div>' +
          '<div class="card-meta">' +
          '<span class="model-badge">`' + escapeHtml(item.slug) + '`</span>' +
          '</div>' +
          '</div>'
        );
      })
      .join('');
  }

  function escapeHtml(str) {
    return String(str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  // Tab switching
  document.querySelectorAll('.tab-btn').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var target = btn.getAttribute('data-tab');
      document.querySelectorAll('.tab-btn').forEach(function (b) {
        b.classList.toggle('active', b === btn);
      });
      document.querySelectorAll('.tab-panel').forEach(function (p) {
        p.classList.toggle('active', p.id === 'tab-' + target);
      });
    });
  });

  document.getElementById('teleport-btn').addEventListener('click', pickRandomSite);

  // Load registry.json and queue.json
  Promise.all([
    fetch('registry.json?t=' + Date.now()).then(function (r) { return r.ok ? r.json() : []; }).catch(function () { return []; }),
    fetch('queue.json?t=' + Date.now()).then(function (r) { return r.ok ? r.json() : []; }).catch(function () { return []; })
  ]).then(function (results) {
    deployedSites = Array.isArray(results[0]) ? results[0] : [];
    queuedIdeas = Array.isArray(results[1]) ? results[1] : [];
    renderDeployed();
    renderQueue();
  });
})();
