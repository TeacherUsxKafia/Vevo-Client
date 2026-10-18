import styles from "./components/base.css";
import { kute, ready, globalRef } from "./client.js";
import { hook, getElement, checkCompMode } from "./utils.js";
import { setRampBoost } from "./modules/rampBoost.js";
import { postUrls as postIconUrls } from "./modules/kuteIcons/slots.js";
import "./modules/managers/registry.js";
import "./modules/customCss.js";
import "./modules/sessionRecovery.js";

const isBenchPage = location.pathname === "/vevo-bench";
if (isBenchPage) import("./modules/autoDetect/bench.js");

if (!isBenchPage && localStorage.getItem("krk_advanced") === null) localStorage.setItem("krk_advanced", "1");
if (!isBenchPage) postIconUrls();
if (!isBenchPage){
    ready.then(() => {
        if (kute.settings?.data?.vevoCss === true) import("./modules/kuteCss.js").catch(() => {});
    });
}

if (location.hostname === "krunker.io" && location.pathname === "/"){
    ready.then(() => {
        if (kute.settings?.data?.accountEndMessage) localStorage.setItem("kro_setngss_endMessage", "");
    });
}

let initialLoad = true;
window.OffCliV = true;
window.closeClient = () => window.chrome.webview.postMessage("close");

document.addEventListener(
    "DOMContentLoaded",
    () => {
        if (isBenchPage) return;

        window.localStorage.setItem("cont_shoot1Key_alt", "131");
        import("./modules/gameFpsLimit.js");
        import("./modules/logoBadge.js");

        const baseCSS = document.createElement("style");
        baseCSS.textContent = styles;
        document.head.append(baseCSS);

        let wheelListener = null;
        hook(HTMLCanvasElement, "addEventListener", (args) => {
            const [type, listener] = args;
            if (type === "wheel") wheelListener = listener;
        });

        window.chrome.webview.addEventListener("message", (event) => {
            if (typeof event.data?.wheel === "number") wheelListener?.(new WheelEvent("wheel", { deltaY: event.data.wheel }));
        });

        window.addEventListener("wheel", (event) => {
            if (document.pointerLockElement) return;
            for (const el of event.composedPath()){
                if (el === document.body || el === document.documentElement) break;
                if (!(el instanceof Element)) continue;
                const style = getComputedStyle(el);
                const scrollsY = (style.overflowY === "auto" || style.overflowY === "scroll") && el.scrollHeight > el.clientHeight;
                const scrollsX = (style.overflowX === "auto" || style.overflowX === "scroll") && el.scrollWidth > el.clientWidth;
                if (scrollsY || scrollsX) return;
            }
            event.preventDefault();
        }, { capture: true, passive: false });

        hook(HTMLCanvasElement, "requestPointerLock", function(args, original){
            window.chrome.webview.postMessage("drag, false");
            window.chrome.webview.postMessage("throttle, game");

            const unadjustedMovement = kute.platform !== "linux" && kute?.settings?.data?.rawInput;
            return original.call(this, { ...args[0], unadjustedMovement });
        });

        document.addEventListener("pointerlockchange", () => {
            if (!document.pointerLockElement){
                window.chrome.webview.postMessage("drag, true");
                window.chrome.webview.postMessage("throttle, menu");
            }
            else {
                window.chrome.webview.postMessage("throttle, game");
            }
        });

        ready.then(() => {
            if (kute.settings.data.hidePopularNow === true){
                kute.settings.data.hidePopularNow = false;
                window.chrome.webview.postMessage("set-config, hidePopularNow, false");
                kute.settings.data.cleanUI = true;
                window.chrome.webview.postMessage("set-config, cleanUI, true");
            }
            if (!kute.settings.data.cleanUI) return;
            import("./components/clean.css").then((css) => {
                const cleanCSS = document.createElement("style");
                cleanCSS.id = "vevo_cleanCSS";
                cleanCSS.textContent = css.default;
                document.head.append(cleanCSS);
            });
        });

        ready.then(() => {
            if (!kute.settings.data.classicMenu) return;
            import("./components/classicMenu.css").then((css) => {
                const classicMenuCSS = document.createElement("style");
                classicMenuCSS.id = "vevo_classicMenuCSS";
                classicMenuCSS.textContent = css.default;
                document.head.append(classicMenuCSS);
            });
        });
    },
    { once: true },
);

Object.defineProperty(window, "gameLoaded", {
    async set(value){
        if (!value) return;

        await ready;

        window.chrome.webview.postMessage("game-updated");
        if (!initialLoad) return;
        if (sessionStorage.getItem("justLaunched") === null) sessionStorage.setItem("justLaunched", "true");
        else sessionStorage.setItem("justLaunched", "false");

        initialLoad = false;
        localStorage.setItem("logs", "true");

        getElement("#compBtnLst").insertAdjacentHTML("beforeend", `
		<div class="compMenBtnS" onmouseenter='SOUND.play("tick_0",.1)' style="background-color: #f5479b" onclick="playSelect(),showWindow(4)"> <span class="material-icons" style="color:#fff;font-size:40px;vertical-align:middle;margin-bottom:12px">color_lens</span></div>
		<div class="compMenBtnS" onmouseenter='SOUND.play("tick_0",.1)' style="background-color: #5ce05a" onclick="playSelect(),window.openRankedMenu()"><span class="material-icons" style="color:#fff;font-size:40px;vertical-align:middle;margin-bottom:12px">star</span></div>`);

        let svelteCode;
        for (const cl of getElement("#clientExit .menuItemTitle").classList){
            if (cl.startsWith("svelte-")){
                svelteCode = cl;
                break;
            }
        }

        getElement("#menuItemContainer").lastElementChild?.insertAdjacentHTML(
            "beforebegin",
            `<div onclick="window.open('./social.html')" class="menuItem ${svelteCode}"><span class="material-icons-outlined menuItemIcon ${svelteCode}">open_in_new</span><div class="menuItemTitle ${svelteCode}">Classic Social</div></div>`,
        );

        const whatsNewClass = document.querySelector(".whats-new-version")?.className;
        const versionAttr = whatsNewClass ? `class="${whatsNewClass}"` : "style=\"font-size:.7em;font-weight:700;color:rgba(255,255,255,.5)\"";
        const versionTag = kute.version ? `<span ${versionAttr}>&nbsp;- v${kute.version}</span>` : "";
        getElement("#clientExit").insertAdjacentHTML(
            "beforebegin",
            `<div onclick='${globalRef}.openKuteSettings()' class="menuItem ${svelteCode}"><span class="material-icons menuItemIcon ${svelteCode}">settings</span><div class="menuItemTitle ${svelteCode}">Vevo Settings${versionTag}</div></div>`,
        );

        import("./notifications.js");
        import("./settings.js");
        import("./modules/changelog.js");
        import("./modules/about.js");
        import("./modules/managers/index.js");
        import("./modules/withdrawn.js");
        import("./modules/autoDetect/index.js");
        if (kute?.settings?.data?.clanColors !== false && kute?.settings?.data?.disableOnlineFeatures !== true) import("./modules/clanColors.js");
        import("./modules/badges.js");
        import("./modules/externalQueue.js");
        const performanceMode = kute.settings.data.performanceMode === true;
        if (!performanceMode) import("./modules/bpClaimAll.js");
        import("./modules/args.js");
        import("./modules/fixes.js");
        import("./modules/inventoryScroll.js");
        import("./modules/chatDraft.js");
        if (!performanceMode) import("./modules/versionTag.js");
        if (!performanceMode) import("./modules/rankProgress.js");
        import("./modules/importSettings.js");
        import("./modules/matchmaker.js");
        import("./modules/hotkeys.js");
        import("./modules/settingsTransfer.js");
        import("./modules/diagnostics.js");
        if (kute.recovery) import("./modules/recovery.js");
        import("./modules/nukeCounter.js");
        import("./modules/accountEndMessage.js");
        import("./modules/kuteIcons/index.js");
        import("./modules/menuTimer.js");
        import("./modules/hudEditor/index.js");
        if (kute?.settings?.data?.hsSound) import("./modules/hsSound.js");
        if (kute?.settings?.data?.betterChat) import("./modules/betterChat.js");
        if (kute?.settings?.data?.chatLogs) import("./modules/chatLogs.js");
        import("./modules/modDownload.js");
        import("./modules/serverPings.js");
        if (kute?.settings?.data?.rankedAlert) import("./modules/rankedAlert.js");
        if (kute?.settings?.data?.hpEnemyCounter) import("./modules/hpEnemyCounter.js");
        if (kute?.settings?.data?.accountManager) import("./modules/accountManager.js");
        if (kute?.settings?.data?.showPing) import("./modules/showPing.js");
        if (kute?.settings?.data?.realPing) import("./modules/realPing.js");
        if (kute?.settings?.data?.exitButton) getElement("#clientExit").style.display = "flex";
        import("./modules/renderFps.js");
        if (kute?.settings?.data?.spotifyOverlay && kute.hostFeatures?.includes("spotify")) import("./modules/spotifyOverlay.js");
        if (kute?.settings?.data?.motionBlur) import("./modules/motionBlur.js");
        if (kute?.settings?.data?.keystrokes) import("./modules/keystrokes.js");
        if (kute.hostFeatures?.includes("custom-sky")) import("./modules/customSky.js");
        if (kute.hostFeatures?.includes("appimage-update")) import("./modules/linuxUpdate.js").catch(() => {});

        if (kute?.settings?.data?.rampBoost && !checkCompMode()){
            setRampBoost(true);

            const gameUpdateListener = (event) => {
                if (event.data === "game-updated"){
                    setTimeout(() => {
                        if (checkCompMode()){
                            window.chrome.webview.removeEventListener("message", gameUpdateListener);
                            setRampBoost(false);
                        }
                    }, 2000);
                }
            };

            window.chrome.webview.addEventListener("message", gameUpdateListener);
        }

        if (kute?.settings.data?.hideBundles){
            const origBundlePopup = window.bundlePopup;
            window.bundlePopup = (...args) => {
                const windowHolder = document.querySelector("#windowHolder");
                if (
                    windowHolder &&
                    windowHolder.style.display !== "none" &&
                    getElement("#windowHeader").textContent === "Store"
                ){
                    origBundlePopup(...args);
                }
            };
        }

        setTimeout(() => {
            if (sessionStorage.getItem("justLaunched") === "true" && kute?.launchArgs){
                kute.parseArgs(kute.launchArgs);
            }
        }, 2000);

        if (kute?.settings.data?.autoSpec){
            let tries = 0;
            const trySetSpect = () => {
                const activity = window.getGameActivity();
                if (activity.map === null){
                    if (++tries < 600) setTimeout(trySetSpect, 100);
                    return;
                }
                if (!activity.custom) window.setSpect(true);
            };
            trySetSpect();
        }

        if (kute?.settings.data?.discordRPC){
            window.chrome.webview.addEventListener("message", (event) => {
                if (event.data !== "game-updated") return;
                setTimeout(() => {
                    const gameStatus = window.getGameActivity();
                    window.chrome.webview.postMessage(`rpc-update, ${gameStatus.mode}, ${gameStatus.map}`);
                }, 2000);
            });
        }

        if (kute?.settings.data?.textSelect){
            const textSelectCSS = document.createElement("style");
            textSelectCSS.id = "vevo_textSelectCSS";
            textSelectCSS.textContent = "#chatHolder * { user-select: text }";
            document.head.append(textSelectCSS);
        }
    },
});
