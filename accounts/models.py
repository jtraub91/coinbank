from django.contrib.auth.models import AbstractUser
from django.db import models
from django.utils import timezone


# Create your models here.
class PaymentRequest(models.Model):
    """Tracks pending deposit/withdraw requests with Lightning invoices."""

    class RequestType(models.TextChoices):
        DEPOSIT = "deposit", "Deposit"
        WITHDRAW = "withdraw", "Withdraw"

    class Status(models.TextChoices):
        PENDING = "pending", "Pending"
        PAID = "paid", "Paid"
        EXPIRED = "expired", "Expired"
        FAILED = "failed", "Failed"

    account = models.ForeignKey(
        "Account", on_delete=models.CASCADE, related_name="payment_requests"
    )
    request_type = models.CharField(max_length=10, choices=RequestType.choices)
    amount = models.BigIntegerField(help_text="Amount in sats")
    quote_id = models.CharField(
        max_length=255, unique=True, help_text="Cashu mint/melt quote ID"
    )
    invoice = models.TextField(help_text="Lightning invoice (bolt11)")
    status = models.CharField(
        max_length=10, choices=Status.choices, default=Status.PENDING
    )
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()
    paid_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["quote_id"]),
            models.Index(fields=["account", "status"]),
        ]

    def __str__(self):
        return f"{self.request_type} {self.amount} sats - {self.status}"

    @property
    def is_expired(self):
        return timezone.now() > self.expires_at and self.status == self.Status.PENDING

    def mark_expired(self):
        if self.status == self.Status.PENDING:
            self.status = self.Status.EXPIRED
            self.save(update_fields=["status"])

    def mark_paid(self):
        if self.status == self.Status.PENDING:
            self.status = self.Status.PAID
            self.paid_at = timezone.now()
            self.save(update_fields=["status", "paid_at"])


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
