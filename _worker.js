// Cloudflare Workers 反向代理 - 兼容苹果 CMS v10
// 将你的苹果 CMS v10 站点域名配置在这里
const PROXY_HOSTNAME = 'your-maccms10-site.com';  // 修改为你的苹果 CMS 域名
const PROXY_PROTOCOL = 'https';

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // 只代理特定路径 (苹果 CMS API 路径)
    const apiPaths = [
      '/api.php',
      '/index.php',
      '/template/',
      '/static/',
      '/upload/'
    ];

    const shouldProxy = apiPaths.some(path => url.pathname.startsWith(path));

    if (!shouldProxy) {
      // 返回本地静态页面
      return await handleStaticRequest(request, url);
    }

    // 构建目标 URL
    const targetUrl = new URL(`${PROXY_PROTOCOL}://${PROXY_HOSTNAME}${url.pathname}${url.search}`);

    // 创建新的请求
    const newRequest = new Request(targetUrl, {
      method: request.method,
      headers: request.headers,
      body: request.body
    });

    // 发送请求到目标服务器
    const response = await fetch(newRequest);

    // 修改响应头，移除安全限制
    const newHeaders = new Headers(response.headers);
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
async function handleStaticRequest(request, url) {
  const path = url.pathname.replace(/^\/, '/');

  try {
    const file = await assetStorage.get(path);
    if (file) {
      return new Response(file, {
        headers: {
          'content-type': getContentType(path)
        }
      });
    }
  } catch (e) {}

  // 返回默认首页
  return new Response(`
    <!DOCTYPE html>
    <html lang="zh-CN">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>观影网站</title>
    </head>
    <body>
      <h1>观影网站正在加载...</h1>
    </body>
    </html>
  `, {
    headers: { 'content-type': 'text/html' }
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
