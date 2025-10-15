// 本地测试脚本 - 模拟密码保护功能
// 这个脚本仅用于本地测试，不应用于生产环境

const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

// 从.env文件读取环境变量
require('dotenv').config();

const PORT = 3000;
const PASSWORD = process.env.PASSWORD || 'test123'; // 默认测试密码

// 简单的MIME类型映射
const MIME_TYPES = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.json': 'application/json',
  '.txt': 'text/plain'
};

// 登录页面HTML
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

// 简单的cookie解析函数
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

// 检查认证状态
function isAuthenticated(req) {
  // 检查cookie
  const cookies = parseCookies(req.headers.cookie);
  return cookies.authenticated === 'true';
}

// 主服务器逻辑
const server = http.createServer((req, res) => {
  const parsedUrl = url.parse(req.url);
  const pathname = parsedUrl.pathname;
  
  // 如果没有设置密码，则不启用保护
  if (!PASSWORD) {
    serveStaticFile(req, res, pathname);
    return;
  }
  
  // 对于某些路径不进行密码验证
  const publicPaths = ['/favicon.ico', '/favicon.png', '/favicon.svg'];
  if (publicPaths.includes(pathname)) {
    serveStaticFile(req, res, pathname);
    return;
  }
  
  // 处理认证请求
  if (req.method === 'POST' && pathname === '/auth') {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });
    req.on('end', () => {
      try {
        const data = JSON.parse(body);
        if (data.password === PASSWORD) {
          res.writeHead(200, {
            'Content-Type': 'application/json',
            'Set-Cookie': 'authenticated=true; Path=/; Max-Age=86400'
          });
          res.end(JSON.stringify({ authenticated: true }));
        } else {
          res.writeHead(401, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ authenticated: false }));
        }
      } catch (error) {
        res.writeHead(400, { 'Content-Type': 'text/plain' });
        res.end('Bad Request');
      }
    });
    return;
  }
  
  // 检查认证状态
  if (isAuthenticated(req)) {
    serveStaticFile(req, res, pathname);
  } else {
    // 返回登录页面
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(loginPage);
  }
});

// 服务静态文件
function serveStaticFile(req, res, pathname) {
  // 默认页面
  if (pathname === '/' || pathname === '') {
    pathname = '/index.html';
  }
  
  // 构建文件路径
  const filePath = path.join(process.cwd(), pathname);
  
  // 检查文件是否存在
  fs.access(filePath, fs.constants.F_OK, (err) => {
    if (err) {
      // 文件不存在，返回404
      res.writeHead(404, { 'Content-Type': 'text/html' });
      res.end('<h1>404 Not Found</h1>');
      return;
    }
    
    // 获取文件扩展名
    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';
    
    // 读取并返回文件
    fs.readFile(filePath, (err, data) => {
      if (err) {
        res.writeHead(500, { 'Content-Type': 'text/html' });
        res.end('<h1>500 Internal Server Error</h1>');
        return;
      }
      
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(data);
    });
  });
}

server.listen(PORT, () => {
  console.log(`本地测试服务器运行在 http://localhost:${PORT}`);
  console.log(`密码保护状态: ${PASSWORD ? '已启用' : '未启用'}`);
  if (PASSWORD) {
    console.log(`密码: ${PASSWORD}`);
  }
});