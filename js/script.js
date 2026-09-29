(() => {
    'use strict';

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');


    /* ==========================================
       AÑO ACTUAL EN EL FOOTER
    ========================================== */

    const year = document.getElementById('current-year');
    if (year) year.textContent = new Date().getFullYear();


    /* ==========================================
       ENTRADA SUAVE AL HACER SCROLL
    ========================================== */

    const reveals = document.querySelectorAll('.reveal');

    if ('IntersectionObserver' in window) {
        const observer = new IntersectionObserver((entries, obs) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('is-visible');
                    obs.unobserve(entry.target);
                }
            });
        }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });

        reveals.forEach(el => observer.observe(el));
    } else {
        reveals.forEach(el => el.classList.add('is-visible'));
    }


    /* ==========================================
       CARRUSEL DE PRODUCTOS
    ========================================== */

    const track = document.querySelector('[data-carousel-track]');
    if (!track) return;

    const prevBtn = document.querySelector('[data-carousel-prev]');
    const nextBtn = document.querySelector('[data-carousel-next]');
    const bar = document.querySelector('[data-carousel-bar]');

    // Distancia de un "paso": ancho de una tarjeta + el espacio entre tarjetas
    const stepSize = () => {
        const item = track.querySelector('.product');
        if (!item) return track.clientWidth * 0.8;
        const gap = parseFloat(getComputedStyle(track).columnGap) || 0;
        return item.getBoundingClientRect().width + gap;
    };

    const move = direction => {
        track.scrollBy({
            left: direction * stepSize(),
            behavior: reduceMotion.matches ? 'auto' : 'smooth'
        });
    };

    prevBtn?.addEventListener('click', () => move(-1));
    nextBtn?.addEventListener('click', () => move(1));

    // Flechas del teclado cuando el carrusel tiene el foco
    track.addEventListener('keydown', e => {
        if (e.key === 'ArrowRight') { e.preventDefault(); move(1); }
        if (e.key === 'ArrowLeft')  { e.preventDefault(); move(-1); }
    });

    // Estado de las flechas + barra de progreso
    let ticking = false;

    const update = () => {
        const max = track.scrollWidth - track.clientWidth;
        const x = track.scrollLeft;

        if (prevBtn) prevBtn.disabled = x <= 4;
        if (nextBtn) nextBtn.disabled = x >= max - 4;

        if (bar) {
            const visible = Math.min(1, track.clientWidth / track.scrollWidth);
            const progress = max > 0 ? x / max : 0;
            bar.style.width = `${visible * 100}%`;
            bar.style.transform = `translateX(${progress * (1 / visible - 1) * 100}%)`;
        }

        ticking = false;
    };

    track.addEventListener('scroll', () => {
        if (!ticking) {
            requestAnimationFrame(update);
            ticking = true;
        }
    }, { passive: true });

    window.addEventListener('resize', update);
    window.addEventListener('load', update);
    update();
})();