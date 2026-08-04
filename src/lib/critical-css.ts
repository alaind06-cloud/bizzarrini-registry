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
@font-face{font-family:"Mono Fallback";src:local("Menlo"),local("Consolas"),local("DejaVu Sans Mono"),local("Courier New");
size-adjust:100%;ascent-override:102%;descent-override:30%;line-gap-override:0%}

:root{--bg:#f2eee6;--fg:#232323;--muted:#6b6257;--brand:#9e2b25;--border:#ddd4c6;
--font-sans:"Inter","Inter Fallback",ui-sans-serif,system-ui,-apple-system,sans-serif;
--font-display:"Bodoni Moda","Bodoni Fallback",Georgia,serif}
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
section:first-of-type{min-height:92svh;display:flex;align-items:center}
/* Hero : mêmes métriques que la feuille complète pour éviter tout reflow
   au moment où styles.css est appliqué de façon asynchrone. */
section:first-of-type>.container-page{padding-top:6rem;padding-bottom:6rem}
@media (min-width:768px){section:first-of-type>.container-page{padding-top:8rem;padding-bottom:8rem}}
section:first-of-type h1{font-size:3rem;line-height:1.02;margin-top:2rem}
@media (min-width:640px){section:first-of-type h1{font-size:3.75rem}}
@media (min-width:768px){section:first-of-type h1{font-size:4.5rem}}
@media (min-width:1024px){section:first-of-type h1{font-size:6rem}}
section:first-of-type p{margin-top:2rem;margin-inline:auto;max-width:42rem;font-size:1rem;line-height:1.625}
@media (min-width:768px){section:first-of-type p{font-size:1.125rem}}
.vintage-badge{display:inline-flex;align-items:center;gap:.5rem;padding:.5rem 1rem;font-size:.7rem;
letter-spacing:.28em;text-transform:uppercase;border:1px solid rgba(158,43,37,.45);color:var(--brand)}
.section-divider{width:6rem;height:1px;margin-inline:auto}
`;

