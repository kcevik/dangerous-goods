<script lang="ts">
  import { FAQ_ITEMS } from './faq'
</script>

<section id="faq" class="py-20 lg:py-28 bg-white" aria-labelledby="faq-heading">
  <div class="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
    <div class="text-center mb-12">
      <div class="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold mb-4 border" style="color: #15779b; background: rgba(21,119,155,0.08); border-color: rgba(21,119,155,0.2);">
        FAQ
      </div>
      <h2 id="faq-heading" class="text-3xl sm:text-4xl font-bold" style="color: #0f2744;">
        Häufige Fragen
      </h2>
    </div>

    <div class="flex flex-col gap-3">
      {#each FAQ_ITEMS as item (item.question)}
        <details class="group rounded-xl border border-slate-200 bg-white open:shadow-md transition-shadow">
          <summary class="flex items-center justify-between gap-4 px-5 py-4 cursor-pointer select-none text-sm font-semibold list-none [&::-webkit-details-marker]:hidden" style="color: #0f2744;">
            {item.question}
            <span class="text-slate-400 transition-transform duration-200 group-open:rotate-180" aria-hidden="true">▾</span>
          </summary>
          <p class="px-5 pb-5 text-sm leading-relaxed text-slate-600">{item.answer}</p>
        </details>
      {/each}
    </div>
  </div>
</section>
