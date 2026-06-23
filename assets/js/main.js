document.addEventListener('DOMContentLoaded', function () {
    // --- INITIALIZATIONS ---

    // AOS (Animate on Scroll)
    AOS.init({
        duration: 800,
        once: true,
        offset: 50,
    });

    // GLightbox
    const lightbox = GLightbox({
        selector: '.glightbox'
    });

    // Lenis Smooth Scroll
    const lenis = new Lenis();
    function raf(time) {
        lenis.raf(time);
        requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);


    // --- SWIPER SLIDERS ---

    // Testimonials Slider
    if (document.querySelector('.swiper-testimonials')) {
        const swiperTestimonials = new Swiper('.swiper-testimonials', {
            loop: true,
            slidesPerView: 1,
            spaceBetween: 30,
            autoplay: {
                delay: 5000,
                disableOnInteraction: false,
            },
            pagination: {
                el: '.swiper-pagination',
                clickable: true,
            },
            breakpoints: {
                768: {
                    slidesPerView: 2,
                    spaceBetween: 40,
                }
            }
        });
    }

    // Before & After Slider
    if (document.querySelector('.swiper-before-after')) {
        const swiperBeforeAfter = new Swiper('.swiper-before-after', {
            loop: true,
            slidesPerView: 1,
            spaceBetween: 30,
            navigation: {
                nextEl: '.swiper-button-next',
                prevEl: '.swiper-button-prev',
            },
        });
    }


    // --- GSAP ANIMATIONS ---

    // Hero Section Animations
    if (document.querySelector('.hero-title')) {
        gsap.from('.hero-title', { duration: 1.2, y: 50, opacity: 0, ease: 'power3.out', delay: 0.3 });
    }
    if (document.querySelector('.hero-subtitle')) {
        gsap.from('.hero-subtitle', { duration: 1.2, y: 40, opacity: 0, ease: 'power3.out', delay: 0.6 });
    }
     if (document.querySelector('.hero-button')) {
        gsap.from('.hero-button', { duration: 1.2, y: 30, opacity: 0, ease: 'power3.out', delay: 0.9 });
    }


    // --- NAVIGATION ---
    const navLinks = document.querySelectorAll('.nav-link');
    const currentPath = window.location.pathname.split('/').pop();

    navLinks.forEach(link => {
        const linkPath = link.getAttribute('href').split('/').pop();
        // Handle index.html being the root path
        if ((currentPath === '' || currentPath === 'index.html') && (linkPath === '' || linkPath === 'index.html')) {
             link.classList.add('active');
        } else if (linkPath !== '' && currentPath.includes(linkPath)) {
            link.classList.add('active');
        }
    });

    // Mobile Menu Toggle
    const mobileMenuButton = document.getElementById('mobile-menu-button');
    const mobileMenu = document.getElementById('mobile-menu');
    if (mobileMenuButton) {
        mobileMenuButton.addEventListener('click', () => {
            mobileMenu.classList.toggle('hidden');
        });
    }

});
