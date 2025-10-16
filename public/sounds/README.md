# Sons de Notificação

Coloque aqui seus arquivos de áudio para notificação.

- Arquivo sugerido pelo app: `notify.mp3`
- Caminho público: `/sounds/notify.mp3`
- Duração recomendada: 0.2s a 1.0s
- Tamanho: ideal < 100KB
- Formatos aceitos pelos navegadores modernos: `.mp3`, `.wav`, `.ogg`

Como usar no código (exemplo):

```js
const notifyAudio = new Audio('/sounds/notify.mp3');
notifyAudio.currentTime = 0;
notifyAudio.play().catch(()=>{});
```
