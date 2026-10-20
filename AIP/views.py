# =========================================================
# AIP/views.py
# =========================================================
import secrets
from urllib.parse import urlencode
from django.views.decorators.http import require_GET
from django.core.exceptions import ImproperlyConfigured
from django.contrib.auth.decorators import login_required
from accounts.models import Student, StudentProfile
from django.shortcuts import render, HttpResponse, redirect
from django.contrib.auth import authenticate, login
from django.contrib.auth.models import User
from django.conf import settings
from django.http import JsonResponse

import requests

from google.oauth2 import id_token as google_id_token
from google.auth.transport import requests as google_requests

# HOME / LANDING PAGE


def home(request):
    return render(request, "home.html")


# =========================================================
# LOGIN PAGE
# =========================================================


def index(request):

    if request.method == "POST":

        login_type = request.POST.get("login_type", "email")

        # =================================================
        # MOBILE OTP LOGIN
        # =================================================

        if login_type == "mobile":

            phone = request.POST.get("phone", "").strip()

            firebase_token = request.POST.get("firebase_id_token", "").strip()

            # ---------------------------------------------
            # VALIDATE MOBILE NUMBER
            # ---------------------------------------------

            if not phone.isdigit() or len(phone) != 10 or phone[0] not in "6789":

                return render(
                    request,
                    "index.html",
                    {
                        "error": "Please enter a valid 10-digit mobile number.",
                        "mobile_mode": True,
                    },
                )

            # ---------------------------------------------
            # CHECK REGISTERED MOBILE
            # ---------------------------------------------

            user = User.objects.filter(username=phone).first()

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
                        "phone": phone,
                    },
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
                        "phone": phone,
                    },
                )

            # ---------------------------------------------
            # VERIFY FIREBASE ID TOKEN
            # ---------------------------------------------

            try:

                response = requests.post(
                    "https://identitytoolkit.googleapis.com/v1/accounts:lookup",
                    params={"key": settings.FIREBASE_API_KEY},
                    json={"idToken": firebase_token},
                    timeout=10,
                )

                data = response.json()

                print("FIREBASE LOGIN VERIFY RESPONSE:", data)

            except Exception as e:

                print("FIREBASE LOGIN VERIFY ERROR:", e)

                return render(
                    request,
                    "index.html",
                    {
                        "error": ("Unable to verify Firebase authentication."),
                        "mobile_mode": True,
                        "phone": phone,
                    },
                )

            # ---------------------------------------------
            # CHECK FIREBASE USER
            # ---------------------------------------------

            firebase_users = data.get("users", [])

            if not firebase_users:

                return render(
                    request,
                    "index.html",
                    {
                        "error": "Firebase verification failed.",
                        "mobile_mode": True,
                        "phone": phone,
                    },
                )

            firebase_user = firebase_users[0]

            firebase_phone = firebase_user.get("phoneNumber", "")

            expected_phone = "+91" + phone

            # ---------------------------------------------
            # CHECK PHONE MATCH
            # ---------------------------------------------

            if firebase_phone != expected_phone:

                return render(
                    request,
                    "index.html",
                    {
                        "error": ("Verified mobile number does not match."),
                        "mobile_mode": True,
                        "phone": phone,
                    },
                )

            # ---------------------------------------------
            # DJANGO LOGIN
            # ---------------------------------------------

            login(request, user)

            print("MOBILE LOGIN SUCCESSFUL:", phone)

            return redirect("dashboard")

        # =================================================
        # EMAIL + PASSWORD LOGIN
        # =================================================

        email = request.POST.get("email", "").strip().lower()

        password = request.POST.get("password", "")

        # ---------------------------------------------
        # CHECK EMAIL
        # ---------------------------------------------

        if not email:

            return render(request, "index.html", {"error": "Please enter your email."})

        # ---------------------------------------------
        # CHECK PASSWORD
        # ---------------------------------------------

        if not password:

            return render(
                request, "index.html", {"error": "Please enter your password."}
            )

        # ---------------------------------------------
        # AUTHENTICATE USER
        # ---------------------------------------------

        user = authenticate(request=request, username=email, password=password)

        print("LOGIN EMAIL:", email)

        print("PASSWORD RECEIVED:", bool(password))

        # ---------------------------------------------
        # LOGIN SUCCESS
        # ---------------------------------------------

        if user is not None:

            print("LOGIN AUTHENTICATE: SUCCESS")

            print("USER:", user.username)

            login(request, user)

            print("DJANGO LOGIN SUCCESS")

            return redirect("dashboard")

        # ---------------------------------------------
        # LOGIN FAILED
        # ---------------------------------------------

        print("LOGIN AUTHENTICATE: FAILED")

        return render(
            request,
            "index.html",
            {"error": "This email is not registered create account first."},
        )

    # =================================================
    # GET REQUEST
    # =================================================

    return render(request, "index.html")


# =========================================================
# LOGIN WITH GOOGLE
# =========================================================


def google_login(request):

    if request.method != "POST":

        return JsonResponse({"success": False, "error": "Invalid request."}, status=405)

    # -----------------------------------------------------
    # GET GOOGLE ID TOKEN
    # -----------------------------------------------------

    google_token = request.POST.get("id_token", "").strip()

    if not google_token:

        return JsonResponse(
            {"success": False, "error": "Google ID token is missing."}, status=400
        )

    try:

        # -------------------------------------------------
        # VERIFY GOOGLE ID TOKEN
        # -------------------------------------------------

        decoded_token = google_id_token.verify_oauth2_token(
            google_token, google_requests.Request(), settings.GOOGLE_CLIENT_ID
        )

        # -------------------------------------------------
        # GET GOOGLE USER INFORMATION
        # -------------------------------------------------

        email = decoded_token.get("email", "").strip().lower()

        name = decoded_token.get("name", "").strip()

        # -------------------------------------------------
        # CHECK EMAIL
        # -------------------------------------------------

        if not email:

            return JsonResponse(
                {"success": False, "error": "Google account email not found."},
                status=400,
            )

        print("GOOGLE VERIFIED EMAIL:", email)

        print("GOOGLE VERIFIED NAME:", name)

        # -------------------------------------------------
        # CHECK USER IN DJANGO DATABASE
        # -------------------------------------------------

        user = User.objects.filter(email=email).first()

        # =================================================
        # EXISTING USER
        # =================================================

        if user is not None:

            login(request, user)

            print("EXISTING GOOGLE USER LOGIN:", email)

            return JsonResponse({"success": True, "redirect_url": "/dashboard/"})

        # =================================================
        # NEW GOOGLE USER
        # =================================================

        request.session["google_email"] = email

        request.session["google_name"] = name

        # Google user ke liye mobile mode false rahega
        request.session["mobile_mode"] = False

        print("NEW GOOGLE USER:", email)

        return JsonResponse({"success": True, "redirect_url": "/profile/"})

    except Exception as e:

        print("GOOGLE LOGIN ERROR TYPE:", type(e).__name__)

        print("GOOGLE LOGIN ERROR:", e)

        return JsonResponse({"success": False, "error": str(e)}, status=401)



# =========================================================
# GITHUB LOGIN
# =========================================================

@require_GET
def github_login(request):
    client_id = getattr(settings, "GITHUB_CLIENT_ID", "")
    client_secret = getattr(settings, "GITHUB_CLIENT_SECRET", "")

    if not client_id or not client_secret:
        return HttpResponse("GitHub Login is not configured.", status=500)

    state = secrets.token_urlsafe(32)
    request.session["github_oauth_state"] = state

    params = {
        "client_id": client_id,
        "redirect_uri": (
            "https://ai-coach-production-7d85.up.railway.app/"
            "github-callback/"
        ),
        "scope": "read:user user:email",
        "state": state,
    }

    authorization_url = (
        "https://github.com/login/oauth/authorize?"
        + urlencode(params)
    )
    return redirect(authorization_url)


@require_GET
def github_callback(request):
    if request.GET.get("error"):
        return HttpResponse(
            "GitHub login was cancelled or denied. Please try again.",
            status=400,
        )

    code = request.GET.get("code")
    returned_state = request.GET.get("state")
    saved_state = request.session.pop("github_oauth_state", None)

    if not code or not saved_state or returned_state != saved_state:
        return HttpResponse(
            "Invalid GitHub login response. Please try again.",
            status=400,
        )

    try:
        token_response = requests.post(
            "https://github.com/login/oauth/access_token",
            data={
                "client_id": settings.GITHUB_CLIENT_ID,
                "client_secret": settings.GITHUB_CLIENT_SECRET,
                "code": code,
                "redirect_uri": (
                    "https://ai-coach-production-7d85.up.railway.app/"
                    "github-callback/"
                ),
            },
            headers={"Accept": "application/json"},
            timeout=15,
        )

        token_data = token_response.json()
        access_token = token_data.get("access_token")

        if token_response.status_code != 200 or not access_token:
            print("GITHUB TOKEN ERROR:", token_data)
            return HttpResponse(
                "Unable to complete GitHub login. Please try again.",
                status=400,
            )

        headers = {
            "Authorization": f"Bearer {access_token}",
            "Accept": "application/vnd.github+json",
            "X-GitHub-Api-Version": "2022-11-28",
        }

        user_response = requests.get(
            "https://api.github.com/user",
            headers=headers,
            timeout=15,
        )
        github_data = user_response.json()

        if user_response.status_code != 200:
            print("GITHUB USER ERROR:", github_data)
            return HttpResponse(
                "Unable to retrieve GitHub account details.",
                status=400,
            )

        github_id = str(github_data.get("id", "")).strip()
        name = (
            github_data.get("name")
            or github_data.get("login")
            or ""
        ).strip()

        if not github_id:
            return HttpResponse(
                "GitHub did not provide a valid account ID.",
                status=400,
            )

        # Get the authenticated GitHub user's verified primary email.
        email_response = requests.get(
            "https://api.github.com/user/emails",
            headers=headers,
            timeout=15,
        )

        email = ""

        if email_response.status_code == 200:
            email_data = email_response.json()

            for item in email_data:
                if item.get("primary") and item.get("verified"):
                    email = item.get("email", "").strip().lower()
                    break

        if not email:
            return HttpResponse(
                "GitHub did not provide a verified primary email. "
                "Please make your primary email available in GitHub "
                "or use your existing login method.",
                status=400,
            )

        # Find an existing Django account with the same email.
        existing_user = User.objects.filter(
            email__iexact=email
        ).first()

        if existing_user:
            # Sign in to the existing account.
            login(request, existing_user)

            # Clear stale provider and registration session values.
            for key in (
                "google_email",
                "google_name",
                "github_email",
                "github_name",
                "github_id",
                "email_verified_email",
                "pending_registration_password",
                "registered_mobile",
                "mobile_mode",
            ):
                request.session.pop(key, None)

            print("EXISTING GITHUB USER LOGIN:", email)
            return redirect("dashboard")

        # New GitHub user: continue to profile registration.
        for key in (
            "google_email",
            "google_name",
            "email_verified_email",
            "pending_registration_password",
            "registered_mobile",
        ):
            request.session.pop(key, None)

        request.session["github_email"] = email
        request.session["github_name"] = name
        request.session["github_id"] = github_id
        request.session["mobile_mode"] = False

        print("NEW GITHUB USER:", email)
        return redirect("profile")

    except (requests.RequestException, ValueError) as exc:
        print("GITHUB LOGIN ERROR:", exc)
        return HttpResponse(
            "GitHub login service is temporarily unavailable.",
            status=502,
        )




# =========================================================
# CHECK MOBILE REGISTERED
# =========================================================


def check_mobile_registered(request):

    if request.method != "POST":

        return JsonResponse(
            {"registered": False, "error": "Invalid request."}, status=405
        )

    phone = request.POST.get("phone", "").strip()

    # ---------------------------------------------
    # VALIDATE MOBILE
    # ---------------------------------------------

    if not phone.isdigit() or len(phone) != 10 or phone[0] not in "6789":

        return JsonResponse(
            {"registered": False, "error": ("Enter a valid 10-digit mobile number.")}
        )

    # ---------------------------------------------
    # CHECK DATABASE
    # ---------------------------------------------

    registered = User.objects.filter(username=phone).exists()

    return JsonResponse({"registered": registered})


# =========================================================
# PROFILE
# =========================================================


def profile(request):
    github_email = request.session.get("github_email", "")
    github_name = request.session.get("github_name", "")

    google_email = request.session.get("google_email", "")
    google_name = request.session.get("google_name", "")

    email_verified_email = request.session.get("email_verified_email", "")

    profile_email = github_email or google_email or email_verified_email
    profile_name = github_name or google_name

    mobile_mode = request.session.get("mobile_mode", False)
    registered_mobile = request.session.get("registered_mobile", "")

    return render(
        request,
        "Profile.html",
        {
            "google_email": profile_email,
            "google_name": profile_name,
            "mobile_mode": mobile_mode,
            "registered_mobile": registered_mobile,
        },
    )


# =========================================================
# DASHBOARD
# =========================================================


@login_required(login_url="/")
def dashboard(request):
    user = request.user
    email = (user.email or "").strip().lower()

    # Email login / Google login
    student = Student.objects.filter(email__iexact=email).first() if email else None

    profile = None

    if student:
        profile = StudentProfile.objects.filter(student=student).first()

    # Mobile login: Django username mobile number hai
    if profile is None and user.username.isdigit():
        profile = (
            StudentProfile.objects.filter(mobile=user.username)
            .select_related("student")
            .first()
        )

        if profile:
            student = profile.student

    if request.method == "POST":
        if profile is None:
            return render(
                request,
                "dashboard.html",
                {
                    "profile": None,
                    "profile_error": (
                        "Profile record nahi mila. Pehle registration "
                        "ke dauran profile complete karo."
                    ),
                },
            )

        fields = [
            "full_name",
            "mobile",
            "college",
            "degree",
            "branch",
            "current_year",
            "graduation_year",
            "cgpa",
            "skills",
            "github",
            "linkedin",
        ]

        data = {field: request.POST.get(field, "").strip() for field in fields}

        required_fields = [
            "full_name",
            "mobile",
            "college",
            "degree",
            "branch",
            "current_year",
            "graduation_year",
            "cgpa",
            "skills",
        ]

        if any(not data[field] for field in required_fields):
            return render(
                request,
                "dashboard.html",
                {
                    "profile": profile,
                    "profile_error": "Please fill all required fields.",
                },
            )

        # Existing profile ko hi update karo
        for field, value in data.items():
            setattr(profile, field, value)

        resume = request.FILES.get("resume")
        if resume:
            profile.resume = resume

        profile.save()

        return redirect("dashboard")

    return render(
        request,
        "dashboard.html",
        {
            "profile": profile,
        },
    )


# =========================================================
# ABOUT
# =========================================================


def about(request):

    return HttpResponse("This is Home about")


# =========================================================
# CONTACT
# =========================================================


def contac(request):

    return HttpResponse("This is Home contac")
