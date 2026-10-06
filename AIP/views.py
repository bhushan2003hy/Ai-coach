# =========================================================
# AIP/views.py
# =========================================================

from django.shortcuts import render, HttpResponse, redirect
from django.contrib.auth import authenticate, login
from django.contrib.auth.models import User
from django.conf import settings
from django.http import JsonResponse

import requests

from google.oauth2 import id_token as google_id_token
from google.auth.transport import requests as google_requests


# =========================================================
# LOGIN PAGE
# =========================================================

def index(request):

    if request.method == "POST":

        login_type = request.POST.get(
            "login_type",
            "email"
        )

        # =================================================
        # MOBILE OTP LOGIN
        # =================================================

        if login_type == "mobile":

            phone = request.POST.get(
                "phone",
                ""
            ).strip()

            firebase_token = request.POST.get(
                "firebase_id_token",
                ""
            ).strip()

            # ---------------------------------------------
            # VALIDATE MOBILE NUMBER
            # ---------------------------------------------

            if (
                not phone.isdigit()
                or len(phone) != 10
                or phone[0] not in "6789"
            ):

                return render(
                    request,
                    "index.html",
                    {
                        "error": "Please enter a valid 10-digit mobile number.",
                        "mobile_mode": True
                    }
                )

            # ---------------------------------------------
            # CHECK REGISTERED MOBILE
            # ---------------------------------------------

            user = User.objects.filter(
                username=phone
            ).first()

            if user is None:

                return render(
                    request,
                    "index.html",
                    {
                        "error": (
                            "This mobile number is not registered. "
                            "Please create an account first."
                        ),
                        "mobile_mode": True,
                        "phone": phone
                    }
                )

            # ---------------------------------------------
            # FIREBASE TOKEN REQUIRED
            # ---------------------------------------------

            if not firebase_token:

                return render(
                    request,
                    "index.html",
                    {
                        "error": "Please verify the OTP first.",
                        "mobile_mode": True,
                        "phone": phone
                    }
                )

            # ---------------------------------------------
            # VERIFY FIREBASE ID TOKEN
            # ---------------------------------------------

            try:

                response = requests.post(
                    "https://identitytoolkit.googleapis.com/v1/accounts:lookup",
                    params={
                        "key": settings.FIREBASE_API_KEY
                    },
                    json={
                        "idToken": firebase_token
                    },
                    timeout=10
                )

                data = response.json()

                print(
                    "FIREBASE LOGIN VERIFY RESPONSE:",
                    data
                )

            except Exception as e:

                print(
                    "FIREBASE LOGIN VERIFY ERROR:",
                    e
                )

                return render(
                    request,
                    "index.html",
                    {
                        "error": (
                            "Unable to verify Firebase authentication."
                        ),
                        "mobile_mode": True,
                        "phone": phone
                    }
                )

            # ---------------------------------------------
            # CHECK FIREBASE USER
            # ---------------------------------------------

            firebase_users = data.get(
                "users",
                []
            )

            if not firebase_users:

                return render(
                    request,
                    "index.html",
                    {
                        "error": "Firebase verification failed.",
                        "mobile_mode": True,
                        "phone": phone
                    }
                )

            firebase_user = firebase_users[0]

            firebase_phone = firebase_user.get(
                "phoneNumber",
                ""
            )

            expected_phone = "+91" + phone

            # ---------------------------------------------
            # CHECK PHONE MATCH
            # ---------------------------------------------

            if firebase_phone != expected_phone:

                return render(
                    request,
                    "index.html",
                    {
                        "error": (
                            "Verified mobile number does not match."
                        ),
                        "mobile_mode": True,
                        "phone": phone
                    }
                )

            # ---------------------------------------------
            # DJANGO LOGIN
            # ---------------------------------------------

            login(
                request,
                user
            )

            print(
                "MOBILE LOGIN SUCCESSFUL:",
                phone
            )

            return redirect("dashboard")

        # =================================================
        # EMAIL + PASSWORD LOGIN
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
        # CHECK EMAIL
        # ---------------------------------------------

        if not email:

            return render(
                request,
                "index.html",
                {
                    "error": "Please enter your email."
                }
            )

        # ---------------------------------------------
        # CHECK PASSWORD
        # ---------------------------------------------

        if not password:

            return render(
                request,
                "index.html",
                {
                    "error": "Please enter your password."
                }
            )

        # ---------------------------------------------
        # AUTHENTICATE USER
        # ---------------------------------------------

        user = authenticate(
            request=request,
            username=email,
            password=password
        )

        print(
            "LOGIN EMAIL:",
            email
        )

        print(
            "PASSWORD RECEIVED:",
            bool(password)
        )

        # ---------------------------------------------
        # LOGIN SUCCESS
        # ---------------------------------------------

        if user is not None:

            print(
                "LOGIN AUTHENTICATE: SUCCESS"
            )

            print(
                "USER:",
                user.username
            )

            login(
                request,
                user
            )

            print(
                "DJANGO LOGIN SUCCESS"
            )

            return redirect("dashboard")

        # ---------------------------------------------
        # LOGIN FAILED
        # ---------------------------------------------

        print(
            "LOGIN AUTHENTICATE: FAILED"
        )

        return render(
            request,
            "index.html",
            {
                "error": "This email is not registered create account first."
            }
        )

    # =================================================
    # GET REQUEST
    # =================================================

    return render(
        request,
        "index.html"
    )


# =========================================================
# LOGIN WITH GOOGLE
# =========================================================

def google_login(request):

    if request.method != "POST":

        return JsonResponse(
            {
                "success": False,
                "error": "Invalid request."
            },
            status=405
        )

    # -----------------------------------------------------
    # GET GOOGLE ID TOKEN
    # -----------------------------------------------------

    google_token = request.POST.get(
        "id_token",
        ""
    ).strip()

    if not google_token:

        return JsonResponse(
            {
                "success": False,
                "error": "Google ID token is missing."
            },
            status=400
        )

    try:

        # -------------------------------------------------
        # VERIFY GOOGLE ID TOKEN
        # -------------------------------------------------

        decoded_token = google_id_token.verify_oauth2_token(
            google_token,
            google_requests.Request(),
            settings.GOOGLE_CLIENT_ID
        )

        # -------------------------------------------------
        # GET GOOGLE USER INFORMATION
        # -------------------------------------------------

        email = decoded_token.get(
            "email",
            ""
        ).strip().lower()

        name = decoded_token.get(
            "name",
            ""
        ).strip()

        # -------------------------------------------------
        # CHECK EMAIL
        # -------------------------------------------------

        if not email:

            return JsonResponse(
                {
                    "success": False,
                    "error": "Google account email not found."
                },
                status=400
            )

        print(
            "GOOGLE VERIFIED EMAIL:",
            email
        )

        print(
            "GOOGLE VERIFIED NAME:",
            name
        )

        # -------------------------------------------------
        # CHECK USER IN DJANGO DATABASE
        # -------------------------------------------------

        user = User.objects.filter(
            email=email
        ).first()

        # =================================================
        # EXISTING USER
        # =================================================

        if user is not None:

            login(
                request,
                user
            )

            print(
                "EXISTING GOOGLE USER LOGIN:",
                email
            )

            return JsonResponse(
                {
                    "success": True,
                    "redirect_url": "/dashboard/"
                }
            )

        # =================================================
        # NEW GOOGLE USER
        # =================================================

        request.session["google_email"] = email

        request.session["google_name"] = name

        print(
            "NEW GOOGLE USER:",
            email
        )

        return JsonResponse(
            {
                "success": True,
                "redirect_url": "/profile/"
            }
        )

    except Exception as e:

        print(
            "GOOGLE LOGIN ERROR TYPE:",
            type(e).__name__
        )

        print(
            "GOOGLE LOGIN ERROR:",
            e
        )

        return JsonResponse(
            {
                "success": False,
                "error": str(e)
            },
            status=401
        )


# =========================================================
# CHECK MOBILE REGISTERED
# =========================================================

def check_mobile_registered(request):

    if request.method != "POST":

        return JsonResponse(
            {
                "registered": False,
                "error": "Invalid request."
            },
            status=405
        )

    phone = request.POST.get(
        "phone",
        ""
    ).strip()

    # ---------------------------------------------
    # VALIDATE MOBILE
    # ---------------------------------------------

    if (
        not phone.isdigit()
        or len(phone) != 10
        or phone[0] not in "6789"
    ):

        return JsonResponse(
            {
                "registered": False,
                "error": (
                    "Enter a valid 10-digit mobile number."
                )
            }
        )

    # ---------------------------------------------
    # CHECK DATABASE
    # ---------------------------------------------

    registered = User.objects.filter(
        username=phone
    ).exists()

    return JsonResponse(
        {
            "registered": registered
        }
    )


# =========================================================
# PROFILE
# =========================================================

def profile(request):

    return render(
        request,
        "Profile.html"
    )


# =========================================================
# DASHBOARD
# =========================================================

def dashboard(request):

    # ---------------------------------------------
    # LOGIN REQUIRED
    # ---------------------------------------------

    if not request.user.is_authenticated:

        return redirect("/")

    # ---------------------------------------------
    # OPEN DASHBOARD
    # ---------------------------------------------

    return render(
        request,
        "dashboard.html"
    )


# =========================================================
# ABOUT
# =========================================================

def about(request):

    return HttpResponse(
        "This is Home about"
    )


# =========================================================
# CONTACT
# =========================================================

def contac(request):

    return HttpResponse(
        "This is Home contac"
    )