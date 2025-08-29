from functools import wraps
from flask import jsonify
from flask_jwt_extended import verify_jwt_in_request, get_jwt
from models import AdminUser

def admin_required():
    """
    A custom decorator that verifies the JWT is present and the user is an admin.
    In a real app, this would check a claim like 'role' in the JWT payload.
    For this example, we'll check if the user identity exists in the AdminUser table.
    """
    def wrapper(fn):
        @wraps(fn)
        def decorator(*args, **kwargs):
            verify_jwt_in_request()
            claims = get_jwt()
            # This is the recommended way: check for a specific claim
            if claims.get("is_admin"):
                return fn(*args, **kwargs)
            else:
                return jsonify(msg="Admins only!"), 403 # Forbidden
        return decorator
    return wrapper