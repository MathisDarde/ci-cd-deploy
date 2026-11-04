<script setup lang="ts">
const { t, locale, locales, setLocale } = useI18n()
const localePath = useLocalePath()
const config = useRuntimeConfig()
const { items, notices, init, dismiss } = useWishlist()

// <html lang>, canonical and hreflang alternates for every language (SEO).
const i18nHead = useLocaleHead({ seo: true })
useHead(() => ({
  htmlAttrs: { lang: i18nHead.value.htmlAttrs?.lang },
  link: [...(i18nHead.value.link ?? [])],
  meta: [...(i18nHead.value.meta ?? [])],
  titleTemplate: (title?: string) =>
    title && !title.includes(t('app.name'))
      ? `${title} — ${t('app.name')}`
      : (title ?? t('app.name')),
}))
useSeoMeta({
  description: () => t('app.description'),
  ogSiteName: () => t('app.name'),
  ogType: 'website',
  twitterCard: 'summary_large_image',
})

onMounted(init)

function onLanguageChange(event: Event) {
  void setLocale((event.target as HTMLSelectElement).value as typeof locale.value)
}
</script>

<template>
  <NuxtRouteAnnouncer />
  <header class="site-header">
    <div class="site-header__inner">
      <NuxtLink :to="localePath('/')" class="logo">{{ t('app.name') }}</NuxtLink>
      <nav :aria-label="t('app.nav.label')" class="site-nav">
        <NuxtLink :to="localePath('/')" class="site-nav__link">{{ t('app.nav.catalog') }}</NuxtLink>
        <NuxtLink :to="localePath('/wishlist')" class="site-nav__link" data-testid="nav-wishlist">
          {{ t('app.nav.wishlist') }}
          <ClientOnly>
            <span class="site-nav__count" data-testid="wishlist-count">{{ items.length }}</span>
          </ClientOnly>
        </NuxtLink>
        <label class="lang">
          <span class="visually-hidden">{{ t('app.language') }}</span>
          <select :value="locale" data-testid="language-select" @change="onLanguageChange">
            <option v-for="entry in locales" :key="entry.code" :value="entry.code">
              {{ entry.name }}
            </option>
          </select>
        </label>
      </nav>
    </div>
  </header>

  <main class="site-main">
    <NuxtPage />
  </main>

  <div class="notices" aria-live="polite">
    <p
      v-for="notice in notices"
      :key="notice.id"
      class="notice"
      :class="`notice--${notice.kind}`"
      :role="notice.kind === 'error' ? 'alert' : 'status'"
      data-testid="notice"
    >
      <span>{{ notice.text }}</span>
      <button
        type="button"
        class="notice__close"
        :aria-label="t('app.dismiss')"
        @click="dismiss(notice.id)"
      >
        ×
      </button>
    </p>
  </div>

  <footer class="site-footer">
    {{ t('app.dataSource') }}
    <a href="https://pokeapi.co" target="_blank" rel="noopener">PokéAPI</a>.
    {{ t('app.trademark') }}
    <span class="site-footer__version">v{{ config.public.appVersion }}</span>
  </footer>
</template>

<style scoped>
.site-header {
  position: sticky;
  top: 0;
  z-index: 20;
  border-bottom: 1px solid var(--line);
  background: rgb(19 21 29 / 0.92);
  backdrop-filter: blur(10px);
}
.site-header__inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  max-width: var(--page-width);
  margin-inline: auto;
  padding: 0.75rem var(--gutter);
}
.logo {
  color: var(--accent);
  font-family: var(--font-display);
  font-size: 1.35rem;
  font-weight: 800;
  letter-spacing: -0.02em;
  text-decoration: none;
}
.site-nav {
  display: flex;
  gap: 0.25rem;
}
.site-nav__link {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.45rem 0.75rem;
  border-radius: 8px;
  color: var(--muted);
  font-weight: 600;
  text-decoration: none;
}
.site-nav__link:hover {
  color: var(--text);
}
.site-nav__link.router-link-exact-active {
  background: var(--surface-2);
  color: var(--text);
}
.site-nav__count {
  min-width: 1.4em;
  padding: 0 0.35em;
  border-radius: 99px;
  background: var(--accent);
  color: var(--accent-ink);
  font-size: 0.8rem;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  text-align: center;
}
.site-main {
  max-width: var(--page-width);
  min-height: 80vh;
  margin-inline: auto;
  padding: 1.75rem var(--gutter) 3rem;
}
.site-footer {
  padding: 1.5rem var(--gutter);
  border-top: 1px solid var(--line);
  color: var(--muted);
  font-size: 0.85rem;
  text-align: center;
}
.site-footer a {
  color: inherit;
}
.lang select {
  min-height: 36px;
  padding: 0.3rem 0.5rem;
  border: 1px solid var(--line);
  border-radius: 8px;
  background: var(--surface-2);
}
.notices {
  position: fixed;
  right: 1rem;
  bottom: 1rem;
  z-index: 50;
  display: grid;
  gap: 0.5rem;
  max-width: min(26rem, calc(100vw - 2rem));
}
.notice {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  margin: 0;
  padding: 0.75rem 0.9rem;
  border: 1px solid var(--line);
  border-left: 4px solid var(--accent);
  border-radius: 10px;
  background: var(--surface);
  box-shadow: 0 8px 24px rgb(0 0 0 / 0.45);
}
.notice--error {
  border-left-color: #ff6b6b;
}
.notice__close {
  padding: 0 0.25rem;
  border: 0;
  background: none;
  color: var(--muted);
  font-size: 1.3rem;
  line-height: 1;
  cursor: pointer;
}
.site-footer__version {
  margin-left: 0.5rem;
  font-variant-numeric: tabular-nums;
}
</style>
