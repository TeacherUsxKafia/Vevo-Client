const topButtons = () => {
    /**
     * @param {string} url must be under OPEN_URL_ALLOWED (constants.rs), the host drops anything else
     * @return {string}
     */
    const openUrl = (url) => `window.chrome.webview.postMessage('open-url, ${url}')`;
    return [
        ["About", "info", "kuteTopBlue", `${globalRef}.showAboutPopup()`],
        ["Website", "language", "kuteTopBlue", openUrl("https://vevoclient.com")],
        ["Source Code", "code", "kuteTopPink", openUrl("https://github.com/TeacherUsxKafia/Vevo-Client")],
        ["Report Issue", "bug_report", "kuteTopPink", openUrl("https://github.com/TeacherUsxKafia/Vevo-Client/issues")],
        ["Manage Swapper", "swap_horiz", "kuteTopOrange", `${globalRef}.swapperManager.open()`],
        ["Manage Userscripts", "extension", "kuteTopOrange", `${globalRef}.userscriptManager.open()`],
    ];
};
