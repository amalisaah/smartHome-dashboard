<script setup lang="ts" generic="T extends string">
defineProps<{
  modelValue: T
  options: { label: string; value: T }[]
  /**
   * `track` is a padded rail with a lifted tile riding in it — two or three
   * options, where the choice is a view of the same thing.
   *
   * `joined` is one box ruled into equal columns, the selection filled in `--fg`:
   * a fixed set of values where the choice is a fact about the record, not a view
   * of it. It stretches to its container, so four segments share a 390px screen.
   * Not a second look at the same control — the track's lifted tile says "showing
   * this one", and a filled column says "it is this one".
   */
  variant?: 'track' | 'joined'
  /**
   * On `track`, `lg` is the allocation-basis door: taller, and the selection
   * weighs 600. On `joined` the two sizes are the two devices, as everywhere
   * else in this system — `md` the laptop's 40px row, `lg` the 48px phone door.
   */
  size?: 'md' | 'lg'
  disabled?: boolean
}>()

defineEmits<{
  'update:modelValue': [value: T]
}>()
</script>

<template>
  <div
    class="s-seg"
    :class="[`s-seg--${size ?? 'md'}`, `s-seg--${variant ?? 'track'}`]"
    role="tablist"
  >
    <button
      v-for="opt in options"
      :key="opt.value"
      role="tab"
      :aria-selected="modelValue === opt.value"
      :disabled="disabled"
      class="s-seg-option"
      :class="{ 's-seg-option--active': modelValue === opt.value }"
      @click="$emit('update:modelValue', opt.value)"
    >
      {{ opt.label }}
    </button>
  </div>
</template>

<style scoped>
.s-seg {
  display: inline-flex;
  background: var(--color-surface);
  border: 1px solid var(--color-line);
  border-radius: var(--radius-card);
  padding: 3px;
  gap: 2px;
}

/* The taller door. No gap between the segments: the track is one object, and
   the selection is a tile inside it. */
.s-seg--track.s-seg--lg {
  border-radius: var(--radius-md);
  gap: 0;
}

.s-seg-option {
  flex: 1;
  height: 32px;
  padding: 0 14px;
  font-family: var(--font-sans);
  font-size: 13px;
  font-weight: 500;
  color: var(--color-fg-2);
  background: transparent;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  /* The selection settles rather than sliding: background and shadow move,
     the tile does not travel. */
  transition: background-color 150ms ease-out, box-shadow 150ms ease-out,
    color 120ms ease-out;
  white-space: nowrap;
}

.s-seg--track.s-seg--lg .s-seg-option {
  height: auto;
  padding: 9px 14px;
  border-radius: var(--radius-chip);
  color: var(--color-fg-2-soft);
}

.s-seg-option:focus-visible {
  outline: 2px solid var(--color-action);
  outline-offset: -1px;
}

/* Hovering an unselected segment brings its label up to full ink; the tile
   itself stays put until it is the selection. */
.s-seg-option:not(.s-seg-option--active):not(:disabled):hover {
  color: var(--color-fg);
}

.s-seg-option:disabled {
  cursor: default;
}

.s-seg-option--active {
  background: var(--color-bg);
  color: var(--color-fg);
  box-shadow: var(--shadow-elev-1);
}

.s-seg--track.s-seg--lg .s-seg-option--active {
  font-weight: 600;
  color: var(--color-fg);
  box-shadow: var(--shadow-elev-0);
}

/* === joined === */

/* One box ruled into equal columns, not a rail with a tile in it: no padding,
   no gap, and the segments divide the width between them however many there
   are. `grid` rather than `flex`, so four labels of different lengths still
   take exactly a quarter each. */
.s-seg--joined {
  display: grid;
  grid-auto-flow: column;
  grid-auto-columns: minmax(0, 1fr);
  gap: 0;
  padding: 0;
  background: var(--color-bg);
  border-radius: var(--radius-md);
  /* Rounds the first and last segments' fills against the frame's own border. */
  overflow: hidden;
}

.s-seg--joined .s-seg-option {
  height: auto;
  padding: 0 8px;
  border-radius: 0;
  background: var(--color-bg);
  color: var(--color-fg-2);
  /* The rule between columns. The selection carries none, so its fill runs to
     the edge of its own column rather than stopping a pixel short. */
  border-left: 1px solid var(--color-divider);
  /* A fill is not a tile that settles, so it takes the ordinary press timing. */
  transition: background-color 120ms ease-out, color 120ms ease-out;
}

.s-seg--joined.s-seg--md .s-seg-option {
  min-height: 40px;
  font-size: 13px;
}

/* The phone door. */
.s-seg--joined.s-seg--lg .s-seg-option {
  min-height: var(--hit-min);
  font-size: 14px;
}

/* On a joined control the label alone is too quiet an answer to a reach — the
   segments are columns in one box, so the column itself lights. */
.s-seg--joined .s-seg-option:not(.s-seg-option--active):not(:disabled):hover {
  background: var(--color-surface);
  color: var(--color-fg);
}

.s-seg--joined .s-seg-option:focus-visible {
  outline-offset: -2px;
}

/* It is this one. A fill rather than a lift: the value is a fact about the
   record, and the control is where the record says it. */
.s-seg--joined .s-seg-option--active,
.s-seg--joined.s-seg--md .s-seg-option--active,
.s-seg--joined.s-seg--lg .s-seg-option--active {
  background: var(--color-fg);
  color: var(--color-bg);
  font-weight: 600;
  border-left-color: transparent;
  box-shadow: none;
}
</style>
