import * as vscode from 'vscode';
import axios from 'axios';
import MarkdownIt = require('markdown-it');
import taskLists = require('markdown-it-task-lists');
import { AuthService } from './authService';
import { Config } from './config';

interface Notebook {
  id: string;
  displayName: string;
}

interface Section {
  id: string;
  displayName: string;
}

interface TargetLocation {
  notebook: string;
  section: string;
  notebookId: string;
  sectionId: string;
}

export class OneNoteService {
  private static readonly GRAPH_API_BASE = 'https://graph.microsoft.com/v1.0/me/onenote';

  constructor(private authService: AuthService) {}

  async isLoggedIn(): Promise<boolean> {
    return this.authService.isLoggedIn();
  }

  async getNotebooks(): Promise<Notebook[]> {
    const accessToken = await this.authService.getAccessToken();

    console.log('=== Getting Notebooks ===');
    console.log('Access token:', accessToken ? `${accessToken.substring(0, 20)}...` : 'empty');

    try {
      const response = await axios.get(
        `${OneNoteService.GRAPH_API_BASE}/notebooks?$select=id,displayName`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        }
      );

      console.log('Notebooks response:', response.data);
      return response.data.value;
    } catch (error: any) {
      console.error('=== Get Notebooks Failed ===');
      console.error('Status:', error.response?.status);
      console.error('Status Text:', error.response?.statusText);
      console.error('Response Data:', error.response?.data);
      console.error('Error:', error.message);

      // 如果是401错误，处理token失效
      if (error.response?.status === 401) {
        await this.authService.handleInvalidToken();
        throw new Error('登录已过期，请重新登录');
      }

      throw error;
    }
  }

  async getSections(notebookId: string): Promise<Section[]> {
    const accessToken = await this.authService.getAccessToken();

    try {
      const response = await axios.get(
        `${OneNoteService.GRAPH_API_BASE}/notebooks/${notebookId}/sections?$select=id,displayName`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        }
      );

      return response.data.value;
    } catch (error: any) {
      console.error('Get sections failed:', error.message);

      // 如果是401错误，处理token失效
      if (error.response?.status === 401) {
        await this.authService.handleInvalidToken();
        throw new Error('登录已过期，请重新登录');
      }

      throw error;
    }
  }

  async selectTarget(): Promise<TargetLocation | null> {
    try {
      // 检查是否有最近使用的目标
      const recentTarget = this.authService.getRecentTarget();

      if (recentTarget) {
        // 验证最近使用的目标是否仍然有效
        try {
          const accessToken = await this.authService.getAccessToken();
          await axios.get(
            `${OneNoteService.GRAPH_API_BASE}/sections/${recentTarget.sectionId}`,
            {
              headers: {
                'Authorization': `Bearer ${accessToken}`
              }
            }
          );

          // 目标有效，显示选择对话框
          const selection = await vscode.window.showQuickPick(
            [
              {
                label: `最近使用: ${recentTarget.notebookName} > ${recentTarget.sectionName}`,
                description: '使用上次的目标',
                detail: '点击选择'
              },
              {
                label: '选择新的目标',
                description: '重新选择笔记本和分区'
              }
            ],
            {
              placeHolder: '选择目标位置（按ESC使用最近的目标）'
            }
          );

          if (selection && selection.label.startsWith('最近使用')) {
            // 用户选择使用最近的目标
            return {
              notebook: recentTarget.notebookName,
              section: recentTarget.sectionName,
              notebookId: recentTarget.notebookId,
              sectionId: recentTarget.sectionId
            };
          } else if (!selection) {
            // 用户按ESC或取消，默认使用最近的目标
            return {
              notebook: recentTarget.notebookName,
              section: recentTarget.sectionName,
              notebookId: recentTarget.notebookId,
              sectionId: recentTarget.sectionId
            };
          }
          // 否则继续选择新的目标
        } catch (error) {
          // 目标无效，继续选择新的
          vscode.window.showWarningMessage('最近使用的目标已失效，请重新选择');
        }
      }

      // 获取所有笔记本
      const notebooks = await this.getNotebooks();
      if (notebooks.length === 0) {
        vscode.window.showWarningMessage('没有找到OneNote笔记本');
        return null;
      }

      // 选择笔记本 - 只显示名称，不显示ID
      const notebookItems = notebooks.map(nb => ({
        label: nb.displayName,
        description: '笔记本'
        // 不显示detail，避免ID干扰
      }));

      const selectedNotebook = await vscode.window.showQuickPick(notebookItems, {
        placeHolder: '选择笔记本'
      });

      if (!selectedNotebook) {
        return null;
      }

      // 找到选中的笔记本对象
      const selectedNotebookObj = notebooks.find(nb => nb.displayName === selectedNotebook.label);
      if (!selectedNotebookObj) {
        return null;
      }

      // 获取选中笔记本的分区
      const sections = await this.getSections(selectedNotebookObj.id);
      if (sections.length === 0) {
        vscode.window.showWarningMessage('该笔记本中没有分区');
        return null;
      }

      // 选择分区 - 只显示名称，不显示ID
      const sectionItems = sections.map(sec => ({
        label: sec.displayName,
        description: '分区'
        // 不显示detail，避免ID干扰
      }));

      const selectedSection = await vscode.window.showQuickPick(sectionItems, {
        placeHolder: '选择分区'
      });

      if (!selectedSection) {
        return null;
      }

      // 找到选中的分区对象
      const selectedSectionObj = sections.find(sec => sec.displayName === selectedSection.label);
      if (!selectedSectionObj) {
        return null;
      }

      return {
        notebook: selectedNotebook.label,
        section: selectedSection.label,
        notebookId: selectedNotebookObj.id,
        sectionId: selectedSectionObj.id
      };

    } catch (error: any) {
      throw new Error(`获取OneNote结构失败: ${error.message}`);
    }
  }

  async sendContent(content: string, title: string, target: TargetLocation, tags: string[] = []): Promise<void> {
    const accessToken = await this.authService.getAccessToken();

    // 创建HTML内容
    const htmlContent = this.createHtmlContent(content, title, tags);

    try {
      // 发送到OneNote
      const response = await axios.post(
        `${OneNoteService.GRAPH_API_BASE}/sections/${target.sectionId}/pages`,
        htmlContent,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'text/html'
          }
        }
      );

      console.log('页面创建成功:', response.data);

      // 保存最近使用的目标
      await this.authService.saveRecentTarget(target.notebookId, target.notebook, target.sectionId, target.section);
    } catch (error: any) {
      console.error('Send content failed:', error.message);

      // 如果是401错误，处理token失效
      if (error.response?.status === 401) {
        await this.authService.handleInvalidToken();
        throw new Error('登录已过期，请重新登录');
      }

      throw error;
    }
  }

  private createHtmlContent(content: string, title: string, tags: string[] = []): string {
    // 转义HTML特殊字符
    const escapeHtml = (text: string) => {
      return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
    };

    // 检测语言类型（简单实现）
    const detectLanguage = (text: string) => {
      const ext = vscode.window.activeTextEditor?.document.fileName.split('.').pop();
      return ext || 'plaintext';
    };

    const escapedContent = escapeHtml(content);
    const language = detectLanguage(content);
    const theme = Config.getCodeHighlightTheme();

    // 获取主题CSS
    const themeCss = this.getThemeCss(theme);

    // 生成标签HTML
    const tagsHtml = tags.length > 0
      ? `<div style="margin-top: 20px; padding: 10px; background-color: #f0f0f0; border-radius: 5px;">
         <strong>标签：</strong>
         ${tags.map(tag => `<span style="display: inline-block; padding: 3px 8px; margin: 2px; background-color: #0078d4; color: white; border-radius: 3px; font-size: 12px;">${escapeHtml(tag)}</span>`).join('')}
       </div>`
      : '';

    return `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>${escapeHtml(title)}</title>
    <style>
      ${themeCss}
      body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 20px; }
      h1 { color: #333; border-bottom: 2px solid #0078d4; padding-bottom: 10px; }
      pre { background-color: #f8f8f8; padding: 15px; border-radius: 5px; overflow-x: auto; }
      code { font-family: 'Consolas', 'Monaco', 'Courier New', monospace; }
      .tags { margin-top: 20px; padding: 10px; background-color: #f0f0f0; border-radius: 5px; }
      .tag { display: inline-block; padding: 3px 8px; margin: 2px; background-color: #0078d4; color: white; border-radius: 3px; font-size: 12px; }
      .footer { margin-top: 20px; font-size: 12px; color: #666; font-style: italic; }
    </style>
  </head>
  <body>
    <h1>${escapeHtml(title)}</h1>
    <pre><code class="language-${language}">${escapedContent}</code></pre>
    ${tagsHtml}
    <p class="footer">发送时间: ${new Date().toLocaleString('zh-CN')}</p>
  </body>
</html>`;
  }

  private getThemeCss(theme: string): string {
    const themes: Record<string, string> = {
      default: `
        pre { background-color: #f8f8f8; }
        code { color: #333; }
      `,
      github: `
        pre { background-color: #f6f8fa; border: 1px solid #d1d9e0; }
        code { color: #24292e; }
        .keyword { color: #d73a49; }
        .string { color: #032f62; }
        .comment { color: #6a737d; }
      `,
      monokai: `
        pre { background-color: #272822; }
        code { color: #f8f8f2; }
        .keyword { color: #66d9ef; }
        .string { color: #e6db74; }
        .comment { color: #75715e; }
      `,
      'vs-dark': `
        pre { background-color: #1e1e1e; }
        code { color: #d4d4d4; }
        .keyword { color: #569cd6; }
        .string { color: #ce9178; }
        .comment { color: #6a9955; }
      `,
      'vs-light': `
        pre { background-color: #ffffff; border: 1px solid #e1e1e1; }
        code { color: #000000; }
        .keyword { color: #0000ff; }
        .string { color: #a31515; }
        .comment { color: #008000; }
      `,
      'atom-one-dark': `
        pre { background-color: #282c34; }
        code { color: #abb2bf; }
        .keyword { color: #c678dd; }
        .string { color: #98c379; }
        .comment { color: #5c6370; }
      `
    };

    return themes[theme] || themes.default;
  }

  async sendMarkdown(markdownContent: string, title: string, target: TargetLocation, tags: string[] = []): Promise<void> {
    const accessToken = await this.authService.getAccessToken();

    // 创建包含Markdown渲染的HTML内容
    const htmlContent = this.createMarkdownHtmlContent(markdownContent, title, tags);

    try {
      // 发送到OneNote
      const response = await axios.post(
        `${OneNoteService.GRAPH_API_BASE}/sections/${target.sectionId}/pages`,
        htmlContent,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'text/html'
          }
        }
      );

      console.log('Markdown页面创建成功:', response.data);

      // 保存最近使用的目标
      await this.authService.saveRecentTarget(target.notebookId, target.notebook, target.sectionId, target.section);
    } catch (error: any) {
      console.error('Send markdown failed:', error.message);

      // 如果是401错误，处理token失效
      if (error.response?.status === 401) {
        await this.authService.handleInvalidToken();
        throw new Error('登录已过期，请重新登录');
      }

      throw error;
    }
  }

  private createMarkdownHtmlContent(markdownContent: string, title: string, tags: string[] = []): string {
    // 创建markdown-it实例，启用所有扩展
    const md = new MarkdownIt({
      html: true,        // 在源码中启用HTML标签
      xhtmlOut: false,    // 使用'/'关闭单标签（<br />）
      breaks: true,       // 将'\n'转换为<br>
      langPrefix: 'language-',  // 代码块的CSS语言前缀
      linkify: true,      // 自动转换URL为链接
      typographer: true,  // 启用智能引号等
      quotes: '“”‘’'     // 智能引号
    });

    // 添加任务列表支持
    try {
      md.use(taskLists);
    } catch (e) {
      console.warn('markdown-it-task-lists not available, continuing without it');
    }

    // 渲染Markdown为HTML
    const html = md.render(markdownContent);

    // 转义标题中的HTML
    const escapeHtml = (text: string) => {
      return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
    };

    // 生成标签HTML
    const tagsHtml = tags.length > 0
      ? `<div class="tags"><strong>标签：</strong> ${tags.map(tag => `<span class="tag">${escapeHtml(tag)}</span>`).join('')}</div>`
      : '';

    // 获取代码高亮主题CSS
    const theme = Config.getCodeHighlightTheme();
    const highlightJsCss = this.getHighlightJsCss(theme);

    return `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>${escapeHtml(title)}</title>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.8.0/styles/${theme}.min.css">
    <style>
      body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', Arial, sans-serif; margin: 20px; line-height: 1.6; color: #333; }
      h1 { color: #2c3e50; border-bottom: 2px solid #3498db; padding-bottom: 10px; margin-top: 0; }
      h2 { color: #34495e; margin-top: 24px; margin-bottom: 16px; }
      h3 { color: #7f8c8d; margin-top: 20px; margin-bottom: 12px; }
      p { margin: 8px 0; }
      pre { background-color: #f6f8fa; padding: 16px; border-radius: 6px; overflow-x: auto; border: 1px solid #e1e4e8; margin: 16px 0; }
      code { font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, Courier, monospace; background-color: rgba(27, 31, 35, 0.05); padding: 0.2em 0.4em; border-radius: 3px; font-size: 85%; }
      pre code { background-color: transparent; padding: 0; font-size: 100%; }
      a { color: #0366d6; text-decoration: none; }
      a:hover { text-decoration: underline; }
      ul, ol { margin: 8px 0; padding-left: 24px; }
      li { margin: 4px 0; }
      blockquote { border-left: 4px solid #dfe2e5; padding-left: 16px; margin: 16px 0; color: #6a737d; }
      table { border-collapse: collapse; margin: 16px 0; }
      th, td { border: 1px solid #dfe2e5; padding: 6px 13px; }
      th { background-color: #f6f8fa; font-weight: 600; }
      img { max-width: 100%; height: auto; }
      hr { border: 0; border-top: 1px solid #e1e4e8; margin: 24px 0; }
      .tags { margin-top: 24px; padding: 12px; background-color: #f1f8ff; border-radius: 6px; border-left: 4px solid #3498db; }
      .tag { display: inline-block; padding: 4px 8px; margin: 2px; background-color: #0366d6; color: white; border-radius: 3px; font-size: 12px; font-weight: 500; }
      .footer { margin-top: 24px; padding-top: 16px; border-top: 1px solid #e1e4e8; font-size: 12px; color: #586069; font-style: italic; }
      ${highlightJsCss}
    </style>
  </head>
  <body>
    <h1>${escapeHtml(title)}</h1>
    ${html}
    ${tagsHtml}
    <p class="footer">发送时间: ${new Date().toLocaleString('zh-CN')}</p>
  </body>
</html>`;
  }

  private getHighlightJsCss(theme: string): string {
    // 返回highlight.js的内联CSS，确保代码在OneNote中正确高亮
    const highlightStyles: Record<string, string> = {
      default: `
        .hljs { display: block; overflow-x: auto; padding: 0.5em; background: #f0f0f0; }
        .hljs, .hljs-subst { color: #444; }
        .hljs-comment { color: #888888; }
        .hljs-keyword, .hljs-attribute, .hljs-selector-tag, .hljs-meta-keyword, .hljs-doctag, .hljs-name { font-weight: bold; }
        .hljs-type, .hljs-string, .hljs-number, .hljs-selector-id, .hljs-selector-class, .hljs-quote, .hljs-template-tag, .hljs-deletion { color: #880000; }
        .hljs-title, .hljs-section { color: #880000; font-weight: bold; }
        .hljs-regexp, .hljs-symbol, .hljs-variable, .hljs-template-variable, .hljs-link, .hljs-selector-attr, .hljs-selector-pseudo { color: #bc6060; }
        .hljs-literal { color: #78a960; }
        .hljs-built_in, .hljs-bullet, .hljs-code, .hljs-addition { color: #397300; }
        .hljs-meta { color: #1f7199; }
        .hljs-meta-string { color: #4d99bf; }
        .hljs-emphasis { font-style: italic; }
        .hljs-strong { font-weight: bold; }
      `,
      github: `
        .hljs { display: block; overflow-x: auto; padding: 0.5em; color: #333; background: #f8f8f8; }
        .hljs-comment, .hljs-quote { color: #998; font-style: italic; }
        .hljs-keyword, .hljs-selector-tag, .hljs-subst { color: #333; font-weight: bold; }
        .hljs-number, .hljs-literal, .hljs-variable, .hljs-template-variable, .hljs-tag .hljs-attr { color: #008080; }
        .hljs-string, .hljs-doctag { color: #d14; }
        .hljs-title, .hljs-section, .hljs-selector-id { color: #900; font-weight: bold; }
        .hljs-subst { font-weight: normal; }
        .hljs-type, .hljs-class .hljs-title { color: #458; font-weight: bold; }
        .hljs-tag, .hljs-name, .hljs-attribute { color: #000080; font-weight: normal; }
        .hljs-regexp, .hljs-link { color: #009926; }
        .hljs-symbol, .hljs-bullet { color: #990073; }
        .hljs-built_in, .hljs-builtin-name { color: #0086b3; }
        .hljs-meta { color: #999; font-weight: bold; }
        .hljs-deletion { background: #fdd; }
        .hljs-addition { background: #dfd; }
        .hljs-emphasis { font-style: italic; }
        .hljs-strong { font-weight: bold; }
      `,
      monokai: `
        .hljs { display: block; overflow-x: auto; padding: 0.5em; background: #272822; color: #ddd; }
        .hljs-tag, .hljs-keyword, .hljs-selector-tag, .hljs-literal, .hljs-strong, .hljs-name { color: #f92672; }
        .hljs-code { color: #66d9ef; }
        .hljs-class .hljs-title { color: white; }
        .hljs-attribute, .hljs-symbol, .hljs-regexp, .hljs-link { color: #bf79db; }
        .hljs-string, .hljs-bullet, .hljs-subst, .hljs-title, .hljs-section, .hljs-emphasis, .hljs-type, .hljs-built_in, .hljs-builtin-name, .hljs-selector-attr, .hljs-selector-pseudo, .hljs-addition, .hljs-variable, .hljs-template-tag, .hljs-template-variable { color: #a6e22e; }
        .hljs-comment, .hljs-quote, .hljs-deletion, .hljs-meta { color: #75715e; }
        .hljs-keyword, .hljs-selector-tag, .hljs-literal, .hljs-doctag, .hljs-title, .hljs-section, .hljs-type, .hljs-selector-id { font-weight: bold; }
      `,
      'vs-dark': `
        .hljs { display: block; overflow-x: auto; padding: 0.5em; background: #1e1e1e; color: #d4d4d4; }
        .hljs-comment, .hljs-quote, .hljs-variable { color: #6a9955; }
        .hljs-keyword, .hljs-selector-tag, .hljs-built_in, .hljs-name, .hljs-tag { color: #569cd6; }
        .hljs-string, .hljs-section, .hljs-title, .hljs-attribute, .hljs-literal, .hljs-template-tag, .hljs-template-variable, .hljs-type, .hljs-addition { color: #ce9178; }
        .hljs-deletion, .hljs-selector-attr, .hljs-selector-pseudo, .hljs-meta { color: #9cdcfe; }
        .hljs-doctag { color: #d7ba7d; }
        .hljs-attr { color: #9cdcfe; }
        .hljs-symbol, .hljs-bullet, .hljs-link { color: #569cd6; }
        .hljs-emphasis { font-style: italic; }
        .hljs-strong { font-weight: bold; }
      `
    };

    return highlightStyles[theme] || highlightStyles.default;
  }
}