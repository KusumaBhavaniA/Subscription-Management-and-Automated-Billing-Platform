(function (global) {
    'use strict';

    var DASHBOARD_DATA = {
        metrics: [
            { label: 'Monthly Recurring Revenue', value: 1842000, format: 'currency', trend: '+18.4% MoM' },
            { label: 'Active Subscriptions', value: 48219, format: 'number', trend: '+9.2% MoM' },
            { label: 'Active Tier Plans', value: 14, format: 'number', trend: '+2 new' },
            { label: 'Paid Invoices', value: 12641, format: 'number', trend: '99.2% success' }
        ],
        revenueSeries: {
            '12m': [92, 98, 103, 110, 124, 132, 129, 141, 146, 155, 167, 182],
            '30d': [140, 142, 145, 148, 152, 155, 160, 164, 168, 172, 178, 182],
            '7d': [175, 176, 178, 179, 180, 181, 182]
        },
        barSeries: [18, 22, 27, 24, 30, 28, 34, 41],
        planMix: [44, 31, 18, 7],
        transactions: [
            { name: 'Northstar Labs', type: 'Enterprise annual renewal', amount: 24000, status: 'Paid', time: '2 min ago' },
            { name: 'Aster Commerce', type: 'Invoice #10482 settlement', amount: 8600, status: 'Processing', time: '9 min ago' },
            { name: 'Monarch Health', type: 'Subscription seat upgrade', amount: 12400, status: 'Paid', time: '22 min ago' },
            { name: 'Vertex Media', type: 'Automated dunning retry', amount: 3200, status: 'Pending', time: '41 min ago' },
            { name: 'Orbit Systems', type: 'Scale plan activation', amount: 18400, status: 'Paid', time: '58 min ago' }
        ],
        customers: [
            { name: 'Avery Chen', company: 'Northstar Labs', plan: 'Enterprise', status: 'Active', revenue: 4200 },
            { name: 'Mira Patel', company: 'Aster Commerce', plan: 'Scale', status: 'Active', revenue: 1800 },
            { name: 'Noah Wilson', company: 'Monarch Health', plan: 'Pro', status: 'Trial', revenue: 620 },
            { name: 'Sofia Garcia', company: 'Vertex Media', plan: 'Starter', status: 'Past Due', revenue: 280 }
        ],
        payments: [
            { channel: 'Credit / Debit Cards', count: '81.2%', color: 'var(--primary)' },
            { channel: 'ACH Direct Debit', count: '12.4%', color: 'var(--secondary)' },
            { channel: 'Wire Transfers', count: '6.4%', color: 'var(--accent)' }
        ],
        renewals: [
            { name: 'Northstar Labs', date: 'Tomorrow', value: 24000 },
            { name: 'Aster Commerce', date: 'In 3 days', value: 8600 },
            { name: 'Orbit Systems', date: 'In 5 days', value: 18400 },
            { name: 'Brightline Co.', date: 'In 7 days', value: 5400 }
        ],
        activity: [
            { title: 'Revenue Milestone Reached', meta: 'MRR crossed the $1.84M threshold this week.' },
            { title: 'Enterprise Contract Expanded', meta: 'Northstar Labs added 250 seat licenses.' },
            { title: 'Dunning Recovery Workflow', meta: 'Three failed renewals successfully recovered.' },
            { title: 'Payout Settlement Cleared', meta: 'Bank transfer settled in 12 minutes.' }
        ]
    };

    function renderMetricCards(root) {
        var container = BillingUtils.qs('[data-overview-grid]', root);
        if (!container) {
            return;
        }

        container.innerHTML = DASHBOARD_DATA.metrics.map(function (metric) {
            return '<article class="metric-card reveal-on-scroll" data-reveal data-mouse-glow>' +
                '<div class="metric-label">' + metric.label + '</div>' +
                '<div class="metric-value" data-counter="' + metric.value + '" data-counter-format="' + metric.format + '">$0</div>' +
                '<div class="metric-trend is-up">' + metric.trend + '</div>' +
            '</article>';
        }).join('');
    }

    function renderLineChart(root, period) {
        period = period || '12m';
        var host = BillingUtils.qs('[data-line-chart]', root);
        if (!host) {
            return;
        }

        var series = DASHBOARD_DATA.revenueSeries[period] || DASHBOARD_DATA.revenueSeries['12m'];
        var max = Math.max.apply(Math, series);
        var width = 900;
        var height = 240;
        var padding = 20;

        var points = series.map(function (value, index) {
            var x = padding + (index * (width - padding * 2) / (series.length - 1));
            var y = height - padding - ((value / max) * (height - padding * 2));
            return [x, y];
        });

        var line = points.map(function (point) { return point.join(','); }).join(' ');
        var area = 'M ' + points[0][0] + ' ' + (height - padding) + ' L ' + line + ' L ' + points[points.length - 1][0] + ' ' + (height - padding) + ' Z';

        host.innerHTML = '<svg viewBox="0 0 ' + width + ' ' + height + '" preserveAspectRatio="none" aria-hidden="true">' +
            '<defs><linearGradient id="revenue-fill" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stop-color="rgba(37,99,235,0.4)"/><stop offset="100%" stop-color="rgba(37,99,235,0)"/></linearGradient></defs>' +
            '<path d="' + area + '" fill="url(#revenue-fill)"></path>' +
            '<polyline points="' + line + '" fill="none" stroke="var(--primary)" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"></polyline>' +
            points.map(function (point) {
                return '<circle cx="' + point[0] + '" cy="' + point[1] + '" r="5" fill="#fff" stroke="var(--primary)" stroke-width="3.5"></circle>';
            }).join('') +
        '</svg>';
    }

    function renderBarChart(root) {
        var host = BillingUtils.qs('[data-bar-chart]', root);
        if (!host) {
            return;
        }

        var max = Math.max.apply(Math, DASHBOARD_DATA.barSeries);
        host.innerHTML = DASHBOARD_DATA.barSeries.map(function (value, index) {
            return '<span style="height:' + ((value / max) * 100) + '%; animation-delay:' + (index * 60) + 'ms" title="' + value + ' invoices"></span>';
        }).join('');
    }

    function renderPieChart(root) {
        var host = BillingUtils.qs('[data-pie-chart]', root);
        if (!host) {
            return;
        }

        var values = DASHBOARD_DATA.planMix;
        var total = values.reduce(function (sum, value) { return sum + value; }, 0);
        var start = 0;
        var stops = values.map(function (value, index) {
            var size = (value / total) * 100;
            var color = ['#2563eb', '#4f46e5', '#22c55e', '#f59e0b'][index];
            var stop = start + size;
            var segment = color + ' ' + start + '% ' + stop + '%';
            start = stop;
            return segment;
        });

        host.innerHTML = '<div class="pie-surface" style="background: conic-gradient(' + stops.join(', ') + ');"><div class="pie-hole"></div></div>';
    }

    function renderTransactions(root) {
        var container = BillingUtils.qs('[data-transactions]', root);
        if (!container) {
            return;
        }

        container.innerHTML = DASHBOARD_DATA.transactions.map(function (row) {
            return '<div class="transaction-row">' +
                '<div><div class="list-title">' + row.name + '</div><div class="list-subtitle">' + row.type + '</div></div>' +
                '<div style="text-align:right"><div class="list-title">' + BillingUtils.formatCurrency(row.amount) + '</div><div class="list-meta">' + row.time + ' · <span style="color:var(--accent);">' + row.status + '</span></div></div>' +
            '</div>';
        }).join('');
    }

    function renderCustomers(root) {
        var container = BillingUtils.qs('[data-customers]', root);
        if (!container) {
            return;
        }

        container.innerHTML = DASHBOARD_DATA.customers.map(function (row) {
            return '<div class="customer-row">' +
                '<div><div class="list-title">' + row.name + '</div><div class="list-subtitle">' + row.company + '</div></div>' +
                '<div style="text-align:right"><div class="list-title">' + row.plan + '</div><div class="list-meta">' + row.status + ' · ' + BillingUtils.formatCurrency(row.revenue) + '/mo</div></div>' +
            '</div>';
        }).join('');
    }

    function renderPayments(root) {
        var container = BillingUtils.qs('[data-payments]', root);
        if (!container) {
            return;
        }

        container.innerHTML = DASHBOARD_DATA.payments.map(function (row) {
            return '<div class="payment-row"><div><div class="list-title">' + row.channel + '</div><div class="list-subtitle">Volume contribution</div></div><div class="list-title">' + row.count + '</div></div>';
        }).join('');
    }

    function renderRenewals(root) {
        var container = BillingUtils.qs('[data-renewals]', root);
        if (!container) {
            return;
        }

        container.innerHTML = DASHBOARD_DATA.renewals.map(function (row) {
            return '<div class="activity-item"><div><div class="list-title">' + row.name + '</div><div class="list-subtitle">' + row.date + '</div></div><div class="list-title">' + BillingUtils.formatCurrency(row.value) + '</div></div>';
        }).join('');
    }

    function renderActivity(root) {
        var container = BillingUtils.qs('[data-activity]', root);
        if (!container) {
            return;
        }

        container.innerHTML = DASHBOARD_DATA.activity.map(function (row) {
            return '<div class="timeline-item reveal-on-scroll" data-reveal><span class="timeline-dot"></span><div class="timeline-card"><div class="list-title">' + row.title + '</div><div class="list-subtitle">' + row.meta + '</div></div></div>';
        }).join('');
    }

    function bindShell(root) {
        var page = BillingUtils.getPageName();

        BillingUtils.qsa('[data-nav-link]', root).forEach(function (link) {
            if (link.getAttribute('data-nav-link') === page) {
                link.classList.add('is-active');
            }
        });

        // Search bar handler
        var search = BillingUtils.qs('[data-dashboard-search]', root);
        if (search) {
            search.addEventListener('input', function (e) {
                var query = e.target.value.toLowerCase().trim();
                if (query.length > 2) {
                    BillingUtils.showToast('info', 'Searching workspace', 'Filtering results for "' + query + '"');
                }
            });
        }

        // Modal Close/Confirm logic
        var modalClose = BillingUtils.qs('[data-modal-close]');
        var modalCancel = BillingUtils.qs('[data-modal-cancel]');
        var modalConfirm = BillingUtils.qs('[data-modal-confirm]');
        var modalOverlay = BillingUtils.qs('[data-modal-overlay]');

        function hideModal() {
            if (modalOverlay) {
                modalOverlay.classList.add('hidden');
                modalOverlay.style.display = 'none';
            }
        }

        if (modalClose) modalClose.addEventListener('click', hideModal);
        if (modalCancel) modalCancel.addEventListener('click', hideModal);
        if (modalConfirm) {
            modalConfirm.addEventListener('click', function () {
                hideModal();
                BillingUtils.showToast('success', 'Invoice Prepared', 'Invoice draft created successfully.');
            });
        }

        // Period picker buttons
        BillingUtils.qsa('[data-period]', root).forEach(function (btn) {
            btn.addEventListener('click', function () {
                BillingUtils.qsa('[data-period]', root).forEach(function (b) { b.classList.remove('is-active'); });
                btn.classList.add('is-active');
                renderLineChart(root, btn.getAttribute('data-period'));
            });
        });
    }

    function bindProfilePage(root) {
        var profileForm = BillingUtils.qs('[data-profile-form]', root);
        if (!profileForm) {
            return;
        }

        var user = BillingAuth.hydrateUserBindings();
        profileForm.elements.name && (profileForm.elements.name.value = user.name || '');
        profileForm.elements.email && (profileForm.elements.email.value = user.email || '');
        profileForm.elements.company && (profileForm.elements.company.value = user.company || '');
        profileForm.elements.phone && (profileForm.elements.phone.value = user.phone || '');

        profileForm.addEventListener('submit', function (event) {
            event.preventDefault();
            var values = BillingUtils.serializeForm(profileForm);
            BillingAuth.setSessionUser({
                name: values.name,
                email: values.email,
                company: values.company,
                phone: values.phone
            });
            BillingUtils.showToast('success', 'Profile updated', 'Your workspace profile has been saved.');
        });
    }

    function bindSettingsPage(root) {
        var settingsForm = BillingUtils.qs('[data-settings-form]', root);
        if (settingsForm) {
            settingsForm.addEventListener('submit', function (event) {
                event.preventDefault();
                BillingUtils.showToast('success', 'Settings saved', 'Workspace preferences updated.');
            });
        }

        var copyBtn = BillingUtils.qs('[data-copy-key]', root);
        if (copyBtn) {
            copyBtn.addEventListener('click', function () {
                BillingUtils.showToast('success', 'Copied to clipboard', 'Production API secret key copied.');
            });
        }
    }

    function render404(root) {
        var action = BillingUtils.qs('[data-404-action]', root);
        if (action) {
            action.addEventListener('click', function () {
                window.location.href = BillingUtils.getBasePath() + 'pages/dashboard.html';
            });
        }
    }

    function init(root) {
        root = root || document;
        var page = BillingUtils.getPageName();

        if (page === 'dashboard') {
            renderMetricCards(root);
            renderLineChart(root, '12m');
            renderBarChart(root);
            renderPieChart(root);
            renderTransactions(root);
            renderCustomers(root);
            renderPayments(root);
            renderRenewals(root);
            renderActivity(root);
            bindShell(root);
        }

        if (page === 'profile') {
            bindProfilePage(root);
            bindShell(root);
        }

        if (page === 'settings') {
            bindSettingsPage(root);
            bindShell(root);
        }

        if (page === '404') {
            render404(root);
        }

        BillingUtils.observeReveal('[data-reveal]');
        BillingUtils.qsa('[data-counter]').forEach(function (node) {
            var value = Number(node.getAttribute('data-counter')) || 0;
            var format = node.getAttribute('data-counter-format') || 'number';
            BillingUtils.animateCounter(node, value, {
                duration: 1300,
                formatter: function (current) {
                    if (format === 'currency') {
                        return BillingUtils.formatCurrency(current);
                    }
                    return BillingUtils.formatNumber(current);
                }
            });
        });
    }

    global.BillingDashboard = {
        init: init,
        data: DASHBOARD_DATA
    };
})(window);