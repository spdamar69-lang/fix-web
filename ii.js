/* ─────────────────────────────────────────────────────
   UTILS
───────────────────────────────────────────────────── */
function debounce(fn, wait) {
    let t;
    return function (...args) {
        clearTimeout(t);
        t = setTimeout(() => fn.apply(this, args), wait);
    };
}

/* ─────────────────────────────────────────────────────
   CANVAS STARFIELD
───────────────────────────────────────────────────── */
const canvas = document.getElementById('partikel-bg');
const ctx    = canvas.getContext('2d', { alpha: true });

function resizeCanvas() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width  = window.innerWidth  * dpr;
    canvas.height = window.innerHeight * dpr;
    canvas.style.width  = window.innerWidth  + 'px';
    canvas.style.height = window.innerHeight + 'px';
    ctx.scale(dpr, dpr);
}
resizeCanvas();

class Star {
    constructor(randomY = false) { this.reset(randomY); }
    reset(randomY = false) {
        this.x       = Math.random() * window.innerWidth;
        this.y       = randomY ? Math.random() * window.innerHeight : window.innerHeight + 5;
        this.radius  = Math.random() * 1.3 + 0.2;
        this.speedY  = Math.random() * 0.13 + 0.03;
        this.speedX  = (Math.random() - 0.5) * 0.045;
        this.opacity = Math.random() * 0.5 + 0.1;
        this.fade    = Math.random() * 0.0035 + 0.001;
        this.dir     = Math.random() > 0.5 ? 1 : -1;
        this.blue    = Math.random() > 0.55;
        this.twinkle = Math.random() > 0.8;
    }
    update() {
        this.y -= this.speedY;
        this.x += this.speedX;
        const rate = this.twinkle ? this.fade * 2.5 : this.fade;
        this.opacity += rate * this.dir;
        if (this.opacity > 0.72 || this.opacity < 0.07) this.dir *= -1;
        if (this.y < -8) this.reset(false);
    }
    draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        const col = this.blue ? 'rgba(168,210,255,' : 'rgba(255,255,255,';
        ctx.fillStyle = col + this.opacity.toFixed(2) + ')';
        ctx.fill();
    }
}

let stars = [];
function initStars() {
    stars = [];
    const isMobile = window.innerWidth < 768;
    const area  = window.innerWidth * window.innerHeight;
    const count = Math.min(isMobile ? 55 : 110, Math.floor(area / 9000));
    for (let i = 0; i < count; i++) stars.push(new Star(true));
}

let animId;
function animateStars() {
    ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
    for (let i = 0, n = stars.length; i < n; i++) {
        stars[i].update();
        stars[i].draw();
    }
    animId = requestAnimationFrame(animateStars);
}

initStars();
animateStars();

window.addEventListener('resize', debounce(() => {
    resizeCanvas();
    initStars();
}, 200));

/* ─────────────────────────────────────────────────────
   PAGE VISIBILITY — pause when hidden
───────────────────────────────────────────────────── */
document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        cancelAnimationFrame(animId);
    } else {
        animateStars();
    }
});

/* ─────────────────────────────────────────────────────
   ELEMENT REFS
───────────────────────────────────────────────────── */
const progressBar = document.getElementById('progressBar');

const albumCard       = document.getElementById('albumCard');
const videoContainer  = document.getElementById('videoContainer');
const mainVideo       = document.getElementById('mainVideo');
const audioMusic      = document.getElementById('audioMusic');
const playPauseBtn    = document.getElementById('playPauseBtn');

const endingCard           = document.getElementById('endingCard');
const endingVideoContainer = document.getElementById('endingVideoContainer');
const endingVideo          = document.getElementById('endingVideo');
const endingMessage        = document.getElementById('endingMessage');

/* ═════════════════════════════════════════════════════
   SECTION CONTROLLER
   Manages full-screen section transitions
═════════════════════════════════════════════════════ */
const SectionController = (() => {
    const sections     = document.querySelectorAll('.page-section');
    const dots         = document.querySelectorAll('.section-dot');
    const btnPrevSec   = document.getElementById('sectionPrev');
    const btnNextSec   = document.getElementById('sectionNext');
    const navLabel     = document.getElementById('navSectionLabel');
    const totalSections = sections.length;

    const sectionLabels = ['Intro', 'Galeri', 'Album', 'Akhir'];
    const TRANSITION_MS = 850; // must match CSS --section-duration

    let currentIndex    = 0;
    let isTransitioning = false;

    function updateUI() {
        // Progress bar
        const pct = ((currentIndex + 1) / totalSections) * 100;
        progressBar.style.width = pct + '%';

        // Dots
        dots.forEach((dot, i) => {
            dot.classList.toggle('active', i === currentIndex);
        });

        // Buttons
        btnPrevSec.disabled = currentIndex === 0;
        const isLast = currentIndex === totalSections - 1;
        const nextLabel = btnNextSec.querySelector('span');
        if (nextLabel) nextLabel.textContent = isLast ? 'Selesai' : 'Lanjut';
        btnNextSec.disabled = isLast;

        // Navbar label
        if (navLabel) {
            navLabel.style.opacity = '0';
            navLabel.style.transform = 'translateY(4px)';
            setTimeout(() => {
                navLabel.textContent = sectionLabels[currentIndex] || '';
                navLabel.style.opacity = '1';
                navLabel.style.transform = 'translateY(0)';
            }, 200);
        }
    }

    function goTo(nextIndex, direction) {
        if (isTransitioning) return;
        if (nextIndex < 0 || nextIndex >= totalSections) return;
        if (nextIndex === currentIndex) return;

        isTransitioning = true;
        const dir = direction || (nextIndex > currentIndex ? 'forward' : 'backward');

        const currentSection = sections[currentIndex];
        const nextSection    = sections[nextIndex];

        // Reset scroll position of incoming section
        const inner = nextSection.querySelector('.section-inner');
        if (inner) inner.scrollTop = 0;

        // Remove previous active state cleanly
        currentSection.classList.remove('active');

        // Apply transition classes
        if (dir === 'forward') {
            currentSection.classList.add('exit-forward');
            nextSection.classList.add('enter-forward');
        } else {
            currentSection.classList.add('exit-backward');
            nextSection.classList.add('enter-backward');
        }

        // After transition completes
        setTimeout(() => {
            // Clean up outgoing section
            currentSection.classList.remove('exit-forward', 'exit-backward');

            // Set incoming section as active
            nextSection.classList.remove('enter-forward', 'enter-backward');
            nextSection.classList.add('active');

            currentIndex    = nextIndex;
            isTransitioning = false;

            updateUI();
        }, TRANSITION_MS);
    }

    function next() {
        if (currentIndex < totalSections - 1) {
            goTo(currentIndex + 1, 'forward');
        }
    }

    function prev() {
        if (currentIndex > 0) {
            goTo(currentIndex - 1, 'backward');
        }
    }

    function getCurrent() {
        return currentIndex;
    }

    function isAnimating() {
        return isTransitioning;
    }

    // Button listeners
    btnPrevSec.addEventListener('click', prev);
    btnNextSec.addEventListener('click', next);

    // Keyboard support (Arrow keys)
    document.addEventListener('keydown', e => {
        // Don't hijack arrow keys when album slides are active in section 3
        // Only intercept left/right arrows for section nav when NOT on section 2 (album)
        if (currentIndex === 2) return; // Let album handle its own keys

        if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
            e.preventDefault();
            next();
        }
        if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
            e.preventDefault();
            prev();
        }
    });

    // Initialize UI
    updateUI();

    return { next, prev, goTo, getCurrent, isAnimating, updateUI };
})();

/* ─────────────────────────────────────────────────────
   SWIPE GESTURE SUPPORT (vertical for section nav)
───────────────────────────────────────────────────── */
(function initSectionSwipe() {
    const container = document.getElementById('pageContainer');
    if (!container) return;

    let touchStartX = 0, touchStartY = 0, touchStartTime = 0;
    let isDragging = false;

    container.addEventListener('touchstart', e => {
        // Don't capture if touch is on the album slide frame
        if (e.target.closest('.slide-frame')) return;
        if (e.target.closest('.nav-controls')) return;
        if (e.target.closest('.section-nav')) return;

        const t = e.touches[0];
        touchStartX = t.clientX;
        touchStartY = t.clientY;
        touchStartTime = Date.now();
        isDragging = true;
    }, { passive: true });

    container.addEventListener('touchend', e => {
        if (!isDragging) return;
        isDragging = false;

        const t  = e.changedTouches[0];
        const dx = t.clientX - touchStartX;
        const dy = t.clientY - touchStartY;
        const dt = Date.now() - touchStartTime;
        const velocity = Math.abs(dy) / dt;

        const isVertical = Math.abs(dy) > Math.abs(dx);
        const isSwipe    = (Math.abs(dy) > 60 || velocity > 0.4) && isVertical;

        if (!isSwipe) return;

        if (dy < 0) {
            // Swipe up → next section
            SectionController.next();
        } else {
            // Swipe down → previous section
            SectionController.prev();
        }
    }, { passive: true });
})();

/* ─────────────────────────────────────────────────────
   SECTION 1 — Cover card → Video
───────────────────────────────────────────────────── */
albumCard.addEventListener('click', () => {
    albumCard.classList.add('hidden');
    setTimeout(() => {
        videoContainer.classList.add('active');
        mainVideo.currentTime = 0;
        mainVideo.muted = true;
        mainVideo.play()
            .then(() => setTimeout(() => { mainVideo.muted = false; }, 120))
            .catch(err => console.warn('Video play error:', err));
    }, 350);
});

mainVideo.addEventListener('ended', () => {
    mainVideo.pause();
    mainVideo.currentTime = 0;
    videoContainer.classList.remove('active');
    setTimeout(() => {
        albumCard.classList.remove('hidden');
        mainVideo.load();
    }, 400);
});

mainVideo.addEventListener('error', () => {
    videoContainer.classList.remove('active');
    setTimeout(() => {
        albumCard.classList.remove('hidden');
    }, 400);
});

/* ─────────────────────────────────────────────────────
   Music toggle
───────────────────────────────────────────────────── */
playPauseBtn.addEventListener('click', e => {
    e.preventDefault();
    e.stopPropagation();
    if (audioMusic.paused) {
        audioMusic.play()
            .then(() => { playPauseBtn.textContent = '⏸ Jeda Musik'; })
            .catch(err => console.warn('Audio play error:', err));
    } else {
        audioMusic.pause();
        playPauseBtn.textContent = '▶ Putar Musik';
    }
});

audioMusic.addEventListener('ended', () => { playPauseBtn.textContent = '▶ Putar Musik'; });

/* ═════════════════════════════════════════════════════
   ALBUM KENANGAN SLIDE (Section 3 internal)
═════════════════════════════════════════════════════ */
const albumData = [
    { title: "Pertama Kali Bertemu",      quote: "Setiap kisah besar dimulai dari satu pertemuan kecil.", image: "7.jpeg" },
    { title: "Ngak tau kenapa tapi lucu", quote: "Waktu berhenti berdetak saat aku bersamamu.", image: "2.jpeg" },
    { title: "anjaay depan umum",         quote: "Cinta sejati adalah hadiah terindah yang tak bisa dibeli.", image: "3.jpeg" },
    { title: "jujur kita keren",          quote: "Bukan tempatnya yang penting, tapi siapa yang menemanimu.", image: "4.jpeg" },
    { title: "yang ada bregsek-bregsek nyaa", quote: "Di antara ribuan wajah, aku menemukanmu. Dan itu cukup.", image: "5.jpeg" },
    { title: "si bocil",                  quote: "Sejak hari itu, duniamu menjadi duniaku juga.", image: "v.jpeg" },
    { title: "monyet",                    quote: "Aku memilihmu. Hari ini, besok, dan seterusnya.", image: "m.jpeg" },
    { title: "anjaay makan depan umum",   quote: "Waktu berhenti berdetak saat aku bersamamu.", image: "9.jpeg" },
    { title: "ngak tau mau apa",          quote: "Cinta sejati adalah hadiah terindah yang tak bisa dibeli.", image: "10.jpeg" },
    { title: "kita keren",               quote: "Cintaku padamu bukan karena sempurna, tapi karena kamu.", image: "11.jpeg" },
    { title: "huhhhh keren",             quote: "Aku tidak tahu masa depan, tapi aku yakin ingin menghadapinya bersamamu.", image: "12.jpeg" },
    { title: "umum e wees",              quote: "Selamanya bukan cukup lama untuk mencintaimu.", image: "13.jpeg" },
    { title: "sekali lagi kita keren",   quote: "Cintaku padamu seperti ombak—terus kembali meski terbentur karang.", image: "14.jpeg" },
    { title: "anjaaay",                  quote: "Kamu adalah lagu favorit yang tak pernah kulelah dengar.", image: "15.jpeg" },
    { title: "pokok e kita weesss",      quote: "Jika bisa menghentikan waktu, aku akan memilih momen bersamamu.", image: "16.jpeg" },
    { title: "When yaaaaaaaa",           quote: "Tak Perlu Sempurna, cukup kita.", image: "17.jpeg" },
    { title: "anjaay gamtek",            quote: "semesta baik karena mempertemukan kita", image: "8.jpeg" },
];

let currentSlide = 0;
let isSlideAnimating = false;

const slideStage  = document.getElementById('slideStage');
const indicators  = document.getElementById('indicators');
const pageCounter = document.getElementById('pageCounter');
const btnPrev     = document.getElementById('btnPrev');
const btnNext     = document.getElementById('btnNext');

let musicWasPlaying = false;
let musicSavedTime  = 0;

/* ── Build slides ── */
function buildSlides() {
    albumData.forEach((data, idx) => {
        const slide = document.createElement('div');
        slide.className = `slide${idx === 0 ? ' active' : ''}`;
        slide.dataset.index = idx;
        const isPhotoLeft = idx % 2 === 0;
        const imgLoading = idx === 0 ? 'eager' : 'lazy';

        slide.innerHTML = `
          <div class="photo-side" style="order:${isPhotoLeft ? 0 : 1}">
            <div class="photo-frame">
              <img src="${data.image}" alt="${data.title}" loading="${imgLoading}" decoding="async">
            </div>
          </div>
          <div class="text-side" style="order:${isPhotoLeft ? 1 : 0}">
            <div class="slide-number">Kenangan ${idx + 1}</div>
            <h2 class="slide-title">${data.title}</h2>
            <div class="slide-quote">${data.quote}</div>
          </div>
        `;
        slideStage.appendChild(slide);

        const dot = document.createElement('button');
        dot.className = `indicator${idx === 0 ? ' active' : ''}`;
        dot.setAttribute('aria-label', `Slide ${idx + 1}`);
        dot.addEventListener('click', () => goToSlide(idx));
        indicators.appendChild(dot);
    });
    updateSlideNavState();
}

function updateSlideNavState() {
    btnPrev.disabled = currentSlide === 0;
    const isLast = currentSlide === albumData.length - 1;
    const nextLabel = btnNext.querySelector('.btn-label');
    if (nextLabel) nextLabel.textContent = isLast ? 'Kembali ke Awal' : 'Selanjutnya';

    pageCounter.textContent = `${currentSlide + 1} / ${albumData.length}`;

    document.querySelectorAll('.indicator').forEach((dot, i) => {
        dot.classList.toggle('active', i === currentSlide);
    });
}

function goToSlide(nextIdx, direction = 'next') {
    if (isSlideAnimating) return;
    if (nextIdx === currentSlide) return;
    if (nextIdx < 0 || nextIdx >= albumData.length) return;
    isSlideAnimating = true;

    const slides   = slideStage.querySelectorAll('.slide');
    const outSlide = slides[currentSlide];
    const inSlide  = slides[nextIdx];
    const isMobile = window.innerWidth < 768;

    if (isMobile) {
        inSlide.style.transform  = 'scale(0.92)';
        inSlide.style.opacity    = '0';
        inSlide.style.transition = 'none';
        void inSlide.offsetHeight;
        inSlide.style.transform  = '';
        inSlide.style.opacity    = '';
        inSlide.style.transition = '';
        outSlide.classList.remove('active');
        requestAnimationFrame(() => {
            inSlide.classList.add('active');
            setTimeout(() => {
                outSlide.classList.remove('active');
                currentSlide = nextIdx;
                updateSlideNavState();
                isSlideAnimating = false;
            }, 420);
        });
    } else {
        inSlide.style.transform  = direction === 'next'
            ? 'translate3d(0,0,0) scale3d(.93,.93,1)'
            : 'translate3d(0,0,0) scale3d(.93,.93,1)';
        inSlide.style.opacity    = '0';
        inSlide.style.transition = 'none';
        void inSlide.offsetHeight;
        inSlide.style.transform  = '';
        inSlide.style.opacity    = '';
        inSlide.style.transition = '';
        outSlide.classList.remove('active');
        outSlide.classList.add(direction === 'next' ? 'exit-left' : 'exit-right');
        requestAnimationFrame(() => {
            inSlide.classList.add('active');
            setTimeout(() => {
                outSlide.classList.remove('exit-left', 'exit-right', 'active');
                currentSlide = nextIdx;
                updateSlideNavState();
                isSlideAnimating = false;
            }, 700);
        });
    }
}

function nextSlide() {
    if (currentSlide === albumData.length - 1) {
        // Wrap to first slide
        goToSlide(0, 'next');
    } else {
        goToSlide(currentSlide + 1, 'next');
    }
}
function prevSlide() { goToSlide(currentSlide - 1, 'prev'); }

btnPrev.addEventListener('click', prevSlide);
btnNext.addEventListener('click', nextSlide);

/* ── Album keyboard (only when section 3 is active) ── */
document.addEventListener('keydown', e => {
    if (SectionController.getCurrent() !== 2) return;
    if (e.key === 'ArrowRight') { e.preventDefault(); nextSlide(); }
    if (e.key === 'ArrowLeft')  { e.preventDefault(); prevSlide(); }
});

/* ── Touch / Swipe for album slides ── */
(function initSlideSwipe() {
    const frame = document.querySelector('.slide-frame');
    if (!frame) return;
    let touchStartX = 0, touchStartY = 0, touchStartTime = 0, isDragging = false;

    frame.addEventListener('touchstart', e => {
        const t = e.touches[0];
        touchStartX = t.clientX; touchStartY = t.clientY;
        touchStartTime = Date.now(); isDragging = true;
    }, { passive: true });

    frame.addEventListener('touchmove', e => {
        if (!isDragging) return;
        const dx = e.touches[0].clientX - touchStartX;
        const dy = e.touches[0].clientY - touchStartY;
        if (Math.abs(dx) > Math.abs(dy)) e.preventDefault();
    }, { passive: false });

    frame.addEventListener('touchend', e => {
        if (!isDragging) return;
        isDragging = false;
        const t        = e.changedTouches[0];
        const dx       = t.clientX - touchStartX;
        const dy       = t.clientY - touchStartY;
        const dt       = Date.now() - touchStartTime;
        const velocity = Math.abs(dx) / dt;
        const isHoriz  = Math.abs(dx) > Math.abs(dy);
        const isSwipe  = (Math.abs(dx) > 50 || velocity > 0.3) && isHoriz;
        if (!isSwipe) return;
        if (dx < 0) nextSlide(); else prevSlide();
    }, { passive: true });
})();

/* ═════════════════════════════════════════════════════
   SECTION 4 — ENDING
═════════════════════════════════════════════════════ */
function pauseMusic() {
    if (!audioMusic.paused) {
        musicWasPlaying = true;
        musicSavedTime  = audioMusic.currentTime;
        audioMusic.pause();
        playPauseBtn.textContent = '▶ Putar Musik';
    } else {
        musicWasPlaying = false;
    }
}

function resumeMusic() {
    if (musicWasPlaying) {
        audioMusic.currentTime = musicSavedTime;
        audioMusic.play()
            .then(() => { playPauseBtn.textContent = '⏸ Jeda Musik'; })
            .catch(err => console.warn('Resume error:', err));
    }
}

endingCard.addEventListener('click', () => {
    pauseMusic();
    endingCard.classList.add('hidden');
    setTimeout(() => {
        endingVideoContainer.classList.add('active');
        endingVideo.currentTime = 0;
        endingVideo.muted = true;
        endingVideo.play()
            .then(() => setTimeout(() => { endingVideo.muted = false; }, 120))
            .catch(err => console.warn('Ending video error:', err));
    }, 400);
});

endingVideo.addEventListener('ended', () => {
    endingVideo.pause();
    endingVideo.currentTime = 0;
    endingVideoContainer.classList.remove('active');
    endingMessage.classList.add('visible');
    resumeMusic();
    setTimeout(() => {
        endingCard.classList.remove('hidden');
    }, 5000);
});

endingVideo.addEventListener('error', () => {
    endingVideoContainer.classList.remove('active');
    resumeMusic();
    setTimeout(() => { endingCard.classList.remove('hidden'); }, 400);
});

/* ── Boot ── */
window.addEventListener('load', () => {
    buildSlides();
});
