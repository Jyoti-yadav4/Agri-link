// script.js (CLEAN + FIXED VERSION)

const API_BASE_URL = 'http://localhost:5000/api';

const getToken = () => localStorage.getItem('token');
const getUserRole = () => localStorage.getItem('userRole');

// --- SECTION VISIBILITY & NAVIGATION ---
function showSection(sectionClass) {
    const sectionsToManage = [
        'hero', 'login-container', 'register-container',
        'buyers-dashboard-container', 'farmer-dashboard-container',
        'buyer-orders-container'
    ];

    sectionsToManage.forEach(className => {
        const section = document.querySelector('.' + className);
        if (section) section.style.display = 'none';
    });

    const targetSection = document.querySelector('.' + sectionClass);
    if (targetSection) targetSection.style.display = 'block';

    updateNavLinks();
}

function updateNavLinks() {
    const role = getUserRole();
    const isLoggedIn = !!getToken();

    const navItems = {
        login: document.querySelector('.login-link'),
        logout: document.querySelector('.logout-link'),
        farmers: document.querySelector('.farmers-link'),
        buyers: document.querySelector('.buyers-link'),
        admin: document.querySelector('.admin-link'),
        signup: document.querySelector('.signup-link')
    };

    if (navItems.login) navItems.login.style.display = isLoggedIn ? 'none' : 'block';
    if (navItems.logout) navItems.logout.style.display = isLoggedIn ? 'block' : 'none';
    if (navItems.farmers) navItems.farmers.style.display = (isLoggedIn && role === 'farmer') ? 'block' : 'none';

    const buyersVisible = isLoggedIn ? (role === 'buyer' || role === 'admin') : true;
    if (navItems.buyers) navItems.buyers.style.display = buyersVisible ? 'block' : 'none';

    if (navItems.admin) navItems.admin.style.display = (isLoggedIn && role === 'admin') ? 'block' : 'none';
}

// --- AUTH LOGIC ---
async function handleAuth(url, body, successMessage) {
    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
        });

        const data = await response.json();

        if (!response.ok) {
            alert(data.message || 'Authentication failed.');
            return;
        }

        alert(successMessage);

        if (url.includes('/login')) {
            localStorage.setItem('token', data.token);
            localStorage.setItem('userRole', data.user.role);

            if (data.user.role === 'farmer') showFarmerDashboard();
            else if (data.user.role === 'buyer' || data.user.role === 'admin') showBuyerOrderHistory();
            else showSection('hero');

        } else if (url.includes('/register')) {
            showSection('login-container');
        }

    } catch (error) {
        console.error('Error:', error);
        alert('Network error occurred.');
    }
    updateNavLinks();
}

function handleLogout(e) {
    e.preventDefault();
    localStorage.removeItem('token');
    localStorage.removeItem('userRole');
    alert('Logged out successfully.');
    showSection('hero');
}

// --- FARMER DASHBOARD LOGIC ---
function showFarmerDashboard() {
    showSection('farmer-dashboard-container');
    loadFarmerSales();
}

async function handleAddCrop(e) {
    e.preventDefault();
    const token = getToken();

    const name = document.getElementById('crop-name')?.value;
    const price = document.getElementById('crop-price')?.value;
    const imageUrl = document.getElementById('crop-image')?.value;

    if (!name || !price || !imageUrl) return alert('All fields are required.');

    try {
        const response = await fetch(`${API_BASE_URL}/products`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ name, price, imageUrl }),
        });

        const data = await response.json();

        if (response.ok) {
            alert('Crop listed successfully!');
            document.getElementById('add-crop-form').reset();
            loadFarmerSales();
        } else {
            alert(`Listing Failed: ${data.message}`);
        }

    } catch (error) {
        console.error('Error listing crop:', error);
        alert('Network error.');
    }
}

async function handleUpdateStatus(orderId, newStatus) {
    const token = getToken();
    try {
        const response = await fetch(`${API_BASE_URL}/orders/status/${orderId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ status: newStatus }),
        });

        const data = await response.json();

        if (response.ok) {
            alert(data.message);
            loadFarmerSales();
        } else {
            alert(`Status Update Failed: ${data.message}`);
        }
    } catch (error) {
        console.error('Status update error:', error);
    }
}

async function loadFarmerSales() {
    const token = getToken();
    const role = getUserRole();
    const container = document.querySelector('.farmer-dashboard-container');

    if (!token || role !== 'farmer') {
        container.innerHTML = '<p>Please log in as a farmer.</p>';
        return;
    }

    container.innerHTML = `
        <div class="farmer-dashboard-content">
            <div class="add-crop-area">
                <h2>Add a New Crop for Sale</h2>
                <form id="add-crop-form">
                    <label for="crop-name">Crop Name:</label>
                    <input type="text" id="crop-name" required>

                    <label for="crop-price">Price (₹/kg):</label>
                    <input type="number" id="crop-price" required>

                    <label for="crop-image">Image URL:</label>
                    <input type="text" id="crop-image" required>

                    <button type="submit" class="btn-primary">List Crop</button>
                </form>
            </div>

            <div class="orders-list-area">
                <h2>Your Orders</h2>
                <div class="farmer-orders-list">
                    <h3>Loading...</h3>
                </div>
            </div>
        </div>
    `;

    document.getElementById('add-crop-form').addEventListener('submit', handleAddCrop);

    const ordersList = document.querySelector('.farmer-orders-list');

    try {
        const response = await fetch(`${API_BASE_URL}/orders/sales`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        const salesOrders = await response.json();

        if (salesOrders.length === 0) {
            ordersList.innerHTML = '<p>No orders received yet.</p>';
            return;
        }

        let tableHTML = `
            <table>
                <thead>
                    <tr>
                        <th>Order ID</th>
                        <th>Product</th>
                        <th>Buyer</th>
                        <th>Qty</th>
                        <th>Total</th>
                        <th>Status</th>
                        <th>Action</th>
                    </tr>
                </thead>
                <tbody>
        `;

        salesOrders.forEach(order => {
            tableHTML += `
                <tr>
                    <td>...${order._id.slice(-4)}</td>
                    <td>${order.productName}</td>
                    <td>${order.buyerUsername}</td>
                    <td>${order.quantity}</td>
                    <td>₹${(order.price * order.quantity).toFixed(2)}</td>
                    <td>${order.status}</td>
                    <td>
                        <select onchange="handleUpdateStatus('${order._id}', this.value)">
                            <option selected>${order.status}</option>
                            <option value="Confirmed">Confirmed</option>
                            <option value="Shipped">Shipped</option>
                            <option value="Delivered">Delivered</option>
                        </select>
                    </td>
                </tr>
            `;
        });

        tableHTML += '</tbody></table>';
        ordersList.innerHTML = tableHTML;

    } catch (error) {
        console.error('Error loading orders:', error);
        ordersList.innerHTML = '<p>Error loading orders.</p>';
    }
}

// --- BUYER MARKETPLACE ---
function showBuyerMarketplace() {
    showSection('buyers-dashboard-container');
    loadProducts();
}

async function loadProducts() {
    const container = document.querySelector('.products-list');
    container.innerHTML = '<h3>Loading...</h3>';

    try {
        const response = await fetch(`${API_BASE_URL}/products`);
        const products = await response.json();

        container.innerHTML = '';

        if (products.length === 0) {
            container.innerHTML = '<p>No crops available.</p>';
            return;
        }

        products.forEach(product => {
            const card = document.createElement('div');
            card.classList.add('card');

            card.innerHTML = `
                <img src="${product.imageUrl}" alt="${product.name}">
                <h3>${product.name}</h3>
                <p>₹${product.price}/kg</p>
                <p class="farmer-info">Farmer: ${product.farmerUsername}</p>
                <button class="btn-primary" onclick="handleBuy('${product._id}')">Buy</button>
            `;
            container.appendChild(card);
        });

    } catch (error) {
        console.error('Product load error:', error);
        container.innerHTML = '<p>Server error loading products.</p>';
    }
}

async function handleBuy(productId) {
    const token = getToken();
    const role = getUserRole();

    if (!token || role !== 'buyer') {
        alert('Login as buyer to order.');
        showSection('login-container');
        return;
    }

    const quantity = parseFloat(prompt('Enter quantity (kg):', '1'));
    if (!quantity || quantity <= 0) return alert('Invalid quantity.');

    try {
        const response = await fetch(`${API_BASE_URL}/orders/buy/${productId}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ quantity })
        });

        const data = await response.json();

        if (response.ok) {
            alert(`Order placed! Total: ₹${data.order.totalPrice}`);
            showBuyerOrderHistory();
        } else {
            alert(data.message);
        }

    } catch (error) {
        console.error('Order error:', error);
    }
}

// --- BUYER ORDER HISTORY ---
function showBuyerOrderHistory() {
    showSection('buyer-orders-container');
    loadBuyerOrders();
}

async function loadBuyerOrders() {
    const container = document.querySelector('.buyer-orders-list');
    const token = getToken();

    container.innerHTML = '<h3>Loading...</h3>';

    try {
        const response = await fetch(`${API_BASE_URL}/orders/history`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        const orders = await response.json();

        if (orders.length === 0) {
            container.innerHTML = '<p>No orders yet.</p>';
            return;
        }

        let tableHTML = `
            <table>
                <thead>
                    <tr>
                        <th>Order ID</th>
                        <th>Product</th>
                        <th>Qty</th>
                        <th>Total</th>
                        <th>Status</th>
                        <th>Date</th>
                    </tr>
                </thead>
                <tbody>
        `;

        orders.forEach(order => {
            tableHTML += `
                <tr>
                    <td>...${order._id.slice(-4)}</td>
                    <td>${order.productName}</td>
                    <td>${order.quantity}</td>
                    <td>₹${(order.price * order.quantity).toFixed(2)}</td>
                    <td>${order.status}</td>
                    <td>${new Date(order.createdAt).toLocaleDateString()}</td>
                </tr>
            `;
        });

        tableHTML += '</tbody></table>';
        container.innerHTML = tableHTML;

    } catch (error) {
        console.error('Order load error:', error);
        container.innerHTML = '<p>Error loading orders.</p>';
    }
}

// --- EVENT LISTENERS ---
document.addEventListener('DOMContentLoaded', () => {

    document.querySelector('.home-link')?.addEventListener('click', e => {
        e.preventDefault();
        showSection('hero');
    });

    document.querySelectorAll('.login-link').forEach(link => {
        link.addEventListener('click', e => {
            e.preventDefault();
            showSection('login-container');
        });
    });

    document.querySelector('.signup-link')?.addEventListener('click', e => {
        e.preventDefault();
        showSection('register-container');
    });

    document.querySelector('.farmers-link')?.addEventListener('click', e => {
        e.preventDefault();
        getToken() ? showFarmerDashboard() : showSection('hero');
    });

    document.querySelector('.buyers-link')?.addEventListener('click', e => {
        e.preventDefault();
        getToken() ? showBuyerOrderHistory() : showBuyerMarketplace();
    });

    document.querySelector('.admin-link')?.addEventListener('click', e => {
        e.preventDefault();
        getToken() ? showBuyerOrderHistory() : showSection('hero');
    });

    document.querySelector('.logout-link')?.addEventListener('click', handleLogout);

    document.getElementById('explore-btn')?.addEventListener('click', showBuyerMarketplace);

    document.getElementById('login-form')?.addEventListener('submit', e => {
        e.preventDefault();
        handleAuth(`${API_BASE_URL}/auth/login`, {
            username: document.getElementById('username').value,
            password: document.getElementById('password').value
        }, 'Login successful!');
    });

    document.getElementById('register-form')?.addEventListener('submit', e => {
        e.preventDefault();
        handleAuth(`${API_BASE_URL}/auth/register`, {
            username: document.getElementById('reg-username').value,
            password: document.getElementById('reg-password').value,
            role: document.getElementById('reg-role').value
        }, 'Registration successful!');
    });

    updateNavLinks();

    const token = getToken();
    const role = getUserRole();

    if (!token) return showSection('hero');

    if (role === 'farmer') showFarmerDashboard();
    else if (role === 'buyer' || role === 'admin') showBuyerOrderHistory();
    else showSection('hero');
});
