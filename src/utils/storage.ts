/**
 * The one place this app talks to browser storage.
 *
 * Nothing else should reach for `sessionStorage`, `localStorage` or
 * `document.cookie`. Three reasons it is worth centralising rather than calling
 * the globals where they are needed:
 *
 *   1. **Every access can fail.** Private windows, storage disabled, and a full
 *      quota all throw — from the *getter itself*, not just from `setItem`. A
 *      screen that forgets one `try` is a screen that white-screens for one user
 *      in a browser nobody tested. Here it is guarded once, and a store that
 *      cannot be reached falls back to memory so the page still works for the
 *      rest of its life.
 *   2. **What comes back is untrusted.** It was written by an older build, or
 *      hand-edited in devtools. Every value goes through a validator on the way
 *      out, so a caller gets `T` or `null` and never a half-shape that throws
 *      three components later.
 *   3. **Keys collide.** Everything written here is namespaced, so a key is
 *      identifiable as ours and `family.ids()` can enumerate one group of them
 *      without walking the whole origin.
 *
 * To add another backing store — cookies, IndexedDB — write a `StorageDriver`
 * and export an accessor factory beside `sessionValue` / `localValue`. Nothing
 * above this file changes.
 */

/** Everything we write is prefixed, so our keys are ours. */
const NAMESPACE = 'sho'

const namespaced = (key: string) => `${NAMESPACE}:${key}`

/**
 * Turns whatever was stored into `T`, or `null` when it is not `T`. Returning
 * null is how a caller says "this is not mine or not current" — the value is
 * then dropped rather than repaired, because a guess at a stale shape is worse
 * than starting again.
 */
export type Validator<T> = (raw: unknown) => T | null

/** A backing store. Add cookies by writing one of these. */
export interface StorageDriver {
  readonly name: string
  get(key: string): string | null
  set(key: string, value: string): void
  remove(key: string): void
  /** Our keys only, namespace already stripped. */
  keys(): string[]
}

/**
 * Where values go when the real store is unreachable. It lasts as long as the
 * page, which is less than session storage promises and more than nothing: a
 * draft still survives a route change, just not a reload.
 */
function memoryDriver(name: string): StorageDriver {
  const map = new Map<string, string>()
  return {
    name: `${name} (memory)`,
    get: (key) => map.get(key) ?? null,
    set: (key, value) => void map.set(key, value),
    remove: (key) => void map.delete(key),
    keys: () =>
      [...map.keys()]
        .filter((key) => key.startsWith(`${NAMESPACE}:`))
        .map((key) => key.slice(NAMESPACE.length + 1)),
  }
}

/**
 * A `Storage`-backed driver, or a memory one if the store cannot be touched.
 * The probe is a real write: `window.sessionStorage` exists in a Safari private
 * window and throws on use, so reading the property proves nothing.
 */
function webStorageDriver(name: string, pick: () => Storage): StorageDriver {
  let store: Storage
  try {
    store = pick()
    const probe = namespaced('__probe')
    store.setItem(probe, '1')
    store.removeItem(probe)
  } catch {
    return memoryDriver(name)
  }

  return {
    name,
    get: (key) => {
      try {
        return store.getItem(key)
      } catch {
        return null
      }
    },
    set: (key, value) => {
      try {
        store.setItem(key, value)
      } catch {
        // Out of quota. The value is lost, which is what "a convenience" means.
      }
    },
    remove: (key) => {
      try {
        store.removeItem(key)
      } catch {
        // Nothing to do; the caller's in-memory state is the truth it reads.
      }
    },
    keys: () => {
      try {
        const found: string[] = []
        for (let i = 0; i < store.length; i++) {
          const key = store.key(i)
          if (key?.startsWith(`${NAMESPACE}:`)) found.push(key.slice(NAMESPACE.length + 1))
        }
        return found
      } catch {
        return []
      }
    },
  }
}

/** Resolved once, so the probe write happens once rather than per access. */
let sessionDriverCache: StorageDriver | undefined
let localDriverCache: StorageDriver | undefined

const sessionDriver = () =>
  (sessionDriverCache ??= webStorageDriver('session', () => window.sessionStorage))

const localDriver = () => (localDriverCache ??= webStorageDriver('local', () => window.localStorage))

// --- accessors --------------------------------------------------------------

/** One value at one key. */
export interface StoredValue<T> {
  read(): T | null
  /** Reads, or the fallback when there is nothing valid stored. */
  readOr(fallback: T): T
  write(value: T): void
  clear(): void
}

/**
 * A group of values under one prefix, keyed by an id — an unsaved draft per
 * item. `ids` and `clearAll` are what make "does anything have unsaved work?"
 * answerable without the caller knowing how keys are spelled.
 */
export interface StoredFamily<T> {
  read(id: string | number): T | null
  write(id: string | number, value: T): void
  clear(id: string | number): void
  clearAll(): void
  ids(): string[]
}

/**
 * JSON is the wire format for everything here, including plain strings — one
 * encoding means `read` can tell "nothing stored" from "the empty string" and
 * the validator always sees a real value.
 *
 * `CORRUPT` is its own answer rather than `undefined`, because "there is nothing
 * there" and "there is something there that is not JSON" want opposite
 * treatment: the first is left alone, the second is thrown away.
 */
const CORRUPT = Symbol('corrupt')

function decode(raw: string): unknown | typeof CORRUPT {
  try {
    return JSON.parse(raw)
  } catch {
    return CORRUPT
  }
}

function value<T>(driver: () => StorageDriver, key: string, validate: Validator<T>): StoredValue<T> {
  const full = namespaced(key)

  const read = () => {
    const stored = driver().get(full)
    if (stored === null) return null

    const raw = decode(stored)
    const checked = raw === CORRUPT ? null : validate(raw)

    // Junk and shapes we no longer understand go the same way: dropped, rather
    // than left to be re-read and re-rejected on every mount.
    if (checked === null) driver().remove(full)
    return checked
  }

  return {
    read,
    readOr: (fallback) => read() ?? fallback,
    write: (v) => driver().set(full, JSON.stringify(v)),
    clear: () => driver().remove(full),
  }
}

function family<T>(
  driver: () => StorageDriver,
  prefix: string,
  validate: Validator<T>,
): StoredFamily<T> {
  const keyFor = (id: string | number) => `${prefix}:${id}`

  return {
    read: (id) => value(driver, keyFor(id), validate).read(),
    write: (id, v) => value(driver, keyFor(id), validate).write(v),
    clear: (id) => value(driver, keyFor(id), validate).clear(),
    ids: () =>
      driver()
        .keys()
        .filter((key) => key.startsWith(`${prefix}:`))
        .map((key) => key.slice(prefix.length + 1)),
    clearAll: () => {
      for (const key of driver().keys()) {
        if (key.startsWith(`${prefix}:`)) driver().remove(namespaced(key))
      }
    },
  }
}

/** A value for the tab's lifetime. The default for anything half-finished. */
export const sessionValue = <T>(key: string, validate: Validator<T>) =>
  value(sessionDriver, key, validate)

/** A group of session values under one prefix. */
export const sessionFamily = <T>(prefix: string, validate: Validator<T>) =>
  family(sessionDriver, prefix, validate)

/**
 * A value that outlives the tab. Only for a setting he would be annoyed to set
 * twice — never for unsaved work, which goes stale against figures that move.
 */
export const localValue = <T>(key: string, validate: Validator<T>) =>
  value(localDriver, key, validate)

export const localFamily = <T>(prefix: string, validate: Validator<T>) =>
  family(localDriver, prefix, validate)

// --- validators -------------------------------------------------------------

/** The common ones, so a caller writes a shape check rather than a type guard. */
export const isString: Validator<string> = (raw) => (typeof raw === 'string' ? raw : null)

export const isBoolean: Validator<boolean> = (raw) => (typeof raw === 'boolean' ? raw : null)

export const isFiniteNumber: Validator<number> = (raw) =>
  typeof raw === 'number' && Number.isFinite(raw) ? raw : null

/** A string from a known set — a filter slug, a sort column. */
export const isOneOf =
  <T extends string>(allowed: readonly T[]): Validator<T> =>
  (raw) =>
    typeof raw === 'string' && (allowed as readonly string[]).includes(raw) ? (raw as T) : null

export const isStringArray: Validator<string[]> = (raw) =>
  Array.isArray(raw) && raw.every((it) => typeof it === 'string') ? (raw as string[]) : null

/** For an object whose fields a caller checks itself. */
export const isRecord: Validator<Record<string, unknown>> = (raw) =>
  typeof raw === 'object' && raw !== null && !Array.isArray(raw)
    ? (raw as Record<string, unknown>)
    : null
