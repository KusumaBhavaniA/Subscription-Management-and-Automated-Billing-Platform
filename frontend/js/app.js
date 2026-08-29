(function () {
    'use strict';

    var AppState = {
        initialized: false,
        page: 'index',
        basePath: './'
    };

    var PAGE_TITLES = {
        index: 'NexFlow',
        login: 'Sign in',
        signup: 'Create account',
        'forgot-password': 'Recover access',
        otp: 'Verify code',
        'reset-password': 'Reset password',
        dashboard: 'Dashboard',
        profile: 'Profile',
        settings: 'Settings',
        '404': 'Page not found'
    };

    function loadComponents() {
        var slots = BillingUtils.qsa('[data-component]');
        if (!slots.length) {
            return Promise.resolve();
        }

        return Promise.all(slots.map(function (slot) {
            var component = slot.getAttribute('data-component');
            return BillingUtils.loadPartial(slot, AppState.basePath + 'components/' + component + '.html');
        }));
    }

    function initSearch() {
        var searchInputs = BillingUtils.qsa('[data-dashboard-search]');
        searchInputs.forEach(function (input) {
            input.addEventListener('keydown', function (e) {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    var query = input.value.trim().toLowerCase();
                    if (!query) return;

                    var basePath = AppState.basePath;
                    var pagesDir = basePath.indexOf('/pages/') >= 0 ? '' : 'pages/';

                    if (query.indexOf('cust') >= 0 || query.indexOf('client') >= 0) {
                        window.location.href = basePath + pagesDir + 'dashboard.html#customers';
                    } else if (query.indexOf('plan') >= 0 || query.indexOf('tier') >= 0) {
                        window.location.href = basePath + pagesDir + 'dashboard.html#plans';
                    } else if (query.indexOf('sub') >= 0 || query.indexOf('renew') >= 0) {
                        window.location.href = basePath + pagesDir + 'dashboard.html#subscriptions';
                    } else if (query.indexOf('inv') >= 0 || query.indexOf('bill') >= 0) {
                        window.location.href = basePath + pagesDir + 'dashboard.html#invoices';
                    } else if (query.indexOf('pay') >= 0 || query.indexOf('trans') >= 0) {
                        window.location.href = basePath + pagesDir + 'dashboard.html#payments';
                    } else if (query.indexOf('rep') >= 0 || query.indexOf('ana') >= 0) {
                        window.location.href = basePath + pagesDir + 'dashboard.html#analytics';
                    } else if (query.indexOf('set') >= 0 || query.indexOf('pref') >= 0) {
                        window.location.href = basePath + pagesDir + 'settings.html';
                    } else if (query.indexOf('prof') >= 0 || query.indexOf('acc') >= 0 || query.indexOf('user') >= 0) {
                        window.location.href = basePath + pagesDir + 'profile.html';
                    } else {
                        window.location.href = basePath + pagesDir + 'dashboard.html';
                    }
                }
            });
        });
    }

    function initNotifications() {
        var toggle = BillingUtils.qs('[data-notifications-toggle]');
        var panel = BillingUtils.qs('[data-notifications-panel]');
        var profilePanel = BillingUtils.qs('[data-profile-panel]');
        var markBtn = BillingUtils.qs('[data-mark-read]');

        if (toggle && panel) {
            toggle.addEventListener('click', function (e) {
                e.stopPropagation();
                if (profilePanel) profilePanel.classList.add('hidden');
                panel.classList.toggle('hidden');
            });

            document.addEventListener('click', function (e) {
                if (!panel.contains(e.target) && !toggle.contains(e.target)) {
                    panel.classList.add('hidden');
                }
            });
        }

        if (markBtn) {
            markBtn.addEventListener('click', function () {
                BillingUtils.qsa('.notification-item', panel).forEach(function (item) {
                    item.classList.remove('unread');
                });
                var dot = BillingUtils.qs('.badge-dot', toggle);
                if (dot) dot.classList.add('hidden');
                BillingUtils.showToast('info', 'Notifications Updated', 'All notifications marked as read.');
            });
        }
    }

    function initProfileDropdown() {
        var toggle = BillingUtils.qs('[data-profile-toggle]');
        var panel = BillingUtils.qs('[data-profile-panel]');
        var notifPanel = BillingUtils.qs('[data-notifications-panel]');

        if (toggle && panel) {
            toggle.addEventListener('click', function (e) {
                e.stopPropagation();
                if (notifPanel) notifPanel.classList.add('hidden');
                var isHidden = panel.classList.toggle('hidden');
                toggle.setAttribute('aria-expanded', String(!isHidden));
            });

            document.addEventListener('click', function (e) {
                if (!panel.contains(e.target) && !toggle.contains(e.target)) {
                    panel.classList.add('hidden');
                    toggle.setAttribute('aria-expanded', 'false');
                }
            });
        }
    }

    function initGlobalActions() {
        var sidebar = BillingUtils.qs('[data-sidebar]');
        var overlay = BillingUtils.qs('[data-sidebar-overlay]');
        var toggles = BillingUtils.qsa('[data-sidebar-toggle]');

        if (sidebar && overlay) {
            toggles.forEach(function (toggle) {
                toggle.addEventListener('click', function () {
                    var open = sidebar.classList.toggle('is-open');
                    overlay.classList.toggle('is-active', open);
                    toggle.setAttribute('aria-expanded', String(open));
                });
            });

            overlay.addEventListener('click', function () {
                sidebar.classList.remove('is-open');
                overlay.classList.remove('is-active');
                toggles.forEach(function (toggle) {
                    toggle.setAttribute('aria-expanded', 'false');
                });
            });
        }

        BillingUtils.qsa('[data-logout]').forEach(function (button) {
            button.addEventListener('click', function (event) {
                event.preventDefault();
                BillingUtils.showToast('info', 'Signed out', 'Your session has been cleared.');
                BillingAuth.clearSession();
                window.location.href = AppState.basePath + 'pages/login.html';
            });
        });

        initSearch();
        initNotifications();
        initProfileDropdown();
    }

    function syncPageTitle() {
        var title = PAGE_TITLES[AppState.page] || 'Dashboard';
        BillingUtils.qsa('[data-page-title]').forEach(function (node) {
            node.textContent = title;
        });
    }

    function mountPageControllers() {
        if (AppState.page === 'login' || AppState.page === 'signup' || AppState.page === 'forgot-password' || AppState.page === 'otp' || AppState.page === 'reset-password') {
            if (window.BillingAuthPages && typeof window.BillingAuthPages.init === 'function') {
                window.BillingAuthPages.init(AppState);
            }
        }

        if (AppState.page === 'dashboard' || AppState.page === 'profile' || AppState.page === 'settings' || AppState.page === '404') {
            if (window.BillingDashboard && typeof window.BillingDashboard.init === 'function') {
                window.BillingDashboard.init(AppState);
            }
        }
    }

    function bootstrap() {
        if (AppState.initialized) {
            return;
        }

        AppState.page = BillingUtils.getPageName();
        AppState.basePath = BillingUtils.getBasePath();
        document.title = 'NexFlow - ' + (PAGE_TITLES[AppState.page] || 'Dashboard');

        ThemeManager.init();
        BillingAuth.guardRoute();

        loadComponents().catch(function (err) {
            console.warn('Component loading skipped or deferred:', err);
        }).finally(function () {
            ThemeManager.bindToggle('[data-theme-toggle]');
            initGlobalActions();
            syncPageTitle();
            BillingAuth.hydrateUserBindings();
            initAnimations();
            mountPageControllers();
            AppState.initialized = true;
            document.body.classList.add('is-ready');
            window.dispatchEvent(new CustomEvent('billing:ready', { detail: AppState }));
        });
    }

    document.addEventListener('DOMContentLoaded', bootstrap);

    window.BillingApp = {
        state: AppState,
        bootstrap: bootstrap
    };
})();