#[cfg(windows)]
fn message(text: &str, error: bool) {
    let style = if error { MB_ICONERROR } else { MB_ICONINFORMATION };
    unsafe { MessageBoxW(None, &HSTRING::from(text), w!("Vevo"), MB_OK | style) };
}

// a cli flag, the terminal that ran it reads the answer
#[cfg(target_os = "linux")]
fn message(text: &str, _error: bool) {
    eprintln!("{text}");
}

#[cfg(windows)]
fn protect(text: &str) -> Option<String> {
    dpapi::protect(text, ENTROPY, w!("vevo developer"))
}

#[cfg(target_os = "linux")]
fn protect(text: &str) -> Option<String> {
    dpapi::protect(text, ENTROPY, "vevo developer")
}

// "--set-dev-token=<username>:<token>" stores, empty value forgets
pub fn handle_cli_flags() -> bool {
    let Some(value) = std::env::args().find_map(|arg| arg.strip_prefix(ARG).map(str::to_string)) else {
        return false;
    };

    if value.is_empty() {
        let gone = fs::remove_file(path()).is_ok();
        message(
            if gone {
                "Developer token removed."
            } else {
                "There was no developer token to remove."
            },
            false,
        );
        return true;
    }

    let (user, token) = value.split_once(':').unwrap_or(("", ""));
    let usable = !user.is_empty() && user.len() <= MAX_USER && (MIN_TOKEN..=MAX_TOKEN).contains(&token.len());
    let stored = usable
        && (|| {
            let store = Store {
                version: FILE_VERSION,
                user: protect(user)?,
                token: protect(token)?,
            };
            let text = serde_json::to_string_pretty(&store).ok()?;
            utils::atomic_write(&path(), &text).ok()
        })()
        .is_some();

    if stored {
        message("Developer token stored. Restart Vevo to use it.", false);
    } else {
        message(
            "Could not store the developer token.\n\nExpected --set-dev-token=<username>:<token>, with a token of at least 32 characters.",
            true,
        );
    }
    true
}

