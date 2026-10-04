from django.shortcuts import render
from django.contrib.auth.models import User
from django.contrib.auth import login
from django.conf import settings

import requests
import secrets


# =========================================================
# REGISTER
# =========================================================

def register(request):

    # =====================================================
    # POST REQUEST
    # =====================================================

    if request.method == "POST":

        register_type = request.POST.get(
            "register_type",
            "email"
        )

        # =================================================
        # MOBILE OTP REGISTRATION - FIREBASE
        # =================================================

        if register_type == "mobile":

            phone = request.POST.get(
                "phone",
                ""
            ).strip()

            # ---------------------------------------------
            # CHECK MOBILE NUMBER
            # ---------------------------------------------

            if not phone.isdigit() or len(phone) != 10:

                return render(request, "register.html", {
                    "error": "Please enter a valid 10-digit mobile number.",
                    "phone": phone,
                    "mobile_mode": True
                })

            # ---------------------------------------------
            # CHECK INDIAN MOBILE NUMBER
            # ---------------------------------------------

            if phone[0] not in "6789":

                return render(request, "register.html", {
                    "error": "Please enter a valid Indian mobile number.",
                    "phone": phone,
                    "mobile_mode": True
                })

            # ---------------------------------------------
            # FULL PHONE NUMBER
            # ---------------------------------------------

            full_phone = "+91" + phone

            # ---------------------------------------------
            # CHECK DUPLICATE MOBILE
            # ---------------------------------------------

            if User.objects.filter(
                username=phone
            ).exists():

                return render(request, "register.html", {
                    "error": "This mobile number is already registered.",
                    "phone": phone,
                    "mobile_mode": True
                })

            # =================================================
            # FIREBASE ID TOKEN
            # =================================================

            id_token = request.POST.get(
                "firebase_id_token",
                ""
            ).strip()

            # ---------------------------------------------
            # TOKEN REQUIRED
            # ---------------------------------------------

            if not id_token:

                return render(request, "register.html", {
                    "error": "Please verify your mobile number first.",
                    "phone": phone,
                    "mobile_mode": True
                })

            # =================================================
            # VERIFY FIREBASE TOKEN
            # =================================================

            try:

                response = requests.post(
                    "https://identitytoolkit.googleapis.com/v1/accounts:lookup",
                    params={
                        "key": settings.FIREBASE_API_KEY
                    },
                    json={
                        "idToken": id_token
                    },
                    timeout=10
                )

                data = response.json()

                print(
                    "FIREBASE VERIFY RESPONSE:",
                    data
                )

            except Exception as e:

                print(
                    "FIREBASE VERIFY ERROR:",
                    e
                )

                return render(request, "register.html", {
                    "error": "Unable to verify Firebase authentication.",
                    "phone": phone,
                    "mobile_mode": True
                })

            # =================================================
            # CHECK FIREBASE USER
            # =================================================

            users = data.get("users", [])

            if not users:

                return render(request, "register.html", {
                    "error": "Firebase verification failed.",
                    "phone": phone,
                    "mobile_mode": True
                })

            firebase_user = users[0]

            firebase_phone = firebase_user.get(
                "phoneNumber",
                ""
            )

            # ---------------------------------------------
            # MAKE SURE PHONE MATCHES
            # ---------------------------------------------

            if firebase_phone != full_phone:

                return render(request, "register.html", {
                    "error": "Verified mobile number does not match.",
                    "phone": phone,
                    "mobile_mode": True
                })

            # =================================================
            # CREATE DJANGO USER
            # =================================================

            password = secrets.token_urlsafe(32)

            user = User.objects.create_user(
                username=phone,
                password=password
            )

            # =================================================
            # LOGIN
            # =================================================

            login(request, user)

            return render(request, "register.html", {
                "success": "Mobile verification successful! Account created.",
                "otp_verified": True,
                "phone": phone
            })

        # =================================================
        # EMAIL REGISTRATION
        # =================================================

        email = request.POST.get(
            "email",
            ""
        ).strip()

        password = request.POST.get(
            "password",
            ""
        )

        # ---------------------------------------------
        # EMPTY EMAIL
        # ---------------------------------------------

        if not email:

            return render(request, "register.html", {
                "error": "Please enter your email."
            })

        # ---------------------------------------------
        # EMPTY PASSWORD
        # ---------------------------------------------

        if not password:

            return render(request, "register.html", {
                "error": "Please enter your password."
            })

        # ---------------------------------------------
        # DUPLICATE EMAIL
        # ---------------------------------------------

        if User.objects.filter(
            username=email
        ).exists():

            return render(request, "register.html", {
                "error": "This email is already registered."
            })

        # ---------------------------------------------
        # CREATE EMAIL USER
        # ---------------------------------------------

        user = User.objects.create_user(
            username=email,
            email=email,
            password=password
        )

        # ---------------------------------------------
        # LOGIN
        # ---------------------------------------------

        login(request, user)

        return render(request, "register.html", {
            "success": "Account created successfully!"
        })

    # =====================================================
    # GET REQUEST
    # =====================================================

    return render(
        request,
        "register.html"
    )


# =========================================================
# PASSWORD RESET DONE
# =========================================================

def password_reset_done(request):

    return render(
        request,
        "registration/password_reset_done.html"
    )