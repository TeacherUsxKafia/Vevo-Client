extern crate embed_resource;
extern crate toml;

include!("../../resources/version_resource.rs");

fn main() {
    let version = client_version("../../Cargo.toml");
    embed_version_resource(&version, "Vevo", "Vevo Capture source for OBS", "obs_vevo_capture.dll", VFT_DLL);

    println!("cargo:rerun-if-changed=../../Cargo.toml");
    println!("cargo:rerun-if-changed=../../resources/version_resource.rs");
}
