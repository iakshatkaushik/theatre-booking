/**
 * Theatre Management System — API Client
 * Handles all API communication with consistent error handling
 */

const API_BASE = '/api';

class Api {
    static getToken() {
        return localStorage.getItem('theatre_token');
    }

    static setToken(token) {
        localStorage.setItem('theatre_token', token);
    }

    static removeToken() {
        localStorage.removeItem('theatre_token');
        localStorage.removeItem('theatre_user');
    }

    static getUser() {
        try {
            return JSON.parse(localStorage.getItem('theatre_user'));
        } catch {
            return null;
        }
    }

    static setUser(user) {
        localStorage.setItem('theatre_user', JSON.stringify(user));
    }

    static isLoggedIn() {
        return !!this.getToken();
    }

    static isAdmin() {
        const user = this.getUser();
        return user && user.role === 'ADMIN';
    }

    static logout() {
        this.removeToken();
        window.location.href = '/';
    }

    static async request(endpoint, options = {}) {
        const url = `${API_BASE}${endpoint}`;
        const headers = {
            'Content-Type': 'application/json',
            ...options.headers,
        };

        const token = this.getToken();
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        try {
            const response = await fetch(url, {
                ...options,
                headers,
                body: options.body ? JSON.stringify(options.body) : undefined,
            });

            const data = await response.json();

            if (!response.ok) {
                throw {
                    status: response.status,
                    code: data.error?.code || 'UNKNOWN',
                    message: data.error?.message || 'An error occurred',
                    details: data.error?.details || [],
                };
            }

            return data;
        } catch (error) {
            if (error.code) throw error;
            throw { code: 'NETWORK_ERROR', message: 'Network error. Please check your connection.' };
        }
    }

    // Auth
    static register(data) {
        return this.request('/auth/register', { method: 'POST', body: data });
    }

    static login(data) {
        return this.request('/auth/login', { method: 'POST', body: data });
    }

    static getMe() {
        return this.request('/auth/me');
    }

    // Movies
    static getMovies(params = {}) {
        const query = new URLSearchParams(params).toString();
        return this.request(`/movies${query ? '?' + query : ''}`);
    }

    static getMovie(id) {
        return this.request(`/movies/${id}`);
    }

    // Shows
    static getShows(params = {}) {
        const query = new URLSearchParams(params).toString();
        return this.request(`/shows${query ? '?' + query : ''}`);
    }

    static getShowSeats(showId) {
        return this.request(`/shows/${showId}/seats`);
    }

    // Bookings
    static createBooking(data) {
        return this.request('/bookings', { method: 'POST', body: data });
    }

    static getMyBookings(params = {}) {
        const query = new URLSearchParams(params).toString();
        return this.request(`/bookings/my-bookings${query ? '?' + query : ''}`);
    }

    // Admin
    static createMovie(data) {
        return this.request('/admin/movies', { method: 'POST', body: data });
    }

    static updateMovie(id, data) {
        return this.request(`/admin/movies/${id}`, { method: 'PUT', body: data });
    }

    static deleteMovie(id) {
        return this.request(`/admin/movies/${id}`, { method: 'DELETE' });
    }

    static createShow(data) {
        return this.request('/admin/shows', { method: 'POST', body: data });
    }

    static getAdminBookings(params = {}) {
        const query = new URLSearchParams(params).toString();
        return this.request(`/admin/bookings${query ? '?' + query : ''}`);
    }

    static cancelBooking(id) {
        return this.request(`/admin/bookings/${id}/cancel`, { method: 'PATCH' });
    }

    static getRevenue(params = {}) {
        const query = new URLSearchParams(params).toString();
        return this.request(`/admin/revenue${query ? '?' + query : ''}`);
    }
}

// ─── Toast Notifications ──────────────────────────
class Toast {
    static container = null;

    static init() {
        if (!this.container) {
            this.container = document.createElement('div');
            this.container.className = 'toast-container';
            document.body.appendChild(this.container);
        }
    }

    static show(message, type = 'info') {
        this.init();
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.textContent = message;
        this.container.appendChild(toast);
        setTimeout(() => toast.remove(), 4000);
    }

    static success(msg) { this.show(msg, 'success'); }
    static error(msg) { this.show(msg, 'error'); }
    static info(msg) { this.show(msg, 'info'); }
    static warning(msg) { this.show(msg, 'warning'); }
}

// ─── Navbar Renderer ──────────────────────────────
function renderNavbar(activePage = '') {
    const user = Api.getUser();
    const isLogged = Api.isLoggedIn();
    const isAdmin = Api.isAdmin();

    return `
    <nav class="navbar">
      <div class="container">
        <a href="/" class="navbar-brand">
          <span class="icon">🎭</span>
          <span>CineVerse</span>
        </a>
        <ul class="navbar-nav">
          <li><a href="/" class="${activePage === 'home' ? 'active' : ''}">Home</a></li>
          <li><a href="/movies.html" class="${activePage === 'movies' ? 'active' : ''}">Movies</a></li>
          <li><a href="/shows.html" class="${activePage === 'shows' ? 'active' : ''}">Shows</a></li>
          ${isLogged ? `<li><a href="/dashboard.html" class="${activePage === 'dashboard' ? 'active' : ''}">My Bookings</a></li>` : ''}
          ${isAdmin ? `<li><a href="/admin.html" class="${activePage === 'admin' ? 'active' : ''}">Admin</a></li>` : ''}
        </ul>
        <div class="navbar-auth">
          ${isLogged ? `
            <div class="navbar-user">
              <div class="avatar">${(user?.name || 'U')[0].toUpperCase()}</div>
              <span>${user?.name || 'User'}</span>
            </div>
            <button class="btn btn-ghost btn-sm" onclick="Api.logout()">Logout</button>
          ` : `
            <button class="btn btn-ghost btn-sm" onclick="showAuthModal('login')">Login</button>
            <button class="btn btn-primary btn-sm" onclick="showAuthModal('register')">Sign Up</button>
          `}
        </div>
      </div>
    </nav>
  `;
}

// ─── Auth Modal ───────────────────────────────────
function showAuthModal(mode = 'login') {
    const existing = document.getElementById('auth-modal');
    if (existing) existing.remove();

    const overlay = document.createElement('div');
    overlay.id = 'auth-modal';
    overlay.className = 'modal-overlay active';
    overlay.innerHTML = `
    <div class="modal" style="position:relative;">
      <button class="modal-close" onclick="document.getElementById('auth-modal').remove()">&times;</button>
      <h2 class="modal-title" id="auth-modal-title">${mode === 'login' ? 'Welcome Back' : 'Create Account'}</h2>
      <div id="auth-modal-body">
        ${mode === 'login' ? `
          <div class="form-group">
            <label class="form-label">Email</label>
            <input type="email" class="form-input" id="auth-email" placeholder="you@example.com">
          </div>
          <div class="form-group">
            <label class="form-label">Password</label>
            <input type="password" class="form-input" id="auth-password" placeholder="Enter password">
          </div>
          <button class="btn btn-primary btn-lg" style="width:100%" onclick="handleLogin()">Login</button>
          <p class="text-center mt-2" style="font-size:0.85rem;color:var(--text-muted)">
            Don't have an account? <a href="#" onclick="showAuthModal('register');return false">Sign up</a>
          </p>
        ` : `
          <div class="form-group">
            <label class="form-label">Full Name</label>
            <input type="text" class="form-input" id="auth-name" placeholder="John Doe">
          </div>
          <div class="form-group">
            <label class="form-label">Email</label>
            <input type="email" class="form-input" id="auth-email" placeholder="you@example.com">
          </div>
          <div class="form-group">
            <label class="form-label">Phone (optional)</label>
            <input type="text" class="form-input" id="auth-phone" placeholder="1234567890">
          </div>
          <div class="form-group">
            <label class="form-label">Password</label>
            <input type="password" class="form-input" id="auth-password" placeholder="Min 8 chars, 1 upper, 1 digit, 1 special">
          </div>
          <button class="btn btn-primary btn-lg" style="width:100%" onclick="handleRegister()">Create Account</button>
          <p class="text-center mt-2" style="font-size:0.85rem;color:var(--text-muted)">
            Already have an account? <a href="#" onclick="showAuthModal('login');return false">Login</a>
          </p>
        `}
      </div>
    </div>
  `;
    document.body.appendChild(overlay);
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) overlay.remove();
    });
}

async function handleLogin() {
    const email = document.getElementById('auth-email').value;
    const password = document.getElementById('auth-password').value;
    try {
        const res = await Api.login({ email, password });
        Api.setToken(res.data.token);
        Api.setUser(res.data.user);
        Toast.success('Welcome back!');
        document.getElementById('auth-modal')?.remove();
        setTimeout(() => location.reload(), 500);
    } catch (err) {
        Toast.error(err.message);
    }
}

async function handleRegister() {
    const name = document.getElementById('auth-name').value;
    const email = document.getElementById('auth-email').value;
    const phone = document.getElementById('auth-phone')?.value || undefined;
    const password = document.getElementById('auth-password').value;
    try {
        const res = await Api.register({ name, email, phone, password });
        Api.setToken(res.data.token);
        Api.setUser(res.data.user);
        Toast.success('Account created!');
        document.getElementById('auth-modal')?.remove();
        setTimeout(() => location.reload(), 500);
    } catch (err) {
        Toast.error(err.message || 'Registration failed');
    }
}

// ─── Pagination Helper ────────────────────────────
function renderPagination(pagination, onPageChange) {
    if (!pagination || pagination.total_pages <= 1) return '';
    let html = '<div class="pagination">';
    html += `<button ${pagination.page <= 1 ? 'disabled' : ''} onclick="${onPageChange}(${pagination.page - 1})">← Prev</button>`;
    for (let i = 1; i <= pagination.total_pages; i++) {
        if (pagination.total_pages > 7 && Math.abs(i - pagination.page) > 2 && i !== 1 && i !== pagination.total_pages) {
            if (i === pagination.page - 3 || i === pagination.page + 3) html += '<button disabled>...</button>';
            continue;
        }
        html += `<button class="${i === pagination.page ? 'active' : ''}" onclick="${onPageChange}(${i})">${i}</button>`;
    }
    html += `<button ${pagination.page >= pagination.total_pages ? 'disabled' : ''} onclick="${onPageChange}(${pagination.page + 1})">Next →</button>`;
    html += '</div>';
    return html;
}

// ─── Particles ────────────────────────────────────
function initParticles() {
    const container = document.querySelector('.particles');
    if (!container) return;
    for (let i = 0; i < 20; i++) {
        const p = document.createElement('div');
        p.className = 'particle';
        p.style.left = `${Math.random() * 100}%`;
        p.style.setProperty('--duration', `${10 + Math.random() * 20}s`);
        p.style.setProperty('--delay', `${Math.random() * 10}s`);
        p.style.setProperty('--drift', `${-30 + Math.random() * 60}px`);
        p.style.width = p.style.height = `${2 + Math.random() * 3}px`;
        container.appendChild(p);
    }
}

// ─── Format Helpers ───────────────────────────────
function formatDate(dateStr) {
    return new Date(dateStr).toLocaleDateString('en-IN', {
        weekday: 'short', year: 'numeric', month: 'short', day: 'numeric'
    });
}

function formatTime(dateStr) {
    return new Date(dateStr).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
}

function formatCurrency(amount) {
    return `₹${parseFloat(amount).toLocaleString('en-IN')}`;
}

// ─── Footer ───────────────────────────────────────
function renderFooter() {
    return `
    <footer class="footer">
      <div class="container">
        <p>🎭 CineVerse Theatre Management System &copy; ${new Date().getFullYear()}</p>
        <p class="mt-1">Built with ❤️ by Akshat Kaushik</p>
      </div>
    </footer>
  `;
}
