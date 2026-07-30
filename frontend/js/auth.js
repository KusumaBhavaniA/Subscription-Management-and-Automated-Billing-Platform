(function (global) {
    'use strict';

    var SESSION_KEY = 'billing.session';
    var TOKEN_KEY = 'billing.session.token';
    var USER_KEY = 'billing.session.user';
    var RESET_KEY = 'billing.session.reset';

    function readJSON(key, fallback) {
        try {
            return JSON.parse(localStorage.getItem(key) || 'null') || fallback;
        } catch (error) {
            return fallback;
        }
    }

    function avatarFromName(name) {
        return String(name || 'User')
            .split(' ')
            .filter(Boolean)
            .slice(0, 2)
            .map(function (part) {
                return part.charAt(0).toUpperCase();
            })
            .join('') || 'U';
    }

    function normalizeUser(payload) {
        payload = payload || {};
        return {
            id: payload.id || 'usr_' + Date.now(),
            name: payload.name || payload.email || 'Account Holder',
            email: payload.email || '',
            phone: payload.phone || '',
            company: payload.company || 'Subscription Management',
            role: payload.role || 'Account Owner',
            avatar: payload.avatar || avatarFromName(payload.name || payload.email),
            plan: payload.plan || 'Enterprise',
            joinedAt: payload.joinedAt || new Date().toISOString()
        };
    }

    function persistSession(session) {
        localStorage.setItem(SESSION_KEY, JSON.stringify(session));
        localStorage.setItem(TOKEN_KEY, session.token);
        localStorage.setItem(USER_KEY, JSON.stringify(session.user));
        global.dispatchEvent(new CustomEvent('billing:sessionchange', { detail: session }));
        return session;
    }

    function createSession(user, token, remember) {
        return persistSession({
            token: token,
            user: normalizeUser(user),
            remember: !!remember,
            createdAt: new Date().toISOString()
        });
    }

    function clearSession() {
        localStorage.removeItem(SESSION_KEY);
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
        localStorage.removeItem(RESET_KEY);
        global.dispatchEvent(new CustomEvent('billing:sessionchange', { detail: null }));
    }

    function getSession() {
        return readJSON(SESSION_KEY, null);
    }

    function getUser() {
        var session = getSession();
        return session && session.user ? session.user : readJSON(USER_KEY, null);
    }

    function isAuthenticated() {
        return !!localStorage.getItem(TOKEN_KEY);
    }

    function setResetContext(context) {
        localStorage.setItem(RESET_KEY, JSON.stringify(context || {}));
    }

    function getResetContext() {
        return readJSON(RESET_KEY, null);
    }

    function hydrateUserBindings(user) {
        var current = normalizeUser(user || getUser() || {});

        BillingUtils.qsa('[data-user-name]').forEach(function (node) {
            node.textContent = current.name;
        });

        BillingUtils.qsa('[data-user-role]').forEach(function (node) {
            node.textContent = current.role;
        });

        BillingUtils.qsa('[data-user-avatar]').forEach(function (node) {
            node.textContent = current.avatar;
        });

        BillingUtils.qsa('[data-user-email]').forEach(function (node) {
            node.textContent = current.email;
        });

        return current;
    }

    function setSessionUser(updates) {
        var session = getSession();
        if (!session) {
            return null;
        }

        session.user = normalizeUser(Object.assign({}, session.user, updates || {}));
        persistSession(session);
        hydrateUserBindings(session.user);
        return session.user;
    }

    function handleLoginSuccess(response, remember) {
        return createSession(response.user || response, response.token || 'billing_' + Date.now(), remember);
    }

    function guardRoute() {
        var path = window.location.pathname;
        var isAuthPage = /(login|signup|forgot-password|otp|reset-password)\.html$/.test(path) || path.endsWith('/');
        var isProtectedPage = /(dashboard|profile|settings)\.html$/.test(path);

        if (isAuthenticated() && isAuthPage && path.indexOf('dashboard.html') === -1) {
            window.location.replace(BillingUtils.getBasePath() + 'pages/dashboard.html');
            return;
        }

        if (!isAuthenticated() && isProtectedPage) {
            window.location.replace(BillingUtils.getBasePath() + 'pages/login.html');
        }
    }

    global.BillingAuth = {
        isAuthenticated: isAuthenticated,
        getSession: getSession,
        getUser: getUser,
        setSessionUser: setSessionUser,
        hydrateUserBindings: hydrateUserBindings,
        guardRoute: guardRoute,
        handleLoginSuccess: handleLoginSuccess,
        clearSession: clearSession,
        setResetContext: setResetContext,
        getResetContext: getResetContext,
        normalizeUser: normalizeUser,
        signOut: function () {
            clearSession();
            window.location.href = BillingUtils.getBasePath() + 'pages/login.html';
        }
    };
})(window);