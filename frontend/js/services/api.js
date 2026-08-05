(function (global) {
    'use strict';

    var ApiService = {};
    var config = {
        baseUrl: '/api/v1',
        timeout: 12000,
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        }
    };

    function buildUrl(endpoint) {
        return config.baseUrl + endpoint;
    }

    function getToken() {
        return localStorage.getItem('billing.session.token');
    }

    function buildHeaders() {
        var headers = Object.assign({}, config.headers);
        var token = getToken();
        if (token) {
            headers.Authorization = 'Bearer ' + token;
        }
        return headers;
    }

    function toQuery(params) {
        var searchParams = new URLSearchParams();
        Object.keys(params || {}).forEach(function (key) {
            var value = params[key];
            if (value !== undefined && value !== null && value !== '') {
                searchParams.append(key, String(value));
            }
        });
        return searchParams.toString();
    }

    async function parseResponse(response) {
        var contentType = response.headers.get('content-type') || '';
        var data = contentType.indexOf('application/json') >= 0 ? await response.json() : await response.text();

        if (!response.ok) {
            var error = new Error((data && data.message) || 'Request failed');
            error.status = response.status;
            error.data = data;
            throw error;
        }

        return data;
    }

    async function request(method, endpoint, body) {
        var controller = new AbortController();
        var timeoutId = setTimeout(function () {
            controller.abort();
        }, config.timeout);

        try {
            var options = {
                method: method,
                headers: buildHeaders(),
                signal: controller.signal
            };

            if (body && method !== 'GET' && method !== 'HEAD') {
                options.body = JSON.stringify(body);
            }

            var response = await fetch(buildUrl(endpoint), options);
            return await parseResponse(response);
        } catch (error) {
            if (error.name === 'AbortError') {
                throw new Error('Request timed out.');
            }

            if (error instanceof TypeError) {
                throw new Error('Network unavailable. Connect the backend to enable live requests.');
            }

            throw error;
        } finally {
            clearTimeout(timeoutId);
        }
    }

    ApiService.configure = function (options) {
        config = Object.assign({}, config, options || {});
    };

    ApiService.login = function (email, password) {
        return request('POST', '/auth/login', { email: email, password: password });
    };

    ApiService.signup = function (payload) {
        return request('POST', '/auth/signup', payload);
    };

    ApiService.logout = function () {
        return request('POST', '/auth/logout', {});
    };

    ApiService.forgotPassword = function (email) {
        return request('POST', '/auth/forgot-password', { email: email });
    };

    ApiService.verifyOTP = function (email, otp) {
        return request('POST', '/auth/verify-otp', { email: email, otp: otp });
    };

    ApiService.resetPassword = function (email, otp, newPassword) {
        return request('POST', '/auth/reset-password', {
            email: email,
            otp: otp,
            newPassword: newPassword
        });
    };

    ApiService.getDashboard = function () {
        return request('GET', '/dashboard');
    };

    ApiService.getRevenueData = function (period) {
        return request('GET', '/dashboard/revenue?' + toQuery({ period: period }));
    };

    ApiService.getTransactions = function (params) {
        return request('GET', '/dashboard/transactions?' + toQuery(params));
    };

    ApiService.getCustomers = function (params) {
        return request('GET', '/customers?' + toQuery(params));
    };

    ApiService.getCustomer = function (customerId) {
        return request('GET', '/customers/' + encodeURIComponent(customerId));
    };

    ApiService.getPlans = function () {
        return request('GET', '/plans');
    };

    ApiService.getSubscriptions = function (params) {
        return request('GET', '/subscriptions?' + toQuery(params));
    };

    ApiService.getInvoices = function (params) {
        return request('GET', '/invoices?' + toQuery(params));
    };

    ApiService.getPayments = function (params) {
        return request('GET', '/payments?' + toQuery(params));
    };

    ApiService.getAnalytics = function (params) {
        return request('GET', '/analytics?' + toQuery(params));
    };

    ApiService.updateProfile = function (payload) {
        return request('PUT', '/profile', payload);
    };

    ApiService.updateSettings = function (payload) {
        return request('PUT', '/settings', payload);
    };

    global.ApiService = ApiService;
})(window);