from django.shortcuts import render
from django.contrib.auth.models import User
from django.contrib.auth import login


def register(request):
    

    if request.method == 'POST':

        email = request.POST.get('email', '').strip()
        password = request.POST.get('password', '')

        # Empty field check
        if not email:
            return render(request, 'register.html', {
                'error': 'Please enter your email.'
            })

        if not password:
            return render(request, 'register.html', {
                'error': 'Please enter your password.'
            })

        # Check duplicate email
        if User.objects.filter(username=email).exists():
            return render(request, 'register.html', {
                'error': 'This email is already registered.'
            })

        # Create user
        user = User.objects.create_user(
            username=email,
            email=email,
            password=password
        )

        login(request, user)

        return render(request, 'register.html', {
            'success': 'Account created successfully!'
        })
    

    return render(request, 'register.html')

def password_reset_done(request):
    return render(
        request,
        "registration/password_reset_done.html"
    )