/*! coi-serviceworker - 解決 GitHub Pages 的 SharedArrayBuffer 限制 */
if (typeof window === 'undefined') {
    self.addEventListener("install", () => self.skipWaiting());
    self.addEventListener("activate", event => event.waitUntil(self.clients.claim()));

    self.addEventListener("fetch", function (event) {
        if (event.request.cache === "only-if-cached" && event.request.mode !== "same-origin") {
            return;
        }

        event.respondWith(
            fetch(event.request).then(response => {
                if (response.status === 0) {
                    return response;
                }

                const newHeaders = new Headers(response.headers);
                newHeaders.set("Cross-Origin-Embedder-Policy", "require-corp");
                newHeaders.set("Cross-Origin-Opener-Policy", "same-origin");

                return new Response(response.body, {
                    status: response.status,
                    statusText: response.statusText,
                    headers: newHeaders
                });
            }).catch(e => console.error(e))
        );
    });
} else {
    (() => {
        // 如果已經隔離，就不需要再執行
        if (window.crossOriginIsolated) return;
        // 本機 file:// 協議下不執行
        if (window.location.protocol === "file:") return;

        // 註冊 Service Worker
        const scriptSrc = document.currentScript ? document.currentScript.src : "coi-serviceworker.js";
        navigator.serviceWorker.register(scriptSrc).then(
            (registration) => {
                navigator.serviceWorker.addEventListener("controllerchange", () => {
                    // 註冊成功後自動重新整理頁面以套用安全環境
                    window.location.reload();
                });
            },
            (err) => console.error("COI Service Worker 註冊失敗:", err)
        );
    })();
}