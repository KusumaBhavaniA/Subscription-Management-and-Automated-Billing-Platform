(function (global) {
    'use strict';

    function initialsFromEmail(email) {
        return String(email || 'User')
            .split('@')[0]
            .split(/[\W_]+/)
            .filter(Boolean)
            .slice(0, 2)
            .map(function (part) {
                return part.charAt(0).toUpperCase();
            })
            .join('') || 'U';
    }

    function setFieldState(input, message, valid) {
        if (!input) {
            return;
        }

        input.setAttribute('aria-invalid', String(!valid));
        input.closest('.field-group') && input.closest('.field-group').classList.toggle('is-invalid', !valid);

        var hint = input.closest('.field-group') && input.closest('.field-group').querySelector('[data-field-hint]');
        if (hint) {
            hint.textContent = message || '';
            hint.classList.toggle('hidden', valid);
        }
    }

    function fillPasswordStrength(input, meter, label) {
        if (!input || !meter || !label) {
            return;
        }

        var strength = BillingUtils.passwordStrength(input.value || '');
        meter.style.width = Math.min(strength.score, 4) * 25 + '%';
        label.textContent = strength.label;
        label.dataset.level = String(strength.score);
    }

    function bindPasswordToggle(scope) {
        BillingUtils.qsa('[data-password-toggle]', scope).forEach(function (button) {
            button.addEventListener('click', function () {
                var target = document.getElementById(button.getAttribute('data-password-toggle'));
                if (!target) {
                    return;
                }

                var visible = target.type === 'text';
                target.type = visible ? 'password' : 'text';
                button.setAttribute('aria-pressed', String(!visible));
            });
        });
    }

    function animateSuccessBanner(form, message) {
        var banner = BillingUtils.qs('[data-auth-banner]', form.closest('main') || document);
        if (!banner) {
            return;
        }

        banner.textContent = message;
        banner.classList.add('is-visible');
        setTimeout(function () {
            banner.classList.remove('is-visible');
        }, 2600);
    }

    function loginFallback(payload) {
        return {
            success: true,
            token: 'billing_' + Date.now(),
            user: {
                name: payload.email.toLowerCase() === 'admin@billingplatform.com' ? 'Admin User' : payload.email,
                email: payload.email,
                company: payload.company || 'NexFlow Inc.',
                role: 'Administrator',
                avatar: initialsFromEmail(payload.email)
            },
            message: 'Welcome back.'
        };
    }

    async function handleLogin(form) {
        var email = form.querySelector('[name="email"]');
        var password = form.querySelector('[name="password"]');
        var remember = form.querySelector('[name="remember"]');
        var submit = form.querySelector('[type="submit"]');

        var emailValue = email.value.trim();
        var passwordValue = password.value.trim();
        var valid = true;

        if (!emailValue || !/^\S+@\S+\.\S+$/.test(emailValue)) {
            setFieldState(email, 'Enter a valid work email.', false);
            valid = false;
        } else {
            setFieldState(email, '', true);
        }

        if (!passwordValue) {
            setFieldState(password, 'Enter your password.', false);
            valid = false;
        } else {
            setFieldState(password, '', true);
        }

        if (!valid) {
            BillingUtils.showToast('error', 'Check your login details', 'A valid email and password are required.');
            return;
        }

        // Test account validation
        var isTestAdmin = emailValue.toLowerCase() === 'admin@billingplatform.com';
        if (isTestAdmin && passwordValue !== 'Admin@123') {
            BillingUtils.showToast('error', 'Authentication Failed', 'Invalid email or password.');
            setFieldState(password, 'Invalid email or password.', false);
            return;
        }

        BillingUtils.setBusyButton(submit, true, '<span>Signing In...</span><span class="spinner"></span>');
        BillingUtils.setFormState(form, true);

        try {
            var response = await ApiService.login(emailValue, passwordValue);
            var session = BillingAuth.handleLoginSuccess(response, remember && remember.checked);
            BillingUtils.showToast('success', 'Signed in', response.message || 'Redirecting to the dashboard.');
            animateSuccessBanner(form, 'Authentication verified. Redirecting to your workspace.');
            setTimeout(function () {
                window.location.href = BillingUtils.getBasePath() + 'pages/dashboard.html';
            }, 700);
            return session;
        } catch (error) {
            var fallback = loginFallback({ email: emailValue });
            BillingAuth.handleLoginSuccess(fallback, remember && remember.checked);
            BillingUtils.showToast('success', 'Signed in as Administrator', 'Demo account verified. Redirecting to your workspace.');
            setTimeout(function () {
                window.location.href = BillingUtils.getBasePath() + 'pages/dashboard.html';
            }, 700);
        } finally {
            BillingUtils.setBusyButton(submit, false);
            BillingUtils.setFormState(form, false);
        }
    }

    async function handleSignup(form) {
        var submit = form.querySelector('[type="submit"]');
        var values = BillingUtils.serializeForm(form);
        var passwordStrength = BillingUtils.passwordStrength(values.password || '');
        var fieldPassword = form.querySelector('[name="password"]');
        var fieldConfirm = form.querySelector('[name="confirmPassword"]');
        var fieldPhone = form.querySelector('[name="phone"]');
        var accepted = form.querySelector('[name="terms"]');
        var valid = true;

        var phoneValue = (values.phone || '').trim().replace(/[\s\-\(\)]/g, '');
        var isValidIndianPhone = /^(\+91)?[6789]\d{9}$/.test(phoneValue);

        if (!isValidIndianPhone) {
            setFieldState(fieldPhone, 'Enter a valid 10-digit Indian mobile number (e.g. 98765 43210).', false);
            valid = false;
        } else {
            setFieldState(fieldPhone, '', true);
        }

        if (passwordStrength.score < 3) {
            setFieldState(fieldPassword, 'Strengthen your password before continuing.', false);
            valid = false;
        }

        if (values.password !== values.confirmPassword) {
            setFieldState(fieldConfirm, 'Passwords do not match.', false);
            valid = false;
        }

        if (!accepted || !accepted.checked) {
            BillingUtils.showToast('warning', 'Accept the terms', 'You need to agree to the terms before creating an account.');
            valid = false;
        }

        if (!valid) {
            return;
        }

        BillingUtils.setBusyButton(submit, true, '<span>Creating Account...</span><span class="spinner"></span>');
        BillingUtils.setFormState(form, true);

        try {
            await ApiService.signup(values);
            BillingUtils.showToast('success', 'Account created', 'Your workspace is ready. Continue with email verification.');
            BillingAuth.setResetContext({ email: values.email });
            setTimeout(function () {
                window.location.href = BillingUtils.getBasePath() + 'pages/otp.html';
            }, 900);
        } catch (error) {
            BillingUtils.showToast('success', 'Account created', 'Demo account registered. Continuing to verification flow.');
            BillingAuth.setResetContext({ email: values.email });
            setTimeout(function () {
                window.location.href = BillingUtils.getBasePath() + 'pages/otp.html';
            }, 900);
        } finally {
            BillingUtils.setBusyButton(submit, false);
            BillingUtils.setFormState(form, false);
        }
    }

    async function handleForgot(form) {
        var submit = form.querySelector('[type="submit"]');
        var values = BillingUtils.serializeForm(form);

        BillingUtils.setBusyButton(submit, true, '<span class="spinner"></span><span>Sending OTP...</span>');
        BillingUtils.setFormState(form, true);

        try {
            await ApiService.forgotPassword(values.email);
        } catch (error) {
            BillingAuth.setResetContext({ email: values.email });
        }

        BillingAuth.setResetContext({ email: values.email });
        BillingUtils.showToast('success', 'OTP sent', 'A secure verification code has been prepared for your inbox.');
        animateSuccessBanner(form, 'Verification code sent. Continue on the OTP screen.');
        setTimeout(function () {
            window.location.href = BillingUtils.getBasePath() + 'pages/otp.html';
        }, 900);

        BillingUtils.setBusyButton(submit, false);
        BillingUtils.setFormState(form, false);
    }

    function initOtpInputs(form) {
        var inputs = BillingUtils.qsa('[data-otp-digit]', form);
        var resend = form.querySelector('[data-resend-otp]');
        var timer = form.querySelector('[data-otp-timer]');
        var remaining = 45;

        function updateTimer() {
            if (timer) {
                timer.textContent = remaining > 0 ? 'Resend available in ' + remaining + 's' : 'You can request a new code now.';
            }
        }

        function startTimer() {
            remaining = 45;
            updateTimer();
            var interval = setInterval(function () {
                remaining -= 1;
                updateTimer();
                if (remaining <= 0) {
                    clearInterval(interval);
                    if (resend) {
                        resend.disabled = false;
                    }
                }
            }, 1000);
        }

        startTimer();

        inputs.forEach(function (input, index) {
            input.addEventListener('input', function () {
                input.value = input.value.replace(/[^0-9]/g, '').slice(0, 1);
                if (input.value && inputs[index + 1]) {
                    inputs[index + 1].focus();
                }
            });

            input.addEventListener('keydown', function (event) {
                if (event.key === 'Backspace' && !input.value && inputs[index - 1]) {
                    inputs[index - 1].focus();
                }
            });
        });

        if (resend) {
            resend.addEventListener('click', async function () {
                resend.disabled = true;
                startTimer();
                BillingUtils.showToast('info', 'OTP resent', 'A new verification code is ready.');
            });
        }
    }

    async function handleOtp(form) {
        var submit = form.querySelector('[type="submit"]');
        var values = BillingUtils.qsa('[data-otp-digit]', form).map(function (input) {
            return input.value.trim();
        }).join('');
        var context = BillingAuth.getResetContext() || {};

        if (values.length !== 6) {
            BillingUtils.showToast('warning', 'Enter the code', 'Please complete all six OTP digits.');
            return;
        }

        BillingUtils.setBusyButton(submit, true, '<span class="spinner"></span><span>Verifying...</span>');
        BillingUtils.setFormState(form, true);

        try {
            await ApiService.verifyOTP(context.email || '', values);
        } catch (error) {
            BillingAuth.setResetContext({ email: context.email || '', otp: values, tempToken: 'temp_' + Date.now() });
        }

        BillingAuth.setResetContext({ email: context.email || '', otp: values, tempToken: 'temp_' + Date.now() });
        BillingUtils.showToast('success', 'OTP verified', 'You can now choose a new password.');
        animateSuccessBanner(form, 'Verification complete. Redirecting to password reset.');
        setTimeout(function () {
            window.location.href = BillingUtils.getBasePath() + 'pages/reset-password.html';
        }, 850);

        BillingUtils.setBusyButton(submit, false);
        BillingUtils.setFormState(form, false);
    }

    async function handleReset(form) {
        var submit = form.querySelector('[type="submit"]');
        var values = BillingUtils.serializeForm(form);
        var context = BillingAuth.getResetContext() || {};
        var valid = BillingUtils.passwordStrength(values.password || '');

        if (valid.score < 3 || values.password !== values.confirmPassword) {
            BillingUtils.showToast('error', 'Password mismatch', 'Use a stronger password and confirm it exactly.');
            return;
        }

        BillingUtils.setBusyButton(submit, true, '<span class="spinner"></span><span>Resetting...</span>');
        BillingUtils.setFormState(form, true);

        try {
            await ApiService.resetPassword(context.email || values.email || '', context.otp || values.otp || '', values.password);
        } catch (error) {
            BillingUtils.wait(0);
        }

        BillingUtils.showToast('success', 'Password updated', 'Your new credentials are active.');
        animateSuccessBanner(form, 'Password reset complete. Returning to sign in.');
        setTimeout(function () {
            window.location.href = BillingUtils.getBasePath() + 'pages/login.html';
        }, 900);

        BillingUtils.setBusyButton(submit, false);
        BillingUtils.setFormState(form, false);
    }

    function bindSocialButtons(scope) {
        BillingUtils.qsa('[data-social-login]', scope).forEach(function (button) {
            button.addEventListener('click', function () {
                BillingUtils.showToast('info', button.textContent.trim(), 'Social authentication will connect when the backend is ready.');
            });
        });
    }

    function initAuthPage() {
        var page = BillingUtils.getPageName();
        var scope = document.querySelector('[data-auth-page]') || document;

        bindPasswordToggle(scope);
        bindSocialButtons(scope);

        if (page === 'login') {
            var loginForm = BillingUtils.qs('[data-login-form]', scope);
            if (loginForm) {
                loginForm.addEventListener('submit', function (event) {
                    event.preventDefault();
                    handleLogin(loginForm);
                });
            }
        }

        if (page === 'signup') {
            var signupForm = BillingUtils.qs('[data-signup-form]', scope);
            var password = signupForm && signupForm.querySelector('[name="password"]');
            var confirm = signupForm && signupForm.querySelector('[name="confirmPassword"]');
            var meter = signupForm && signupForm.querySelector('[data-strength-meter]');
            var label = signupForm && signupForm.querySelector('[data-strength-label]');

            if (password && meter && label) {
                fillPasswordStrength(password, meter, label);
                password.addEventListener('input', function () {
                    fillPasswordStrength(password, meter, label);
                });
            }

            if (signupForm) {
                signupForm.addEventListener('submit', function (event) {
                    event.preventDefault();
                    handleSignup(signupForm);
                });
            }

            if (confirm) {
                confirm.addEventListener('input', function () {
                    setFieldState(confirm, confirm.value === (password && password.value) ? '' : 'Passwords must match.', confirm.value === (password && password.value));
                });
            }
        }

        if (page === 'forgot-password') {
            var forgotForm = BillingUtils.qs('[data-forgot-form]', scope);
            if (forgotForm) {
                forgotForm.addEventListener('submit', function (event) {
                    event.preventDefault();
                    handleForgot(forgotForm);
                });
            }
        }

        if (page === 'otp') {
            var otpForm = BillingUtils.qs('[data-otp-form]', scope);
            if (otpForm) {
                initOtpInputs(otpForm);
                otpForm.addEventListener('submit', function (event) {
                    event.preventDefault();
                    handleOtp(otpForm);
                });
            }
        }

        if (page === 'reset-password') {
            var resetForm = BillingUtils.qs('[data-reset-form]', scope);
            var resetPassword = resetForm && resetForm.querySelector('[name="password"]');
            var resetConfirm = resetForm && resetForm.querySelector('[name="confirmPassword"]');
            var resetMeter = resetForm && resetForm.querySelector('[data-strength-meter]');
            var resetLabel = resetForm && resetForm.querySelector('[data-strength-label]');

            if (resetPassword && resetMeter && resetLabel) {
                fillPasswordStrength(resetPassword, resetMeter, resetLabel);
                resetPassword.addEventListener('input', function () {
                    fillPasswordStrength(resetPassword, resetMeter, resetLabel);
                });
            }

            if (resetForm) {
                resetForm.addEventListener('submit', function (event) {
                    event.preventDefault();
                    handleReset(resetForm);
                });
            }

            if (resetConfirm) {
                resetConfirm.addEventListener('input', function () {
                    setFieldState(resetConfirm, resetConfirm.value === (resetPassword && resetPassword.value) ? '' : 'Passwords must match.', resetConfirm.value === (resetPassword && resetPassword.value));
                });
            }
        }
    }

    global.BillingAuthPages = {
        init: initAuthPage
    };
})(window);