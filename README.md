
# BWT Water Softener Integration for Home Assistant

This integration allows you to monitor your BWT water softener in Home Assistant.

## Features

- Monitor water consumption
- Track regeneration count
- Get alerts for salt level and power outages
- View device status (online, connected, last seen)

## Installation

### Manual Installation

1. Copy the `custom_components/bwt` directory to your Home Assistant `custom_components` directory.
2. Restart Home Assistant.
3. Go to **Settings** > **Devices & Services** > **Add Integration** and search for "BWT Water Softener".
4. Follow the configuration flow.

### HACS Installation

1. Add this repository as a custom repository in HACS.
2. Search for "BWT Water Softener" in the HACS store and install it.
3. Restart Home Assistant.
4. Go to **Settings** > **Devices & Services** > **Add Integration** and search for "BWT Water Softener".
5. Follow the configuration flow.

## Configuration

During the setup, you'll need to provide:

- Your BWT username
- Your BWT password

## Entities

This integration adds the following entities:

- **Sensor: BWT Water Consumption** - Current water consumption in liters
- **Sensor: BWT Regeneration Count** - Number of regeneration cycles
- **Binary Sensor: BWT Salt Alarm** - Indicates if salt level is low
- **Binary Sensor: BWT Power Outage** - Indicates if a power outage has occurred

## Credits

This integration is based on the BWT API and is not affiliated with BWT.
