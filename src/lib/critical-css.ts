/**
 * CSS critique above-the-fold, inliné dans le <head>.
 * Volontairement minimal : tokens de couleur, typographie, nav et hero.
 * La feuille complète (styles.css) est chargée de façon asynchrone.
 *
 * Les @font-face de repli à métriques ajustées sont déclarées ici pour que le
 * premier rendu occupe déjà exactement la place de la police finale (CLS ~ 0).
 */
export const CRITICAL_CSS = `
@font-face{font-family:"Bodoni Fallback";src:local("Georgia"),local("Times New Roman"),local("Times");
size-adjust:94%;ascent-override:107%;descent-override:30.4%;line-gap-override:0%}
@font-face{font-family:"Inter Fallback";src:local("Arial"),local("Helvetica"),local("Liberation Sans");
size-adjust:107.4%;ascent-override:90.2%;descent-override:22.48%;line-gap-override:0%}
@font-face{font-family:"Mono Fallback";src:local("Menlo"),local("Consolas"),local("DejaVu Sans Mono"),local("Liberation Mono"),local("Courier New");
size-adjust:100%;ascent-override:102%;descent-override:30%;line-gap-override:0%}
:root{--bg:#f2eee6;--fg:#232323;--muted:#6b6257;--brand:#9e2b25;--border:#ddd4c6;
--font-sans:"Inter","Inter Fallback",ui-sans-serif,system-ui,-apple-system,sans-serif;
--font-display:"Bodoni Moda","Bodoni Fallback",Georgia,serif;
--font-mono:"JetBrains Mono","Mono Fallback",ui-monospace,"SFMono-Regular",Menlo,monospace}
*,*::before,*::after{box-sizing:border-box}
html{-webkit-text-size-adjust:100%}
html,body{margin:0;padding:0;background:var(--bg);color:var(--fg);
font-family:var(--font-sans);line-height:1.5}
img,video,svg{max-width:100%;display:block}
a{color:inherit;text-decoration:none}
h1,h2,h3{margin:0;font-family:var(--font-display);font-weight:500;letter-spacing:-0.015em;line-height:1.02}
p{margin:0}
main{display:block}
.min-h-screen{min-height:100vh}
.flex{display:flex}
.flex-col{flex-direction:column}
.flex-1{flex:1 1 0%}
.items-center{align-items:center}
.justify-center{justify-content:center}
.text-center{text-align:center}
.relative{position:relative}
.absolute{position:absolute}
.inset-0{inset:0}
.overflow-hidden{overflow:hidden}
.container-page{width:100%;max-width:1280px;margin-inline:auto;padding-inline:1.25rem}
header,nav{background:var(--bg)}
/* Hero d'accueil : rendu final dès le premier paint, sans attendre styles.css */
.home-hero{min-height:92svh;position:relative;display:flex;align-items:center;
overflow:hidden;background:var(--bg);border-bottom:1px solid var(--border)}
.home-hero>div:first-child{position:absolute;inset:0}
.home-hero>div:first-child>img{position:absolute;inset:0;width:100%;height:100%;
object-fit:cover;object-position:64% 32%;opacity:.6;filter:saturate(.85)}
@media (min-width:640px){.home-hero>div:first-child>img{object-position:60% 38%}}
@media (min-width:768px){.home-hero>div:first-child>img{object-position:50% 50%}}
.home-hero>div:first-child>div{position:absolute;inset:0}
.home-hero>div:first-child>div:nth-of-type(1){background:linear-gradient(to bottom,
rgba(242,238,230,.55),rgba(242,238,230,.45),rgba(242,238,230,.95))}
.home-hero>div:first-child>div:nth-of-type(2){background:linear-gradient(to right,
rgba(242,238,230,.6),rgba(242,238,230,.25),rgba(242,238,230,.6))}
.home-hero>div:first-child>div:nth-of-type(3){background:radial-gradient(ellipse at center,
transparent 0%,transparent 45%,var(--bg) 100%)}
.home-hero>div:first-child>div:nth-of-type(4){background:none}
.home-hero>div:last-child{position:relative;width:100%;max-width:1280px;margin-inline:auto;
padding:6rem 1.25rem;text-align:center}
.home-hero h1{font-size:3rem;line-height:1.02;margin-top:2rem}
@media (min-width:640px){.home-hero h1{font-size:3.75rem}}
@media (min-width:768px){.home-hero h1{font-size:4.5rem}
.home-hero>div:last-child{padding-block:8rem}}
@media (min-width:1024px){.home-hero h1{font-size:6rem}}
code,kbd,samp,pre,.font-mono{font-family:var(--font-mono)}
.chassis-plaque{display:inline-flex;align-items:center;gap:0.4rem;font-family:var(--font-mono);
font-size:0.72rem;line-height:1.2;letter-spacing:0.14em;text-transform:uppercase;
border:1px solid var(--border);padding:0.3rem 0.65rem;border-radius:2px}
`;
