import json
import os

from django.contrib.auth import authenticate, login
from django.db.models import Sum, Count
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
import requests

from .models import Account


@require_http_methods(["GET"])
def info(request):
    mint_url = os.environ["DJANGO_MINT_URL"]
    try:
        response = requests.get(f"{mint_url}/v1/info")
        response.raise_for_status()
        return JsonResponse(response.json())
    except requests.RequestException as e:
        return JsonResponse({"error": str(e)}, status=500)


@require_http_methods(["GET"])
def accounts_list(request):
    """List all accounts (placeholder)."""
    return JsonResponse({"accounts": [], "message": "Account list endpoint"})


@require_http_methods(["GET"])
def stats(request):
    """Get aggregate statistics for all accounts."""
    total_accounts = Account.objects.count()

    # Assets are balances of owned accounts (ecash coinbank holds)
    total_assets = (
        Account.objects.filter(is_staff=True).aggregate(total=Sum("balance"))["total"]
        or 0
    )

    # Liabilities are balances of non-owned accounts (what users hold)
    total_liabilities = (
        Account.objects.filter(is_staff=False).aggregate(total=Sum("balance"))["total"]
        or 0
    )

    # Get coin configuration from environment
    coin_name = os.environ.get("DJANGO_COIN_NAME", "sats")
    coin_symbol = os.environ.get("DJANGO_COIN_SYMBOL", "sats")

    return JsonResponse(
        {
            "total_accounts": total_accounts,
            "total_assets": total_assets,
            "total_liabilities": total_liabilities,
            "coin_name": coin_name,
            "coin_symbol": coin_symbol,
        }
    )


@csrf_exempt
@require_http_methods(["POST"])
def accounts_create(request):
    """Create a new account."""
    try:
        data = json.loads(request.body)
        username = data.get("username")
        password = data.get("password")

        if not username or not password:
            return JsonResponse(
                {"error": "Username and password are required"}, status=400
            )

        # Check if user already exists
        if Account.objects.filter(username=username).exists():
            return JsonResponse({"error": "Username already exists"}, status=400)

        # Create user using Django's create_user (handles password hashing)
        user = Account.objects.create_user(
            username=username,
            password=password,
            is_staff=False,  # New accounts are user accounts, not owned by bank
            balance=0,
        )

        return JsonResponse(
            {
                "message": f"Account created successfully for user: {username}",
                "user_id": user.id,
            },
            status=201,
        )
    except json.JSONDecodeError:
        return JsonResponse({"error": "Invalid JSON"}, status=400)


@csrf_exempt
@require_http_methods(["POST"])
def accounts_login(request):
    """Login to an existing account."""
    try:
        data = json.loads(request.body)
        username = data.get("username")
        password = data.get("password")

        if not username or not password:
            return JsonResponse(
                {"error": "Username and password are required"}, status=400
            )

        # Authenticate user using Django's authentication system
        user = authenticate(request, username=username, password=password)

        if user is not None:
            # Log the user in (creates session)
            login(request, user)
            coin_name = os.environ["DJANGO_COIN_NAME"]
            coin_symbol = os.environ["DJANGO_COIN_SYMBOL"]
            return JsonResponse(
                {
                    "message": f"Login successful for user: {username}",
                    "user_id": user.id,
                    "username": user.username,
                    "balance": user.balance,
                    "coin_name": coin_name,
                    "coin_symbol": coin_symbol,
                    "is_staff": user.is_staff,
                }
            )
        else:
            return JsonResponse({"error": "Invalid username or password"}, status=401)
    except json.JSONDecodeError:
        return JsonResponse({"error": "Invalid JSON"}, status=400)
