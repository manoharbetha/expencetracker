from jose import jwt
from fastapi import Request
from app.core.config import get_settings
from slowapi import Limiter

def custom_get_remote_address(request: Request) -> str:
    settings = get_settings()
    xff = request.headers.get("X-Forwarded-For")
    if xff:
        ips = [ip.strip() for ip in xff.split(",")]
        trusted = settings.trusted_proxies
        for ip in reversed(ips):
            if ip not in trusted:
                return ip
        if ips:
            return ips[0]
    return request.client.host if request.client else "127.0.0.1"

limiter = Limiter(key_func=custom_get_remote_address)

def user_or_ip_limit_key(request: Request) -> str:
    token = request.cookies.get("fintell_token")
    if not token:
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            token = auth_header.split(" ")[1]
            
    if token:
        try:
            settings = get_settings()
            if settings.jwt_secret_key:
                payload = jwt.decode(token, settings.jwt_secret_key, algorithms=[settings.jwt_algorithm])
                sub = payload.get("sub")
                if sub:
                    return f"user:{sub}"
        except Exception:
            pass
            
    return custom_get_remote_address(request)
