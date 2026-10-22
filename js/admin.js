// ===== ADMIN PANEL =====

// Check auth
(function checkAuth() {
    const user = DB.getSession();
    if (!user || user.role !== 'admin') {
        window.location.href = 'login.html';
        return;
    }
    document.getElementById('userName').textContent = user.name;
    document.getElementById('userAvatar').textContent = user.name.charAt(0).toUpperCase();
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
    window.location.href = 'login.html';
}

function showSection(section) {
    document.querySelectorAll('.section-content').forEach(s => s.style.display = 'none');
    document.getElementById(`section-${section}`).style.display = 'block';
    
    const titles = {
        dashboard: 'Dashboard',
        products: 'Products',
        sales: 'Sales',
        stock: 'Stock Balance',
        margin: 'Margin Calculator',
        qrcodes: 'QR Codes'
    };
    document.getElementById('pageTitle').textContent = titles[section] || 'Dashboard';

    document.querySelectorAll('.sidebar-menu a').forEach(a => a.classList.remove('active'));
    event.target.closest('a')?.classList.add('active');

    switch(section) {
        case 'dashboard': loadDashboard(); break;
        case 'products': loadProducts(); break;
        case 'sales': loadSales(); break;
        case 'stock': loadStock(); break;
        case 'margin': loadMarginCalculator(); break;
        case 'qrcodes': loadQRCodes(); break;
    }
}

// Dashboard
function loadDashboard() {
    const products = DB.getProducts();
    const orders = DB.getOrders();
    const totalRevenue = orders.reduce((sum, o) => sum + o.total, 0);
    const totalQty = orders.reduce((sum, o) => sum + o.items.reduce((s, i) => s + i.qty, 0), 0);
    const totalProducts = products.length;
    const totalStock = products.reduce((sum, p) => sum + p.stock, 0);

    document.getElementById('dashboardStats').innerHTML = `
        <div class="stat-card">
            <div class="stat-icon green"><i class="fas fa-rupee-sign"></i></div>
            <div class="stat-details"><h3>₹${totalRevenue.toLocaleString()}</h3><p>Total Sales</p></div>
        </div>
        <div class="stat-card">
            <div class="stat-icon blue"><i class="fas fa-shopping-bag"></i></div>
            <div class="stat-details"><h3>${orders.length}</h3><p>Total Orders</p></div>
        </div>
        <div class="stat-card">
            <div class="stat-icon orange"><i class="fas fa-box"></i></div>
            <div class="stat-details"><h3>${totalProducts}</h3><p>Products</p></div>
        </div>
        <div class="stat-card">
            <div class="stat-icon purple"><i class="fas fa-warehouse"></i></div>
            <div class="stat-details"><h3>${totalStock}</h3><p>Total Stock</p></div>
        </div>
    `;

    // Recent Sales
    const recent = orders.slice(-10).reverse();
    document.getElementById('recentSalesTable').innerHTML = recent.length ? recent.map(o => `
        <tr>
            <td><strong>${o.id}</strong></td>
            <td>${o.customerName}</td>
            <td>${o.items.map(i => i.name).join(', ')}</td>
            <td>${o.items.reduce((s, i) => s + i.qty, 0)}</td>
            <td><strong>₹${o.total.toFixed(2)}</strong></td>
            <td>${new Date(o.date).toLocaleDateString()}</td>
        </tr>
    `).join('') : '<tr><td colspan="6" class="text-center" style="padding:40px; color:#999;">No sales yet</td></tr>';

    updateNotifBadge();
}

// Products (view only for admin)
function loadProducts() {
    const products = DB.getProducts();
    const spiceEmojis = ['🌶️', '🫚', '⭐', '🌿', '🧂', '🍛'];
    document.getElementById('productsTable').innerHTML = products.map((p, i) => `
        <tr>
            <td>
                <div style="width:50px;height:50px;border-radius:8px;overflow:hidden;background:#f0fdf4;display:flex;align-items:center;justify-content:center;">
                    ${p.image ? `<img src="${p.image}" style="width:100%;height:100%;object-fit:cover;">` : `<span style="font-size:28px;">${spiceEmojis[i % spiceEmojis.length]}</span>`}
                </div>
            </td>
            <td><strong>${p.name}</strong></td>
            <td style="max-width:200px;">${p.description.substring(0, 50)}...</td>
            <td><strong>₹${p.price}</strong> <small>${p.unit}</small></td>
            <td>${p.stock}</td>
        </tr>
    `).join('');
}

// Sales by product
function loadSales() {
    const products = DB.getProducts();
    const orders = DB.getOrders();

    const salesMap = {};
    orders.forEach(order => {
        order.items.forEach(item => {
            if (!salesMap[item.productId]) {
                salesMap[item.productId] = { name: item.name, qty: 0, amount: 0 };
            }
            salesMap[item.productId].qty += item.qty;
            salesMap[item.productId].amount += item.price * item.qty;
        });
    });

    const salesData = Object.values(salesMap);
    document.getElementById('salesByProductTable').innerHTML = salesData.length ? salesData.map(s => `
        <tr>
            <td><strong>${s.name}</strong></td>
            <td>${s.qty}</td>
            <td><strong>₹${s.amount.toFixed(2)}</strong></td>
        </tr>
    `).join('') : '<tr><td colspan="3" class="text-center" style="padding:40px; color:#999;">No sales data yet</td></tr>';
}

// Stock
function loadStock() {
    const products = DB.getProducts();
    document.getElementById('stockTable').innerHTML = products.map(p => {
        const status = p.stock <= 10 ? 'Low Stock' : p.stock <= 50 ? 'Medium' : 'In Stock';
        const cls = p.stock <= 10 ? 'status-disabled' : p.stock <= 50 ? 'status-pending' : 'status-active';
        return `<tr><td><strong>${p.name}</strong></td><td>${p.stock}</td><td>${p.sold || 0}</td><td><span class="status-badge ${cls}">${status}</span></td></tr>`;
    }).join('');
}

// Margin Calculator
function loadMarginCalculator() {
    const products = DB.getProducts();
    document.getElementById('marginTable').innerHTML = products.map(p => {
        const margin = p.margin || 0;
        const marginAmt = (p.price * margin) / 100;
        const final_price = p.price + marginAmt;
        return `
        <tr>
            <td><strong>${p.name}</strong></td>
            <td>₹${p.price.toFixed(2)}</td>
            <td>
                <input type="number" value="${margin}" min="0" max="500" step="0.5"
                    style="width:80px;padding:8px;border:2px solid #e0e0e0;border-radius:8px;text-align:center;font-family:'Poppins',sans-serif;"
                    onchange="updateMargin('${p.id}', this.value)" id="margin-${p.id}">%
            </td>
            <td id="marginAmt-${p.id}">₹${marginAmt.toFixed(2)}</td>
            <td><strong style="color:var(--primary);font-size:16px;" id="finalPrice-${p.id}">₹${final_price.toFixed(2)}</strong></td>
            <td><button class="btn btn-success btn-sm" onclick="saveMargin('${p.id}')"><i class="fas fa-save"></i> Save</button></td>
        </tr>`;
    }).join('');
}

function updateMargin(productId, marginPercent) {
    const p = DB.getProducts().find(x => x.id === productId);
    if (!p) return;
    const margin = parseFloat(marginPercent) || 0;
    const marginAmt = (p.price * margin) / 100;
    document.getElementById(`marginAmt-${productId}`).textContent = `₹${marginAmt.toFixed(2)}`;
    document.getElementById(`finalPrice-${productId}`).textContent = `₹${(p.price + marginAmt).toFixed(2)}`;
}

function saveMargin(productId) {
    const margin = parseFloat(document.getElementById(`margin-${productId}`).value) || 0;
    DB.updateProduct(productId, { margin });
    showToast('Margin saved!');
}

// QR Codes
function loadQRCodes() {
    const settings = DB.getQRSettings();

    // WhatsApp QR
    const waC = document.getElementById('adminWhatsappQR');
    if (waC && settings.whatsapp) {
        const waURL = 'https://wa.me/' + settings.whatsapp.replace('+', '');
        QRCode.toElement(waC, waURL, { width: 180, color: { dark: '#25d366' } });
    }

    // Instagram QR
    const igC = document.getElementById('adminInstagramQR');
    if (igC && settings.instagram) {
        const igURL = 'https://instagram.com/' + settings.instagram;
        QRCode.toElement(igC, igURL, { width: 180, color: { dark: '#e1306c' } });
    }
}

// Notifications
function updateNotifBadge() {
    const notifs = DB.getNotifications();
    const unread = notifs.filter(n => !n.read).length;
    document.getElementById('notifBadge').textContent = unread;
    document.getElementById('notifBadge').style.display = unread > 0 ? 'flex' : 'none';
}

function toggleNotifications() {
    const panel = document.getElementById('notifPanel');
    const overlay = document.getElementById('notifOverlay');
    panel.classList.toggle('active');
    overlay.classList.toggle('active');
    if (panel.classList.contains('active')) {
        const notifs = DB.getNotifications();
        document.getElementById('notificationList').innerHTML = notifs.length ? notifs.map(n => `
            <div class="notification-item">
                <h4>${n.title}</h4>
                <p>${n.message}</p>
                <span class="notification-time">${new Date(n.time).toLocaleString()}</span>
            </div>
        `).join('') : '<div class="empty-state"><i class="fas fa-bell-slash"></i><h3>No notifications</h3></div>';
        DB.markNotificationsRead();
        setTimeout(updateNotifBadge, 500);
    }
}

// Init
document.addEventListener('DOMContentLoaded', () => {
    loadDashboard();
    setInterval(updateNotifBadge, 5000);
});