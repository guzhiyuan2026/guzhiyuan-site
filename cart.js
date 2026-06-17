/**
 * 购物车功能模块
 * 使用 localStorage 存储购物车数据
 * 包含：购物车操作、模态弹窗系统、手机号校验、订单历史
 */

const CART_KEY = 'guzhiyuan_cart';
const ORDER_HISTORY_KEY = 'guzhiyuan_orders';

// ==================== 购物车核心操作 ====================

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
        cart[existingIndex].quantity += 1;
    } else {
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

// ==================== 手机号校验 ====================

/**
 * 校验中国大陆手机号格式
 * @param {string} phone - 手机号码
 * @returns {{ valid: boolean, message: string }}
 */
function validatePhone(phone) {
    if (!phone || !phone.trim()) {
        return { valid: false, message: '请输入联系电话' };
    }
    var cleaned = phone.replace(/\s|-/g, '');
    // 中国大陆手机号：1开头，第二位3-9，共11位
    if (/^1[3-9]\d{9}$/.test(cleaned)) {
        return { valid: true, message: '' };
    }
    // 固定电话（含区号）：0开头，区号3-4位，号码7-8位
    if (/^0\d{2,3}-?\d{7,8}$/.test(cleaned)) {
        return { valid: true, message: '' };
    }
    return { valid: false, message: '请输入正确的手机号码或固定电话' };
}

// ==================== 订单历史管理 ====================

/**
 * 获取所有订单历史
 * @returns {Array}
 */
function getOrderHistory() {
    try {
        return JSON.parse(localStorage.getItem(ORDER_HISTORY_KEY) || '[]');
    } catch (e) {
        return [];
    }
}

/**
 * 保存订单到历史记录
 * @param {Object} orderInfo - 订单信息
 * @returns {Object} 保存的订单（含自动生成的id和状态）
 */
function saveOrder(orderInfo) {
    var orders = getOrderHistory();
    var order = {
        id: 'GZ' + Date.now().toString(36).toUpperCase(),
        items: orderInfo.items,
        total: orderInfo.total,
        customerName: orderInfo.customerName,
        customerPhone: orderInfo.customerPhone,
        customerAddress: orderInfo.customerAddress || '',
        customerRemark: orderInfo.customerRemark || '',
        status: 'pending', // pending / confirmed / shipped / completed / cancelled
        orderTime: new Date().toISOString(),
        orderTimeDisplay: new Date().toLocaleString('zh-CN', {
            year: 'numeric', month: '2-digit', day: '2-digit',
            hour: '2-digit', minute: '2-digit', second: '2-digit'
        })
    };
    orders.unshift(order);
    localStorage.setItem(ORDER_HISTORY_KEY, JSON.stringify(orders));
    return order;
}

// ==================== 模态弹窗系统 ====================

/**
 * 创建并显示一个美观的模态弹窗
 * @param {Object} options
 * @param {string} options.icon - 弹窗图标（emoji 或 HTML）
 * @param {string} options.title - 弹窗标题
 * @param {string} options.message - 弹窗内容（支持 HTML）
 * @param {Array}  options.buttons - 按钮数组 [{ text, type, onClick }]
 * @param {boolean} options.closable - 是否显示关闭按钮（默认 true）
 * @param {Function} options.onClose - 关闭时的回调
 */
function showModal(options) {
    // 移除已存在的弹窗
    var existing = document.querySelector('.g-modal-overlay');
    if (existing) existing.remove();

    var overlay = document.createElement('div');
    overlay.className = 'g-modal-overlay';

    var buttonsHtml = (options.buttons || []).map(function (btn, i) {
        var cls = btn.type === 'primary' ? 'g-modal-btn-primary' :
                  btn.type === 'danger' ? 'g-modal-btn-danger' : 'g-modal-btn-default';
        return '<button class="g-modal-btn ' + cls + '" data-btn-index="' + i + '">' + (btn.text || '') + '</button>';
    }).join('');

    overlay.innerHTML =
        '<div class="g-modal">' +
        (options.closable !== false ? '<button class="g-modal-close" aria-label="关闭">&times;</button>' : '') +
        (options.icon ? '<div class="g-modal-icon">' + options.icon + '</div>' : '') +
        (options.title ? '<h3 class="g-modal-title">' + options.title + '</h3>' : '') +
        '<div class="g-modal-body">' + (options.message || '') + '</div>' +
        (buttonsHtml ? '<div class="g-modal-actions">' + buttonsHtml + '</div>' : '') +
        '</div>';

    document.body.appendChild(overlay);

    // 显示动画
    requestAnimationFrame(function () {
        overlay.classList.add('show');
    });

    // 关闭函数
    function closeModal() {
        overlay.classList.remove('show');
        setTimeout(function () {
            if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
            if (options.onClose) options.onClose();
        }, 300);
    }

    // 关闭按钮事件
    var closeBtn = overlay.querySelector('.g-modal-close');
    if (closeBtn) {
        closeBtn.addEventListener('click', closeModal);
    }

    // 点击遮罩关闭
    overlay.addEventListener('click', function (e) {
        if (e.target === overlay) closeModal();
    });

    // 按钮事件
    var btns = overlay.querySelectorAll('.g-modal-btn');
    btns.forEach(function (btn) {
        btn.addEventListener('click', function () {
            var idx = parseInt(btn.getAttribute('data-btn-index'));
            if (options.buttons && options.buttons[idx] && options.buttons[idx].onClick) {
                var result = options.buttons[idx].onClick(closeModal);
                // 如果回调返回 true，保持弹窗打开（用于校验失败等场景）
                if (result === true) return;
            }
            // 默认关闭
            closeModal();
        });
    });

    // ESC 关闭
    function onKeyDown(e) {
        if (e.key === 'Escape') {
            closeModal();
            document.removeEventListener('keydown', onKeyDown);
        }
    }
    document.addEventListener('keydown', onKeyDown);

    return { close: closeModal };
}

/**
 * 显示确认弹窗
 * @param {string} title - 标题
 * @param {string} message - 确认消息
 * @param {Function} onConfirm - 确认回调
 * @param {Function} onCancel - 取消回调（可选）
 */
function showConfirm(title, message, onConfirm, onCancel) {
    return showModal({
        icon: '⚠️',
        title: title,
        message: message,
        buttons: [
            {
                text: '取消',
                type: 'default',
                onClick: function (close) { if (onCancel) onCancel(); }
            },
            {
                text: '确认',
                type: 'danger',
                onClick: function (close) {
                    if (onConfirm) {
                        var keepOpen = onConfirm();
                        if (keepOpen === true) return true;
                    }
                }
            }
        ]
    });
}

/**
 * 显示成功弹窗（带对勾动画）
 * @param {string} title - 标题
 * @param {string} message - 消息内容（支持 HTML）
 * @param {Function} onClose - 关闭回调（可选）
 */
function showSuccessModal(title, message, onClose) {
    return showModal({
        icon: '<svg class="g-success-check" viewBox="0 0 52 52"><circle class="g-success-circle" cx="26" cy="26" r="25" fill="none"/><path class="g-success-path" fill="none" d="M14 27l7 7 16-16"/></svg>',
        title: title,
        message: message,
        closable: true,
        onClose: onClose,
        buttons: [
            { text: '确定', type: 'primary', onClick: null }
        ]
    });
}

// ==================== Toast 与通知 ====================

// 显示添加成功提示
function showAddToCartToast(productName) {
    var toast = document.createElement('div');
    toast.className = 'cart-toast';
    toast.innerHTML =
        '<div class="cart-toast-content">' +
        '<span class="cart-toast-icon">✅</span>' +
        '<span class="cart-toast-text">"' + productName + '" 已加入购物车</span>' +
        '</div>' +
        '<a href="cart.html" class="cart-toast-link">去结算</a>';

    document.body.appendChild(toast);

    setTimeout(function () {
        toast.classList.add('show');
    }, 10);

    setTimeout(function () {
        toast.classList.remove('show');
        setTimeout(function () {
            if (toast.parentNode) toast.parentNode.removeChild(toast);
        }, 300);
    }, 3000);
}

// 显示通知消息
function showNotification(message, type) {
    type = type || 'success';
    var notification = document.createElement('div');
    notification.className = 'notification notification-' + type;
    notification.textContent = message;

    document.body.appendChild(notification);

    setTimeout(function () {
        notification.classList.add('show');
    }, 10);

    setTimeout(function () {
        notification.classList.remove('show');
        setTimeout(function () {
            if (notification.parentNode) notification.parentNode.removeChild(notification);
        }, 300);
    }, 2500);
}

// ==================== 初始化 ====================

// 页面加载时更新角标
document.addEventListener('DOMContentLoaded', function () {
    updateCartBadge();
});
