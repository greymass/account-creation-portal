<script lang="ts">
  import { goto } from "$app/navigation";
  import { PUBLIC_WHALESPLAINER_URL } from "$env/static/public";
  import type { Ticket } from "$lib/types";
  import { onMount } from "svelte";
  import { writable, type Writable } from "svelte/store";

  let error: Writable<Error | undefined> = writable(undefined);
  let timer: NodeJS.Timeout | undefined;

  interface PageData {
    ticketData: Ticket;
    ticket: string;
    searchParams: URLSearchParams;
  }

  export let data: PageData;

  let ticket: string = data.ticket;
  let ticketData: Ticket | undefined = data.ticketData;
  let searchParams = new URLSearchParams(data.searchParams);

  function loadticket(): Promise<Ticket | undefined> {
    return fetch(`/api/ticket/${ticket}`)
      .then((res) => {
        if (!res.ok) {
          throw new Error(res.statusText);
        }
        return res.json();
      })
      .catch((err) => {
        error.set(err as Error);
        return undefined;
      });
  }

  async function pollForTicket(): Promise<void> {
    let loadTime = Date.now();
    if (!ticket) {
      timer = setInterval(async () => {
        if (Date.now() - loadTime > 1000 * 60 * 2) {
          error.set(new Error("Creation ticket load timeout"));
          clearInterval(timer);
          return;
        }
        try {
          ticketData = await loadticket();
          if (ticketData) {
            clearInterval(timer);

            const ownerKey = searchParams.get("owner_key");
            const activeKey = searchParams.get("active_key");

            if (ownerKey && activeKey) {
              goto(
                `/create?ticket=${ticket}&owner_key=${ownerKey}&active_key=${activeKey}`,
              );
            } else {
              goto(`${PUBLIC_WHALESPLAINER_URL}/activate/${ticket}`);
            }
          }
        } catch (err) {
          error.set(err as Error);
          clearInterval(timer);
        }
      }, 5000);
    }
  }

  function retry(): void {
    error.set(undefined);
    clearTimeout(timer);
    pollForTicket();
  }

  onMount(() => {
    if (ticket) {
      pollForTicket();

      return () => {
        clearInterval(timer);
      };
    }
  });
</script>

{#if $error}
  <div class="flex flex-col items-center p-4">
    <div
      class="w-16 h-16 mb-8 flex items-center justify-center bg-red-500 rounded-full text-white"
    >
      ❌
    </div>
    <h1 class="text-3xl font-bold text-center">Payment failure</h1>
    <p class="mt-2 text-center">Unable to verify payment. {$error.message}</p>
    <div class="flex flex-col mt-6 space-y-4 w-full max-w-sm">
      <button
        class="p-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        on:click={retry}>Retry</button
      >
    </div>
  </div>
{:else}
  <div class="flex flex-col items-center p-4">
    <div
      class="w-16 h-16 mb-8 flex items-center justify-center bg-yellow-500 rounded-full text-white"
    >
      ⏳
    </div>
    <h1 class="text-3xl font-bold text-center">Payment pending</h1>
    <p class="mt-2 text-center">Waiting for the payment processor...</p>
  </div>
{/if}
