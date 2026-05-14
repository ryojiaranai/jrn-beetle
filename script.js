// ===== PARTICLE BACKGROUND =====
const canvas = document.getElementById('particleCanvas');
const ctx = canvas.getContext('2d');
let particles = [];
let mouseX = 0, mouseY = 0;

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}
resizeCanvas();
window.addEventListener('resize', resizeCanvas);
document.addEventListener('mousemove', e => { mouseX = e.clientX; mouseY = e.clientY; });

const particleColors = [
    'rgba(192,57,43,0.3)',
    'rgba(39,174,96,0.3)',
    'rgba(142,68,173,0.3)',
    'rgba(26,58,107,0.3)',
    'rgba(218,165,32,0.3)',
];

class Particle {
    constructor() {
        this.reset();
    }
    reset() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.size = Math.random() * 2 + 0.5;
        this.speedX = (Math.random() - 0.5) * 0.3;
        this.speedY = (Math.random() - 0.5) * 0.3;
        this.color = particleColors[Math.floor(Math.random() * particleColors.length)];
        this.life = Math.random() * 200 + 100;
        this.maxLife = this.life;
    }
    update() {
        this.x += this.speedX;
        this.y += this.speedY;
        this.life--;
        if (this.life <= 0 || this.x < 0 || this.x > canvas.width || this.y < 0 || this.y > canvas.height) {
            this.reset();
        }
    }
    draw() {
        const alpha = (this.life / this.maxLife) * 0.5;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fillStyle = this.color.replace('0.3', alpha.toFixed(2));
        ctx.fill();
    }
}

for (let i = 0; i < 80; i++) particles.push(new Particle());

function animateParticles() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    particles.forEach(p => { p.update(); p.draw(); });
    requestAnimationFrame(animateParticles);
}
animateParticles();


// ===== NAVBAR SCROLL =====
const navbar = document.getElementById('navbar');
window.addEventListener('scroll', () => {
    navbar.classList.toggle('scrolled', window.scrollY > 50);
});


// ===== MOBILE NAV TOGGLE =====
const navToggle = document.getElementById('navToggle');
const navLinks = document.getElementById('navLinks');
navToggle.addEventListener('click', () => {
    navLinks.classList.toggle('open');
});
navLinks.querySelectorAll('a').forEach(a => {
    a.addEventListener('click', () => navLinks.classList.remove('open'));
});


// ===== SCROLL REVEAL =====
const revealElements = document.querySelectorAll('.morph-card, .pikal-card, .eye-card, .rule-card, .form-card');

const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry, index) => {
        if (entry.isIntersecting) {
            setTimeout(() => {
                entry.target.classList.add('visible');
            }, index * 100);
            revealObserver.unobserve(entry.target);
        }
    });
}, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });

revealElements.forEach(el => revealObserver.observe(el));


// ===== EVOLUTION TREE LINES =====
function drawTreeLines() {
    const container = document.getElementById('treeContainer');
    const svg = document.getElementById('treeLines');
    if (!container || !svg) return;

    const rect = container.getBoundingClientRect();
    svg.setAttribute('viewBox', `0 0 ${container.offsetWidth} ${container.offsetHeight}`);

    const connections = [
        ['node-normal', 'node-red'],
        ['node-normal', 'node-green'],
        ['node-red', 'node-super-red'],
        ['node-super-red', 'node-amber'],
        ['node-green', 'node-super-green'],
        ['node-green', 'node-purple'],
        ['node-super-green', 'node-glaze'],
        ['node-purple', 'node-navy-purple'],
        ['node-normal', 'node-blue-crest'],
    ];

    const crossConnections = [
        ['node-glaze', 'node-aurora'],
        ['node-navy-purple', 'node-aurora'],
    ];

    let linesHTML = '';

    function getNodeCenter(id) {
        const node = document.getElementById(id);
        if (!node) return { x: 0, y: 0 };
        return {
            x: node.offsetLeft + node.offsetWidth / 2,
            y: node.offsetTop + node.offsetHeight / 2,
        };
    }

    connections.forEach(([from, to]) => {
        const a = getNodeCenter(from);
        const b = getNodeCenter(to);
        linesHTML += `<line x1="${a.x}" y1="${a.y}" x2="${b.x}" y2="${b.y}"/>`;
    });

    crossConnections.forEach(([from, to]) => {
        const a = getNodeCenter(from);
        const b = getNodeCenter(to);
        linesHTML += `<line class="cross-line" x1="${a.x}" y1="${a.y}" x2="${b.x}" y2="${b.y}"/>`;
    });

    svg.innerHTML = linesHTML;
}

// Draw on load and resize
window.addEventListener('load', () => {
    setTimeout(drawTreeLines, 200);
});
window.addEventListener('resize', drawTreeLines);


// ===== TREE NODE CLICK — SCROLL TO SECTION =====
const nodeToSection = {
    'node-normal': '#normal',
    'node-red': '[data-morph="red"]',
    'node-super-red': '[data-morph="super-red"]',
    'node-amber': '[data-morph="amber"]',
    'node-green': '[data-morph="green"]',
    'node-super-green': '[data-morph="super-green"]',
    'node-glaze': '[data-morph="special-green"]',
    'node-purple': '[data-morph="purple"]',
    'node-navy-purple': '[data-morph="navy-purple"]',
    'node-blue-crest': '[data-morph="blue-crest"]',
    'node-aurora': '[data-morph="aurora"]',
};

document.querySelectorAll('.tree-node').forEach(node => {
    node.addEventListener('click', () => {
        const selector = nodeToSection[node.id];
        if (selector) {
            const target = document.querySelector(selector);
            if (target) {
                target.scrollIntoView({ behavior: 'smooth', block: 'center' });
                // Pulse effect
                target.style.outline = '2px solid rgba(255,255,255,0.3)';
                target.style.outlineOffset = '8px';
                setTimeout(() => {
                    target.style.outline = 'none';
                }, 2000);
            }
        }
    });
});


// ===== SMOOTH BEETLE COLOR TRANSITIONS ON HOVER =====
document.querySelectorAll('.beetle-body').forEach(body => {
    body.addEventListener('mouseenter', () => {
        body.style.animationPlayState = 'paused';
        body.style.filter = 'brightness(1.3) saturate(1.2)';
    });
    body.addEventListener('mouseleave', () => {
        body.style.animationPlayState = 'running';
        body.style.filter = '';
    });
});


// ===== HERO COLOR BAR TOOLTIPS =====
document.querySelectorAll('.color-segment').forEach(seg => {
    seg.addEventListener('mouseenter', function() {
        const label = this.getAttribute('data-label');
        this.title = label;
    });
});


// ===== COUNTER ANIMATION FOR STATS (future use) =====
function animateCounter(el, target, duration = 1500) {
    let start = 0;
    const step = target / (duration / 16);
    const timer = setInterval(() => {
        start += step;
        if (start >= target) {
            el.textContent = target;
            clearInterval(timer);
        } else {
            el.textContent = Math.floor(start);
        }
    }, 16);
}


// ===== GALLERY LIGHTBOX =====
(function() {
    // Create lightbox element
    const lightbox = document.createElement('div');
    lightbox.className = 'lightbox';
    lightbox.innerHTML = `
        <button class="lightbox-close">&times;</button>
        <img src="" alt="">
        <div class="lightbox-caption"></div>
    `;
    document.body.appendChild(lightbox);

    const lbImg = lightbox.querySelector('img');
    const lbCaption = lightbox.querySelector('.lightbox-caption');
    const lbClose = lightbox.querySelector('.lightbox-close');

    // Open lightbox on gallery item click
    document.querySelectorAll('.gallery-item').forEach(item => {
        item.addEventListener('click', () => {
            const img = item.querySelector('img');
            const label = item.querySelector('.gallery-label');
            lbImg.src = img.src;
            lbImg.alt = img.alt;
            lbCaption.textContent = label ? label.textContent : '';
            lightbox.classList.add('active');
        });
    });

    // Also open lightbox on morph-photo clicks
    document.querySelectorAll('.morph-photo img, .photo-row-item img').forEach(img => {
        img.style.cursor = 'pointer';
        img.addEventListener('click', () => {
            const caption = img.closest('.morph-photo, .photo-row-item')?.querySelector('.photo-caption');
            lbImg.src = img.src;
            lbImg.alt = img.alt;
            lbCaption.textContent = caption ? caption.textContent : '';
            lightbox.classList.add('active');
        });
    });

    // Close lightbox
    lbClose.addEventListener('click', () => lightbox.classList.remove('active'));
    lightbox.addEventListener('click', (e) => {
        if (e.target === lightbox) lightbox.classList.remove('active');
    });
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') lightbox.classList.remove('active');
    });
})();
