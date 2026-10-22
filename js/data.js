// ===== DATA MANAGEMENT =====
// Using localStorage as database

const DB = {
    // Initialize default data
    init() {
        // Default Super Admin
        if (!localStorage.getItem('superadmin')) {
            localStorage.setItem('superadmin', JSON.stringify({
                id: 'SA001',
                name: 'Super Admin',
                mobile: '9999999999',
                email: 'superadmin@bhattsorganic.com',
                password: 'admin123',
                role: 'superadmin'
            }));
        }

        // Default Admin Users
        if (!localStorage.getItem('adminUsers')) {
            localStorage.setItem('adminUsers', JSON.stringify([
                {
                    id: 'ADM001',
                    name: 'Rajesh Bhatt',
                    mobile: '8888888888',
                    email: 'rajesh@bhattsorganic.com',
                    password: 'admin123',
                    status: 'active',
                    createdAt: new Date().toISOString()
                }
            ]));
        }

        // Default Products
        if (!localStorage.getItem('products')) {
            localStorage.setItem('products', JSON.stringify([
                {
                    id: 'PRD001',
                    name: 'Turmeric Powder (Haldi)',
                    description: 'Premium quality organic turmeric powder with high curcumin content. Perfect for cooking and health benefits.',
                    price: 120,
                    unit: 'per 100g',
                    stock: 150,
                    sold: 45,
                    image: '',
                    margin: 20,
                    createdAt: new Date().toISOString()
                },
                {
                    id: 'PRD002',
                    name: 'Red Chilli Powder',
                    description: 'Fiery red chilli powder made from premium Kashmiri and Guntur chillies. Rich color and flavor.',
                    price: 150,
                    unit: 'per 100g',
                    stock: 200,
                    sold: 80,
                    image: '',
                    margin: 25,
                    createdAt: new Date().toISOString()
                },
                {
                    id: 'PRD003',
                    name: 'Garam Masala',
                    description: 'Aromatic blend of premium spices including cardamom, cinnamon, cloves, and more.',
                    price: 200,
                    unit: 'per 100g',
                    stock: 100,
                    sold: 60,
                    image: '',
                    margin: 30,
                    createdAt: new Date().toISOString()
                },
                {
                    id: 'PRD004',
                    name: 'Coriander Powder (Dhaniya)',
                    description: 'Fresh ground coriander powder with natural aroma. Essential for Indian cooking.',
                    price: 90,
                    unit: 'per 100g',
                    stock: 180,
                    sold: 35,
                    image: '',
                    margin: 20,
                    createdAt: new Date().toISOString()
                },
                {
                    id: 'PRD005',
                    name: 'Cumin Powder (Jeera)',
                    description: 'Finely ground cumin seeds with earthy, warm flavor. Perfect for curries and dals.',
                    price: 180,
                    unit: 'per 100g',
                    stock: 120,
                    sold: 50,
                    image: '',
                    margin: 22,
                    createdAt: new Date().toISOString()
                },
                {
                    id: 'PRD006',
                    name: 'Kitchen King Masala',
                    description: 'All-purpose masala blend perfect for vegetables, paneer, and mixed dishes.',
                    price: 160,
                    unit: 'per 100g',
                    stock: 90,
                    sold: 40,
                    image: '',
                    margin: 28,
                    createdAt: new Date().toISOString()
                }
            ]));
        }

        // Registered Users
        if (!localStorage.getItem('users')) {
            localStorage.setItem('users', JSON.stringify([]));
        }

        // Orders
        if (!localStorage.getItem('orders')) {
            localStorage.setItem('orders', JSON.stringify([]));
        }

        // Expenses
        if (!localStorage.getItem('expenses')) {
            localStorage.setItem('expenses', JSON.stringify([
                { id: 'EXP001', date: '2025-01-15', category: 'Rent', description: 'Shop rent for January', amount: 25000 },
                { id: 'EXP002', date: '2025-01-20', category: 'Packaging', description: 'Packaging material purchase', amount: 5000 },
                { id: 'EXP003', date: '2025-01-25', category: 'Transport', description: 'Delivery transport charges', amount: 3000 }
            ]));
        }

        // Purchases
        if (!localStorage.getItem('purchases')) {
            localStorage.setItem('purchases', JSON.stringify([
                { id: 'PUR001', date: '2025-01-10', supplier: 'Spice Farm Co.', item: 'Raw Turmeric', qty: 50, amount: 15000, gst: 18, gstAmount: 2700, total: 17700 },
                { id: 'PUR002', date: '2025-01-12', supplier: 'Red Chilli Traders', item: 'Kashmiri Chilli', qty: 30, amount: 12000, gst: 12, gstAmount: 1440, total: 13440 }
            ]));
        }

        // Notifications
        if (!localStorage.getItem('notifications')) {
            localStorage.setItem('notifications', JSON.stringify([]));
        }

        // QR Settings
        if (!localStorage.getItem('qrSettings')) {
            localStorage.setItem('qrSettings', JSON.stringify({
                whatsapp: '+919876543210',
                instagram: 'bhattsorganic'
            }));
        }

        // Cart
        if (!localStorage.getItem('cart')) {
            localStorage.setItem('cart', JSON.stringify([]));
        }
    },

    // Generic CRUD operations
    get(key) {
        const data = localStorage.getItem(key);
        return data ? JSON.parse(data) : null;
    },

    set(key, value) {
        localStorage.setItem(key, JSON.stringify(value));
    },

    // Generate unique IDs
    generateId(prefix) {
        return prefix + Date.now().toString(36).toUpperCase() + Math.random().toString(36).substr(2, 4).toUpperCase();
    },

    // Admin Users CRUD
    getAdminUsers() {
        return this.get('adminUsers') || [];
    },

    addAdminUser(admin) {
        const admins = this.getAdminUsers();
        admin.id = this.generateId('ADM');
        admin.createdAt = new Date().toISOString();
        admins.push(admin);
        this.set('adminUsers', admins);
        return admin;
    },

    updateAdminUser(id, data) {
        let admins = this.getAdminUsers();
        admins = admins.map(a => a.id === id ? { ...a, ...data } : a);
        this.set('adminUsers', admins);
    },

    deleteAdminUser(id) {
        let admins = this.getAdminUsers();
        admins = admins.filter(a => a.id !== id);
        this.set('adminUsers', admins);
    },

    // Products CRUD
    getProducts() {
        return this.get('products') || [];
    },

    addProduct(product) {
        const products = this.getProducts();
        product.id = this.generateId('PRD');
        product.sold = 0;
        product.createdAt = new Date().toISOString();
        products.push(product);
        this.set('products', products);
        return product;
    },

    updateProduct(id, data) {
        let products = this.getProducts();
        products = products.map(p => p.id === id ? { ...p, ...data } : p);
        this.set('products', products);
    },

    deleteProduct(id) {
        let products = this.getProducts();
        products = products.filter(p => p.id !== id);
        this.set('products', products);
    },

    // Users CRUD
    getUsers() {
        return this.get('users') || [];
    },

    addUser(user) {
        const users = this.getUsers();
        user.id = this.generateId('USR');
        user.createdAt = new Date().toISOString();
        users.push(user);
        this.set('users', users);
        return user;
    },

    findUserByMobile(mobile) {
        const users = this.getUsers();
        return users.find(u => u.mobile === mobile);
    },

    // Orders
    getOrders() {
        return this.get('orders') || [];
    },

    addOrder(order) {
        const orders = this.getOrders();
        order.id = this.generateId('ORD');
        order.date = new Date().toISOString();
        order.status = 'completed';
        orders.push(order);
        this.set('orders', orders);

        // Update product stock and sold count
        order.items.forEach(item => {
            let products = this.getProducts();
            products = products.map(p => {
                if (p.id === item.productId) {
                    p.stock = Math.max(0, p.stock - item.qty);
                    p.sold = (p.sold || 0) + item.qty;
                }
                return p;
            });
            this.set('products', products);
        });

        // Add notification
        this.addNotification({
            title: 'New Order Received!',
            message: `Order #${order.id} - ${order.customerName} purchased ${order.items.length} product(s) for ₹${order.total.toFixed(2)}`,
            time: new Date().toISOString()
        });

        return order;
    },

    getUserOrders(userId) {
        return this.getOrders().filter(o => o.userId === userId);
    },

    // Expenses
    getExpenses() {
        return this.get('expenses') || [];
    },

    addExpense(expense) {
        const expenses = this.getExpenses();
        expense.id = this.generateId('EXP');
        expenses.push(expense);
        this.set('expenses', expenses);
        return expense;
    },

    updateExpense(id, data) {
        let expenses = this.getExpenses();
        expenses = expenses.map(e => e.id === id ? { ...e, ...data } : e);
        this.set('expenses', expenses);
    },

    deleteExpense(id) {
        let expenses = this.getExpenses();
        expenses = expenses.filter(e => e.id !== id);
        this.set('expenses', expenses);
    },

    // Purchases
    getPurchases() {
        return this.get('purchases') || [];
    },

    addPurchase(purchase) {
        const purchases = this.getPurchases();
        purchase.id = this.generateId('PUR');
        purchases.push(purchase);
        this.set('purchases', purchases);
        return purchase;
    },

    updatePurchase(id, data) {
        let purchases = this.getPurchases();
        purchases = purchases.map(p => p.id === id ? { ...p, ...data } : p);
        this.set('purchases', purchases);
    },

    deletePurchase(id) {
        let purchases = this.getPurchases();
        purchases = purchases.filter(p => p.id !== id);
        this.set('purchases', purchases);
    },

    // Notifications
    getNotifications() {
        return this.get('notifications') || [];
    },

    addNotification(notif) {
        const notifs = this.getNotifications();
        notif.id = this.generateId('NTF');
        notif.read = false;
        notifs.unshift(notif);
        this.set('notifications', notifs);
    },

    markNotificationsRead() {
        let notifs = this.getNotifications();
        notifs = notifs.map(n => ({ ...n, read: true }));
        this.set('notifications', notifs);
    },

    // QR Settings
    getQRSettings() {
        return this.get('qrSettings') || { whatsapp: '', instagram: '' };
    },

    saveQRSettings(settings) {
        this.set('qrSettings', settings);
    },

    // Cart
    getCart() {
        return this.get('cart') || [];
    },

    setCart(cart) {
        this.set('cart', cart);
    },

    clearCart() {
        this.set('cart', []);
    },

    // Session
    setSession(user) {
        sessionStorage.setItem('currentUser', JSON.stringify(user));
    },

    getSession() {
        const data = sessionStorage.getItem('currentUser');
        return data ? JSON.parse(data) : null;
    },

    clearSession() {
        sessionStorage.removeItem('currentUser');
    }
};

// Initialize DB on load
DB.init();