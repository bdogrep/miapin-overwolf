import { AppWindow } from "../AppWindow";
import { kWindowNames } from "../consts";

class Desktop extends AppWindow {
  private static _instance: Desktop;

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
    // デスクトップウィンドウの初期化処理
    console.log("Desktop window initialized");
  }
}

Desktop.instance().run();
