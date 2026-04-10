use serde::{Deserialize, Serialize};
use sqlx::{FromRow, SqlitePool};
use bcrypt::{hash, verify, DEFAULT_COST};
use jsonwebtoken::{encode, decode, Header, EncodingKey, DecodingKey, Validation};
use chrono::{Utc, Duration};

/// User with tenant association
#[derive(Debug, Serialize, Deserialize, FromRow, Clone)]
pub struct User {
    pub id: String,
    pub tenant_id: String,
    pub username: String,
    #[serde(skip)]
    pub password_hash: String,
    pub name: String,
    pub department: String,
    pub role: String,
    pub created_at: i64,
    pub updated_at: i64,
}

/// JWT Claims with tenant information
#[derive(Debug, Serialize, Deserialize)]
pub struct Claims {
    pub sub: String,      // user_id
    pub tid: String,      // tenant_id
    pub exp: usize,
}

pub struct AuthService {
    pool: SqlitePool,
    jwt_secret: String,
}

impl AuthService {
    pub fn new(pool: SqlitePool) -> Self {
        Self {
            pool,
            jwt_secret: "secret_key_change_me".to_string(),
        }
    }

    pub async fn ensure_default_user(&self, tenant_id: &str) -> Result<(), String> {
        let count: i64 = sqlx::query_scalar(
            "SELECT COUNT(*) FROM users WHERE tenant_id = ?"
        )
        .bind(tenant_id)
        .fetch_one(&self.pool)
        .await
        .map_err(|e| e.to_string())?;

        if count == 0 {
            let password_hash = hash("admin", DEFAULT_COST).map_err(|e| e.to_string())?;
            let now = Utc::now().timestamp();
            
            sqlx::query(
                "INSERT INTO users (id, tenant_id, username, password_hash, name, department, role, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)"
            )
            .bind(format!("{}-admin-id", tenant_id))
            .bind(tenant_id)
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

    pub async fn login(&self, tenant_id: &str, username: &str, password: &str) -> Result<(User, String), String> {
        let user: Option<User> = sqlx::query_as(
            "SELECT * FROM users WHERE tenant_id = ? AND username = ?"
        )
        .bind(tenant_id)
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
                    tid: user.tenant_id.clone(),
                    exp: expiration as usize,
                };

                let token = encode(&Header::default(), &claims, &EncodingKey::from_secret(self.jwt_secret.as_ref()))
                    .map_err(|e| e.to_string())?;

                return Ok((user, token));
            }
        }

        Err("Invalid username or password".to_string())
    }

    pub async fn register(
        &self,
        tenant_id: &str,
        username: &str,
        password: &str,
        name: &str,
        department: Option<&str>,
    ) -> Result<User, String> {
        let normalized_username = username.trim();
        let normalized_name = name.trim();

        if normalized_username.len() < 3 || normalized_username.len() > 50 {
            return Err("用户名长度需在 3 到 50 个字符之间".to_string());
        }

        if password.len() < 6 || password.len() > 100 {
            return Err("密码长度需在 6 到 100 个字符之间".to_string());
        }

        if normalized_name.is_empty() {
            return Err("姓名不能为空".to_string());
        }

        // Check uniqueness within tenant
        let exists: Option<String> = sqlx::query_scalar(
            "SELECT id FROM users WHERE tenant_id = ? AND username = ?"
        )
        .bind(tenant_id)
        .bind(normalized_username)
        .fetch_optional(&self.pool)
        .await
        .map_err(|e| e.to_string())?;

        if exists.is_some() {
            return Err("用户名已存在".to_string());
        }

        let now = Utc::now().timestamp();
        let user_id = format!("{}-user-{}-{}", tenant_id, normalized_username, now);
        let password_hash = hash(password, DEFAULT_COST).map_err(|e| e.to_string())?;
        let normalized_department = department
            .map(str::trim)
            .filter(|value| !value.is_empty())
            .unwrap_or("未分配");

        sqlx::query(
            "INSERT INTO users (id, tenant_id, username, password_hash, name, department, role, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)"
        )
        .bind(&user_id)
        .bind(tenant_id)
        .bind(normalized_username)
        .bind(password_hash)
        .bind(normalized_name)
        .bind(normalized_department)
        .bind("user")
        .bind(now)
        .bind(now)
        .execute(&self.pool)
        .await
        .map_err(|e| e.to_string())?;

        sqlx::query_as("SELECT * FROM users WHERE id = ?")
            .bind(&user_id)
            .fetch_one(&self.pool)
            .await
            .map_err(|e| e.to_string())
    }
    
    pub async fn verify_token(&self, token: &str) -> Result<Option<User>, String> {
        match decode::<Claims>(
            token,
            &DecodingKey::from_secret(self.jwt_secret.as_ref()),
            &Validation::default(),
        ) {
            Ok(token_data) => {
                let user: Option<User> = sqlx::query_as(
                    "SELECT * FROM users WHERE id = ?"
                )
                .bind(&token_data.claims.sub)
                .fetch_optional(&self.pool)
                .await
                .map_err(|e| e.to_string())?;
                Ok(user)
            }
            Err(_) => Ok(None)
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use sqlx::sqlite::SqlitePoolOptions;

    async fn setup_auth_service() -> AuthService {
        let pool = SqlitePoolOptions::new()
            .max_connections(1)
            .connect("sqlite::memory:")
            .await
            .expect("sqlite in-memory pool should create");

        sqlx::query(
            r#"
            CREATE TABLE IF NOT EXISTS users (
                id TEXT PRIMARY KEY,
                tenant_id TEXT NOT NULL DEFAULT 'default',
                username TEXT NOT NULL,
                password_hash TEXT NOT NULL,
                name TEXT,
                department TEXT,
                role TEXT,
                created_at INTEGER NOT NULL,
                updated_at INTEGER NOT NULL
            );
            CREATE INDEX IF NOT EXISTS idx_users_tenant_id ON users(tenant_id);
            CREATE UNIQUE INDEX IF NOT EXISTS idx_users_tenant_username ON users(tenant_id, username);
            "#,
        )
        .execute(&pool)
        .await
        .expect("users table should be created");

        AuthService::new(pool)
    }

    #[tokio::test]
    async fn register_then_login_success() {
        let auth_service = setup_auth_service().await;
        let tenant_id = "default";

        let registered_user = auth_service
            .register(tenant_id, "qa_register_user", "QaPass123", "验收用户", Some("测试部"))
            .await
            .expect("register should succeed");

        assert_eq!(registered_user.username, "qa_register_user");
        assert_eq!(registered_user.role, "user");
        assert_eq!(registered_user.department, "测试部");
        assert_eq!(registered_user.tenant_id, tenant_id);

        let stored_hash: String = sqlx::query_scalar(
            "SELECT password_hash FROM users WHERE tenant_id = ? AND username = ?"
        )
        .bind(tenant_id)
        .bind("qa_register_user")
        .fetch_one(&auth_service.pool)
        .await
        .expect("stored hash should be queryable");

        assert_ne!(stored_hash, "QaPass123");

        let (logged_in_user, token) = auth_service
            .login(tenant_id, "qa_register_user", "QaPass123")
            .await
            .expect("login should succeed after registration");

        assert_eq!(logged_in_user.username, "qa_register_user");
        assert!(!token.is_empty());
    }

    #[tokio::test]
    async fn register_rejects_duplicate_username_in_same_tenant() {
        let auth_service = setup_auth_service().await;
        let tenant_id = "default";

        auth_service
            .register(tenant_id, "duplicate_user", "QaPass123", "首次用户", Some("测试部"))
            .await
            .expect("first register should succeed");

        let err = auth_service
            .register(tenant_id, "duplicate_user", "QaPass456", "重复用户", Some("测试部"))
            .await
            .expect_err("duplicate register should fail");

        assert_eq!(err, "用户名已存在");
    }

    #[tokio::test]
    async fn same_username_allowed_in_different_tenants() {
        let auth_service = setup_auth_service().await;

        // Register in tenant 1
        let user1 = auth_service
            .register("tenant-1", "john", "password123", "John User", Some("Sales"))
            .await
            .expect("register in tenant 1 should succeed");

        // Register same username in tenant 2
        let user2 = auth_service
            .register("tenant-2", "john", "password456", "John User 2", Some("Marketing"))
            .await
            .expect("register in tenant 2 should succeed");

        assert_eq!(user1.username, "john");
        assert_eq!(user2.username, "john");
        assert_eq!(user1.tenant_id, "tenant-1");
        assert_eq!(user2.tenant_id, "tenant-2");
    }

    #[tokio::test]
    async fn register_validates_username_and_password() {
        let auth_service = setup_auth_service().await;
        let tenant_id = "default";

        let short_username_err = auth_service
            .register(tenant_id, "ab", "QaPass123", "短用户名用户", None)
            .await
            .expect_err("username length should be validated");
        assert_eq!(short_username_err, "用户名长度需在 3 到 50 个字符之间");

        let short_password_err = auth_service
            .register(tenant_id, "valid_user", "12345", "短密码用户", None)
            .await
            .expect_err("password length should be validated");
        assert_eq!(short_password_err, "密码长度需在 6 到 100 个字符之间");
    }

    #[tokio::test]
    async fn ensure_default_user_creates_admin_in_tenant() {
        let auth_service = setup_auth_service().await;
        let tenant_id = "test-tenant";

        auth_service.ensure_default_user(tenant_id)
            .await
            .expect("ensure_default_user should succeed");

        // Verify admin user was created
        let admin_login = auth_service
            .login(tenant_id, "admin", "admin")
            .await;

        assert!(admin_login.is_ok(), "Admin user should be able to login");
    }
}
