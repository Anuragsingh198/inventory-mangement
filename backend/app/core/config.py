from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")

    DATABASE_URL: str = "postgresql://postgres:postgres@localhost:5432/inventory_db"
    SECRET_KEY: str = "change-me-to-a-random-secret-key"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    CORS_ORIGINS: str = "http://localhost:5173"

    # Resend email
    RESEND_API_KEY: str = ""
    RESEND_FROM_EMAIL: str = "Ventorio <onboarding@resend.dev>"
    ALERT_EMAIL_RECIPIENTS: str = ""  # comma-separated

    # Google OAuth (optional)
    GOOGLE_CLIENT_ID: str = ""

    # App
    APP_NAME: str = "Ventorio"
    DEFAULT_WAREHOUSE_CODE: str = "MAIN"

    @property
    def cors_origins_list(self) -> list[str]:
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",") if origin.strip()]

    @property
    def alert_email_recipients_list(self) -> list[str]:
        return [e.strip() for e in self.ALERT_EMAIL_RECIPIENTS.split(",") if e.strip()]


settings = Settings()
