use std::{env, fs};
extern crate embed_resource;
extern crate toml;

include!("resources/version_resource.rs");

fn main() {
    embed_resource::compile("./resources/client.rc", embed_resource::NONE).manifest_optional().ok();
    if let Err(e) = embed_resource::compile("./resources/vevo-manifest.rc", embed_resource::NONE).manifest_required() {
        eprintln!("{}", e);
    }

    let toml_content = fs::read_to_string("Cargo.toml").unwrap();
    let toml: toml::Value = toml::from_str(&toml_content).unwrap();
    
    let package_version = toml.get("package")
        .and_then(|p| p.get("version"))
        .and_then(|v| v.as_str())
        .unwrap_or("1.2.0");

    let js_bundle_version = toml.get("package")
        .and_then(|p| p.get("metadata"))
        .and_then(|m| m.get("js_bundle_version"))
        .and_then(|v| v.as_str())
        .unwrap_or("1.0.0");

    let description = toml.get("package")
        .and_then(|p| p.get("description"))
        .and_then(|d| d.as_str())
        .unwrap_or("Vevo Client");

    embed_version_resource(package_version, "Vevo", description, "vevo.exe", VFT_APP);

    // Ensure the target directory exists before writing bundle_version
    let target_dir = env::current_dir().unwrap().join("target");
    let _ = fs::create_dir_all(&target_dir);
    let _ = fs::write(target_dir.join("bundle_version"), js_bundle_version);

    // Safely update installer script if present
    let wxs_path = "resources/installer_script.wxs";
    if let Ok(wxs_content) = fs::read_to_string(wxs_path) {
        if let Ok(regex) = regex::Regex::new(r#"Version="([^"]+)""#) {
            let current_version = regex.captures(&wxs_content).and_then(|cap| cap.get(1)).map(|m| m.as_str());

            if current_version != Some(package_version) {
                let updated_wxs = regex.replace(&wxs_content, format!(r#"Version="{}""#, package_version)).to_string();
                let _ = fs::write(wxs_path, updated_wxs);
            }
        }
    }

    if env::var("CARGO_CFG_TARGET_OS").as_deref() == Ok("linux") {
        println!("cargo:rustc-link-arg-bins=-Wl,-rpath,$ORIGIN");
    }

    println!("cargo:rerun-if-changed=Cargo.toml");
    println!("cargo:rerun-if-changed=resources/vevo.exe.manifest");
    println!("cargo:rerun-if-changed=resources/comctl6.manifest");
    println!("cargo:rerun-if-changed=resources/vevo-manifest.rc");
    println!("cargo:rerun-if-changed=resources/client.rc");
    println!("cargo:rerun-if-changed=resources/version_resource.rs");
    println!("cargo:rerun-if-changed=resources/vevo.ico");
}
