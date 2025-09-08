# services/telegram_service.py
import requests
import os
from typing import Optional, Dict, List

class TelegramService:
    def __init__(self, bot_token: str):
        self.bot_token = bot_token
        self.base_url = f"https://api.telegram.org/bot{bot_token}"
    
    def make_request(self, method: str, params: Dict) -> Optional[Dict]:
        """Generic method to make Telegram API requests"""
        try:
            url = f"{self.base_url}/{method}"
            response = requests.post(url, json=params, timeout=10)
            response.raise_for_status()
            return response.json()
        except requests.exceptions.HTTPError as e:
            error_msg = f"HTTP Error {e.response.status_code}: {e.response.text}"
            print(f"Telegram API error: {error_msg}")
            return None
        except Exception as e:
            print(f"Telegram API error: {e}")
            return None
    
    def get_chat_member(self, chat_id: str, user_id: int) -> Optional[Dict]:
        """Get chat member information using Telegram API"""
        # Try different chat ID formats
        formats_to_try = self.get_chat_id_formats(chat_id)
        
        for chat_format in formats_to_try:
            result = self.make_request("getChatMember", {
                "chat_id": chat_format,
                "user_id": user_id
            })
            
            if result and result.get('ok'):
                return result
            
            if result and not result.get('ok'):
                error_desc = result.get('description', 'Unknown error')
                print(f"Chat member lookup failed for format '{chat_format}': {error_desc}")
        
        return None
    
    def get_chat_id_formats(self, chat_identifier: str) -> List[str]:
        """Generate different chat ID formats to try"""
        formats = []
        
        # Original format
        formats.append(chat_identifier)
        
        # If it's a username without @, add @
        if not chat_identifier.startswith('@') and not chat_identifier.replace('-', '').isdigit():
            formats.append(f"@{chat_identifier}")
        
        # If it's a username with @, try without
        if chat_identifier.startswith('@'):
            formats.append(chat_identifier[1:])
        
        # Try with -100 prefix for supergroups
        if chat_identifier.replace('-', '').isdigit():
            numeric_id = chat_identifier.replace('-', '')
            if not numeric_id.startswith('100'):
                formats.append(f"-100{numeric_id}")
        
        return formats
    
    def get_chat(self, chat_id: str) -> Optional[Dict]:
        """Get chat information"""
        formats_to_try = self.get_chat_id_formats(chat_id)
        
        for chat_format in formats_to_try:
            result = self.make_request("getChat", {"chat_id": chat_format})
            if result and result.get('ok'):
                return result
        return None
    
    def get_me(self) -> Optional[Dict]:
        """Get bot information"""
        return self.make_request("getMe", {})
    
    def get_chat_administrators(self, chat_id: str) -> Optional[List[Dict]]:
        """Get chat administrators"""
        formats_to_try = self.get_chat_id_formats(chat_id)
        
        for chat_format in formats_to_try:
            result = self.make_request("getChatAdministrators", {"chat_id": chat_format})
            if result and result.get('ok'):
                return result.get('result', [])
        return None
    
    def is_bot_admin(self, chat_id: str) -> bool:
        """Check if our bot is an admin in the chat"""
        bot_info = self.get_me()
        if not bot_info or not bot_info.get('ok'):
            return False
        
        bot_id = bot_info['result']['id']
        admins = self.get_chat_administrators(chat_id)
        
        if not admins:
            return False
        
        for admin in admins:
            if admin['user']['id'] == bot_id:
                # Check if bot has necessary permissions
                if 'can_post_messages' in admin:
                    return admin.get('can_post_messages', False) or admin.get('can_manage_chat', False)
                return True  # For basic groups
        
        return False
    
    def verify_chat_access(self, chat_id: str) -> Dict:
        """Comprehensive chat access verification"""
        result = {
            'chat_exists': False,
            'bot_is_admin': False,
            'chat_info': None,
            'error': None
        }
        
        # Check if chat exists
        chat_info = self.get_chat(chat_id)
        if not chat_info:
            result['error'] = 'Chat not found or inaccessible'
            return result
        
        if chat_info.get('ok'):
            result['chat_exists'] = True
            result['chat_info'] = chat_info['result']
            
            # Check if bot is admin
            result['bot_is_admin'] = self.is_bot_admin(chat_id)
            
            if not result['bot_is_admin']:
                result['error'] = 'Bot is not an administrator in this chat'
        
        return result
    
    def is_user_member(self, chat_identifier: str, user_id: int) -> bool:
        """
        Check if user is member of the chat/channel
        Returns True if user is member, False if not or error
        """
        # First verify chat access
        access_check = self.verify_chat_access(chat_identifier)
        
        if not access_check['chat_exists']:
            print(f"Chat {chat_identifier} not found or inaccessible: {access_check['error']}")
            return False
        
        if not access_check['bot_is_admin']:
            print(f"Bot is not admin in {chat_identifier}. Please add bot as admin with 'View members' permission.")
            return False
        
        # Now check membership
        member_info = self.get_chat_member(chat_identifier, user_id)
        
        if not member_info or not member_info.get('ok'):
            print(f"Failed to get member info for user {user_id} in {chat_identifier}")
            return False
        
        status = member_info['result']['status']
        is_member = status not in ['left', 'kicked']
        
        print(f"User {user_id} status in {chat_identifier}: {status} -> Member: {is_member}")
        return is_member

# Initialize with your bot token
telegram_service = TelegramService(os.getenv('TELEGRAM_BOT_TOKEN'))