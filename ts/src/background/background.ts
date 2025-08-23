import {
  OWGames,
  OWGameListener,
  OWWindow
} from '@overwolf/overwolf-api-ts';

import { kWindowNames, kGameClassIds } from "../consts";

import RunningGameInfo = overwolf.games.RunningGameInfo;
import AppLaunchTriggeredEvent = overwolf.extensions.AppLaunchTriggeredEvent;

// The background controller holds all of the app's background logic - hence its name. it has
// many possible use cases, for example sharing data between windows, or, in our case,
// managing which window is currently presented to the user. To that end, it holds a dictionary
// of the windows available in the app.
// Our background controller implements the Singleton design pattern, since only one
// instance of it should exist.
class BackgroundController {
  private static _instance: BackgroundController;
  private _windows: Record<string, OWWindow> = {};
  private _gameListener: OWGameListener;
  private lolCheckTimer: number | null = null;
  private lolDetected: boolean = false;

  private constructor() {
    // Populating the background controller's window dictionary
    this._windows[kWindowNames.desktop] = new OWWindow(kWindowNames.desktop);
    this._windows[kWindowNames.inGame] = new OWWindow(kWindowNames.inGame);

    // When a a supported game game is started or is ended, toggle the app's windows
    this._gameListener = new OWGameListener({
      onGameStarted: this.toggleWindows.bind(this),
      onGameEnded: this.toggleWindows.bind(this)
    });

    overwolf.extensions.onAppLaunchTriggered.addListener(
      e => this.onAppLaunchTriggered(e)
    );
  };

  // Implementing the Singleton design pattern
  public static instance(): BackgroundController {
    if (!BackgroundController._instance) {
      BackgroundController._instance = new BackgroundController();
    }

    return BackgroundController._instance;
  }

  // When running the app, start listening to games' status and decide which window should
  // be launched first, based on whether a supported game is currently running
  public async run() {
    this._gameListener.start();

    const currWindowName = (await this.isSupportedGameRunning())
      ? kWindowNames.inGame
      : kWindowNames.desktop;

    this._windows[currWindowName].restore();

    // League of Legends ランチャーイベントの設定
    this.setupLoLLauncherEvents();

    overwolf.games.launchers.events.onInfoUpdates.addListener(function(info) {
      console.log("Launcher Info UPDATE: " + JSON.stringify(info));
    });
  }

  private async onAppLaunchTriggered(e: AppLaunchTriggeredEvent) {
    console.log('onAppLaunchTriggered():', e);

    if (!e || e.origin.includes('gamelaunchevent')) {
      return;
    }

    if (await this.isSupportedGameRunning()) {
      this._windows[kWindowNames.desktop].restore();
      this._windows[kWindowNames.inGame].restore();
    } else {
      this._windows[kWindowNames.desktop].restore();
      this._windows[kWindowNames.inGame].restore();
    }
  }

  private toggleWindows(info: RunningGameInfo) {
    if (!info || !this.isSupportedGame(info)) {
      return;
    }

    if (info.isRunning) {
      this._windows[kWindowNames.desktop].restore();
      this._windows[kWindowNames.inGame].restore();
    } else {
      this._windows[kWindowNames.desktop].restore();
      this._windows[kWindowNames.inGame].restore();
    }
  }

  private async isSupportedGameRunning(): Promise<boolean> {
    const info = await OWGames.getRunningGameInfo();

    return info && info.isRunning && this.isSupportedGame(info);
  }

  // Identify whether the RunningGameInfo object we have references a supported game
  private isSupportedGame(info: RunningGameInfo) {
    return kGameClassIds.includes(info.classId);
  }

  private setupLoLLauncherEvents() {
    // LoLランチャーの起動をチェック
    this.checkLoLLauncher();
  }

  private checkLoLLauncher() {
    // すでに検知済みなら何もしない
    if (this.lolDetected) {
      return;
    }

    // LoLランチャー（ID: 10902）が起動しているかチェック
    overwolf.games.launchers.getRunningLaunchersInfo((result) => {
      const isLoLRunning = result?.launchers?.some(launcher => launcher.classId === 10902);
      
      if (isLoLRunning) {
        console.log("League of Legendsランチャーを検知しました！");
        this.lolDetected = true;
        
        // タイマーをクリア
        if (this.lolCheckTimer) {
          clearInterval(this.lolCheckTimer);
          this.lolCheckTimer = null;
        }
        
        // サモナー情報を取得
        this.getLoLSummonerInfo();
      } else {
        // 起動していない場合、まだタイマーが設定されていなければ設定
        if (!this.lolCheckTimer) {
          console.log("LoLランチャーの起動を待機中...");
          this.lolCheckTimer = setInterval(() => {
            this.checkLoLLauncher();
          }, 1000);
        }
      }
    });
  }

  private getLoLSummonerInfo() {
    const features = ["summoner_info", "game_flow"];
    
    // 必要な機能を設定
    overwolf.games.launchers.events.setRequiredFeatures(10902, features, (info) => {
      if (info.success) {
        console.log("LoLランチャー機能を設定しました");
        
        // サモナー情報を取得して表示
        overwolf.games.launchers.events.getInfo(10902, (result) => {
          if (result.success && result.res) {
            console.log("success: overwolf.games.launchers.events.getInfo");
            
            if (result.res.summoner_info) {
              // 取得できる全データを確認
              console.log("サモナー情報:", result.res.summoner_info);
              console.log("プレイヤー情報:", result.res.summoner_info.player_info);
            } else {
              console.log("サモナー情報はまだ利用できません（ログイン前の可能性）");
            }
            
            if (result.res.game_flow) {
              console.log("ゲームフローフェーズ:", result.res.game_flow.phase);
            }
          }
        });
      } else {
        console.error("LoLランチャー機能の設定に失敗:", info.error);
      }
    });
  }
}

BackgroundController.instance().run();
