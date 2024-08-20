<script lang="ts">
  import "../app.css";
  import Container from "$lib/components/container.svelte";
</script>

<svelte:head>
  <script
    async
    defer
    data-domain="create.anchor.link"
    src="https://stats.greymass.com/js/plausible.exclusions.js"
    data-exclude="/success/*, /activate/*"
  >
  </script>
  <title>Account Creation Portal</title>
</svelte:head>

<Container>
  <slot />
</Container>
