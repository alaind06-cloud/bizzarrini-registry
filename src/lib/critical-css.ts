/**
 * CSS critique above-the-fold, inliné dans le <head>.
 * Volontairement minimal : tokens de couleur, typographie, nav et hero.
 * La feuille complète (styles.css) est chargée de façon asynchrone.
 */
export const CRITICAL_CSS = `
:root{--bg:#f2eee6;--fg:#232323;--muted:#6b6257;--brand:#9e2b25;--border:#ddd4c6}
*,*::before,*::after{box-sizing:border-box}
html{-webkit-text-size-adjust:100%}
html,body{margin:0;padding:0;background:var(--bg);color:var(--fg);
font-family:Inter,ui-sans-serif,system-ui,-apple-system,sans-serif;line-height:1.5}
img,video,svg{max-width:100%;display:block}
a{color:inherit;text-decoration:none}
h1,h2,h3{margin:0;font-family:"Bodoni Moda",Georgia,serif;font-weight:400;line-height:1.05}
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
section:first-of-type{min-height:92vh}
`;
