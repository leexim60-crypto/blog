<template>
  <div class="project-preview" :class="`preview-${type}`" aria-hidden="true">
    <template v-if="type === 'tank'"><div class="arcade-top"><span>BATTLE CITY</span><span>1UP <b>025000</b></span></div><div class="tank-map"><i v-for="i in 36" :key="i" :class="{ brick: [1,2,5,6,8,11,13,14,17,18,20,23,25,26,29,30,32,35].includes(i), water:[9,10,15,16].includes(i) }"></i><svg class="pixel-tank tank-player" viewBox="0 0 28 32"><path fill="#e8c77a" d="M1 9h6v21H1zm20 0h6v21h-6zM8 12h12v16H8zm3-12h6v19h-6z"/><path fill="#68572c" d="M11 20h6v6h-6z"/></svg><svg class="pixel-tank tank-enemy" viewBox="0 0 28 32"><path fill="#b8c2b7" d="M1 9h6v21H1zm20 0h6v21h-6zM8 12h12v16H8zm3-12h6v19h-6z"/></svg><span class="pixel-base">★</span></div><div class="arcade-bottom"><span>STAGE 01</span><span>▰ ▰ ▰ <b>READY TO PLAY</b></span></div></template>
    <template v-else-if="type === 'strikers'"><div class="flight-radar"></div><span class="flight-coord">34° 12′ N / 132° 27′ E</span><svg class="plane plane-main" viewBox="0 0 140 180"><path d="M70 7 82 60l49 28v16L82 88l-2 46 22 19v11l-32-9-32 9v-11l22-19-2-46-49 16V88l49-28Z" fill="#a8c8be"/><path d="m70 7 6 103-6 33-6-33Z" fill="#476963"/><path d="M65 46h10v28H65z" fill="#213d41"/><circle cx="35" cy="90" r="7" fill="#d27564"/><circle cx="105" cy="90" r="7" fill="#d27564"/></svg><svg class="plane plane-small" viewBox="0 0 140 180"><path d="M70 7 82 60l49 28v16L82 88l-2 46 22 19v11l-32-9-32 9v-11l22-19-2-46-49 16V88l49-28Z" fill="#698782"/></svg><div class="flight-name"><small>THE ARCADE RETURNS</small><strong>STRIKERS <em>1945</em></strong><span>四国战机 · 再次起航</span></div><span class="flight-cross">+</span></template>
    <template v-else><div class="english-window"><div class="window-bar"><span><i></i><i></i><i></i></span><small>DAILY ENGLISH</small><span>✳</span></div><div class="word-body"><div class="word-label">WORD OF THE DAY <span>01 / 12</span></div><strong>serendipity<span>↗</span></strong><small>/ˌserənˈdɪpəti/</small><p>不期而遇的美好</p><div class="word-line"></div><div class="word-example">Some of the best things happen<br>when you least expect them.</div><div class="word-footer"><span>noun · 名词</span><span>认识这个词 <b>→</b></span></div></div></div></template>
  </div>
</template>
<script setup>defineProps({ type: { type: String, default: 'english' } })</script>
<style scoped>
.project-preview {
  height: 235px;
  position: relative;
  overflow: hidden;
  border-bottom: 1px solid var(--hairline);
  isolation: isolate;
}

.preview-tank {
  background: #24251c;
  padding: 20px 22px;
  color: #b9b99c;
  font-family: var(--font-mono);
}

.arcade-top,.arcade-bottom {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 8px;
  letter-spacing: .05em;
}

.arcade-top b {
  color: #dfbc79;
  font-weight: 400;
}

.arcade-top>span:first-child {
  font-size: 11px;
  font-weight: 600;
  letter-spacing: .18em;
}

.tank-map {
  position: relative;
  display: grid;
  grid-template-columns: repeat(6,1fr);
  grid-template-rows: repeat(6,1fr);
  width: 164px;
  height: 160px;
  margin: 12px auto 9px;
  gap: 3px;
}

.tank-map i.brick {
  background: repeating-linear-gradient(0deg,transparent 0 5px,#29271d 5px 7px),repeating-linear-gradient(90deg,#856348 0 8px,#29271d 8px 10px);
  opacity: .8;
}

.tank-map i.water {
  background: repeating-linear-gradient(0deg,#436367 0 3px,#293e41 3px 6px);
}

.pixel-tank {
  position: absolute;
  width: 21px;
  height: 24px;
  image-rendering: pixelated;
}

.tank-player {
  bottom: 22px;
  left: 45px;
}

.tank-enemy {
  top: 5px;
  right: 50px;
  transform: rotate(180deg);
}

.pixel-base {
  position: absolute;
  bottom: -1px;
  left: 74px;
  color: #b9ac74;
  font-size: 21px;
}

.arcade-bottom {
  font-size: 7px;
  color: #a69e80;
}

.arcade-bottom b {
  font-weight: 400;
  color: #d9bb77;
  margin-left: 7px;
}

.preview-strikers {
  background: radial-gradient(ellipse at 65% 40%,#234b4b,#172c31 80%);
  color: #cedbd5;
}

.flight-radar {
  position: absolute;
  width: 270px;
  height: 270px;
  top: -15px;
  right: -45px;
  border: 1px solid #afd9bf16;
  border-radius: 50%;
  background: repeating-radial-gradient(circle,transparent 0 41px,#afd9bf0e 42px 43px);
}

.flight-coord {
  position: absolute;
  top: 18px;
  left: 20px;
  font: 7px var(--font-mono);
  letter-spacing: .06em;
  color: #86a39a;
}

.plane {
  position: absolute;
  filter: drop-shadow(8px 14px 5px #0b1b2760);
}

.plane-main {
  height: 166px;
  right: 25px;
  top: 19px;
  transform: rotate(25deg);
}

.plane-small {
  height: 67px;
  top: 30px;
  left: 65px;
  transform: rotate(25deg);
  opacity: .45;
}

.flight-name {
  position: absolute;
  bottom: 20px;
  left: 20px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.flight-name small {
  font: 7px var(--font-mono);
  letter-spacing: .16em;
  color: #b5c8bd;
}

.flight-name strong {
  font-size: 21px;
  font-weight: 700;
  letter-spacing: .01em;
}

.flight-name em {
  font-weight: 300;
  font-style: normal;
}

.flight-name>span {
  font-size: 8px;
  color: #98b2a8;
  letter-spacing: .13em;
}

.flight-cross {
  position: absolute;
  right: 20px;
  bottom: 15px;
  font-weight: 200;
  color: #8bb3a3;
}

.preview-english {
  background: #252d2a;
  padding: 23px 22px;
}

.english-window {
  max-width: 285px;
  margin: auto;
  background: #e7ece3;
  color: #283c34;
  border-radius: 8px;
  box-shadow: 0 14px 35px #0004;
  transform: rotate(-3deg);
}

.window-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid #324a3517;
  padding: 9px 12px;
}

.window-bar>span:first-child {
  display: flex;
  gap: 4px;
}

.window-bar i {
  width: 4px;
  height: 4px;
  border-radius: 50%;
  background: #95a495;
}

.window-bar small {
  font: 6px var(--font-mono);
  letter-spacing: .12em;
}

.window-bar>span:last-child {
  font-size: 10px;
}

.word-body {
  padding: 12px 17px 11px;
}

.word-label {
  display: flex;
  justify-content: space-between;
  font: 6px var(--font-mono);
  letter-spacing: .1em;
  color: #778775;
}

.word-body>strong {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font: 29px var(--font-serif);
  margin: 5px 0 0;
  letter-spacing: -1px;
}

.word-body>strong>span {
  font: 14px var(--font-sans);
  color: #668875;
}

.word-body>small {
  font-size: 7px;
  color: #859183;
}

.word-body>p {
  font-size: 8px;
  margin: 5px 0 9px;
  color: #5c6e5d;
}

.word-line {
  height: 1px;
  background: #243a2417;
}

.word-example {
  font: italic 10px/1.5 var(--font-serif);
  margin: 8px 0;
  color: #61735f;
}

.word-footer {
  display: flex;
  justify-content: space-between;
  font-size: 6px;
  color: #7c8d79;
}

.word-footer>span:last-child {
  color: #395d46;
}

.word-footer b {
  margin-left: 7px;
}
</style>
