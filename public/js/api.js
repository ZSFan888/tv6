// 采集接口 API 调用封装
// 使用 dbzy5 采集接口

const API_BASE = '/api.php/provide/vod/at/josn/';

class CaijiAPI {
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
   */
  async getCategories() {
    return this.get('', {
      t: 0
    });
  }

  /**
   * 获取视频列表
   * @param {Object} params - 查询参数
   * @param {string} params.t - 分类 ID
   * @param {number} params.pg - 页码
   * @param {number} params.limit - 返回数量
   */
  async getVodList(params = {}) {
    const defaultParams = {
      t: params.t || '',
      pg: params.pg || 1,
      limit: params.limit || 20
    };

    return this.get('', defaultParams);
  }

  /**
   * 获取视频详情
   * @param {string} id - 视频 ID
   */
  async getVodDetail(id) {
    return this.get('', {
      ids: id
    });
  }

  /**
   * 搜索视频
   * @param {string} wd - 搜索关键词
   * @param {number} pg - 页码
   */
  async searchVod(wd, pg = 1) {
    return this.get('', {
      wd: wd,
      pg: pg
    });
  }

  /**
   * 获取热门视频
   * @param {string} t - 分类 ID
   * @param {number} limit - 返回数量
   */
  async getHotVod(t = '', limit = 20) {
    return this.get('', {
      t: t,
      limit: limit,
      order: 'byETIME'
    });
  }
}

// 导出 API 实例
const api = new CaijiAPI();

// 全局暴露
if (typeof window !== 'undefined') {
  window.macCMSAPI = api;
}
