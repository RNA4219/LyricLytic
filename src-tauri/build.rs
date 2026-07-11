use sha2::{Digest, Sha256};
use std::fs::{self, File};
use std::io;
use std::path::{Path, PathBuf};
use std::process::Command;
use zip::ZipArchive;

const DICT_URL: &str = "https://github.com/WorksApplications/SudachiDict/releases/download/v20260428/sudachi-dictionary-20260428-core.zip";
const DICT_SHA256: &str = "40c8ffc095283f07aa06cae922e7b8147bf2919ec8830567b0b3f7a7efa3239f";
const SUDACHI_REV: &str = "f4dd8f20a774bd71d34a7d4ffa00d987b8946f9e";
const RESOURCE_FILES: &[(&str, &str)] = &[
    ("sudachi.json", "resources/sudachi.json"),
    ("char.def", "resources/char.def"),
    ("unk.def", "resources/unk.def"),
];

fn download(url: &str, destination: &Path) {
    let status = Command::new("curl")
        .args(["-L", "--fail", "--silent", "--show-error", "--output"])
        .arg(destination)
        .arg(url)
        .status()
        .unwrap_or_else(|error| panic!("failed to launch curl for {url}: {error}"));
    assert!(status.success(), "download failed: {url}");
}

fn sha256(path: &Path) -> String {
    let mut file = File::open(path).expect("dictionary archive open");
    let mut hash = Sha256::new();
    io::copy(&mut file, &mut hash).expect("dictionary archive hash");
    format!("{:x}", hash.finalize())
}

fn prepare_sudachi_resources() {
    if std::env::var_os("LYRICLYTIC_SKIP_SUDACHI_DICT").is_some() {
        println!("cargo:warning=Sudachi dictionary download skipped by environment");
        return;
    }

    let resource_dir = PathBuf::from("resources").join("sudachi");
    fs::create_dir_all(&resource_dir).expect("create Sudachi resource directory");
    let archive_path = resource_dir.join("sudachi-dictionary-20260428-core.zip");
    if !archive_path.exists() {
        download(DICT_URL, &archive_path);
    }
    let actual = sha256(&archive_path);
    assert_eq!(actual, DICT_SHA256, "Sudachi dictionary SHA-256 mismatch");

    let dictionary_path = resource_dir.join("system_core_20260428.dic");
    if !dictionary_path.exists() {
        let archive_file = File::open(&archive_path).expect("dictionary archive open");
        let mut archive = ZipArchive::new(archive_file).expect("dictionary archive parse");
        let index = (0..archive.len())
            .find(|index| {
                archive
                    .by_index(*index)
                    .map(|entry| entry.name().ends_with("system_core.dic"))
                    .unwrap_or(false)
            })
            .expect("system_core.dic missing from official archive");
        let mut entry = archive.by_index(index).expect("dictionary archive entry");
        let mut output = File::create(&dictionary_path).expect("dictionary resource create");
        io::copy(&mut entry, &mut output).expect("dictionary resource extract");
    }

    for (name, source) in RESOURCE_FILES {
        let destination = resource_dir.join(name);
        if !destination.exists() {
            let url = format!(
                "https://raw.githubusercontent.com/WorksApplications/sudachi.rs/{SUDACHI_REV}/{source}"
            );
            download(&url, &destination);
        }
    }
}

fn main() {
    println!("cargo:rerun-if-changed=icons");
    println!("cargo:rerun-if-changed=tauri.conf.json");
    println!("cargo:rerun-if-env-changed=LYRICLYTIC_SKIP_SUDACHI_DICT");
    prepare_sudachi_resources();
    tauri_build::build()
}
