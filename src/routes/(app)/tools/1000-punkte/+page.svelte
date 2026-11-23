<script lang="ts">
  import PointsCalculator from '$lib/points/PointsCalculator.svelte'

  let { data } = $props()
</script>

<svelte:head>
  <title>1000-Punkte-Rechner – gefahrgut.org</title>
</svelte:head>

<div class="max-w-3xl mx-auto px-4 py-6 sm:py-10 print:max-w-none print:p-0">
  <div class="print:hidden">
    <h1 class="text-2xl font-bold text-[#0f2744] mb-1">1000-Punkte-Rechner</h1>
    <p class="text-sm text-[#5a7a99] mb-6">
      Prüfe für eine Beförderungseinheit, ob die Freistellung nach ADR 1.1.3.6 greift: UN-Nummer und Menge je Position eintragen,
      Punkte und Ergebnis erscheinen sofort.
    </p>
  </div>

  {#if data.locked}
    <div class="rounded-xl border border-[#c8d6e5] bg-white p-5 text-[#0f2744]" data-testid="points-locked">
      <h2 class="font-semibold mb-2">Der Rechner wird mit der Freischaltung verfügbar</h2>
      <p class="text-sm">
        Sobald dein Konto freigeschaltet ist, berechnest du hier die Punkte einer gemischten Ladung nach 1.1.3.6 –
        mit Beförderungskategorie und Faktor aus den BAM-Daten für jede UN-Nummer, dem Ergebnis, den Pflichten, die
        trotzdem gelten, und einem Ausdruck für die Akte.
      </p>
    </div>
  {:else}
    <PointsCalculator linkedSections={data.linkedSections} />
  {/if}
</div>
