/**
 * MR.FANTASTIC - Site Interactivity
 * Optimized with defensive checks for zero console errors.
 */

document.addEventListener('DOMContentLoaded', () => {
    
    // 1. CUSTOM CURSOR
    const cursor = document.getElementById('cursor');
    if (cursor) {
        document.addEventListener('mousemove', e => {
            cursor.style.left = e.clientX + 'px';
            cursor.style.top = e.clientY + 'px';
        });

        document.querySelectorAll('a, button, .work-item, .portfolio-item, .tier-cta').forEach(el => {
            el.addEventListener('mouseenter', () => cursor.classList.add('hover'));
            el.addEventListener('mouseleave', () => cursor.classList.remove('hover'));
        });
    }

    // 2. HAMBURGER MENU (Global)
    const hamburger = document.getElementById('hamburger');
    const menuOverlay = document.getElementById('menuOverlay');
    
    if (hamburger && menuOverlay) {
        let menuOpen = false;

        const toggleMenu = (state) => {
            menuOpen = state;
            hamburger.classList.toggle('open', menuOpen);
            menuOverlay.classList.toggle('open', menuOpen);
            document.body.style.overflow = menuOpen ? 'hidden' : '';
        };

        hamburger.addEventListener('click', () => toggleMenu(!menuOpen));

        menuOverlay.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => toggleMenu(false));
        });

        // Active nav state
        const currentPage = window.location.pathname.split('/').pop() || 'index.html';
        menuOverlay.querySelectorAll('a').forEach(link => {
            const linkPage = link.getAttribute('href');
            if (linkPage === currentPage) {
                link.classList.add('nav-active');
            }
        });
    }

    // 3. CONTACT FORM — Formspree 
    const cfSubmit = document.getElementById('cfSubmit');
    const contactForm = document.getElementById('contactFormEl');
    const cfSuccess = document.getElementById('cfSuccess');

    if (cfSubmit && contactForm) {
        cfSubmit.addEventListener('click', async () => {
            const name    = document.getElementById('cfname')?.value.trim();
            const email   = document.getElementById('cfemail')?.value.trim();
            const subject = document.getElementById('cfsubject')?.value.trim();
            const msg     = document.getElementById('cfmsg')?.value.trim();

            if (!name || !email || !msg) {
                cfSubmit.textContent = 'Fill in required fields ↑';
                setTimeout(() => cfSubmit.textContent = 'Send message →', 2500);
                return;
            }

            // Loading state
            cfSubmit.disabled = true;
            cfSubmit.textContent = 'Sending…';

            try {
                const res = await fetch('https://formspree.io/f/mlgalvdo', {
                    method: 'POST',
                    headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name, email, subject, message: msg })
                });

                if (res.ok) {
                    contactForm.style.display = 'none';
                    cfSuccess?.classList.add('show');
                } else {
                    throw new Error('Server error');
                }
            } catch {
                cfSubmit.disabled = false;
                cfSubmit.textContent = 'Something went wrong — try again';
                setTimeout(() => cfSubmit.textContent = 'Send message →', 3000);
            }
        });
    }

    // 4. COMMISSION FORM & TIER SELECTION — Formspree 
    const tierBtns   = document.querySelectorAll('.tier-cta');
    const ftierSelect = document.getElementById('ftier');
    const submitBtn   = document.getElementById('submitBtn');

    if (tierBtns.length > 0 && ftierSelect) {
        tierBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const tierName = btn.closest('.tier-card')?.querySelector('.tier-name')?.textContent;
                if (tierName) {
                    const optionToSelect = [...ftierSelect.options].find(o => o.text.startsWith(tierName));
                    if (optionToSelect) ftierSelect.value = optionToSelect.text;
                }
                document.getElementById('commission-form')?.scrollIntoView({ behavior: 'smooth' });
            });
        });
    }

    if (submitBtn) {
        submitBtn.addEventListener('click', async () => {
            const name   = document.getElementById('fname')?.value.trim();
            const email  = document.getElementById('femail')?.value.trim();
            const tier   = document.getElementById('ftier')?.value;
            const style  = document.getElementById('fstyle')?.value;
            const desc   = document.getElementById('fdesc')?.value.trim();
            const social = document.getElementById('fsocial')?.value.trim();

            if (!name || !email || !desc) {
                submitBtn.textContent = 'Fill in required fields ↑';
                setTimeout(() => submitBtn.textContent = 'Send the brief →', 2500);
                return;
            }

            // Loading state
            submitBtn.disabled = true;
            submitBtn.textContent = 'Sending…';

            try {
                const res = await fetch('https://formspree.io/f/xeevzvyo', {
                    method: 'POST',
                    headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        name,
                        email,
                        tier:        tier   || 'Not specified',
                        style:       style  || 'Not specified',
                        description: desc,
                        social:      social || '—'
                    })
                });

                if (res.ok) {
                    const wrapper = document.getElementById('commissionFormWrapper');
                    const success = document.getElementById('formSuccess');
                    if (wrapper) wrapper.style.display = 'none';
                    if (success) success.classList.add('show');
                } else {
                    throw new Error('Server error');
                }
            } catch {
                submitBtn.disabled = false;
                submitBtn.textContent = 'Something went wrong — try again';
                setTimeout(() => submitBtn.textContent = 'Send the brief →', 3000);
            }
        });
    }

    // 5. PORTFOLIO FILTER & LIGHTBOX (Portfolio Page Only)
    const filterBtns     = document.querySelectorAll('.filter-btn');
    const portfolioItems = document.querySelectorAll('.portfolio-item');
    const lightbox       = document.getElementById('lightbox');

    if (filterBtns.length > 0 && portfolioItems.length > 0) {
        filterBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                filterBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                const filter = btn.dataset.filter;
                
                portfolioItems.forEach(item => {
                    const match = filter === 'all' || item.dataset.cat?.includes(filter);
                    item.style.display = match ? 'block' : 'none';
                });
            });
        });
    }

    if (lightbox) {
        const lbImg   = document.getElementById('lightboxImg');
        const lbTitle = document.getElementById('lightboxTitle');
        const lbTag   = document.getElementById('lightboxTag');
        const lbClose = document.getElementById('lightboxClose');
        const lbPrev  = document.getElementById('lightboxPrev');
        const lbNext  = document.getElementById('lightboxNext');
        let currentIdx = 0;
        const allItemsArr = Array.from(portfolioItems);

        const openLightbox = (idx) => {
            currentIdx = idx;
            const item = allItemsArr[idx];
            if (lbImg)   lbImg.src = item.querySelector('img').src;
            if (lbTitle) lbTitle.textContent = item.dataset.title;
            if (lbTag)   lbTag.textContent   = item.dataset.tag;
            lightbox.classList.add('open');
            document.body.style.overflow = 'hidden';
        };

        const closeLightbox = () => {
            lightbox.classList.remove('open');
            document.body.style.overflow = '';
        };

        portfolioItems.forEach((item, i) => {
            item.addEventListener('click', () => openLightbox(i));
        });

        lbClose?.addEventListener('click', closeLightbox);

        const navigate = (dir) => {
            const visible  = allItemsArr.filter(i => i.style.display !== 'none');
            const vIdx     = visible.indexOf(allItemsArr[currentIdx]);
            const nextItem = visible[(vIdx + dir + visible.length) % visible.length];
            openLightbox(allItemsArr.indexOf(nextItem));
        };

        lbPrev?.addEventListener('click', (e) => { e.stopPropagation(); navigate(-1); });
        lbNext?.addEventListener('click', (e) => { e.stopPropagation(); navigate(1); });

        lightbox.addEventListener('click', (e) => {
            if (e.target === lightbox) closeLightbox();
        });

        document.addEventListener('keydown', e => {
            if (!lightbox.classList.contains('open')) return;
            if (e.key === 'Escape')     closeLightbox();
            if (e.key === 'ArrowLeft')  navigate(-1);
            if (e.key === 'ArrowRight') navigate(1);
        });

        // TOUCH SWIPE GESTURES
        let touchStartX = 0;
        let touchStartY = 0;
        
        lightbox.addEventListener('touchstart', (e) => {
            touchStartX = e.touches[0].clientX;
            touchStartY = e.touches[0].clientY;
        }, { passive: true });

        lightbox.addEventListener('touchend', (e) => {
            const dx    = e.changedTouches[0].clientX - touchStartX;
            const dy    = e.changedTouches[0].clientY - touchStartY;
            const absDx = Math.abs(dx);
            const absDy = Math.abs(dy);
            const threshold = 50;

            if (absDy > absDx && dy < -threshold) {
                closeLightbox();
            } else if (absDx > absDy && absDx > threshold) {
                navigate(dx < 0 ? 1 : -1);
            }
        }, { passive: true });
    }

    // 6. SCROLL ANIMATIONS (Universal)
    const scrollObserver = new IntersectionObserver(entries => {
        entries.forEach((entry, i) => {
            if (entry.isIntersecting) {
                setTimeout(() => {
                    entry.target.style.opacity   = '1';
                    entry.target.style.transform = 'translateY(0)';
                }, i * 60);
                scrollObserver.unobserve(entry.target);
            }
        });
    }, { threshold: 0.1 });

    document.querySelectorAll('.work-item, .portfolio-item, .process-step, .tier-card, .shop-item').forEach(el => {
        el.style.opacity   = '0';
        el.style.transform = 'translateY(28px)';
        el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        scrollObserver.observe(el);
    });

    // 7. SHOP PAGE — Filter & Quick-View Modal
    const shopGrid  = document.getElementById('shopGrid');
    const shopModal = document.getElementById('shopModal');

    if (shopGrid && shopModal) {
        const shopItems    = document.querySelectorAll('.shop-item');
        const shopFilters  = document.querySelectorAll('#shopFilters .filter-btn');
        const modalClose   = document.getElementById('shopModalClose');
        const modalImg     = document.getElementById('modalImg');
        const modalTitle   = document.getElementById('modalTitle');
        const modalTag     = document.getElementById('modalTag');
        const modalPrice   = document.getElementById('modalPrice');
        const modalDesc    = document.getElementById('modalDesc');
        const modalDetails = document.getElementById('modalDetails');

        // Filter
        shopFilters.forEach(btn => {
            btn.addEventListener('click', () => {
                shopFilters.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                const filter = btn.dataset.filter;
                shopItems.forEach(item => {
                    item.style.display = (filter === 'all' || item.dataset.cat.includes(filter)) ? 'flex' : 'none';
                });
            });
        });

        // Open modal helper
        const openModal = (item) => {
            modalImg.src           = item.dataset.img;
            modalImg.alt           = item.dataset.title;
            modalTitle.textContent = item.dataset.title;
            modalTag.textContent   = item.dataset.tag;
            // Show "from $X" in modal price
            modalPrice.textContent = 'from $' + item.dataset.price;
            modalDesc.textContent  = item.dataset.desc;

            modalDetails.innerHTML = '';
            JSON.parse(item.dataset.details).forEach(d => {
                const li = document.createElement('li');
                li.textContent = d;
                modalDetails.appendChild(li);
            });

            // Notify the format-picker script which item is active
            if (typeof window._mfSetCurrentItem === 'function') {
                window._mfSetCurrentItem(item);
            }

            shopModal.classList.add('open');
            document.body.style.overflow = 'hidden';
        };

        // Close modal helper
        const closeModal = () => {
            shopModal.classList.remove('open');
            document.body.style.overflow = '';
        };

        // Quick view buttons
        document.querySelectorAll('.shop-quick-view').forEach((btn, i) => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                openModal(shopItems[i]);
            });
        });

        // Buy print buttons
        document.querySelectorAll('.shop-item-btn').forEach((btn, i) => {
            btn.addEventListener('click', () => openModal(shopItems[i]));
        });

        // Close triggers
        modalClose?.addEventListener('click', closeModal);
        shopModal.addEventListener('click', (e) => {
            if (e.target === shopModal) closeModal();
        });
        document.addEventListener('keydown', e => {
            if (e.key === 'Escape' && shopModal.classList.contains('open')) closeModal();
        });

        // Extend cursor hover to shop interactive elements
        if (cursor) {
            document.querySelectorAll('.shop-quick-view, .shop-item-btn, .shop-modal-btn, #shopModalClose').forEach(el => {
                el.addEventListener('mouseenter', () => cursor.classList.add('hover'));
                el.addEventListener('mouseleave', () => cursor.classList.remove('hover'));
            });
        }
    }

});

// BACK TO TOP
const backToTop = document.getElementById('backToTop');
if (backToTop) {
    window.addEventListener('scroll', () => {
        backToTop.classList.toggle('visible', window.scrollY > 400);
    });
    backToTop.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });
}

// NAV HIDE ON SCROLL
let lastScrollY = window.scrollY;
const nav = document.querySelector('nav');

window.addEventListener('scroll', () => {
    const currentScrollY = window.scrollY;

    if (currentScrollY > lastScrollY && currentScrollY > 100) {
        nav.classList.add('nav-hidden');
    } else {
        nav.classList.remove('nav-hidden');
    }

    const menuOverlay = document.getElementById('menuOverlay');
    if (menuOverlay && menuOverlay.classList.contains('open')) {
        nav.classList.remove('nav-hidden');
    }

    lastScrollY = currentScrollY;
});

// LOADER
const loader = document.getElementById('loader');
if (loader) {
    const hideLoader = () => {
        setTimeout(() => {
            loader.classList.add('spin-out');
            setTimeout(() => {
                loader.classList.add('hidden');
            }, 800);
        }, 1900);
    };

    if (document.readyState === 'complete') {
        hideLoader();
    } else {
        window.addEventListener('load', hideLoader);
    }
}

// 8. 404 PAGE SPECIFIC
if (document.querySelector('.error-page')) {
    console.log('404 — Page not found. Click on the M.F. logo.');
    const currentBadPath = window.location.pathname;
    if (currentBadPath && currentBadPath !== '/404.html') {
        console.log(`Attempted path: ${currentBadPath}`);
    }
}