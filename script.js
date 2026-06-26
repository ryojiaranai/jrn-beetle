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

// ===== SCREEN WALKER BEETLE =====
(function() {
    var style = document.createElement('style');
    style.textContent = `
        .beetle-walker{position:fixed;bottom:8px;left:0;z-index:9999;pointer-events:none;animation:beetlePatrol 40s linear infinite;}
        @keyframes beetlePatrol{
            0%{left:-60px;transform:scaleX(-1);}
            45%{left:calc(100vw - 60px);transform:scaleX(-1);}
            50%{left:calc(100vw - 60px);transform:scaleX(1);}
            95%{left:-60px;transform:scaleX(1);}
            100%{left:-60px;transform:scaleX(-1);}
        }
        .beetle-walker svg{display:block;overflow:visible;}
        .beetle-walker .bw-body{transform-origin:50% 60%;animation:bwBob .6s ease-in-out infinite;}
        @keyframes bwBob{0%,100%{transform:translateY(0) rotate(-2deg);}25%{transform:translateY(-2px) rotate(0);}50%{transform:translateY(0) rotate(2deg);}75%{transform:translateY(-2px) rotate(0)}}
        .beetle-walker .bw-legA{animation:bwStepA .6s ease-in-out infinite;}
        .beetle-walker .bw-legB{animation:bwStepB .6s ease-in-out infinite;}
        @keyframes bwStepA{0%,100%{transform:rotate(-10deg);}50%{transform:rotate(10deg);}}
        @keyframes bwStepB{0%,100%{transform:rotate(10deg);}50%{transform:rotate(-10deg);}}
        .beetle-walker .bw-mand{animation:bwWag 1.8s ease-in-out infinite;}
        @keyframes bwWag{0%,100%{transform:rotate(-3deg);}50%{transform:rotate(3.5deg);}}
    `;
    document.head.appendChild(style);

    var walker = document.createElement('div');
    walker.className = 'beetle-walker';
    walker.innerHTML = '<svg viewBox="0 0 112 75" width="60" height="40">' +
        '<defs>' +
        '<linearGradient id="bwElytra" x1="58" y1="29" x2="95" y2="46" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#e8b85e"/><stop offset=".48" stop-color="#e0a562"/><stop offset=".68" stop-color="#9f9440"/><stop offset=".86" stop-color="#bf6130"/><stop offset="1" stop-color="#d2282a"/></linearGradient>' +
        '<radialGradient id="bwHead" cx="51" cy="20" r="33" gradientTransform="translate(25.61 -27.07) rotate(43.57) scale(1 .83)" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#f6ea50"/><stop offset=".55" stop-color="#eecb58"/><stop offset="1" stop-color="#e0a562"/></radialGradient>' +
        '<linearGradient id="bwAbd" x1="47" y1="49" x2="92" y2="51" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#cf2b2a"/><stop offset=".15" stop-color="#7e8184"/><stop offset=".8" stop-color="#7e8184"/><stop offset="1" stop-color="#d2282a"/></linearGradient>' +
        '<radialGradient id="bwCheek" cx="38" cy="43" r="11" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#d83a2a"/><stop offset="1" stop-color="#a8281f"/></radialGradient>' +
        '</defs>' +
        '<g class="bw-body">' +
        '<g class="bw-legA" style="transform-origin:44% 63%"><ellipse fill="#231f20" cx="47" cy="49" rx="5.9" ry="3.7" transform="translate(-16 24) rotate(-24.4)"/><ellipse fill="#231f20" cx="45" cy="49" rx="5.9" ry="3.7" transform="translate(-16 23) rotate(-24.4)"/><ellipse fill="#231f20" cx="38" cy="54" rx="5.9" ry="2.7" transform="translate(-25 33) rotate(-36.6)"/><path fill="#231f20" d="M33.9,59.1c.5-1.6,1.6-2.9,2.4-2.8s1,.4.5,3-1.6,2.9-2.4,2.8-1-1.4-.5-3Z"/></g>' +
        '<g class="bw-legA" style="transform-origin:18% 8%;transform-origin:73% 67%"><ellipse fill="#231f20" cx="80" cy="51" rx="3.3" ry="5.9" transform="translate(-5 95) rotate(-60)"/><ellipse fill="#231f20" cx="89" cy="57" rx="2.5" ry="5.9" transform="translate(2 117) rotate(-67.3)"/><ellipse fill="#231f20" cx="93" cy="62" rx="1.2" ry="2.8" transform="translate(-19 55) rotate(-30)"/></g>' +
        '<path fill="url(#bwAbd)" d="M47.7,48.7c.7,1.2,9.7,4.7,18,5.5,12.4,1.1,28.8-5.7,26.3-9.5s-50.8-6.7-44.4,4Z"/>' +
        '<g class="bw-legB" style="transform-origin:56% 67%"><ellipse fill="#231f20" cx="62" cy="50" rx="5.9" ry="3.7" transform="translate(-17 62) rotate(-47.1)"/><ellipse fill="#231f20" cx="56" cy="59" rx="5.9" ry="2.7" transform="translate(-20 88) rotate(-67.3)"/><path fill="#231f20" d="M54.2,66.2c.2-1.7.9-3.2,1.7-3.3.8-.1,1.3,1.1,1.2,2.8s-.9,3.2-1.7,3.3-1.3-1.1-1.2-2.8Z"/></g>' +
        '<g class="bw-legB" style="transform-origin:85% 68%"><ellipse fill="#231f20" cx="92" cy="50" rx="2.5" ry="5.2" transform="translate(18 124) rotate(-73.6)"/><ellipse fill="#231f20" cx="99" cy="52" rx="1.8" ry="4.6" transform="translate(38 146) rotate(-84.4)"/><ellipse fill="#231f20" cx="103" cy="56" rx="1.2" ry="2.8" transform="translate(-14 59) rotate(-30)"/></g>' +
        '<path fill="url(#bwElytra)" d="M56,35.2c.9-2.2,6.9-9.1,17.3-9.5,10.3-.3,26.7,10.5,23.7,17.4-3,7-49,11.6-41-8Z"/>' +
        '<g class="bw-mand" style="transform-origin:34% 38%"><path fill="#231f20" d="M16.7,22.7c-1.3-3.3-12.2,1.8-9.9,8.2,2.4,6.4,8.6,15,23.6,12.7,15-2.3-1-4-1-4,0,0-12.3-.1-13.5-3.7-1.2-3.6,4.4-1.1,4-4s-4.9,1.2-7.1-2.3c-2.2-3.5,5-4.4,4-6.9Z"/></g>' +
        '<path fill="url(#bwHead)" d="M33.9,26.6c1-3.3,7.7-13.8,19.4-14.3,11.6-.5,30,15.9,26.6,26.4-3.4,10.6-54.9,17.6-46-12.1Z"/>' +
        '<path fill="url(#bwCheek)" d="M49,43.3c0,3.3.3,6-7.7,6s-14.4-2.7-14.4-6,6.4-6,14.4-6,7.7,2.7,7.7,6Z"/>' +
        '<g class="bw-mand" style="transform-origin:34% 38%"><path fill="#231f20" d="M35.7,8.2c-.3-5.6-18.4-2.6-18.1,8.1s5.1,27.1,27.8,29.7c4.3.5.4-6.6.4-6.6,0,0-17.5-5.6-17.6-11.6-.1-6,6.9.3,7.6-4.4s-7.6-.3-9.1-6.6c-1.5-6.3,9.2-4.5,9-8.7Z"/></g>' +
        '<circle fill="#fff" cx="42.5" cy="42" r="9.2"/><circle fill="#231f20" cx="42.5" cy="43.3" r="5.1"/>' +
        '<circle fill="#fff" cx="56.6" cy="17.1" r="2.1"/>' +
        '</g></svg>';
    document.body.appendChild(walker);
})();
