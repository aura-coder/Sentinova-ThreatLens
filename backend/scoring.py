from datetime import datetime, timezone

# Source reliability weights (0-1). Documented per source based on how
# trustworthy / well-vetted that feed is known to be in the security community.
SOURCE_RELIABILITY = {
    "abuseipdb": 0.90,
    "otx": 0.85,
    "urlhaus": 0.88,
    "virustotal": 0.92,
}

def recency_multiplier(last_seen: datetime) -> float:
    """
    Returns a multiplier between 0.5 and 1.0 based on how recently the
    indicator was last seen. Fresher threats score higher.
    """
    if last_seen.tzinfo is None:
        last_seen = last_seen.replace(tzinfo=timezone.utc)

    days_old = (datetime.now(timezone.utc) - last_seen).days

    if days_old <= 1:
        return 1.0
    elif days_old <= 7:
        return 0.9
    elif days_old <= 30:
        return 0.75
    elif days_old <= 90:
        return 0.6
    else:
        return 0.5

def compute_severity_score(confidence: int, source: str, last_seen: datetime) -> int:
    """
    Computes a 0-100 severity score from:
    - confidence: the source's own confidence rating (0-100)
    - source: which feed this came from, used to look up reliability weight
    - last_seen: when this indicator was last observed, used for recency decay

    Formula: (confidence * source_reliability) * recency_multiplier
    """
    reliability = SOURCE_RELIABILITY.get(source, 0.75)  # default if unknown source
    recency = recency_multiplier(last_seen)

    raw_score = confidence * reliability * recency
    return round(min(100, max(0, raw_score)))