# from django.shortcuts import render
# from django.contrib.auth.models import User
# from django.contrib.auth import login


# from django.shortcuts import render, HttpResponse

# def index(request):
#     return render(request, 'index.html')

# def about(request):
#     return HttpResponse("This is Home about")

# def contac(request):
#     return HttpResponse("This is Home contac")
from django.shortcuts import render, HttpResponse
from django.contrib.auth import authenticate, login


def index(request):

    if request.method == "POST":

        email = request.POST.get("email")
        password = request.POST.get("password")

        user = authenticate(
            request,
            username=email,
            password=password
        )

        if user is not None:
            login(request, user)
            return render(request, "dashboard.html")

        else:
            return render(request, "index.html", {
                "error": "Invalid email or password"
            })

    return render(request, "index.html")


def about(request):
    return HttpResponse("This is Home about")


def contac(request):
    return HttpResponse("This is Home contac")