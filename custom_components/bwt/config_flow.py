
"""Config flow for BWT integration."""
import logging
import voluptuous as vol

from homeassistant import config_entries
from homeassistant.const import CONF_USERNAME, CONF_PASSWORD
from homeassistant.core import HomeAssistant
from homeassistant.data_entry_flow import FlowResult
from homeassistant.exceptions import HomeAssistantError

from .bwt_client import BWTClient
from .const import DOMAIN, CONF_DEVICE_KEY, CONF_WATER_PRICE, DEFAULT_DEVICE_KEY, DEFAULT_WATER_PRICE

_LOGGER = logging.getLogger(__name__)

class BWTConfigFlow(config_entries.ConfigFlow, domain=DOMAIN):
    """Handle a config flow for BWT."""

    VERSION = 1
    
    async def async_step_user(self, user_input=None) -> FlowResult:
        """Handle the initial step."""
        errors = {}
        
        if user_input is not None:
            try:
                client = BWTClient(
                    username=user_input[CONF_USERNAME],
                    password=user_input[CONF_PASSWORD],
                    device_key=user_input.get(CONF_DEVICE_KEY, DEFAULT_DEVICE_KEY),
                )
                
                # Test the credentials
                success = await client.login()
                
                if success:
                    # Create entry
                    return self.async_create_entry(
                        title=f"BWT ({user_input[CONF_USERNAME]})",
                        data=user_input
                    )
                else:
                    errors["base"] = "invalid_auth"
                    
            except Exception:
                _LOGGER.exception("Unexpected exception during BWT setup")
                errors["base"] = "unknown"
            
            finally:
                await client.close()
                
        # Provide default values
        user_input = user_input or {}
        return self.async_show_form(
            step_id="user",
            data_schema=vol.Schema(
                {
                    vol.Required(CONF_USERNAME): str,
                    vol.Required(CONF_PASSWORD): str,
                    vol.Optional(
                        CONF_DEVICE_KEY, 
                        default=user_input.get(CONF_DEVICE_KEY, DEFAULT_DEVICE_KEY)
                    ): str,
                    vol.Optional(
                        CONF_WATER_PRICE, 
                        default=user_input.get(CONF_WATER_PRICE, DEFAULT_WATER_PRICE)
                    ): vol.Coerce(float),
                }
            ),
            errors=errors,
        )
