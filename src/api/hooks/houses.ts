import { computed, toValue, type MaybeRefOrGetter } from 'vue'
import { useQuery } from '@tanstack/vue-query'
import { fetchHouse, fetchInstalledCount, fetchRooms } from '@/api/houses'

/**
 * Three reads, three fates — the rule this project applies to every screen that
 * needs more than one thing.
 *
 * The Visit notes screen can lose its rooms and still be the screen he types
 * into; it can lose the installed count and still show the tab. What it may not
 * do is make a man standing in someone's compound wait for a count before he
 * can write down how to get back there. So they are three queries rather than
 * one, and the fields are never behind the rooms.
 */
export const houseKeys = {
  all: ['houses'] as const,
  detail: (id: number) => [...houseKeys.all, 'detail', id] as const,
  rooms: (id: number) => [...houseKeys.all, 'rooms', id] as const,
  installed: (id: number) => [...houseKeys.all, 'installed', id] as const,
}

export function useHouse(id: MaybeRefOrGetter<number>) {
  const houseId = computed(() => toValue(id))

  return useQuery({
    queryKey: computed(() => houseKeys.detail(houseId.value)),
    queryFn: ({ signal }) => fetchHouse(houseId.value, signal),
  })
}

/** The rooms in `sort_order`, archived ones left out. */
export function useHouseRooms(id: MaybeRefOrGetter<number>) {
  const houseId = computed(() => toValue(id))

  return useQuery({
    queryKey: computed(() => houseKeys.rooms(houseId.value)),
    queryFn: ({ signal }) => fetchRooms(houseId.value, signal),
  })
}

/**
 * How many devices are in the house. Its own query because it is the quietest
 * thing on the screen — a number in a tab — and the slowest to matter.
 */
export function useInstalledCount(id: MaybeRefOrGetter<number>) {
  const houseId = computed(() => toValue(id))

  return useQuery({
    queryKey: computed(() => houseKeys.installed(houseId.value)),
    queryFn: ({ signal }) => fetchInstalledCount(houseId.value, signal),
  })
}
