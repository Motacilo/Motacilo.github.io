/**
 * Motacilo Homepage - Interactive Scripts
 */

document.addEventListener('DOMContentLoaded', () => {
  initNavbar();
  initMobileMenu();
  initScrollAnimations();
  initParticles();
  initSmoothScroll();
  loadLatestVideos();
});

/* ========================
   Navbar scroll effect
   ======================== */
function initNavbar() {
  const navbar = document.getElementById('navbar');
  let ticking = false;

  window.addEventListener('scroll', () => {
    if (!ticking) {
      requestAnimationFrame(() => {
        if (window.scrollY > 60) {
          navbar.classList.add('scrolled');
        } else {
          navbar.classList.remove('scrolled');
        }
        ticking = false;
      });
      ticking = true;
    }
  });
}

/* ========================
   Mobile menu toggle
   ======================== */
function initMobileMenu() {
  const toggle = document.getElementById('navToggle');
  const menu = document.getElementById('navMenu');

  toggle.addEventListener('click', () => {
    toggle.classList.toggle('active');
    menu.classList.toggle('open');
  });

  // Close menu when a link is clicked
  menu.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', () => {
      toggle.classList.remove('active');
      menu.classList.remove('open');
    });
  });
}

/* ========================
   Scroll fade-in animations
   ======================== */
function initScrollAnimations() {
  const elements = document.querySelectorAll('.fade-in');

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const delay = parseInt(entry.target.dataset.delay) || 0;
        setTimeout(() => {
          entry.target.classList.add('visible');
        }, delay);
        observer.unobserve(entry.target);
      }
    });
  }, {
    threshold: 0.15,
    rootMargin: '0px 0px -40px 0px'
  });

  elements.forEach(el => observer.observe(el));
}

/* ========================
   Smooth scroll for nav links
   ======================== */
function initSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', (e) => {
      const href = anchor.getAttribute('href');
      if (href === '#') return;

      e.preventDefault();
      const target = document.querySelector(href);
      if (target) {
        const offset = 80; // navbar height
        const top = target.getBoundingClientRect().top + window.scrollY - offset;
        window.scrollTo({ top, behavior: 'smooth' });
      }
    });
  });
}

/* ========================
   YouTube Latest Videos
   ======================== */
const YOUTUBE_CHANNEL_HANDLE = '@motaciloBlanka';
const YOUTUBE_CHANNEL_URL = 'https://www.youtube.com/' + YOUTUBE_CHANNEL_HANDLE;
const MAX_VIDEOS = 6;

async function loadLatestVideos() {
  const container = document.getElementById('latestVideos');
  if (!container) return;

  try {
    // Try fetching via YouTube RSS feed through a CORS proxy
    const rssUrl = `https://www.youtube.com/feeds/videos.xml?channel_id=`;

    // First, try to resolve the channel ID from the page
    // We'll use multiple CORS proxy options for reliability
    const proxyUrls = [
      `https://api.allorigins.win/raw?url=${encodeURIComponent(YOUTUBE_CHANNEL_URL)}`,
    ];

    let channelId = null;

    for (const proxyUrl of proxyUrls) {
      try {
        const response = await fetch(proxyUrl);
        if (response.ok) {
          const html = await response.text();
          // Extract channel ID from the page HTML
          const match = html.match(/channel_id=([A-Za-z0-9_-]+)/);
          if (match) {
            channelId = match[1];
            break;
          }
          // Try another pattern
          const match2 = html.match(/"channelId":"([A-Za-z0-9_-]+)"/);
          if (match2) {
            channelId = match2[1];
            break;
          }
        }
      } catch (e) {
        continue;
      }
    }

    if (channelId) {
      // Fetch the RSS feed
      const feedUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(rssUrl + channelId)}`;
      const feedResponse = await fetch(feedUrl);

      if (feedResponse.ok) {
        const feedText = await feedResponse.text();
        const videos = parseYouTubeRSS(feedText);

        if (videos.length > 0) {
          renderVideos(container, videos.slice(0, MAX_VIDEOS));
          return;
        }
      }
    }

    // If all else fails, show fallback
    console.warn('YouTube feed fetch failed or yieled no results.');
    renderFallback(container, true);

  } catch (error) {
    console.error('Failed to load videos:', error);
    renderFallback(container, true);
  }
}

function parseYouTubeRSS(xmlText) {
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(xmlText, 'application/xml');
    const entries = doc.querySelectorAll('entry');
    const videos = [];

    entries.forEach(entry => {
      const videoId = entry.querySelector('videoId')?.textContent ||
        entry.querySelector('yt\\:videoId')?.textContent;
      const title = entry.querySelector('title')?.textContent;
      const published = entry.querySelector('published')?.textContent;

      if (videoId && title) {
        videos.push({
          id: videoId,
          title: title,
          thumbnail: `https://i.ytimg.com/vi/${videoId}/mqdefault.jpg`,
          url: `https://www.youtube.com/watch?v=${videoId}`,
          date: published ? formatDate(published) : ''
        });
      }
    });

    return videos;
  } catch (e) {
    console.error('Error parsing XML:', e);
    return [];
  }
}

function formatDate(dateStr) {
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  } catch {
    return '';
  }
}

function renderVideos(container, videos) {
  container.innerHTML = videos.map(video => `
    <a href="${video.url}" class="video-card" target="_blank" rel="noopener">
      <div class="video-card-thumb">
        <img src="${video.thumbnail}" alt="${escapeHtml(video.title)}" loading="lazy">
        <div class="video-card-play">
          <svg viewBox="0 0 24 24"><polygon points="8,5 19,12 8,19"/></svg>
        </div>
      </div>
      <div class="video-card-info">
        <p class="video-card-title">${escapeHtml(video.title)}</p>
        ${video.date ? `<p class="video-card-date">${video.date}</p>` : ''}
      </div>
    </a>
  `).join('');
}

function renderFallback(container, isError = false) {
  let message = '最新の動画はYouTubeチャンネルでご覧いただけます。';
  if (isError && window.location.protocol === 'file:') {
    message = 'ローカル環境（file://）ではセキュリティ制限により<br>動画フィードが表示されない場合があります。<br>YouTubeチャンネルで直接ご覧ください。';
  } else if (isError) {
    message = '動画フィードの読み込みに失敗しました。<br>YouTubeチャンネルで直接ご覧ください。';
  }

  container.innerHTML = `
    <div class="latest-videos-fallback">
      <p>${message}</p>
      <a href="${YOUTUBE_CHANNEL_URL}" class="btn btn-primary" target="_blank" rel="noopener">
        YouTubeで見る
      </a>
    </div>
  `;
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

/* ========================
   Particle animation (Canvas)
   ======================== */
function initParticles() {
  const canvas = document.getElementById('particleCanvas');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  let particles = [];
  let animationId;

  function resize() {
    canvas.width = canvas.parentElement.offsetWidth;
    canvas.height = canvas.parentElement.offsetHeight;
  }

  resize();
  window.addEventListener('resize', resize);

  // Soft, warm-colored particles
  const colors = [
    'rgba(255, 113, 112, 0.15)',
    'rgba(255, 185, 135, 0.12)',
    'rgba(167, 139, 250, 0.12)',
    'rgba(129, 140, 248, 0.10)',
    'rgba(255, 182, 193, 0.12)',
  ];

  class Particle {
    constructor() {
      this.reset();
    }

    reset() {
      this.x = Math.random() * canvas.width;
      this.y = Math.random() * canvas.height;
      this.size = Math.random() * 80 + 30;
      this.speedX = (Math.random() - 0.5) * 0.3;
      this.speedY = (Math.random() - 0.5) * 0.3;
      this.color = colors[Math.floor(Math.random() * colors.length)];
      this.life = Math.random() * 0.5 + 0.5;
    }

    update() {
      this.x += this.speedX;
      this.y += this.speedY;

      // Wrap around edges
      if (this.x < -this.size) this.x = canvas.width + this.size;
      if (this.x > canvas.width + this.size) this.x = -this.size;
      if (this.y < -this.size) this.y = canvas.height + this.size;
      if (this.y > canvas.height + this.size) this.y = -this.size;
    }

    draw() {
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
      ctx.fillStyle = this.color;
      ctx.fill();
    }
  }

  // Create particles
  const count = Math.min(Math.floor((canvas.width * canvas.height) / 40000), 20);
  for (let i = 0; i < count; i++) {
    particles.push(new Particle());
  }

  function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    particles.forEach(p => {
      p.update();
      p.draw();
    });
    animationId = requestAnimationFrame(animate);
  }

  animate();

  // Pause when not visible
  const heroObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        if (!animationId) animate();
      } else {
        cancelAnimationFrame(animationId);
        animationId = null;
      }
    });
  });

  heroObserver.observe(canvas.parentElement);
}
