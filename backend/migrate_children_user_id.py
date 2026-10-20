from sqlalchemy import text
from app.database import engine

def migrate():
    with engine.begin() as conn:
        conn.execute(text("""
            DO $migration$
            BEGIN
                IF NOT EXISTS (
                    SELECT 1 FROM information_schema.columns 
                    WHERE table_name='children' AND column_name='user_id'
                ) THEN
                    ALTER TABLE children ADD COLUMN user_id VARCHAR REFERENCES users(id) ON DELETE SET NULL;
                    CREATE INDEX IF NOT EXISTS ix_children_user_id ON children(user_id);
                END IF;
            END $migration$;
        """))
    print("Children table migration completed: user_id column is active!")

if __name__ == "__main__":
    migrate()
