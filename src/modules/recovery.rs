pub fn window_title() -> String {
    let session = SESSION.lock().unwrap().clone();
    match session.map(|session| session.mode) {
        Some(Mode::Safe) => "Vevo (safe mode)".to_string(),
        Some(Mode::Probe) => {
            let step = read::<Bisect>("bisect.json").map(|bisect| bisect.tests.len() + 1).unwrap_or(1);
            format!("Vevo (finding the cause, test {step})")
        }
        _ => "Vevo".to_string(),
    }
}
