<script lang="ts">
  import { getBookLabel, type Lang } from './bookTypes'

  let { lang = 'de' }: { lang?: Lang } = $props()
</script>

<footer class="mt-10 border-t border-[#c8d6e5] pt-4 text-xs leading-relaxed text-[#5a7a99] space-y-1">
  <p>{getBookLabel(lang, 'attributionSource')}</p>
  <p class="font-semibold text-[#0f2744]">{getBookLabel(lang, 'notBinding')}</p>
  <p>{getBookLabel(lang, 'attributionBam')}</p>
</footer>
