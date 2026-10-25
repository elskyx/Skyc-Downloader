use reqwest::header::{HeaderMap, HeaderName, HeaderValue};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::fs;
use std::str::FromStr;
use tauri::Emitter;

#[derive(Serialize, Clone)]
struct DownloadProgressPayload {
    filename: String,
    downloaded: u64,
    total: Option<u64>,
    percent: u8,
}

#[derive(Serialize)]
struct DownloadResult {
    path: String,
    file_size: u64,
}

#[derive(Deserialize)]
struct HttpRequestPayload {
    url: String,
    method: Option<String>,
    headers: Option<HashMap<String, String>>,
    body: Option<String>,
}

#[derive(Serialize)]
struct HttpResponsePayload {
    status: u16,
    headers: HashMap<String, String>,
    data: String,
    url: String,
}

#[tauri::command]
async fn tauri_http_request(
    url: String,
    method: Option<String>,
    headers: Option<HashMap<String, String>>,
    body: Option<String>,
) -> Result<HttpResponsePayload, String> {
    let client = reqwest::Client::builder()
        .user_agent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36")
        .redirect(reqwest::redirect::Policy::limited(10))
        .timeout(std::time::Duration::from_secs(45))
        .build()
        .map_err(|e| e.to_string())?;

    let m_str = method.unwrap_or_else(|| "GET".to_string()).to_uppercase();
    let method_parsed = reqwest::Method::from_str(&m_str).unwrap_or(reqwest::Method::GET);

    let mut req = client.request(method_parsed, &url);

    if let Some(hdrs) = headers {
        let mut map = HeaderMap::new();
        for (k, v) in hdrs {
            if let (Ok(name), Ok(val)) = (HeaderName::from_str(&k), HeaderValue::from_str(&v)) {
                map.insert(name, val);
            }
        }
        req = req.headers(map);
    }

    if let Some(b) = body {
        req = req.body(b);
    }

    let response = req.send().await.map_err(|e| e.to_string())?;
    let status = response.status().as_u16();
    let final_url = response.url().to_string();

    let mut resp_headers = HashMap::new();
    for (k, v) in response.headers().iter() {
        if let Ok(val_str) = v.to_str() {
            resp_headers.insert(k.as_str().to_string(), val_str.to_string());
        }
    }

    let text_data = response.text().await.map_err(|e| e.to_string())?;

    Ok(HttpResponsePayload {
        status,
        headers: resp_headers,
        data: text_data,
        url: final_url,
    })
}

#[tauri::command]
async fn save_media_file(filename: String, subfolder: String, bytes: Vec<u8>) -> Result<String, String> {
    let target_dir = if std::path::Path::new(&subfolder).is_absolute() {
        std::path::PathBuf::from(&subfolder)
    } else {
        let base_dir = if subfolder.contains("Music") || subfolder.contains("Audio") {
            dirs::audio_dir().unwrap_or_else(|| dirs::download_dir().unwrap_or_default())
        } else if subfolder.contains("Pictures") || subfolder.contains("Photo") {
            dirs::picture_dir().unwrap_or_else(|| dirs::download_dir().unwrap_or_default())
        } else {
            dirs::video_dir().unwrap_or_else(|| dirs::download_dir().unwrap_or_default())
        };
        base_dir.join("Zennx")
    };

    fs::create_dir_all(&target_dir).map_err(|e| e.to_string())?;

    let target_file = target_dir.join(&filename);
    fs::write(&target_file, bytes).map_err(|e| e.to_string())?;

    Ok(target_file.to_string_lossy().to_string())
}

#[tauri::command]
fn open_in_explorer(path: String) -> Result<(), String> {
    #[cfg(target_os = "windows")]
    {
        use std::process::Command;
        Command::new("explorer")
            .arg("/select,")
            .arg(&path)
            .spawn()
            .map_err(|e| e.to_string())?;
    }
    Ok(())
}

#[tauri::command]
async fn download_media_stream(
    app: tauri::AppHandle,
    url: String,
    filename: String,
    subfolder: String,
) -> Result<DownloadResult, String> {
    let target_dir = if std::path::Path::new(&subfolder).is_absolute() {
        std::path::PathBuf::from(&subfolder)
    } else {
        let base_dir = if subfolder.contains("Music") || subfolder.contains("Audio") {
            dirs::audio_dir().unwrap_or_else(|| dirs::download_dir().unwrap_or_default())
        } else if subfolder.contains("Pictures") || subfolder.contains("Photo") {
            dirs::picture_dir().unwrap_or_else(|| dirs::download_dir().unwrap_or_default())
        } else {
            dirs::video_dir().unwrap_or_else(|| dirs::download_dir().unwrap_or_default())
        };
        base_dir.join("Zennx")
    };

    fs::create_dir_all(&target_dir).map_err(|e| e.to_string())?;

    let target_file = target_dir.join(&filename);

    let client = reqwest::Client::builder()
        .user_agent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36")
        .redirect(reqwest::redirect::Policy::limited(10))
        .timeout(std::time::Duration::from_secs(300))
        .build()
        .map_err(|e| e.to_string())?;

    let mut response = client.get(&url).send().await.map_err(|e| e.to_string())?;
    let status = response.status();
    if !status.is_success() {
        return Err(format!("Download failed with HTTP {}", status));
    }

    let total_bytes = response.content_length();
    let mut downloaded_bytes = 0u64;
    let mut last_percent = 0u8;

    use tokio::io::AsyncWriteExt;
    let mut file = tokio::fs::File::create(&target_file).await.map_err(|e| e.to_string())?;

    let mut stream_failed = false;
    let mut stream_err = String::new();

    while let Some(chunk) = response.chunk().await.unwrap_or(None) {
        if let Err(e) = file.write_all(&chunk).await {
            stream_failed = true;
            stream_err = e.to_string();
            break;
        }
        downloaded_bytes += chunk.len() as u64;

        if let Some(total) = total_bytes {
            if total > 0 {
                let pct = ((downloaded_bytes as f64 / total as f64) * 100.0).min(100.0) as u8;
                if pct != last_percent {
                    last_percent = pct;
                    let payload = DownloadProgressPayload {
                        filename: filename.clone(),
                        downloaded: downloaded_bytes,
                        total: Some(total),
                        percent: pct,
                    };
                    let _ = app.emit("zennx://download-progress", payload.clone());
                    let _ = app.emit("skyc://download-progress", payload);
                }
            }
        } else {
            let payload = DownloadProgressPayload {
                filename: filename.clone(),
                downloaded: downloaded_bytes,
                total: None,
                percent: 0,
            };
            let _ = app.emit("zennx://download-progress", payload.clone());
            let _ = app.emit("skyc://download-progress", payload);
        }
    }

    if stream_failed {
        let _ = tokio::fs::remove_file(&target_file).await;
        return Err(format!("Stream write failed: {}", stream_err));
    }

    if let Err(e) = file.flush().await {
        let _ = tokio::fs::remove_file(&target_file).await;
        return Err(format!("Stream flush failed: {}", e));
    }

    Ok(DownloadResult {
        path: target_file.to_string_lossy().to_string(),
        file_size: downloaded_bytes,
    })
}

pub fn run() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            tauri_http_request,
            save_media_file,
            download_media_stream,
            open_in_explorer
        ])
        .run(tauri::generate_context!())
        .expect("Error while running Zennx desktop application");
}
