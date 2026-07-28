import { computed, ref } from 'vue'

export type WaitlistState = 'idle' | 'submitting' | 'success' | 'already' | 'rateLimited' | 'error'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

export function useWaitlist() {
  const name = ref('')
  const email = ref('')
  const consent = ref(false)
  const honeypot = ref('')
  const state = ref<WaitlistState>('idle')

  const canSubmit = computed(() =>
    name.value.trim().length >= 2
    && EMAIL_RE.test(email.value.trim().toLowerCase())
    && consent.value
    && state.value !== 'submitting',
  )

  async function submit(): Promise<void> {
    if (!canSubmit.value) return
    state.value = 'submitting'
    try {
      const res = await $fetch<{ status: string }>('/api/waitlist', {
        method: 'POST',
        body: {
          name: name.value.trim(),
          email: email.value.trim(),
          consent: consent.value,
          website: honeypot.value,
        },
      })
      state.value = res.status === 'already_registered' ? 'already' : 'success'
    }
    catch (err) {
      const status = (err as { statusCode?: number, status?: number })
      state.value = (status.statusCode ?? status.status) === 429 ? 'rateLimited' : 'error'
    }
  }

  return { name, email, consent, honeypot, state, canSubmit, submit }
}
