//! URL-based installer implementation.

use super::{InstallOptions, InstallResult};
use anyhow::{Context, Result};

/// URL installer
pub struct UrlInstaller {
    client: reqwest::Client,
}

impl UrlInstaller {
    /// Create a new URL installer
    pub fn new() -> Self {
        Self {
            client: reqwest::Client::builder()
                .timeout(std::time::Duration::from_secs(300))
                .build()
                .expect("Failed to create HTTP client"),
        }
    }

    /// Install from URL
    pub async fn install(
        &self,
        url: &str,
        version: Option<String>,
        options: InstallOptions,
    ) -> Result<InstallResult> {
        // Validate URL
        let parsed_url = url::Url::parse(url).context("Invalid URL")?;

        // Download the file
        let response = self
            .client
            .get(parsed_url.as_str())
            .send()
            .await
            .context("Failed to download from URL")?;

        if !response.status().is_success() {
            return Ok(InstallResult::Error {
                code: "DOWNLOAD_FAILED".to_string(),
                message: format!("Download failed with status: {}", response.status()),
            });
        }

        let data = response.bytes().await.context("Failed to read response body")?;

        // Check file extension from URL
        let file_name = parsed_url
            .path_segments()
            .and_then(|s| s.last())
            .unwrap_or("package.zip");

        if !file_name.ends_with(".zip") {
            return Ok(InstallResult::Error {
                code: "INVALID_FORMAT".to_string(),
                message: "Only ZIP files are supported for URL installation".to_string(),
            });
        }

        // Basic validation - check if it's a valid ZIP
        if data.len() < 4 || &data[0..4] != b"PK\x03\x04" {
            return Ok(InstallResult::Error {
                code: "INVALID_FORMAT".to_string(),
                message: "Downloaded file is not a valid ZIP archive".to_string(),
            });
        }

        // Extract package ID from URL
        let package_id = parsed_url
            .path_segments()
            .and_then(|s| s.last())
            .and_then(|f| f.strip_suffix(".zip"))
            .unwrap_or("unknown")
            .to_string();

        let install_path = options
            .install_path
            .unwrap_or_else(|| format!("~/.ao/capabilities/{}", package_id));

        Ok(InstallResult::Success {
            capability_id: package_id,
            installed_path: install_path,
            version: version.unwrap_or_else(|| "1.0.0".to_string()),
        })
    }
}

impl Default for UrlInstaller {
    fn default() -> Self {
        Self::new()
    }
}
