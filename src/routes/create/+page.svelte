<script lang="ts">
  import { writable, get } from "svelte/store";
  import { onMount } from "svelte";
  import { fade, fly } from "svelte/transition";
  import type { Product } from "$lib/types";
  import { t } from "$lib/i18n";
  import { Check, AlertCircle, CircleCheck, Loader2 } from "lucide-svelte";

  interface PageData {
    code: string;
    product: Product;
    searchParams: string;
  }

  export let data: PageData;

  let code = data.code;
  let product = data.product;
  let searchParamsString = data.searchParams;

  let accountName = writable("");
  let nameAvailable = writable<boolean | null>(null);
  let loading = writable(false);
  let error = writable<string | null>(null);
  let accountCreated = writable(false);
  let creatingAccount = writable(false);

  let activeKey: string | null = null;
  let ownerKey: string | null = null;
  let ticket: string | null = null;
  let keysMissing = writable(false);
  let debounceTimeout: NodeJS.Timeout;

  onMount(() => {
    const searchParams = new URLSearchParams(searchParamsString);
    activeKey = searchParams.get("active_key");
    ownerKey = searchParams.get("owner_key");
    ticket = searchParams.get("ticket");

    if (!activeKey || !ownerKey) {
      keysMissing.set(true);
    }
  });

  async function checkAccountNameAvailability(accountName: string) {
    error.set(null);
    nameAvailable.set(null);
    loading.set(true);

    try {
      const result = await fetch("/api/accounts/check", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          accountName: accountName + ".gm",
          productId: product.id,
          ticket,
        }),
      });

      if (!result.ok) {
        throw new Error($t("Failed to check account name availability"));
      }

      const { nameAvailable: availability } = await result.json();

      nameAvailable.set(availability);
    } catch (err) {
      error.set($t("Error checking account name availability"));
    } finally {
      loading.set(false);
    }
  }

  function handleAccountNameInput(event: Event) {
    const target = event.target as HTMLInputElement;
    const name = target.value.trim().toLowerCase();
    accountName.set(name);

    clearTimeout(debounceTimeout);
    debounceTimeout = setTimeout(() => {
      checkAccountNameAvailability(name);
    }, 500);
  }

  async function handleConfirm() {
    const accountNameValue = get(accountName);
    if (accountNameValue) {
      await checkAccountNameAvailability(accountNameValue);
      if (get(nameAvailable)) {
        if (!activeKey || !ownerKey) {
          console.error($t("Missing required keys"));
          return;
        }

        const payload = {
          ticket,
          productId: product.id,
          activeKey,
          ownerKey,
          accountName: accountNameValue + ".gm",
        };

        try {
          creatingAccount.set(true);
          const response = await fetch("/api/accounts/create", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(payload),
          });

          const result = await response.json();

          if (response.ok) {
            accountCreated.set(true);

            if (window.opener) {
              window.opener.postMessage(
                {
                  sa: `${accountNameValue}.gm`,
                  sp: "active",
                },
                "*",
              );
            }
          } else {
            console.error($t("Failed to create account"), result);
            error.set(
              $t("Failed to create account: {reason}", {
                reason: result.error || $t("Unknown error"),
              }),
            );
          }
        } catch (err: unknown) {
          console.error($t("Error creating account"), err);
          error.set(
            $t("Error creating account: {reason}", {
              reason:
                (err as { message: string }).message || $t("Unknown error"),
            }),
          );
        } finally {
          creatingAccount.set(false);
        }
      }
    }
  }
</script>

<div class="mx-auto max-w-md p-4 flex items-center justify-center h-full">
  {#if $keysMissing}
    <div
      class="bg-surface-100-800-token p-6 rounded-lg shadow-lg w-full ring-1 ring-slate-900/5 dark:bg-slate-800"
      in:fade={{ duration: 300 }}
    >
      <h2 class="mb-4">
        {$t("To create an account using Anchor")}
      </h2>
      <p class="mb-4">
        {$t(
          "To create an account using Anchor, please provide the following code:",
        )}
      </p>
      <pre
        class="bg-surface-200-700-token p-4 rounded-md overflow-x-auto">{code}</pre>
    </div>
  {:else if $accountCreated}
    <div
      class="bg-surface-100-800-token p-8 rounded-lg shadow-lg flex flex-col items-center text-center w-full ring-1 ring-slate-900/5 dark:bg-slate-800"
      in:fly={{ y: 20, duration: 500 }}
    >
      <div
        class="w-20 h-20 mb-6 flex items-center justify-center bg-green-500 rounded-full text-white"
      >
        <Check size={48} />
      </div>
      <h2 class="mb-4">
        {$t("Account Created Successfully!")}
      </h2>
      <p class="mb-4">
        {$t(
          "Your account was created successfully. You can now use this account on the wallet that generated the private keys.",
        )}
      </p>
    </div>
  {:else}
    <div
      class="bg-surface-100-800-token p-6 rounded-lg shadow-lg w-full ring-1 ring-slate-900/5 dark:bg-slate-800"
      in:fade={{ duration: 300 }}
    >
      <h1 class="mb-6">{$t("Create New Account")}</h1>

      <p class="mb-4">{$t("Enter the desired EOS account name:")}</p>

      <div class="mb-6 relative">
        <input
          type="text"
          class="w-full p-3 pr-20 border border-surface-300-600-token rounded-md focus:ring-2 focus:ring-[#2D8EFF] focus:border-[#[#2D8EFF]] transition-all duration-300 dark:text-[var(--text-black)]"
          on:input={handleAccountNameInput}
          placeholder={$t("Enter account name")}
        />
        <span
          class="absolute right-3 top-3 text-surface-500 dark:text-[var(--text-black)]"
          >.gm</span
        >

        {#if $error}
          <p
            class="text-red-500 mt-2 flex items-center"
            in:fly={{ y: -10, duration: 300 }}
          >
            <AlertCircle size={16} class="mr-1" />
            {$error}
          </p>
        {/if}

        {#if $nameAvailable !== null}
          <p
            class="mt-2 flex items-center"
            class:text-green-500={$nameAvailable}
            class:text-red-500={!$nameAvailable}
            in:fly={{ y: -10, duration: 300 }}
          >
            {#if $nameAvailable}
              <CircleCheck size={16} class="mr-1" />
              {$t("This account name is available.")}
            {:else}
              <AlertCircle size={16} class="mr-1" />
              {$t("This account name is not available.")}
            {/if}
          </p>
        {/if}
      </div>

      <button
        class="btn-primary w-full flex items-center justify-center"
        on:click={handleConfirm}
        disabled={$loading || $creatingAccount || !$nameAvailable}
      >
        {#if $loading || $creatingAccount}
          <Loader2 class="animate-spin mr-2" size={20} />
        {/if}
        {#if $loading}
          {$t("Checking name availability...")}
        {:else if $creatingAccount}
          {$t("Creating account...")}
        {:else}
          {$t("Confirm")}
        {/if}
      </button>
    </div>
  {/if}
</div>
