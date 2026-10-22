// ===== LANDING PAGE SCRIPTS =====

// Navbar scroll effect
window.addEventListener('scroll', () => {
    const navbar = document.getElementById('navbar');
    if (window.scrollY > 50) {
        navbar.style.background = 'rgba(255,255,255,0.98)';
        navbar.style.boxShadow = '0 4px 20px rgba(0,0,0,0.1)';
    } else {
        navbar.style.background = 'rgba(255,255,255,0.95)';
        navbar.style.boxShadow = '0 2px 10px rgba(0,0,0,0.1)';
    }
});

// Toggle mobile menu
function toggleMenu() {
    const links = document.querySelector('.nav-links');
    const buttons = document.querySelector('.nav-buttons');
    if (links.style.display === 'flex') {
        links.style.display = 'none';
        buttons.style.display = 'none';
    } else {
        links.style.display = 'flex';
        links.style.flexDirection = 'column';
        links.style.position = 'absolute';
        links.style.top = '70px';
        links.style.left = '0';
        links.style.right = '0';
        links.style.background = 'white';
        links.style.padding = '20px';
        links.style.boxShadow = '0 5px 15px rgba(0,0,0,0.1)';
        buttons.style.display = 'flex';
        buttons.style.position = 'absolute';
        buttons.style.top = links.offsetHeight + 70 + 'px';
        buttons.style.left = '0';
        buttons.style.right = '0';
        buttons.style.background = 'white';
        buttons.style.padding = '20px';
    }
}

// Load products on home page
function loadHomeProducts() {
    const products = DB.getProducts();
    const grid = document.getElementById('homeProductsGrid');
    if (!grid) return;

    const spiceEmojis = ['🌶️', '🫚', '⭐', '🌿', '🧂', '🍛', '🌰', '🧄'];

    grid.innerHTML = products.slice(0, 8).map((product, index) => `
        <div class="product-card">
            <div class="product-image">
                ${product.image ? 
                    `<img src="${product.image}" alt="${product.name}">` : 
                    `<span class="placeholder-icon">${spiceEmojis[index % spiceEmojis.length]}</span>`
                }
                <span class="product-badge">Organic</span>
            </div>
            <div class="product-info">
                <h3>${product.name}</h3>
                <p>${product.description.substring(0, 60)}...</p>
                <div class="product-price">
                    <div>
                        <span class="price">₹${product.price}</span>
                        <span class="unit">${product.unit}</span>
                    </div>
                </div>
            </div>
        </div>
    `).join('');
}

// Generate QR codes for social
function generateHomeQR() {
    const settings = DB.getQRSettings();

    // WhatsApp QR
    const whatsappDiv = document.getElementById('whatsappQR');
    if (whatsappDiv && settings.whatsapp) {
        const whatsappURL = 'https://wa.me/' + settings.whatsapp.replace('+', '');
        QRCode.toElement(whatsappDiv, whatsappURL, { width: 180, color: { dark: '#25d366' } });
    }

    // Instagram QR
    const instaDiv = document.getElementById('instagramQR');
    if (instaDiv && settings.instagram) {
        const instaURL = 'https://instagram.com/' + settings.instagram;
        QRCode.toElement(instaDiv, instaURL, { width: 180, color: { dark: '#e1306c' } });
    }
}

// Contact form
function handleContact(event) {
    event.preventDefault();
    alert('Thank you for your message! We will get back to you soon.');
    event.target.reset();
    return false;
}

// Init
document.addEventListener('DOMContentLoaded', () => {
    loadHomeProducts();
    // Small delay for QR library to load
    setTimeout(generateHomeQR, 500);
});