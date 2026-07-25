from datetime import datetime, timedelta, timezone
from scoring import compute_severity_score, recency_multiplier


def test_recency_multiplier_fresh_indicator():
    """An indicator seen today should get the maximum recency boost."""
    now = datetime.now(timezone.utc)
    assert recency_multiplier(now) == 1.0


def test_recency_multiplier_old_indicator():
    """An indicator not seen in 6 months should get the minimum recency boost."""
    old = datetime.now(timezone.utc) - timedelta(days=200)
    assert recency_multiplier(old) == 0.5


def test_recency_multiplier_naive_datetime_handled():
    """Timestamps without timezone info shouldn't crash the function."""
    naive_now = datetime.now()
    result = recency_multiplier(naive_now)
    assert 0.5 <= result <= 1.0


def test_severity_score_known_reliable_source():
    """A high-confidence hit from a well-known reliable source scores high."""
    now = datetime.now(timezone.utc)
    score = compute_severity_score(confidence=90, source="abuseipdb", last_seen=now)
    # 90 * 0.90 * 1.0 = 81
    assert score == 81


def test_severity_score_unknown_source_uses_default_reliability():
    """Sources not in SOURCE_RELIABILITY should fall back to 0.75 weight."""
    now = datetime.now(timezone.utc)
    score = compute_severity_score(confidence=100, source="some_new_feed", last_seen=now)
    # 100 * 0.75 * 1.0 = 75
    assert score == 75


def test_severity_score_capped_at_100():
    """Score should never exceed 100 even with high confidence and reliability."""
    now = datetime.now(timezone.utc)
    score = compute_severity_score(confidence=100, source="virustotal", last_seen=now)
    assert score <= 100


def test_severity_score_decays_with_age():
    """The same confidence/source should score lower the older the indicator is."""
    now = datetime.now(timezone.utc)
    old = now - timedelta(days=200)

    fresh_score = compute_severity_score(confidence=80, source="otx", last_seen=now)
    old_score = compute_severity_score(confidence=80, source="otx", last_seen=old)

    assert fresh_score > old_score
