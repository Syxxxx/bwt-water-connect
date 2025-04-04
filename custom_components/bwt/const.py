
"""Constants for the BWT integration."""

DOMAIN = "bwt"

# Configuration options
CONF_DEVICE_KEY = "device_key"
CONF_WATER_PRICE = "water_price"

# Device attributes
ATTR_WATER_CONSUMPTION = "water_consumption"
ATTR_REGENERATION_COUNT = "regeneration_count"
ATTR_POWER_OUTAGE = "power_outage"
ATTR_SALT_ALARM = "salt_alarm"

# Units
VOLUME_CUBIC_METERS = "m³"
CURRENCY_EURO = "€"

# API endpoints
API_BASE_URL = "https://www.bwt-monservice.com"
API_LOGIN_URL = "/login"
API_DEVICE_DATA_URL = "/device/ajaxChart"

# Default device key (can be overridden in config)
DEFAULT_DEVICE_KEY = "00248808:1781377"
DEFAULT_WATER_PRICE = 3.5  # Default price in € per cubic meter
