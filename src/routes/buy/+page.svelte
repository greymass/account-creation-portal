<script lang="ts">
  import FAQ from "$lib/components/faq.svelte";

  import type { StripeProduct } from "$lib/types";
  import { loadStripe } from "@stripe/stripe-js";
  import { signIn, signOut } from "@auth/sveltekit/client";
  import type { Session } from "@auth/sveltekit";
  import { t } from "../../lib/i18n";

  interface CreateRequestArguments {
    login_scope: string | null;
    return_path: string | null;
  }

  interface PageData {
    stripeProduct: StripeProduct;
    createRequestArguments: CreateRequestArguments;
    searchParams: string;
    session: Session | null | undefined;
    canGetFreeAccount: boolean;
  }

  export let data: PageData;

  let buyError: string | undefined;
  let isLoading = false;

  async function buy(): Promise<void> {
    const body = JSON.stringify({
      ...data.createRequestArguments,
      id: data.stripeProduct.price.id,
      searchParams: data.searchParams,
    });

    const res = await fetch("/api/stripe/session", {
      body,
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });

    if (!res.ok) {
      throw new Error(await res.text());
    }

    const { session: stripeSession } = await res.json();

    const stripe = await loadStripe(data.stripeProduct.key);

    if (stripe) {
      await stripe.redirectToCheckout({ sessionId: stripeSession.sessionId });
    }
  }

  function handleBuy(event: Event): void {
    event.preventDefault();
    buyError = undefined;
    buy().catch((err: Error) => {
      buyError = err.message;
    });
  }

  function formatPrice(amount: number, currency = "USD"): string {
    return (amount / 100).toLocaleString("en-US", {
      style: "currency",
      currency,
    });
  }

  function handleLogout() {
    signOut({ callbackUrl: "/buy" });
  }

  function handleGetFreeAccount(event: SubmitEvent) {
    isLoading = true;
    // The form will handle the POST request
    // We're just setting isLoading to true here
  }
</script>

<div class="pb-6 pt-10 sm:pt-20 sm:pb-10">
  <img
    src="https://assets.wharfkit.com/chain/eos.png"
    alt="EOS Logo"
    class="w-[68px] m-auto"
  />
  <h1 class="text-center mt-5">{$t("Create New EOS Account")}</h1>
</div>

{#if data.session === undefined}
  <div class="p-0 pt-6 sm:py-10 sm:px-5">
    <div
      class="space-y-2 text-center rounded-lg ring-1 ring-slate-700/5 shadow p-6 sm:py-5 sm:px-10 dark:bg-slate-800"
    >
      <h3>{$t("Checking Login Status")}</h3>
      <div
        class="loader w-5 h-5 border-2 border-[#2D8EFF] border-t-transparent rounded-full animate-spin mx-auto"
      ></div>
      <p>{$t("Please wait while we verify your login status...")}</p>
    </div>
  </div>
{:else if data.session}
  <div class="p-0 pt-6 space-y-12 sm:py-10 sm:px-5 sm:space-y-5">
    <div
      class="block space-y-5 sm:flex sm:justify-between sm:items-center sm:space-y-0"
    >
      <div class="space-y-3">
        <h3>
          {$t("Logged in as {name}", {
            name: data.session.user?.name ?? "",
          })}
        </h3>
        {#if data.session.user?.name !== data.session.user?.email}
          <p>{data.session.user?.email}</p>
        {/if}
      </div>
      <button
        on:click={handleLogout}
        class="btn-primary bg-[#FF0000] dark:bg-[#FF1A1A"
      >
        {$t("Log out")}
      </button>
    </div>

    {#if data.canGetFreeAccount}
      <div
        class="rounded-[20px] p-6 sm:py-5 sm:px-10 bg-[#DEFFEB] dark:bg-[#003A16] border border-[#7DFFB3] dark:border-[#7DFFB3]"
      >
        <div class="space-y-5 text-center">
          <div>
            <h3>{$t("Free Account Available!")}</h3>
            <p class="mt-2">
              {$t("Great news! You're eligible for a free account.")}
            </p>
          </div>
          <form method="POST" action="/ticket" on:submit={handleGetFreeAccount}>
            <input
              type="hidden"
              name="searchParams"
              value={data.searchParams}
            />
            <button
              type="submit"
              class="btn-primary flex items-center justify-center w-full bg-[#00B44B] dark:bg-[#00CD55]"
              disabled={isLoading}
            >
              {#if isLoading}
                <span
                  class="loader w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"
                ></span>
              {/if}
              {isLoading ? $t("Processing...") : $t("Get Free Account")}
              {#if !isLoading}
                &rarr;
              {/if}
            </button>
          </form>
        </div>
      </div>
    {:else}
      <div
        class="rounded-[20px] p-6 sm:py-5 sm:px-10 bg-[#FFE6B1] border border-[#FFAD00] dark:bg-[#674600] dark:border-[#FFB61A]"
      >
        <h3>{$t("Free Account Unavailable")}</h3>
        <p class="mt-2">
          {$t("You're not eligible for a free account at this time.")}
        </p>
        <p class="mt-1">
          {$t(
            "You can purchase an account below, or sign in with another account to check again.",
          )}
        </p>
      </div>
    {/if}
  </div>
{:else}
  <div class="px-0 py-6 sm:py-10 sm:px-5 space-y-5">
    <h3>{$t("Sign in to get a free account")}</h3>
    <div
      class="block space-x-0 space-y-4 sm:flex sm:justify-between sm:items-center sm:space-x-5 sm:space-y-0"
    >
      <button
        on:click={() =>
          signIn("google", { callbackUrl: `/buy?${data.searchParams}` })}
        class="flex items-center justify-center btn-white w-full text-xl font-medium drop-shadow"
      >
        <span class="w-6 h-6 mr-3 bg-[url('/images/logo-google.svg')]" />
        {$t("Continue with Google")}
      </button>
      <button
        on:click={() =>
          signIn("apple", { callbackUrl: `/buy?${data.searchParams}` })}
        class="flex items-center justify-center btn-black text-xl font-medium drop-shadow w-full"
      >
        <span
          class="w-6 h-6 mr-3 bg-[url('/images/logo-apple.svg')] dark:bg-[url('/images/logo-apple-dark.svg')]"
        />
        {$t("Continue with Apple")}
      </button>
    </div>
  </div>
{/if}

{#if !data.canGetFreeAccount}
  <hr class="my-5" />
  <div
    class="px-0 py-6 block space-y-5 sm:flex sm:justify-between sm:items-center sm:py-10 sm:px-5 sm:space-y-0"
  >
    <div class="space-y-3">
      <h3>{$t("Buy an account")}</h3>
      <p>
        {$t("Create a {productName} for {price}", {
          productName: data.stripeProduct.product.name,
          price: formatPrice(
            data.stripeProduct.price.unit_amount,
            data.stripeProduct.price.currency,
          ),
        })}
      </p>
    </div>
    <button
      on:click={handleBuy}
      class="btn-primary bg-[#2D8EFF] dark:bg-[#479DFF]"
    >
      {$t("Continue to Payment")} &rarr;
    </button>
  </div>
{/if}

<noscript>
  <p class="text-red-500 text-center">
    {$t(
      "Sorry, our payment processor Stripe requires JavaScript to be enabled to function.",
    )}
  </p>
</noscript>
{#if buyError}
  <div class="py-5 px-3">
    <p class="text-red-500 text-center">
      <strong>ERROR:</strong>
      {buyError}
    </p>
  </div>
{/if}
<hr class="my-5" />
<FAQ />
