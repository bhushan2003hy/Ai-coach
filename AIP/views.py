# # from django.shortcuts import render
# # from django.contrib.auth.models import User
# # from django.contrib.auth import login


# # from django.shortcuts import render, HttpResponse

# # def index(request):
# #     return render(request, 'index.html')

# # def about(request):
# #     return HttpResponse("This is Home about")

# # def contac(request):
# #     return HttpResponse("This is Home contac")
# from django.shortcuts import render, HttpResponse
# from django.contrib.auth import authenticate, login


# def index(request):

#     if request.method == "POST":

#         email = request.POST.get("email")
#         password = request.POST.get("password")

#         user = authenticate(
#             request,
#             username=email,
#             password=password
#         )

#         if user is not None:
#             login(request, user)
#             return render(request, "dashboard.html")

#         else:
#             return render(request, "index.html", {
#                 "error": "Invalid email or password"
#             })

#     return render(request, "index.html")


# def about(request):
#     return HttpResponse("This is Home about")


# def contac(request):
#     return HttpResponse("This is Home contac")


# New code 4/1022036


from django.shortcuts import render, HttpResponse
from django.contrib.auth import authenticate, login
from django.contrib.auth.models import User
from django.conf import settings
from django.http import JsonResponse
from django.contrib.auth.models import User

import requests


def index(request):

    if request.method == "POST":

        # =====================================================
        # CHECK LOGIN TYPE
        # =====================================================

        login_type = request.POST.get(
            "login_type",
            "email"
        )

        # =====================================================
        # MOBILE OTP LOGIN
        # =====================================================

        if login_type == "mobile":

            phone = request.POST.get(
                "phone",
                ""
            ).strip()

            id_token = request.POST.get(
                "firebase_id_token",
                ""
            ).strip()

            # -------------------------------------------------
            # VALIDATE MOBILE
            # -------------------------------------------------

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

            # -------------------------------------------------
            # CHECK REGISTERED MOBILE
            # -------------------------------------------------

            user = User.objects.filter(
                username=phone
            ).first()

            if user is None:

                return render(
                    request,
                    "index.html",
                    {
                        "error": "This mobile number is not registered. Please create an account first.",
                        "mobile_mode": True,
                        "phone": phone
                    }
                )

            # -------------------------------------------------
            # FIREBASE TOKEN REQUIRED
            # -------------------------------------------------

            if not id_token:

                return render(
                    request,
                    "index.html",
                    {
                        "error": "Please verify the OTP first.",
                        "mobile_mode": True,
                        "phone": phone
                    }
                )

            # -------------------------------------------------
            # VERIFY FIREBASE ID TOKEN
            # -------------------------------------------------

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
                        "error": "Unable to verify Firebase authentication.",
                        "mobile_mode": True,
                        "phone": phone
                    }
                )

            # -------------------------------------------------
            # CHECK FIREBASE USER
            # -------------------------------------------------

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

            # -------------------------------------------------
            # MAKE SURE FIREBASE PHONE MATCHES
            # -------------------------------------------------

            if firebase_phone != expected_phone:

                return render(
                    request,
                    "index.html",
                    {
                        "error": "Verified mobile number does not match.",
                        "mobile_mode": True,
                        "phone": phone
                    }
                )

            # -------------------------------------------------
            # DJANGO LOGIN
            # -------------------------------------------------

            login(
                request,
                user
            )

            print(
                "MOBILE LOGIN SUCCESSFUL:",
                phone
            )

            # -------------------------------------------------
            # OPEN DASHBOARD
            # -------------------------------------------------

            return render(
                request,
                "dashboard.html"
            )

        # =====================================================
        # EMAIL LOGIN
        # EXISTING FLOW — UNCHANGED
        # =====================================================

        email = request.POST.get(
            "email"
        )

        password = request.POST.get(
            "password"
        )

        user = authenticate(
            request,
            username=email,
            password=password
        )

        if user is not None:

            login(
                request,
                user
            )

            return render(
                request,
                "dashboard.html"
            )

        else:

            return render(
                request,
                "index.html",
                {
                    "error": "Invalid email or password"
                }
            )

    # =========================================================
    # GET REQUEST
    # =========================================================

    return render(
        request,
        "index.html"
    )
def check_mobile_registered(request):

    if request.method != "POST":
        return JsonResponse({
            "registered": False,
            "error": "Invalid request."
        }, status=405)

    phone = request.POST.get(
        "phone",
        ""
    ).strip()

    # Validate mobile number
    if (
        not phone.isdigit()
        or len(phone) != 10
        or phone[0] not in "6789"
    ):
        return JsonResponse({
            "registered": False,
            "error": "Enter a valid 10-digit mobile number."
        })

    # Direct Django database check
    registered = User.objects.filter(
        username=phone
    ).exists()

    return JsonResponse({
        "registered": registered
    })

def about(request):

    return HttpResponse(
        "This is Home about"
    )


def contac(request):

    return HttpResponse(
        "This is Home contac"
    )