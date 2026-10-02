(() => {
  const navToggle = document.querySelector('.nav-toggle');
  const nav = document.querySelector('.nav');
  const liveShell = document.getElementById('live-shell');
  const liveTitle = document.getElementById('live-title');
  const liveFrame = document.getElementById('live-frame');
  const liveLink = document.getElementById('live-youtube-link');
  const grid = document.getElementById('video-grid');
  const emptyState = document.getElementById('empty-state');
  const syncStatus = document.getElementById('sync-status');
  const signalState = document.getElementById('signal-state');
  const modal = document.getElementById('player-modal');
  const modalTitle = document.getElementById('modal-title');
  const modalFrame = document.getElementById('modal-iframe');

  const langs = Array.isArray(navigator.languages) && navigator.languages.length
    ? navigator.languages
    : [navigator.language || 'en'];
  const lang = langs.some(v => String(v).toLowerCase().startsWith('de')) ? 'de' : 'en';
  document.documentElement.lang = lang;

  const dictionary = {
    en: {
      nav_watch:'Watch',
      nav_program:'ASTREA SSP',
      live_now:'LIVE NOW',
      watch_youtube:'Watch on YouTube ↗',
      live_feed:'PRIMARY VIDEO FEED',
      hero_title:'Watch the build.<br>Watch the mission.',
      hero_lead:'Mission streams, engineering footage, technical videos and development updates from ASTREA SSP.',
      youtube_channel:'YouTube channel ↗',
      back_program:'Enter ASTREA SSP →',
      signal_copy:'Video feed automatically synchronized with YouTube.',
      latest_label:'01 / LATEST TRANSMISSIONS',
      latest_title:'Latest from ASTREA.',
      all_youtube:'All on YouTube ↗',
      empty_kicker:'ASTREA WATCH / STANDBY',
      empty_title:'Transmission has not started yet.',
      empty_copy:'Mission streams, engineering footage and technical videos will appear here automatically as ASTREA publishes them.',
      visit_youtube:'Visit YouTube ↗',
      visit_program:'Visit ASTREA SSP →',
      about_label:'02 / WATCH',
      about_title:'One place for every transmission.',
      about_copy:'When ASTREA is live, the active stream is pinned above the hub. When nothing is live, WATCH becomes the archive for new videos and project footage.',
      footer_copy:'Broadcast layer of ASTREA Solo Space Program.',
      feed_live:'FEED: LIVE',
      feed_ready:'FEED: ONLINE',
      feed_standby:'FEED: STANDBY',
      signal_live:'LIVE',
      signal_ready:'ONLINE',
      signal_standby:'STANDBY',
      video:'VIDEO'
    },
    de: {
      nav_watch:'Watch',
      nav_program:'ASTREA SSP',
      live_now:'JETZT LIVE',
      watch_youtube:'Auf YouTube ansehen ↗',
      live_feed:'PRIMAERER VIDEO FEED',
      hero_title:'Sieh den Build.<br>Sieh die Mission.',
      hero_lead:'Missionsstreams, Engineering-Aufnahmen, technische Videos und Entwicklungsupdates von ASTREA SSP.',
      youtube_channel:'YouTube Kanal ↗',
      back_program:'Zu ASTREA SSP →',
      signal_copy:'Video Feed wird automatisch mit YouTube synchronisiert.',
      latest_label:'01 / NEUESTE TRANSMISSIONEN',
      latest_title:'Neues von ASTREA.',
      all_youtube:'Alles auf YouTube ↗',
      empty_kicker:'ASTREA WATCH / STANDBY',
      empty_title:'Die Transmission hat noch nicht begonnen.',
      empty_copy:'Missionsstreams, Engineering-Aufnahmen und technische Videos erscheinen hier automatisch, sobald ASTREA sie veroeffentlicht.',
      visit_youtube:'YouTube besuchen ↗',
      visit_program:'ASTREA SSP besuchen →',
      about_label:'02 / WATCH',
      about_title:'Ein Ort fuer jede Transmission.',
      about_copy:'Wenn ASTREA live ist, wird der aktive Stream oben im Hub angepinnt. Wenn nichts live ist, wird WATCH zum Archiv fuer neue Videos und Projektaufnahmen.',
      footer_copy:'Broadcast Layer des ASTREA Solo Space Program.',
      feed_live:'FEED: LIVE',
      feed_ready:'FEED: ONLINE',
      feed_standby:'FEED: STANDBY',
      signal_live:'LIVE',
      signal_ready:'ONLINE',
      signal_standby:'STANDBY',
      video:'VIDEO'
    }
  };

  const t = dictionary[lang];

  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.dataset.i18n;
    if (!t[key]) return;
    if (t[key].includes('<br>')) el.innerHTML = t[key];
    else el.textContent = t[key];
  });

  navToggle?.addEventListener('click', () => {
    const open = nav.classList.toggle('open');
    navToggle.setAttribute('aria-expanded', String(open));
  });

  const formatDuration = seconds => {
    if (!Number.isFinite(seconds) || seconds <= 0) return t.video;
    const total = Math.round(seconds);
    const h = Math.floor(total / 3600);
    const m = Math.floor((total % 3600) / 60);
    const s = total % 60;
    return h > 0
      ? [h, m, s].map((v,i) => i === 0 ? String(v) : String(v).padStart(2,'0')).join(':')
      : [m, s].map(v => String(v).padStart(2,'0')).join(':');
  };

  const thumbnail = id => `https://i.ytimg.com/vi/${id}/maxresdefault.jpg`;
  const fallbackThumbnail = id => `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;

  const openPlayer = (id, title) => {
    modalTitle.textContent = title || 'ASTREA WATCH';
    modalFrame.src = `https://www.youtube-nocookie.com/embed/${encodeURIComponent(id)}?autoplay=1&rel=0`;
    modal.hidden = false;
    document.body.classList.add('modal-open');
  };

  const closePlayer = () => {
    modal.hidden = true;
    modalFrame.src = '';
    document.body.classList.remove('modal-open');
  };

  document.querySelectorAll('[data-close-player]').forEach(el => el.addEventListener('click', closePlayer));
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && !modal.hidden) closePlayer();
  });

  const renderLive = live => {
    if (!live || !live.id) {
      liveShell.hidden = true;
      return false;
    }

    liveTitle.textContent = live.title || 'ASTREA LIVE';
    liveFrame.src = `https://www.youtube-nocookie.com/embed/${encodeURIComponent(live.id)}?autoplay=1&rel=0`;
    liveLink.href = live.url || `https://www.youtube.com/watch?v=${encodeURIComponent(live.id)}`;
    liveShell.hidden = false;
    return true;
  };

  const renderVideos = videos => {
    const safeVideos = Array.isArray(videos) ? videos.filter(v => v && v.id) : [];
    grid.innerHTML = '';

    if (!safeVideos.length) {
      grid.hidden = true;
      emptyState.hidden = false;
      return false;
    }

    safeVideos.forEach(video => {
      const card = document.createElement('button');
      card.className = 'video-card';
      card.type = 'button';
      card.innerHTML = `
        <div class="video-thumb">
          <img src="${thumbnail(video.id)}" alt="" loading="lazy">
          <span class="video-play">▶</span>
        </div>
        <div class="video-meta">
          <span>YOUTUBE / ASTREA</span>
          <span>${formatDuration(video.duration)}</span>
        </div>
        <h3></h3>
      `;

      const img = card.querySelector('img');
      img.addEventListener('error', () => {
        if (!img.dataset.fallback) {
          img.dataset.fallback = '1';
          img.src = fallbackThumbnail(video.id);
        }
      });

      card.querySelector('h3').textContent = video.title || 'ASTREA video';
      card.addEventListener('click', () => openPlayer(video.id, video.title));
      grid.appendChild(card);
    });

    grid.hidden = false;
    emptyState.hidden = true;
    return true;
  };

  const setFeedState = (live, videos) => {
    if (live) {
      syncStatus.textContent = t.feed_live;
      signalState.textContent = t.signal_live;
      return;
    }

    if (videos) {
      syncStatus.textContent = t.feed_ready;
      signalState.textContent = t.signal_ready;
      return;
    }

    syncStatus.textContent = t.feed_standby;
    signalState.textContent = t.signal_standby;
  };

  fetch('/data/videos.json', {cache:'no-store'})
    .then(response => {
      if (!response.ok) throw new Error('Feed unavailable');
      return response.json();
    })
    .then(data => {
      const hasLive = renderLive(data.live);
      const hasVideos = renderVideos(data.videos);
      setFeedState(hasLive, hasVideos);
    })
    .catch(() => {
      renderLive(null);
      renderVideos([]);
      setFeedState(false, false);
    });
})();
