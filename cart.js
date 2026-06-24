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

// 更新购物车角标（使用双重机制：class + data属性，兼容所有页面）
function updateCartBadge() {
    // 延迟重试机制，确保 nav.js 已渲染完成
    var retryCount = arguments[0] || 0;
    var badge = document.getElementById('cart-badge');
    if (!badge) {
        if (retryCount < 5) {
            setTimeout(function () { updateCartBadge(retryCount + 1); }, 150);
        }
        return;
    }
    var count = getCartCount();
    badge.textContent = count > 99 ? '99+' : count;
    badge.setAttribute('data-count', String(count));
    if (count > 0) {
        badge.classList.add('visible', 'show');
        badge.style.display = 'flex';
    } else {
        badge.classList.remove('visible', 'show');
        badge.style.display = 'none';
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

// ==================== PayJS 支付网关配置 ====================
// Vercel API 代理地址（部署后替换为实际域名）
var PAYJS_API_BASE = 'https://guzhiyuan-pay.vercel.app';

// 支付轮询相关
window._paymentPollingTimer = null;
window._paymentPollingMax = 100; // 最多轮询100次（约5分钟）
window._paymentPollingCount = 0;

// ==================== 设备检测 ====================
function isMobileDevice() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}
function isWeChatBrowser() {
    return /MicroMessenger/i.test(navigator.userAgent);
}

// ==================== 支付二维码生成 ====================

/**
 * 获取银行账户配置（从 site.json 读取，作为银行转账备选）
 */
function getBankAccountInfo() {
    var defaultInfo = {
        bankName: '中国工商银行股份有限公司遵义碧云支行',
        accountName: '贵州古芝源品牌管理有限公司',
        accountNumber: '2403028209200515275'
    };
    if (window._siteConfig && window._siteConfig.bankAccount) {
        return window._siteConfig.bankAccount;
    }
    return defaultInfo;
}

/**
 * 调用 Vercel API 创建 PayJS 支付订单
 * @param {string} orderId - 商户订单号
 * @param {number} total - 支付金额（元）
 * @param {string} body - 订单标题
 * @returns {Promise<Object>} API 响应
 */
async function createPayJSOrder(orderId, total, body) {
    try {
        var response = await fetch(PAYJS_API_BASE + '/api/create-payment', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                order_no: orderId,
                amount: total,
                body: body || ('古芝源订单-' + orderId)
            })
        });
        return await response.json();
    } catch (e) {
        console.error('PayJS 下单失败:', e);
        return { code: 500, msg: '支付网关连接失败，请检查网络后重试' };
    }
}

/**
 * 查询 PayJS 支付状态
 * @param {string} payjs_order_id - PayJS 平台订单号
 * @returns {Promise<Object>}
 */
async function checkPayJSOrder(payjs_order_id) {
    try {
        var response = await fetch(PAYJS_API_BASE + '/api/check-payment', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ payjs_order_id: payjs_order_id })
        });
        return await response.json();
    } catch (e) {
        console.error('查询支付状态失败:', e);
        return { code: 500, msg: '查询失败' };
    }
}

/**
 * 开始轮询支付状态（每3秒查询一次，最多5分钟）
 * @param {string} payjs_order_id - PayJS 平台订单号
 * @param {Function} onPaid - 支付成功回调
 * @param {Function} onTimeout - 超时回调
 */
function startPaymentPolling(payjs_order_id, onPaid, onTimeout) {
    // 清除之前的轮询
    stopPaymentPolling();

    window._paymentPollingCount = 0;

    window._paymentPollingTimer = setInterval(async function () {
        window._paymentPollingCount++;

        if (window._paymentPollingCount > window._paymentPollingMax) {
            stopPaymentPolling();
            if (onTimeout) onTimeout();
            return;
        }

        var result = await checkPayJSOrder(payjs_order_id);

        if (result.code === 200 && result.data && result.data.paid) {
            stopPaymentPolling();
            if (onPaid) onPaid(result.data);
        }
    }, 3000);
}

/**
 * 停止支付状态轮询
 */
function stopPaymentPolling() {
    if (window._paymentPollingTimer) {
        clearInterval(window._paymentPollingTimer);
        window._paymentPollingTimer = null;
    }
    window._paymentPollingCount = 0;
}

/**
 * 生成支付二维码 HTML（PayJS 真实支付二维码 + 银行转账备选）
 * @param {string} orderId - 订单编号
 * @param {number} total - 支付金额
 * @param {string} method - 支付方式: 'wechat' | 'alipay' | 'bank'
 * @returns {Promise<string>} HTML
 */
async function generatePaymentQRHtmlAsync(orderId, total, method) {
    var uniqueId = 'qr-' + Date.now() + '-' + Math.random().toString(36).substr(2, 6);

    // 微信支付：使用 PayJS 直接支付
    if (method === 'wechat') {
        try {
            var result = await createPayJSOrder(orderId, total, '古芝源订单-' + orderId);

            if (result.code === 200 && result.data && result.data.qrcode) {
                // 储存 PayJS 订单信息用于轮询
                window._currentPayJSOrderId = result.data.payjs_order_id;

                return '<div style="background:#fff;display:inline-block;padding:0.85rem;border-radius:14px;box-shadow:0 3px 16px rgba(0,0,0,0.12);">' +
                    '<img src="' + result.data.qrcode + '" width="260" height="260" ' +
                    'alt="微信支付二维码" style="border-radius:8px;display:block;" ' +
                    'onload="this.style.display=\'\';" ' +
                    '/>' +
                    '<div style="text-align:center;margin-top:0.5rem;font-size:0.75rem;color:#666;">' +
                    '有效期 2 小时 · 请用微信扫码支付</div>' +
                    '</div>';
            }
        } catch (e) {
            console.error('PayJS 下单异常:', e);
        }
    }

    // 支付宝 / 银行转账 / PayJS 失败：使用银行转账二维码（备选）
    var bank = getBankAccountInfo();
    var payData = encodeURIComponent(
        '卡号=' + bank.accountNumber +
        '&户名=' + bank.accountName +
        '&银行=' + bank.bankName +
        '&金额=' + total.toFixed(2) +
        '&订单=' + orderId +
        '&用途=货款'
    );
    var qrUrl = 'https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=' + payData + '&margin=10&format=png';

    return '<div style="background:#fff;display:inline-block;padding:0.85rem;border-radius:14px;box-shadow:0 3px 16px rgba(0,0,0,0.1);text-align:center;">' +
        '<div id="' + uniqueId + '-loading" style="color:#999;font-size:0.85rem;padding:2rem 0;">' +
        '<div style="font-size:2rem;margin-bottom:0.5rem;">⏳</div>加载二维码中...</div>' +
        '<img id="' + uniqueId + '" src="' + qrUrl + '" width="240" height="240" ' +
        'alt="支付二维码" style="border-radius:8px;display:none;" ' +
        'onload="var img=document.getElementById(\'' + uniqueId + '\');var ld=document.getElementById(\'' + uniqueId + '-loading\');if(img){img.style.display=\'\';}if(ld){ld.style.display=\'none\';}" ' +
        'onerror="var ld=document.getElementById(\'' + uniqueId + '-loading\');if(ld){ld.innerHTML=\'<div style=font-size:2rem;margin-bottom:0.5rem;>⚠️</div>二维码加载失败<br><small style=color:#999;>请刷新重试或选择其他支付方式</small>\';}" ' +
        '/></div>';
}

/**
 * 生成银行转账二维码 HTML（保留旧接口兼容）
 */
function generatePaymentQRHtml(orderId, total) {
    var uniqueId = 'qr-' + Date.now() + '-' + Math.random().toString(36).substr(2, 6);
    var bank = getBankAccountInfo();
    var payData = encodeURIComponent(
        '卡号=' + bank.accountNumber +
        '&户名=' + bank.accountName +
        '&银行=' + bank.bankName +
        '&金额=' + total.toFixed(2) +
        '&订单=' + orderId +
        '&用途=货款'
    );
    var qrUrl = 'https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=' + payData + '&margin=10&format=png';

    return '<div style="background:#fff;display:inline-block;padding:0.85rem;border-radius:14px;box-shadow:0 3px 16px rgba(0,0,0,0.1);text-align:center;">' +
        '<div id="' + uniqueId + '-loading" style="color:#999;font-size:0.85rem;padding:2rem 0;">' +
        '<div style="font-size:2rem;margin-bottom:0.5rem;">⏳</div>加载二维码中...</div>' +
        '<img id="' + uniqueId + '" src="' + qrUrl + '" width="240" height="240" ' +
        'alt="支付二维码" style="border-radius:8px;display:none;" ' +
        'onload="var img=document.getElementById(\'' + uniqueId + '\');var ld=document.getElementById(\'' + uniqueId + '-loading\');if(img){img.style.display=\'\';}if(ld){ld.style.display=\'none\';}" ' +
        'onerror="var ld=document.getElementById(\'' + uniqueId + '-loading\');if(ld){ld.innerHTML=\'<div style=font-size:2rem;margin-bottom:0.5rem;>⚠️</div>二维码加载失败<br><small style=color:#999;>请刷新重试或选择其他支付方式</small>\';}" ' +
        '/></div>';
}

// ==================== 银行转账工具 ====================

/**
 * 一键复制银行转账信息到剪贴板
 */
function copyBankInfo(bankName, accountName, accountNumber, orderId) {
    var text = '开户行：' + bankName + '\n' +
               '户名：' + accountName + '\n' +
               '账号：' + accountNumber + '\n' +
               '转账附言：' + orderId;
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(function() {
            showNotification('收款信息已复制到剪贴板', 'success');
        }).catch(function() {
            fallbackCopy(text);
        });
    } else {
        fallbackCopy(text);
    }
}

function fallbackCopy(text) {
    var textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.left = '-9999px';
    textarea.style.top = '-9999px';
    document.body.appendChild(textarea);
    textarea.select();
    try {
        document.execCommand('copy');
        showNotification('收款信息已复制到剪贴板', 'success');
    } catch (e) {
        showNotification('复制失败，请手动记录收款信息', 'error');
    }
    document.body.removeChild(textarea);
}

// ==================== 统一无感支付弹窗（仿美团外卖） ====================

/**
 * 显示统一支付弹窗 — 无需选择支付方式，一键直接支付
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

    var isMobile = isMobileDevice();
    var isWeChat = isWeChatBrowser();
    var deviceLabel = isWeChat ? '微信内支付 · 一键确认' : (isMobile ? '手机支付 · 自动唤起微信' : '请使用手机微信扫码支付');

    var paymentHtml =
        // 订单摘要
        '<div style="text-align:left;background:#fafaf7;border-radius:10px;padding:1rem;margin-bottom:1rem;">' +
        '<div style="font-weight:bold;color:var(--primary-green);margin-bottom:0.5rem;display:flex;align-items:center;gap:0.4rem;">' +
        '<span>📋</span> 订单确认</div>' +
        '<div style="font-size:0.85rem;color:var(--text-light);line-height:1.8;">' +
        '<div>订单编号：<span style="font-family:monospace;color:var(--primary-green);font-weight:bold;">' + order.id + '</span></div>' +
        '<div>下单时间：' + order.orderTimeDisplay + '</div>' +
        '<div style="margin-top:0.4rem;padding-top:0.4rem;border-top:1px dashed #ddd;">' + itemsSummary + '</div>' +
        '</div></div>' +

        // 金额醒目展示
        '<div style="text-align:center;margin-bottom:1rem;">' +
        '<div style="font-size:0.8rem;color:var(--text-light);">应付金额</div>' +
        '<div style="font-size:2rem;font-weight:700;color:#e53935;line-height:1.4;">¥ ' + total.toFixed(2) + '</div>' +
        '<div style="font-size:0.75rem;color:#999;margin-top:0.2rem;">' + deviceLabel + '</div>' +
        '</div>' +

        // 支付内容区
        '<div id="unified-pay-area" style="min-height:120px;display:flex;flex-direction:column;align-items:center;justify-content:center;">' +
        // 加载状态
        '<div id="unified-pay-loading" style="text-align:center;padding:1.5rem 0;color:#999;">' +
        '<div style="font-size:2rem;margin-bottom:0.5rem;">⏳</div>' +
        '<div>正在连接支付网关...</div>' +
        '</div>' +
        // 二维码容器
        '<div id="unified-pay-qr" style="display:none;text-align:center;"></div>' +
        // 手机端提示 + 唤起按钮
        '<div id="unified-pay-mobile" style="display:none;text-align:center;margin-bottom:0.8rem;">' +
        '<div style="font-size:2.5rem;margin-bottom:0.3rem;">💚</div>' +
        '<div style="font-size:0.95rem;font-weight:600;color:var(--primary-green);margin-bottom:0.5rem;">正在打开微信支付...</div>' +
        '<button onclick="tryOpenWeChatPay()" ' +
        'style="display:inline-block;padding:0.7rem 2rem;background:#07c160;color:#fff;border:none;border-radius:24px;font-size:0.95rem;font-weight:600;cursor:pointer;box-shadow:0 2px 8px rgba(7,193,96,0.3);transition:all 0.3s;" ' +
        'onmouseover="this.style.transform=\'scale(1.03)\'" onmouseout="this.style.transform=\'scale(1)\'">' +
        '💚 使用微信支付</button>' +
        '<div style="font-size:0.72rem;color:#999;margin-top:0.5rem;">如未自动跳转，可点击上方按钮或扫码支付</div>' +
        '</div>' +
        '</div>';

    var modal = showModal({
        icon: '💳',
        title: '确认支付',
        message: paymentHtml,
        closable: true,
        buttons: [
            { text: '暂不支付', type: 'default', onClick: function(close) {
                stopPaymentPolling();
                window.location.href = 'order-history.html';
            }}
        ],
        onClose: function() {
            stopPaymentPolling();
            window._currentPayJSOrderId = null;
        }
    });

    // 存储引用
    window._currentPaymentOrder = order;
    window._currentPaymentTotal = total;
    window._currentPaymentModal = modal;

    // 启动统一支付流程
    setTimeout(function() {
        unifiedPaymentFlow(order.id, total, isMobile, isWeChat);
    }, 200);

    // 宽屏样式
    var overlay = document.querySelector('.g-modal-overlay');
    if (overlay) overlay.classList.add('payment-wide');
}

/**
 * 尝试打开微信支付（手机端无感拉起）
 */
function tryOpenWeChatPay() {
    if (window._currentPayCodeUrl) {
        // iframe 方式尝试唤起微信（不离开当前页面）
        var iframe = document.createElement('iframe');
        iframe.style.display = 'none';
        iframe.src = window._currentPayCodeUrl;
        document.body.appendChild(iframe);
        setTimeout(function() {
            if (iframe.parentNode) iframe.parentNode.removeChild(iframe);
        }, 3000);

        showNotification('正在打开微信支付...', 'success');
    }
}

/**
 * 统一支付流程 — 美团式直付
 * 桌面端：显示微信扫码二维码
 * 手机端：自动唤起微信 + 二维码备选
 */
function unifiedPaymentFlow(orderId, total, isMobile, isWeChat) {
    createPayJSOrder(orderId, total, '古芝源订单-' + orderId).then(function(result) {
        var loading = document.getElementById('unified-pay-loading');
        var qrContainer = document.getElementById('unified-pay-qr');
        var mobileHint = document.getElementById('unified-pay-mobile');

        if (loading) loading.style.display = 'none';

        if (result.code === 200 && result.data) {
            // PayJS 下单成功
            window._currentPayJSOrderId = result.data.payjs_order_id;
            window._currentPayCodeUrl = result.data.code_url;
            var qrcodeImg = result.data.qrcode;

            if (isMobile || isWeChat) {
                // === 手机端 / 微信内：自动唤起 + QR备选 ===
                if (mobileHint) mobileHint.style.display = '';

                // 显示备选二维码（缩小尺寸）
                if (qrContainer) {
                    qrContainer.style.display = '';
                    qrContainer.innerHTML =
                        '<div style="margin-top:0.3rem;">' +
                        '<div style="font-size:0.75rem;color:#999;margin-bottom:0.3rem;">— 也可扫码支付 —</div>' +
                        '<img src="' + qrcodeImg + '" width="200" height="200" alt="支付二维码" ' +
                        'style="border-radius:8px;box-shadow:0 2px 12px rgba(0,0,0,0.1);">' +
                        '<div style="font-size:0.7rem;color:#aaa;margin-top:0.3rem;">支付成功后自动确认</div>' +
                        '</div>';
                }

                // 自动尝试唤起微信（非微信浏览器内）
                if (!isWeChat) {
                    setTimeout(function() {
                        tryOpenWeChatPay();
                    }, 800);
                }
            } else {
                // === 桌面端：清晰的大二维码 ===
                if (qrContainer) {
                    qrContainer.style.display = '';
                    qrContainer.innerHTML =
                        '<div style="background:#fff;display:inline-block;padding:0.85rem;border-radius:14px;box-shadow:0 3px 16px rgba(0,0,0,0.12);">' +
                        '<img src="' + qrcodeImg + '" width="260" height="260" alt="微信支付二维码" style="border-radius:8px;display:block;">' +
                        '<div style="text-align:center;margin-top:0.5rem;font-size:0.8rem;color:var(--primary-green);font-weight:600;">' +
                        '<span style="font-size:1.1rem;">📱</span> 请使用手机微信扫码支付</div>' +
                        '<div style="text-align:center;margin-top:0.15rem;font-size:0.7rem;color:#999;">支付成功后 3 秒内自动确认</div>' +
                        '</div>';
                }
            }

            // 开始轮询支付状态
            startPaymentPolling(
                result.data.payjs_order_id,
                function(payData) {
                    var order = window._currentPaymentOrder;
                    var payTotal = window._currentPaymentTotal;
                    var modal = window._currentPaymentModal;
                    if (order && modal) {
                        processPaymentCompletion(order, payTotal, function() { modal.close(); });
                    }
                },
                function() {
                    // 超时
                    var area = document.getElementById('unified-pay-area');
                    if (area) {
                        area.innerHTML +=
                            '<div id="pay-timeout-hint" style="margin-top:0.5rem;padding:0.6rem;background:#fffbe6;border:1px solid #ffe58f;border-radius:6px;font-size:0.78rem;color:#faad14;text-align:center;">' +
                            '⏰ 二维码已过期，请关闭弹窗后重新下单</div>';
                    }
                }
            );

        } else {
            // PayJS 不可用 → 降级为银行转账
            showBankTransferFallback(orderId, total);
        }
    }).catch(function(e) {
        console.error('PayJS 下单异常:', e);
        showBankTransferFallback(orderId, total);
    });
}

/**
 * PayJS 不可用时降级为银行转账支付
 */
function showBankTransferFallback(orderId, total) {
    var loading = document.getElementById('unified-pay-loading');
    var qrContainer = document.getElementById('unified-pay-qr');
    var mobileHint = document.getElementById('unified-pay-mobile');

    if (loading) loading.style.display = 'none';
    if (mobileHint) mobileHint.style.display = 'none';

    var bank = getBankAccountInfo();
    var payData = encodeURIComponent(
        '卡号=' + bank.accountNumber +
        '&户名=' + bank.accountName +
        '&银行=' + bank.bankName +
        '&金额=' + total.toFixed(2) +
        '&订单=' + orderId +
        '&用途=货款'
    );
    var qrUrl = 'https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=' + payData + '&margin=10&format=png';

    if (qrContainer) {
        qrContainer.style.display = '';
        qrContainer.innerHTML =
            '<div style="text-align:center;">' +
            // 降级提示
            '<div style="background:#fffbe6;border:1px solid #ffe58f;border-radius:8px;padding:0.6rem 1rem;margin-bottom:0.8rem;font-size:0.78rem;color:#ad6800;text-align:center;">' +
            '⚠️ 支付网关暂时不可用，请通过银行转账完成支付</div>' +
            // 银行账户信息
            '<div style="background:var(--cream);border-radius:10px;padding:1rem;text-align:left;font-size:0.82rem;line-height:2;margin-bottom:0.8rem;">' +
            '<div style="font-weight:600;color:var(--primary-green);margin-bottom:0.3rem;">🏦 收款银行账户</div>' +
            '<div style="display:flex;justify-content:space-between;"><span>开户行</span><span style="font-weight:600;">' + bank.bankName + '</span></div>' +
            '<div style="display:flex;justify-content:space-between;"><span>户名</span><span style="font-weight:600;">' + bank.accountName + '</span></div>' +
            '<div style="display:flex;justify-content:space-between;"><span>账号</span><span style="font-family:monospace;font-weight:700;color:var(--earth-brown);">' + bank.accountNumber + '</span></div>' +
            '<div style="margin-top:0.4rem;padding-top:0.4rem;border-top:1px dashed #ccc;font-size:0.78rem;color:var(--earth-brown);text-align:right;font-weight:bold;">' +
            '转账金额：¥ ' + total.toFixed(2) + '</div>' +
            '</div>' +
            // QR
            '<div style="background:#fff;display:inline-block;padding:0.5rem;border-radius:10px;box-shadow:0 2px 10px rgba(0,0,0,0.08);">' +
            '<img src="' + qrUrl + '" width="220" height="220" alt="银行转账二维码" style="border-radius:6px;display:block;">' +
            '</div>' +
            '<div style="font-size:0.72rem;color:#999;margin-top:0.3rem;">📱 手机银行APP扫码可自动填入转账信息</div>' +
            // 复制按钮
            '<button onclick="copyBankInfo(\'' + bank.bankName.replace(/'/g, "\\\'") + '\',\'' + bank.accountName.replace(/'/g, "\\\'") + '\',\'' + bank.accountNumber.replace(/'/g, "\\\'") + '\',\'' + orderId + '\')" ' +
            'style="margin-top:0.6rem;padding:0.5rem 1.5rem;background:var(--primary-green);color:#fff;border:none;border-radius:6px;cursor:pointer;font-size:0.85rem;width:80%;max-width:280px;">📋 一键复制收款信息</button>' +
            '</div>';
    }

    // 银行转账模式（手动确认）
    window._currentPaymentMethod = 'bank';

    // 更新底部按钮
    updateModalButtonsForBankTransfer(orderId, total);
}

/**
 * 银行转账模式下更新弹窗按钮（添加"已完成转账"按钮）
 */
function updateModalButtonsForBankTransfer(orderId, total) {
    var footer = document.querySelector('.g-modal-footer');
    if (!footer) return;

    var order = window._currentPaymentOrder;
    footer.innerHTML =
        '<button class="btn-modal-default" onclick="stopPaymentPolling();window.location.href=\'order-history.html\'">暂不支付</button>' +
        '<button class="btn-modal-primary" onclick="(function(){var o=window._currentPaymentOrder;var t=window._currentPaymentTotal;var m=window._currentPaymentModal;processPaymentCompletion(o,t,function(){m.close();});})()">已完成转账 ✓</button>';
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

// 加载站点配置（用于银行账户等可配置信息）
(function loadSiteConfig() {
    try {
        var xhr = new XMLHttpRequest();
        xhr.open('GET', 'content/site.json', true);
        xhr.onload = function() {
            if (xhr.status === 200) {
                window._siteConfig = JSON.parse(xhr.responseText);
            }
        };
        xhr.send();
    } catch(e) {}
})();

// 页面加载时更新角标（多重延迟确保兼容各种加载时序）
document.addEventListener('DOMContentLoaded', function () {
    updateCartBadge();
    // 兜底延迟：nav.js 可能异步替换导航 HTML
    setTimeout(function() { updateCartBadge(); }, 300);
    setTimeout(function() { updateCartBadge(); }, 800);
    setTimeout(function() { updateCartBadge(); }, 1500);
});

// 监听 nav.js 动态渲染完成（nav.js 调用 renderNav 后会触发）
if (window.MutationObserver) {
    (function watchNavChanges() {
        var navEl = document.getElementById('nav-links');
        if (!navEl) { setTimeout(watchNavChanges, 100); return; }
        var observer = new MutationObserver(function(mutations) {
            mutations.forEach(function(m) {
                if (m.addedNodes.length > 0 || m.type === 'childList') {
                    // 导航被重新渲染，更新角标
                    setTimeout(function() { updateCartBadge(); }, 50);
                }
            });
        });
        observer.observe(navEl, { childList: true, subtree: true });
    })();
}
