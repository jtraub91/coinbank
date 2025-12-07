from django.urls import path

from . import views

app_name = "accounts"

urlpatterns = [
    path("", views.accounts_list, name="accounts_list"),
    path("create/", views.accounts_create, name="accounts_create"),
    path("login/", views.accounts_login, name="accounts_login"),
    path("me/", views.me, name="me"),
    path("info/", views.info, name="info"),
    path("stats/", views.stats, name="stats"),
    # Transaction endpoints
    path("send/user/", views.send_to_user, name="send_to_user"),
    path("withdraw/bearer/", views.withdraw_bearer, name="withdraw_bearer"),
    path("redeem/", views.redeem_bearer, name="redeem_bearer"),
    path("deposit/", views.deposit, name="deposit"),
    path("deposit/check/", views.check_deposit, name="check_deposit"),
    path("send/lightning/", views.send_to_lightning, name="send_to_lightning"),
]
