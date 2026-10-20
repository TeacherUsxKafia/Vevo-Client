mod capture;
mod obsabi;

use crate::obsabi::{
    obs_data_t, obs_source_t,
};
use std::os::raw::{c_char, c_void};

macro_rules! debug_print {
    ($($arg:tt)*) => {
        eprintln!($($arg)*);
    };
}

pub struct VevoSource;

impl VevoSource {
    pub fn new() -> Self {
        Self
    }
}

// Back-compat alias for older branding references.
pub type KuteSource = VevoSource;

unsafe extern "C" fn get_name(_data: *mut c_void) -> *const c_char {
    c"Vevo Capture".as_ptr()
}

unsafe extern "C" fn create(_settings: *mut obs_data_t, _source: *mut obs_source_t) -> *mut c_void {
    debug_print!("capture: source created");
    Box::into_raw(Box::new(VevoSource::new())) as *mut c_void
}

unsafe extern "C" fn destroy(data: *mut c_void) {
    if data.is_null() {
        return;
    }
    drop(Box::from_raw(data as *mut VevoSource));
}

unsafe extern "C" fn get_width(_data: *mut c_void) -> u32 {
    0
}

unsafe extern "C" fn get_height(_data: *mut c_void) -> u32 {
    0
}

unsafe extern "C" fn video_tick(_data: *mut c_void, _seconds: f32) {}

unsafe extern "C" fn video_render(_data: *mut c_void, _effect: *mut crate::obsabi::gs_effect_t) {}

#[no_mangle]
pub unsafe extern "C" fn obs_module_load() -> bool {
    let info = crate::obsabi::obs_source_info {
        id: b"vevo_capture\0".as_ptr() as *const c_char,
        source_type: crate::obsabi::OBS_SOURCE_TYPE_INPUT,
        output_flags: crate::obsabi::OBS_SOURCE_VIDEO,
        get_name: Some(get_name),
        create: Some(create),
        destroy: Some(destroy),
        get_width: Some(get_width),
        get_height: Some(get_height),
        get_defaults: None,
        get_properties: None,
        update: None,
        activate: None,
        deactivate: None,
        show: None,
        hide: None,
        video_tick: Some(video_tick),
        video_render: Some(video_render),
    };

    if let Some(obs) = crate::obsabi::OBS.as_ref() {
        (obs.register_source)(&info, std::mem::size_of::<crate::obsabi::obs_source_info>());
        return true;
    }

    false
}
