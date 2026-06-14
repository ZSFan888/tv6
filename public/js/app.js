// 观影网站 - 前端主逻辑
import { api } from './api.js';

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
const elements = {
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

// ===================================
// 初始化
// ===================================
async function init() {
  // 加载主题偏好
  loadThemePreference();

  // 绑定事件
  bindEvents();

  // 加载初始内容
  await loadInitialContent();
}

function bindEvents() {
  // 筛选标签
  elements.filterTabs.forEach(tab => {
    tab.addEventListener('click', () => handleTabChange(tab));
  });

  // 搜索
  elements.searchBtn.addEventListener('click', () => openSearch());
  elements.searchSubmit.addEventListener('click', () => handleSearch());
  elements.searchInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') handleSearch();
  });

  // 主题切换
  elements.themeToggle.addEventListener('click', toggleTheme);

  // 播放器关闭
  elements.playerClose.addEventListener('click', closePlayer);
  elements.playerModal.addEventListener('click', (e) => {
    if (e.target === elements.playerModal) closePlayer();
  });
}

async function loadInitialContent() {
  // 从 URL 获取分类参数
  const urlParams = new URLSearchParams(window.location.search);
  const category = urlParams.get('category');

  if (category) {
    state.currentCategory = category;
    // 激活对应的标签
    updateActiveTab(category);
  }

  // 加载视频列表
  await loadVodList();
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

    // 根据标签类型调整参数
    if (state.currentTab !== 'vod' && state.currentCategory) {
      params.t = getCategoryByTab(state.currentTab);
    } else if (state.currentCategory) {
      params.t = state.currentCategory;
    }

    const result = await api.getVodList(params);

    if (result.code === 1 && result.list) {
      renderVideoList(result.list);
    } else {
      showError('暂无数据');
    }
  } catch (error) {
    console.error('加载视频列表失败:', error);
    showError('加载失败，请重试');
  } finally {
    hideLoading();
  }
}

// ===================================
// 渲染视频列表
// ===================================
function renderVideoList(vodList) {
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
  card.setAttribute('data-id', vod.vod_id);

  // 海报图片 (使用默认图如果为空)
  const poster = vod.vod_pic || 'https://via.placeholder.com/200x280/eeeeee/999999?text=No+Image';

  // 评分
  const rating = vod.vod_score || 0;
  const ratingStar = rating > 0 ? '★' : '';

  card.innerHTML = `
    <div class="video-poster">
      <img src="${poster}" alt="${vod.vod_name}" loading="lazy">
      ${vod.vod_year ? `<span class="video-badge">${vod.vod_year}</span>` : ''}
    </div>
    <div class="video-info">
      <h3 class="video-title">${vod.vod_name}</h3>
      <div class="video-meta">
        ${vod.vod_type ? `<span class="video-type">${vod.vod_type}</span>` : ''}
        ${rating > 0 ? `
          <span class="video-rating">
            <span class="rating-star">${ratingStar}</span>
            <span>${rating}</span>
          </span>
        ` : ''}
      </div>
    </div>
  `;

  // 点击播放
  card.addEventListener('click', () => openPlayer(vod));

  return card;
}

// ===================================
// 播放器
// ===================================
function openPlayer(vod) {
  state.currentPlaying = vod;

  elements.playerTitle.textContent = vod.vod_name;

  // 嵌入播放器 (使用通用的播放器 iframe)
  // 这里需要根据你的苹果 CMS 实际播放器地址调整
  const playURL = vod.vod_play_url;
  const playerSrc = extractPlayURL(playURL);

  elements.playerWrapper.innerHTML = `
    <iframe 
      src="${playerSrc}" 
      frameborder="0" 
      allowfullscreen="true"
      allow="autoplay; fullscreen"
    ></iframe>
  `;

  elements.playerModal.classList.add('active');
}

function extractPlayURL(playURL) {
  // 苹果 CMS 的播放 URL 格式通常是：
  // 分组名$标题#url1#url2...
  // 这里提取第一个播放 URL

  if (!playURL) return '';

  // 尝试提取 http/https 开头的 URL
  const urlMatch = playURL.match(/(https?:\/\/[^#\s]+)/);
  if (urlMatch) {
    return urlMatch[1];
  }

  // 如果没有找到完整 URL，返回空
  return '';
}

function closePlayer() {
  elements.playerModal.classList.remove('active');
  elements.playerWrapper.innerHTML = '';
  state.currentPlaying = null;
}

// ===================================
// 搜索
// ===================================
function openSearch() {
  elements.searchOverlay.classList.add('active');
  elements.searchInput.focus();
}

function closeSearch() {
  elements.searchOverlay.classList.remove('active');
  elements.searchInput.value = '';
  state.searchQuery = '';
}

async function handleSearch() {
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

    if (result.code === 1 && result.list) {
      renderVideoList(result.list);
    } else {
      showError('没有找到相关结果');
    }
  } catch (error) {
    console.error('搜索失败:', error);
    showError('搜索失败，请重试');
  } finally {
    hideLoading();
  }
}

// ===================================
// 标签切换
// ===================================
function handleTabChange(tab) {
  state.currentTab = tab.dataset.type;

  // 更新激活状态
  elements.filterTabs.forEach(t => t.classList.remove('active'));
  tab.classList.add('active');

  // 重新加载内容
  state.currentPage = 1;
  loadVodList();
}

function updateActiveTab(category) {
  elements.filterTabs.forEach(tab => {
    if (tab.dataset.type === category || category === tab.dataset.type) {
      tab.classList.add('active');
      state.currentTab = tab.dataset.type;
    } else {
      tab.classList.remove('active');
    }
  });
}

function getCategoryByTab(tab) {
  // 根据标签类型返回对应的分类 ID
  // 这里需要根据你的苹果 CMS 实际分类 ID 调整
  const categoryMap = {
    'movie': '1',   // 电影分类 ID
    'tv': '2',      // 电视剧分类 ID
    'anime': '3'    // 动漫分类 ID
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
  elements.videoContainer.innerHTML = `<p class="text-center">${message}</p>`;
}

// ===================================
// 启动应用
// ===================================
document.addEventListener('DOMContentLoaded', init);

// 全局暴露 (调试用)
if (typeof window !== 'undefined') {
  window.viewingSite = {
    state,
    api,
    openPlayer,
    closePlayer
  };
}
