<!-- src/layouts/header/ThemeSwitcher.svelte -->
{#if toggleEnabled}
  <!-- 同时有 sun 与 moon 槽：启用切换按钮 -->
  <button class="items-center" aria-label="Toggle dark theme" onclick={trigger_dark}>
    {#if dark}
      {@render moon()}
    {:else}
      {@render sun()}
    {/if}
  </button>
{:else if hasMoon}
  <!-- 只有 moon 槽：静态显示月亮图标，不可点击 -->
  <span class="items-center" aria-hidden="true">
    {@render moon()}
  </span>
{/if}

<script lang="ts">
  import { onMount } from "svelte";

  // 允许 sun/moon 槽为可选；缺省为 undefined，避免 “is not a function”
  let { sun = undefined, moon = undefined, dark = $bindable(false) } = $props();

  const hasSun = typeof sun === "function";
  const hasMoon = typeof moon === "function";
  const toggleEnabled = hasSun && hasMoon;

  /** 应用主题并持久化 */
  function turn_dark(on: boolean) {
    let theme = (dark = on) ? "dark" : "light";
    document.documentElement.dataset.theme = theme;
    localStorage.setItem("theme", theme);
  }

  /** 点击触发切换（仅在 toggleEnabled=true 时使用） */
  function trigger_dark(event: MouseEvent) {
    if (!toggleEnabled) return;
    const trigger = () => turn_dark(!dark);

    let transition;
    if (!(transition = document.startViewTransition?.(trigger))) return trigger();

    const x = event.clientX;
    const y = event.clientY;
    transition.ready.then(() => {
      const path = [`circle(0% at ${x}px ${y}px)`, `circle(130% at ${x}px ${y}px)`];
      document.documentElement.animate(
        { clipPath: dark ? [...path].reverse() : path },
        {
          duration: 400,
          easing: "ease-in",
          fill: "forwards",
          pseudoElement: dark ? "::view-transition-old(root)" : "::view-transition-new(root)"
        }
      );
    });
  }

  onMount(() => {
    const mode = window.matchMedia("(prefers-color-scheme: dark)");
    const theme = localStorage.getItem("theme");
    turn_dark(theme ? theme == "dark" : mode.matches);
    mode.addEventListener("change", ({ matches }) => turn_dark(matches));
  });
</script>

<style>
/* 可留空或写按钮的极简样式；不要出现 header/nav 的选择器 */
</style>
