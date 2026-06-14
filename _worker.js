// Cloudflare Workers - 采集接口代理
// 专门代理 dbzy5 采集接口

const CAIJI_HOSTNAME = 'caiji.dbzy5.com';
const CAIJI_PROTOCOL = 'https';

export default {
  async fetch(request) {
    const url = new URL(request.url);

    // 只代理采集接口路径
    const shouldProxy = url.pathname.startsWith('/api.php');

    if (!shouldProxy) {
      return await handleStaticRequest(url);
    }

    // 构建目标 URL
    const targetPath = url.pathname;
    const targetUrl = CAIJI_PROTOCOL + '://' + CAIJI_HOSTNAME + targetPath + url.search;

    // 创建新的请求
    const newRequest = new Request(targetUrl, {
      method: request.method,
      headers: request.headers,
      body: request.body
    });

    // 发送请求到采集接口
    const response = await fetch(newRequest);

    // 修改响应头
    const newHeaders = new Headers(response.headers);
    newHeaders.set('content-type', 'application/json; charset=utf-8');
    newHeaders.delete('x-frame-options');
    newHeaders.delete('content-security-policy');

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: newHeaders
    });
  }
};

// 处理本地静态请求
async function handleStaticRequest(url) {
  const path = url.pathname.substring(1);

  try {
    const file = await assetStorage.get(path);
    if (file) {
      const contentType = getContentType(path);
      return new Response(file, {
        headers: { 'content-type': contentType }
      });
    }
  } catch (e) {}

  return new Response('File not found', { 
    status: 404,
    headers: { 'content-type': 'text/plain' }
  });
}

function getContentType(path) {
  if (path.endsWith('.html')) return 'text/html';
  if (path.endsWith('.css')) return 'text/css';
  if (path.endsWith('.js')) return 'application/javascript';
  if (path.endsWith('.png')) return 'image/png';
  if (path.endsWith('.jpg') || path.endsWith('.jpeg')) return 'image/jpeg';
  if (path.endsWith('.gif')) return 'image/gif';
  if (path.endsWith('.svg')) return 'image/svg+xml';
  return 'text/plain';
}
