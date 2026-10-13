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
  let savedLanguage = null;
  try { savedLanguage = localStorage.getItem('astrea-language'); } catch (_) { /* storage may be unavailable */ }
  const lang = savedLanguage === 'de' || savedLanguage === 'en' ? savedLanguage : (langs.some(v => String(v).toLowerCase().startsWith('de')) ? 'de' : 'en');
  document.documentElement.lang = lang;

  const dictionary = {
    en: {
      nav_overview:'Overview',
      nav_projects:'Systems',
      nav_about:'The Program',
      nav_watch:'Watch',
      nav_discord:'Discord ↗',
      nav_github:'GitHub ↗',
      menu:'MENU',
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
      video:'VIDEO',
      allow_video:'Load YouTube video', privacy_notice:'Only when you continue will an embedded player connect to YouTube (Google) and transmit technical information, including your IP address.',
      live_notice:'Load YouTube livestream. This establishes a connection to YouTube (Google).', close_video:'Close video player'
    },
    de: {
      nav_overview:'Übersicht',
      nav_projects:'Systeme',
      nav_about:'Das Programm',
      nav_watch:'Watch',
      nav_discord:'Discord ↗',
      nav_github:'GitHub ↗',
      menu:'MENÜ',
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
      video:'VIDEO',
      allow_video:'YouTube-Video laden', privacy_notice:'Erst wenn du fortfährst, verbindet sich der eingebettete Player mit YouTube (Google). Dabei werden technische Daten einschließlich deiner IP-Adresse übermittelt.',
      live_notice:'YouTube-Livestream laden. Dadurch wird eine Verbindung zu YouTube (Google) hergestellt.', close_video:'Videoplayer schließen'
    }
  };

  const t = dictionary[lang];
  const switcher = document.createElement('div');
  switcher.className = 'language-switch';
  switcher.setAttribute('role', 'group');
  switcher.setAttribute('aria-label', lang === 'de' ? 'Sprache wählen' : 'Select language');
  for (const code of ['de','en']) {
    const button = document.createElement('button');
    button.type = 'button'; button.lang = code; button.textContent = code.toUpperCase();
    button.setAttribute('aria-pressed', String(lang === code));
    button.setAttribute('aria-label', code === 'de' ? 'Deutsch' : 'English');
    button.addEventListener('click', () => {
      try { localStorage.setItem('astrea-language', code); } catch (_) { /* no storage */ }
      location.reload();
    });
    switcher.appendChild(button);
  }
  document.querySelector('.site-header')?.appendChild(switcher);
  if (lang === 'en' && !document.querySelector('.error-shell')) {
    const note = document.createElement('p'); note.className = 'language-note';
    note.innerHTML = 'ASTREA currently publishes mainly in German. International visitors are welcome. <a href="https://discord.gg/NRd868Dkj2" target="_blank" rel="noopener noreferrer">Join Discord ↗</a>';
    document.querySelector('main')?.prepend(note);
  }
  const validId = id => typeof id === 'string' && /^[A-Za-z0-9_-]{11}$/.test(id);
  let lastTrigger = null;
  let pendingId = null;
  const embedUrl = id => 'https://www.youtube-nocookie.com/embed/' + encodeURIComponent(id) + '?autoplay=1&rel=0';
  const localThumbnail = id => '/assets/thumbnails/' + encodeURIComponent(id) + '.jpg';
  const hasLocalThumbnail = item => item && validId(item.id) && item.thumbnail === localThumbnail(item.id);
  const privacyPrompt = document.getElementById('player-consent');
  const privacyText = document.getElementById('player-consent-text');
  const privacyButton = document.getElementById('player-consent-button');


  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.dataset.i18n;
    if (!t[key]) return;
    if (t[key].includes('<br>')) el.innerHTML = t[key];
    else el.textContent = t[key];
  });

  navToggle?.setAttribute('aria-label', lang === 'de' ? 'Navigation öffnen' : 'Open navigation');
  navToggle?.addEventListener('click', () => {
    const open = nav.classList.toggle('open');
    navToggle.setAttribute('aria-expanded', String(open));
  });
  nav?.querySelectorAll('a').forEach(link => link.addEventListener('click', () => {
    nav.classList.remove('open');
    navToggle?.setAttribute('aria-expanded','false');
  }));

  // WATCH 404 shares navigation, translation and language selection,
  // but has no video-player DOM.
  if (!liveShell || !modal || !grid || !privacyText || !privacyButton) return;
  privacyText.textContent = t.privacy_notice;
  privacyButton.textContent = t.allow_video;
  const closeButton = document.querySelector('.modal-close');
  if (closeButton) closeButton.textContent = lang === 'de' ? 'SCHLIESSEN' : 'CLOSE';
  document.querySelectorAll('[data-close-player]').forEach(el => el.setAttribute('aria-label', t.close_video));

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


  const openPlayer = (id, title) => {
    if (!validId(id)) return;
    pendingId = id;
    lastTrigger = document.activeElement;
    modalTitle.textContent = title || 'ASTREA WATCH';
    modalFrame.removeAttribute('src');
    privacyPrompt.hidden = false;
    modalFrame.hidden = true;
    modal.hidden = false;
    document.body.classList.add('modal-open');
    privacyButton.focus();
  };
  privacyButton.addEventListener('click', () => {
    if (!validId(pendingId)) return;
    modalFrame.src = embedUrl(pendingId);
    modalFrame.hidden = false;
    privacyPrompt.hidden = true;
    document.querySelector('[data-close-player].modal-close')?.focus();
  });

  const closePlayer = () => {
    modal.hidden = true;
    modalFrame.removeAttribute('src');
    pendingId = null;
    document.body.classList.remove('modal-open');
    if (lastTrigger && typeof lastTrigger.focus === 'function') lastTrigger.focus();
  };
  document.querySelectorAll('[data-close-player]').forEach(el => el.addEventListener('click', closePlayer));
  document.addEventListener('keydown', event => {
    if (modal.hidden) return;
    if (event.key === 'Escape') { closePlayer(); return; }
    if (event.key === 'Tab') {
      const controls = [...modal.querySelectorAll('button:not([hidden]), a[href]')].filter(el => el.getClientRects().length > 0);
      if (!controls.length) return;
      const first = controls[0], last = controls[controls.length-1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    }
  });

  const renderLive = live => {
    if (!live || !validId(live.id)) {
      liveShell.hidden = true;
      liveFrame.removeAttribute('src');
      return false;
    }
    liveTitle.textContent = live.title || 'ASTREA LIVE';
    liveFrame.removeAttribute('src');
    const poster = document.getElementById('live-poster');
    if (poster) {
      poster.hidden = !hasLocalThumbnail(live);
      if (hasLocalThumbnail(live)) {
        poster.src = localThumbnail(live.id);
        poster.onerror = () => { poster.hidden = true; };
      } else {
        poster.removeAttribute('src');
      }
    }
    const consent = document.getElementById('live-consent');
    consent.hidden = false;
    consent.textContent = t.live_notice;
    consent.onclick = () => {
      liveFrame.src = embedUrl(live.id);
      if (poster) poster.hidden = true;
      consent.hidden = true;
    };
    liveLink.href = 'https://www.youtube.com/watch?v=' + encodeURIComponent(live.id);
    liveShell.hidden = false;
    return true;
  };

  const renderVideos = videos => {
    const safeVideos = Array.isArray(videos) ? videos.filter(v => v && validId(v.id)) : [];
    grid.replaceChildren();
    if (!safeVideos.length) {
      grid.hidden = true; emptyState.hidden = false; return false;
    }
    safeVideos.forEach(video => {
      const card = document.createElement('button');
      card.className = 'video-card';
      card.type = 'button';
      const thumb = document.createElement('div'); thumb.className = 'video-thumb video-thumb--local';
      const text = document.createElement('span'); text.className = 'video-thumbnail-label'; text.textContent = 'ASTREA / WATCH';
      const play = document.createElement('span'); play.className = 'video-play'; play.textContent = '▶';
      thumb.append(text,play);
      if (hasLocalThumbnail(video)) {
        const image = document.createElement('img');
        image.src = localThumbnail(video.id);
        image.alt = '';
        image.loading = 'lazy';
        text.hidden = true;
        image.addEventListener('error', () => {
          image.remove();
          text.hidden = false;
        });
        thumb.prepend(image);
      }
      const meta = document.createElement('div'); meta.className = 'video-meta';
      const m1 = document.createElement('span'); m1.textContent = 'YOUTUBE / ASTREA';
      const m2 = document.createElement('span'); m2.textContent = formatDuration(video.duration);
      meta.append(m1,m2);
      const title = document.createElement('h3'); title.textContent = video.title || 'ASTREA video';
      card.append(thumb,meta,title);
      card.setAttribute('aria-label', (lang === 'de' ? 'Videoinformationen und Wiedergabe: ' : 'Video details and playback: ') + title.textContent);
      card.addEventListener('click', () => openPlayer(video.id, video.title));
      grid.appendChild(card);
    });
    grid.hidden = false; emptyState.hidden = true; return true;
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
