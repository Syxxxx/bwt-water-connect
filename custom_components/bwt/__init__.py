
"""BWT Water Softener integration for Home Assistant."""
import logging
from datetime import timedelta

import voluptuous as vol

from homeassistant.config_entries import ConfigEntry
from homeassistant.const import CONF_PASSWORD, CONF_USERNAME, Platform
from homeassistant.core import HomeAssistant
from homeassistant.helpers import config_validation as cv
from homeassistant.helpers.update_coordinator import DataUpdateCoordinator

from .const import DOMAIN, CONF_DEVICE_KEY, CONF_WATER_PRICE, DEFAULT_DEVICE_KEY, DEFAULT_WATER_PRICE
from .bwt_client import BWTClient

_LOGGER = logging.getLogger(__name__)

PLATFORMS = [Platform.SENSOR]
SCAN_INTERVAL = timedelta(minutes=30)

CONFIG_SCHEMA = vol.Schema(
    {
        DOMAIN: vol.Schema(
            {
                vol.Required(CONF_USERNAME): cv.string,
                vol.Required(CONF_PASSWORD): cv.string,
                vol.Optional(CONF_DEVICE_KEY, default=DEFAULT_DEVICE_KEY): cv.string,
                vol.Optional(CONF_WATER_PRICE, default=DEFAULT_WATER_PRICE): vol.Coerce(float),
            }
        )
    },
    extra=vol.ALLOW_EXTRA,
)

async def async_setup(hass: HomeAssistant, config: dict):
    """Set up the BWT component."""
    hass.data[DOMAIN] = {}
    return True

async def async_setup_entry(hass: HomeAssistant, entry: ConfigEntry):
    """Set up BWT from a config entry."""
    username = entry.data[CONF_USERNAME]
    password = entry.data[CONF_PASSWORD]
    device_key = entry.data.get(CONF_DEVICE_KEY, DEFAULT_DEVICE_KEY)
    water_price = entry.data.get(CONF_WATER_PRICE, DEFAULT_WATER_PRICE)
    
    client = BWTClient(username, password, device_key)
    
    # Create update coordinator
    coordinator = DataUpdateCoordinator(
        hass,
        _LOGGER,
        name=DOMAIN,
        update_method=client.fetch_data,
        update_interval=SCAN_INTERVAL,
    )
    
    # Fetch initial data
    await coordinator.async_config_entry_first_refresh()
    
    hass.data[DOMAIN][entry.entry_id] = {
        "client": client,
        "coordinator": coordinator,
        "water_price": water_price,
    }
    
    await hass.config_entries.async_forward_entry_setups(entry, PLATFORMS)
    
    return True

async def async_unload_entry(hass: HomeAssistant, entry: ConfigEntry):
    """Unload a config entry."""
    unload_ok = await hass.config_entries.async_unload_platforms(entry, PLATFORMS)
    
    if unload_ok:
        hass.data[DOMAIN].pop(entry.entry_id)
    
    return unload_ok
