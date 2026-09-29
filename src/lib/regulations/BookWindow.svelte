<script lang="ts">
  import type { RenderedWindow } from './bookTypes'

  let { window: bookWindow }: { window: RenderedWindow } = $props()
</script>

<!--
  {@html} is safe here ONLY because the HTML was sanitised on the server by
  src/lib/server/adrBook/render.ts (closed allowlist, asserted by its tests)
  before it left the process. Never pass anything else into this component.
-->
<section class="book-window" data-line-start={bookWindow.lineStart} data-line-end={bookWindow.lineEnd}>
  {@html bookWindow.html}
</section>
