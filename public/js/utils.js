const API_BASE = window.location.protocol === 'file:'
    ? 'http://localhost:3001/api'
    : '/api';
window.API_BASE = API_BASE;

function showToast(message, type = 'success') {
    let container = document.getElementById('toast-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toast-container';
        Object.assign(container.style, {
            position: 'fixed', bottom: '20px', right: '20px', zIndex: '9999',
            display: 'flex', flexDirection: 'column', gap: '10px'
        });
        document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    const colors = {
        success: '#00cc66',
        error: '#ff3333',
        info: '#3399ff'
    };

    Object.assign(toast.style, {
        background: 'rgba(20, 20, 30, 0.95)',
        color: 'white',
        padding: '12px 24px',
        borderRadius: '8px',
        borderLeft: `4px solid ${colors[type] || colors.info}`,
        boxShadow: '0 5px 15px rgba(0,0,0,0.3)',
        fontFamily: "'Kanit', sans-serif",
        fontSize: '14px',
        minWidth: '250px',
        transform: 'translateX(120%)',
        transition: 'transform 0.3s ease-out',
        display: 'flex',
        alignItems: 'center',
        gap: '10px'
    });

    toast.innerHTML = `
        <i class="fa-solid fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'circle-exclamation' : 'circle-info'}" style="color:${colors[type]}"></i>
        <span>${message}</span>
    `;

    container.appendChild(toast);

    requestAnimationFrame(() => {
        toast.style.transform = 'translateX(0)';
    });

    setTimeout(() => {
        toast.style.transform = 'translateX(120%)';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

function showLoading() {
    let loader = document.getElementById('global-loader');
    if (!loader) {
        loader = document.createElement('div');
        loader.id = 'global-loader';
        Object.assign(loader.style, {
            position: 'fixed', top: '0', left: '0', width: '100%', height: '100%',
            background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(5px)',
            zIndex: '10000', display: 'flex', justifyContent: 'center', alignItems: 'center',
            opacity: '0', transition: 'opacity 0.3s'
        });
        loader.innerHTML = '<div class="spinner"></div>';

        const style = document.createElement('style');
        style.innerHTML = `
            .spinner { width: 50px; height: 50px; border: 5px solid rgba(255,255,255,0.1); 
            border-top: 5px solid #ff0055; border-radius: 50%; animation: spin 1s linear infinite; }
            @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        `;
        document.head.appendChild(style);
        document.body.appendChild(loader);
    }
    loader.style.display = 'flex';
    requestAnimationFrame(() => loader.style.opacity = '1');
}

function hideLoading() {
    const loader = document.getElementById('global-loader');
    if (loader) {
        loader.style.opacity = '0';
        setTimeout(() => loader.style.display = 'none', 300);
    }
}

async function fetchCategories() {
    try {
        const response = await fetch(`${API_BASE}/categories`);
        if (!response.ok) throw new Error('Failed to fetch categories');
        return await response.json();
    } catch (error) {
        console.error('Error fetching categories:', error);
        return [];
    }
}

async function fetchProducts(categoryId = null) {
    try {
        let url = `${API_BASE}/products`;
        if (categoryId) {
            url += `?category_id=${categoryId}`;
        }
        const response = await fetch(url);
        if (!response.ok) throw new Error('Failed to fetch products');
        return await response.json();
    } catch (error) {
        console.error('Error fetching products:', error);
        return [];
    }
}

async function fetchProductDetails(id) {
    try {
        const response = await fetch(`${API_BASE}/products/${id}`);
        if (!response.ok) throw new Error('Failed to fetch product details');
        return await response.json();
    } catch (error) {
        console.error('Error fetching product details:', error);
        return null;
    }
}

function getQueryParam(param) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(param);
}

function formatCurrency(amount) {
    return `฿${parseFloat(amount).toFixed(2)}`;
}

async function fetchSettings() {
    try {
        const response = await fetch(`${API_BASE}/settings`);
        if (!response.ok) throw new Error('Failed to fetch settings');
        return await response.json();
    } catch (error) {
        console.error('Error fetching settings:', error);
        return null;
    }
}

async function applySettings() {
    const settings = await fetchSettings();
    if (!settings) return;

    if (settings.site_title) {
        document.title = settings.site_title;
        const logoText = document.querySelector('.logo-text');
        if (logoText) logoText.innerText = settings.site_title;
    }

    if (settings.logo_url) {
        const logoImgs = document.querySelectorAll('.logo-img');
        logoImgs.forEach(img => img.src = settings.logo_url);
    }

    if (settings.discord_link) {
        const discordLinks = document.querySelectorAll('a[href*="discord.gg"]');
        discordLinks.forEach(link => link.href = settings.discord_link);
    }

    const footerText = document.querySelector('.footer-text');
    if (footerText && settings.footer_text) {
        footerText.innerText = settings.footer_text;
    }
}
