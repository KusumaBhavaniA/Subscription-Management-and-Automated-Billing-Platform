(function (global) {
    'use strict';

    function bindRipple() {
        document.addEventListener('click', function (event) {
            var target = event.target.closest('.ripple, [data-ripple]');
            if (!target) {
                return;
            }

            var ripple = document.createElement('span');
            ripple.className = 'ripple__effect';

            var rect = target.getBoundingClientRect();
            var size = Math.max(rect.width, rect.height);
            ripple.style.width = ripple.style.height = size + 'px';
            ripple.style.left = (event.clientX - rect.left - size / 2) + 'px';
            ripple.style.top = (event.clientY - rect.top - size / 2) + 'px';

            target.appendChild(ripple);
            setTimeout(function () {
                if (ripple.parentNode) {
                    ripple.parentNode.removeChild(ripple);
                }
            }, 620);
        });
    }

    function bindMouseGlow() {
        document.addEventListener('mousemove', function (event) {
            BillingUtils.qsa('[data-mouse-glow]').forEach(function (card) {
                var rect = card.getBoundingClientRect();
                var x = ((event.clientX - rect.left) / rect.width) * 100;
                var y = ((event.clientY - rect.top) / rect.height) * 100;
                card.style.setProperty('--mouse-x', x + '%');
                card.style.setProperty('--mouse-y', y + '%');
            });
        });
    }

    function initCounterLoop() {
        BillingUtils.qsa('[data-counter]').forEach(function (node) {
            var value = Number(node.getAttribute('data-counter')) || 0;
            var format = node.getAttribute('data-counter-format') || 'number';
            BillingUtils.animateCounter(node, value, {
                duration: 1200,
                formatter: function (current) {
                    if (format === 'currency') {
                        return BillingUtils.formatCurrency(current);
                    }

                    if (format === 'percent') {
                        return BillingUtils.formatPercent(current, 1);
                    }

                    return BillingUtils.formatNumber(current);
                }
            });
        });
    }

    function initScrollReveal() {
        BillingUtils.observeReveal('[data-reveal]');
    }

    function initAnimations() {
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
            document.documentElement.classList.add('reduce-motion');
            return;
        }

        bindRipple();
        bindMouseGlow();
        initCounterLoop();
        initScrollReveal();
    }

    global.initAnimations = initAnimations;
})(window);