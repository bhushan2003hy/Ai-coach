from django.db import models


class Student(models.Model):
    email = models.EmailField(unique=True)
    password = models.CharField(max_length=128)

    def __str__(self):
        return self.email


from django.db import models


class Student(models.Model):
    email = models.EmailField(unique=True)
    password = models.CharField(max_length=128)

    def __str__(self):
        return self.email


class StudentProfile(models.Model):
    student = models.OneToOneField(
        Student,
        on_delete=models.CASCADE,
        related_name="profile"
    )

    full_name = models.CharField(max_length=150)

    mobile = models.CharField(max_length=15)

    college = models.CharField(max_length=200)

    degree = models.CharField(max_length=50)

    branch = models.CharField(max_length=150)

    current_year = models.CharField(max_length=30)

    graduation_year = models.CharField(max_length=10)

    cgpa = models.CharField(max_length=20)

    skills = models.TextField()

    resume = models.FileField(
        upload_to="resumes/",
        blank=True,
        null=True
    )

    github = models.URLField(
        blank=True,
        null=True
    )

    linkedin = models.URLField(
        blank=True,
        null=True
    )

    created_at = models.DateTimeField(
        auto_now_add=True
    )

    updated_at = models.DateTimeField(
        auto_now=True
    )

    def __str__(self):
        return self.full_name

