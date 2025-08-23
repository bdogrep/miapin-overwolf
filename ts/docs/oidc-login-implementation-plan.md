# Overwolf OIDCログイン機能実装計画書

## 概要
OverwolfアプリにOIDC（OpenID Connect）を使用したログイン機能を最もシンプルに実装するための計画書です。

## 前提条件
- Overwolf DevRelチームから初期登録トークンを取得済みであること
- アプリのリダイレクトURIが決定していること

## 実装ステップ

### 1. OAuthアプリの登録（初回のみ）

#### 1.1 登録リクエストの送信
```javascript
// 登録エンドポイント: https://id.overwolf.com/oidc/reg
const registrationData = {
  redirect_uris: ["overwolf-extension://[APP_UID]/desktop.html"],
  application_type: "native",
  client_name: "MiaPin",
  logo_uri: "overwolf-extension://[APP_UID]/icons/icon.png",
  policy_uri: "https://example.com/policy",  // 要更新
  tos_uri: "https://example.com/terms"       // 要更新
};
```

#### 1.2 登録レスポンスの保存
以下の情報を安全に保存：
- `client_id`: クライアントID
- `client_secret`: クライアントシークレット
- `registration_access_token`: 登録管理用トークン

### 2. ログイン機能の実装

#### 2.1 必要なファイル構成
```
src/
  auth/
    AuthService.ts     # 認証サービスクラス
    AuthConfig.ts      # 設定定義
  desktop/
    desktop.ts         # ログインボタンの追加
    desktop.html       # UIの更新
```

#### 2.2 AuthService.ts の実装
```typescript
export class AuthService {
  private config = {
    authEndpoint: 'https://id.overwolf.com/oidc/auth',
    tokenEndpoint: 'https://id.overwolf.com/oidc/token',
    clientId: '', // 登録時に取得
    clientSecret: '', // 登録時に取得
    redirectUri: 'overwolf-extension://[APP_UID]/desktop.html',
    scope: 'openid email profile'
  };

  // PKCEチャレンジの生成
  private generateCodeVerifier(): string {
    // ランダム文字列生成（43-128文字）
  }

  private generateCodeChallenge(verifier: string): string {
    // SHA256ハッシュ化してBase64エンコード
  }

  // ログイン処理
  async login(): Promise<void> {
    const codeVerifier = this.generateCodeVerifier();
    const codeChallenge = this.generateCodeChallenge(codeVerifier);
    
    // 認証URLの構築
    const authUrl = this.buildAuthUrl(codeChallenge);
    
    // ブラウザで認証ページを開く
    overwolf.utils.openUrlInDefaultBrowser(authUrl);
    
    // コールバック待機とトークン交換
    await this.handleCallback(codeVerifier);
  }

  // トークン交換
  private async exchangeToken(code: string, verifier: string): Promise<any> {
    // POSTリクエストでトークン取得
  }

  // ユーザー情報取得
  async getUserInfo(accessToken: string): Promise<any> {
    // トークンを使用してユーザー情報取得
  }
}
```

#### 2.3 UIの実装
```html
<!-- desktop.html にログインボタン追加 -->
<button id="loginBtn" class="login-button">
  Overwolfでログイン
</button>

<div id="userInfo" class="user-info" style="display: none;">
  <span id="userName"></span>
  <button id="logoutBtn">ログアウト</button>
</div>
```

### 3. セキュリティ考慮事項

1. **トークン保存**
   - アクセストークンは暗号化して保存
   - リフレッシュトークンは安全な場所に保存

2. **PKCE実装**
   - 必ずcode_verifierとcode_challengeを使用
   - 認証フローごとに新しい値を生成

3. **エラーハンドリング**
   - ユーザーが認証をキャンセルした場合の処理
   - ネットワークエラーの処理
   - トークン期限切れの処理

### 4. 最小限の実装（MVP）

最もシンプルな実装として、以下の機能のみを実装：

1. **ログインボタン**
   - デスクトップウィンドウに配置
   - クリックで認証フロー開始

2. **基本的なスコープ**
   - `openid`: ユーザーID取得のみ
   - 追加情報は必要に応じて後から追加

3. **シンプルなUI**
   - ログイン前：ログインボタンのみ表示
   - ログイン後：ユーザー名とログアウトボタン表示

### 5. 実装タイムライン

1. **Phase 1（1日目）**
   - OAuthアプリの登録
   - 基本的な認証フローの実装

2. **Phase 2（2日目）**
   - UIの実装
   - エラーハンドリング

3. **Phase 3（3日目）**
   - テストとデバッグ
   - ドキュメント整備

## 必要な情報

実装開始前に以下の情報が必要です：

1. **初期登録トークン**（DevRelチームから取得）
2. **アプリのUID**（manifest.jsonから確認）
3. **プライバシーポリシーURL**
4. **利用規約URL**

## 参考資料

- [Overwolf OIDC Documentation](https://dev.overwolf.com/ow-native/reference/overwolf-oidc/ow-oidc/)
- [OAuth 2.0 PKCE仕様](https://datatracker.ietf.org/doc/html/rfc7636)