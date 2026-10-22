// ===== AUTHENTICATION =====

function showToast(message, type = 'success') {
    const container = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `<i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i> ${message}`;
    container.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}

function handleLogin(event) {
    event.preventDefault();
    
    const mobile = document.getElementById('loginMobile').value;
    const password = document.getElementById('loginPassword').value;

    // 1. Check if it's the Super Admin
    const superadmin = DB.get('superadmin');
    if (superadmin.mobile === mobile && superadmin.password === password) {
        DB.setSession({ ...superadmin, role: 'superadmin' });
        showToast('Super Admin Login successful!');
        setTimeout(() => window.location.href = 'superadmin.html', 1000);
        return false;
    }

    // 2. Check if it's an Admin
    const admins = DB.getAdminUsers();
    const admin = admins.find(a => a.mobile === mobile && a.password === password);
    if (admin) {
        if (admin.status === 'disabled') {
            showToast('Your account is disabled. Contact Super Admin.', 'error');
            return false;
        }
        DB.setSession({ ...admin, role: 'admin' });
        showToast('Admin Login successful!');
        setTimeout(() => window.location.href = 'admin.html', 1000);
        return false;
    }

    // 3. Check if it's a Customer (User)
    const user = DB.findUserByMobile(mobile);
    if (user && user.password === password) {
        DB.setSession({ ...user, role: 'user' });
        showToast('Login successful!');
        setTimeout(() => window.location.href = 'user.html', 1000);
        return false;
    }

    // If none match
    showToast('Invalid mobile number or password!', 'error');
    return false;
}

function handleRegister(event) {
    event.preventDefault();

    const name = document.getElementById('regName').value.trim();
    const mobile = document.getElementById('regMobile').value.trim();
    const email = document.getElementById('regEmail').value.trim();
    const password = document.getElementById('regPassword').value;
    const confirmPassword = document.getElementById('regConfirmPassword').value;

    if (password !== confirmPassword) {
        showToast('Passwords do not match!', 'error');
        return false;
    }

    // Check if mobile already registered
    const existing = DB.findUserByMobile(mobile);
    if (existing) {
        showToast('Mobile number already registered!', 'error');
        return false;
    }

    const user = DB.addUser({
        name,
        mobile,
        email,
        password
    });

    showToast('Registration successful! Please login.');
    setTimeout(() => window.location.href = 'login.html', 1500);
    return false;
}