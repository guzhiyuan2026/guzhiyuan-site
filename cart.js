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

// ==================== 订单状态更新 ====================

/**
 * 更新指定订单的状态
 * @param {string} orderId - 订单ID
 * @param {string} status - 新状态 (pending/paid/confirmed/shipped/completed/cancelled)
 * @returns {Object|null} 更新后的订单
 */
function updateOrderStatus(orderId, status) {
    var orders = getOrderHistory();
    var index = orders.findIndex(function(o) { return o.id === orderId; });
    if (index > -1) {
        orders[index].status = status;
        orders[index].payTime = new Date().toISOString();
        orders[index].payTimeDisplay = new Date().toLocaleString('zh-CN', {
            year: 'numeric', month: '2-digit', day: '2-digit',
            hour: '2-digit', minute: '2-digit', second: '2-digit'
        });
        localStorage.setItem(ORDER_HISTORY_KEY, JSON.stringify(orders));
        return orders[index];
    }
    return null;
}

// ==================== 支付二维码生成 ====================

/**
 * 生成模拟的支付二维码 SVG（微信/支付宝风格）
 * @param {string} method - 支付方式: 'wechat' | 'alipay'
 * @returns {string} SVG HTML
 */
function generatePaymentQR(method) {
    var colors = method === 'wechat'
        ? { bg: '#09BB07', dots: '#fff' }
        : { bg: '#1677FF', dots: '#fff' };

    // 生成伪随机二维码图案（12x12 的小格子扩展为 13x13 的定位图案）
    var size = 15, cellSize = 11, matrix = [];
    for (var i = 0; i < size; i++) {
        matrix[i] = [];
        for (var j = 0; j < size; j++) {
            // 定位图案（三个角落的 3x3）
            var isFinder = (i < 4 && j < 4) || (i < 4 && j > size - 5) || (i > size - 5 && j < 4);
            if (isFinder) {
                var inner = (i > 0 && i < 3 && j > 0 && j < 3) || (i > 0 && i < 3 && j > size - 4 && j < size - 1) || (i > size - 4 && i < size - 1 && j > 0 && j < 3);
                matrix[i][j] = inner ? 0 : 1;
            } else {
                // 随机填充（用订单信息种子模拟）
                var seed = (i * 37 + j * 73 + (method === 'wechat' ? 13 : 71)) % 100;
                matrix[i][j] = seed < 45 ? 1 : 0;
            }
        }
    }

    var svgWidth = size * cellSize + 20;
    var cells = '';
    for (var r = 0; r < size; r++) {
        for (var c = 0; c < size; c++) {
            if (matrix[r][c]) {
                cells += '<rect x="' + (c * cellSize + 10) + '" y="' + (r * cellSize + 10) + '" width="' + cellSize + '" height="' + cellSize + '" rx="1"/>';
            }
        }
    }

    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + svgWidth + ' ' + svgWidth + '" width="180" height="180">' +
        '<rect width="' + svgWidth + '" height="' + svgWidth + '" rx="6" fill="#fff"/>' +
        cells +
        '<rect x="' + (Math.floor(size/2) * cellSize + 10 - cellSize/2 + 1) + '" y="' + (Math.floor(size/2) * cellSize + 10 - cellSize/2 + 1) + '" width="' + (cellSize - 2) + '" height="' + (cellSize - 2) + '" rx="2" fill="' + colors.bg + '"/>' +
        '</svg>';
}

// ==================== 支付弹窗 ====================

/**
 * 显示支付选择弹窗
 * @param {Object} order - 订单信息
 * @param {Array} cart - 购物车商品
 * @param {number} total - 总金额
 * @param {string} name - 客户姓名
 * @param {string} phone - 客户电话
 */
function showPaymentModal(order, cart, total, name, phone) {
    var itemsSummary = cart.map(function(item) {
        return '<div style="display:flex;justify-content:space-between;padding:2px 0;font-size:0.85rem;">' +
            '<span>' + item.name + ' × ' + item.quantity + '</span>' +
            '<span style="color:var(--earth-brown);">¥ ' + (parseFloat(item.price.replace(/[¥¥,，\s]/g,'')) * item.quantity).toFixed(2) + '</span>' +
            '</div>';
    }).join('');

    // 构建支付弹窗HTML
    var paymentHtml =
        '<div style="text-align:left;background:#fafaf7;border-radius:10px;padding:1rem;margin-bottom:1rem;">' +
        '<div style="font-weight:bold;color:var(--primary-green);margin-bottom:0.5rem;display:flex;align-items:center;gap:0.4rem;">' +
        '<span>📋</span> 订单确认</div>' +
        '<div style="font-size:0.85rem;color:var(--text-light);line-height:1.8;">' +
        '<div>订单编号：<span style="font-family:monospace;color:var(--primary-green);font-weight:bold;">' + order.id + '</span></div>' +
        '<div>下单时间：' + order.orderTimeDisplay + '</div>' +
        '<div style="margin-top:0.4rem;padding-top:0.4rem;border-top:1px dashed #ddd;">' + itemsSummary + '</div>' +
        '<div style="margin-top:0.5rem;text-align:right;font-size:1.1rem;font-weight:bold;color:var(--earth-brown);">应付金额：¥ ' + total.toFixed(2) + '</div>' +
        '</div></div>' +

        // 支付方式选择
        '<div style="text-align:left;margin-bottom:0.5rem;font-weight:600;font-size:0.9rem;color:var(--text-dark);">选择支付方式：</div>' +
        '<div class="payment-methods" id="payment-methods" style="margin-bottom:1rem;">' +
        '<div class="payment-method-option selected" data-method="wechat" onclick="selectPaymentMethod(\'wechat\')">' +
        '<span class="pm-icon">💚</span>微信支付</div>' +
        '<div class="payment-method-option" data-method="alipay" onclick="selectPaymentMethod(\'alipay\')">' +
        '<span class="pm-icon">💙</span>支付宝</div>' +
        '<div class="payment-method-option" data-method="bank" onclick="selectPaymentMethod(\'bank\')">' +
        '<span class="pm-icon">🏦</span>银行转账</div>' +
        '</div>' +

        // 支付内容区
        '<div id="payment-content-area" style="min-height:180px;display:flex;flex-direction:column;align-items:center;justify-content:center;"></div>';

    var modal = showModal({
        icon: '💳',
        title: '确认支付',
        message: paymentHtml,
        closable: true,
        buttons: [
            { text: '暂不支付', type: 'default', onClick: function(close) {
                window.location.href = 'order-history.html';
            }},
            { text: '已完成支付 ✓', type: 'primary', onClick: function(close) {
                return processPaymentCompletion(order, total, close);
            }}
        ],
        onClose: function() {
            // 关闭时也保留订单（不取消）
        }
    });

    // 初始化支付内容（默认微信支付）
    setTimeout(function() {
        showPaymentContent('wechat', total);
    }, 150);

    // 存储订单引用到window
    window._currentPaymentOrder = order;
    window._currentPaymentTotal = total;
    window._currentPaymentModal = modal;

    // 支付弹窗使用宽屏样式
    var overlay = document.querySelector('.g-modal-overlay');
    if (overlay) overlay.classList.add('payment-wide');
}

/**
 * 选择支付方式
 */
function selectPaymentMethod(method) {
    // 更新选中状态
    var options = document.querySelectorAll('.payment-method-option');
    options.forEach(function(opt) {
        if (opt.getAttribute('data-method') === method) {
            opt.classList.add('selected');
        } else {
            opt.classList.remove('selected');
        }
    });

    showPaymentContent(method, window._currentPaymentTotal || 0);
}

/**
 * 显示支付内容（QR码或转账信息）
 */
function showPaymentContent(method, total) {
    var area = document.getElementById('payment-content-area');
    if (!area) return;

    if (method === 'wechat') {
        area.innerHTML =
            '<div style="text-align:center;padding:1rem;">' +
            '<div style="background:#fff;display:inline-block;padding:1rem;border-radius:12px;box-shadow:0 2px 12px rgba(0,0,0,0.08);margin-bottom:0.75rem;">' +
            generatePaymentQR('wechat') +
            '</div>' +
            '<div style="display:flex;align-items:center;justify-content:center;gap:0.4rem;margin-bottom:0.5rem;color:#09BB07;font-weight:600;font-size:0.9rem;">' +
            '<span>💚</span> 微信扫码支付</div>' +
            '<div style="font-size:0.8rem;color:var(--text-light);">请使用微信扫描二维码完成支付</div>' +
            '<div style="margin-top:0.5rem;font-size:0.85rem;color:var(--earth-brown);font-weight:bold;">¥ ' + total.toFixed(2) + '</div>' +
            '<div style="margin-top:0.75rem;background:#fff8e1;border-radius:6px;padding:0.5rem 0.75rem;font-size:0.75rem;color:#8d6e00;text-align:left;">' +
            '💡 <strong>电脑端提示：</strong>请用手机微信扫描上方二维码完成支付，支付完成后点击下方「已完成支付」按钮。</div>' +
            '</div>';
    } else if (method === 'alipay') {
        area.innerHTML =
            '<div style="text-align:center;padding:1rem;">' +
            '<div style="background:#fff;display:inline-block;padding:1rem;border-radius:12px;box-shadow:0 2px 12px rgba(0,0,0,0.08);margin-bottom:0.75rem;">' +
            generatePaymentQR('alipay') +
            '</div>' +
            '<div style="display:flex;align-items:center;justify-content:center;gap:0.4rem;margin-bottom:0.5rem;color:#1677FF;font-weight:600;font-size:0.9rem;">' +
            '<span>💙</span> 支付宝扫码支付</div>' +
            '<div style="font-size:0.8rem;color:var(--text-light);">请使用支付宝扫描二维码完成支付</div>' +
            '<div style="margin-top:0.5rem;font-size:0.85rem;color:var(--earth-brown);font-weight:bold;">¥ ' + total.toFixed(2) + '</div>' +
            '<div style="margin-top:0.75rem;background:#e8f4ff;border-radius:6px;padding:0.5rem 0.75rem;font-size:0.75rem;color:#0d47a1;text-align:left;">' +
            '💡 <strong>电脑端提示：</strong>请用手机支付宝扫描上方二维码完成支付，支付完成后点击下方「已完成支付」按钮。</div>' +
            '</div>';
    } else if (method === 'bank') {
        area.innerHTML =
            '<div style="text-align:center;padding:1rem;width:100%;">' +
            '<div style="background:var(--cream);border-radius:10px;padding:1.25rem;text-align:left;font-size:0.85rem;line-height:2;margin-bottom:0.75rem;">' +
            '<div><strong>开户行：</strong>中国建设银行贵阳分行</div>' +
            '<div><strong>户名：</strong>贵州古芝源品牌管理有限公司</div>' +
            '<div><strong>账号：</strong>6217 0028 8001 2345 678</div>' +
            '</div>' +
            '<div style="background:#f0f7e8;border-radius:6px;padding:0.5rem 0.75rem;font-size:0.75rem;color:var(--primary-green);text-align:left;">' +
            '💡 转账完成后请点击下方「已完成支付」按钮，我们的工作人员将核实到账情况。</div>' +
            '</div>';
    }

    // 存储当前支付方式
    window._currentPaymentMethod = method;
}

/**
 * 处理支付完成
 */
function processPaymentCompletion(order, total, closeModal) {
    // 更新订单状态为已支付
    updateOrderStatus(order.id, 'paid');
    var updatedOrder = getOrderHistory().find(function(o) { return o.id === order.id; });

    // 关闭支付弹窗
    closeModal();

    // 支付成功后清空购物车
    clearCart();

    // 更新页面购物车显示
    if (typeof updateCartBadge === 'function') updateCartBadge();

    // 重新渲染购物车页面（如果当前在购物车页面）
    var cartPageEmpty = document.getElementById('cart-empty');
    var cartPageItems = document.getElementById('cart-items');
    var cartPageSummary = document.getElementById('cart-summary');
    if (cartPageEmpty && cartPageItems && cartPageSummary) {
        cartPageEmpty.style.display = '';
        cartPageItems.style.display = 'none';
        cartPageSummary.style.display = 'none';
    }

    // 短暂延迟后显示支付成功弹窗
    setTimeout(function() {
        var cart = updatedOrder ? updatedOrder.items : [];
        var itemsSummary = cart.map(function(item) {
            return item.name + ' × ' + item.quantity;
        }).join('<br>');

        showModal({
            icon: '<svg class="g-success-check" viewBox="0 0 52 52"><circle class="g-success-circle" cx="26" cy="26" r="25" fill="none"/><path class="g-success-path" fill="none" d="M14 27l7 7 16-16"/></svg>',
            title: '支付成功！',
            message:
                '<div class="order-summary">' +
                '<div><span class="label">订单编号</span><span class="order-id">' + order.id + '</span></div>' +
                '<div><span class="label">支付时间</span>' + (updatedOrder ? updatedOrder.payTimeDisplay : order.orderTimeDisplay) + '</div>' +
                '<div><span class="label">支付方式</span>' + (window._currentPaymentMethod === 'wechat' ? '微信支付' : window._currentPaymentMethod === 'alipay' ? '支付宝' : '银行转账') + '</div>' +
                '<div style="margin-top:0.5rem;padding-top:0.5rem;border-top:1px dashed #ddd;">' +
                '<span class="label">商品</span>' + itemsSummary + '</div>' +
                '<div style="font-weight:bold;font-size:1.1rem;margin-top:0.5rem;">' +
                '<span class="label">实付金额</span>¥ ' + total.toFixed(2) + '</div>' +
                '</div>' +
                '<div class="payment-notice" style="background:#e8f5e9;border-color:#4caf50;color:#2e7d32;">' +
                '<div class="title">✅ 订单支付成功</div>' +
                '<div>感谢您的购买！我们的工作人员将在 <strong>24小时内</strong> 与您联系确认发货事宜。如有疑问，欢迎联系客服。</div>' +
                '</div>',
            buttons: [
                { text: '继续购物', type: 'default', onClick: function() { window.location.href = 'products.html'; } },
                { text: '查看我的订单', type: 'primary', onClick: function() { window.location.href = 'order-history.html'; } }
            ]
        });
    }, 400);
}

// ==================== 初始化 ====================

// 页面加载时更新角标
document.addEventListener('DOMContentLoaded', function () {
    updateCartBadge();
});
