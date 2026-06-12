/**
 * 购物车功能模块
 * 使用 localStorage 存储购物车数据
 */

const CART_KEY = 'guzhiyuan_cart';

// 获取购物车数据
function getCart() {
    const cart = localStorage.getItem(CART_KEY);
    return cart ? JSON.parse(cart) : [];
}

// 保存购物车数据
function saveCart(cart) {
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
}

// 添加到购物车
function addToCart(product) {
    const cart = getCart();
    const existingIndex = cart.findIndex(item => item.id === product.id);

    if (existingIndex > -1) {
        // 已存在，增加数量
        cart[existingIndex].quantity += 1;
    } else {
        // 不存在，添加新商品
        cart.push({
            id: product.id,
            name: product.name,
            icon: product.icon,
            price: product.price,
            unit: product.unit || '件',
            spec: product.spec || '',
            quantity: 1
        });
    }

    saveCart(cart);
    updateCartBadge();
    return cart;
}

// 从购物车移除
function removeFromCart(productId) {
    let cart = getCart();
    cart = cart.filter(item => item.id !== productId);
    saveCart(cart);
    updateCartBadge();
    return cart;
}

// 更新商品数量
function updateCartItemQuantity(productId, quantity) {
    const cart = getCart();
    const index = cart.findIndex(item => item.id === productId);

    if (index > -1) {
        if (quantity <= 0) {
            return removeFromCart(productId);
        }
        cart[index].quantity = quantity;
        saveCart(cart);
        updateCartBadge();
    }

    return cart;
}

// 获取购物车商品数量
function getCartCount() {
    const cart = getCart();
    return cart.reduce((total, item) => total + item.quantity, 0);
}

// 获取购物车总价
function getCartTotal() {
    const cart = getCart();
    return cart.reduce((total, item) => {
        // 从价格字符串中提取数字（如 "¥ 68.00" -> 68.00）
        const priceNum = parseFloat(item.price.replace(/[¥¥,，\s]/g, ''));
        return total + priceNum * item.quantity;
    }, 0);
}

// 清空购物车
function clearCart() {
    localStorage.removeItem(CART_KEY);
    updateCartBadge();
}

// 更新购物车角标
function updateCartBadge() {
    const badge = document.getElementById('cart-badge');
    if (badge) {
        const count = getCartCount();
        if (count > 0) {
            badge.textContent = count > 99 ? '99+' : count;
            badge.style.display = 'flex';
        } else {
            badge.style.display = 'none';
        }
    }
}

// 显示添加成功提示
function showAddToCartToast(productName) {
    // 创建 toast 元素
    const toast = document.createElement('div');
    toast.className = 'cart-toast';
    toast.innerHTML = `
        <div class="cart-toast-content">
            <span class="cart-toast-icon">✅</span>
            <span class="cart-toast-text">"${productName}" 已加入购物车</span>
        </div>
        <a href="cart.html" class="cart-toast-link">去结算</a>
    `;

    // 添加到页面
    document.body.appendChild(toast);

    // 显示动画
    setTimeout(() => {
        toast.classList.add('show');
    }, 10);

    // 3秒后自动移除
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, 300);
    }, 3000);
}

// 显示通知消息
function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;

    document.body.appendChild(notification);

    setTimeout(() => {
        notification.classList.add('show');
    }, 10);

    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, 2500);
}

// 页面加载时更新角标
document.addEventListener('DOMContentLoaded', function() {
    updateCartBadge();
});
