(() => {

    // =========================================================
    // HELPERS
    // =========================================================

    const $ = (selector, root = document) =>
        root.querySelector(selector);

    const $$ = (selector, root = document) =>
        [...root.querySelectorAll(selector)];


    // =========================================================
    // TOAST
    // =========================================================

    const toast = $('#toast');
    let toastTimer = null;

    function showToast(message) {

        if (!toast) return;

        toast.textContent = message;
        toast.classList.add('show');

        clearTimeout(toastTimer);

        toastTimer = setTimeout(() => {
            toast.classList.remove('show');
        }, 2800);
    }


    // =========================================================
    // THEME
    // =========================================================

    const root = document.documentElement;
    const themeBtn = $('#themeBtn');

    try {

        root.dataset.theme =
            localStorage.getItem('pm-theme') || 'light';

    } catch (error) {

        root.dataset.theme = 'light';

    }


    if (themeBtn) {

        themeBtn.addEventListener('click', () => {

            root.dataset.theme =
                root.dataset.theme === 'dark'
                    ? 'light'
                    : 'dark';

            try {

                localStorage.setItem(
                    'pm-theme',
                    root.dataset.theme
                );

            } catch (error) {}

        });

    }


    // =========================================================
    // EMAIL / MOBILE TABS
    // =========================================================

    const tabs = $('.tabs');
    const tabButtons = $$('.tab');

    const emailForm = $('#emailForm');
    const mobileForm = $('#mobileForm');


    function switchMode(mode) {

        if (!tabs) return;

        tabs.dataset.mode = mode;

        tabButtons.forEach(button => {

            const active =
                button.dataset.mode === mode;

            button.classList.toggle(
                'active',
                active
            );

            button.setAttribute(
                'aria-selected',
                active ? 'true' : 'false'
            );

        });


        if (emailForm) {

            emailForm.classList.toggle(
                'hidden',
                mode !== 'email'
            );

        }


        if (mobileForm) {

            mobileForm.classList.toggle(
                'hidden',
                mode !== 'mobile'
            );

        }

    }


    tabButtons.forEach(button => {

        button.addEventListener('click', () => {

            const mode =
                button.dataset.mode;

            if (
                mode === 'email' ||
                mode === 'mobile'
            ) {

                switchMode(mode);

            }

        });

    });


    if (tabs) {

        switchMode(
            tabs.dataset.mode || 'email'
        );

    }


    // =========================================================
    // ERROR HELPER
    // =========================================================

    function setErr(id, message) {

        const errorElement =
            $('#' + id);

        if (!errorElement) return;

        errorElement.textContent =
            message;

        const field =
            errorElement.previousElementSibling;

        if (
            field &&
            field.classList.contains('field')
        ) {

            field.classList.toggle(
                'bad',
                Boolean(message)
            );

        }

    }


    // =========================================================
    // BUTTON LOADING
    // =========================================================

    function busy(button, loading, text) {

        if (!button) return;

        button.classList.toggle(
            'loading',
            loading
        );

        button.disabled = loading;

        if (text) {

            button.textContent = text;

        }

    }


    // =========================================================
    // PASSWORD
    // =========================================================

    const pass = $('#pass');
    const togglePass = $('#togglePass');
    const meter = $('#meter');


    if (pass) {

        if (togglePass) {

            togglePass.addEventListener(
                'click',
                event => {

                    const show =
                        pass.type === 'password';

                    pass.type =
                        show
                            ? 'text'
                            : 'password';

                    event.target.textContent =
                        show
                            ? 'Hide'
                            : 'Show';

                }
            );

        }


        function strength(password) {

            let score = 0;

            if (password.length >= 8) {
                score++;
            }

            if (
                /[A-Z]/.test(password) &&
                /[a-z]/.test(password)
            ) {
                score++;
            }

            if (/\d/.test(password)) {
                score++;
            }

            if (
                /[^A-Za-z0-9]/.test(password)
            ) {
                score++;
            }

            return password
                ? Math.max(score, 1)
                : 0;

        }


        if (meter) {

            pass.addEventListener(
                'input',
                () => {

                    meter.dataset.s =
                        strength(pass.value);

                }
            );

        }

    }


    // =========================================================
    // EMAIL OTP
    // =========================================================

    const emailInput =
        $('#email');

    const passwordInput =
        $('#pass');

    const emailOtpBtn =
        $('#emailOtpBtn');

    const emailOtpWrap =
        $('#emailOtpWrap');

    const emailSentTo =
        $('#emailSentTo');

    const emailOtpBoxes =
        $$('#emailOtp input');

    const emailOtpErr =
        $('#emailOtpErr');

    const emailResend =
        $('#emailResend');

    const verifyEmailOtpBtn =
        $('#verifyEmailOtpBtn');

    const createEmailAccountBtn =
        $('#createEmailAccountBtn');


    let emailOtpSent = false;
    let emailOtpVerified = false;
    let emailOtpCountdown = null;


    // =========================================================
    // EMAIL OTP INPUT BOXES
    // =========================================================

    emailOtpBoxes.forEach((box, index) => {

        box.addEventListener(
            'input',
            () => {

                box.value =
                    box.value
                        .replace(/\D/g, '')
                        .slice(0, 1);


                if (
                    box.value &&
                    emailOtpBoxes[index + 1]
                ) {

                    emailOtpBoxes[index + 1].focus();

                }

            }
        );


        box.addEventListener(
            'keydown',
            event => {

                if (
                    event.key === 'Backspace' &&
                    !box.value &&
                    emailOtpBoxes[index - 1]
                ) {

                    emailOtpBoxes[index - 1].focus();

                }

            }
        );


        box.addEventListener(
            'paste',
            event => {

                const data =
                    (
                        event.clipboardData
                            .getData('text') || ''
                    )
                    .replace(/\D/g, '')
                    .slice(0, 6);


                if (!data) return;

                event.preventDefault();


                data.split('').forEach(
                    (digit, i) => {

                        if (emailOtpBoxes[i]) {

                            emailOtpBoxes[i].value =
                                digit;

                        }

                    }
                );


                const nextIndex =
                    Math.min(
                        data.length,
                        emailOtpBoxes.length - 1
                    );


                if (emailOtpBoxes[nextIndex]) {

                    emailOtpBoxes[nextIndex].focus();

                }

            }
        );

    });


    // =========================================================
    // EMAIL OTP TIMER
    // =========================================================

    function startEmailOtpTimer() {

        if (!emailResend) return;

        let seconds = 30;

        emailResend.disabled = true;

        clearInterval(emailOtpCountdown);

        emailResend.textContent =
            `Resend code in ${seconds}s`;


        emailOtpCountdown =
            setInterval(() => {

                seconds--;


                if (seconds <= 0) {

                    clearInterval(
                        emailOtpCountdown
                    );

                    emailResend.disabled =
                        false;

                    emailResend.textContent =
                        'Resend code';

                } else {

                    emailResend.textContent =
                        `Resend code in ${seconds}s`;

                }

            }, 1000);

    }


    // =========================================================
    // SEND EMAIL OTP
    // =========================================================

    async function sendEmailOTP() {

        if (
            !emailInput ||
            !emailOtpBtn ||
            !emailForm
        ) {
            return;
        }


        const email =
            emailInput.value
                .trim()
                .toLowerCase();


        // =====================================================
        // EMAIL VALIDATION
        // =====================================================

        if (
            !/^\S+@\S+\.\S+$/.test(email)
        ) {

            setErr(
                'emailErr',
                'Enter a valid email address.'
            );

            emailInput.focus();

            return;

        }


        setErr('emailErr', '');
        setErr('emailOtpErr', '');


        // =====================================================
        // CSRF TOKEN
        // =====================================================

        const csrfToken =
            emailForm.querySelector(
                'input[name="csrfmiddlewaretoken"]'
            )?.value;


        if (!csrfToken) {

            setErr(
                'emailErr',
                'Security token missing. Please refresh the page.'
            );

            return;

        }


        // =====================================================
        // SEND REQUEST TO DJANGO
        // =====================================================

        try {

            busy(
                emailOtpBtn,
                true,
                'Sending OTP...'
            );


            const response =
                await fetch(
                    '/register/send-email-otp/',
                    {
                        method: 'POST',

                        headers: {
                            'Content-Type':
                                'application/x-www-form-urlencoded',

                            'X-CSRFToken':
                                csrfToken
                        },

                        body:
                            new URLSearchParams({
                                email: email
                            })
                    }
                );


            const data =
                await response.json();


            console.log(
                'SEND EMAIL OTP RESPONSE:',
                data
            );


            if (!data.success) {

                setErr(
                    'emailErr',
                    data.message ||
                    'Unable to send OTP.'
                );

                busy(
                    emailOtpBtn,
                    false,
                    'Send OTP'
                );

                return;

            }


            // =================================================
            // OTP SENT
            // =================================================

            emailOtpSent = true;
            emailOtpVerified = false;


            if (emailSentTo) {

                emailSentTo.textContent =
                    email;

            }


            if (emailOtpWrap) {

                emailOtpWrap.classList.remove(
                    'hidden'
                );

            }


            emailOtpBoxes.forEach(box => {
                box.value = '';
            });


            emailOtpBtn.disabled = true;

            emailOtpBtn.textContent =
                'OTP Sent';


            if (verifyEmailOtpBtn) {

                verifyEmailOtpBtn.disabled =
                    false;

                verifyEmailOtpBtn.textContent =
                    'Verify Email';

            }


            if (createEmailAccountBtn) {

                createEmailAccountBtn.disabled =
                    true;

            }


            showToast(
                'OTP sent to your email.'
            );


            startEmailOtpTimer();


            if (emailOtpBoxes[0]) {

                emailOtpBoxes[0].focus();

            }


        } catch (error) {

            console.error(
                'EMAIL OTP ERROR:',
                error
            );


            setErr(
                'emailErr',
                'Unable to send OTP. Please try again.'
            );


            busy(
                emailOtpBtn,
                false,
                'Send OTP'
            );

        }

    }


    // =========================================================
    // VERIFY EMAIL OTP
    // =========================================================

    async function verifyEmailOTP() {

        if (
            !emailInput ||
            !verifyEmailOtpBtn ||
            !emailForm
        ) {
            return;
        }


        if (!emailOtpSent) {

            setErr(
                'emailOtpErr',
                'Please request an OTP first.'
            );

            return;

        }


        const email =
            emailInput.value
                .trim()
                .toLowerCase();


        const otp =
            emailOtpBoxes
                .map(box => box.value)
                .join('');


        // =====================================================
        // OTP VALIDATION
        // =====================================================

        if (otp.length !== 6) {

            setErr(
                'emailOtpErr',
                'Enter all 6 digits.'
            );

            return;

        }


        const csrfToken =
            emailForm.querySelector(
                'input[name="csrfmiddlewaretoken"]'
            )?.value;


        if (!csrfToken) {

            setErr(
                'emailOtpErr',
                'Security token missing. Please refresh the page.'
            );

            return;

        }


        try {

            busy(
                verifyEmailOtpBtn,
                true,
                'Verifying...'
            );


            const response =
                await fetch(
                    '/register/verify-email-otp/',
                    {
                        method: 'POST',

                        headers: {
                            'Content-Type':
                                'application/x-www-form-urlencoded',

                            'X-CSRFToken':
                                csrfToken
                        },

                        body:
                            new URLSearchParams({
                                email: email,
                                otp: otp
                            })
                    }
                );


            const data =
                await response.json();


            console.log(
                'VERIFY EMAIL OTP RESPONSE:',
                data
            );


            if (!data.success) {

                setErr(
                    'emailOtpErr',
                    data.message ||
                    'Invalid OTP.'
                );

                busy(
                    verifyEmailOtpBtn,
                    false,
                    'Verify Email'
                );

                return;

            }


            // =================================================
            // EMAIL VERIFIED
            // =================================================

            emailOtpVerified = true;


            setErr(
                'emailOtpErr',
                ''
            );


            showToast(
                'Email verified successfully!'
            );


            verifyEmailOtpBtn.textContent =
                'Email Verified ✓';

            verifyEmailOtpBtn.disabled =
                true;


            if (emailOtpBtn) {

                emailOtpBtn.textContent =
                    'Email Verified ✓';

                emailOtpBtn.disabled =
                    true;

            }


            if (emailInput) {

                emailInput.readOnly =
                    true;

            }


            if (createEmailAccountBtn) {

                createEmailAccountBtn.disabled =
                    false;

            }

        } catch (error) {

            console.error(
                'VERIFY EMAIL OTP ERROR:',
                error
            );


            busy(
                verifyEmailOtpBtn,
                false,
                'Verify Email'
            );


            setErr(
                'emailOtpErr',
                'Unable to verify OTP. Please try again.'
            );

        }

    }


    // =========================================================
    // SEND EMAIL OTP BUTTON
    // =========================================================

    if (emailOtpBtn) {

        emailOtpBtn.addEventListener(
            'click',
            async event => {

                event.preventDefault();

                await sendEmailOTP();

            }
        );

    }


    // =========================================================
    // VERIFY EMAIL OTP BUTTON
    // =========================================================

    if (verifyEmailOtpBtn) {

        verifyEmailOtpBtn.addEventListener(
            'click',
            async event => {

                event.preventDefault();

                await verifyEmailOTP();

            }
        );

    }


    // =========================================================
    // RESEND EMAIL OTP
    // =========================================================

    if (emailResend) {

        emailResend.addEventListener(
            'click',
            async () => {

                if (emailResend.disabled) {
                    return;
                }


                emailOtpBoxes.forEach(box => {
                    box.value = '';
                });


                emailOtpSent = false;
                emailOtpVerified = false;


                if (verifyEmailOtpBtn) {

                    verifyEmailOtpBtn.disabled =
                        false;

                    verifyEmailOtpBtn.textContent =
                        'Verify Email';

                }


                await sendEmailOTP();

            }
        );

    }


    // =========================================================
    // EMAIL FORM SUBMIT
    // =========================================================

    if (emailForm) {

        emailForm.addEventListener(
            'submit',
            event => {

                const email =
                    emailInput
                        ? emailInput.value.trim()
                        : '';


                const password =
                    passwordInput
                        ? passwordInput.value
                        : '';


                let valid = true;


                // ---------------------------------------------
                // EMAIL
                // ---------------------------------------------

                if (
                    !/^\S+@\S+\.\S+$/.test(email)
                ) {

                    setErr(
                        'emailErr',
                        'Enter a valid email address.'
                    );

                    valid = false;

                } else {

                    setErr(
                        'emailErr',
                        ''
                    );

                }


                // ---------------------------------------------
                // PASSWORD
                // ---------------------------------------------

                if (password.length < 6) {

                    setErr(
                        'passErr',
                        'Password must be at least 6 characters.'
                    );

                    valid = false;

                } else {

                    setErr(
                        'passErr',
                        ''
                    );

                }


                // ---------------------------------------------
                // EMAIL OTP
                // ---------------------------------------------


               


                // ---------------------------------------------
                // STOP SUBMIT
                // ---------------------------------------------

                if (!valid) {

                    event.preventDefault();

                    return;

                }


                // ---------------------------------------------
                // ACCOUNT CREATION
                // ---------------------------------------------

                const button =
                    event.submitter ||
                    createEmailAccountBtn;


                busy(
                    button,
                    true,
                    'Creating account...'
                );

                // Django receives the POST normally.

            }
        );

    }


    // =========================================================
    // FIREBASE MOBILE OTP
    // =========================================================

    const phone =
        $('#phone');

    const mobileFormElement =
        $('#mobileForm');

    const otpWrap =
        $('#otpWrap');

    const mobileBtn =
        $('#mobileBtn');

    const otpBoxes =
        $$('#otp input');

    const resendButton =
        $('#resend');


    let confirmationResult =
        null;

    let otpSent =
        false;

    let countdown =
        null;


    // =========================================================
    // PHONE INPUT
    // =========================================================

    if (phone) {

        phone.addEventListener(
            'input',
            () => {

                phone.value =
                    phone.value
                        .replace(/\D/g, '')
                        .slice(0, 10);

            }
        );

    }


    // =========================================================
    // MOBILE OTP BOXES
    // =========================================================

    otpBoxes.forEach((box, index) => {

        box.addEventListener(
            'input',
            () => {

                box.value =
                    box.value
                        .replace(/\D/g, '')
                        .slice(0, 1);


                if (
                    box.value &&
                    otpBoxes[index + 1]
                ) {

                    otpBoxes[index + 1].focus();

                }

            }
        );


        box.addEventListener(
            'keydown',
            event => {

                if (
                    event.key === 'Backspace' &&
                    !box.value &&
                    otpBoxes[index - 1]
                ) {

                    otpBoxes[index - 1].focus();

                }

            }
        );


        box.addEventListener(
            'paste',
            event => {

                const data =
                    (
                        event.clipboardData
                            .getData('text') || ''
                    )
                    .replace(/\D/g, '')
                    .slice(0, 6);


                if (!data) return;

                event.preventDefault();


                data.split('').forEach(
                    (digit, i) => {

                        if (otpBoxes[i]) {

                            otpBoxes[i].value =
                                digit;

                        }

                    }
                );


                const nextIndex =
                    Math.min(
                        data.length,
                        otpBoxes.length - 1
                    );


                if (otpBoxes[nextIndex]) {

                    otpBoxes[nextIndex].focus();

                }

            }
        );

    });


    // =========================================================
    // MOBILE OTP TIMER
    // =========================================================

    function startTimer() {

        if (!resendButton) return;

        let seconds = 30;

        resendButton.disabled =
            true;

        clearInterval(countdown);


        resendButton.textContent =
            `Resend code in ${seconds}s`;


        countdown =
            setInterval(() => {

                seconds--;


                if (seconds <= 0) {

                    clearInterval(countdown);

                    resendButton.disabled =
                        false;

                    resendButton.textContent =
                        'Resend code';

                } else {

                    resendButton.textContent =
                        `Resend code in ${seconds}s`;

                }

            }, 1000);

    }


    // =========================================================
    // SHOW MOBILE OTP AREA
    // =========================================================

    function showOtpArea(number) {

        otpSent = true;


        const recaptchaContainer =
            document.getElementById(
                'recaptcha-container'
            );


        if (recaptchaContainer) {

            if (window.recaptchaVerifier) {

                try {

                    window.recaptchaVerifier.clear();

                } catch (error) {

                    console.error(
                        'reCAPTCHA clear error:',
                        error
                    );

                }

                window.recaptchaVerifier =
                    null;

            }


            recaptchaContainer.innerHTML =
                '';

            recaptchaContainer.classList.remove(
                'recaptcha-visible'
            );

        }


        const sentTo =
            $('#sentTo');


        if (sentTo) {

            sentTo.textContent =
                '+91 ' + number;

        }


        if (otpWrap) {

            otpWrap.classList.remove(
                'hidden'
            );

        }


        if (mobileBtn) {

            mobileBtn.textContent =
                'Verify OTP';

            mobileBtn.disabled =
                false;

        }


        if (otpBoxes[0]) {

            otpBoxes[0].focus();

        }


        startTimer();

    }


    // =========================================================
    // CREATE reCAPTCHA
    // =========================================================

    function createRecaptcha() {

        if (
            typeof firebase === 'undefined' ||
            !firebase.auth
        ) {

            throw new Error(
                'Firebase Auth is not loaded.'
            );

        }


        const container =
            document.getElementById(
                'recaptcha-container'
            );


        if (!container) {

            throw new Error(
                'reCAPTCHA container not found.'
            );

        }


        if (window.recaptchaVerifier) {

            return window.recaptchaVerifier;

        }


        container.innerHTML =
            '';


        window.recaptchaVerifier =
            new firebase.auth.RecaptchaVerifier(
                'recaptcha-container',
                {

                    size: 'normal',

                    callback: function() {

                        console.log(
                            'reCAPTCHA verified successfully.'
                        );

                        container.dataset.verified =
                            'true';

                    },

                    'expired-callback':
                        function() {

                            console.log(
                                'reCAPTCHA expired.'
                            );

                            container.dataset.verified =
                                'false';

                        }

                }
            );


        container.dataset.verified =
            'false';


        container.classList.add(
            'recaptcha-visible'
        );


        return window.recaptchaVerifier;

    }


    // =========================================================
    // SEND FIREBASE MOBILE OTP
    // =========================================================

    async function sendFirebaseOTP() {

        if (
            !phone ||
            !mobileBtn
        ) {
            return;
        }


        const number =
            phone.value.trim();


        // =====================================================
        // VALIDATE MOBILE
        // =====================================================

        if (
            !/^[6-9]\d{9}$/.test(number)
        ) {

            setErr(
                'phoneErr',
                'Enter a valid 10-digit Indian mobile number.'
            );

            phone.focus();

            return;

        }


        setErr(
            'phoneErr',
            ''
        );


        // =====================================================
        // REGISTRATION / LOGIN
        // =====================================================

        const registerType =
            mobileFormElement?.querySelector(
                'input[name="register_type"]'
            );


        const isRegistration =
            registerType &&
            registerType.value === 'mobile';


        const isLogin =
            !isRegistration;


        try {

            const csrfToken =
                mobileFormElement?.querySelector(
                    'input[name="csrfmiddlewaretoken"]'
                )?.value;


            if (!csrfToken) {

                throw new Error(
                    'CSRF token not found.'
                );

            }


            // =================================================
            // CHECK DATABASE
            // =================================================

            busy(
                mobileBtn,
                true,
                'Checking...'
            );


            const response =
                await fetch(
                    '/check-mobile/',
                    {

                        method: 'POST',

                        headers: {

                            'Content-Type':
                                'application/x-www-form-urlencoded',

                            'X-CSRFToken':
                                csrfToken

                        },

                        body:
                            new URLSearchParams({
                                phone: number
                            })

                    }
                );


            const data =
                await response.json();


            console.log(
                'MOBILE DATABASE CHECK:',
                data
            );


            // =================================================
            // LOGIN
            // =================================================

            if (isLogin) {

                if (!data.registered) {

                    busy(
                        mobileBtn,
                        false,
                        'Send OTP'
                    );

                    setErr(
                        'phoneErr',
                        'This mobile number is not registered. Please create an account first.'
                    );

                    return;

                }

            }


            // =================================================
            // REGISTRATION
            // =================================================

            if (isRegistration) {

                if (data.registered) {

                    busy(
                        mobileBtn,
                        false,
                        'Send OTP'
                    );

                    setErr(
                        'phoneErr',
                        'This mobile number is already registered. Please sign in.'
                    );

                    return;

                }

            }


            // =================================================
            // CREATE CAPTCHA
            // =================================================

            busy(
                mobileBtn,
                true,
                'Verify CAPTCHA...'
            );


            const fullPhone =
                '+91' + number;


            const verifier =
                createRecaptcha();


            // Render only when needed
            if (!window.recaptchaWidgetId) {

                window.recaptchaWidgetId =
                    await verifier.render();

            }


            const recaptchaContainer =
                document.getElementById(
                    'recaptcha-container'
                );


            // =================================================
            // USER MUST VERIFY CAPTCHA
            // =================================================

            if (
                !recaptchaContainer ||
                recaptchaContainer.dataset.verified !== 'true'
            ) {

                busy(
                    mobileBtn,
                    false,
                    'Send OTP'
                );

                setErr(
                    'phoneErr',
                    'Please verify "I\'m not a robot" first.'
                );

                return;

            }


            // =================================================
            // SEND FIREBASE OTP
            // =================================================

            busy(
                mobileBtn,
                true,
                'Sending OTP...'
            );


            confirmationResult =
                await firebase
                    .auth()
                    .signInWithPhoneNumber(
                        fullPhone,
                        verifier
                    );


            console.log(
                'Firebase OTP sent successfully.'
            );


            showToast(
                'OTP sent successfully.'
            );


            showOtpArea(
                number
            );


        } catch (error) {

            console.error(
                'FIREBASE OTP ERROR:',
                error
            );


            busy(
                mobileBtn,
                false,
                'Send OTP'
            );


            let message =
                'Unable to send OTP. Please try again.';


            if (
                error.message ===
                'CSRF token not found.'
            ) {

                message =
                    'Security token missing. Please refresh the page.';

            }

            else if (
                error?.code ===
                'auth/invalid-phone-number'
            ) {

                message =
                    'Invalid mobile number.';

            }

            else if (
                error?.code ===
                'auth/too-many-requests'
            ) {

                message =
                    'Too many attempts. Please try again later.';

            }

            else if (
                error?.code ===
                'auth/captcha-check-failed'
            ) {

                message =
                    'reCAPTCHA verification failed. Please try again.';

            }

            else if (
                error?.code ===
                'auth/quota-exceeded'
            ) {

                message =
                    'Firebase SMS limit has been exceeded.';

            }

            else if (
                error?.code ===
                'auth/operation-not-allowed'
            ) {

                message =
                    'Phone authentication is not enabled in Firebase.';

            }

            else if (
                error?.code ===
                'auth/argument-error'
            ) {

                message =
                    'reCAPTCHA could not be initialized. Please refresh the page and try again.';

            }


            setErr(
                'phoneErr',
                message
            );


            // =================================================
            // RESET CAPTCHA
            // =================================================

            try {

                if (
                    window.recaptchaVerifier
                ) {

                    window.recaptchaVerifier.clear();

                    window.recaptchaVerifier =
                        null;

                }

                window.recaptchaWidgetId =
                    null;

            } catch (recaptchaError) {

                console.error(
                    'reCAPTCHA reset error:',
                    recaptchaError
                );

            }


            const captchaElement =
                document.getElementById(
                    'recaptcha-container'
                );


            if (captchaElement) {

                captchaElement.innerHTML =
                    '';

                captchaElement.dataset.verified =
                    'false';

            }

        }

    }


    // =========================================================
    // VERIFY FIREBASE MOBILE OTP
    // =========================================================

    async function verifyFirebaseOTP() {

        if (!mobileBtn) return;


        const code =
            otpBoxes
                .map(box => box.value)
                .join('');


        if (code.length !== 6) {

            setErr(
                'otpErr',
                'Enter all 6 digits.'
            );

            return;

        }


        if (!confirmationResult) {

            setErr(
                'otpErr',
                'Please request a new OTP.'
            );

            return;

        }


        try {

            busy(
                mobileBtn,
                true,
                'Verifying...'
            );


            const result =
                await confirmationResult.confirm(
                    code
                );


            console.log(
                'Firebase verification successful:',
                result.user
            );


            // =================================================
            // GET FIREBASE ID TOKEN
            // =================================================

            const idToken =
                await result.user.getIdToken();


            console.log(
                'Firebase ID token received.'
            );


            if (!mobileFormElement) {

                throw new Error(
                    'Mobile form not found.'
                );

            }


            let tokenInput =
                mobileFormElement.querySelector(
                    'input[name="firebase_id_token"]'
                );


            if (!tokenInput) {

                tokenInput =
                    document.createElement(
                        'input'
                    );

                tokenInput.type =
                    'hidden';

                tokenInput.name =
                    'firebase_id_token';

                mobileFormElement.appendChild(
                    tokenInput
                );

            }


            tokenInput.value =
                idToken;


            showToast(
                'Phone verified successfully!'
            );


            mobileBtn.textContent =
                'Creating account...';


            mobileBtn.disabled =
                true;


            // =================================================
            // SUBMIT TO DJANGO
            // =================================================

            mobileFormElement.submit();


        } catch (error) {

            console.error(
                'FIREBASE VERIFY ERROR:',
                error
            );


            busy(
                mobileBtn,
                false,
                'Verify OTP'
            );


            let message =
                'Invalid or expired OTP. Please try again.';


            if (
                error?.code ===
                'auth/invalid-verification-code'
            ) {

                message =
                    'Invalid OTP. Please check the 6-digit code.';

            }

            else if (
                error?.code ===
                'auth/code-expired'
            ) {

                message =
                    'OTP has expired. Please request a new OTP.';

            }


            setErr(
                'otpErr',
                message
            );

        }

    }


    // =========================================================
    // MOBILE BUTTON
    // =========================================================

    if (mobileBtn) {

        mobileBtn.addEventListener(
            'click',
            async event => {

                event.preventDefault();


                console.log(
                    'Mobile button clicked'
                );


                if (!otpSent) {

                    await sendFirebaseOTP();

                } else {

                    await verifyFirebaseOTP();

                }

            }
        );

    }


    // =========================================================
    // RESEND MOBILE OTP
    // =========================================================

    if (resendButton) {

        resendButton.addEventListener(
            'click',
            async () => {

                if (!phone) return;


                if (
                    resendButton.disabled
                ) {

                    return;

                }


                otpBoxes.forEach(box => {
                    box.value = '';
                });


                otpSent =
                    false;


                confirmationResult =
                    null;


                await sendFirebaseOTP();

            }
        );

    }


    // =========================================================
    // SOCIAL BUTTONS
    // =========================================================

    $$('.soc').forEach(button => {

        button.addEventListener(
            'click',
            () => {

                const provider =
                    button.dataset.provider;


                if (!provider) return;


                button.disabled =
                    true;


                const name =
                    provider.charAt(0).toUpperCase() +
                    provider.slice(1);


                showToast(
                    `Connecting to ${name}...`
                );


                setTimeout(() => {

                    button.disabled =
                        false;

                }, 900);

            }
        );

    });


    // =========================================================
    // DEBUG
    // =========================================================

    console.log(
        'PlaceMate registration Script.JS loaded successfully.'
    );

})();