// ===== USER PANEL =====

let currentUser = null;
let cart = [];

// Check auth
(function checkAuth() {
    const user = DB.getSession();
    if (!user || user.role !== 'user') {
        window.location.href = 'login.html';
        return;
    }
    currentUser = user;
    document.getElementById('userName').textContent = user.name;
    document.getElementById('userAvatar').textContent = user.name.charAt(0).toUpperCase();
    cart = DB.getCart();
})();

function showToast(message, type = 'success') {
    const container = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `<i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i> ${message}`;
    container.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}

function logout() {
    DB.clearSession();
    DB.clearCart();
    window.location.href = 'login.html';
}

// Load Products
function loadProducts() {
    const products = DB.getProducts();
    const spiceEmojis = ['🌶️', '🫚', '⭐', '🌿', '🧂', '🍛', '🌰', '🧄'];
    const grid = document.getElementById('userProductsGrid');

    grid.innerHTML = products.map((product, index) => `
        <div class="user-product-card" data-name="${product.name.toLowerCase()}">
            <div class="user-product-image">
                ${product.image ? 
                    `<img src="${product.image}" alt="${product.name}">` : 
                    `<span class="placeholder">${spiceEmojis[index % spiceEmojis.length]}</span>`
                }
            </div>
            <div class="user-product-info">
                <h3>${product.name}</h3>
                <p class="description">${product.description}</p>
                <div class="price-row">
                    <div>
                        <span class="price">₹${product.price}</span>
                        <span class="unit">${product.unit}</span>
                    </div>
                    <span class="status-badge ${product.stock > 0 ? 'status-active' : 'status-disabled'}">
                        ${product.stock > 0 ? 'In Stock' : 'Out of Stock'}
                    </span>
                </div>
                ${product.stock > 0 ? `
                <button class="add-to-cart-btn" onclick="addToCart('${product.id}')">
                    <i class="fas fa-cart-plus"></i> Add to Cart
                </button>
                ` : `
                <button class="add-to-cart-btn" disabled style="background:#ccc;cursor:not-allowed;">
                    <i class="fas fa-times"></i> Out of Stock
                </button>
                `}
            </div>
        </div>
    `).join('');
}

// Filter products
function filterProducts() {
    const query = document.getElementById('searchProducts').value.toLowerCase();
    document.querySelectorAll('.user-product-card').forEach(card => {
        const name = card.getAttribute('data-name');
        card.style.display = name.includes(query) ? '' : 'none';
    });
}

// Cart Functions
function addToCart(productId) {
    const product = DB.getProducts().find(p => p.id === productId);
    if (!product) return;

    const existingIndex = cart.findIndex(item => item.productId === productId);
    if (existingIndex >= 0) {
        cart[existingIndex].qty += 1;
    } else {
        cart.push({
            productId: product.id,
            name: product.name,
            price: product.price,
            unit: product.unit,
            image: product.image,
            qty: 1
        });
    }

    DB.setCart(cart);
    updateCartUI();
    showToast(`${product.name} added to cart!`);
}

function updateCartUI() {
    const count = cart.reduce((sum, item) => sum + item.qty, 0);
    document.getElementById('cartCount').textContent = count;

    const cartItems = document.getElementById('cartItems');
    const cartFooter = document.getElementById('cartFooter');

    if (cart.length === 0) {
        cartItems.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-shopping-basket"></i>
                <h3>Cart is empty</h3>
                <p>Add some products to get started!</p>
            </div>
        `;
        cartFooter.style.display = 'none';
        return;
    }

    const spiceEmojis = ['🌶️', '🫚', '⭐', '🌿', '🧂', '🍛'];

    cartItems.innerHTML = cart.map((item, index) => `
        <div class="cart-item">
            <div class="cart-item-img">
                ${item.image ? `<img src="${item.image}">` : spiceEmojis[index % spiceEmojis.length]}
            </div>
            <div class="cart-item-details">
                <h4>${item.name}</h4>
                <p>₹${item.price} ${item.unit}</p>
                <div class="cart-item-qty">
                    <button class="qty-btn" onclick="changeQty(${index}, -1)">−</button>
                    <span style="font-weight:600; min-width:20px; text-align:center;">${item.qty}</span>
                    <button class="qty-btn" onclick="changeQty(${index}, 1)">+</button>
                </div>
            </div>
            <div style="text-align:right;">
                <div class="cart-item-price">₹${(item.price * item.qty).toFixed(2)}</div>
                <button class="remove-item" onclick="removeFromCart(${index})"><i class="fas fa-trash"></i></button>
            </div>
        </div>
    `).join('');

    const total = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
    document.getElementById('cartTotalAmount').textContent = `₹${total.toFixed(2)}`;
    cartFooter.style.display = 'block';
}

function changeQty(index, delta) {
    cart[index].qty += delta;
    if (cart[index].qty <= 0) {
        cart.splice(index, 1);
    }
    DB.setCart(cart);
    updateCartUI();
}

function removeFromCart(index) {
    cart.splice(index, 1);
    DB.setCart(cart);
    updateCartUI();
    showToast('Item removed from cart');
}

function toggleCart() {
    const panel = document.getElementById('cartPanel');
    const overlay = document.getElementById('cartOverlay');
    panel.classList.toggle('active');
    overlay.classList.toggle('active');
}

// Payment
let selectedPaymentMethod = '';

function openPaymentModal() {
    if (cart.length === 0) return;
    const total = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
    document.getElementById('paymentTotal').textContent = total.toFixed(2);
    selectedPaymentMethod = '';
    document.querySelectorAll('.payment-option').forEach(o => o.classList.remove('selected'));
    document.getElementById('payNowBtn').disabled = true;
    
    // Close cart first
    document.getElementById('cartPanel').classList.remove('active');
    document.getElementById('cartOverlay').classList.remove('active');
    
    document.getElementById('paymentModal').classList.add('active');
}

function selectPayment(element, method) {
    document.querySelectorAll('.payment-option').forEach(o => o.classList.remove('selected'));
    element.classList.add('selected');
    selectedPaymentMethod = method;
    document.getElementById('payNowBtn').disabled = false;
}

function processPayment() {
    if (!selectedPaymentMethod) {
        showToast('Please select a payment method', 'error');
        return;
    }

    const total = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);

    // Create the order object
    const order = {
        userId: currentUser.id,
        customerName: currentUser.name,
        customerMobile: currentUser.mobile,
        items: cart.map(item => ({
            productId: item.productId,
            name: item.name,
            price: item.price,
            qty: item.qty,
            subtotal: item.price * item.qty
        })),
        total: total,
        paymentMode: selectedPaymentMethod
    };

    // Save to Database
    DB.addOrder(order);

    // ==========================================
    // NOTIFICATION LOGIC (WhatsApp & Email)
    // ==========================================
    
    // Setup the message template
    const itemList = order.items.map(i => `- ${i.name} (Qty: ${i.qty}) = ₹${i.subtotal}`).join('\n');
    const waText = `*New Order Received!*\n\n*Order ID:* ${order.id}\n*Customer:* ${order.customerName}\n*Mobile:* ${order.customerMobile}\n\n*Items:*\n${itemList}\n\n*Total Amount:* ₹${order.total}\n*Payment Mode:* ${order.paymentMode}`;
    const emailText = waText.replace(/\*/g, ''); // Removes bold asterisks for plain text email

    // 1. Open WhatsApp Web / App
    const waNumber = "919930949022";
    const waUrl = `https://wa.me/${waNumber}?text=${encodeURIComponent(waText)}`;
    window.open(waUrl, '_blank');

    // 2. Open Default Email Client
    const emailId = "ketan.bhatt81@gmail.com";
    const mailSubject = `New Order #${order.id} from ${order.customerName}`;
    const mailUrl = `mailto:${emailId}?subject=${encodeURIComponent(mailSubject)}&body=${encodeURIComponent(emailText)}`;
    
    // Small delay ensures WhatsApp opens first, then mail triggers
    setTimeout(() => {
        window.location.href = mailUrl;
    }, 800);

    // ==========================================

    // Clear cart
    cart = [];
    DB.clearCart();
    updateCartUI();

    // Close modal
    document.getElementById('paymentModal').classList.remove('active');
    showToast('🎉 Order placed successfully!');

    // Reload views
    loadMyOrders();
    loadProducts(); 
}

function closeModal(id) {
    document.getElementById(id).classList.remove('active');
}

// My Orders
function loadMyOrders() {
    if (!currentUser) return;
    const orders = DB.getUserOrders(currentUser.id).reverse();
    document.getElementById('myOrdersTable').innerHTML = orders.length ? orders.map(o => `
        <tr>
            <td><strong>${o.id}</strong></td>
            <td>${o.items.map(i => `${i.name} x${i.qty}`).join(', ')}</td>
            <td><strong>₹${o.total.toFixed(2)}</strong></td>
            <td>${o.paymentMode}</td>
            <td>${new Date(o.date).toLocaleDateString()}</td>
            <td><span class="status-badge status-completed">${o.status}</span></td>
        </tr>
    `).join('') : '<tr><td colspan="6" class="text-center" style="padding:40px; color:#999;">No orders yet. Start shopping!</td></tr>';
}

// QR Codes on user page
function loadUserQR() {
    const settings = DB.getQRSettings();
    if (typeof QRCode !== 'undefined') {
        if (settings.whatsapp) {
            const c1 = document.getElementById('userWhatsappQR');
            c1.innerHTML = '';
            const canvas1 = document.createElement('canvas');
            c1.appendChild(canvas1);
            QRCode.toCanvas(canvas1, `https://wa.me/${settings.whatsapp.replace('+','')}`, { width: 70, margin: 1, color: { dark: '#25d366' } });
        }
        if (settings.instagram) {
            const c2 = document.getElementById('userInstagramQR');
            c2.innerHTML = '';
            const canvas2 = document.createElement('canvas');
            c2.appendChild(canvas2);
            QRCode.toCanvas(canvas2, `https://instagram.com/${settings.instagram}`, { width: 70, margin: 1, color: { dark: '#e1306c' } });
        }
    }
}

// Init
document.addEventListener('DOMContentLoaded', () => {
    loadProducts();
    updateCartUI();
    loadMyOrders();
    setTimeout(loadUserQR, 500);
});