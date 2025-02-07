// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]
use tauri::command;
use std::process::Command;

fn main() {
    remate_agricola_lib::run()
}


#[command]
fn convert_html_to_pdf(html_path: String) -> Result<(), String> {
    let output_pdf = html_path.replace(".html", ".pdf");
    let result = Command::new("node")
        .args(&["convertToPdf.js", &html_path, &output_pdf])
        .output()
        .expect("Failed to execute Puppeteer");

    if result.status.success() {
        Ok(())
    } else {
        Err("Error al convertir HTML a PDF".to_string())
    }
}