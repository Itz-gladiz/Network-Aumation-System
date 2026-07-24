from cryptography.fernet import Fernet, InvalidToken
from django.conf import settings
from django.db import models


def _fernet():
    return Fernet(settings.FIELD_ENCRYPTION_KEY.encode())


class EncryptedCharField(models.CharField):
    """Transparently encrypts on write, decrypts on read. Requires FIELD_ENCRYPTION_KEY in settings."""

    def get_prep_value(self, value):
        if not value:
            return value
        return _fernet().encrypt(value.encode()).decode()

    def from_db_value(self, value, expression, connection):
        if not value:
            return value
        try:
            return _fernet().decrypt(value.encode()).decode()
        except InvalidToken:
            # Value was stored before encryption was enabled, or key changed.
            return value
