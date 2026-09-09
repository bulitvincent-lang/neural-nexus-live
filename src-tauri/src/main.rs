// Prevents an extra console window on Windows in release builds.
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use serde_json::Value;
use std::io::{Read, Write};
use std::net::{TcpListener, TcpStream};
use std::sync::atomic::{AtomicU16, Ordering};
use std::time::{Duration, Instant};
use tauri::{AppHandle, Emitter, Manager};

/// Local activity bridge port (loopback only). Any local AI runtime, agent
/// script or provider sidecar can POST normalized activity signals here.
const BRIDGE_PORT: u16 = 4319;
/// Max accepted request body (activity signals are tiny).
const MAX_BODY: usize = 16 * 1024;
/// Forward at most this many events per second to the webview.
const RATE_LIMIT_PER_SEC: u32 = 24;

static RATE_COUNT: AtomicU16 = AtomicU16::new(0);

fn main() {
    tauri::Builder::default()
        .setup(|app| {
            let handle = app.handle().clone();
            std::thread::spawn(move || run_bridge(handle));
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![bridge_health])
        .run(tauri::generate_context!())
        .expect("error while running Neural Orb");
}

#[tauri::command]
fn bridge_health() -> &'static str {
    "ok"
}

/// Minimal loopback HTTP server. Accepts POST /activity with a JSON body:
/// either a single signal object or an array of them. Emits each signal to
/// the webview on the `ai-activity` channel consumed by the frontend
/// ActivityBridge. No data is stored; signals are relayed and dropped.
fn run_bridge(app: AppHandle) {
    let listener = match TcpListener::bind(("127.0.0.1", BRIDGE_PORT)) {
        Ok(l) => l,
        Err(e) => {
            eprintln!("[bridge] bind failed on 127.0.0.1:{BRIDGE_PORT}: {e}");
            return;
        }
    };
    let mut window_start = Instant::now();

    for stream in listener.incoming() {
        let Ok(mut stream) = stream else { continue };
        stream
            .set_read_timeout(Some(Duration::from_secs(2)))
            .ok();

        let Some((status, body)) = handle_request(&mut stream) else {
            continue;
        };

        if status == 200 {
            if window_start.elapsed() >= Duration::from_secs(1) {
                window_start = Instant::now();
                RATE_COUNT.store(0, Ordering::Relaxed);
            }
            let signals = match body {
                Value::Array(items) => items,
                single => vec![single],
            };
            for signal in signals {
                let count = RATE_COUNT.fetch_add(1, Ordering::Relaxed);
                if count >= RATE_LIMIT_PER_SEC as u16 {
                    break;
                }
                if let Err(e) = app.emit("ai-activity", &signal) {
                    eprintln!("[bridge] emit failed: {e}");
                    break;
                }
            }
        }
    }
}

/// Reads one HTTP request, writes the response, returns (status, parsed body).
fn handle_request(stream: &mut TcpStream) -> Option<(u16, Value)> {
    let mut raw = Vec::with_capacity(1024);
    let mut buf = [0u8; 4096];
    // Read until end of headers, then the declared body length.
    let mut content_length = 0usize;
    let mut header_end = None;
    loop {
        let n = stream.read(&mut buf).ok()?;
        if n == 0 {
            break;
        }
        raw.extend_from_slice(&buf[..n]);
        if raw.len() > MAX_BODY * 2 {
            respond(stream, 413, "payload too large");
            return None;
        }
        if header_end.is_none() {
            if let Some(pos) = find_subsequence(&raw, b"\r\n\r\n") {
                header_end = Some(pos + 4);
                let headers = String::from_utf8_lossy(&raw[..pos]);
                let first = headers.lines().next().unwrap_or_default();
                if !first.starts_with("POST ") {
                    respond(stream, 405, "method not allowed");
                    return None;
                }
                for line in headers.lines() {
                    if let Some(v) = line.to_ascii_lowercase().strip_prefix("content-length:") {
                        content_length = v.trim().parse().unwrap_or(0);
                    }
                }
                if content_length > MAX_BODY {
                    respond(stream, 413, "payload too large");
                    return None;
                }
            }
        }
        if let Some(start) = header_end {
            if raw.len() >= start + content_length {
                let body = &raw[start..start + content_length];
                return match serde_json::from_slice::<Value>(body) {
                    Ok(value) => {
                        respond(stream, 200, "{\"accepted\":1}");
                        Some((200, value))
                    }
                    Err(_) => {
                        respond(stream, 400, "{\"error\":\"invalid json\"}");
                        None
                    }
                };
            }
        }
    }
    None
}

fn respond(stream: &mut TcpStream, status: u16, body: &str) {
    let reason = match status {
        200 => "OK",
        400 => "Bad Request",
        405 => "Method Not Allowed",
        _ => "Payload Too Large",
    };
    let response = format!(
        "HTTP/1.1 {status} {reason}\r\ncontent-type: application/json\r\ncontent-length: {}\r\naccess-control-allow-origin: *\r\nconnection: close\r\n\r\n{body}",
        body.len()
    );
    stream.write_all(response.as_bytes()).ok();
    stream.flush().ok();
}

fn find_subsequence(haystack: &[u8], needle: &[u8]) -> Option<usize> {
    haystack
        .windows(needle.len())
        .position(|window| window == needle)
}
