from datetime import timedelta
from auth import hash_password, verify_password, create_access_token, decode_access_token


def test_password_hash_is_not_plaintext():
    """Hashed passwords should never equal the original plaintext."""
    hashed = hash_password("mySecretPass123")
    assert hashed != "mySecretPass123"


def test_correct_password_verifies():
    """The original password should verify successfully against its own hash."""
    hashed = hash_password("mySecretPass123")
    assert verify_password("mySecretPass123", hashed) is True


def test_wrong_password_fails_verification():
    """A different password should never verify against someone else's hash."""
    hashed = hash_password("mySecretPass123")
    assert verify_password("wrongPassword", hashed) is False


def test_same_password_produces_different_hashes():
    """Bcrypt salts each hash randomly, so hashing the same password twice
    should never produce identical output (protects against rainbow tables)."""
    hash1 = hash_password("mySecretPass123")
    hash2 = hash_password("mySecretPass123")
    assert hash1 != hash2


def test_access_token_round_trip():
    """A token created with a given payload should decode back to that same payload."""
    token = create_access_token(data={"sub": "user-123", "role": "admin"})
    decoded = decode_access_token(token)
    assert decoded["sub"] == "user-123"
    assert decoded["role"] == "admin"


def test_expired_token_fails_to_decode():
    """A token created with a negative expiry (already expired) should fail decoding."""
    token = create_access_token(
        data={"sub": "user-123"},
        expires_delta=timedelta(minutes=-10),
    )
    decoded = decode_access_token(token)
    assert decoded is None


def test_tampered_token_fails_to_decode():
    """A token with altered characters should be rejected (signature mismatch)."""
    token = create_access_token(data={"sub": "user-123"})
    tampered = token[:-5] + "aaaaa"
    decoded = decode_access_token(tampered)
    assert decoded is None
