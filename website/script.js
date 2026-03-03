// Royal Plate Website JavaScript
// Featuring GSAP and Anime.js animations

// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function() {
    
    // ===== GSAP ScrollTrigger Setup =====
    gsap.registerPlugin(ScrollTrigger);
    
    // ===== Mobile Menu Toggle =====
    const mobileMenuBtn = document.getElementById('mobile-menu-btn');
    const mobileMenu = document.getElementById('mobile-menu');
    
    if (mobileMenuBtn && mobileMenu) {
        mobileMenuBtn.addEventListener('click', () => {
            mobileMenu.classList.toggle('hidden');
        });
        
        // Close mobile menu when clicking on a link
        const mobileLinks = mobileMenu.querySelectorAll('a');
        mobileLinks.forEach(link => {
            link.addEventListener('click', () => {
                mobileMenu.classList.add('hidden');
            });
        });
    }
    
    // ===== Navbar Scroll Effect =====
    const navbar = document.querySelector('nav');
    let lastScroll = 0;
    
    window.addEventListener('scroll', () => {
        const currentScroll = window.pageYOffset;
        
        if (currentScroll <= 0) {
            navbar.classList.remove('shadow-lg');
        } else {
            navbar.classList.add('shadow-lg');
        }
        
        lastScroll = currentScroll;
    });
    
    // ===== Hero Section Animations with GSAP =====
    const heroTimeline = gsap.timeline();
    
    heroTimeline
        .from('.hero-content img', {
            duration: 1,
            scale: 0,
            rotation: 360,
            ease: 'back.out(1.7)'
        })
        .from('.hero-content h1', {
            duration: 0.8,
            y: 50,
            opacity: 0,
            ease: 'power3.out'
        }, '-=0.5')
        .from('.hero-content p', {
            duration: 0.8,
            y: 30,
            opacity: 0,
            ease: 'power3.out'
        }, '-=0.4')
        .from('.hero-content a', {
            duration: 0.6,
            y: 20,
            opacity: 0,
            stagger: 0.2,
            ease: 'power2.out'
        }, '-=0.4')
        .from('.stat-item', {
            duration: 0.8,
            scale: 0,
            opacity: 0,
            stagger: 0.15,
            ease: 'back.out(1.7)'
        }, '-=0.3');
    
    // ===== Hero Title Animation =====
    gsap.from('.hero-title-line', {
        y: 100,
        opacity: 0,
        duration: 1.2,
        stagger: 0.3,
        ease: 'power3.out',
        delay: 0.5
    });
    
    // ===== Feature Cards Scroll Animation with GSAP =====
    // Ensure cards are visible by default, then animate them in on scroll
    gsap.set('.feature-card', { opacity: 1, visibility: 'visible' });
    
    gsap.from('.feature-card', {
        scrollTrigger: {
            trigger: '#features',
            start: 'top 80%',
            toggleActions: 'play none none none'
        },
        y: 60,
        opacity: 0,
        duration: 0.8,
        stagger: 0.15,
        ease: 'power3.out'
    });
    
    // ===== Screenshot Cards Parallax Effect =====
    gsap.utils.toArray('.screenshot-card').forEach((card, index) => {
        gsap.from(card, {
            scrollTrigger: {
                trigger: card,
                start: 'top 85%',
                toggleActions: 'play none none reverse'
            },
            y: 100,
            opacity: 0,
            rotation: index % 2 === 0 ? -5 : 5,
            duration: 1,
            ease: 'power3.out'
        });
    });
    
    // ===== Anime.js for Screenshot Cards =====
    anime({
        targets: '.screenshot-card img',
        scale: [0.8, 1],
        opacity: [0, 1],
        delay: anime.stagger(150, {start: 500}),
        duration: 1000,
        easing: 'easeOutElastic(1, .8)'
    });
    
    // ===== How It Works Section Animation =====
    // Ensure step cards are visible by default, then animate them in on scroll
    gsap.set('.step-card', { opacity: 1, visibility: 'visible', scale: 1 });
    
    gsap.from('.step-card', {
        scrollTrigger: {
            trigger: '#how-it-works',
            start: 'top 80%',
            toggleActions: 'play none none none'
        },
        scale: 0.5,
        opacity: 0,
        duration: 0.8,
        stagger: 0.2,
        ease: 'back.out(1.7)'
    });
    
    // ===== Step Cards with Anime.js =====
    const stepCards = document.querySelectorAll('.step-card');
    stepCards.forEach((card, index) => {
        card.addEventListener('mouseenter', () => {
            anime({
                targets: card,
                scale: 1.05,
                duration: 300,
                easing: 'easeOutQuad'
            });
        });
        
        card.addEventListener('mouseleave', () => {
            anime({
                targets: card,
                scale: 1,
                duration: 300,
                easing: 'easeOutQuad'
            });
        });
    });
    
    // ===== VIP Waitlist Background Changer =====
    const waitlistBg = document.getElementById('waitlist-bg');
    const bgImages = [
        'imgs/bg/scene1.jpeg',
        'imgs/bg/scene2.jpeg',
        'imgs/bg/scene3.jpeg',
        'imgs/bg/scene4.jpeg',
        'imgs/bg/scene5.jpeg'
    ];
    let currentBgIndex = 0;
    
    function changeWaitlistBg() {
        if (waitlistBg) {
            anime({
                targets: waitlistBg,
                opacity: [1, 0],
                duration: 1000,
                easing: 'easeInOutQuad',
                complete: () => {
                    currentBgIndex = (currentBgIndex + 1) % bgImages.length;
                    waitlistBg.style.backgroundImage = `url('${bgImages[currentBgIndex]}')`;
                    anime({
                        targets: waitlistBg,
                        opacity: [0, 1],
                        duration: 1000,
                        easing: 'easeInOutQuad'
                    });
                }
            });
        }
    }
    
    // Initialize first background
    if (waitlistBg) {
        waitlistBg.style.backgroundImage = `url('${bgImages[0]}')`;
        setInterval(changeWaitlistBg, 5000);
    }
    
    // ===== VIP Waitlist Form Animation =====
    gsap.from('#waitlist-form', {
        scrollTrigger: {
            trigger: '#vip-waitlist',
            start: 'top 60%'
        },
        y: 50,
        opacity: 0,
        duration: 1,
        ease: 'power3.out'
    });
    
    // ===== Form Submission Handler =====
    const waitlistForm = document.getElementById('waitlist-form');
    const formMessage = document.getElementById('form-message');
    
    if (waitlistForm) {
        waitlistForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const formData = {
                firstName: document.getElementById('firstName').value,
                lastName: document.getElementById('lastName').value,
                email: document.getElementById('email').value,
                phone: document.getElementById('phone').value || 'N/A'
            };
            
            // Animate submit button
            const submitBtn = waitlistForm.querySelector('button[type="submit"]');
            submitBtn.disabled = true;
            submitBtn.textContent = 'Joining...';
            
            // Simulate API call (replace with actual API endpoint)
            setTimeout(() => {
                // Success message
                formMessage.classList.remove('hidden');
                formMessage.classList.add('bg-green-100', 'text-green-800');
                formMessage.innerHTML = `
                    <div class="flex items-center justify-center space-x-2">
                        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                        </svg>
                        <span>🎉 Welcome to the VIP Waitlist! Check your email for confirmation.</span>
                    </div>
                `;
                
                // Animate success message
                anime({
                    targets: formMessage,
                    scale: [0.8, 1],
                    opacity: [0, 1],
                    duration: 600,
                    easing: 'easeOutElastic(1, .8)'
                });
                
                // Reset form
                waitlistForm.reset();
                submitBtn.disabled = false;
                submitBtn.textContent = 'Join VIP Waitlist Now';
                
                // Store in localStorage
                localStorage.setItem('royalPlateVIP', JSON.stringify(formData));
                
                // Hide message after 5 seconds
                setTimeout(() => {
                    anime({
                        targets: formMessage,
                        opacity: [1, 0],
                        duration: 400,
                        easing: 'easeOutQuad',
                        complete: () => {
                            formMessage.classList.add('hidden');
                        }
                    });
                }, 5000);
            }, 1500);
        });
    }
    
    // ===== Smooth Scroll for Navigation Links =====
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            
            if (target) {
                const offsetTop = target.offsetTop - 80;
                
                window.scrollTo({
                    top: offsetTop,
                    behavior: 'smooth'
                });
            }
        });
    });
    
    // ===== Parallax Effect for Background =====
    gsap.to('.hero-bg-slider', {
        scrollTrigger: {
            trigger: '#hero',
            start: 'top top',
            end: 'bottom top',
            scrub: true
        },
        y: 200,
        ease: 'none'
    });
    
    // ===== Footer Animation =====
    gsap.from('footer', {
        scrollTrigger: {
            trigger: 'footer',
            start: 'top 90%'
        },
        y: 50,
        opacity: 0,
        duration: 0.8,
        ease: 'power3.out'
    });
    
    // ===== Floating Crown Animation with Anime.js =====
    anime({
        targets: '.animate-float',
        translateY: [-20, 20],
        duration: 3000,
        easing: 'easeInOutSine',
        direction: 'alternate',
        loop: true
    });
    
    // ===== Scroll Progress Indicator =====
    const scrollProgress = document.createElement('div');
    scrollProgress.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        height: 4px;
        background: linear-gradient(90deg, hsl(38, 92%, 50%), hsl(38, 92%, 65%));
        z-index: 9999;
        transition: width 0.1s ease;
    `;
    document.body.appendChild(scrollProgress);
    
    window.addEventListener('scroll', () => {
        const scrollTop = window.pageYOffset;
        const docHeight = document.documentElement.scrollHeight - window.innerHeight;
        const scrollPercent = (scrollTop / docHeight) * 100;
        scrollProgress.style.width = scrollPercent + '%';
    });
    
    // ===== Feature Card Icon Animation on Hover =====
    document.querySelectorAll('.feature-card').forEach(card => {
        const icon = card.querySelector('svg');
        
        card.addEventListener('mouseenter', () => {
            anime({
                targets: icon,
                rotate: 360,
                scale: 1.2,
                duration: 600,
                easing: 'easeOutElastic(1, .6)'
            });
        });
        
        card.addEventListener('mouseleave', () => {
            anime({
                targets: icon,
                rotate: 0,
                scale: 1,
                duration: 400,
                easing: 'easeOutQuad'
            });
        });
    });
    
    // ===== Image Modal Functionality =====
    const modal = document.getElementById('image-modal');
    const modalImage = document.getElementById('modal-image');
    const modalTitle = document.getElementById('modal-title');
    const modalDescription = document.getElementById('modal-description');
    const modalClose = document.getElementById('modal-close');
    const modalPrev = document.getElementById('modal-prev');
    const modalNext = document.getElementById('modal-next');
    
    const screenshotCards = document.querySelectorAll('.screenshot-card[data-image]');
    let currentImageIndex = 0;
    const images = Array.from(screenshotCards).map(card => ({
        src: card.getAttribute('data-image'),
        title: card.getAttribute('data-title'),
        description: card.getAttribute('data-description')
    }));
    
    function openModal(index) {
        currentImageIndex = index;
        const imageData = images[index];
        
        modalImage.src = imageData.src;
        modalTitle.textContent = imageData.title;
        modalDescription.textContent = imageData.description;
        
        modal.classList.remove('hidden');
        modal.classList.add('flex');
        document.body.style.overflow = 'hidden';
        
        // Animate modal entrance
        anime({
            targets: modal,
            opacity: [0, 1],
            duration: 300,
            easing: 'easeOutQuad'
        });
        
        anime({
            targets: '#modal-image',
            scale: [0.8, 1],
            opacity: [0, 1],
            duration: 500,
            easing: 'easeOutElastic(1, .8)'
        });
        
        anime({
            targets: ['#modal-title', '#modal-description'],
            translateY: [20, 0],
            opacity: [0, 1],
            delay: anime.stagger(100, {start: 200}),
            duration: 400,
            easing: 'easeOutQuad'
        });
    }
    
    function closeModal() {
        anime({
            targets: modal,
            opacity: [1, 0],
            duration: 300,
            easing: 'easeOutQuad',
            complete: () => {
                modal.classList.add('hidden');
                modal.classList.remove('flex');
                document.body.style.overflow = '';
            }
        });
    }
    
    function showNextImage() {
        currentImageIndex = (currentImageIndex + 1) % images.length;
        const imageData = images[currentImageIndex];
        
        anime({
            targets: '#modal-image',
            translateX: [0, -100],
            opacity: [1, 0],
            duration: 200,
            easing: 'easeOutQuad',
            complete: () => {
                modalImage.src = imageData.src;
                modalTitle.textContent = imageData.title;
                modalDescription.textContent = imageData.description;
                
                anime({
                    targets: '#modal-image',
                    translateX: [100, 0],
                    opacity: [0, 1],
                    duration: 300,
                    easing: 'easeOutQuad'
                });
            }
        });
    }
    
    function showPrevImage() {
        currentImageIndex = (currentImageIndex - 1 + images.length) % images.length;
        const imageData = images[currentImageIndex];
        
        anime({
            targets: '#modal-image',
            translateX: [0, 100],
            opacity: [1, 0],
            duration: 200,
            easing: 'easeOutQuad',
            complete: () => {
                modalImage.src = imageData.src;
                modalTitle.textContent = imageData.title;
                modalDescription.textContent = imageData.description;
                
                anime({
                    targets: '#modal-image',
                    translateX: [-100, 0],
                    opacity: [0, 1],
                    duration: 300,
                    easing: 'easeOutQuad'
                });
            }
        });
    }
    
    // Add click handlers to screenshot cards
    screenshotCards.forEach((card, index) => {
        card.addEventListener('click', () => openModal(index));
    });
    
    // Modal controls
    if (modalClose) {
        modalClose.addEventListener('click', closeModal);
    }
    
    if (modalPrev) {
        modalPrev.addEventListener('click', showPrevImage);
    }
    
    if (modalNext) {
        modalNext.addEventListener('click', showNextImage);
    }
    
    // Close modal on background click
    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeModal();
            }
        });
    }
    
    // Keyboard navigation
    document.addEventListener('keydown', (e) => {
        if (!modal.classList.contains('hidden')) {
            if (e.key === 'Escape') {
                closeModal();
            } else if (e.key === 'ArrowLeft') {
                showPrevImage();
            } else if (e.key === 'ArrowRight') {
                showNextImage();
            }
        }
    });
    
    // ===== Console Welcome Message =====
    console.log('%c🍽️ Royal Plate', 'color: #EAB308; font-size: 24px; font-weight: bold;');
    console.log('%cPowered by Mingalar Mon', 'color: #1E40AF; font-size: 14px;');
    console.log('%cwww.mingalarmon.com', 'color: #6B7280; font-size: 12px;');
    
});
