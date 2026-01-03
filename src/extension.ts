import * as vscode from 'vscode';
import { OneNoteService } from './oneNoteService';
import { AuthService } from './authService';
import { WelcomeGuide } from './welcomeGuide';
import { Config } from './config';

export function activate(context: vscode.ExtensionContext) {
  console.log('=== OneNote Clipper Extension Activate Start ===');
  console.log('Extension context:', context.extensionPath);

  try {
    // 显示欢迎指南（首次使用时）
    WelcomeGuide.checkAndShow(context);
    console.log('Welcome guide checked');

    const authService = new AuthService(context);
    console.log('AuthService created');

    const oneNoteService = new OneNoteService(authService);
    console.log('OneNoteService created');

  // 登录命令
  console.log('Registering login command...');
  const loginCommand = vscode.commands.registerCommand('onenote.login', async () => {
    console.log('Login command executed');
    try {
      await authService.login();
      vscode.window.showInformationMessage('已成功登录Microsoft账户');
    } catch (error: any) {
      console.error('Login failed:', error);
      vscode.window.showErrorMessage(`登录失败: ${error.message}`);
    }
  });
  console.log('Login command registered');

  // 登出命令
  console.log('Registering logout command...');
  const logoutCommand = vscode.commands.registerCommand('onenote.logout', async () => {
    console.log('Logout command executed');
    try {
      await authService.logout();
      vscode.window.showInformationMessage('已登出Microsoft账户');
    } catch (error: any) {
      console.error('Logout failed:', error);
      vscode.window.showErrorMessage(`登出失败: ${error.message}`);
    }
  });
  console.log('Logout command registered');

  // 发送选中内容到OneNote
  console.log('Registering sendSelection command...');
  const sendSelectionCommand = vscode.commands.registerCommand('onenote.sendSelection', async () => {
    console.log('Send selection command executed');
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      vscode.window.showWarningMessage('没有打开的编辑器');
      return;
    }

    const selection = editor.selection;
    if (selection.isEmpty) {
      vscode.window.showWarningMessage('请先选择要发送的代码');
      return;
    }

    const text = editor.document.getText(selection);
    const fileName = editor.document.fileName.split('\\').pop() || '未命名文件';
    const lineStart = selection.start.line + 1;
    const lineEnd = selection.end.line + 1;
    const defaultTitle = `${fileName} (第${lineStart}-${lineEnd}行)`;

    await sendToOneNote(oneNoteService, text, defaultTitle);
  });
  console.log('Send selection command registered');

  // 发送整个文件到OneNote
  console.log('Registering sendFile command...');
  const sendFileCommand = vscode.commands.registerCommand('onenote.sendFile', async () => {
    console.log('Send file command executed');
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      vscode.window.showWarningMessage('没有打开的编辑器');
      return;
    }

    const text = editor.document.getText();
    const fileName = editor.document.fileName.split('\\').pop() || '未命名文件';
    const defaultTitle = `文件: ${fileName}`;

    await sendToOneNote(oneNoteService, text, defaultTitle);
  });
  console.log('Send file command registered');

  // 选择目标位置命令
  console.log('Registering selectTarget command...');
  const selectTargetCommand = vscode.commands.registerCommand('onenote.selectTarget', async () => {
    console.log('Select target command executed');
    try {
      const target = await oneNoteService.selectTarget();
      if (target) {
        vscode.window.showInformationMessage(`已选择: ${target.notebook} > ${target.section}`);
      }
    } catch (error: any) {
      console.error('Select target failed:', error);
      vscode.window.showErrorMessage(`选择目标失败: ${error.message}`);
    }
  });
  console.log('Select target command registered');

  // 批量发送多个文件到OneNote
  console.log('Registering sendMultipleFiles command...');
  const sendMultipleFilesCommand = vscode.commands.registerCommand('onenote.sendMultipleFiles', async () => {
    console.log('Send multiple files command executed');
    try {
      // 检查是否已登录
      if (!await oneNoteService.isLoggedIn()) {
        const choice = await vscode.window.showInformationMessage(
          '需要登录Microsoft账户才能发送到OneNote',
          '登录',
          '取消'
        );
        if (choice === '登录') {
          await vscode.commands.executeCommand('onenote.login');
        } else {
          return;
        }
      }

      // 获取目标位置
      const target = await oneNoteService.selectTarget();
      if (!target) {
        return;
      }

      // 选择多个文件
      const fileUris = await vscode.window.showOpenDialog({
        canSelectMany: true,
        openLabel: '选择要发送的文件',
        filters: {
          '文本文件': ['txt', 'js', 'ts', 'py', 'java', 'cpp', 'c', 'h', 'cs', 'go', 'rb', 'php', 'html', 'css', 'json', 'xml', 'md'],
          '所有文件': ['*']
        }
      });

      if (!fileUris || fileUris.length === 0) {
        return;
      }

      // 输入批量标题前缀
      const batchTitlePrefix = await vscode.window.showInputBox({
        prompt: '输入批量页面标题前缀（可选）',
        placeHolder: '例如：代码审查、项目文档等'
      });

      // 询问是合并到一个页面还是分开页面
      const sendMode = await vscode.window.showQuickPick(
        [
          { label: '合并到一个页面', description: '所有文件内容合并到一个OneNote页面' },
          { label: '分开多个页面', description: '每个文件创建一个独立的OneNote页面' }
        ],
        {
          placeHolder: '选择发送方式'
        }
      );

      if (!sendMode) {
        return;
      }

      const mergeIntoOnePage = sendMode.label === '合并到一个页面';

      // 发送到OneNote
      await vscode.window.withProgress({
        location: vscode.ProgressLocation.Notification,
        title: `正在发送 ${fileUris.length} 个文件到OneNote...`,
        cancellable: false
      }, async (progress) => {
        if (mergeIntoOnePage) {
          // 合并到一个页面
          const allContent = [];
          for (let i = 0; i < fileUris.length; i++) {
            const uri = fileUris[i];
            const fileName = uri.fsPath.split('\\').pop() || '未命名文件';
            const document = await vscode.workspace.openTextDocument(uri);
            const content = document.getText();
            allContent.push(`// ${fileName}\n${content}`);
            progress.report({ increment: (i + 1) / fileUris.length * 100, message: `读取 ${fileName}...` });
          }

          const finalTitle = batchTitlePrefix ? `${batchTitlePrefix} (批量)` : `批量文件 (${fileUris.length}个)`;
          await oneNoteService.sendContent(allContent.join('\n\n'), finalTitle, target);
          vscode.window.showInformationMessage(`已成功发送 ${fileUris.length} 个文件到OneNote：${finalTitle}`);
        } else {
          // 分开多个页面
          for (let i = 0; i < fileUris.length; i++) {
            const uri = fileUris[i];
            const fileName = uri.fsPath.split('\\').pop() || '未命名文件';
            const document = await vscode.workspace.openTextDocument(uri);
            const content = document.getText();
            const title = batchTitlePrefix ? `${batchTitlePrefix} - ${fileName}` : fileName;

            await oneNoteService.sendContent(content, title, target);
            progress.report({ increment: (i + 1) / fileUris.length * 100, message: `发送 ${fileName}...` });
          }
          vscode.window.showInformationMessage(`已成功发送 ${fileUris.length} 个文件到OneNote`);
        }
      });

    } catch (error: any) {
      console.error('Send multiple files failed:', error);
      vscode.window.showErrorMessage(`批量发送失败: ${error.message}`);
    }
  });
  console.log('Send multiple files command registered');

  // 发送Markdown渲染后的内容到OneNote
  console.log('Registering sendMarkdown command...');
  const sendMarkdownCommand = vscode.commands.registerCommand('onenote.sendMarkdown', async () => {
    console.log('Send Markdown command executed');
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      vscode.window.showWarningMessage('没有打开的编辑器');
      return;
    }

    // 检查文件是否是Markdown
    const fileName = editor.document.fileName.toLowerCase();
    if (!fileName.endsWith('.md') && !fileName.endsWith('.markdown')) {
      const choice = await vscode.window.showInformationMessage(
        '当前文件不是Markdown格式，是否仍然发送？',
        '仍然发送',
        '取消'
      );
      if (choice !== '仍然发送') {
        return;
      }
    }

    try {
      // 检查是否已登录
      if (!await oneNoteService.isLoggedIn()) {
        const choice = await vscode.window.showInformationMessage(
          '需要登录Microsoft账户才能发送到OneNote',
          '登录',
          '取消'
        );
        if (choice === '登录') {
          await vscode.commands.executeCommand('onenote.login');
        } else {
          return;
        }
      }

      // 获取目标位置
      const target = await oneNoteService.selectTarget();
      if (!target) {
        return;
      }

      // 获取Markdown内容
      const markdownContent = editor.document.getText();

      // 输入页面标题
      const fileName = editor.document.fileName.split('\\').pop() || '未命名文件';
      const pageTitle = await vscode.window.showInputBox({
        prompt: '输入OneNote页面标题',
        value: fileName,
        placeHolder: '例如：API文档、项目说明等'
      });

      if (pageTitle === undefined) {
        return;
      }

      const finalTitle = pageTitle || fileName;

      // 输入标签（可选）
      const tagsInput = await vscode.window.showInputBox({
        prompt: '输入标签（可选，用逗号分隔）',
        placeHolder: '例如：重要,待办,文档'
      });

      // 解析标签
      const tags = tagsInput
        ? tagsInput.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0)
        : [];

      // 发送到OneNote
      await vscode.window.withProgress({
        location: vscode.ProgressLocation.Notification,
        title: '正在渲染Markdown并发送到OneNote...',
        cancellable: false
      }, async (progress) => {
        await oneNoteService.sendMarkdown(markdownContent, finalTitle, target, tags);
        const tagInfo = tags.length > 0 ? `（标签：${tags.join(', ')}）` : '';
        vscode.window.showInformationMessage(`已成功发送Markdown到OneNote：${finalTitle}${tagInfo}`);
      });

    } catch (error: any) {
      console.error('Send Markdown failed:', error);
      vscode.window.showErrorMessage(`发送Markdown失败: ${error.message}`);
    }
  });
  console.log('Send Markdown command registered');

  // 清除所有保存的token（用于解决认证问题）
  console.log('Registering clearTokens command...');
  const clearTokensCommand = vscode.commands.registerCommand('onenote.clearTokens', async () => {
    console.log('Clear tokens command executed');
    try {
      await authService.logout();
      // 清除最近目标
      context.globalState.update('recentTarget', undefined);
      vscode.window.showInformationMessage('已清除所有保存的token和最近目标，请重新登录');
    } catch (error: any) {
      console.error('Clear tokens failed:', error);
      vscode.window.showErrorMessage(`清除token失败: ${error.message}`);
    }
  });
  console.log('Clear tokens command registered');

  // 重置欢迎指南命令（用于测试）
  console.log('Registering resetWelcome command...');
  const resetWelcomeCommand = vscode.commands.registerCommand('onenote.resetWelcome', () => {
    console.log('Reset welcome command executed');
    WelcomeGuide.reset(context);
    vscode.window.showInformationMessage('欢迎指南已重置，下次启动时会重新显示');
  });
  console.log('Reset welcome command registered');

  console.log('Adding commands to subscriptions...');
  context.subscriptions.push(
    loginCommand,
    logoutCommand,
    sendSelectionCommand,
    sendFileCommand,
    sendMultipleFilesCommand,
    sendMarkdownCommand,
    selectTargetCommand,
    clearTokensCommand,
    resetWelcomeCommand
  );
  console.log('Commands added to subscriptions');

  console.log('=== OneNote Clipper Extension Activate Complete ===');
} catch (error: any) {
  console.error('=== OneNote Clipper Extension Activate Failed ===');
  console.error('Error:', error);
  vscode.window.showErrorMessage(`OneNote Clipper 扩展激活失败: ${error.message}`);
}
}

async function sendToOneNote(oneNoteService: OneNoteService, content: string, defaultTitle: string) {
  try {
    // 检查是否已登录
    if (!await oneNoteService.isLoggedIn()) {
      const choice = await vscode.window.showInformationMessage(
        '需要登录Microsoft账户才能发送到OneNote',
        '登录',
        '取消'
      );
      if (choice === '登录') {
        await vscode.commands.executeCommand('onenote.login');
      } else {
        return;
      }
    }

    // 获取目标位置
    const target = await oneNoteService.selectTarget();
    if (!target) {
      return;
    }

    // 输入页面标题
    const pageTitle = await vscode.window.showInputBox({
      prompt: '输入OneNote页面标题',
      value: defaultTitle,
      placeHolder: '例如：代码片段、API文档等'
    });

    // 如果用户取消输入，不发送
    if (pageTitle === undefined) {
      return;
    }

    // 如果用户没有输入，使用默认值
    const finalTitle = pageTitle || defaultTitle;

    // 检查是否启用标签功能
    let tags: string[] = [];
    if (Config.getEnableTags()) {
      // 输入标签（可选）
      const tagsInput = await vscode.window.showInputBox({
        prompt: '输入标签（可选，用逗号分隔）',
        placeHolder: '例如：重要,待办,代码片段'
      });

      // 解析标签
      tags = tagsInput
        ? tagsInput.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0)
        : [];
    }

    // 发送到OneNote
    await vscode.window.withProgress({
      location: vscode.ProgressLocation.Notification,
      title: '正在发送到OneNote...',
      cancellable: false
    }, async (progress) => {
      await oneNoteService.sendContent(content, finalTitle, target, tags);
      const tagInfo = tags.length > 0 ? `（标签：${tags.join(', ')}）` : '';
      vscode.window.showInformationMessage(`已成功发送到OneNote：${finalTitle}${tagInfo}`);
    });

  } catch (error: any) {
    vscode.window.showErrorMessage(`发送失败: ${error.message}`);
  }
}

export function deactivate() {
  console.log('OneNote Clipper扩展已停用');
}