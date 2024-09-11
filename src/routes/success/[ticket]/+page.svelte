<script lang="ts">
  import { TriangleAlert, Hourglass } from "lucide-svelte";
  const condition_1 = false;
</script>

<div class="m-auto flex items-center justify-center h-full">
  {#if condition_1}
    <div class="flex flex-col items-center p-4">
      <div
        class="w-16 h-16 mb-8 flex items-center justify-center bg-red-500 rounded-full text-white"
      >
        <TriangleAlert size={36} />
      </div>
      <h1 class="text-center">Payment failure</h1>
      <p class="mt-2 text-center">Unable to verify payment.</p>
      <div class="flex flex-col mt-6 space-y-4 w-full max-w-sm">
        <button class="btn-primary">Retry</button>
      </div>
    </div>
  {:else}
    <div class="flex flex-col items-center p-4">
      <div
        class="w-16 h-16 mb-8 flex items-center justify-center bg-yellow-500 rounded-full text-white"
      >
        <Hourglass size={36} />
      </div>
      <h1 class="text-center">Payment pending</h1>
      <p class="mt-2 text-center">Waiting for the payment processor...</p>
    </div>
  {/if}
</div>
