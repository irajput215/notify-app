"""Phone numbers in E.164, the one form Notify stores, indexes and sends to.

WhatsApp addresses a person by their number in E.164 (`+61412345678`), so every number is normalised
to that form at the boundary: once on the way in, never again on the way out. The blind index is
computed over the normalised form, so `0412 345 678` and `+61 412 345 678` find the same contact.

No third-party library: a number is accepted as either an international number (`+` and 8 to 15
digits) or a national number for the workspace's default country (only Australia is wired today).
"""

import re
from typing import Final

_SEPARATORS = re.compile(r"[\s().-]")
_E164 = re.compile(r"^\+[1-9]\d{7,14}$")
#: Default-country rules: the national trunk prefix and the country calling code.
_NATIONAL: Final[dict[str, tuple[str, str]]] = {"AU": ("0", "61")}


class InvalidPhoneNumber(ValueError):
    """The value is not a phone number this module can place. The message never echoes it."""


def normalise(value: str, *, default_country: str = "AU") -> str:
    """`value` in E.164, or `InvalidPhoneNumber`."""
    compact = _SEPARATORS.sub("", value.strip())
    if compact.startswith("00"):
        compact = "+" + compact[2:]
    if not compact.startswith("+"):
        trunk, code = _NATIONAL.get(default_country, ("", ""))
        if trunk and compact.startswith(trunk):
            compact = "+" + code + compact[len(trunk) :]
        elif code and compact.startswith(code):
            compact = "+" + compact
        else:
            raise InvalidPhoneNumber("not a phone number")
    if not _E164.match(compact):
        raise InvalidPhoneNumber("not a phone number")
    return compact
