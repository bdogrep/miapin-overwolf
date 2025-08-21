import {
  OWGames,
} from "@overwolf/overwolf-api-ts";

import { AppWindow } from "../AppWindow";
import { kWindowNames } from "../consts";

class Desktop extends AppWindow {
  private static _instance: Desktop;
  private lolCheckTimer: NodeJS.Timeout | null = null;
  private lolDetected: boolean = false;

  private constructor() {
    super(kWindowNames.desktop);
  }

  public static instance() {
    if (!this._instance) {
      this._instance = new Desktop();
    }

    return this._instance;
  }

  public async run() {
    const gameClassId = await this.getCurrentGameClassId();
    console.log(gameClassId);

    overwolf.games.events.getInfo(function(info) {
      console.log(info);
    });

    // League of Legends ランチャーイベントの設定
    this.setupLoLLauncherEvents();

    overwolf.games.launchers.events.onInfoUpdates.addListener(function(info) {
      console.log("Launcher Info UPDATE: " + JSON.stringify(info));
    });
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
            console.log("=== League of Legends サモナー情報 ===");
            
            if (result.res.summoner_info) {
              // 取得できる全データを確認
              console.log(result.res.summoner_info);
              console.log(result.res.summoner_info.player_info);
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

  private async getCurrentGameClassId(): Promise<number | null> {
    const info = await OWGames.getRunningGameInfo();

    return (info && info.isRunning && info.classId) ? info.classId : null;
  }
}

Desktop.instance().run();
