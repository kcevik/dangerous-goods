<script lang="ts">
  import { page } from '$app/state'
  import { resolve } from '$app/paths'

  // 4xx messages come from our own code and are German; 5xx messages may carry
  // internal details (hosts, driver errors) and are never shown.
  const heading = $derived(
    page.status === 404
      ? 'Diese Seite gibt es nicht.'
      : page.status >= 500
        ? 'Da ist etwas schiefgelaufen.'
        : (page.error?.message ?? 'Die Anfrage konnte nicht bearbeitet werden.'),
  )
  const hint = $derived(
    page.status >= 500
      ? 'Bitte versuche es in einem Moment noch einmal. Wenn der Fehler bleibt, sind wir schon dran.'
      : 'Prüfe die Adresse oder geh zurück zur Startseite.',
  )
  const title = $derived(page.status === 404 ? 'Seite nicht gefunden' : 'Fehler')
</script>

<svelte:head>
  <title>{title} – gefahrgut.org</title>
  <meta name="robots" content="noindex" />
</svelte:head>

<div class="min-h-screen bg-[#e8eef5] flex items-center justify-center px-4">
  <div class="max-w-md w-full rounded-2xl bg-white border border-slate-200 p-8 text-center shadow-sm">
    <p class="font-mono text-sm font-bold text-orange-500 mb-2">{page.status}</p>
    <h1 class="text-xl font-bold mb-3" style="color: #0f2744;">{heading}</h1>
    <p class="text-sm text-slate-500 mb-6">{hint}</p>
    <a
      href={resolve('/')}
      class="inline-flex items-center justify-center px-5 py-2.5 rounded-xl text-sm font-semibold text-white"
      style="background: #f97316;"
    >Zur Startseite</a>
  </div>
</div>
