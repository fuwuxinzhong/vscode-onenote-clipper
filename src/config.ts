import * as vscode from 'vscode';

export class Config {
  private static readonly CONFIG_SECTION = 'onenote';

  /**
   * Get Client ID
   * 使用公共应用的Client ID，所有用户共享
   */
  static getClientId(): string {
    // 公共应用的Client ID（由开发者创建）
    // 用户不需要自己创建Azure应用
    const PUBLIC_CLIENT_ID = '8f2111cf-9921-4237-8e45-567dc93a4597';

    // 允许用户覆盖（用于测试或自定义）
    const config = vscode.workspace.getConfiguration(this.CONFIG_SECTION);
    const clientId = config.get<string>('clientId', PUBLIC_CLIENT_ID);

    // 如果用户配置了空字符串，使用默认值
    return clientId || PUBLIC_CLIENT_ID;
  }

  /**
   * Get default notebook name
   */
  static getDefaultNotebook(): string {
    const config = vscode.workspace.getConfiguration(this.CONFIG_SECTION);
    return config.get<string>('defaultNotebook', '');
  }

  /**
   * Get default section name
   */
  static getDefaultSection(): string {
    const config = vscode.workspace.getConfiguration(this.CONFIG_SECTION);
    return config.get<string>('defaultSection', '');
  }

  /**
   * Get create new page setting
   */
  static getCreateNewPage(): boolean {
    const config = vscode.workspace.getConfiguration(this.CONFIG_SECTION);
    return config.get<boolean>('createNewPage', true);
  }

  /**
   * Get code highlight theme
   */
  static getCodeHighlightTheme(): string {
    const config = vscode.workspace.getConfiguration(this.CONFIG_SECTION);
    return config.get<string>('codeHighlightTheme', 'default');
  }

  /**
   * Get enable tags setting
   */
  static getEnableTags(): boolean {
    const config = vscode.workspace.getConfiguration(this.CONFIG_SECTION);
    return config.get<boolean>('enableTags', true);
  }
}
