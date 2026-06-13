// nav.js - 通用导航栏渲染
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
            html += `<li class="dropdown ${isChildActive ? 'active' : ''}">`;
            html += `  <a href="${item.file || '#'}" class="${isChildActive ? 'active-link' : ''}">${item.label} ▾</a>`;
            html += `  <ul class="dropdown-menu">`;
            item.children.forEach(child => {
                const isChild = child.file === current;
                html += `    <li><a href="${child.file}" class="${isChild ? 'active-link' : ''}">${child.label}</a></li>`;
            });
            html += `  </ul>`;
            html += `</li>`;
        } else {
            // 普通链接
            html += `<li><a href="${item.file}" ${isActive ? 'style="color:var(--gold);"' : ''}>${item.label}</a></li>`;
        }
    });
    
    // 购物车图标
    html += `
        <li>
            <a href="cart.html" class="cart-link">
                <span class="cart-icon">🛒</span>
                <span class="cart-badge" id="cart-badge">0</span>
            </a>
        </li>`;
    
    nav.innerHTML = html;
    
    // 更新购物车角标
    if (typeof updateCartBadge === 'function') {
        updateCartBadge();
    }
}
