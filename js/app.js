// 极简观影网站

const apiBase = "/api.php/provide/vod/at/josn";

async function loadVod() {
  showLoading();
  try {
    const url = apiBase + "?t=1&pg=1&limit=20";
    const res = await fetch(url);
    const data = await res.json();

    console.log("API:", data);

    if (data.list) {
      renderList(data.list);
    } else {
      showError("暂无数据");
    }
  } catch (e) {
    console.error("错误:", e);
    showError("加载失败:" + e.message);
  } finally {
    hideLoading();
  }
}

function renderList(list) {
  const container = document.getElementById("videoContainer");
  container.innerHTML = "";

  list.forEach(vod => {
    const card = document.createElement("article");
    card.className = "video-card";
    card.innerHTML = `
      <div class="video-poster">
        <img src="${vod.vod_pic || ""}" alt="">
        ${vod.vod_year ? `<span class="video-badge">${vod.vod_year}</span>` : ""}
      </div>
      <div class="video-info">
        <h3 class="video-title">${vod.vod_name}</h3>
      </div>
    `;
    card.onclick = () => openPlayer(vod);
    container.appendChild(card);
  });
}

function openPlayer(vod) {
  const url = vod.vod_play_url || vod.vod_url || "";
  document.getElementById("playerTitle").textContent = vod.vod_name;
  document.getElementById("playerWrapper").innerHTML = 
    `<iframe src="${url}" frameborder="0" allowfullscreen style="width:100%;height:100%;"></iframe>`;
  document.getElementById("playerModal").classList.add("active");
}

function closePlayer() {
  document.getElementById("playerModal").classList.remove("active");
  document.getElementById("playerWrapper").innerHTML = "";
}

function showLoading() {
  document.getElementById("loading").classList.remove("hidden");
}

function hideLoading() {
  document.getElementById("loading").classList.add("hidden");
}

function showError(msg) {
  document.getElementById("videoContainer").innerHTML = `<p>${msg}</p>`;
}

// 启动
loadVod();

// 主题切换
const themeBtn = document.getElementById("themeToggle");
if (themeBtn) {
  themeBtn.onclick = () => {
    const dark = document.documentElement.getAttribute("data-theme") === "dark";
    document.documentElement.setAttribute("data-theme", dark ? "light" : "dark");
  };
}
