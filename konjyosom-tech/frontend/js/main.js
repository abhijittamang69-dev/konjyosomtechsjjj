// Konjyosom Tech Solutions - Main JavaScript
// API Base URL Configuration
const API_BASE_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://localhost:5000/api'
    : '/api';

// ============================================
// TYPING ANIMATION
// ============================================
const typingTexts = [
    'CCTV Installation',
    'CCTV Maintenance', 
    'Access Control Systems',
    'ELV Solutions',
    'Networking Solutions',
    'Fiber Optic Installation',
    'Website Design',
    'Annual Maintenance Contract',
    'Preventive Maintenance',
    '24/7 Technical Support'
];

let typingIndex = 0;
let charIndex = 0;
let isDeleting = false;
const TYPING_SPEED = 100;
const DELETE_SPEED = 50;
const PAUSE_TIME = 2000;

function typeText() {
    const element = document.getElementById('typingText');
    if (!element) return;

    const currentText = typingTexts[typingIndex];

    if (isDeleting) {
        element.textContent = currentText.substring(0, charIndex - 1);
        charIndex--;
    } else {
        element.textContent = currentText.substring(0, charIndex + 1);
        charIndex++;
    }

    let speed = isDeleting ? DELETE_SPEED : TYPING_SPEED;

    if (!isDeleting && charIndex === currentText.length) {
        speed = PAUSE_TIME;
        isDeleting = true;
    } else if (isDeleting && charIndex === 0) {
        isDeleting = false;
        typingIndex = (typingIndex + 1) % typingTexts.length;
        speed = 500;
    }

    setTimeout(typeText, speed);
}

// ============================================
// NAVBAR SCROLL EFFECT
// ============================================
function initNavbar() {
    const navbar = document.querySelector('.navbar');
    if (!navbar) return;

    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    });
}

// ============================================
// ACTIVE NAV LINK HIGHLIGHT
// ============================================
// Marks the nav link matching the current page as active,
// so the indicator follows the page instead of staying on Home.
function setActiveNavLink() {
    const current = (window.location.pathname.split('/').pop() || 'index.html').toLowerCase();
    document.querySelectorAll('.navbar-nav .nav-link').forEach(link => {
        const href = (link.getAttribute('href') || '').split(/[?#]/)[0].split('/').pop().toLowerCase();
        link.classList.toggle('active', href === current);
    });
}

// ============================================
// ALERT SYSTEM
// ============================================
function showAlert(type, message, duration = 5000) {
    // Remove existing alerts
    document.querySelectorAll('.custom-alert').forEach(a => a.remove());

    const alertDiv = document.createElement('div');
    alertDiv.className = `custom-alert alert alert-${type} alert-dismissible fade show position-fixed`;
    alertDiv.style.cssText = 'top: 20px; right: 20px; z-index: 9999; max-width: 400px; box-shadow: 0 5px 20px rgba(0,0,0,0.2);';
    alertDiv.innerHTML = `
        <div class="d-flex align-items-center">
            <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'danger' ? 'exclamation-circle' : 'info-circle'} me-2"></i>
            <div>${message}</div>
        </div>
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    document.body.appendChild(alertDiv);

    if (duration > 0) {
        setTimeout(() => {
            alertDiv.classList.remove('show');
            setTimeout(() => alertDiv.remove(), 300);
        }, duration);
    }

    return alertDiv;
}

// ============================================
// FORM HANDLING
// ============================================
function initForm(formId, endpoint, options = {}) {
    const form = document.getElementById(formId);
    if (!form) return;

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const submitBtn = form.querySelector('button[type="submit"]');
        const originalText = submitBtn.innerHTML;
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Processing...';

        try {
            let body;
            const headers = {};

            if (options.isMultipart) {
                body = new FormData(form);
            } else {
                const formData = new FormData(form);
                body = JSON.stringify(Object.fromEntries(formData.entries()));
                headers['Content-Type'] = 'application/json';
            }

            const response = await fetch(`${API_BASE_URL}${endpoint}`, {
                method: 'POST',
                headers,
                body
            });

            const result = await response.json();

            if (response.ok && result.success) {
                showAlert('success', result.message || 'Submitted successfully!');
                if (!options.noReset) form.reset();
                if (options.onSuccess) options.onSuccess(result);
            } else {
                showAlert('danger', result.message || 'Something went wrong. Please try again.');
                if (options.onError) options.onError(result);
            }
        } catch (error) {
            console.error('Form submission error:', error);
            showAlert('danger', 'Network error. Please check your connection and try again.');
        } finally {
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalText;
        }
    });
}

// ============================================
// AUTHENTICATION SYSTEM
// ============================================
const Auth = {
    getToken() {
        return localStorage.getItem('kt_token');
    },

    setToken(token) {
        localStorage.setItem('kt_token', token);
    },

    removeToken() {
        localStorage.removeItem('kt_token');
        localStorage.removeItem('kt_user');
    },

    getUser() {
        try {
            const user = localStorage.getItem('kt_user');
            return user ? JSON.parse(user) : null;
        } catch {
            return null;
        }
    },

    setUser(user) {
        localStorage.setItem('kt_user', JSON.stringify(user));
    },

    isLoggedIn() {
        return !!this.getToken();
    },

    isAdmin() {
        const user = this.getUser();
        return user && user.role === 'admin';
    },

    isTechnician() {
        const user = this.getUser();
        return user && user.role === 'technician';
    },

    async apiCall(endpoint, options = {}) {
        const headers = {
            'Content-Type': 'application/json',
            ...options.headers
        };

        const token = this.getToken();
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        try {
            const response = await fetch(`${API_BASE_URL}${endpoint}`, {
                ...options,
                headers
            });

            if (response.status === 401) {
                this.removeToken();
                window.location.href = '/login.html';
                return null;
            }

            return response;
        } catch (error) {
            console.error('API call error:', error);
            showAlert('danger', 'Network error. Please check your connection.');
            return null;
        }
    },

    logout() {
        this.removeToken();
        window.location.href = '/login.html';
    },

    // Check access and redirect
    requireAdmin() {
        if (!this.isLoggedIn() || !this.isAdmin()) {
            window.location.href = '/login.html';
            return false;
        }
        return true;
    },

    requireTechnician() {
        if (!this.isLoggedIn() || !this.isTechnician()) {
            window.location.href = '/login.html';
            return false;
        }
        return true;
    },

    requireAuth() {
        if (!this.isLoggedIn()) {
            window.location.href = '/login.html';
            return false;
        }
        return true;
    }
};

// ============================================
// UTILITY FUNCTIONS
// ============================================
const Utils = {
    formatDate(date) {
        if (!date) return 'N/A';
        return new Date(date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    },

    formatDateTime(date) {
        if (!date) return 'N/A';
        return new Date(date).toLocaleString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    },

    formatCurrency(amount) {
        if (!amount) return 'Rs. 0';
        return 'Rs. ' + parseFloat(amount).toLocaleString('en-IN', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
    },

    getStatusBadgeClass(status) {
        const classes = {
            pending: 'bg-warning text-dark',
            confirmed: 'bg-info',
            assigned: 'bg-primary',
            accepted: 'bg-purple',
            'on_site': 'bg-warning',
            'in_progress': 'bg-warning text-dark',
            completed: 'bg-success',
            closed: 'bg-secondary',
            cancelled: 'bg-danger',
            reviewing: 'bg-info',
            quoted: 'bg-primary',
            approved: 'bg-success',
            rejected: 'bg-danger',
            expired: 'bg-secondary'
        };
        return classes[status] || 'bg-secondary';
    },

    getPriorityBadgeClass(priority) {
        const classes = {
            low: 'bg-success',
            medium: 'bg-info',
            high: 'bg-warning text-dark',
            urgent: 'bg-danger'
        };
        return classes[priority] || 'bg-secondary';
    },

    truncateText(text, length = 50) {
        if (!text) return '';
        return text.length > length ? text.substring(0, length) + '...' : text;
    },

    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }
};

// ============================================
// DATA TABLE HELPERS
// ============================================
const DataTable = {
    async load(options) {
        const { url, containerId, renderRow, emptyMessage = 'No data found' } = options;

        try {
            const response = await Auth.apiCall(url);
            if (!response) return;

            const data = await response.json();
            const container = document.getElementById(containerId);

            if (!container) return;

            if (data.success && data[Object.keys(data).find(k => Array.isArray(data[k]))]?.length > 0) {
                const items = data[Object.keys(data).find(k => Array.isArray(data[k]))];
                container.innerHTML = items.map(renderRow).join('');
            } else {
                container.innerHTML = `
                    <tr><td colspan="100%" class="text-center py-5">
                        <i class="fas fa-inbox fa-3x text-muted mb-3 d-block"></i>
                        ${emptyMessage}
                    </td></tr>
                `;
            }
        } catch (error) {
            console.error('DataTable load error:', error);
        }
    }
};

// ============================================
// MOBILE MENU TOGGLE
// ============================================
function initMobileMenu() {
    const toggleBtn = document.getElementById('mobileMenuToggle');
    const sidebar = document.querySelector('.dashboard-sidebar');

    if (toggleBtn && sidebar) {
        toggleBtn.addEventListener('click', () => {
            sidebar.classList.toggle('show');
        });
    }
}

// ============================================
// INITIALIZATION
// ============================================
document.addEventListener('DOMContentLoaded', () => {
    // Start typing animation
    typeText();

    // Navbar scroll effect
    initNavbar();

    // Highlight current page in navbar
    setActiveNavLink();

    // Mobile menu
    initMobileMenu();

    // Initialize public forms
    initForm('bookingForm', '/bookings', {
        onSuccess: (result) => {
            if (result.booking?.bookingId) {
                showAlert('success', `Booking confirmed! ID: ${result.booking.bookingId}`, 8000);
            }
        }
    });

    initForm('quotationForm', '/quotations', {
        onSuccess: (result) => {
            if (result.quotation?.quotationId) {
                showAlert('success', `Quotation request received! ID: ${result.quotation.quotationId}`, 8000);
            }
        }
    });

    initForm('contactForm', '/website/contact', {
        onSuccess: () => showAlert('success', 'Message sent successfully! We will get back to you soon.', 8000)
    });
});

// Expose globally
window.API_BASE_URL = API_BASE_URL;
window.Auth = Auth;
window.Utils = Utils;
window.DataTable = DataTable;
window.showAlert = showAlert;
