<style lang="less">
  header {
    a {
      position: relative;
      display: inline-block;

      p,
      span {
        padding: 5px 10px;
        text-align: center;
      }

      span {
        position: absolute;
        top: 0px;
        width: 100%;
        height: 100%;
        border-bottom: 2px solid transparent;
        transition: border-color 0.15s ease;
      }

      p {
        color: var(--background-color);
        background-color: var(--primary-color);
        clip-path: inset(0 100% 0 0);
        transition: clip-path 0.15s ease;
      }

      &.location {
        span {
          border-color: var(--secondary-color);
        }
      }

      &:hover {
        p {
          clip-path: inset(0 0 0 0);
        }
      }
    }
  }

  footer {
    a:not(footer > a) {
      display: flex;
      align-items: center;
      gap: 0.25rem;

      padding: 0.5rem 0.75rem;

      font-size: 0.875rem;
      font-weight: bold;
      white-space: nowrap;

      transition:
        color 0.15s ease-in-out,
        background-color 0.15s ease-in-out;

      &:hover {
        color: var(--background-color);
        background-color: var(--primary-color);
      }
    }
  }

  /* 移动端：仅 3 个入口 */
  @media screen and (max-width: 640px) {
    nav {
      header {
        a {
          display: flex;
          gap: 0.5rem;

          span,
          p {
            padding: 0px;
          }

          span {
            position: static;
            width: auto;

            display: inline-flex;
            align-items: center;

            border-bottom: none;
            color: var(--primary-color);
          }

          p {
            white-space: nowrap;

            clip-path: none;
            color: var(--primary-color);
            background-color: var(--background-color);
          }

          &.location {
            font-weight: bold;
          }
        }
      }

      footer {
        a:not(footer > a) {
          padding: 0.25rem 0rem;
          font-weight: normal;
        }
      }
    }
  }
</style>

<!-- svelte-ignore a11y_interactive_supports_focus -->
<!-- svelte-ignore a11y_click_events_have_key_events -->
<div
  role="button"
  onclick={() => (menu = false)}
  class:pointer-events-none={!menu}
  class:bg-transparent={!menu}
  class="fixed top-0 left-0 w-screen h-screen pointer-events-auto bg-#aaaaaa88 transition-background-color sm:hidden"></div>

<nav
  bind:this={navigator}
  class:transform-translate-x-full={!menu}
  class="fixed top-0 right-0 flex flex-col justify-between items-start gap-5 p-5 bg-background h-full sm:contents overflow-hidden transition-transform">
  <!-- 仅 3 个入口：Home / Jotting / About -->
  <header class="grid gap-5 c-secondary grid-rows-[repeat(3,1fr)] sm:(grid-rows-none grid-cols-[repeat(3,1fr)])">
    <button onclick={() => (menu = false)} class="sm:hidden">{@render close()}</button>

    <a href="/" class:location={route === "/" || route.startsWith("/preface") }>
      <span>{@render home()}</span>
      <p>Home</p>
    </a>

    <a href="/jotting" class:location={route.startsWith("/jotting") }>
      <span>{@render jotting()}</span>
      <p>Jotting</p>
    </a>

    <a href="/about" class:location={route.startsWith("/about") }>
      <span>{@render about()}</span>
      <p>About</p>
    </a>
  </header>

  <footer class="flex flex-col gap-2 sm:gap-5 sm:(flex-row gap-7)">
    <!-- language switcher removed -->
  </footer>
</nav>

<button onclick={() => (menu = true)} class="sm:hidden">{@render bars()}</button>

<script lang="ts">
  import { onMount, type Snippet } from "svelte";
  import i18nit from "$i18n";

  let {
    route,
    home,
    /* note 保留为可选，哪怕外层仍传入，也不再使用 */
    note,
    jotting,
    about,
    bars,
    close
  }: {
    route: string;
    home: Snippet;
    note?: Snippet;
    jotting: Snippet;
    about: Snippet;
    bars: Snippet;
    close: Snippet;
  } = $props();

  const t = i18nit("en");

  // mobile 菜单
  let menu: boolean = $state(false);
  let navigator: HTMLElement | undefined = $state();

  // language-switcher removed; path derivation not needed

  onMount(() => {
    for (const link of navigator!.getElementsByTagName("a")) {
      link.addEventListener("click", () => (menu = false));
    }
    const update_route = () => (route = window.location.pathname);
    if (window.swup) {
      window.swup.hooks.on("page:load", update_route);
    } else {
      document.addEventListener("swup:enable", () =>
        window.swup?.hooks.on("page:load", update_route)
      );
    }
  });
</script>
