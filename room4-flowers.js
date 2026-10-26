// Correspondence follows Interflora, Zodiac Flowers, 2026-02-02.
// These are cultural zodiac flowers, not a universal official birth-flower standard.
const R4_FLOWERS=[
 {id:'Ari',star:'おひつじ座',flower:'ハニーサックル',english:'Honeysuckle',description:'筒のように細長い花の奥には蜜があり、先端から長いおしべが突き出している。甘い香りに誘われ、虫たちが蜜を求めてやってくる。'},
 {id:'Tau',star:'おうし座',flower:'ポピー',english:'Poppy',description:'薄い花びらが開くと、中心には黒っぽいおしべが輪のように並ぶ。その真ん中には、花が散ったあとに種を包む実へ育つ部分がある。'},
 {id:'Gem',star:'ふたご座',flower:'ラベンダー',english:'Lavender',description:'小さな紫色の花は筒状で、奥には蜜がある。花にも葉にも香りのもとが含まれていて、そっと触れると独特の香りが立つ。'},
 {id:'Cnc',star:'かに座',flower:'白いバラ',english:'White Rose',description:'何枚も重なる白い花びらの奥には、おしべとめしべがある。花びらの多い品種では、おしべの一部が花びらのような形に変わることもある。'},
 {id:'Leo',star:'しし座',flower:'ヒマワリ',english:'Sunflower',description:'一輪の大きな花に見えるが、暗い中心には小さな花がぎっしり集まっている。周囲の黄色い花びらのような部分も、実は別の小さな花だ。'},
 {id:'Vir',star:'おとめ座',flower:'キク',english:'Chrysanthemum',description:'細い花びらが中心から何層にも重なる花。ここでは、黄色い花をつけた園芸のキクを描いている。'},
 {id:'Lib',star:'てんびん座',flower:'バラ',english:'Rose',description:'花びらが中心を包むように幾重にも重なる。ここでは赤いバラを描いている。'},
 {id:'Sco',star:'さそり座',flower:'ゼラニウム',english:'Geranium',description:'小さな花が集まって咲く。ここでは、丸みのある葉を持つ園芸のゼラニウムを描いている。'},
 {id:'Sgr',star:'いて座',flower:'カーネーション',english:'Carnation',description:'花びらの縁が細かく波打ち、重なり合う花。細い葉と、すらりとした茎を持つ。'},
 {id:'Cap',star:'やぎ座',flower:'パンジー',english:'Pansy',description:'五枚の花びらに、顔のような模様が見える。ここでは、紫と黄色の花を描いている。'},
 {id:'Aqr',star:'みずがめ座',flower:'ラン',english:'Orchid',description:'種類によって、さまざまな姿を見せる花。ここでは、白と淡いピンクのコチョウランを描いている。'},
 {id:'Psc',star:'うお座',flower:'スイレン',english:'Water Lily',description:'水面に浮かぶ丸い葉の間で、花が開く。葉の切れ込みと、重なり合う花びらが特徴。'}
];
function r4FlowerSprite(index){return `<span class="r4-flower-sprite" role="img" aria-label="${R4_FLOWERS[index].flower}のイラスト" style="background-position:${(index%4)*100/3}% ${Math.floor(index/4)*50}%"></span>`}
function r4FlowerBoard(){return `<div class="r4-flower-board" aria-hidden="true">${R4_FLOWERS.map((_,i)=>`<i>${r4FlowerSprite(i)}</i>`).join('')}</div>`}
function r4OpenFlowerExhibit(){
 if(game.querySelector('.r4-flower-overlay'))return;
 const overlay=document.createElement('div');overlay.className='device-overlay r4-zodiac-overlay r4-flower-overlay';
 overlay.innerHTML=`<section class="r4-zodiac-exhibit r4-flower-exhibit" aria-label="12星座の花の展示"><header><h2>12星座の花</h2><button class="device-close" aria-label="展示を閉じる">戻る</button></header><div class="r4-zodiac-list"><div class="r4-zodiac-grid">${R4_FLOWERS.map((e,i)=>`<button class="r4-zodiac-card r4-flower-card" data-flower="${i}" aria-label="${e.star}の花、${e.flower}を読む"><span class="r4-flower-illustration">${r4FlowerSprite(i)}</span><strong>${e.star}</strong><small>${e.flower}</small></button>`).join('')}</div></div><div class="r4-zodiac-detail" hidden><div class="r4-zodiac-large r4-flower-large"></div><div class="r4-zodiac-copy"><p class="r4-zodiac-latin"></p><h3></h3><p class="r4-flower-english"></p><p class="r4-zodiac-description"></p><button class="r4-zodiac-back">花の一覧へ</button></div></div><footer><details><summary>出典</summary><p>星座と花の対応は<a href="https://www.interflora.co.uk/blog/flower-guides/zodiac-flowers" target="_blank" rel="noopener noreferrer">Interflora「Zodiac Flowers」</a>の紹介例に基づいています。月・日別の誕生花とは別の対応で、公的な統一規格ではありません。花の絵は描き起こしたイラストです。</p></details></footer></section>`;
 game.appendChild(overlay);
 const list=overlay.querySelector('.r4-zodiac-list'),detail=overlay.querySelector('.r4-zodiac-detail'),back=overlay.querySelector('.r4-zodiac-back');let selected=null;
 activateDeviceModal(overlay,'r4Flowers',overlay.querySelector('.device-close'));
 for(const button of overlay.querySelectorAll('[data-flower]'))button.onclick=()=>{
  const index=+button.dataset.flower,entry=R4_FLOWERS[index];selected=button;
  overlay.querySelector('.r4-flower-large').innerHTML=r4FlowerSprite(index);
  overlay.querySelector('.r4-zodiac-latin').textContent=entry.star;
  overlay.querySelector('h3').textContent=entry.flower;
  overlay.querySelector('.r4-flower-english').textContent=entry.english;
  overlay.querySelector('.r4-zodiac-description').textContent=entry.description;
  list.hidden=true;detail.hidden=false;back.focus({preventScroll:true});
 };
 back.onclick=()=>{detail.hidden=true;list.hidden=false;selected?.focus({preventScroll:true})};
}
