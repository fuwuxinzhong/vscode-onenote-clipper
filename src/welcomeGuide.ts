import * as vscode from 'vscode';

/**
 * 欢迎指南
 * 帮助用户了解扩展功能
 */
export class WelcomeGuide {
  private static readonly HAS_SHOWN_WELCOME_KEY = 'hasShownWelcome';

  /**
   * 检查是否需要显示欢迎指南
   */
  static async checkAndShow(context: vscode.ExtensionContext): Promise<void> {
    const hasShownWelcome = context.globalState.get<boolean>(this.HAS_SHOWN_WELCOME_KEY, false);

    if (!hasShownWelcome) {
      await this.showWelcome(context);
    }
  }

  /**
   * 显示欢迎指南
   */
  private static async showWelcome(context: vscode.ExtensionContext): Promise<void> {
    const result = await vscode.window.showInformationMessage(
      '欢迎使用 OneNote Clipper！\n\n' +
      '快速开始：\n' +
      '1. 选中代码或打开文件\n' +
      '2. 按 Ctrl+Alt+O 发送选中内容\n' +
      '3. 或按 Ctrl+Shift+Alt+O 发送整个文件\n' +
      '4. 选择目标笔记本和分区\n\n' +
      '首次使用需要登录 Microsoft 账户',
      '开始使用',
      '查看文档'
    );

    await context.globalState.update(this.HAS_SHOWN_WELCOME_KEY, true);

    if (result === '查看文档') {
      await this.openDocumentation();
    }
  }

  /**
   * 打开文档
   */
  private static async openDocumentation(): Promise<void> {
    const readmePath = vscode.Uri.file(
      vscode.Uri.joinPath(vscode.Uri.file(__dirname), '..', '..', 'README.md').fsPath
    );

    try {
      await vscode.commands.executeCommand('vscode.open', readmePath);
    } catch (error) {
      vscode.window.showErrorMessage('无法打开文档，请查看项目中的 README.md 文件');
    }
  }

  /**
   * 重置欢迎指南状态（用于测试）
   */
  static reset(context: vscode.ExtensionContext): void {
    context.globalState.update(this.HAS_SHOWN_WELCOME_KEY, false);
  }
}