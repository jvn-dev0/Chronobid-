import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    APP_NAME: str = "ChronoBid AI Verification Service"
    HOST: str = "0.0.0.0"
    PORT: int = 8001
    
    BASE_DIR: str = os.path.dirname(os.path.abspath(__file__))
    DATASET_DIR: str = os.path.join(os.path.dirname(os.path.abspath(__file__)), "dataset")
    IMAGE_DIR: str = os.path.join(os.path.dirname(os.path.abspath(__file__)), "dataset", "images")
    METADATA_FILE: str = os.path.join(os.path.dirname(os.path.abspath(__file__)), "dataset", "dataset_metadata.json")
    EMBEDDINGS_FILE: str = os.path.join(os.path.dirname(os.path.abspath(__file__)), "dataset", "embeddings.npy")
    INDEX_FILE: str = os.path.join(os.path.dirname(os.path.abspath(__file__)), "dataset", "embedding_index.json")
    STORAGE_DIR: str = os.path.join(os.path.dirname(os.path.abspath(__file__)), "storage")
    DB_FILE: str = os.path.join(os.path.dirname(os.path.abspath(__file__)), "storage", "uploads.db")
    RULES_FILE: str = os.path.join(os.path.dirname(os.path.abspath(__file__)), "rules.yaml")

    MAX_ITEMS_PER_CATEGORY: int = 150
    CLIP_MODEL_NAME: str = "openai/clip-vit-base-patch32"
    ALLOWED_ORIGINS: list = ["http://localhost:3000", "http://127.0.0.1:3000"]
    MAX_FILE_SIZE_MB: int = 8

settings = Settings()
