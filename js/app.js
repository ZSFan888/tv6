// 观影网站 - 前端主逻辑 (直接包含 API)

// ===================================
// API - 采集接口调用
// ===================================
const api = {
  // 修复：baseURL 不以 / 结尾
  baseURL: '/api.php/provide/vod/at/josn',

  async get(endpoint, params = {}) {
    // 修复：正确拼接 URL
    let url = this.baseURL;
    if (endpoint && endpoint !== '') {
      url = url + '/' + endpoint;
    }

    // 添加查询参数
    const paramsStr = Object.entries(params)
      .map(([key, value]) => key + '=' + encodeURIComponent(value))
      .join('&');

    if (paramsStr) {
      url = url + '?' + paramsStr;
    }

    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error('API 错误：' + response.status);
      return await response.json();
    } catch (error) {
      console.error('API 请求失败:', error);
      throw error;
    }
  },

  async getVodList(params = {}) {
    return this.get('', {
      t: params.t || '',
      pg: params.pg || 1,
      limit: params.limit || 20
    });
  },

  async searchVod(wd, pg = 1) {
    return this.get('', {
      wd: wd,
      pg: pg
    });
  },

  async getCategories() {
    return this.get('', { t: 0 });
  }
};

// ===================================
// 状态管理
// ===================================
const state = {
  currentCategory: '',
  currentPage: 1,
  currentTab: 'vod',
  searchQuery: '',
  theme: 'light'
};

// ===================================
// DOM 元素
// ===================================
let elements = {};

function initElements() {
  elements = {
    videoContainer: document.getElementById('videoContainer'),
    loading: document.getElementById('loading'),
    filterTabs: document.querySelectorAll('.tab'),
    searchBtn: document.getElementById('searchBtn'),
    searchOverlay: document.getElementById('searchOverlay'),
    searchInput: document.getElementById('searchInput'),
    searchSubmit: document.getElementById('searchSubmit'),
    themeToggle: document.getElementById('themeToggle'),
    playerModal: document.getElementById('playerModal'),
    playerClose: document.getElementById('playerClose'),
    playerTitle: document.getElementById('playerTitle'),
    playerWrapper: document.getElementById('playerWrapper')
  };
}

// ===================================
// 初始化
// ===================================
async function init() {
  initElements();
  loadThemePreference();
  bindEvents();
  await loadInitialContent();
}

function bindEvents() {
  if (!elements.filterTabs) return;

  elements.filterTabs.forEach(tab => {
    tab.addEventListener('click', () => handleTabChange(tab));
  });

  if (elements.searchBtn) elements.searchBtn.addEventListener('click', () => openSearch());
  if (elements.searchSubmit) elements.searchSubmit.addEventListener('click', () => handleSearch());
  if (elements.searchInput) {
    elements.searchInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') handleSearch();
    });
  }

  if (elements.themeToggle) elements.themeToggle.addEventListener('click', toggleTheme);
  if (elements.playerClose) elements.playerClose.addEventListener('click', closePlayer);
  if (elements.playerModal) {
    elements.playerModal.addEventListener('click', (e) => {
      if (e.target === elements.playerModal) closePlayer();
    });
  }
}

async function loadInitialContent() {
  try {
    const urlParams = new URLSearchParams(window.location.search);
    const category = urlParams.get('category');

    if (category) {
      state.currentCategory = category;
      updateActiveTab(category);
    }

    await loadVodList();
  } catch (error) {
    console.error('初始化失败:', error);
    showError('初始化失败');
  }
}

// ===================================
// 加载视频列表
// ===================================
async function loadVodList() {
  showLoading();

  try {
    let params = {
      pg: state.currentPage,
      limit: 20
    };

    if (state.currentTab !== 'vod' && state.currentCategory) {
      params.t = getCategoryByTab(state.currentTab);
    } else if (state.currentCategory) {
      params.t = state.currentCategory;
    }

    const result = await api.getVodList(params);

    console.log('API 返回:', result);

    if (result && result.list && result.list.length > 0) {
      renderVideoList(result.list);
    } else {
      showError('暂无数据');
    }
  } catch (error) {
    console.error('加载视频列表失败:', error);
    showError('加载失败：' + error.message);
  } finally {
    hideLoading();
  }
}

// ===================================
// 渲染视频列表
// ===================================
function renderVideoList(vodList) {
  if (!elements.videoContainer) return;

  elements.videoContainer.innerHTML = '';

  if (!vodList || vodList.length === 0) {
    elements.videoContainer.innerHTML = '<p class="text-center">暂无内容</p>';
    return;
  }

  vodList.forEach(vod => {
    const card = createVideoCard(vod);
    elements.videoContainer.appendChild(card);
  });
}

function createVideoCard(vod) {
  const card = document.createElement('article');
  card.className = 'video-card';

  const poster = vod.vod_pic || 'https://via.placeholder.com/200x280/eeeeee/999999?text=No+Image';
  const rating = vod.vod_score || 0;

  card.innerHTML = `
    <div class="video-poster">
      <img src="${poster}" alt="${vod.vod_name}" loading="lazy">
      ${vod.vod_year ? `<span class="video-badge">${vod.vod_year}</span>` : ''}
    </div>
    <div class="video-info">
      <h3 class="video-title">${vod.vod_name}</h3>
      <div class="video-meta">
        ${vod.vod_type ? `<span class="video-type">${vod.vod_type}</span>` : ''}
        ${rating > 0 ? `<span class="video-rating">★ ${rating}</span>` : ''}
      </div>
    </div>
  `;

  card.addEventListener('click', () => openPlayer(vod));
  return card;
}

// ===================================
// 播放器
// ===================================
function openPlayer(vod) {
  if (!elements.playerModal || !elements.playerWrapper || !elements.playerTitle) return;

  state.currentPlaying = vod;
  elements.playerTitle.textContent = vod.vod_name;

  const playURL = vod.vod_play_url || vod.vod_url;
  const playerSrc = extractPlayURL(playURL);

  if (playerSrc) {
    elements.playerWrapper.innerHTML = `
      <iframe 
        src="${playerSrc}" 
        frameborder="0" 
        allowfullscreen="true"
        allow="autoplay; fullscreen"
        style="width:100%;height:100%;border:none;"
      ></iframe>
    `;
    elements.playerModal.classList.add('active');
  } else {
    showError('暂无播放地址');
  }
}

function extractPlayURL(playURL) {
  if (!playURL) return '';

  const match = playURL.match(/(https?:\/\/[^#\s]+)/);
  return match ? match[1] : '';
}

function closePlayer() {
  if (!elements.playerModal || !elements.playerWrapper) return;

  elements.playerModal.classList.remove('active');
  elements.playerWrapper.innerHTML = '';
  state.currentPlaying = null;
}

// ===================================
// 搜索
// ===================================
function openSearch() {
  if (!elements.searchOverlay || !elements.searchInput) return;
  elements.searchOverlay.classList.add('active');
  elements.searchInput.focus();
}

function closeSearch() {
  if (!elements.searchOverlay) return;
  elements.searchOverlay.classList.remove('active');
  if (elements.searchInput) elements.searchInput.value = '';
  state.searchQuery = '';
}

async function handleSearch() {
  if (!elements.searchInput) return;

  const query = elements.searchInput.value.trim();
  if (!query) {
    closeSearch();
    return;
  }

  state.searchQuery = query;
  closeSearch();
  showLoading();

  try {
    const result = await api.searchVod(query, 1);

    if (result && result.list && result.list.length > 0) {
      renderVideoList(result.list);
    } else {
      showError('没有找到相关结果');
    }
  } catch (error) {
    console.error('搜索失败:', error);
    showError('搜索失败');
  } finally {
    hideLoading();
  }
}

// ===================================
// 标签切换
// ===================================
function handleTabChange(tab) {
  state.currentTab = tab.dataset.type;

  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  tab.classList.add('active');

  state.currentPage = 1;
  loadVodList();
}

function updateActiveTab(category) {
  document.querySelectorAll('.tab').forEach(tab => {
    if (tab.dataset.type === category) {
      tab.classList.add('active');
      state.currentTab = category;
    } else {
      tab.classList.remove('active');
    }
  });
}

function getCategoryByTab(tab) {
  const categoryMap = {
    'movie': '1',
    'tv': '2',
    'anime': '3'
  };

  return categoryMap[tab] || '';
}

// ===================================
// 主题切换
// ===================================
function loadThemePreference() {
  const savedTheme = localStorage.getItem('theme') || 'light';
  state.theme = savedTheme;
  document.documentElement.setAttribute('data-theme', savedTheme);
}

function toggleTheme() {
  state.theme = state.theme === 'light' ? 'dark' : 'light';
  document.documentElement.setAttribute('data-theme', state.theme);
  localStorage.setItem('theme', state.theme);
}

// ===================================
// 加载/错误状态
// ===================================
function showLoading() {
  if (elements.loading) {
    elements.loading.classList.remove('hidden');
  }
}

function hideLoading() {
  if (elements.loading) {
    elements.loading.classList.add('hidden');
  }
}

function showError(message) {
  if (!elements.videoContainer) return;
  elements.videoContainer.innerHTML = `<p class="text-center">${message}</p>`;
}

// ===================================
// 启动应用
// ===================================
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
