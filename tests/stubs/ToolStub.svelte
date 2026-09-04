<script lang="ts">
  let { unNumber, demo = false, initialData }: { unNumber?: string, demo?: boolean, initialData?: unknown } = $props()
</script>

<div data-testid="tool-stub" data-demo={demo} data-has-initial={initialData != null}>TOOL:{demo && !unNumber ? '1203' : unNumber}</div>
