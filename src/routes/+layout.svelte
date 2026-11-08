<script lang="ts">
  import { invalidate } from '$app/navigation'
  import { onMount } from 'svelte'
  import '../app.css'

  let { data, children } = $props()

  // Re-run loads when the client-side session changes (login, logout, refresh)
  onMount(() => {
    const { data: { subscription } } = data.supabase.auth.onAuthStateChange((_event, newSession) => {
      if (newSession?.expires_at !== data.session?.expires_at) {
        invalidate('supabase:auth')
      }
    })
    return () => subscription.unsubscribe()
  })
</script>

{@render children()}
