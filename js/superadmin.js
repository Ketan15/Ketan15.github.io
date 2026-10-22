// ===== SUPER ADMIN PANEL =====

// Check auth
(function checkAuth() {
    const user = DB.getSession();
    if (!user || user.role !== 'superadmin') {
        window.location.href = 'login.html';
        return;
    }
    document.getElementById('userName').textContent = user.name;
    document.getElementById('userAvatar').textContent = user.name.charAt(0).toUpperCase();
})();

// Toast
function showToast(message, type = 'success') {
    const container = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `<i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i> ${message}`;
    container.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}

// Logout
function logout() {
    DB.clearSession();
    window.location.href = 'login.html';
}

// Section navigation
function showSection(section) {
    document.querySelectorAll('.section-content').forEach(s => s.style.display = 'none');
    document.getElementById(`section-${section}`).style.display = 'block';
    
    const titles = {
        dashboard: 'Dashboard',
        admins: 'Admin Users',
        products: 'Products',
        orders: 'Orders',
        expenses: 'Expenses',
        purchases: 'Purchases',
        margin: 'Margin Calculator',
        qrcodes: 'QR Codes / Barcodes',
        customers: 'Customers',
        stock: 'Stock Balance'
    };
    document.getElementById('pageTitle').textContent = titles[section] || 'Dashboard';

    // Update active menu
    document.querySelectorAll('.sidebar-menu a').forEach(a => a.classList.remove('active'));
    event.target.closest('a')?.classList.add('active');

    // Refresh data
    refreshSection(section);
}

function refreshSection(section) {
    switch(section) {
        case 'dashboard': loadDashboard(); break;
        case 'admins': loadAdminUsers(); break;
        case 'products': loadProducts(); break;
        case 'orders': loadOrders(); break;
        case 'expenses': loadExpenses(); break;
        case 'purchases': loadPurchases(); break;
        case 'margin': loadMarginCalculator(); break;
        case 'qrcodes': loadQRCodes(); break;
        case 'customers': loadCustomers(); break;
        case 'stock': loadStock(); break;
    }
}

// ===== DASHBOARD =====
function loadDashboard() {
    const products = DB.getProducts();
    const orders = DB.getOrders();
    const users = DB.getUsers();
    const expenses = DB.getExpenses();

    const totalRevenue = orders.reduce((sum, o) => sum + o.total, 0);
    const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
    const totalProducts = products.length;
    const totalCustomers = users.length;
    const totalOrders = orders.length;

    document.getElementById('dashboardStats').innerHTML = `
        <div class="stat-card">
            <div class="stat-icon green"><i class="fas fa-rupee-sign"></i></div>
            <div class="stat-details">
                <h3>₹${totalRevenue.toLocaleString()}</h3>
                <p>Total Revenue</p>
            </div>
        </div>
        <div class="stat-card">
            <div class="stat-icon blue"><i class="fas fa-shopping-bag"></i></div>
            <div class="stat-details">
                <h3>${totalOrders}</h3>
                <p>Total Orders</p>
            </div>
        </div>
        <div class="stat-card">
            <div class="stat-icon orange"><i class="fas fa-box"></i></div>
            <div class="stat-details">
                <h3>${totalProducts}</h3>
                <p>Total Products</p>
            </div>
        </div>
        <div class="stat-card">
            <div class="stat-icon purple"><i class="fas fa-users"></i></div>
            <div class="stat-details">
                <h3>${totalCustomers}</h3>
                <p>Customers</p>
            </div>
        </div>
        <div class="stat-card">
            <div class="stat-icon red"><i class="fas fa-receipt"></i></div>
            <div class="stat-details">
                <h3>₹${totalExpenses.toLocaleString()}</h3>
                <p>Total Expenses</p>
            </div>
        </div>
    `;

    // Recent Orders
    const recentOrders = orders.slice(-10).reverse();
    document.getElementById('recentOrdersTable').innerHTML = recentOrders.length ? recentOrders.map(order => `
        <tr>
            <td><strong>${order.id}</strong></td>
            <td>${order.customerName}</td>
            <td>${order.items.map(i => i.name).join(', ')}</td>
            <td><strong>₹${order.total.toFixed(2)}</strong></td>
            <td>${order.paymentMode}</td>
            <td>${new Date(order.date).toLocaleDateString()}</td>
            <td><span class="status-badge status-completed">${order.status}</span></td>
        </tr>
    `).join('') : '<tr><td colspan="7" class="text-center" style="padding:40px; color:#999;">No orders yet</td></tr>';

    updateNotifBadge();
}

// ===== ADMIN USERS =====
function loadAdminUsers() {
    const admins = DB.getAdminUsers();
    document.getElementById('adminUsersTable').innerHTML = admins.length ? admins.map(admin => `
        <tr>
            <td><strong>${admin.name}</strong></td>
            <td>${admin.mobile}</td>
            <td>${admin.email}</td>
            <td><span class="status-badge status-${admin.status === 'active' ? 'active' : 'disabled'}">${admin.status === 'active' ? 'Enabled' : 'Disabled'}</span></td>
            <td>
                <div class="action-btns">
                    <button class="action-btn edit" onclick="editAdmin('${admin.id}')" title="Edit"><i class="fas fa-edit"></i></button>
                    <button class="action-btn delete" onclick="deleteAdmin('${admin.id}')" title="Delete"><i class="fas fa-trash"></i></button>
                </div>
            </td>
        </tr>
    `).join('') : '<tr><td colspan="5" class="text-center" style="padding:40px; color:#999;">No admin users</td></tr>';
}

function saveAdmin(event) {
    event.preventDefault();
    const editId = document.getElementById('editAdminId').value;
    const data = {
        name: document.getElementById('adminName').value.trim(),
        mobile: document.getElementById('adminMobile').value.trim(),
        email: document.getElementById('adminEmail').value.trim(),
        password: document.getElementById('adminPassword').value,
        status: document.getElementById('adminStatus').value
    };

    if (editId) {
        DB.updateAdminUser(editId, data);
        showToast('Admin user updated successfully!');
    } else {
        // Check duplicate mobile
        const existing = DB.getAdminUsers().find(a => a.mobile === data.mobile);
        if (existing) {
            showToast('Mobile number already exists!', 'error');
            return false;
        }
        DB.addAdminUser(data);
        showToast('Admin user added successfully!');
    }

    closeModal('addAdminModal');
    document.getElementById('adminForm').reset();
    document.getElementById('editAdminId').value = '';
    loadAdminUsers();
    return false;
}

function editAdmin(id) {
    const admin = DB.getAdminUsers().find(a => a.id === id);
    if (!admin) return;

    document.getElementById('editAdminId').value = admin.id;
    document.getElementById('adminName').value = admin.name;
    document.getElementById('adminMobile').value = admin.mobile;
    document.getElementById('adminEmail').value = admin.email;
    document.getElementById('adminPassword').value = admin.password;
    document.getElementById('adminStatus').value = admin.status;
    document.getElementById('adminModalTitle').textContent = 'Edit Admin User';
    openModal('addAdminModal');
}

function deleteAdmin(id) {
    if (confirm('Are you sure you want to delete this admin user?')) {
        DB.deleteAdminUser(id);
        showToast('Admin user deleted!');
        loadAdminUsers();
    }
}

// ===== PRODUCTS =====
function loadProducts() {
    const products = DB.getProducts();
    const spiceEmojis = ['🌶️', '🫚', '⭐', '🌿', '🧂', '🍛', '🌰', '🧄'];

    document.getElementById('productsTable').innerHTML = products.length ? products.map((product, index) => `
        <tr>
            <td>
                <div style="width:50px;height:50px;border-radius:8px;overflow:hidden;background:#f0fdf4;display:flex;align-items:center;justify-content:center;">
                    ${product.image ? 
                        `<img src="${product.image}" style="width:100%;height:100%;object-fit:cover;">` : 
                        `<span style="font-size:28px;">${spiceEmojis[index % spiceEmojis.length]}</span>`
                    }
                </div>
            </td>
            <td><strong>${product.name}</strong></td>
            <td style="max-width:200px;">${product.description.substring(0, 50)}...</td>
            <td><strong>₹${product.price}</strong> <small>${product.unit}</small></td>
            <td>${product.stock}</td>
            <td>
                <div class="action-btns">
                    <button class="action-btn edit" onclick="editProduct('${product.id}')" title="Edit"><i class="fas fa-edit"></i></button>
                    <button class="action-btn delete" onclick="deleteProduct('${product.id}')" title="Delete"><i class="fas fa-trash"></i></button>
                </div>
            </td>
        </tr>
    `).join('') : '<tr><td colspan="6" class="text-center" style="padding:40px; color:#999;">No products</td></tr>';
}

function previewImage(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const preview = document.getElementById('imagePreview');
            preview.src = e.target.result;
            preview.style.display = 'block';
        };
        reader.readAsDataURL(file);
    }
}

function saveProduct(event) {
    event.preventDefault();
    const editId = document.getElementById('editProductId').value;
    const data = {
        name: document.getElementById('productName').value.trim(),
        description: document.getElementById('productDescription').value.trim(),
        price: parseFloat(document.getElementById('productPrice').value),
        unit: document.getElementById('productUnit').value,
        stock: parseInt(document.getElementById('productStock').value),
        margin: 20
    };

    // Handle image
    const preview = document.getElementById('imagePreview');
    if (preview.src && preview.style.display !== 'none') {
        data.image = preview.src;
    }

    if (editId) {
        DB.updateProduct(editId, data);
        showToast('Product updated successfully!');
    } else {
        DB.addProduct(data);
        showToast('Product added successfully!');
    }

    closeModal('addProductModal');
    document.getElementById('productForm').reset();
    document.getElementById('editProductId').value = '';
    document.getElementById('imagePreview').style.display = 'none';
    loadProducts();
    return false;
}

function editProduct(id) {
    const product = DB.getProducts().find(p => p.id === id);
    if (!product) return;

    document.getElementById('editProductId').value = product.id;
    document.getElementById('productName').value = product.name;
    document.getElementById('productDescription').value = product.description;
    document.getElementById('productPrice').value = product.price;
    document.getElementById('productUnit').value = product.unit;
    document.getElementById('productStock').value = product.stock;
    
    if (product.image) {
        const preview = document.getElementById('imagePreview');
        preview.src = product.image;
        preview.style.display = 'block';
    }

    document.getElementById('productModalTitle').textContent = 'Edit Product';
    openModal('addProductModal');
}

function deleteProduct(id) {
    if (confirm('Are you sure you want to delete this product?')) {
        DB.deleteProduct(id);
        showToast('Product deleted!');
        loadProducts();
    }
}

// ===== ORDERS =====
function loadOrders() {
    const orders = DB.getOrders().reverse();
    document.getElementById('allOrdersTable').innerHTML = orders.length ? orders.map(order => `
        <tr>
            <td><strong>${order.id}</strong></td>
            <td>${order.customerName}</td>
            <td>${order.items.map(i => i.name).join(', ')}</td>
            <td>${order.items.reduce((sum, i) => sum + i.qty, 0)}</td>
            <td><strong>₹${order.total.toFixed(2)}</strong></td>
            <td>${order.paymentMode}</td>
            <td>${new Date(order.date).toLocaleDateString()}</td>
            <td><span class="status-badge status-completed">${order.status}</span></td>
        </tr>
    `).join('') : '<tr><td colspan="8" class="text-center" style="padding:40px; color:#999;">No orders yet</td></tr>';
}

// ===== EXPENSES =====
function loadExpenses() {
    const expenses = DB.getExpenses();
    const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
    const thisMonth = expenses.filter(e => {
        const d = new Date(e.date);
        const now = new Date();
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    }).reduce((sum, e) => sum + e.amount, 0);

    document.getElementById('expenseSummary').innerHTML = `
        <div class="expense-card">
            <h4>Total Expenses</h4>
            <div class="amount">₹${totalExpenses.toLocaleString()}</div>
        </div>
        <div class="expense-card">
            <h4>This Month</h4>
            <div class="amount">₹${thisMonth.toLocaleString()}</div>
        </div>
        <div class="expense-card">
            <h4>Total Entries</h4>
            <div class="amount">${expenses.length}</div>
        </div>
    `;

    document.getElementById('expensesTable').innerHTML = expenses.length ? expenses.map(exp => `
        <tr>
            <td>${exp.date}</td>
            <td><span class="status-badge status-active">${exp.category}</span></td>
            <td>${exp.description}</td>
            <td><strong>₹${exp.amount.toLocaleString()}</strong></td>
            <td>
                <div class="action-btns">
                    <button class="action-btn edit" onclick="editExpense('${exp.id}')" title="Edit"><i class="fas fa-edit"></i></button>
                    <button class="action-btn delete" onclick="deleteExpenseItem('${exp.id}')" title="Delete"><i class="fas fa-trash"></i></button>
                </div>
            </td>
        </tr>
    `).join('') : '<tr><td colspan="5" class="text-center" style="padding:40px; color:#999;">No expenses</td></tr>';
}

function saveExpense(event) {
    event.preventDefault();
    const editId = document.getElementById('editExpenseId').value;
    const data = {
        date: document.getElementById('expenseDate').value,
        category: document.getElementById('expenseCategory').value,
        description: document.getElementById('expenseDesc').value.trim(),
        amount: parseFloat(document.getElementById('expenseAmount').value)
    };

    if (editId) {
        DB.updateExpense(editId, data);
        showToast('Expense updated!');
    } else {
        DB.addExpense(data);
        showToast('Expense added!');
    }

    closeModal('addExpenseModal');
    document.getElementById('expenseForm').reset();
    document.getElementById('editExpenseId').value = '';
    loadExpenses();
    return false;
}

function editExpense(id) {
    const expense = DB.getExpenses().find(e => e.id === id);
    if (!expense) return;
    document.getElementById('editExpenseId').value = expense.id;
    document.getElementById('expenseDate').value = expense.date;
    document.getElementById('expenseCategory').value = expense.category;
    document.getElementById('expenseDesc').value = expense.description;
    document.getElementById('expenseAmount').value = expense.amount;
    openModal('addExpenseModal');
}

function deleteExpenseItem(id) {
    if (confirm('Delete this expense?')) {
        DB.deleteExpense(id);
        showToast('Expense deleted!');
        loadExpenses();
    }
}

// ===== PURCHASES =====
function loadPurchases() {
    const purchases = DB.getPurchases();
    document.getElementById('purchasesTable').innerHTML = purchases.length ? purchases.map(pur => `
        <tr>
            <td>${pur.date}</td>
            <td>${pur.supplier}</td>
            <td>${pur.item}</td>
            <td>${pur.qty}</td>
            <td>₹${pur.amount.toLocaleString()}</td>
            <td>${pur.gst}%</td>
            <td>₹${pur.gstAmount.toFixed(2)}</td>
            <td><strong>₹${pur.total.toFixed(2)}</strong></td>
            <td>
                <div class="action-btns">
                    <button class="action-btn edit" onclick="editPurchase('${pur.id}')" title="Edit"><i class="fas fa-edit"></i></button>
                    <button class="action-btn delete" onclick="deletePurchaseItem('${pur.id}')" title="Delete"><i class="fas fa-trash"></i></button>
                </div>
            </td>
        </tr>
    `).join('') : '<tr><td colspan="9" class="text-center" style="padding:40px; color:#999;">No purchases</td></tr>';
}

function calculatePurchaseGST() {
    const amount = parseFloat(document.getElementById('purchaseAmount').value) || 0;
    const gstPercent = parseFloat(document.getElementById('purchaseGST').value) || 0;
    const gstAmount = (amount * gstPercent) / 100;
    const total = amount + gstAmount;

    document.getElementById('gstAmountDisplay').textContent = gstAmount.toFixed(2);
    document.getElementById('purchaseTotalDisplay').textContent = total.toFixed(2);
}

function savePurchase(event) {
    event.preventDefault();
    const editId = document.getElementById('editPurchaseId').value;
    const amount = parseFloat(document.getElementById('purchaseAmount').value);
    const gst = parseFloat(document.getElementById('purchaseGST').value);
    const gstAmount = (amount * gst) / 100;

    const data = {
        date: document.getElementById('purchaseDate').value,
        supplier: document.getElementById('purchaseSupplier').value.trim(),
        item: document.getElementById('purchaseItem').value.trim(),
        qty: parseInt(document.getElementById('purchaseQty').value),
        amount: amount,
        gst: gst,
        gstAmount: gstAmount,
        total: amount + gstAmount
    };

    if (editId) {
        DB.updatePurchase(editId, data);
        showToast('Purchase updated!');
    } else {
        DB.addPurchase(data);
        showToast('Purchase added!');
    }

    closeModal('addPurchaseModal');
    document.getElementById('purchaseForm').reset();
    document.getElementById('editPurchaseId').value = '';
    document.getElementById('gstAmountDisplay').textContent = '0.00';
    document.getElementById('purchaseTotalDisplay').textContent = '0.00';
    loadPurchases();
    return false;
}

function editPurchase(id) {
    const pur = DB.getPurchases().find(p => p.id === id);
    if (!pur) return;
    document.getElementById('editPurchaseId').value = pur.id;
    document.getElementById('purchaseDate').value = pur.date;
    document.getElementById('purchaseSupplier').value = pur.supplier;
    document.getElementById('purchaseItem').value = pur.item;
    document.getElementById('purchaseQty').value = pur.qty;
    document.getElementById('purchaseAmount').value = pur.amount;
    document.getElementById('purchaseGST').value = pur.gst;
    calculatePurchaseGST();
    openModal('addPurchaseModal');
}

function deletePurchaseItem(id) {
    if (confirm('Delete this purchase?')) {
        DB.deletePurchase(id);
        showToast('Purchase deleted!');
        loadPurchases();
    }
}

// ===== MARGIN CALCULATOR =====
function loadMarginCalculator() {
    const products = DB.getProducts();
    document.getElementById('marginTable').innerHTML = products.map(product => {
        const margin = product.margin || 0;
        const marginAmount = (product.price * margin) / 100;
        const finalPrice = product.price + marginAmount;
        return `
        <tr>
            <td><strong>${product.name}</strong></td>
            <td>₹${product.price.toFixed(2)}</td>
            <td>
                <input type="number" value="${margin}" min="0" max="500" step="0.5"
                    style="width:80px; padding:8px; border:2px solid #e0e0e0; border-radius:8px; text-align:center; font-family:'Poppins',sans-serif;"
                    onchange="updateMargin('${product.id}', this.value)"
                    id="margin-${product.id}">
                <span>%</span>
            </td>
            <td id="marginAmt-${product.id}">₹${marginAmount.toFixed(2)}</td>
            <td><strong style="color:var(--primary); font-size:16px;" id="finalPrice-${product.id}">₹${finalPrice.toFixed(2)}</strong></td>
            <td>
                <button class="btn btn-success btn-sm" onclick="saveMargin('${product.id}')">
                    <i class="fas fa-save"></i> Save
                </button>
            </td>
        </tr>
    `;
    }).join('');
}

function updateMargin(productId, marginPercent) {
    const product = DB.getProducts().find(p => p.id === productId);
    if (!product) return;
    
    const margin = parseFloat(marginPercent) || 0;
    const marginAmount = (product.price * margin) / 100;
    const finalPrice = product.price + marginAmount;

    document.getElementById(`marginAmt-${productId}`).textContent = `₹${marginAmount.toFixed(2)}`;
    document.getElementById(`finalPrice-${productId}`).textContent = `₹${finalPrice.toFixed(2)}`;
}

function saveMargin(productId) {
    const marginInput = document.getElementById(`margin-${productId}`);
    const margin = parseFloat(marginInput.value) || 0;
    DB.updateProduct(productId, { margin: margin });
    showToast('Margin saved successfully!');
}

// ===== QR CODES =====
function loadQRCodes() {
    const settings = DB.getQRSettings();
    document.getElementById('whatsappNumber').value = settings.whatsapp || '';
    document.getElementById('instagramUsername').value = settings.instagram || '';
    generateAdminQR();
}

function saveQRSettings() {
    const settings = {
        whatsapp: document.getElementById('whatsappNumber').value.trim(),
        instagram: document.getElementById('instagramUsername').value.trim()
    };
    DB.saveQRSettings(settings);
    generateAdminQR();
    showToast('QR settings saved!');
}

function generateAdminQR() {
    const settings = DB.getQRSettings();

    // WhatsApp QR
    const waContainer = document.getElementById('adminWhatsappQR');
    if (waContainer && settings.whatsapp) {
        const waURL = 'https://wa.me/' + settings.whatsapp.replace('+', '');
        QRCode.toElement(waContainer, waURL, { width: 180, color: { dark: '#25d366' } });
    }

    // Instagram QR
    const igContainer = document.getElementById('adminInstagramQR');
    if (igContainer && settings.instagram) {
        const igURL = 'https://instagram.com/' + settings.instagram;
        QRCode.toElement(igContainer, igURL, { width: 180, color: { dark: '#e1306c' } });
    }
}

// ===== CUSTOMERS =====
function loadCustomers() {
    const users = DB.getUsers();
    const orders = DB.getOrders();

    document.getElementById('customersTable').innerHTML = users.length ? users.map(user => {
        const userOrders = orders.filter(o => o.userId === user.id);
        return `
        <tr>
            <td><strong>${user.name}</strong></td>
            <td>${user.mobile}</td>
            <td>${user.email}</td>
            <td>${new Date(user.createdAt).toLocaleDateString()}</td>
            <td>${userOrders.length}</td>
        </tr>
    `;
    }).join('') : '<tr><td colspan="5" class="text-center" style="padding:40px; color:#999;">No customers registered yet</td></tr>';
}

// ===== STOCK =====
function loadStock() {
    const products = DB.getProducts();
    document.getElementById('stockTable').innerHTML = products.map(product => {
        const stockStatus = product.stock <= 10 ? 'Low Stock' : product.stock <= 50 ? 'Medium' : 'In Stock';
        const statusClass = product.stock <= 10 ? 'status-disabled' : product.stock <= 50 ? 'status-pending' : 'status-active';
        return `
        <tr>
            <td><strong>${product.name}</strong></td>
            <td>${product.stock}</td>
            <td>${product.sold || 0}</td>
            <td><span class="status-badge ${statusClass}">${stockStatus}</span></td>
        </tr>
    `;
    }).join('');
}

// ===== NOTIFICATIONS =====
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
        loadNotifications();
        DB.markNotificationsRead();
        setTimeout(updateNotifBadge, 500);
    }
}

function loadNotifications() {
    const notifs = DB.getNotifications();
    const list = document.getElementById('notificationList');
    list.innerHTML = notifs.length ? notifs.map(n => `
        <div class="notification-item ${n.read ? '' : 'style="background:#f0fdf4;"'}">
            <h4>${n.title}</h4>
            <p>${n.message}</p>
            <span class="notification-time">${new Date(n.time).toLocaleString()}</span>
        </div>
    `).join('') : '<div class="empty-state"><i class="fas fa-bell-slash"></i><h3>No notifications</h3></div>';
}

// ===== MODAL HELPERS =====
function openModal(id) {
    document.getElementById(id).classList.add('active');
}

function closeModal(id) {
    document.getElementById(id).classList.remove('active');
    // Reset forms when closing
    if (id === 'addAdminModal') {
        document.getElementById('adminForm').reset();
        document.getElementById('editAdminId').value = '';
        document.getElementById('adminModalTitle').textContent = 'Add Admin User';
    }
    if (id === 'addProductModal') {
        document.getElementById('productForm').reset();
        document.getElementById('editProductId').value = '';
        document.getElementById('imagePreview').style.display = 'none';
        document.getElementById('productModalTitle').textContent = 'Add Product';
    }
}

function toggleSidebar() {
    document.getElementById('sidebar').classList.toggle('active');
}

// ===== INIT =====
document.addEventListener('DOMContentLoaded', () => {
    loadDashboard();
    // Poll for new notifications every 5 seconds
    setInterval(updateNotifBadge, 5000);
});