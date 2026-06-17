// nav.js - 通用导航栏渲染 + 移动端汉堡菜单

/* ======== 移动端汉堡菜单 ======== */
(function initMobileNav() {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', setupMobileNav);
    } else {
        setupMobileNav();
    }
})();

function setupMobileNav() {
    const navContainer = document.querySelector('.nav-container');
    const navLinks = document.querySelector('.nav-links');
    if (!navContainer || !navLinks) return;

    // 已存在则不重复创建
    if (document.querySelector('.nav-toggle')) return;

    // 创建汉堡按钮
    const toggleBtn = document.createElement('button');
    toggleBtn.className = 'nav-toggle';
    toggleBtn.setAttribute('aria-label', '菜单');
    toggleBtn.innerHTML = '<span></span><span></span><span></span>';

    // 创建遮罩层
    const overlay = document.createElement('div');
    overlay.className = 'nav-mobile-overlay';
    overlay.setAttribute('aria-hidden', 'true');

    // 插入 DOM
    navContainer.appendChild(toggleBtn);
    document.body.appendChild(overlay);

    // 给 dropdown 添加箭头（移动端用）
    document.querySelectorAll('.dropdown > a').forEach(a => {
        if (!a.querySelector('.arrow')) {
            a.insertAdjacentHTML('beforeend', '<span class="arrow">▼</span>');
        }
    });

    function openMenu() {
        toggleBtn.classList.add('open');
        navLinks.classList.add('open');
        overlay.classList.add('open');
        overlay.setAttribute('aria-hidden', 'false');
        document.body.style.overflow = 'hidden';
    }

    function closeMenu() {
        toggleBtn.classList.remove('open');
        navLinks.classList.remove('open');
        overlay.classList.remove('open');
        overlay.setAttribute('aria-hidden', 'true');
        document.body.style.overflow = '';
        // 关闭所有展开的dropdown
        document.querySelectorAll('.dropdown.open').forEach(d => d.classList.remove('open'));
    }

    toggleBtn.addEventListener('click', () => {
        if (toggleBtn.classList.contains('open')) {
            closeMenu();
        } else {
            openMenu();
        }
    });

    overlay.addEventListener('click', closeMenu);

    // 点击导航链接后关闭菜单
    navLinks.addEventListener('click', (e) => {
        const link = e.target.closest('a');
        if (link && link.getAttribute('href') && !link.getAttribute('href').startsWith('#')) {
            // 如果是dropdown父链接，切换展开状态
            const parentLi = link.parentElement;
            if (parentLi && parentLi.classList.contains('dropdown')) {
                e.preventDefault();
                parentLi.classList.toggle('open');
                return;
            }
            // 普通链接点击后关闭
            closeMenu();
        }
    });

    // ESC 关闭
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && toggleBtn.classList.contains('open')) {
            closeMenu();
        }
    });
}

/* ======== 导航栏渲染 ======== */
function renderNav(site) {
    const nav = document.getElementById('nav-links');
    if (!nav) return;
    
    const navItems = (site.nav || [
        { file: 'index.html', label: '首页' },
        { file: 'about.html', label: '关于我们' },
        { file: 'products.html', label: '产品中心' },
        { file: 'news.html', label: '新闻动态' },
        { file: 'contact.html', label: '联系方式' }
    ]);
    
    const current = window.location.pathname.split('/').pop() || 'index.html';
    let html = '';
    
    navItems.forEach(item => {
        const isActive = item.file === current;
        const hasChildren = item.children && item.children.length > 0;
        
        if (hasChildren) {
            // 下拉菜单
            const isChildActive = item.children.some(c => c.file === current);
            html += '<li class="dropdown ' + (isChildActive ? 'active' : '') + '">';
            html += '  <a href="' + (item.file || '#') + '" class="' + (isChildActive ? 'active-link' : '') + '">' + item.label + ' ▾<span class="arrow">▼</span></a>';
            html += '  <ul class="dropdown-menu">';
            item.children.forEach(child => {
                const isChild = child.file === current;
                html += '    <li><a href="' + child.file + '" class="' + (isChild ? 'active-link' : '') + '">' + child.label + '</a></li>';
            });
            html += '  </ul>';
            html += '</li>';
        } else {
            // 普通链接
            html += '<li><a href="' + item.file + '"' + (isActive ? ' style="color:var(--gold);"' : '') + '>' + item.label + '</a></li>';
        }
    });
    
    // 购物车图标
    html += '<li><a href="cart.html" class="cart-link"><span class="cart-icon">🛒</span><span class="cart-badge" id="cart-badge">0</span></a></li>';
    
    nav.innerHTML = html;

    // 直接绑定下拉菜单点击事件（桌面端+移动端均可靠触发）
    // 使用 stopPropagation 防止事件冒泡到 navLinks 的委托处理器造成二次 toggle
    nav.querySelectorAll('.dropdown > a').forEach(function(a) {
        a.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            var parentLi = this.parentElement;
            if (parentLi) {
                parentLi.classList.toggle('open');
            }
        });
    });

    // 更新购物车角标
    if (typeof updateCartBadge === 'function') {
        updateCartBadge();
    }

    // 重新初始化移动端汉堡菜单（因为 nav-links 内容被替换了）
    setupMobileNav();
}
