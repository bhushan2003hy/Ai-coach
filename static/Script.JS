
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

    let toastTimer;

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
    // EMAIL FORM
    // IMPORTANT: EMAIL REGISTRATION UNCHANGED
    // =========================================================

    if (emailForm) {

        emailForm.addEventListener(
            'submit',
            event => {

                const emailInput =
                    $('#email');

                const passwordInput =
                    $('#pass');


                const email =
                    emailInput
                        ? emailInput.value.trim()
                        : '';


                const password =
                    passwordInput
                        ? passwordInput.value
                        : '';


                let valid = true;


                // Correct email validation
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


                // Password validation
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


                if (!valid) {

                    event.preventDefault();

                    return;

                }


                const button =
                    event.submitter ||
                    $('.primary', emailForm);


                busy(
                    button,
                    true,
                    'Creating account...'
                );

                // Django email registration continues normally.

            }
        );

    }


    // =========================================================
    // FIREBASE MOBILE OTP
    // =========================================================

    const phone = $('#phone');

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


    let confirmationResult = null;

    let otpSent = false;

    let countdown = null;


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
    // OTP INPUT BOXES
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
    // OTP TIMER
    // =========================================================

    function startTimer() {

        if (!resendButton) return;

        let seconds = 30;

        resendButton.disabled = true;

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
    // SHOW OTP AREA
    // =========================================================

    function showOtpArea(number) {

        otpSent = true;

        // Remove reCAPTCHA after OTP is sent
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

        window.recaptchaVerifier = null;
    }

    recaptchaContainer.innerHTML = '';

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

    // Already created
    if (window.recaptchaVerifier) {

        return window.recaptchaVerifier;

    }

    // Clear old CAPTCHA
    container.innerHTML = '';

    // Create visible reCAPTCHA
    window.recaptchaVerifier =
        new firebase.auth.RecaptchaVerifier(
            'recaptcha-container',
            {
                size: 'normal',
                callback: function(response) {

                    console.log(
                        'reCAPTCHA verified successfully.'
                    );

                    container.dataset.verified =
                        'true';

                },

                'expired-callback': function() {

                    console.log(
                        'reCAPTCHA expired.'
                    );

                    container.dataset.verified =
                        'false';

                }
            }
        );

    container.dataset.verified = 'false';

    // Render CAPTCHA
    window.recaptchaVerifier
        .render()
        .then(function(widgetId) {

            window.recaptchaWidgetId =
                widgetId;

            console.log(
                'reCAPTCHA rendered:',
                widgetId
            );

        });

    container.classList.add(
        'recaptcha-visible'
    );

    return window.recaptchaVerifier;

}
    // =========================================================
    // FIREBASE SEND OTP
    // =========================================================

    async function sendFirebaseOTP() {

    if (!phone || !mobileBtn) {
        return;
    }

    const number = phone.value.trim();

    // =====================================================
    // VALIDATE MOBILE NUMBER
    // =====================================================

    if (!/^[6-9]\d{9}$/.test(number)) {

        setErr(
            'phoneErr',
            'Enter a valid 10-digit Indian mobile number.'
        );

        phone.focus();

        return;
    }

    setErr('phoneErr', '');

    // =====================================================
    // DETECT LOGIN OR REGISTRATION PAGE
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

    // =====================================================
    // CHECK MOBILE IN DJANGO DATABASE
    // =====================================================

    try {

        const csrfToken =
            document.querySelector(
                '#mobileForm input[name="csrfmiddlewaretoken"]'
            )?.value;

        if (!csrfToken) {

            throw new Error(
                'CSRF token not found.'
            );

        }

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
        // LOGIN FLOW
        // =================================================

        if (isLogin) {

            // Number is NOT registered
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

            // Number IS registered
            console.log(
                'Login mobile number is registered.'
            );
        }

        // =================================================
        // REGISTRATION FLOW
        // =================================================

        if (isRegistration) {

            // Number is ALREADY registered
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

            // Number is NEW
            console.log(
                'Registration mobile number is new.'
            );
        }

        // =================================================
        // ONLY NOW CREATE reCAPTCHA
        // =================================================

        busy(
            mobileBtn,
            true,
            'Sending OTP...'
        );

        const fullPhone =
            '+91' + number;

        console.log(
            'Sending OTP to:',
            fullPhone
        );

        // =================================================
        // CREATE / REUSE reCAPTCHA
        // =================================================

        // =================================================
// CREATE / REUSE reCAPTCHA
// =================================================

const verifier =
    createRecaptcha();

// =================================================
// WAIT FOR reCAPTCHA TO RENDER
// =================================================

if (
    !window.recaptchaWidgetId
) {

    await verifier.render();

}

// =================================================
// CHECK: USER MUST MANUALLY VERIFY reCAPTCHA
// =================================================

const recaptchaContainer =
    document.getElementById(
        'recaptcha-container'
    );

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
// CAPTCHA VERIFIED
// NOW SEND FIREBASE OTP
// =================================================

console.log(
    'reCAPTCHA manually verified. Sending OTP...'
);

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

        showOtpArea(number);

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

        // =================================================
        // CSRF ERROR
        // =================================================

        if (
            error.message ===
            'CSRF token not found.'
        ) {

            message =
                'Security token missing. Please refresh the page.';
        }

        // =================================================
        // FIREBASE ERRORS
        // =================================================

        else if (
            error &&
            error.code ===
            'auth/invalid-phone-number'
        ) {

            message =
                'Invalid mobile number.';
        }

        else if (
            error &&
            error.code ===
            'auth/too-many-requests'
        ) {

            message =
                'Too many attempts. Please try again later.';
        }

        else if (
            error &&
            error.code ===
            'auth/captcha-check-failed'
        ) {

            message =
                'reCAPTCHA verification failed. Please try again.';
        }

        else if (
            error &&
            error.code ===
            'auth/quota-exceeded'
        ) {

            message =
                'Firebase SMS limit has been exceeded.';
        }

        else if (
            error &&
            error.code ===
            'auth/operation-not-allowed'
        ) {

            message =
                'Phone authentication is not enabled in Firebase.';
        }

        else if (
            error &&
            error.code ===
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
        // RESET reCAPTCHA
        // =================================================

        try {

            if (window.recaptchaVerifier) {

                window.recaptchaVerifier.clear();

                window.recaptchaVerifier =
                    null;
            }

        } catch (recaptchaError) {

            console.error(
                'reCAPTCHA reset error:',
                recaptchaError
            );
        }

        

        if (recaptchaContainer) {

            recaptchaContainer.innerHTML ='';
        }

    }

}
    // =========================================================
    // FIREBASE VERIFY OTP
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


            // Get Firebase ID Token
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


            // Create hidden Firebase token input
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


            // Submit mobile form to Django
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
                error &&
                error.code ===
                'auth/invalid-verification-code'
            ) {

                message =
                    'Invalid OTP. Please check the 6-digit code.';

            }


            else if (
                error &&
                error.code ===
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

    mobileBtn.addEventListener('click', async event => {

        event.preventDefault();

        console.log('Mobile button clicked');

        if (!otpSent) {
            await sendFirebaseOTP();
        } else {
            await verifyFirebaseOTP();
        }

    });

}

    // =========================================================
    // RESEND OTP
    // =========================================================

    if (resendButton) {

        resendButton.addEventListener(
            'click',
            async () => {

                if (!phone) return;


                if (resendButton.disabled) {

                    return;

                }


                otpBoxes.forEach(box => {

                    box.value = '';

                });


                otpSent = false;

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


                button.disabled = true;


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

