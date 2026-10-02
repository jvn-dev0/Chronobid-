import os
import uuid
import httpx
import logging

logger = logging.getLogger("cloud_storage")

SUPABASE_URL = os.getenv("SUPABASE_URL", "https://sqeybzyxdotrykoblccj.supabase.co")
SUPABASE_KEY = os.getenv("SUPABASE_KEY", os.getenv("SUPABASE_ANON_KEY", ""))

BUCKET_AUCTIONS = "auction-items"
BUCKET_SELLER_DOCS = "seller-documents"

async def upload_to_supabase_storage(file_bytes: bytes, filename: str, bucket_name: str = BUCKET_AUCTIONS, content_type: str = "image/jpeg") -> str:
    """
    Uploads file bytes directly to Supabase Storage REST API.
    Returns the permanent public CDN URL of the uploaded image.
    If storage bucket or network fails, falls back gracefully to local disk /uploads/ to prevent crashing.
    """
    ext = os.path.splitext(filename)[1] or ".jpg"
    safe_name = f"{uuid.uuid4().hex[:12]}{ext}"
    
    if SUPABASE_KEY:
        target_url = f"{SUPABASE_URL}/storage/v1/object/{bucket_name}/{safe_name}"
        headers = {
            "Authorization": f"Bearer {SUPABASE_KEY}",
            "apikey": SUPABASE_KEY,
            "Content-Type": content_type,
            "x-upsert": "true"
        }
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.post(target_url, content=file_bytes, headers=headers)
                if response.status_code in [200, 201]:
                    public_cdn_url = f"{SUPABASE_URL}/storage/v1/object/public/{bucket_name}/{safe_name}"
                    logger.info(f"Successfully uploaded image to Supabase Storage: {public_cdn_url}")
                    return public_cdn_url
                else:
                    logger.warning(f"Supabase Storage returned HTTP {response.status_code}: {response.text}")
        except Exception as e:
            logger.error(f"Error streaming to Supabase Storage: {e}")

    # Fallback to local uploads directory if key is unconfigured or cloud storage throws an exception
    base_uploads = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'uploads'))
    target_dir = os.path.join(base_uploads, 'seller_docs') if bucket_name == BUCKET_SELLER_DOCS else base_uploads
    os.makedirs(target_dir, exist_ok=True)
    
    local_file_path = os.path.join(target_dir, safe_name)
    with open(local_file_path, "wb") as f:
        f.write(file_bytes)
        
    rel_prefix = "/uploads/seller_docs/" if bucket_name == BUCKET_SELLER_DOCS else "/uploads/"
    return f"{rel_prefix}{safe_name}"
