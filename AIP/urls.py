# from django.contrib import admin
# from django.urls import path
# from AIP import views

# urlpatterns = [
#     path("",views.index,name='Login Page'),
#     path("about",views.about,name='about'),
#     path("contac",views.contac,name='contac')
# ]
from django.contrib import admin
from django.urls import path, include
from AIP import views

urlpatterns = [

    path("", views.index, name="Login Page"),

    path("about", views.about, name="about"),

    path("contac", views.contac, name="contac"),

    path("register/", include("accounts.urls")),

    path("check-mobile/",views.check_mobile_registered,name="check_mobile_registered"),
    
    path("dashboard/", views.dashboard, name="dashboard"),

]