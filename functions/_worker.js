// Cloudflare Workers - 采集接口代理

const CAIJI_HOSTNAME = 'caiji.dbzy5.com';
const CAIJI_PROTOCOL = 'https';

export default {
  async fetch(request) {
    const url = new URL(request.url);

    // 只代理采集接口路径
    if (!url.pathname.startsWith('/api.php')) {
      return await handleStaticRequest(url);
    }

    // 构建目标 URL
    const targetUrl = CAIJI_PROTOCOL + '://' + CAIJI_HOSTNAME + url.pathname + url.search;

    // 创建请求
    const newRequest = new Request(targetUrl, {
      method: request.method,
      headers: request.headers,
      body: request.body
    });

    // 发送请求
    const response = await fetch(newRequest);

    // 返回响应，不修改 headers
    return response;
  }
};

// 处理静态文件
async function handleStaticRequest(url) {
  const path = url.pathname.substring(1);

  try {
    const file = await assetStorage.get(path);
    if (file) {
      return new Response(file);
    }
  } catch (e) {}

  return new Response('Not found', { status: 404 });
}
