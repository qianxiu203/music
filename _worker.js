// Cloudflare Pages Password Protection Worker
// 为Solara音乐播放器添加密码验证功能

export default {
  /**
   * 处理请求的主函数
   * @param {Request} request - 用户请求
   * @param {Object} env - 环境变量
   * @param {Object} ctx - 上下文
   * @returns {Response} 响应
   */
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    
    // 检查是否需要密码保护
    // 如果环境变量PASSWORD未设置，则不启用密码保护
    if (!env.PASSWORD) {
      // 如果没有设置密码，直接返回原始请求
      return await handleRequest(request, env, ctx);
    }
    
    // 对于某些路径不进行密码验证（如API请求、静态资源等）
    const publicPaths = ['/functions', '/favicon.ico', '/favicon.png', '/favicon.svg'];
    if (publicPaths.some(path => url.pathname.startsWith(path))) {
      return await handleRequest(request, env, ctx);
    }
    
    // 检查认证状态
    const authResult = await checkAuthorization(request, env);
    if (authResult.authorized) {
      // 如果已认证，继续处理请求
      return await handleRequest(request, env, ctx);
    } else {
      // 如果未认证，返回认证页面或401响应
      return createAuthResponse(request, env);
    }
  }
};

/**
 * 处理原始请求
 * @param {Request} request - 用户请求
 * @param {Object} env - 环境变量
 * @param {Object} ctx - 上下文
 * @returns {Response} 响应
 */
async function handleRequest(request, env, ctx) {
  // 这里可以添加其他中间件逻辑
  // 然后将请求传递给原始的Pages处理函数
  return env.ASSETS.fetch(request);
}

/**
 * 检查用户认证状态
 * @param {Request} request - 用户请求
 * @param {Object} env - 环境变量
 * @returns {Object} 认证结果
 */
async function checkAuthorization(request, env) {
  const authHeader = request.headers.get('Authorization');
  
  // 如果有Authorization头，检查Basic Auth
  if (authHeader && authHeader.startsWith('Basic ')) {
    const encoded = authHeader.substring(6);
    const decoded = atob(encoded);
    const [username, password] = decoded.split(':');
    
    // 只验证密码（忽略用户名）
    const validPassword = env.PASSWORD;
    
    if (password === validPassword) {
      return { authorized: true };
    }
  }
  
  // 检查cookie认证
  const cookieHeader = request.headers.get('Cookie');
  if (cookieHeader) {
    const cookies = parseCookies(cookieHeader);
    if (cookies.authenticated === 'true') {
      // 这里可以添加额外的验证逻辑，比如检查时间戳等
      return { authorized: true };
    }
  }
  
  return { authorized: false };
}

/**
 * 创建认证响应
 * @param {Request} request - 用户请求
 * @param {Object} env - 环境变量
 * @returns {Response} 认证页面响应
 */
function createAuthResponse(request, env) {
  const loginPage = `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Solara - 登录</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        
        .login-container {
            background: rgba(255, 255, 255, 0.95);
            backdrop-filter: blur(10px);
            border-radius: 20px;
            box-shadow: 0 25px 50px rgba(0, 0, 0, 0.15);
            padding: 40px;
            width: 100%;
            max-width: 400px;
            text-align: center;
        }
        
        .logo {
            font-size: 2.5rem;
            margin-bottom: 20px;
            color: #667eea;
        }
        
        h1 {
            color: #333;
            margin-bottom: 10px;
            font-weight: 600;
        }
        
        .subtitle {
            color: #666;
            margin-bottom: 30px;
            font-size: 1rem;
        }
        
        .form-group {
            margin-bottom: 20px;
            text-align: left;
        }
        
        label {
            display: block;
            margin-bottom: 8px;
            color: #555;
            font-weight: 500;
        }
        
        input {
            width: 100%;
            padding: 15px;
            border: 2px solid #e1e5e9;
            border-radius: 12px;
            font-size: 16px;
            transition: all 0.3s ease;
            background: #f8f9fa;
        }
        
        input:focus {
            outline: none;
            border-color: #667eea;
            background: #fff;
            box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
        }
        
        .btn {
            width: 100%;
            padding: 15px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            border: none;
            border-radius: 12px;
            font-size: 16px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s ease;
            box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
        }
        
        .btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4);
        }
        
        .btn:active {
            transform: translateY(0);
        }
        
        .error-message {
            color: #e53e3e;
            background: #fed7d7;
            padding: 12px;
            border-radius: 8px;
            margin-bottom: 20px;
            display: none;
        }
        
        .footer {
            margin-top: 30px;
            color: #888;
            font-size: 0.9rem;
        }
        
        @media (max-width: 480px) {
            .login-container {
                margin: 20px;
                padding: 30px 20px;
            }
            
            h1 {
                font-size: 1.5rem;
            }
        }
    </style>
</head>
<body>
    <div class="login-container">
        <div class="logo">🎵</div>
        <h1>欢迎来到Solara</h1>
        <p class="subtitle">请输入密码访问音乐播放器</p>
        
        <div id="errorMessage" class="error-message">
            密码错误，请重试
        </div>
        
        <form id="loginForm">
            <div class="form-group">
                <label for="password">访问密码</label>
                <input 
                    type="password" 
                    id="password" 
                    name="password" 
                    placeholder="请输入访问密码" 
                    required
                >
            </div>
            <button type="submit" class="btn">进入播放器</button>
        </form>
        
        <div class="footer">
            <p>Solara 音乐播放器</p>
        </div>
    </div>

    <script>
        document.getElementById('loginForm').addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const password = document.getElementById('password').value;
            const errorMessage = document.getElementById('errorMessage');
            
            try {
                const response = await fetch('/auth', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ password: password })
                });
                
                if (response.ok) {
                    const result = await response.json();
                    if (result.authenticated) {
                        // 登录成功，设置cookie并跳转到主页
                        document.cookie = "authenticated=true; path=/; max-age=86400"; // 24小时
                        window.location.href = '/';
                    } else {
                        // 显示错误信息
                        errorMessage.style.display = 'block';
                        document.getElementById('password').value = '';
                    }
                } else {
                    // 显示错误信息
                    errorMessage.style.display = 'block';
                    document.getElementById('password').value = '';
                }
            } catch (error) {
                errorMessage.textContent = '网络错误，请重试';
                errorMessage.style.display = 'block';
            }
        });
    </script>
</body>
</html>
  `;
  
  // 如果是认证请求，处理密码验证
  if (request.method === 'POST' && url.pathname === '/auth') {
    return handlePasswordSubmit(request, env);
  }
  
  // 如果是API请求，使用Basic Auth验证
  if (url.pathname.startsWith('/api')) {
    return handleAPIRequest(request, env);
  }
  
  // 返回登录页面
  return new Response(loginPage, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
    },
  });
}

/**
 * 处理密码提交
 * @param {Request} request - 用户请求
 * @param {Object} env - 环境变量
 * @returns {Response} 响应
 */
async function handlePasswordSubmit(request, env) {
  try {
    const contentType = request.headers.get('Content-Type') || '';
    if (!contentType.includes('application/json')) {
      return new Response('Unsupported Media Type', { status: 415 });
    }
    
    const body = await request.json();
    const { password } = body;
    
    // 验证密码
    if (password === env.PASSWORD) {
      return new Response(JSON.stringify({ authenticated: true }), {
        headers: {
          'Content-Type': 'application/json',
        },
      });
    } else {
      return new Response(JSON.stringify({ authenticated: false }), {
        status: 401,
        headers: {
          'Content-Type': 'application/json',
        },
      });
    }
  } catch (error) {
    return new Response('Bad Request', { status: 400 });
  }
}

/**
 * 处理API请求
 * @param {Request} request - 用户请求
 * @param {Object} env - 环境变量
 * @returns {Response} 响应
 */
async function handleAPIRequest(request, env) {
  const authResult = await checkAuthorization(request, env);
  if (authResult.authorized) {
    // 如果已认证，继续处理请求
    return await handleRequest(request, env, {});
  } else {
    // 如果未认证，返回401
    return new Response('Unauthorized', { status: 401 });
  }
}

/**
 * 解析Cookie
 * @param {string} cookieHeader - Cookie头
 * @returns {Object} 解析后的Cookie对象
 */
function parseCookies(cookieHeader) {
  const cookies = {};
  if (cookieHeader) {
    cookieHeader.split(';').forEach(cookie => {
      const [name, value] = cookie.trim().split('=');
      if (name && value) {
        cookies[name] = value;
      }
    });
  }
  return cookies;
}