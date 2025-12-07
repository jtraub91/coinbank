import getpass

from django.conf import settings
from django.core.management.base import BaseCommand, CommandError

from accounts.models import Account


class Command(BaseCommand):
    help = "Creates a superuser with the username specified by DJANGO_BANK_WALLET"

    def handle(self, *args, **options):
        username = getattr(settings, "DJANGO_BANK_WALLET", None)
        if not username:
            raise CommandError("DJANGO_BANK_WALLET is not set in settings")

        if Account.objects.filter(username=username).exists():
            raise CommandError(f"User '{username}' already exists")

        password = getpass.getpass("Password: ")
        password_confirm = getpass.getpass("Password (again): ")

        if password != password_confirm:
            raise CommandError("Passwords do not match")

        if not password:
            raise CommandError("Password cannot be blank")

        Account.objects.create_superuser(username=username, password=password)
        self.stdout.write(
            self.style.SUCCESS(f"Superuser '{username}' created successfully")
        )
