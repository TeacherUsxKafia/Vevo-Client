unsafe extern "C" fn get_name(_data: *mut c_void) -> *const c_char {
    c"Vevo Capture".as_ptr()
}

unsafe extern "C" fn create(_settings: *mut obs_data_t, _source: *mut obs_source_t) -> *mut c_void {
    debug_print!("capture: source created");
    Box::into_raw(Box::new(KuteSource::new())) as *mut c_void
}
