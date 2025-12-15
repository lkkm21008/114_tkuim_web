// Smooth scroll for anchor links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        const targetId = this.getAttribute('href');
        if (targetId === '#') return;

        // Only prevent default if the element exists on THIS page
        const targetElement = document.querySelector(targetId);
        if (targetElement) {
            e.preventDefault();
            targetElement.scrollIntoView({
                behavior: 'smooth'
            });
        }
    });
});

// Mobile menu toggle (simple version)
const menuBtn = document.querySelector('.mobile-menu-btn');
const navLinks = document.querySelector('.nav-links');

if (menuBtn) {
    menuBtn.addEventListener('click', () => {
        // For a full implementation we'd toggle a specific class to show/hide
        // but for this minimal task we just log or do a simple alert if needed
        // Adding a simple visible toggle for demonstration if checking mobile
        if (navLinks.style.display === 'flex') {
            navLinks.style.display = 'none';
            navLinks.style.position = 'static';
            navLinks.style.flexDirection = 'row';
            navLinks.style.backgroundColor = 'transparent';
        } else {
            navLinks.style.display = 'flex';
            navLinks.style.position = 'fixed';
            navLinks.style.top = '0';
            navLinks.style.left = '0';
            navLinks.style.width = '100vw';
            navLinks.style.height = '100vh';
            navLinks.style.flexDirection = 'column';
            navLinks.style.justifyContent = 'center';
            navLinks.style.backgroundColor = '#fff';
            navLinks.style.zIndex = '999';
        }
    });
}

