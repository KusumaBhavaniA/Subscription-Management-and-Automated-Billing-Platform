(function (global) {
    'use strict';

    var THEME_KEY = 'billing.theme';

    function getStoredTheme() {
        try {
            return localStorage.getItem(THEME_KEY);
        } catch (e) {
            return null;
        }
    }

    function syncToggle(button, theme) {
        if (!button) return;

        var isDark = theme === 'dark';
        button.setAttribute('aria-pressed', String(isDark));
        button.setAttribute('title', isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode');
        button.dataset.theme = theme;

        var sunIcon = button.querySelector('.sun-icon');
        var moonIcon = button.querySelector('.moon-icon');
        if (sunIcon && moonIcon) {
            if (isDark) {
                moonIcon.classList.remove('hidden');
                sunIcon.classList.add('hidden');
            } else {
                sunIcon.classList.remove('hidden');
                moonIcon.classList.add('hidden');
            }
        }
    }

    function applyTheme(theme, persist) {
        var nextTheme = theme === 'light' ? 'light' : 'dark';
        var isDark = nextTheme === 'dark';

        document.body.classList.toggle('dark-mode', isDark);
        document.body.classList.toggle('light-mode', !isDark);
        document.documentElement.setAttribute('data-theme', nextTheme);
        document.documentElement.style.colorScheme = nextTheme;

        if (persist !== false) {
            try {
                localStorage.setItem(THEME_KEY, nextTheme);
            } catch (e) {}
        }

        document.querySelectorAll('[data-theme-toggle]').forEach(function (btn) {
            syncToggle(btn, nextTheme);
        });

        global.dispatchEvent(new CustomEvent('themechange', { detail: { theme: nextTheme } }));
        return nextTheme;
    }

    function initTheme() {
        var saved = getStoredTheme();
        var initial = saved ? saved : 'dark'; // Default theme = Dark
        applyTheme(initial, false);
    }

    function toggleTheme() {
        var current = document.documentElement.getAttribute('data-theme') || (document.body.classList.contains('dark-mode') ? 'dark' : 'light');
        var next = current === 'dark' ? 'light' : 'dark';
        return applyTheme(next, true);
    }

    function handleToggleClick(e) {
        e.preventDefault();
        toggleTheme();
    }

    function bindToggle(selector) {
        var buttons = document.querySelectorAll(selector);
        var currentTheme = document.documentElement.getAttribute('data-theme') || 'dark';
        buttons.forEach(function (button) {
            syncToggle(button, currentTheme);
            button.removeEventListener('click', handleToggleClick);
            button.addEventListener('click', handleToggleClick);
        });
    }

    // Apply initial theme immediately before DOM ready to prevent flash of wrong theme
    var savedTheme = getStoredTheme() || 'dark';
    document.documentElement.setAttribute('data-theme', savedTheme);
    document.documentElement.style.colorScheme = savedTheme;

    global.ThemeManager = {
        init: initTheme,
        apply: applyTheme,
        toggle: toggleTheme,
        bindToggle: bindToggle,
        current: function () {
            return document.documentElement.getAttribute('data-theme') || 'dark';
        }
    };
})(window);