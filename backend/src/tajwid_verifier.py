import numpy as np

# =============================================================================
# VERIFY MAD
# =============================================================================

def verify_mad(duration):

    if duration < 0.40:

        return {
            "status": "too_short",
            "reason": "Mad terlalu pendek"
        }

    elif duration > 1.20:

        return {
            "status": "too_long",
            "reason": "Mad terlalu panjang"
        }

    return {
        "status": "pass",
        "reason": "Mad benar"
    }

# =============================================================================
# VERIFY GHUNNAH
# =============================================================================

def verify_ghunnah(duration):

    if duration < 0.15:

        return {
            "status": "too_short",
            "reason": "Ghunnah kurang dengung"
        }

    return {
        "status": "pass",
        "reason": "Ghunnah benar"
    }

# =============================================================================
# VERIFY QALQALAH
# =============================================================================

def verify_qalqalah(duration):

    if duration < 0.05:

        return {
            "status": "weak",
            "reason": "Pantulan qalqalah lemah"
        }

    return {
        "status": "pass",
        "reason": "Qalqalah benar"
    }

# =============================================================================
# VERIFY IKHFA
# =============================================================================

def verify_ikhfa(duration):

    if duration < 0.12:

        return {
            "status": "weak",
            "reason": "Ikhfa terlalu cepat"
        }

    return {
        "status": "pass",
        "reason": "Ikhfa benar"
    }