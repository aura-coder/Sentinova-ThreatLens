import pytest
from fastapi import HTTPException
from deps import require_role
import models


class FakeUser:
    """A minimal stand-in for models.User — only .role is needed by require_role."""
    def __init__(self, role):
        self.role = role


def test_admin_allowed_for_admin_only_route():
    """A user with the admin role should pass an admin-only check."""
    checker = require_role(models.UserRole.admin)
    admin_user = FakeUser(role=models.UserRole.admin)
    result = checker(current_user=admin_user)
    assert result is admin_user


def test_soc_analyst_blocked_from_admin_only_route():
    """A soc_analyst should be rejected from an admin-only route with a 403."""
    checker = require_role(models.UserRole.admin)
    analyst_user = FakeUser(role=models.UserRole.soc_analyst)

    with pytest.raises(HTTPException) as exc_info:
        checker(current_user=analyst_user)

    assert exc_info.value.status_code == 403


def test_multiple_allowed_roles():
    """A route allowing several roles should accept any one of them."""
    checker = require_role(models.UserRole.admin, models.UserRole.security_engineer)
    engineer_user = FakeUser(role=models.UserRole.security_engineer)
    result = checker(current_user=engineer_user)
    assert result is engineer_user


def test_role_not_in_allowed_list_is_rejected():
    """A role outside the allowed set should always be rejected, even with multiple allowed roles."""
    checker = require_role(models.UserRole.admin, models.UserRole.security_engineer)
    executive_user = FakeUser(role=models.UserRole.executive)

    with pytest.raises(HTTPException) as exc_info:
        checker(current_user=executive_user)

    assert exc_info.value.status_code == 403


def test_forbidden_error_message_includes_role_name():
    """The 403 error message should be informative, naming the rejected role."""
    checker = require_role(models.UserRole.admin)
    hunter_user = FakeUser(role=models.UserRole.threat_hunter)

    with pytest.raises(HTTPException) as exc_info:
        checker(current_user=hunter_user)

    assert "threat_hunter" in exc_info.value.detail
