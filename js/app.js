// 观影网站 - 前端主逻辑

// ===================================
// API - 采集接口调用 (最简单方式)
// ===================================
const api = {
  async getVodList(params = {}) {
    const t = params.t || '';
    const pg = params.pg || 1;
    const limit = params.limit || 20;

    const url = '/api.php/provide/vod/at/josn?t=' + t + '&pg=' + pg + '&limit=' + limit;

    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error('HTTP ' + response.status);
      return await response.json();
    } catch (error) {
      console.error('getVodList 失败:', error);
      throw error;
    }
  },

  async searchVod(wd, pg = 1) {
    const url = '/api.php/provide/vod/at/josn?wd=' + encodeURIComponent(wd) + '&pg=' + pg;

    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error('HTTP ' + response.status);
      return await response.json();
    } catch (error) {
      console.error('searchVod 失败:', error);
      throw error;
    }
  }
};

// ===================================
// 状态管理
// ===================================
const state = {
  currentCategory: '',
  currentPage: 1,
  currentTab: 'vod',
  theme: 'light'
};

// ===================================
// DOM 元素
// ===================================
let videoContainer, loading, filterTabs, searchBtn, searchOverlay, searchInput, searchSubmit, themeToggle, playerModal, playerClose, playerTitle, playerWrapper;

function initElements() {
  videoContainer = document.getElementById('videoContainer');
  loading = document.getElementById('loading');
  filterTabs = document.querySelectorAll('.tab');
  searchBtn = document.getElementById('searchBtn');
  searchOverlay = document.getElementById('searchOverlay');
  searchInput = document.getElementById('searchInput');
  searchSubmit = document.getElementById('searchSubmit');
  themeToggle = document.getElementById('themeToggle');
  playerModal = document.getElementById('playerModal');
  playerClose = document.getElementById('playerClose');
  playerTitle = document.getElementById('playerTitle');
  playerWrapper = document.getElementById('playerWrapper');
}

// ===================================
// 初始化
// ===================================
async function init() {
  initElements();
  loadTheme();
  bindEvents();
  loadVodList();
}

function bindEvents() {
  filterTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      state.currentTab = tab.dataset.type;
      state.currentPage = 1;
      loadVodList();
    });
  });

  searchBtn.addEventListener('click', () => {
    searchOverlay.classList.add('active');
    searchInput.focus();
  });

  searchSubmit.addEventListener('click', doSearch);
  searchInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') doSearch();
  });

  themeToggle.addEventListener('click', () => {
    state.theme = state.theme === 'light' ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', state.theme);
    localStorage.setItem('theme', state.theme);
  });

  playerClose.addEventListener('click', closePlayer);
  playerModal.addEventListener('click', (e) => {
    if (e.target === playerModal) closePlayer();
  });
}

function loadTheme() {
  state.theme = localStorage.getItem('theme') || 'light';
  document.documentElement.setAttribute('data-theme', state.theme);
}

async function loadVodList() {
  showLoading();

  try {
    let t = '';
    if (state.currentTab === 'movie') t = '1';
    else if (state.currentTab === 'tv') t = '2';
    else if (state.currentTab === 'anime') t = '3';

    const result = await api.getVodList({
      t: t,
      pg: state.currentPage,
      limit: 20
    });

    console.log('API 返回:', result);

    if (result.list && result.list.length > 0) {
      renderList(result.list);
    } else {
      showError('暂无数据');
    }
  } catch (error) {
    console.error('加载失败:', error);
    showError('加载失败：' + error.message);
  } finally {
    hideLoading();
  }
}

function renderList(vodList) {
  videoContainer.innerHTML = '';

  vodList.forEach(vod => {
    const card = document.createElement('article');
    card.className = 'video-card';

    const poster = vod.vod_pic || 'https://via.placeholder.com/200x280/eeeeee/999999?text=No+Image';

    card.innerHTML = `
      <div class="video-poster">
        <img src="${poster}" alt="${vod.vod_name}" loading="lazy">
        ${vod.vod_year ? '<span class="video-badge">' + vod.vod_year + '</span>' : ''}
      </div>
      <div class="video-info">
        <h3 class="video-title">${vod.vod_name}</h3>
        <div class="video-meta">
          ${vod.vod_type ? '<span>' + vod.vod_type + '</span>' : ''}
          ${vod.vod_score ? '<span>★ ' + vod.vod_score + '</span>' : ''}
        </div>
      </div>
    `;

    card.addEventListener('click', () => openPlayer(vod));
    videoContainer.appendChild(card);
  });
}

function openPlayer(vod) {
  playerTitle.textContent = vod.vod_name;

  const playURL = vod.vod_play_url || vod.vod_url;
  let src = '';

  // 尝试提取 URL
  const match = playURL.match(/(https?:\/\/[^#\s]+)/);
  if (match) src = match[1];

  if (src) {
    playerWrapper.innerHTML = '<iframe src="' + src + '" frameborder="0" allowfullscreen allow="autoplay;fullscreen" style="width:100%;height:100%;border:none;"></iframe>';
    playerModal.classList.add('active');
  } else {
    showError('暂无播放地址');
  }
}

function closePlayer() {
  playerModal.classList.remove('active');
  playerWrapper.innerHTML = '';
}

function doSearch() {
  const query = searchInput.value.trim();
  if (!query) return;

  searchOverlay.classList.remove('active');
  searchInput.value = '';
  showLoading();

  api.searchVod(query, 1).then(result => {
    if (result.list && result.list.length > 0) {
      renderList(result.list);
    } else {
      showError('没有找到相关结果');
    }
  }).catch(error => {
    showError('搜索失败');
  }).finally(() => {
    hideLoading();
  });
}

function showLoading() {
  if (loading) loading.classList.remove('hidden');
}

function hideLoading() {
  if (loading) loading.classList.add('hidden');
}

function showError(msg) {
  videoContainer.innerHTML = '<p class="text-center">' + msg + '</p>';
}

// 启动
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
