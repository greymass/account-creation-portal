<script lang="ts">
  import "../app.css";
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

<div class="container mx-auto p-4 max-w-md">
  <slot />
</div>
