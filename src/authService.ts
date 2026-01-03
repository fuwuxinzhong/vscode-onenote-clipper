import * as vscode from 'vscode';
import * as crypto from 'crypto';
import * as http from 'http';
import axios from 'axios';
import { Config } from './config';

export class AuthService {
  private static readonly REDIRECT_URI = 'http://localhost:8080/callback';
  private static readonly AUTHORITY = 'https://login.microsoftonline.com/common';
  private static readonly SCOPE = 'Notes.ReadWrite offline_access';

  private accessToken: string | null = null;
  private refreshToken: string | null = null;
  private tokenExpiry: number = 0;

  constructor(private context: vscode.ExtensionContext) {
    this.loadTokens();
    // 不再在构造函数中自动验证token，改为在实际使用时验证
    // 这样可以避免每次启动VSCode都触发重新认证
  }

  /**
   * 验证token是否有效，如果无效则尝试刷新
   * 仅在getAccessToken时调用，避免不必要的验证
   */
  private async validateAndRefreshTokens(): Promise<boolean> {
    if (!this.accessToken) {
      console.log('No access token available');
      return false;
    }

    // 检查token是否过期（提前5分钟）
    if (Date.now() < this.tokenExpiry) {
      console.log('Token is still valid, no need to refresh');
      return true;
    }

    // Token已过期或即将过期，尝试刷新
    console.log('Token expired or about to expire, attempting to refresh...');
    try {
      await this.refreshAccessToken();
      console.log('Token refreshed successfully');
      return true;
    } catch (error: any) {
      console.error('Token refresh failed:', error.message);
      // 刷新失败，可能是refresh token也过期了
      // 不立即清除token，让用户继续使用直到API调用失败
      return false;
    }
  }

  private loadTokens() {
    this.accessToken = this.context.globalState.get<string>('accessToken') ?? null;
    this.refreshToken = this.context.globalState.get<string>('refreshToken') ?? null;
    this.tokenExpiry = this.context.globalState.get<number>('tokenExpiry', 0);
  }

  private saveTokens() {
    this.context.globalState.update('accessToken', this.accessToken);
    this.context.globalState.update('refreshToken', this.refreshToken);
    this.context.globalState.update('tokenExpiry', this.tokenExpiry);
  }

  async login(): Promise<void> {
    console.log('=== Starting OAuth Login Process ===');

    // 从配置获取Client ID（使用公共应用的Client ID）
    const clientId = Config.getClientId();

    console.log('Client ID:', clientId);

    if (!clientId) {
      throw new Error('Client ID is empty or undefined');
    }

    try {
      // 生成PKCE参数
      console.log('Generating PKCE parameters...');
      const codeVerifier = crypto.randomBytes(32).toString('base64url');
      const codeChallenge = crypto.createHash('sha256').update(codeVerifier).digest('base64url');
      const state = crypto.randomBytes(16).toString('hex');

      console.log('PKCE parameters generated successfully');

      // 构建授权URL
      const authUrl = `${AuthService.AUTHORITY}/oauth2/v2.0/authorize?` +
        `client_id=${clientId}&` +
        `response_type=code&` +
        `redirect_uri=${encodeURIComponent(AuthService.REDIRECT_URI)}&` +
        `scope=${encodeURIComponent(AuthService.SCOPE)}&` +
        `code_challenge=${codeChallenge}&` +
        `code_challenge_method=S256&` +
        `state=${state}`;

      console.log('Auth URL prepared:', authUrl.substring(0, 100) + '...');

      // 打开浏览器进行授权
      console.log('Opening browser for authorization...');
      const opened = await vscode.env.openExternal(vscode.Uri.parse(authUrl));

      if (!opened) {
        throw new Error('无法打开浏览器进行授权');
      }

      console.log('Browser opened successfully, waiting for callback...');

      // 等待回调
      const authCode = await this.waitForCallback(state);

      console.log('Authorization code received, exchanging for tokens...');

      // 交换授权码获取令牌（使用PKCE，不需要Client Secret）
      await this.exchangeCodeForTokens(authCode, codeVerifier, clientId);

      console.log('=== OAuth Login Process Completed Successfully ===');
    } catch (error: any) {
      console.error('=== OAuth Login Process Failed ===');
      console.error('Error:', error.message);
      throw error;
    }
  }

  private async waitForCallback(expectedState: string): Promise<string> {
    return new Promise((resolve, reject) => {
      let hasResolved = false; // 标记是否已经处理过回调
      let server: http.Server | null = null;

      const timeout = setTimeout(() => {
        if (!hasResolved) {
          if (server) {
            server.close();
          }
          reject(new Error('授权超时，请在2分钟内完成授权'));
        }
      }, 120000); // 2分钟超时

      // 创建一个简单的HTTP服务器来接收回调
      try {
        server = http.createServer((req: any, res: any) => {
          // 如果已经处理过回调，忽略后续请求
          if (hasResolved) {
            console.log('Ignoring duplicate callback request');
            res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
            res.end('<!DOCTYPE html><html><head><meta charset="utf-8"><title>已完成</title></head><body><h1>授权已完成</h1><p>可以关闭此窗口。</p></body></html>');
            return;
          }

          const url = new URL(req.url, `http://${req.headers.host}`);
          const code = url.searchParams.get('code');
          const state = url.searchParams.get('state');
          const error = url.searchParams.get('error');
          const errorDescription = url.searchParams.get('error_description');

          console.log('Received callback:');
          console.log('- state:', state);
          console.log('- expectedState:', expectedState);
          console.log('- code:', code ? 'received' : 'not received');
          console.log('- error:', error);

          if (state === expectedState && code) {
            // 标记为已处理
            hasResolved = true;

            res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
            res.end('<!DOCTYPE html><html><head><meta charset="utf-8"><title>授权成功</title></head><body><h1>授权成功！</h1><p>可以关闭此窗口返回VSCode。</p></body></html>');
            server?.close();
            clearTimeout(timeout);
            console.log('Authorization code received successfully');
            resolve(code);
          } else if (error) {
            hasResolved = true;

            res.writeHead(400, { 'Content-Type': 'text/html; charset=utf-8' });
            const errorMsg = errorDescription || error;
            res.end(`<!DOCTYPE html><html><head><meta charset="utf-8"><title>授权失败</title></head><body><h1>授权失败</h1><p>错误: ${errorMsg}</p></body></html>`);
            server?.close();
            clearTimeout(timeout);
            console.error('OAuth authorization failed:', errorMsg);
            reject(new Error(`OAuth授权失败: ${errorMsg}`));
          } else {
            // 无效的回调，但不关闭服务器（可能是浏览器自动请求）
            res.writeHead(400, { 'Content-Type': 'text/html; charset=utf-8' });
            res.end('<!DOCTYPE html><html><head><meta charset="utf-8"><title>无效请求</title></head><body><h1>无效请求</h1><p>请返回VSCode查看状态。</p></body></html>');
            console.warn('Invalid callback received, ignoring');
            // 不关闭服务器，不调用reject，继续等待有效回调
          }
        });

        server.on('error', (err: any) => {
          console.error('HTTP server error:', err);
          if (!hasResolved) {
            hasResolved = true;
            clearTimeout(timeout);
            server?.close();
            reject(new Error(`无法启动本地服务器: ${err.message}`));
          }
        });

        server.listen(8080, () => {
          console.log('等待OAuth回调，监听端口 8080...');
        });
      } catch (error: any) {
        console.error('Failed to create HTTP server:', error);
        clearTimeout(timeout);
        reject(new Error(`创建HTTP服务器失败: ${error.message}`));
      }
    });
  }

  private async exchangeCodeForTokens(code: string, codeVerifier: string, clientId: string): Promise<void> {
    const tokenUrl = `${AuthService.AUTHORITY}/oauth2/v2.0/token`;

    // 构建请求体（PKCE，不需要client_secret）
    const requestBody = `client_id=${encodeURIComponent(clientId)}` +
      `&code=${encodeURIComponent(code)}` +
      `&redirect_uri=${encodeURIComponent(AuthService.REDIRECT_URI)}` +
      `&grant_type=authorization_code` +
      `&code_verifier=${encodeURIComponent(codeVerifier)}`;

    console.log('=== Token Request (PKCE - NO CLIENT SECRET) ===');
    console.log('URL:', tokenUrl);
    console.log('Request Body:', requestBody);

    try {
      const response = await axios.post(
        tokenUrl,
        requestBody,
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Accept': 'application/json'
          }
        }
      );

      const data = response.data;
      console.log('Token response:', data);

      this.accessToken = data.access_token;
      this.refreshToken = data.refresh_token;
      this.tokenExpiry = Date.now() + (data.expires_in * 1000) - (5 * 60 * 1000); // 提前5分钟过期

      this.saveTokens();
      console.log('=== Token Exchange Successful (PKCE) ===');
    } catch (error: any) {
      console.error('=== Token Exchange Failed ===');
      console.error('Status:', error.response?.status);
      console.error('Status Text:', error.response?.statusText);
      console.error('Response Data:', error.response?.data);
      console.error('Error:', error.message);
      throw new Error(`Token exchange failed: ${error.response?.data?.error_description || error.message}`);
    }
  }

  async getAccessToken(): Promise<string> {
    if (!this.accessToken) {
      // 没有token，提示用户登录
      const choice = await vscode.window.showInformationMessage(
        'OneNote Clipper: 需要登录Microsoft账户才能使用',
        '立即登录',
        '取消'
      );
      if (choice === '立即登录') {
        await vscode.commands.executeCommand('onenote.login');
        // 登录后重新获取token
        if (!this.accessToken) {
          throw new Error('登录失败或已取消');
        }
        return this.accessToken!;
      } else {
        throw new Error('未登录，请先登录');
      }
    }

    // 验证并刷新token（如果需要）
    const isValid = await this.validateAndRefreshTokens();
    if (!isValid) {
      console.warn('Token validation failed, but will proceed with existing token');
      // 不立即清除token，让API调用时处理具体的错误
      // 这样可以避免因为网络问题等原因导致的不必要的重新登录
    }

    return this.accessToken!;
  }

  private async refreshAccessToken(): Promise<void> {
    if (!this.refreshToken) {
      throw new Error('无法刷新令牌，请重新登录');
    }

    // 从配置获取Client ID
    const clientId = Config.getClientId();

    console.log('Attempting to refresh access token...');
    console.log('Client ID:', clientId);
    console.log('Refresh token exists:', !!this.refreshToken);

    try {
      const response = await axios.post(
        `${AuthService.AUTHORITY}/oauth2/v2.0/token`,
        new URLSearchParams({
          client_id: clientId,
          refresh_token: this.refreshToken,
          grant_type: 'refresh_token'
        }),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Accept': 'application/json'
          },
          timeout: 30000 // 30秒超时
        }
      );

      const data = response.data;
      console.log('Token refresh response:', {
        has_access_token: !!data.access_token,
        has_refresh_token: !!data.refresh_token,
        expires_in: data.expires_in
      });

      this.accessToken = data.access_token;
      this.refreshToken = data.refresh_token || this.refreshToken; // 有些情况下不会返回新的refresh token
      this.tokenExpiry = Date.now() + (data.expires_in * 1000) - (5 * 60 * 1000); // 提前5分钟过期

      this.saveTokens();
      console.log('Token refreshed and saved successfully');
    } catch (error: any) {
      console.error('Token refresh failed with error:', error.message);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);

      // 如果是invalid_grant错误，说明refresh token也过期了
      if (error.response?.data?.error === 'invalid_grant') {
        console.error('Refresh token is invalid or expired');
        throw new Error('登录会话已过期，请重新登录');
      }

      throw error;
    }
  }

  /**
   * 处理API调用失败时的token清理
   * 当API返回401时调用此方法
   */
  async handleInvalidToken(): Promise<void> {
    console.log('Handling invalid token (API returned 401)');
    await this.logout();

    // 显示提示
    vscode.window.showWarningMessage(
      'OneNote Clipper: 登录已过期，需要重新登录',
      '立即登录'
    ).then(choice => {
      if (choice === '立即登录') {
        vscode.commands.executeCommand('onenote.login');
      }
    });
  }

  async logout(): Promise<void> {
    this.accessToken = null;
    this.refreshToken = null;
    this.tokenExpiry = 0;
    this.saveTokens();
  }

  isLoggedIn(): boolean {
    return this.accessToken !== null;
  }

  /**
   * 保存最近使用的目标位置
   */
  async saveRecentTarget(notebookId: string, notebookName: string, sectionId: string, sectionName: string): Promise<void> {
    await this.context.globalState.update('recentNotebookId', notebookId);
    await this.context.globalState.update('recentNotebookName', notebookName);
    await this.context.globalState.update('recentSectionId', sectionId);
    await this.context.globalState.update('recentSectionName', sectionName);
  }

  /**
   * 获取最近使用的目标位置
   */
  getRecentTarget(): { notebookId: string; notebookName: string; sectionId: string; sectionName: string } | null {
    const notebookId = this.context.globalState.get<string>('recentNotebookId');
    const notebookName = this.context.globalState.get<string>('recentNotebookName');
    const sectionId = this.context.globalState.get<string>('recentSectionId');
    const sectionName = this.context.globalState.get<string>('recentSectionName');

    if (notebookId && notebookName && sectionId && sectionName) {
      return { notebookId, notebookName, sectionId, sectionName };
    }

    return null;
  }
}