from .models import IndicatorType, TLPColor

def calculate_severity_score(
    base_confidence: int, 
    indicator_type: IndicatorType, 
    tlp: TLPColor, 
    enrichment_hits: int = 0
) -> int:
    """
    Computes a 0-100 severity score for an indicator.
    """
    score = float(base_confidence)
    
    # 1. Indicator Type Weighting
    # Hashes and CVEs are definitive IOCs, whereas IPs can be shared/dynamic.
    type_weights = {
        IndicatorType.hash_sha256: 1.3,
        IndicatorType.hash_md5: 1.3,
        IndicatorType.cve: 1.4,
        IndicatorType.url: 1.2,
        IndicatorType.domain: 1.1,
        IndicatorType.ip: 1.0,
        IndicatorType.email: 1.0,
    }
    score *= type_weights.get(indicator_type, 1.0)
    
    # 2. TLP Multiplier (Red/Amber implies targeted or highly sensitive threats)
    tlp_multipliers = {
        TLPColor.red: 1.3,
        TLPColor.amber: 1.15,
        TLPColor.green: 1.0,
        TLPColor.clear: 1.0,
    }
    score *= tlp_multipliers.get(tlp, 1.0)
    
    # 3. Enrichment Boost (e.g., if VirusTotal AND AbuseIPDB both flag it)
    score += (enrichment_hits * 5)
    
    # Cap at 100
    return min(int(score), 100)
