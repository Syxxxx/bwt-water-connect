
"""Sensor platform for BWT integration."""
import logging
from datetime import datetime
from typing import Any, Dict, Optional, List

from homeassistant.components.sensor import (
    SensorEntity,
    SensorDeviceClass,
    SensorStateClass,
)
from homeassistant.config_entries import ConfigEntry
from homeassistant.const import (
    VOLUME_LITERS,
    CONF_USERNAME,
)
from homeassistant.core import HomeAssistant
from homeassistant.helpers.entity import DeviceInfo
from homeassistant.helpers.entity_platform import AddEntitiesCallback
from homeassistant.helpers.update_coordinator import (
    CoordinatorEntity,
    DataUpdateCoordinator,
)

from .const import DOMAIN

_LOGGER = logging.getLogger(__name__)

async def async_setup_entry(
    hass: HomeAssistant, entry: ConfigEntry, async_add_entities: AddEntitiesCallback
) -> None:
    """Set up BWT sensor based on a config entry."""
    coordinator = hass.data[DOMAIN][entry.entry_id]["coordinator"]
    
    entities = [
        BWTWaterConsumptionSensor(coordinator, entry),
        BWTRegenerationCountSensor(coordinator, entry),
        BWTSaltAlarmSensor(coordinator, entry),
        BWTPowerOutageSensor(coordinator, entry),
    ]
    
    async_add_entities(entities)


class BWTBaseSensor(CoordinatorEntity, SensorEntity):
    """Base class for BWT sensors."""
    
    def __init__(
        self, 
        coordinator: DataUpdateCoordinator,
        config_entry: ConfigEntry,
        name_suffix: str,
        icon: str,
        sensor_key: str,
        device_class: Optional[str] = None,
        state_class: Optional[str] = None,
        unit_of_measurement: Optional[str] = None,
    ) -> None:
        """Initialize the sensor."""
        super().__init__(coordinator)
        
        self._config_entry = config_entry
        self._attr_name = f"BWT {name_suffix}"
        self._attr_unique_id = f"{config_entry.entry_id}_{sensor_key}"
        self._attr_icon = icon
        self._sensor_key = sensor_key
        
        if device_class:
            self._attr_device_class = device_class
        if state_class:
            self._attr_state_class = state_class
        if unit_of_measurement:
            self._attr_native_unit_of_measurement = unit_of_measurement
            
        self._attr_device_info = DeviceInfo(
            identifiers={(DOMAIN, config_entry.entry_id)},
            name=f"BWT Water Softener ({config_entry.data[CONF_USERNAME]})",
            manufacturer="BWT",
            model="Water Softener",
        )
        
    @property
    def available(self) -> bool:
        """Return if entity is available."""
        return (
            self.coordinator.last_update_success and
            self.coordinator.data and
            self._sensor_key in self.coordinator.data
        )
        
    @property
    def native_value(self) -> Any:
        """Return the state of the sensor."""
        if not self.available:
            return None
        return self.coordinator.data.get(self._sensor_key)


class BWTWaterConsumptionSensor(BWTBaseSensor):
    """Sensor for water consumption."""
    
    def __init__(self, coordinator: DataUpdateCoordinator, config_entry: ConfigEntry) -> None:
        """Initialize the water consumption sensor."""
        super().__init__(
            coordinator=coordinator,
            config_entry=config_entry,
            name_suffix="Water Consumption",
            icon="mdi:water",
            sensor_key="water_consumption",
            device_class=SensorDeviceClass.WATER,
            state_class=SensorStateClass.TOTAL_INCREASING,
            unit_of_measurement=VOLUME_LITERS,
        )
        
    @property
    def extra_state_attributes(self) -> Dict[str, Any]:
        """Return additional attributes."""
        if not self.available:
            return {}
            
        data = self.coordinator.data
        return {
            "last_updated": datetime.now().isoformat(),
            "online": data.get("online", False),
            "connected": data.get("connected", False),
            "last_seen": data.get("last_seen", ""),
        }


class BWTRegenerationCountSensor(BWTBaseSensor):
    """Sensor for regeneration count."""
    
    def __init__(self, coordinator: DataUpdateCoordinator, config_entry: ConfigEntry) -> None:
        """Initialize the regeneration count sensor."""
        super().__init__(
            coordinator=coordinator,
            config_entry=config_entry,
            name_suffix="Regeneration Count",
            icon="mdi:refresh",
            sensor_key="regeneration_count",
            state_class=SensorStateClass.TOTAL_INCREASING,
        )


class BWTSaltAlarmSensor(BWTBaseSensor):
    """Sensor for salt alarm."""
    
    def __init__(self, coordinator: DataUpdateCoordinator, config_entry: ConfigEntry) -> None:
        """Initialize the salt alarm sensor."""
        super().__init__(
            coordinator=coordinator,
            config_entry=config_entry,
            name_suffix="Salt Alarm",
            icon="mdi:alert",
            sensor_key="salt_alarm",
        )


class BWTPowerOutageSensor(BWTBaseSensor):
    """Sensor for power outage."""
    
    def __init__(self, coordinator: DataUpdateCoordinator, config_entry: ConfigEntry) -> None:
        """Initialize the power outage sensor."""
        super().__init__(
            coordinator=coordinator,
            config_entry=config_entry,
            name_suffix="Power Outage",
            icon="mdi:power-plug-off",
            sensor_key="power_outage",
        )
