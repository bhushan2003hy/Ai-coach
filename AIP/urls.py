from django.contrib import admin
from django.urls import path, include
from AIP import views
from accounts import views as accounts_views


urlpatterns = [

    path("", views.home, name="home"),

    path("login/", views.index, name="Login Page"),

    path("about", views.about, name="about"),

    path("contac", views.contac, name="contac"),

    path("register/", include("accounts.urls")),

    path("check-mobile/",views.check_mobile_registered,name="check_mobile_registered"),
    
    path("google-login/", views.google_login, name="google_login"),
    
    path("github-login/", views.github_login, name="github_login"),

    path("github-callback/", views.github_callback, name="github_callback"),
    
    path("dashboard/", views.dashboard, name="dashboard"),

    path("profile/", views.profile, name="profile"),

    path("complete-profile/",accounts_views.complete_profile,name="complete_profile"),
]