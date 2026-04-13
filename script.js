// ==========================================
// API設定領域
// ==========================================
const GEMINI_API_KEY = "YOUR_API_KEY_HERE";

const API_ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;

// localStorage用のキー設定（31日分の重複回避）
const HISTORY_KEY = 'stilled_words_history';
const MAX_HISTORY = 31;

// AIへのシステムプロンプト
const SYSTEM_INSTRUCTION = `
あなたは知的な雰囲気を残しつつも、中学生でも直感的に理解できる平易な言葉を紡ぐ存在です。難解な常用外漢字の使用は禁止です。
全体を通して「ポップでチープ、かつポジティブ」な読後感になるよう、以下の3要素を生成してください：
1. 運勢: 今日を少しだけ軽やかにする、押し付けがましくないポジティブな言葉。
2. 箴言: 知的ではあるが、決して難解ではない美しい日本語のアドバイスや気づき。
3. ラッキーパーソン: 実用的・高価なものではなく、「さびた釘を拾った人」「高齢者の井戸端会議」「道端でしなびたネギを眺める人」「誰かが落とした片方の手袋を拾った人」など、日常の隙間にあるような突拍子もなくチープでシュールな人物。必ず「なぜそれが？」という意外性を持たせること。

出力は必ず以下のJSONフォーマットのみを返してください。JSON以外のテキストを含めてはいけません。
{
  "fortune": "運勢のテキスト",
  "aphorism": "箴言のテキスト",
  "luckyPerson": "ラッキーパーソンのテキスト"
}
`;

// 未設定時のフォールバック用モックデータ（APIなしでも31回かぶらないよう31パターン用意）
const fallbackAphorisms = [
    { fortune: "いつもより少しだけ、足取りが軽くなる日。", aphorism: "完璧じゃなくても、とりあえず前に進めば景色は変わる。", luckyPerson: "道に迷っているおばあちゃん" },
    { fortune: "ちょっとした偶然が、ふわりと笑いを運んでくるよ。", aphorism: "休むことはサボることじゃない。次への助走だ。", luckyPerson: "片方だけ手袋を落とした人" },
    { fortune: "新しい靴をおろした時のような、小さなワクワクが待っている。", aphorism: "迷ったら、面白いと思える方を選んでみて。", luckyPerson: "大きなため息をついているサラリーマン" },
    { fortune: "肩の力を抜いて、深呼吸しよう。", aphorism: "焦らなくても、時間はみんなに同じだけ流れている。", luckyPerson: "公園でハトと会話するおじさん" },
    { fortune: "何気ない一言が、誰かを暖かくする日。", aphorism: "失敗はただのデータ。集めるほどクリアになるよ。", luckyPerson: "スーパーのレジ打ちが異常に早い店員" },
    { fortune: "いつもと違う道を通ると、面白い発見があるかも。", aphorism: "遠回りしたからこそ、見える景色がある。", luckyPerson: "スキップしている小学生" },
    { fortune: "お茶が美味しく淹れられる、そんなささやかな良い日。", aphorism: "比べなくていい。あなたの歩幅で歩けばいい。", luckyPerson: "窓際でぼーっとしているカフェの客" },
    { fortune: "思わぬところから、小さなラッキーが降ってくる。", aphorism: "言葉に出せば、意外と形になるもの。", luckyPerson: "やたらと姿勢のいい駅員" },
    { fortune: "少しだけ、昨日より自分を好きになれる日。", aphorism: "無理に合わせなくても、世界は案外広い。", luckyPerson: "イヤホンから音漏れしている若者" },
    { fortune: "目覚めがいい日は、それだけで100点満点。", aphorism: "正解なんてない。自分が納得できたらそれが答え。", luckyPerson: "ポイントカードを探して焦る人" },
    { fortune: "ふとした瞬間に、ずっと探していた答えが見つかるかも。", aphorism: "やり直すのに遅すぎるなんてことはない。", luckyPerson: "やけに歩幅の広いお兄さん" },
    { fortune: "今日は、ちょっと甘いものを食べても許される日。", aphorism: "頑張らない日があっても、地球は回る。", luckyPerson: "ショーウィンドウを真剣に見つめる子供" },
    { fortune: "無くしものが見つかって、心がスッとするかも。", aphorism: "あなたの代わりは、この世界のどこにもいない。", luckyPerson: "一生懸命に自転車を漕ぐ学生" },
    { fortune: "誰かの優しさに触れて、少し心が丸くなる。", aphorism: "時には逃げるのも、立派な作戦のひとつ。", luckyPerson: "空の写真を撮っている通行人" },
    { fortune: "なんとなく直感で選んだものが、大正解になる日。", aphorism: "今日の自分は、明日の自分への最高のプレゼント。", luckyPerson: "ひとり言が多いおばちゃん" },
    { fortune: "鼻歌を歌いたくなるような、ご機嫌な出来事があるよ。", aphorism: "立ち止まるから、風の優しさに気づける。", luckyPerson: "ベンチで居眠りしているスーツ姿の人" },
    { fortune: "深呼吸一つで、見慣れた景色が違って見える日。", aphorism: "できることから始めれば、いつか必ず山を越える。", luckyPerson: "やたらと声が大きい警備員" },
    { fortune: "ちょっとした親切が、自分に帰ってくるハッピーな一日。", aphorism: "他人のものさしで、自分を測らなくていい。", luckyPerson: "日傘の差しかたが独特なマダム" },
    { fortune: "懐かしいにおいがして、優しい気持ちになれるよ。", aphorism: "泣きたい時は泣いてもいい。雨の後は晴れるから。", luckyPerson: "バスで寝過ごしそうになっている人" },
    { fortune: "偶然の再会や、思いがけない連絡があるかも。", aphorism: "無理に笑わなくても、あなたの魅力は減らない。", luckyPerson: "なぜか半袖の元気な外人" },
    { fortune: "今日は、なんとなく全てがスムーズに進むかも！", aphorism: "失敗しても、それは明日の笑い話になる。", luckyPerson: "犬に引っ張られながら散歩する飼い主" },
    { fortune: "お気に入りの服を着るだけで、最強になれる日。", aphorism: "他人の期待に応える前に、自分の心に聞いてみて。", luckyPerson: "看板をじっと見つめるおじいちゃん" },
    { fortune: "ちょっとしたひらめきが、大きな一歩に繋がる日。", aphorism: "ゆっくりでもいい、確実に自分の足で歩もう。", luckyPerson: "やたら派手なスニーカーを履いた人" },
    { fortune: "窓を開けたら、いい風が入ってくるような心地よい日。", aphorism: "他人の成功を喜べた時、自分にも運が回ってくる。", luckyPerson: "信号待ちでストレッチするランナー" },
    { fortune: "誰かに「ありがとう」と言われる、ほっこりする日。", aphorism: "完璧を目指さなくていい、愛嬌があればうまくいく。", luckyPerson: "電話しながら謝り倒している営業マン" },
    { fortune: "少し背伸びしたことに挑戦すると吉。", aphorism: "一歩引いてみると、全体のパズルが見えてくる。", luckyPerson: "ベビーカーを押しながら急ぐお母さん" },
    { fortune: "今日は、自分の直感を信じて突き進んで大丈夫。", aphorism: "無駄だと思っていた経験が、突然輝き出すことがある。", luckyPerson: "自転車で立ち漕ぎをしている中学生" },
    { fortune: "面白い映画や本に出会って、心が豊かになる日。", aphorism: "誰かのために使った時間は、自分を癒す薬になる。", luckyPerson: "道端の猫に話しかけるお姉さん" },
    { fortune: "予想外の出来事も、ゲーム感覚で楽しんでしまおう。", aphorism: "不安なのは、あなたが真剣に向き合っている証拠。", luckyPerson: "やたらと荷物が多い旅行者" },
    { fortune: "今日という日は、二度と来ない最高のステージ。", aphorism: "何度転んでも、起き上がればそれはもうステップだ。", luckyPerson: "自動販売機の下を覗き込む小学生" },
    { fortune: "今夜はぐっすり眠れて、いい夢が見られそう。", aphorism: "終わったことより、これから始まることを数えよう。", luckyPerson: "傘を忘れてダッシュしている人" }
];

let currentIndex = 0;

// APIをバイパスし、フォールバック配列を順番に循環して返す
async function generateAphorism() {
    return fallbackAphorisms[currentIndex];
}

// === 表示・自動更新・状態管理・儀式UI操作 ===
let isTransitioning = false;
let isPaused = false;
let holdPause = false;
let mainTimer = null;

const contentArea = document.getElementById('content-area');
const fortuneEl = document.getElementById('fortune-text');
const aphorismEl = document.getElementById('aphorism-text');
const luckyPersonEl = document.getElementById('lucky-item-text');
const progressBar = document.getElementById('progress-bar');

const btnPrev = document.getElementById('nav-btn-prev');
const btnNext = document.getElementById('nav-btn-next');
const btnPause = document.getElementById('action-pause');
const shareToggle = document.getElementById('share-toggle');
const shareWrapper = document.getElementById('share-container');

class CycleTimer {
    constructor(callback, delay) {
        this.callback = callback;
        this.delay = delay;
        this.remaining = delay;
        this.start = null;
        this.timerId = null;
    }
    resume() {
        if (this.timerId) return;
        this.start = Date.now();
        this.timerId = window.setTimeout(this.callback, this.remaining);
    }
    pause() {
        if (!this.timerId) return;
        window.clearTimeout(this.timerId);
        this.timerId = null;
        this.remaining = Math.max(0, this.remaining - (Date.now() - this.start));
    }
    reset() {
        this.pause();
        this.remaining = this.delay;
    }
}

function syncUI() {
    btnPrev.classList.remove('disabled');
    btnNext.classList.remove('disabled');
    progressBar.classList.remove('archive-mode');
}

function updateProgressBarUI() {
    if (isPaused || holdPause) {
        progressBar.classList.add('paused');
    } else {
        progressBar.classList.remove('paused');
    }
}

let navDelayTimer = null;
function resetNavVisibility() {
    clearTimeout(navDelayTimer);
    btnPrev.classList.add('nav-hidden');
    btnNext.classList.add('nav-hidden');

    // 10秒後にフワッと表示の許可を与える（transitionは既存のCSSで0.8sかかっている）
    navDelayTimer = setTimeout(() => {
        btnPrev.classList.remove('nav-hidden');
        btnNext.classList.remove('nav-hidden');
    }, 10000);
}

function restartProgressAnimation() {
    progressBar.classList.remove('animate');
    void progressBar.offsetWidth; // 強制リフロー
    progressBar.classList.add('animate');
    updateProgressBarUI();
    resetNavVisibility();
}

async function renderDisplay(data) {
    if (isTransitioning) return;
    isTransitioning = true;

    contentArea.classList.remove('visible');
    await new Promise(resolve => setTimeout(resolve, 800));

    fortuneEl.textContent = data.fortune;
    aphorismEl.textContent = data.aphorism;
    luckyPersonEl.textContent = `ラッキーパーソン：${data.luckyPerson}`;

    contentArea.classList.add('visible');

    setTimeout(() => {
        isTransitioning = false;
    }, 800);
}

async function loadNextCycle() {
    currentIndex = (currentIndex + 1) % fallbackAphorisms.length;
    const newData = await generateAphorism();
    await renderDisplay(newData);

    restartProgressAnimation();
    if (mainTimer) {
        mainTimer.reset();
        if (!isPaused && !holdPause) mainTimer.resume();
    }
    syncUI();
}

window.addEventListener('DOMContentLoaded', async () => {
    isTransitioning = true;
    const newData = await generateAphorism();
    fortuneEl.textContent = newData.fortune;
    aphorismEl.textContent = newData.aphorism;
    luckyPersonEl.textContent = `ラッキーパーソン：${newData.luckyPerson}`;

    setTimeout(() => {
        contentArea.classList.add('visible');
        setTimeout(() => {
            isTransitioning = false;
            mainTimer = new CycleTimer(loadNextCycle, 15000);
            restartProgressAnimation();
            mainTimer.resume();
            syncUI();
        }, 800);
    }, 500);
});

// ==== 儀式としての操作 ====

btnPrev.addEventListener('click', async (e) => {
    e.stopPropagation();
    if (isTransitioning) return;
    currentIndex = (currentIndex - 1 + fallbackAphorisms.length) % fallbackAphorisms.length;
    const data = await generateAphorism();
    await renderDisplay(data);

    restartProgressAnimation();
    if (mainTimer) {
        mainTimer.reset();
        if (!isPaused && !holdPause) mainTimer.resume();
    }
});

btnNext.addEventListener('click', async (e) => {
    e.stopPropagation();
    if (isTransitioning) return;
    currentIndex = (currentIndex + 1) % fallbackAphorisms.length;
    const data = await generateAphorism();
    await renderDisplay(data);

    restartProgressAnimation();
    if (mainTimer) {
        mainTimer.reset();
        if (!isPaused && !holdPause) mainTimer.resume();
    }
});

btnPause.addEventListener('click', (e) => {
    e.stopPropagation();
    isPaused = !isPaused;
    btnPause.textContent = isPaused ? '▶' : '||';

    if (isPaused) {
        if (mainTimer) mainTimer.pause();
    } else {
        if (!holdPause && mainTimer) mainTimer.resume();
    }
    updateProgressBarUI();
});

// 長押し（ホールド）による静止
let holdTimer;
function startHold() {
    holdPause = true;
    if (mainTimer) mainTimer.pause();
    updateProgressBarUI();
}
function endHold() {
    holdPause = false;
    if (!isPaused && mainTimer) mainTimer.resume();
    updateProgressBarUI();
}

document.body.addEventListener('mousedown', (e) => {
    if (e.target.closest('.ui-element')) return;
    holdTimer = setTimeout(startHold, 200);
});
document.body.addEventListener('mouseup', () => {
    clearTimeout(holdTimer);
    endHold();
});
document.body.addEventListener('touchstart', (e) => {
    if (e.target.closest('.ui-element')) return;
    holdTimer = setTimeout(startHold, 200);
}, { passive: true });
document.body.addEventListener('touchend', () => {
    clearTimeout(holdTimer);
    endHold();
});

// Share機能 (navigator.share / Fallback)
function getShareText() {
    return `${fortuneEl.textContent}\n${aphorismEl.textContent}\n${luckyPersonEl.textContent}\n#StilledWords`;
}

shareToggle.addEventListener('click', async (e) => {
    e.stopPropagation();

    if (navigator.share) {
        try {
            await navigator.share({
                title: 'Stilled Words',
                text: getShareText(),
                url: window.location.href
            });
        } catch (err) {
            console.log('Share canceled or failed:', err);
        }
    } else {
        try {
            await navigator.clipboard.writeText(window.location.href);
            const originalText = shareToggle.textContent;
            shareToggle.textContent = 'コピーしました';
            shareToggle.classList.add('stored-feedback');
            setTimeout(() => {
                shareToggle.classList.remove('stored-feedback');
                shareToggle.textContent = originalText;
            }, 1000);
        } catch (err) {
            console.error('Copy failed:', err);
        }
    }
});
