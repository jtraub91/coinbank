from django.contrib.auth.models import AbstractUser
from django.db import models


# Create your models here.
class Account(AbstractUser):
    balance = models.BigIntegerField(
        default=0, help_text="Account balance in smallest unit"
    )

    class Meta:
        verbose_name = "Account"
        verbose_name_plural = "Accounts"

    @property
    def is_owned_by_bank(self):
        """Whether this account is owned by coinbank (holds ecash)"""
        return self.is_staff

    @is_owned_by_bank.setter
    def is_owned_by_bank(self, value):
        self.is_staff = value

    def __str__(self):
        return f"{self.username} ({'Bank' if self.is_staff else 'User'})"
