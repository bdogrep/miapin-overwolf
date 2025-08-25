# League of Legends 自動録画システム計画書

## 概要

League of Legends専用の自動録画システムを実装する。試合の開始・終了を検知して自動で録画し、ローカルに保存する機能を提供。

## システム仕様

### 対象ゲーム
- **League of Legends のみ**（ランク・カジュアル・練習モード・カスタムゲーム全て対象）

### 録画設定（固定値）
- **解像度**: 720p
- **FPS**: 30fps  
- **品質**: Medium
- **最大録画時間**: 2時間
- **自動削除**: なし（手動管理）

### ファイル管理
- **保存先**: `Documents/miapn/recordings/`
- **ファイル名**: `LoL_{YYYY-MM-DD}_{HH-mm-ss}.mp4`
- **メタデータ**: 日時とファイル名のみのJSONファイル

## アーキテクチャ設計

### 3ウィンドウ構成での責任分離

#### **Background Window** - 録画エンジンコア
- LoLランチャーイベント監視（`game_flow`：`GameStart`/`EndOfGame`）
- 録画開始/停止の実制御（`overwolf.streaming` API）
- ファイル保存・管理
- 設定・状態の永続化
- エラーハンドリング・復旧処理

#### **Desktop Window** - 録画管理センター
- 録画履歴の表示・再生
- 手動録画の開始/停止制御
- ファイル管理（削除、エクスポート）
- トラブルシューティング画面

#### **In-Game Window** - 録画状態表示
- 録画中ステータスインジケーター
- 録画時間の表示
- 緊急停止ボタン（Ctrl+R）
- 録画エラー通知

### 必要な権限追加

```json
"permissions": [
  "Hotkeys",              // 既存
  "GameInfo",             // 既存  
  "FileSystem",           // ファイル操作
  "DesktopStreaming",     // 録画機能
  "Streaming",            // 録画制御
  "VideoCaptureSettings"  // 録画設定
]
```

## 実装計画

### Phase 1: 基盤準備（1週間）
- manifest.json権限追加
- RecordingBackgroundService作成
- LoLランチャーイベント統合
- overwolf.streaming API実装

### Phase 2: 録画機能（1週間）
- 自動録画実装
- ファイル管理システム
- エラーハンドリング

### Phase 3: UI・制御（1週間）
- Desktop録画管理UI
- In-Game最小表示
- 緊急停止機能

### 合計開発期間：約2-3週間

## 技術実装詳細

### LoL専用イベント監視

```typescript
class LoLRecordingManager {
  async initialize() {
    // LoL ランチャーイベント監視（GameID: 10902）
    const result = await overwolf.games.launchers.events.setRequiredFeatures(
      10902,
      ['game_flow'],
      this.onLauncherReady.bind(this)
    );
    
    overwolf.games.launchers.events.onInfoUpdates.addListener(
      this.handleGameFlow.bind(this)
    );
  }
  
  private async handleGameFlow(info: any) {
    if (info.feature === 'game_flow') {
      switch (info.info.game_flow) {
        case 'GameStart':   await this.startRecording(); break;
        case 'EndOfGame':   await this.stopRecording(); break;
      }
    }
  }
}
```

### ウィンドウ間通信

```typescript
// Background Windowで録画状態管理
window.recordingState = {
  isRecording: boolean,
  recordingStartTime: Date,
  currentFileName: string,
  error: string | null
};

// イベント通信
window.owEventBus.trigger('recording:started', { fileName: '...' });
window.owEventBus.trigger('recording:stopped', { duration: 1800 });
```

## 重要な設計判断

1. **ミニマル実装**: 設定項目を最小限に抑え、開発効率と安定性を重視
2. **LoL専用**: 他ゲーム対応は除外し、LoL特化で最適化
3. **ローカル保存**: クラウド連携は将来の拡張として除外
4. **固定品質**: パフォーマンス影響を最小化

## 将来の拡張可能性

- 録画品質設定の追加
- 自動削除機能
- ハイライト検出機能
- クラウド連携

---
**作成日**: 2025-08-25