use serde::{Deserialize, Serialize};
use sqlx::{FromRow, SqlitePool};
use bcrypt::{hash, verify, DEFAULT_COST};
use jsonwebtoken::{encode, Header, EncodingKey};
use chrono::{Utc, Duration};

#[derive(Debug, Serialize, Deserialize, FromRow, Clone)]
pub struct User {
    pub id: String,
    pub username: String,
    #[serde(skip)]
    pub password_hash: String,
    pub name: String,
    pub department: String,
    pub role: String,
    pub created_at: i64,
    pub updated_at: i64,
}

#[derive(Debug, Serialize, Deserialize)]
struct Claims {
    sub: String,
    exp: usize,
}

pub struct AuthService {
    pool: SqlitePool,
    jwt_secret: String,
}

impl AuthService {
    pub fn new(pool: SqlitePool) -> Self {
        Self {
            pool,
            jwt_secret: "secret_key_change_me".to_string(), // In production use env var
        }
    }

    pub async fn ensure_default_user(&self) -> Result<(), String> {
        let count: i64 = sqlx::query_scalar("SELECT COUNT(*) FROM users")
            .fetch_one(&self.pool)
            .await
            .map_err(|e| e.to_string())?;

        if count == 0 {
            let password_hash = hash("admin", DEFAULT_COST).map_err(|e| e.to_string())?;
            let now = Utc::now().timestamp();
            
            sqlx::query(
                "INSERT INTO users (id, username, password_hash, name, department, role, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)"
            )
            .bind("admin-id")
            .bind("admin")
            .bind(password_hash)
            .bind("Admin User")
            .bind("IT")
            .bind("admin")
            .bind(now)
            .bind(now)
            .execute(&self.pool)
            .await
            .map_err(|e| e.to_string())?;
        }
        Ok(())
    }

    pub async fn login(&self, username: &str, password: &str, _remember_me: bool) -> Result<(User, String), String> {
        let user: Option<User> = sqlx::query_as("SELECT * FROM users WHERE username = ?")
            .bind(username)
            .fetch_optional(&self.pool)
            .await
            .map_err(|e| e.to_string())?;

        if let Some(user) = user {
            if verify(password, &user.password_hash).map_err(|e| e.to_string())? {
                let expiration = Utc::now()
                    .checked_add_signed(Duration::hours(24))
                    .expect("valid timestamp")
                    .timestamp();

                let claims = Claims {
                    sub: user.id.clone(),
                    exp: expiration as usize,
                };

                let token = encode(&Header::default(), &claims, &EncodingKey::from_secret(self.jwt_secret.as_ref()))
                    .map_err(|e| e.to_string())?;

                return Ok((user, token));
            }
        }

        Err("Invalid username or password".to_string())
    }
    
    // In a real app, verify token and return user
    pub async fn get_current_user(&self, _token: &str) -> Result<Option<User>, String> {
        // Implementation for token verification would go here
        Ok(None) 
    }
}
