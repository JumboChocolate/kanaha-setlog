// 奏葉ちゃんのセットログ — Scriptable ウィジェット
// GitHub の公開フィード (latest.json + 画像) を読み、
// 画像いっぱいに時刻・場所・ひとことを重ねて表示します。
// 更新はサーバー側で1時間ごと。ウィジェット側は約15分ごとに再取得を試みます。

const FEED_URL = "https://raw.githubusercontent.com/JumboChocolate/kanaha-setlog/main/latest.json";

async function loadEntry() {
  const req = new Request(FEED_URL + "?t=" + Date.now());
  req.timeoutInterval = 20;
  return await req.loadJSON();
}

async function loadImage(url) {
  const req = new Request(url);
  req.timeoutInterval = 30;
  const data = await req.load();
  return Image.fromData(data);
}

function buildWidget(entry, img) {
  const w = new ListWidget();
  w.setPadding(0, 0, 0, 0);
  if (img) w.backgroundImage = img;

  // 下部を少し暗くして文字を読みやすくする
  const grad = new LinearGradient();
  grad.colors = [new Color("#000000", 0), new Color("#000000", 0.55)];
  grad.locations = [0.45, 1.0];
  w.backgroundGradient = grad;

  const root = w.addStack();
  root.layoutVertically();
  root.setPadding(10, 10, 10, 10);
  root.addSpacer();

  // 文字は暗い帯の上に置く（ホーム画面の単色ティント表示でも読みやすくするため）
  const band = root.addStack();
  band.layoutVertically();
  band.backgroundColor = new Color("#000000", 0.52);
  band.cornerRadius = 12;
  band.setPadding(8, 12, 10, 12);

  const timeTxt = band.addText(entry.time || "");
  timeTxt.font = Font.boldSystemFont(30);
  timeTxt.textColor = Color.white();
  timeTxt.shadowColor = new Color("#000000", 0.6);
  timeTxt.shadowRadius = 4;
  timeTxt.shadowOffset = new Point(0, 1);

  const placeTxt = band.addText(entry.place || "");
  placeTxt.font = Font.boldSystemFont(15);
  placeTxt.textColor = Color.white();
  placeTxt.shadowColor = new Color("#000000", 0.6);
  placeTxt.shadowRadius = 4;
  placeTxt.shadowOffset = new Point(0, 1);

  band.addSpacer(4);

  const commentTxt = band.addText(entry.comment || "");
  commentTxt.font = Font.systemFont(13);
  commentTxt.textColor = Color.white();
  commentTxt.shadowColor = new Color("#000000", 0.6);
  commentTxt.shadowRadius = 4;
  commentTxt.shadowOffset = new Point(0, 1);

  // 次の再取得の目安（iOS 側の判断で前後します）
  w.refreshAfterDate = new Date(Date.now() + 15 * 60 * 1000);
  return w;
}

async function main() {
  let widget;
  try {
    const entry = await loadEntry();
    let img = null;
    if (entry.imageUrl) {
      try { img = await loadImage(entry.imageUrl); } catch (e) { /* 画像なしでも文字は出す */ }
    }
    widget = buildWidget(entry, img);
  } catch (e) {
    widget = new ListWidget();
    const t = widget.addText("奏葉ちゃんのセットログ");
    t.font = Font.boldSystemFont(16);
    const s = widget.addText("読み込みに失敗しました。通信の良いところで開き直してください。");
    s.font = Font.systemFont(12);
    widget.refreshAfterDate = new Date(Date.now() + 5 * 60 * 1000);
  }

  if (config.runsInWidget) {
    Script.setWidget(widget);
  } else {
    await widget.presentMedium();
  }
  Script.complete();
}

await main();
