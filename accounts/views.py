
from django.shortcuts import render
from django.contrib.auth.models import User
from django.contrib.auth import login
from django.contrib.auth.hashers import make_password
from django.conf import settings
from django.http import JsonResponse
from django.db import transaction

from .models import Student, StudentProfile

import requests
import secrets
import time


# =========================================================
# REGISTER
# =========================================================

def register(request):
    if request.method != "POST":
        return render(request, "register.html")

    register_type = request.POST.get("register_type", "email")

    # =====================================================
    # MOBILE OTP REGISTRATION - FIREBASE
    # =====================================================

    if register_type == "mobile":
        phone = request.POST.get("phone", "").strip()

        if not phone.isdigit() or len(phone) != 10 or phone[0] not in "6789":
            return render(
                request,
                "register.html",
                {
                    "error": "Please enter a valid 10-digit Indian mobile number.",
                    "phone": phone,
                    "mobile_mode": True,
                },
            )

        if User.objects.filter(username=phone).exists():
            return render(
                request,
                "register.html",
                {
                    "error": "This mobile number is already registered.",
                    "phone": phone,
                    "mobile_mode": True,
                },
            )

        full_phone = "+91" + phone
        id_token = request.POST.get("firebase_id_token", "").strip()

        if not id_token:
            return render(
                request,
                "register.html",
                {
                    "error": "Please verify your mobile number first.",
                    "phone": phone,
                    "mobile_mode": True,
                },
            )

        try:
            response = requests.post(
                "https://identitytoolkit.googleapis.com/v1/accounts:lookup",
                params={"key": settings.FIREBASE_API_KEY},
                json={"idToken": id_token},
                timeout=10,
            )
            data = response.json()

            if response.status_code != 200:
                print("FIREBASE VERIFY RESPONSE:", data)
                return render(
                    request,
                    "register.html",
                    {
                        "error": "Firebase verification failed.",
                        "phone": phone,
                        "mobile_mode": True,
                    },
                )

        except requests.RequestException as exc:
            print("FIREBASE VERIFY ERROR:", exc)
            return render(
                request,
                "register.html",
                {
                    "error": "Unable to verify Firebase authentication.",
                    "phone": phone,
                    "mobile_mode": True,
                },
            )

        users = data.get("users", [])

        if not users:
            return render(
                request,
                "register.html",
                {
                    "error": "Firebase verification failed.",
                    "phone": phone,
                    "mobile_mode": True,
                },
            )

        firebase_phone = users[0].get("phoneNumber", "")

        if firebase_phone != full_phone:
            return render(
                request,
                "register.html",
                {
                    "error": "Verified mobile number does not match.",
                    "phone": phone,
                    "mobile_mode": True,
                },
            )

        request.session["registered_mobile"] = phone
        request.session["mobile_mode"] = True

        # Clear pending registration data from other methods.
        for key in (
            "google_email",
            "google_name",
            "facebook_email",
            "facebook_name",
            "email_verified_email",
            "email_otp_verified",
            "pending_registration_password",
        ):
            request.session.pop(key, None)

        return render(
            request,
            "Profile.html",
            {
                "success": (
                    "Mobile verification successful! "
                    "Please complete your profile."
                ),
                "otp_verified": True,
                "phone": phone,
                "registered_mobile": phone,
                "mobile_mode": True,
                "google_email": "",
            },
        )

    # =====================================================
    # EMAIL OTP REGISTRATION
    # =====================================================

    email = request.POST.get("email", "").strip().lower()
    password = request.POST.get("password", "")

    if not email:
        return render(
            request,
            "register.html",
            {"error": "Please enter your email."},
        )

    if not password:
        return render(
            request,
            "register.html",
            {"error": "Please enter your password."},
        )

    otp_verified = request.session.get("email_otp_verified", False)
    verified_email = (
        request.session.get("email_verified_email", "").strip().lower()
    )

    if not otp_verified:
        return render(
            request,
            "register.html",
            {"error": "Please verify your email using OTP first."},
        )

    if verified_email != email:
        return render(
            request,
            "register.html",
            {"error": "The verified email does not match."},
        )

    if (
        User.objects.filter(username=email).exists()
        or User.objects.filter(email__iexact=email).exists()
    ):
        for key in (
            "email_otp_verified",
            "email_verified_email",
            "pending_registration_password",
        ):
            request.session.pop(key, None)

        return render(
            request,
            "register.html",
            {"error": "This email is already registered. Please sign in."},
        )

    request.session["pending_registration_password"] = make_password(password)
    request.session["email_verified_email"] = email
    request.session["mobile_mode"] = False

    for key in (
        "email_otp_verified",
        "registered_mobile",
        "google_email",
        "google_name",
        "facebook_email",
        "facebook_name",
    ):
        request.session.pop(key, None)

    return render(
        request,
        "Profile.html",
        {
            "success": (
                "Email verified successfully! Please complete your profile."
            ),
            "google_email": email,
            "email_verified": True,
            "mobile_mode": False,
        },
    )


# =========================================================
# PASSWORD RESET DONE
# =========================================================

def password_reset_done(request):
    return render(request, "registration/password_reset_done.html")


# =========================================================
# SEND EMAIL OTP
# =========================================================

def send_email_otp(request):
    if request.method != "POST":
        return JsonResponse(
            {"success": False, "message": "Invalid request."},
            status=405,
        )

    email = request.POST.get("email", "").strip().lower()

    if not email:
        return JsonResponse(
            {"success": False, "message": "Please enter your email."}
        )

    if (
        User.objects.filter(username=email).exists()
        or User.objects.filter(email__iexact=email).exists()
    ):
        return JsonResponse(
            {
                "success": False,
                "message": "This email is already registered. Please sign in.",
            }
        )

    otp = str(secrets.randbelow(900000) + 100000)

    request.session["email_otp"] = otp
    request.session["email_otp_email"] = email
    request.session["email_otp_time"] = time.time()

    request.session.pop("email_otp_verified", None)
    request.session.pop("email_verified_email", None)
    request.session.pop("pending_registration_password", None)

    try:
        if not settings.BREVO_API_KEY:
            raise RuntimeError("BREVO_API_KEY is not configured")

        response = requests.post(
            "https://api.brevo.com/v3/smtp/email",
            headers={
                "accept": "application/json",
                "api-key": settings.BREVO_API_KEY,
                "content-type": "application/json",
            },
            json={
                "sender": {
                    "name": "PlaceMate AI",
                    "email": settings.DEFAULT_FROM_EMAIL,
                },
                "to": [{"email": email}],
                "subject": "PlaceMate AI - Email Verification OTP",
                "textContent": (
                    f"Your PlaceMate AI verification OTP is: {otp}\n\n"
                    "This OTP is valid for 5 minutes.\n"
                    "Do not share this OTP with anyone."
                ),
            },
            timeout=15,
        )

        if response.status_code not in (200, 201, 202):
            raise RuntimeError(
                f"Brevo API error {response.status_code}: {response.text}"
            )

        print("EMAIL OTP SENT TO:", email)

        return JsonResponse(
            {"success": True, "message": "OTP sent successfully."}
        )

    except (requests.RequestException, RuntimeError) as exc:
        print("EMAIL OTP ERROR:", exc)

        for key in ("email_otp", "email_otp_email", "email_otp_time"):
            request.session.pop(key, None)

        return JsonResponse(
            {
                "success": False,
                "message": "Unable to send OTP. Please try again.",
            }
        )


# =========================================================
# VERIFY EMAIL OTP
# =========================================================

def verify_email_otp(request):
    if request.method != "POST":
        return JsonResponse(
            {"success": False, "message": "Invalid request."},
            status=405,
        )

    email = request.POST.get("email", "").strip().lower()
    entered_otp = request.POST.get("otp", "").strip()

    if not email:
        return JsonResponse(
            {"success": False, "message": "Email is required."}
        )

    if not entered_otp:
        return JsonResponse(
            {"success": False, "message": "Please enter the OTP."}
        )

    if not entered_otp.isdigit() or len(entered_otp) != 6:
        return JsonResponse(
            {"success": False, "message": "OTP must contain 6 digits."}
        )

    saved_otp = request.session.get("email_otp")
    saved_email = request.session.get("email_otp_email")
    saved_time = request.session.get("email_otp_time")

    if not saved_otp or not saved_email or not saved_time:
        return JsonResponse(
            {
                "success": False,
                "message": "OTP not found. Please request a new OTP.",
            }
        )

    if saved_email != email:
        return JsonResponse(
            {
                "success": False,
                "message": "Email does not match the OTP request.",
            }
        )

    if time.time() - saved_time > 300:
        for key in ("email_otp", "email_otp_email", "email_otp_time"):
            request.session.pop(key, None)

        return JsonResponse(
            {
                "success": False,
                "message": "OTP has expired. Please request a new OTP.",
            }
        )

    if entered_otp != saved_otp:
        return JsonResponse(
            {"success": False, "message": "Invalid OTP. Please try again."}
        )

    request.session["email_otp_verified"] = True
    request.session["email_verified_email"] = email

    for key in ("email_otp", "email_otp_time", "email_otp_email"):
        request.session.pop(key, None)

    print("EMAIL OTP VERIFIED:", email)

    return JsonResponse(
        {"success": True, "message": "Email verified successfully."}
    )


# =========================================================
# COMPLETE PROFILE
# =========================================================

def complete_profile(request):
    if request.method != "POST":
        return JsonResponse(
            {"success": False, "error": "Invalid request."},
            status=405,
        )

    full_name = request.POST.get("full_name", "").strip()
    mobile = request.POST.get("mobile", "").strip()
    college = request.POST.get("college", "").strip()
    degree = request.POST.get("degree", "").strip()
    branch = request.POST.get("branch", "").strip()
    current_year = request.POST.get("current_year", "").strip()
    graduation_year = request.POST.get("graduation_year", "").strip()
    cgpa = request.POST.get("cgpa", "").strip()
    skills = request.POST.get("skills", "").strip()
    github = request.POST.get("github", "").strip()
    linkedin = request.POST.get("linkedin", "").strip()
    resume = request.FILES.get("resume")

    # Registration identity comes from the server-side session.
    facebook_email = (
    request.session.get("facebook_email", "").strip().lower()
      )
    google_email = (
    request.session.get("google_email", "").strip().lower()
     )
    github_email = (
    request.session.get("github_email", "").strip().lower()
)
    verified_email = (
    request.session.get("email_verified_email", "").strip().lower()
)
    registered_mobile = request.session.get("registered_mobile", "").strip() 
    
    if github_email:
        email = github_email
        method = "github"
    elif facebook_email:
        email = facebook_email
        method = "facebook"
    elif google_email:
        email = google_email
        method = "google"
    elif verified_email:
        email = verified_email
        method = "email"
    else:
        email = request.POST.get("email", "").strip().lower()
        method = "mobile"

    if method == "facebook" and not facebook_email:
        return JsonResponse(
            {
                "success": False,
                "error": "Facebook verification expired. Please try again.",
            }
        )

    if method == "google" and not google_email:
        return JsonResponse(
            {
                "success": False,
                "error": "Google verification expired. Please try again.",
            }
        )

    if method == "email" and not request.session.get(
        "pending_registration_password"
    ):
        return JsonResponse(
            {
                "success": False,
                "error": (
                    "Registration session expired. "
                    "Please verify your email again."
                ),
            }
        )

    if method == "mobile":
        if not registered_mobile:
            return JsonResponse(
                {
                    "success": False,
                    "error": "Please verify your mobile number first.",
                }
            )

        if mobile != registered_mobile:
            return JsonResponse(
                {
                    "success": False,
                    "error": "Verified mobile number cannot be changed.",
                }
            )

    if not mobile.isdigit() or len(mobile) != 10 or mobile[0] not in "6789":
        return JsonResponse(
            {
                "success": False,
                "error": "Enter a valid 10-digit Indian mobile number.",
            }
        )

    required_fields = [
        full_name,
        mobile,
        college,
        degree,
        branch,
        current_year,
        graduation_year,
        cgpa,
        skills,
        email,
    ]

    if not all(required_fields):
        return JsonResponse(
            {
                "success": False,
                "error": "Please fill all required fields.",
            }
        )

    if resume:
        if resume.size > 5 * 1024 * 1024:
            return JsonResponse(
                {
                    "success": False,
                    "error": "Resume must be 5 MB or smaller.",
                }
            )

        if not resume.name.lower().endswith(".pdf"):
            return JsonResponse(
                {
                    "success": False,
                    "error": "Please upload a PDF resume.",
                }
            )

        if resume.read(5) != b"%PDF-":
            return JsonResponse(
                {
                    "success": False,
                    "error": "The uploaded file does not appear to be a valid PDF.",
                }
            )

        resume.seek(0)

    try:
        with transaction.atomic():
            if User.objects.filter(email__iexact=email).exists():
                return JsonResponse(
                    {
                        "success": False,
                        "error": (
                            "This email is already registered. Please sign in."
                        ),
                    }
                )

            if User.objects.filter(username=email).exists():
                return JsonResponse(
                    {
                        "success": False,
                        "error": (
                            "This username is already registered. Please sign in."
                        ),
                    }
                )

            if Student.objects.filter(email__iexact=email).exists():
                return JsonResponse(
                    {
                        "success": False,
                        "error": (
                            "A profile already exists for this email. "
                            "Please contact support."
                        ),
                    }
                )

            if StudentProfile.objects.filter(mobile=mobile).exists():
                return JsonResponse(
                    {
                        "success": False,
                        "error": (
                            "This mobile number is already linked to a profile."
                        ),
                    }
                )

            if method == "mobile":
                if User.objects.filter(username=registered_mobile).exists():
                    return JsonResponse(
                        {
                            "success": False,
                            "error": (
                                "This mobile number is already registered. "
                                "Please sign in."
                            ),
                        }
                    )

                user = User(
                    username=registered_mobile,
                    email=email,
                )
                user.set_unusable_password()
                user.save()

            elif method == "email":
                user = User(
                    username=email,
                    email=email,
                    password=request.session[
                        "pending_registration_password"
                    ],
                )
                user.save()

            elif method in ("google", "facebook", "github"):
             user = User.objects.create_user(
             username=email,
             email=email,
             password=secrets.token_urlsafe(32),
    )

            else:
                return JsonResponse(
                    {
                        "success": False,
                        "error": "Invalid registration method.",
                    },
                    status=400,
                )

            student = Student.objects.create(
                email=email,
                password="",
            )

            profile = StudentProfile(
                student=student,
                full_name=full_name,
                mobile=mobile,
                college=college,
                degree=degree,
                branch=branch,
                current_year=current_year,
                graduation_year=graduation_year,
                cgpa=cgpa,
                skills=skills,
                github=github,
                linkedin=linkedin,
            )

            if resume:
                profile.resume = resume

            profile.save()

        login(request, user)

    except Exception as exc:
        print("COMPLETE PROFILE ERROR:", exc)
        return JsonResponse(
            {
                "success": False,
                "error": "Unable to save your profile. Please try again.",
            },
            status=500,
        )

    # Clear registration-specific session data after success.
    for key in (
        "registered_mobile",
        "mobile_mode",
        "google_email",
        "google_name",
        "facebook_email",
        "facebook_name",
        "facebook_oauth_state",
        "github_email",
        "github_name",
        "email_verified_email",
        "email_otp_verified",
        "pending_registration_password",
        "email_otp",
        "email_otp_email",
        "email_otp_time",
    ):
        request.session.pop(key, None)

    return JsonResponse(
        {
            "success": True,
            "message": "Profile saved successfully.",
            "redirect_url": "/dashboard/",
        }
    )
