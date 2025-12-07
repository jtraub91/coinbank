from django.urls import path

from . import views

app_name = "accounts"

urlpatterns = [
    path("", views.accounts_list, name="accounts_list"),
    path("create/", views.accounts_create, name="accounts_create"),
    path("login/", views.accounts_login, name="accounts_login"),
    path("info/", views.info, name="info"),
    path("stats/", views.stats, name="stats"),
]
