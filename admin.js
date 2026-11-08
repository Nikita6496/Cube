// ==========================================
// АВТОРИЗАЦИЯ
// ==========================================
const loginScreen = document.getElementById('login-screen');
const dashboardScreen = document.getElementById('dashboard-screen');
const loginForm = document.getElementById('login-form');
const loginError = document.getElementById('login-error');

document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('cube_token');
    if (token) showDashboard();
});

loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    loginError.textContent = "";
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;

    try {
        const res = await fetch('/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || "Ошибка входа");

        localStorage.setItem('cube_token', data.token);
        localStorage.setItem('cube_user', JSON.stringify(data.user));
        showDashboard();
    } catch (err) {
        loginError.textContent = err.message;
    }
});

function showDashboard() {
    loginScreen.style.display = 'none';
    dashboardScreen.style.display = 'block';
    
    const user = JSON.parse(localStorage.getItem('cube_user') || "{}");
    document.getElementById('admin-name').textContent = user.name || "Пользователь";

    // Если пользователь - МЕНЕДЖЕР, скрываем вкладку управления админами
    if (user.role !== 'admin') {
        document.getElementById('tab-btn-users').style.display = 'none';
        // Если менеджер случайно переключился на скрытую вкладку, переключаем на "Брони"
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
        document.querySelector('.tab-btn[data-tab="bookings"]').classList.add('active');
        document.getElementById('tab-bookings').classList.add('active');
    }

    // Загружаем данные
    loadBookings();
    loadHalls();
    loadEntertainments();
    
    // Загружаем пользователей только если мы админ
    if (user.role === 'admin') {
        loadUsers();
    }
}

document.getElementById('logout-btn').addEventListener('click', () => {
    localStorage.removeItem('cube_token');
    localStorage.removeItem('cube_user');
    document.getElementById('login-form').reset();
    location.reload();
});

// ==========================================
// ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ
// ==========================================
async function fetchWithAuth(url, options = {}) {
    const token = localStorage.getItem('cube_token');
    const res = await fetch(url, {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
            ...(options.headers || {})
        }
    });

    if (res.status === 401 || res.status === 403) {
        // Токен протух или недостаточно прав
        localStorage.removeItem('cube_token');
        localStorage.removeItem('cube_user');
        location.reload();
        throw new Error("Ошибка авторизации");
    }
    
    // Если ответ не OK, вытаскиваем сообщение об ошибке из JSON и кидаем исключение
    if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || `Ошибка: ${res.status}`);
    }
    
    return res;
}

// Переключение вкладок
document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
        btn.classList.add('active');
        document.getElementById(`tab-${btn.dataset.tab}`).classList.add('active');
    });
});

// ==========================================
// БРОНИ
// ==========================================
async function loadBookings() {
    try {
        const res = await fetchWithAuth('/api/admin/bookings');
        const bookings = await res.json();
        document.querySelector('#bookings-table tbody').innerHTML = bookings.map(b => `
            <tr>
                <td>${b.id}</td>
                <td>${b.client_name}</td>
                <td>${b.client_phone}</td>
                <td>${b.hall_name || '—'}</td>
                <td>${b.booking_date.split('T')[0]}</td>
                <td>${b.start_time} - ${b.end_time}</td>
                <td>${b.guests_count}</td>
                <td>${b.event_type || '—'}</td>
                <td><span class="status-badge status-${b.status}">${b.status}</span></td>
            </tr>
        `).join('');
    } catch (err) { console.error(err); }
}

// ==========================================
// ЗАЛЫ
// ==========================================
async function loadHalls() {
    try {
        const res = await fetchWithAuth('/api/admin/halls');
        const halls = await res.json();
        document.querySelector('#halls-table tbody').innerHTML = halls.map(h => `
            <tr>
                <td>${h.id}</td>
                <td>${h.name}</td>
                <td>${h.capacity}</td>
                <td>${h.price_per_hour} ₽</td>
                <td><button class="btn-danger" onclick="deleteHall(${h.id})">Удалить</button></td>
            </tr>
        `).join('');
    } catch (err) { console.error(err); }
}

document.getElementById('add-hall-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(e.target).entries());
    try {
        await fetchWithAuth('/api/admin/halls', { method: 'POST', body: JSON.stringify(data) });
        e.target.reset();
        loadHalls();
        alert('Зал добавлен!');
    } catch (err) { alert(err.message); }
});

async function deleteHall(id) {
    if (!confirm('Удалить зал?')) return;
    try {
        await fetchWithAuth(`/api/admin/halls/${id}`, { method: 'DELETE' });
        loadHalls();
    } catch (err) { alert(err.message); }
}

// ==========================================
// РАЗВЛЕЧЕНИЯ
// ==========================================
async function loadEntertainments() {
    try {
        const res = await fetchWithAuth('/api/admin/entertainments');
        const items = await res.json();
        document.querySelector('#ent-table tbody').innerHTML = items.map(i => `
            <tr>
                <td>${i.id}</td>
                <td>${i.name}</td>
                <td>${i.category}</td>
                <td>${i.price} ₽</td>
                <td><button class="btn-danger" onclick="deleteEnt(${i.id})">Удалить</button></td>
            </tr>
        `).join('');
    } catch (err) { console.error(err); }
}

document.getElementById('add-ent-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(e.target).entries());
    try {
        await fetchWithAuth('/api/admin/entertainments', { method: 'POST', body: JSON.stringify(data) });
        e.target.reset();
        loadEntertainments();
        alert('Развлечение добавлено!');
    } catch (err) { alert(err.message); }
});

async function deleteEnt(id) {
    if (!confirm('Удалить развлечение?')) return;
    try {
        await fetchWithAuth(`/api/admin/entertainments/${id}`, { method: 'DELETE' });
        loadEntertainments();
    } catch (err) { alert(err.message); }
}

// ==========================================
// АДМИНЫ (Практика 10)
// ==========================================
async function loadUsers() {
    try {
        const res = await fetchWithAuth('/api/users');
        const users = await res.json();
        const currentUser = JSON.parse(localStorage.getItem('cube_user'));
        
        document.querySelector('#users-table tbody').innerHTML = users.map(u => `
            <tr>
                <td>${u.id}</td>
                <td>${u.name}</td>
                <td>${u.email}</td>
                <td>${u.role === 'admin' ? '<b style="color:#a855f7">Админ</b>' : 'Менеджер'}</td>
                <td>
                    ${u.id === currentUser.id 
                        ? '<span style="color:gray">Это вы</span>' 
                        : `<button class="btn-danger" onclick="deleteUser(${u.id})">Удалить</button>`}
                </td>
            </tr>
        `).join('');
    } catch (err) { console.error(err); }
}

document.getElementById('add-user-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(e.target).entries());
    try {
        await fetchWithAuth('/api/register', { method: 'POST', body: JSON.stringify(data) });
        e.target.reset();
        loadUsers();
        alert('Пользователь добавлен!');
    } catch (err) { alert(err.message); }
});

async function deleteUser(id) {
    if (!confirm('Удалить этого пользователя?')) return;
    try {
        await fetchWithAuth(`/api/users/${id}`, { method: 'DELETE' });
        loadUsers();
    } catch (err) { alert(err.message); }
}