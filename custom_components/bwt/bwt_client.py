
"""BWT API Client for Home Assistant."""
import logging
import aiohttp
import json
import re
from datetime import datetime
from typing import Dict, List, Any, Optional

from .const import API_BASE_URL, API_LOGIN_URL, API_DEVICE_DATA_URL, DEFAULT_DEVICE_KEY

_LOGGER = logging.getLogger(__name__)

class BWTClient:
    """API Client for BWT Water Softener."""
    
    def __init__(self, username: str, password: str, device_key: str = DEFAULT_DEVICE_KEY):
        """Initialize the client."""
        self.username = username
        self.password = password
        self.device_receipt_line_key = device_key
        self.cookies = {}
        self.is_authenticated = False
        self._session = None
    
    async def _get_session(self) -> aiohttp.ClientSession:
        """Get or create aiohttp session."""
        if self._session is None:
            self._session = aiohttp.ClientSession()
        return self._session
    
    async def close(self):
        """Close the session."""
        if self._session:
            await self._session.close()
            self._session = None
    
    async def login(self) -> bool:
        """Login to BWT service."""
        try:
            session = await self._get_session()
            
            # Create form data for direct submission
            form_data = aiohttp.FormData()
            form_data.add_field('_username', self.username)
            form_data.add_field('_password', self.password)
            
            # Make direct request to BWT login endpoint
            async with session.post(
                f"{API_BASE_URL}{API_LOGIN_URL}", 
                data=form_data,
                allow_redirects=True
            ) as response:
                if response.status != 200:
                    _LOGGER.error(f"Authentication error: {response.status}")
                    return False
                
                # Capture all cookies from response
                self.cookies = {key: cookie.value for key, cookie in response.cookies.items()}
                
                if self.cookies:
                    self.is_authenticated = True
                    _LOGGER.info(f"Successfully logged in to BWT at {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
                    _LOGGER.debug(f"Captured cookies: {list(self.cookies.keys())}")
                    return True
                else:
                    _LOGGER.error("No cookies found in response")
                    return False
                
        except Exception as e:
            _LOGGER.error(f"Login error: {str(e)}")
            return False
    
    async def fetch_data(self) -> Dict[str, Any]:
        """Fetch water consumption data from BWT."""
        # Ensure we're authenticated
        if not self.is_authenticated:
            success = await self.login()
            if not success:
                _LOGGER.error("Failed to authenticate before fetching data")
                return {}
        
        try:
            session = await self._get_session()
            
            # Make request to BWT device data endpoint with all stored cookies
            url = f"{API_BASE_URL}{API_DEVICE_DATA_URL}?receiptLineKey={self.device_receipt_line_key}"
            
            async with session.get(url, cookies=self.cookies) as response:
                if response.status != 200:
                    # Try to re-authenticate
                    _LOGGER.warning("Session expired, trying to re-authenticate")
                    await self.login()
                    
                    # Retry the request with fresh cookies
                    async with session.get(url, cookies=self.cookies) as retry_response:
                        if retry_response.status != 200:
                            _LOGGER.error(f"Failed to fetch data: {retry_response.status}")
                            return {}
                        data = await retry_response.json()
                else:
                    data = await response.json()
                
                _LOGGER.info(f"Successfully fetched BWT data at {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
                return self._process_device_data(data.get('dataset', {}))
                
        except Exception as e:
            _LOGGER.error(f"Error fetching water consumption data: {str(e)}")
            return {}
    
    def _process_device_data(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Process device data into a usable format."""
        if not data or 'deviceDataHistory' not in data or 'lines' not in data.get('deviceDataHistory', {}):
            _LOGGER.error("Invalid data received from BWT")
            return {}
        
        history = data.get('deviceDataHistory', {})
        codes = history.get('codes', [])
        lines = history.get('lines', [])
        
        if not lines:
            return {}
        
        # Find the indices of required fields
        water_index = codes.index('waterUse') if 'waterUse' in codes else -1
        regen_count_index = codes.index('regenCount') if 'regenCount' in codes else -1
        power_outage_index = codes.index('powerOutage') if 'powerOutage' in codes else -1
        salt_alarm_index = codes.index('saltAlarm') if 'saltAlarm' in codes else -1
        
        # Get the most recent line
        latest_line = lines[0] if lines else None
        
        if latest_line:
            return {
                "date": latest_line[0],
                "water_consumption": latest_line[water_index] if water_index >= 0 else 0,
                "regeneration_count": latest_line[regen_count_index] if regen_count_index >= 0 else 0,
                "power_outage": latest_line[power_outage_index] if power_outage_index >= 0 else False,
                "salt_alarm": latest_line[salt_alarm_index] if salt_alarm_index >= 0 else False,
                "online": data.get('online', False),
                "connected": data.get('connected', False),
                "last_seen": data.get('lastSeenDateTime', ''),
                "history": [{
                    "date": line[0],
                    "water_consumption": line[water_index] if water_index >= 0 else 0,
                    "regeneration_count": line[regen_count_index] if regen_count_index >= 0 else 0,
                    "power_outage": line[power_outage_index] if power_outage_index >= 0 else False,
                    "salt_alarm": line[salt_alarm_index] if salt_alarm_index >= 0 else False
                } for line in lines]
            }
        
        return {}
