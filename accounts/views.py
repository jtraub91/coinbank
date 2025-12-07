import json
import os
from datetime import timedelta

import requests
from asgiref.sync import sync_to_async
from cashu.wallet.wallet import Wallet
from cashu.wallet.helpers import receive as cashu_receive, deserialize_token_from_string
from django.contrib.auth import authenticate, login
from django.db import transaction
from django.db.models import Sum
from django.http import JsonResponse
from django.utils import timezone
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods

from .models import Account, PaymentRequest

# Default invoice expiry in seconds (10 minutes)
INVOICE_EXPIRY_SECONDS = 60


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
    # Exclude superuser from account count
    total_accounts = Account.objects.filter(is_superuser=False).count()

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
    bank_name = os.environ["DJANGO_BANK_NAME"]
    coin_name = os.environ["DJANGO_COIN_NAME"]
    coin_symbol = os.environ["DJANGO_COIN_SYMBOL"]

    return JsonResponse(
        {
            "total_accounts": total_accounts,
            "total_assets": total_assets,
            "total_liabilities": total_liabilities,
            "coin_name": coin_name,
            "coin_symbol": coin_symbol,
            "bank_name": bank_name,
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
            bank_name = os.environ["DJANGO_BANK_NAME"]
            coin_name = os.environ["DJANGO_COIN_NAME"]
            coin_symbol = os.environ["DJANGO_COIN_SYMBOL"]
            return JsonResponse(
                {
                    "message": f"Login successful for user: {username}",
                    "user_id": user.id,
                    "username": user.username,
                    "balance": user.balance,
                    "bank_name": bank_name,
                    "coin_name": coin_name,
                    "coin_symbol": coin_symbol,
                    "is_staff": user.is_staff,
                    "is_superuser": user.is_superuser,
                }
            )
        else:
            return JsonResponse({"error": "Invalid username or password"}, status=401)
    except json.JSONDecodeError:
        return JsonResponse({"error": "Invalid JSON"}, status=400)


def _get_logged_in_user(request):
    """Helper to get the logged-in user from session."""
    if not request.user.is_authenticated:
        return None
    return request.user


@require_http_methods(["GET"])
def me(request):
    """Get current user's data including fresh balance."""
    user = _get_logged_in_user(request)
    if not user:
        return JsonResponse({"error": "Not authenticated"}, status=401)

    # Refresh from database to get current balance
    user.refresh_from_db()

    bank_name = os.environ["DJANGO_BANK_NAME"]
    coin_name = os.environ["DJANGO_COIN_NAME"]
    coin_symbol = os.environ["DJANGO_COIN_SYMBOL"]

    return JsonResponse(
        {
            "user_id": user.id,
            "username": user.username,
            "balance": user.balance,
            "bank_name": bank_name,
            "coin_name": coin_name,
            "coin_symbol": coin_symbol,
            "is_staff": user.is_staff,
            "is_superuser": user.is_superuser,
        }
    )


@csrf_exempt
@require_http_methods(["POST"])
def send_to_user(request):
    """Send coins to another bank user."""
    user = _get_logged_in_user(request)
    if not user:
        return JsonResponse({"error": "Not authenticated"}, status=401)

    try:
        data = json.loads(request.body)
        recipient_username = data.get("recipient_username")
        amount = data.get("amount")

        if not recipient_username or amount is None:
            return JsonResponse(
                {"error": "recipient_username and amount are required"}, status=400
            )

        amount = int(amount)
        if amount <= 0:
            return JsonResponse({"error": "Amount must be positive"}, status=400)

        if amount > user.balance:
            return JsonResponse({"error": "Insufficient balance"}, status=400)

        try:
            recipient = Account.objects.get(username=recipient_username)
        except Account.DoesNotExist:
            return JsonResponse({"error": "Recipient not found"}, status=404)

        if recipient.id == user.id:
            return JsonResponse({"error": "Cannot send to yourself"}, status=400)

        # Atomic transfer
        with transaction.atomic():
            sender = Account.objects.select_for_update().get(id=user.id)
            recipient = Account.objects.select_for_update().get(id=recipient.id)

            if sender.balance < amount:
                return JsonResponse({"error": "Insufficient balance"}, status=400)

            sender.balance -= amount
            recipient.balance += amount
            sender.save()
            recipient.save()

        return JsonResponse(
            {
                "success": True,
                "message": f"Sent {amount} to {recipient_username}",
                "new_balance": sender.balance,
            }
        )
    except json.JSONDecodeError:
        return JsonResponse({"error": "Invalid JSON"}, status=400)
    except ValueError:
        return JsonResponse({"error": "Invalid amount"}, status=400)


async def _load_wallet():
    """Helper to load the cashu wallet."""
    cashu_dir = os.environ["DJANGO_BANK_WALLET_CASHU_DIR"]
    db_path = os.path.join(cashu_dir, os.environ["DJANGO_BANK_WALLET"])

    wallet = await Wallet.with_db(
        url=os.environ["DJANGO_MINT_URL"],
        db=db_path,
        name=os.environ["DJANGO_BANK_WALLET"],
        unit="sat",
    )
    # Always load mint info and keysets
    await wallet.load_mint()

    return wallet


@sync_to_async
def _get_logged_in_user_async(request):
    """Async helper to get the logged-in user from session."""
    if not request.user.is_authenticated:
        return None
    return request.user


@sync_to_async
def _debit_user_and_bank(user_id, amount):
    """Debit user balance and bank assets atomically."""
    bank_username = os.environ["DJANGO_BANK_WALLET"]

    with transaction.atomic():
        account = Account.objects.select_for_update().get(id=user_id)
        if account.balance < amount:
            raise ValueError("Insufficient balance")

        try:
            bank = Account.objects.select_for_update().get(username=bank_username)
            bank.balance -= amount
            bank.save()
        except Account.DoesNotExist:
            pass  # No bank account

        account.balance -= amount
        account.save()
        return account.balance


@csrf_exempt
@require_http_methods(["POST"])
async def withdraw_bearer(request):
    """Withdraw coins as a bearer token using cashu send."""
    user = await _get_logged_in_user_async(request)
    if not user:
        return JsonResponse({"error": "Not authenticated"}, status=401)

    try:
        data = json.loads(request.body)
        amount = data.get("amount")

        if amount is None:
            return JsonResponse({"error": "amount is required"}, status=400)

        amount = int(amount)
        if amount <= 0:
            return JsonResponse({"error": "Amount must be positive"}, status=400)

        if amount > user.balance:
            return JsonResponse({"error": "Insufficient balance"}, status=400)

        # Load wallet and create token
        wallet = await _load_wallet()

        # Load proofs from wallet database
        await wallet.load_proofs()

        # Check wallet has enough balance
        wallet_balance = wallet.available_balance
        if wallet_balance.amount < amount:
            return JsonResponse(
                {
                    "error": f"Insufficient wallet balance ({wallet_balance.amount} < {amount})"
                },
                status=500,
            )

        # Select proofs to send (this may do a swap with the mint if needed)
        send_proofs, fees = await wallet.select_to_send(
            wallet.proofs, amount, set_reserved=True
        )

        if not send_proofs:
            return JsonResponse(
                {"error": "Could not select proofs for amount"}, status=500
            )

        # Serialize proofs to a token string
        token = await wallet.serialize_proofs(send_proofs)

        if not token:
            return JsonResponse({"error": "Failed to generate token"}, status=500)

        # Invalidate the sent proofs from the wallet
        await wallet.invalidate(send_proofs)

        # Deduct from user balance atomically
        try:
            new_balance = await _debit_user_and_bank(user.id, amount)
        except ValueError as e:
            return JsonResponse({"error": str(e)}, status=400)

        return JsonResponse(
            {
                "success": True,
                "token": token,
                "amount": amount,
                "new_balance": new_balance,
            }
        )
    except json.JSONDecodeError:
        return JsonResponse({"error": "Invalid JSON"}, status=400)
    except ValueError:
        return JsonResponse({"error": "Invalid amount"}, status=400)
    except Exception as e:
        return JsonResponse({"error": f"Withdraw failed: {str(e)}"}, status=500)


@csrf_exempt
@require_http_methods(["POST"])
async def redeem_bearer(request):
    """Redeem a bearer token using cashu receive."""
    user = await _get_logged_in_user_async(request)
    if not user:
        return JsonResponse({"error": "Not authenticated"}, status=401)

    try:
        data = json.loads(request.body)
        token = data.get("token")

        if not token:
            return JsonResponse({"error": "token is required"}, status=400)

        # Load wallet and receive token
        wallet = await _load_wallet()

        try:
            # Deserialize and receive the token using cashu helpers
            token_obj = deserialize_token_from_string(token)
            # Get the amount from the token proofs
            amount = sum(p.amount for p in token_obj.proofs)

            # Receive the token (redeem it into wallet)
            await cashu_receive(wallet, token_obj)
        except Exception as e:
            return JsonResponse({"error": f"Invalid token: {str(e)}"}, status=400)

        if not amount or amount <= 0:
            return JsonResponse({"error": "Invalid token"}, status=400)

        # Credit user and bank
        new_balance = await _credit_user_and_bank(user.id, amount)

        return JsonResponse(
            {
                "success": True,
                "message": f"Redeemed {amount}",
                "amount": amount,
                "new_balance": new_balance,
            }
        )
    except json.JSONDecodeError:
        return JsonResponse({"error": "Invalid JSON"}, status=400)
    except Exception as e:
        return JsonResponse({"error": f"Redeem failed: {str(e)}"}, status=500)


@sync_to_async
def _create_payment_request(user, amount, quote_id, invoice, request_type, expires_at):
    """Create a PaymentRequest record in the database."""
    return PaymentRequest.objects.create(
        account=user,
        request_type=request_type,
        amount=amount,
        quote_id=quote_id,
        invoice=invoice,
        expires_at=expires_at,
    )


@sync_to_async
def _get_payment_request(quote_id):
    """Get a PaymentRequest by quote_id."""
    try:
        return PaymentRequest.objects.select_related("account").get(quote_id=quote_id)
    except PaymentRequest.DoesNotExist:
        return None


@sync_to_async
def _credit_user_and_bank(user_id, amount):
    """Credit user balance and bank assets atomically."""
    bank_username = os.environ["DJANGO_BANK_WALLET"]

    with transaction.atomic():
        account = Account.objects.select_for_update().get(id=user_id)
        try:
            bank = Account.objects.select_for_update().get(username=bank_username)
            bank.balance += amount
            bank.save()
        except Account.DoesNotExist:
            pass  # No bank account, just credit user

        account.balance += amount
        account.save()
        return account.balance


@sync_to_async
def _mark_payment_paid(payment_request):
    """Mark a payment request as paid."""
    payment_request.mark_paid()


@sync_to_async
def _mark_payment_expired(payment_request):
    """Mark a payment request as expired."""
    payment_request.mark_expired()


@csrf_exempt
@require_http_methods(["POST"])
async def deposit(request):
    """Create a deposit invoice. Returns invoice to pay."""
    user = await _get_logged_in_user_async(request)
    if not user:
        return JsonResponse({"error": "Not authenticated"}, status=401)

    try:
        data = json.loads(request.body)
        amount = data.get("amount")

        if amount is None:
            return JsonResponse({"error": "amount is required"}, status=400)

        amount = int(amount)
        if amount <= 0:
            return JsonResponse({"error": "Amount must be positive"}, status=400)

        # Load wallet and create mint quote (invoice)
        wallet = await _load_wallet()
        mint_quote = await wallet.request_mint(amount)

        # Calculate expiry time
        expires_at = timezone.now() + timedelta(seconds=INVOICE_EXPIRY_SECONDS)

        # Store payment request in database
        payment_request = await _create_payment_request(
            user=user,
            amount=amount,
            quote_id=mint_quote.quote,
            invoice=mint_quote.request,
            request_type=PaymentRequest.RequestType.DEPOSIT,
            expires_at=expires_at,
        )

        return JsonResponse(
            {
                "success": True,
                "quote_id": mint_quote.quote,
                "invoice": mint_quote.request,
                "amount": amount,
                "expires_at": expires_at.isoformat(),
            }
        )
    except json.JSONDecodeError:
        return JsonResponse({"error": "Invalid JSON"}, status=400)
    except ValueError:
        return JsonResponse({"error": "Invalid amount"}, status=400)
    except Exception as e:
        return JsonResponse(
            {"error": f"Failed to create invoice: {str(e)}"}, status=500
        )


@csrf_exempt
@require_http_methods(["POST"])
async def check_deposit(request):
    """Check if a deposit invoice has been paid and credit the user."""
    user = await _get_logged_in_user_async(request)
    if not user:
        return JsonResponse({"error": "Not authenticated"}, status=401)

    try:
        data = json.loads(request.body)
        quote_id = data.get("quote_id")

        if not quote_id:
            return JsonResponse({"error": "quote_id is required"}, status=400)

        # Get payment request from database
        payment_request = await _get_payment_request(quote_id)
        if not payment_request:
            return JsonResponse({"error": "Payment request not found"}, status=404)

        # Verify ownership
        if payment_request.account_id != user.id:
            return JsonResponse({"error": "Not authorized"}, status=403)

        # Check if already processed
        if payment_request.status == PaymentRequest.Status.PAID:
            return JsonResponse(
                {
                    "success": True,
                    "paid": True,
                    "amount": payment_request.amount,
                    "message": "Already credited",
                }
            )

        if payment_request.status == PaymentRequest.Status.EXPIRED:
            return JsonResponse(
                {
                    "success": True,
                    "paid": False,
                    "expired": True,
                    "message": "Invoice expired",
                }
            )

        # Check if expired
        if payment_request.is_expired:
            await _mark_payment_expired(payment_request)
            return JsonResponse(
                {
                    "success": True,
                    "paid": False,
                    "expired": True,
                    "message": "Invoice expired",
                }
            )

        # Load wallet and try to mint - this checks payment and mints in one call
        wallet = await _load_wallet()

        try:
            # wallet.mint() will succeed if invoice is paid, raise exception if not
            proofs = await wallet.mint(payment_request.amount, quote_id=quote_id)

            # If we get here, payment was successful - credit user and bank
            new_balance = await _credit_user_and_bank(user.id, payment_request.amount)

            # Mark as paid
            await _mark_payment_paid(payment_request)

            return JsonResponse(
                {
                    "success": True,
                    "paid": True,
                    "amount": payment_request.amount,
                    "new_balance": new_balance,
                }
            )
        except Exception as e:
            # Invoice not paid yet (or other error)
            error_msg = str(e).lower()
            if (
                "not paid" in error_msg
                or "pending" in error_msg
                or "unpaid" in error_msg
            ):
                return JsonResponse(
                    {
                        "success": True,
                        "paid": False,
                        "expired": False,
                    }
                )
            # Some other error
            return JsonResponse(
                {
                    "success": True,
                    "paid": False,
                    "expired": False,
                    "debug": str(e),
                }
            )

    except json.JSONDecodeError:
        return JsonResponse({"error": "Invalid JSON"}, status=400)
    except Exception as e:
        return JsonResponse({"error": f"Check failed: {str(e)}"}, status=500)


@csrf_exempt
@require_http_methods(["POST"])
async def send_to_lightning(request):
    """Send to a lightning invoice. Mock version that just debits accounts for demo."""
    user = await _get_logged_in_user_async(request)
    if not user:
        return JsonResponse({"error": "Not authenticated"}, status=401)

    try:
        data = json.loads(request.body)
        invoice = data.get("invoice")
        amount = data.get("amount")

        if not invoice:
            return JsonResponse({"error": "invoice is required"}, status=400)

        if amount is None:
            return JsonResponse({"error": "amount is required"}, status=400)

        amount = int(amount)
        if amount <= 0:
            return JsonResponse({"error": "Amount must be positive"}, status=400)

        if amount > user.balance:
            return JsonResponse({"error": "Insufficient balance"}, status=400)

        # Mock: Just debit user and bank without actually paying the invoice
        # TODO: Uncomment below to use real Lightning payment via mint:
        # wallet = await _load_wallet()
        # await wallet.load_proofs()
        # wallet_balance = wallet.available_balance
        # if wallet_balance < amount:
        #     return JsonResponse({"error": f"Insufficient bank reserves"}, status=500)
        # melt_quote = await wallet.melt_quote(invoice)
        # total_amount = melt_quote.amount + melt_quote.fee_reserve
        # send_proofs, fees = await wallet.select_to_send(wallet.proofs, total_amount, set_reserved=True)
        # melt_response = await wallet.melt(send_proofs, invoice, melt_quote.fee_reserve, melt_quote.quote)

        # Debit user and bank
        try:
            new_balance = await _debit_user_and_bank(user.id, amount)
        except ValueError as e:
            return JsonResponse({"error": str(e)}, status=400)

        return JsonResponse(
            {
                "success": True,
                "message": f"Sent {amount} sats via Lightning (mock)",
                "amount": amount,
                "new_balance": new_balance,
            }
        )
    except json.JSONDecodeError:
        return JsonResponse({"error": "Invalid JSON"}, status=400)
    except ValueError:
        return JsonResponse({"error": "Invalid amount"}, status=400)
    except Exception as e:
        return JsonResponse({"error": f"Send failed: {str(e)}"}, status=500)
