(function () {
  const storageKey = "gamePlays";
  const winClaimKeyPrefix = "axomi-win-claimed-";

  function getGameName() {
    const title = document.title || "";
    const text = title.replace(/\s*[-—].*$/, "").trim();
    if (text) return text;
    const heading = document.querySelector("h1");
    if (heading) return heading.textContent.trim();
    const fileName = window.location.pathname.split("/").pop();
    return fileName.replace(/\.html?$/i, "").replace(/Index$/i, "").replace(/[-_]+/g, " ").trim();
  }

  function getRelativeRootPath() {
    const pathParts = window.location.pathname.split("/games/");
    if (pathParts.length < 2) return "./index.html";
    const descendants = pathParts[1].split("/").filter(Boolean);
    const depth = Math.max(0, descendants.length - 1);
    const parts = Array(depth + 1).fill("..");
    return parts.concat(["index.html"]).join("/");
  }

  function getPlayData() {
    return JSON.parse(localStorage.getItem(storageKey) || "{}");
  }

  function savePlayData(data) {
    localStorage.setItem(storageKey, JSON.stringify(data));
  }

  function claimWin(gameName) {
    if (!gameName) return;
    const key = `${winClaimKeyPrefix}${gameName}`;
    if (sessionStorage.getItem(key)) {
      showToast("Win already claimed for this session.");
      return;
    }

    const playData = getPlayData();
    if (!playData[gameName]) playData[gameName] = { plays: 0, success: 0 };
    playData[gameName].success += 1;
    savePlayData(playData);
    sessionStorage.setItem(key, "1");
    showToast("Win point added! Return to the hub to view your score.");
  }

  function createBackBar(gameName) {
    const bar = document.createElement("div");
    bar.id = "axomi-game-helper-bar";
    bar.innerHTML = `
      <a class="axomi-game-back" href="${getRelativeRootPath()}">← Back to Games Hub</a>
      <button type="button" class="axomi-win-claim">Claim Win</button>
    `;
    document.body.appendChild(bar);

    const claimButton = bar.querySelector(".axomi-win-claim");
    claimButton.addEventListener("click", () => claimWin(gameName));
  }

  function showToast(message) {
    let toast = document.getElementById("axomi-game-helper-toast");
    if (!toast) {
      toast = document.createElement("div");
      toast.id = "axomi-game-helper-toast";
      document.body.appendChild(toast);
    }
    toast.textContent = message;
    toast.classList.add("visible");
    window.clearTimeout(toast.hideTimeout);
    toast.hideTimeout = window.setTimeout(() => toast.classList.remove("visible"), 2800);
  }

  function attachStyles() {
    const style = document.createElement("style");
    style.textContent = `
      #axomi-game-helper-bar {
        position: fixed;
        inset: 18px auto auto 18px;
        display: flex;
        gap: 10px;
        align-items: center;
        z-index: 9999;
        backdrop-filter: blur(14px);
        background: rgba(0, 0, 0, 0.5);
        border: 1px solid rgba(255, 255, 255, 0.15);
        border-radius: 999px;
        padding: 0.65rem 0.9rem;
        box-shadow: 0 18px 40px rgba(0, 0, 0, 0.24);
        font-family: system-ui, sans-serif;
      }

      .axomi-game-back,
      .axomi-win-claim {
        color: #fff;
        text-decoration: none;
        border: none;
        background: rgba(255, 255, 255, 0.08);
        padding: 0.7rem 1rem;
        border-radius: 999px;
        cursor: pointer;
        font-size: 0.95rem;
        transition: transform 0.2s ease, background 0.2s ease;
      }

      .axomi-game-back:hover,
      .axomi-win-claim:hover {
        transform: translateY(-1px);
        background: rgba(255, 255, 255, 0.16);
      }

      #axomi-game-helper-toast {
        position: fixed;
        left: 50%;
        bottom: 22px;
        transform: translateX(-50%);
        padding: 0.95rem 1.2rem;
        border-radius: 999px;
        color: #fff;
        background: rgba(36, 46, 78, 0.94);
        font-family: system-ui, sans-serif;
        font-size: 0.95rem;
        opacity: 0;
        pointer-events: none;
        transition: opacity 0.2s ease;
        z-index: 9999;
      }

      #axomi-game-helper-toast.visible {
        opacity: 1;
      }
    `;
    document.head.appendChild(style);
  }

  function init() {
    const gameName = getGameName();
    attachStyles();
    createBackBar(gameName);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();