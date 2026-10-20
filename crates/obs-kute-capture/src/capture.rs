pub const KUTE_CAPTURE_MAGIC: u32 = 0x5052_4347; // GCRP
pub const KUTE_CAPTURE_VERSION: u32 = 1;
pub const READER_ACTIVE: u32 = 0x1;
const INFO_SIZE: usize = 64;
const SYNCHRONIZE: u32 = 0x0010_0000;

// must match KuteCaptureInfo in render-dll/src/capture.rs byte for byte
#[repr(C, packed)]
pub struct KuteCaptureInfo {
    pub magic: u32,
    pub version: u32,
    pub width: u32,
    pub height: u32,
    pub format: u32,
    pub flags: u32,
    pub frame_counter: u64,
    pub reserved: [u64; 2],
}
