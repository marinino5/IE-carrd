(() => {
    'use strict';

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const $ = (sel, ctx = document) => ctx.querySelector(sel);
    const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];


    /* ==========================================
       AÑO ACTUAL
    ========================================== */

    const year = $('#current-year');
    if (year) year.textContent = new Date().getFullYear();


    /* ==========================================
       ENTRADA SUAVE AL HACER SCROLL
    ========================================== */

    const reveals = $$('.reveal');

    if ('IntersectionObserver' in window) {
        const io = new IntersectionObserver((entries, obs) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('is-visible');
                    obs.unobserve(entry.target);
                }
            });
        }, { threshold: 0.15, rootMargin: '0px 0px -30px 0px' });

        reveals.forEach(el => io.observe(el));
    } else {
        reveals.forEach(el => el.classList.add('is-visible'));
    }


    /* ==========================================
       FILA DE PRODUCTOS EN MOVIMIENTO CONTINUO
       Se duplica la lista para que el bucle no tenga cortes.
    ========================================== */

    // Aplica a la fila de productos y a la cinta de marcas.
    // data-speed = píxeles por segundo (opcional).
    if (!reduceMotion) {
        $$('[data-marquee]').forEach(marquee => {
            const track = $('[data-marquee-track]', marquee);
            if (!track) return;

            [...track.children].forEach(item => {
                const copy = item.cloneNode(true);
                copy.setAttribute('aria-hidden', 'true');
                track.appendChild(copy);
            });

            const speed = Number(track.dataset.speed) || 38;
            const setSpeed = () => {
                const half = track.scrollWidth / 2;
                track.style.setProperty('--duration', `${Math.round(half / speed)}s`);
            };
            setSpeed();
            window.addEventListener('load', setSpeed);
            window.addEventListener('resize', setSpeed);

            marquee.addEventListener('touchstart', () => marquee.classList.add('is-paused'), { passive: true });
            ['touchend', 'touchcancel'].forEach(type =>
                marquee.addEventListener(type, () => marquee.classList.remove('is-paused'), { passive: true })
            );
        });
    }


    /* ==========================================
       INCLINACIÓN 3D SUAVE (solo con mouse)
    ========================================== */

    if (!reduceMotion && window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
        const MAX = 6;

        $$('[data-tilt]').forEach(el => {
            el.addEventListener('pointermove', e => {
                const r = el.getBoundingClientRect();
                const px = (e.clientX - r.left) / r.width - 0.5;
                const py = (e.clientY - r.top) / r.height - 0.5;
                el.style.transition = 'transform .12s ease-out, box-shadow .35s ease';
                el.style.transform =
                    `perspective(600px) rotateX(${(-py * MAX * 2).toFixed(2)}deg) rotateY(${(px * MAX * 2).toFixed(2)}deg) translateY(-3px)`;
                el.style.boxShadow = '0 18px 30px -18px rgba(45, 8, 56, .45)';
            });

            el.addEventListener('pointerleave', () => {
                el.style.transition = '';
                el.style.transform = '';
                el.style.boxShadow = '';
            });
        });
    }


    /* ==========================================
       ONDA DE CLIC
    ========================================== */

    document.addEventListener('pointerdown', e => {
        const target = e.target.closest('.ripple');
        if (!target || reduceMotion) return;

        const r = target.getBoundingClientRect();
        const size = Math.max(r.width, r.height) * 2;
        const wave = document.createElement('span');

        wave.className = 'ripple__wave';
        wave.style.width = wave.style.height = `${size}px`;
        wave.style.left = `${e.clientX - r.left - size / 2}px`;
        wave.style.top = `${e.clientY - r.top - size / 2}px`;

        target.appendChild(wave);
        wave.addEventListener('animationend', () => wave.remove(), { once: true });
    });


    /* ==========================================
       MENSAJE FLOTANTE
    ========================================== */

    const toastEl = $('[data-toast]');
    let toastTimer;

    const toast = message => {
        if (!toastEl) return;
        toastEl.innerHTML =
            '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m5 12.5 4.5 4.5L19 7.5"/></svg>' +
            `<span>${message}</span>`;
        toastEl.classList.add('is-visible');
        clearTimeout(toastTimer);
        toastTimer = setTimeout(() => toastEl.classList.remove('is-visible'), 2200);
    };


    /* ==========================================
       COPIAR TELÉFONO / CORREO
    ========================================== */

    const copyText = async text => {
        try {
            await navigator.clipboard.writeText(text);
            return true;
        } catch {
            const area = document.createElement('textarea');
            area.value = text;
            area.setAttribute('readonly', '');
            area.style.position = 'fixed';
            area.style.opacity = '0';
            document.body.appendChild(area);
            area.select();
            let ok = false;
            try { ok = document.execCommand('copy'); } catch { ok = false; }
            area.remove();
            return ok;
        }
    };

    $$('[data-copy]').forEach(btn => {
        let resetTimer;

        btn.addEventListener('click', async () => {
            const ok = await copyText(btn.dataset.copy);
            if (!ok) {
                toast('No se pudo copiar');
                return;
            }
            btn.classList.add('is-copied');
            toast(btn.dataset.copyMsg || 'Copiado');
            clearTimeout(resetTimer);
            resetTimer = setTimeout(() => btn.classList.remove('is-copied'), 1800);
        });
    });


    /* ==========================================
       QR FLOTANTE + MODAL
       La librería del QR se descarga solo al abrirlo.
    ========================================== */

    const qrOpen = $('[data-qr-open]');
    const qrModal = $('[data-qr-modal]');
    const qrBox = $('[data-qr-code]');
    let qrReady = false;

    const loadScript = src => new Promise((resolve, reject) => {
        const s = document.createElement('script');
        s.src = src;
        s.onload = resolve;
        s.onerror = reject;
        document.head.appendChild(s);
    });

    const closeQr = () => {
        if (typeof qrModal.close === 'function') qrModal.close();
        else qrModal.removeAttribute('open');
    };

    if (qrOpen && qrModal && qrBox) {
        qrOpen.addEventListener('click', async () => {
            if (typeof qrModal.showModal === 'function') qrModal.showModal();
            else qrModal.setAttribute('open', '');

            if (qrReady) return;
            qrBox.textContent = 'Generando…';

            try {
                if (!window.QRCode) {
                    await loadScript('https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js');
                }
                qrBox.textContent = '';
                new window.QRCode(qrBox, {
                    text: window.location.href.split('#')[0],
                    width: 210,
                    height: 210,
                    colorDark: '#2d0838',
                    colorLight: '#ffffff',
                    correctLevel: window.QRCode.CorrectLevel.M
                });
                qrReady = true;
            } catch {
                qrBox.textContent = 'No se pudo generar el código. Revisa tu conexión.';
            }
        });

        $('[data-qr-close]')?.addEventListener('click', closeQr);
        qrModal.addEventListener('click', e => {
            if (e.target === qrModal) closeQr();
        });
    }
})();