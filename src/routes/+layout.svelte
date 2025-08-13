<script lang="ts">
  import "../app.css";
  import Container from "$lib/components/container.svelte";
  import { onMount } from "svelte";
  import { goto } from "$app/navigation";

  const LOCAL_STORAGE_TICKET_KEY = "acp_ticket";

  onMount(() => {
    try {
      const url = new URL(window.location.href);
      const urlTicket = url.searchParams.get("ticket");

      // If a ticket is present in the URL, persist it immediately
      if (urlTicket) {
        localStorage.setItem(LOCAL_STORAGE_TICKET_KEY, urlTicket);
        return; // nothing else to do
      }

      // Avoid loops while already on create or success pages
      const path = url.pathname;
      const isOnCreate = path.startsWith("/create");
      const isOnSuccess = path.startsWith("/success");
      if (isOnCreate || isOnSuccess) return;

      const storedTicket = localStorage.getItem(LOCAL_STORAGE_TICKET_KEY);
      if (!storedTicket) return;

      // Verify the stored ticket with the backend; redirect if valid
      fetch(`/api/ticket/${encodeURIComponent(storedTicket)}`)
        .then((res) => (res.ok ? res.json() : undefined))
        .then((data) => {
          if (data) {
            goto(`/create?ticket=${encodeURIComponent(storedTicket)}`);
          }
        })
        .catch(() => {
          // ignore network errors; keep ticket so it may work later
        });
    } catch (error) {
      console.error(error);
    }
  });
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
