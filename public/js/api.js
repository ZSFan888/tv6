// 苹果 CMS v10 API 调用封装
// 通过 Cloudflare Workers 反向代理访问

const API_BASE = '/api.php';  // 通过 Worker 反代到真实的苹果 CMS

class MacCMSAPI {
  constructor() {
    this.baseURL = API_BASE;
  }

  /**
   * 通用 GET 请求
   */
  async get(endpoint, params = {}) {
    const url = new URL(`${this.baseURL}${endpoint}`);

    // 添加查询参数
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.set(key, value);
    });

    try {
      const response = await fetch(url.toString());

      if (!response.ok) {
        throw new Error(`API 错误: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('API 请求失败:', error);
      throw error;
    }
  }

  /**
   * 获取分类列表
   * ac: 分类 (level/type)
   */
  async getCategories() {
    return this.get('/provide/vod/', {
      ac: 'list',
      t: 0  // 获取所有一级分类
    });
  }

  /**
   * 获取视频列表
   * @param {Object} params - 查询参数
   * @param {string} params.t - 分类 ID
   * @param {number} params.pg - 页码
   * @param {string} params.limit - 返回数量
   */
  async getVodList(params = {}) {
    const defaultParams = {
      ac: 'list',
      t: params.t || '',
      pg: params.pg || 1,
      limit: params.limit || 20
    };

    return this.get('/provide/vod/', defaultParams);
  }

  /**
   * 获取视频详情
   * @param {string} id - 视频 ID
   */
  async getVodDetail(id) {
    return this.get('/provide/vod/', {
      ac: 'detail',
      ids: id
    });
  }

  /**
   * 搜索视频
   * @param {string} wd - 搜索关键词
   * @param {number} pg - 页码
   */
  async searchVod(wd, pg = 1) {
    return this.get('/provide/vod/', {
      ac: 'list',
      wd: wd,
      pg: pg
    });
  }

  /**
   * 获取热门视频
   * @param {number} t - 分类 ID
   * @param {number} limit - 返回数量
   */
  async getHotVod(t = '', limit = 20) {
    return this.get('/provide/vod/', {
      ac: 'list',
      t: t,
      limit: limit,
      order: 'byETIME'  // 按时间排序
    });
  }
}

// 导出 API 实例
const api = new MacCMSAPI();

// 全局暴露
if (typeof window !== 'undefined') {
  window.macCMSAPI = api;
}
