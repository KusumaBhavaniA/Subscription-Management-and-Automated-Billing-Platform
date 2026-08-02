(function (global) {
    'use strict';

    var Utils = {};

    function qs(selector, root) {
        return (root || document).querySelector(selector);
    }

    function qsa(selector, root) {
        return Array.prototype.slice.call((root || document).querySelectorAll(selector));
    }

    function getBasePath() {
        return window.location.pathname.indexOf('/pages/') >= 0 ? '../' : './';
    }

    function getPageName() {
        var file = window.location.pathname.split('/').pop() || 'index.html';
        return file.replace(/\.html$/, '') || 'index';
    }

    function createEl(tag, attrs, children) {
        var element = document.createElement(tag);
        Object.keys(attrs || {}).forEach(function (key) {
            var value = attrs[key];
            if (key === 'className') {
                element.className = value;
            } else if (key === 'text') {
                element.textContent = value;
            } else if (key === 'html') {
                element.innerHTML = value;
            } else if (value !== null && value !== undefined) {
                element.setAttribute(key, value);
            }
        });

        (children || []).forEach(function (child) {
            if (typeof child === 'string') {
                element.appendChild(document.createTextNode(child));
            } else if (child) {
                element.appendChild(child);
            }
        });

        return element;
    }

    function safeJsonParse(value, fallback) {
        try {
            return JSON.parse(value);
        } catch (error) {
            return fallback;
        }
    }

    function formatCurrency(value) {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            maximumFractionDigits: 0
        }).format(Number(value || 0));
    }

    function formatNumber(value) {
        return new Intl.NumberFormat('en-US').format(Number(value || 0));
    }

    function formatPercent(value, digits) {
        return Number(value || 0).toFixed(typeof digits === 'number' ? digits : 1) + '%';
    }

    function formatDate(value, options) {
        return new Intl.DateTimeFormat('en-US', options || {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        }).format(new Date(value));
    }

    function clamp(value, min, max) {
        return Math.min(max, Math.max(min, value));
    }

    function wait(ms) {
        return new Promise(function (resolve) {
            setTimeout(resolve, ms);
        });
    }

    function serializeForm(form) {
        var data = {};
        new FormData(form).forEach(function (value, key) {
            data[key] = value;
        });
        return data;
    }

    function setBusyButton(button, busy, label) {
        if (!button) {
            return;
        }

        if (busy) {
            if (!button.dataset.originalLabel) {
                button.dataset.originalLabel = button.innerHTML;
            }
            button.disabled = true;
            button.classList.add('is-loading');
            if (label) {
                button.innerHTML = label;
            }
            return;
        }

        button.disabled = false;
        button.classList.remove('is-loading');
        if (button.dataset.originalLabel) {
            button.innerHTML = button.dataset.originalLabel;
        }
    }

    function setFormState(form, loading) {
        if (!form) {
            return;
        }

        qsa('button, input, select, textarea', form).forEach(function (control) {
            control.disabled = loading;
        });
    }

    function passwordStrength(value) {
        var score = 0;
        var hints = [];

        if (value.length >= 8) {
            score += 1;
        } else {
            hints.push('Use at least 8 characters');
        }

        if (/[A-Z]/.test(value)) score += 1; else hints.push('Add an uppercase letter');
        if (/[a-z]/.test(value)) score += 1; else hints.push('Add a lowercase letter');
        if (/\d/.test(value)) score += 1; else hints.push('Add a number');
        if (/[^A-Za-z0-9]/.test(value)) score += 1; else hints.push('Add a symbol');

        return {
            score: score,
            label: ['Very weak', 'Weak', 'Fair', 'Good', 'Strong'][clamp(score, 0, 4)],
            hints: hints
        };
    }

    function loadPartial(target, url) {
        if (!target) {
            return Promise.resolve(null);
        }

        return fetch(url).then(function (response) {
            return response.text();
        }).then(function (markup) {
            target.innerHTML = markup;
            return target;
        });
    }

    function createToastHost() {
        var host = document.getElementById('toast-container');
        if (!host) {
            host = createEl('div', {
                id: 'toast-container',
                'aria-live': 'polite',
                'aria-atomic': 'true'
            });
            document.body.appendChild(host);
        }
        return host;
    }

    function showToast(type, title, message) {
        var host = createToastHost();
        var toast = createEl('article', {
            className: 'toast toast--' + type,
            role: 'status'
        }, [
            createEl('div', { className: 'toast__icon', html: '<span></span>' }),
            createEl('div', { className: 'toast__content' }, [
                createEl('strong', { className: 'toast__title', text: title }),
                createEl('p', { className: 'toast__message', text: message })
            ]),
            createEl('button', {
                className: 'toast__close',
                type: 'button',
                'aria-label': 'Dismiss notification',
                text: '×'
            })
        ]);

        toast.querySelector('.toast__close').addEventListener('click', function () {
            toast.remove();
        });

        host.appendChild(toast);

        requestAnimationFrame(function () {
            toast.classList.add('is-visible');
        });

        setTimeout(function () {
            toast.classList.add('is-leaving');
            setTimeout(function () {
                if (toast.parentNode) {
                    toast.parentNode.removeChild(toast);
                }
            }, 240);
        }, 3600);

        return toast;
    }

    function observeReveal(selector) {
        var nodes = qsa(selector);
        if (!nodes.length) {
            return;
        }

        if (!('IntersectionObserver' in window)) {
            nodes.forEach(function (node) {
                node.classList.add('is-visible');
            });
            return;
        }

        var observer = new IntersectionObserver(function (entries, io) {
            entries.forEach(function (entry) {
                if (entry.isIntersecting) {
                    entry.target.classList.add('is-visible');
                    io.unobserve(entry.target);
                }
            });
        }, { threshold: 0.05, rootMargin: '50px' });

        nodes.forEach(function (node) {
            var rect = node.getBoundingClientRect();
            var viewportHeight = window.innerHeight || document.documentElement.clientHeight;
            if (rect.top <= viewportHeight + 100 && rect.bottom >= -100) {
                node.classList.add('is-visible');
            } else {
                observer.observe(node);
            }
        });
    }

    function animateCounter(element, target, options) {
        if (!element) {
            return;
        }

        var duration = (options && options.duration) || 1200;
        var formatter = (options && options.formatter) || function (value) {
            return String(Math.round(value));
        };
        var start = performance.now();

        function step(now) {
            var progress = clamp((now - start) / duration, 0, 1);
            var eased = 1 - Math.pow(1 - progress, 3);
            element.textContent = formatter(target * eased);
            if (progress < 1) {
                requestAnimationFrame(step);
            }
        }

        requestAnimationFrame(step);
    }

    Utils.qs = qs;
    Utils.qsa = qsa;
    Utils.getBasePath = getBasePath;
    Utils.getPageName = getPageName;
    Utils.createEl = createEl;
    Utils.safeJsonParse = safeJsonParse;
    Utils.formatCurrency = formatCurrency;
    Utils.formatNumber = formatNumber;
    Utils.formatPercent = formatPercent;
    Utils.formatDate = formatDate;
    Utils.clamp = clamp;
    Utils.wait = wait;
    Utils.serializeForm = serializeForm;
    Utils.setBusyButton = setBusyButton;
    Utils.setFormState = setFormState;
    Utils.passwordStrength = passwordStrength;
    Utils.loadPartial = loadPartial;
    Utils.createToastHost = createToastHost;
    Utils.showToast = showToast;
    Utils.observeReveal = observeReveal;
    Utils.animateCounter = animateCounter;

    global.BillingUtils = Utils;
})(window);