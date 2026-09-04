<script module lang="ts">
  export const LOCK_MESSAGE
    = 'Dein Konto ist noch nicht freigeschaltet. Du kannst die Demo mit UN 1203 ausprobieren; echte Regelwerksdaten werden nach der Freischaltung verfügbar.'
</script>

<div role="status" class="rounded-xl border border-amber-300 bg-amber-50 px-5 py-4 text-sm text-amber-900 flex items-start gap-3">
  <span class="text-lg leading-none" aria-hidden="true">🔒</span>
  <span>{LOCK_MESSAGE}</span>
</div>
