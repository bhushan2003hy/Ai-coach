from django.shortcuts import render
from django.contrib.auth.models import User
from django.contrib.auth import login
from django.conf import settings
from django.http import JsonResponse
from django.core.mail import send_mail

import requests
import secrets
import time


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

            return render(request, "Profile.html", {
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
        ).strip().lower()

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

        # =================================================
        # SERVER-SIDE EMAIL OTP VERIFICATION
        # =================================================

        otp_verified = request.session.get(
            "email_otp_verified",
            False
        )

        verified_email = request.session.get(
            "email_verified_email",
            ""
        ).strip().lower()

        # ---------------------------------------------
        # OTP NOT VERIFIED
        # ---------------------------------------------

        if not otp_verified:

            return render(request, "register.html", {
                "error": "Please verify your email using OTP first.",
            })

        # ---------------------------------------------
        # VERIFIED EMAIL MUST MATCH
        # ---------------------------------------------

        if verified_email != email:

            return render(request, "register.html", {
                "error": "The verified email does not match.",
            })

        # =================================================
        # CHECK DUPLICATE EMAIL
        # =================================================

        if User.objects.filter(
            username=email
        ).exists():

            # Clear verification session
            request.session.pop(
                "email_otp_verified",
                None
            )

            request.session.pop(
                "email_verified_email",
                None
            )

            return render(request, "register.html", {
                "error": "This email is already registered."
            })

        # =================================================
        # CREATE EMAIL USER
        # =================================================

        user = User.objects.create_user(
            username=email,
            email=email,
            password=password
        )

        # =================================================
        # CLEAR EMAIL OTP VERIFICATION
        # =================================================

        request.session.pop(
            "email_otp_verified",
            None
        )

        request.session.pop(
            "email_verified_email",
            None
        )

        # =================================================
        # LOGIN
        # =================================================

        login(request, user)

        return render(request, "Profile.html", {
            "success": "Email verified and account created successfully!"
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


# =========================================================
# SEND EMAIL OTP
# =========================================================

def send_email_otp(request):

    if request.method != "POST":

        return JsonResponse({
            "success": False,
            "message": "Invalid request."
        }, status=405)

    # =====================================================
    # GET EMAIL
    # =====================================================

    email = request.POST.get(
        "email",
        ""
    ).strip().lower()

    # =====================================================
    # VALIDATE EMAIL
    # =====================================================

    if not email:

        return JsonResponse({
            "success": False,
            "message": "Please enter your email."
        })

    # =====================================================
    # CHECK EMAIL ALREADY REGISTERED
    # =====================================================

    if User.objects.filter(
        username=email
    ).exists():

        return JsonResponse({
            "success": False,
            "message": "This email is already registered. Please sign in."
        })

    # =====================================================
    # GENERATE 6 DIGIT OTP
    # =====================================================

    otp = str(
        secrets.randbelow(900000) + 100000
    )

    # =====================================================
    # STORE OTP IN SESSION
    # =====================================================

    request.session["email_otp"] = otp

    request.session["email_otp_email"] = email

    request.session["email_otp_time"] = time.time()

    # New OTP means old verification must be removed
    request.session.pop(
        "email_otp_verified",
        None
    )

    request.session.pop(
        "email_verified_email",
        None
    )

    # =====================================================
    # SEND EMAIL
    # =====================================================

    try:

        send_mail(

            subject="PlaceMate AI - Email Verification OTP",

            message=(
                f"Your PlaceMate AI verification OTP is: {otp}\n\n"
                "This OTP is valid for 5 minutes.\n"
                "Do not share this OTP with anyone."
            ),

            from_email=settings.DEFAULT_FROM_EMAIL,

            recipient_list=[email],

            fail_silently=False
        )

        print(
            "EMAIL OTP SENT TO:",
            email
        )

        print(
            "OTP:",
            otp
        )

        return JsonResponse({
            "success": True,
            "message": "OTP sent successfully."
        })

    except Exception as e:

        print(
            "EMAIL OTP ERROR:",
            e
        )

        # Remove OTP if email failed
        request.session.pop(
            "email_otp",
            None
        )

        request.session.pop(
            "email_otp_email",
            None
        )

        request.session.pop(
            "email_otp_time",
            None
        )

        return JsonResponse({
            "success": False,
            "message": "Unable to send OTP. Please try again."
        })


# =========================================================
# VERIFY EMAIL OTP
# =========================================================

def verify_email_otp(request):

    if request.method != "POST":

        return JsonResponse({
            "success": False,
            "message": "Invalid request."
        }, status=405)

    # =====================================================
    # GET DATA
    # =====================================================

    email = request.POST.get(
        "email",
        ""
    ).strip().lower()

    entered_otp = request.POST.get(
        "otp",
        ""
    ).strip()

    # =====================================================
    # BASIC VALIDATION
    # =====================================================

    if not email:

        return JsonResponse({
            "success": False,
            "message": "Email is required."
        })

    if not entered_otp:

        return JsonResponse({
            "success": False,
            "message": "Please enter the OTP."
        })

    # =====================================================
    # OTP MUST BE 6 DIGITS
    # =====================================================

    if not entered_otp.isdigit() or len(entered_otp) != 6:

        return JsonResponse({
            "success": False,
            "message": "OTP must contain 6 digits."
        })

    # =====================================================
    # GET OTP FROM SESSION
    # =====================================================

    saved_otp = request.session.get(
        "email_otp"
    )

    saved_email = request.session.get(
        "email_otp_email"
    )

    saved_time = request.session.get(
        "email_otp_time"
    )

    # =====================================================
    # CHECK OTP EXISTS
    # =====================================================

    if not saved_otp or not saved_email or not saved_time:

        return JsonResponse({
            "success": False,
            "message": "OTP not found. Please request a new OTP."
        })

    # =====================================================
    # CHECK EMAIL MATCH
    # =====================================================

    if saved_email != email:

        return JsonResponse({
            "success": False,
            "message": "Email does not match the OTP request."
        })

    # =====================================================
    # CHECK OTP EXPIRY — 5 MINUTES
    # =====================================================

    if time.time() - saved_time > 300:

        request.session.pop(
            "email_otp",
            None
        )

        request.session.pop(
            "email_otp_email",
            None
        )

        request.session.pop(
            "email_otp_time",
            None
        )

        return JsonResponse({
            "success": False,
            "message": "OTP has expired. Please request a new OTP."
        })

    # =====================================================
    # CHECK OTP
    # =====================================================

    if entered_otp != saved_otp:

        return JsonResponse({
            "success": False,
            "message": "Invalid OTP. Please try again."
        })

    # =====================================================
    # OTP VERIFIED
    # =====================================================

    request.session["email_otp_verified"] = True

    request.session["email_verified_email"] = email

    # =====================================================
    # REMOVE USED OTP
    # =====================================================

    request.session.pop(
        "email_otp",
        None
    )

    request.session.pop(
        "email_otp_time",
        None
    )

    request.session.pop(
        "email_otp_email",
        None
    )

    print(
        "EMAIL OTP VERIFIED:",
        email
    )

    return JsonResponse({
        "success": True,
        "message": "Email verified successfully."
    })
    

    