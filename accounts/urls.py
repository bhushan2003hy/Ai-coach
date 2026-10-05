from django.urls import path
from .views import (
    register,
    password_reset_done,
    send_email_otp,
    verify_email_otp,
)
from django.contrib.auth import views as auth_views


urlpatterns = [

    # =================================================
    # REGISTER
    # =================================================

    path(
        "",
        register,
        name="register"
    ),

    # =================================================
    # EMAIL OTP
    # =================================================

    path(
        "send-email-otp/",
        send_email_otp,
        name="send_email_otp"
    ),

    path(
        "verify-email-otp/",
        verify_email_otp,
        name="verify_email_otp"
    ),

    # =================================================
    # FORGOT PASSWORD
    # =================================================

    path(
        "forgot-password/",
        auth_views.PasswordResetView.as_view(
            template_name="registration/password_reset_form.html"
        ),
        name="password_reset"
    ),

    # =================================================
    # AFTER PASSWORD RESET EMAIL IS SENT
    # =================================================

    path(
        "forgot-password/done/",
        password_reset_done,
        name="password_reset_done"
    ),

    # =================================================
    # RESET LINK FROM EMAIL
    # =================================================

    path(
        "reset/<uidb64>/<token>/",
        auth_views.PasswordResetConfirmView.as_view(
            template_name="registration/password_reset_confirm.html"
        ),
        name="password_reset_confirm"
    ),

    # =================================================
    # AFTER PASSWORD IS CHANGED
    # =================================================

    path(
        "reset/done/",
        auth_views.PasswordResetCompleteView.as_view(
            template_name="registration/password_reset_complete.html"
        ),
        name="password_reset_complete"
    ),
]