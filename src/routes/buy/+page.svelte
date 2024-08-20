<script lang="ts">
  import type { StripeProduct } from "$lib/types";
  import { loadStripe } from "@stripe/stripe-js";
  import { signIn, signOut } from "@auth/sveltekit/client";
  import type { Session } from "@auth/sveltekit";
  import GoogleLogo from "../../assets/google-logo.svg";
  import AppleLogo from "../../assets/apple-logo.svg";
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

<div class="flex items-center justify-center min-h-screen">
  <div class="container mx-auto px-4 py-8 max-w-2xl">
    <h1 class="text-4xl font-bold mb-6 text-center">
      {$t("Create New Account")}
    </h1>

    {#if data.session === undefined}
      <div class="bg-white shadow rounded-lg p-6 mb-4 text-center">
        <h3 class="text-xl font-semibold mb-2">
          {$t("Checking Login Status")}
        </h3>
        <div
          class="loader w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"
        ></div>
        <p>{$t("Please wait while we verify your login status...")}</p>
      </div>
    {:else if data.session}
      <div class="bg-white shadow rounded-lg p-6 mb-4">
        <div class="flex justify-between items-center">
          <div>
            <h3 class="text-xl font-semibold">
              {$t("Logged in as {name}", {
                name: data.session.user?.name ?? "",
              })}
            </h3>
            {#if data.session.user?.name !== data.session.user?.email}
              <p class="text-sm text-gray-600">{data.session.user?.email}</p>
            {/if}
          </div>
          <button
            on:click={handleLogout}
            class="px-4 py-2 text-sm bg-red-500 text-white rounded hover:bg-red-600 transition duration-300"
          >
            {$t("Logout")}
          </button>
        </div>
      </div>

      {#if data.canGetFreeAccount}
        <div class="bg-green-100 border border-green-400 rounded-lg p-6 mb-4">
          <h3 class="text-xl font-semibold mb-2">
            {$t("Free Account Available!")}
          </h3>
          <p class="mb-4">
            {$t("Great news! You're eligible for a free account.")}
          </p>
          <form method="POST" action="/ticket" on:submit={handleGetFreeAccount}>
            <input
              type="hidden"
              name="searchParams"
              value={data.searchParams}
            />
            <button
              type="submit"
              class="w-full px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition duration-300 flex items-center justify-center"
              disabled={isLoading}
            >
              {#if isLoading}
                <span
                  class="loader w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"
                ></span>
              {/if}
              {isLoading ? $t("Processing...") : $t("Get Free Account")}
            </button>
          </form>
        </div>
      {:else}
        <div class="bg-yellow-100 border border-yellow-400 rounded-lg p-6 mb-4">
          <h3 class="text-xl font-semibold mb-2">
            {$t("Free Account Unvailable")}
          </h3>
          <p>
            {$t(
              "You're not eligible for a free account at this time. You can purchase an account below, or sign in with another account.",
            )}
          </p>
        </div>
      {/if}
    {:else}
      <div class="bg-white shadow rounded-lg p-6 mb-4">
        <h3 class="text-xl font-semibold mb-4">
          {$t("Sign in to get a free account")}
        </h3>
        <div class="space-y-3">
          <button
            on:click={() =>
              signIn("google", { callbackUrl: `/buy?${data.searchParams}` })}
            class="w-full px-4 py-2 bg-[#4285F4] text-white rounded hover:bg-[#357AE8] transition duration-300 flex items-center justify-center"
          >
            <img src={GoogleLogo} alt="Google Logo" class="w-5 h-5 mr-2" />
            {$t("Sign in with Google")}
          </button>
          <button
            on:click={() =>
              signIn("apple", { callbackUrl: `/buy?${data.searchParams}` })}
            class="w-full px-4 py-2 bg-black text-white rounded hover:bg-gray-800 transition duration-300 flex items-center justify-center"
          >
            <img src={AppleLogo} alt="Apple Logo" class="w-5 h-5 mr-2" />
            {$t("Sign in with Apple")}
          </button>
        </div>
      </div>
    {/if}

    {#if !data.canGetFreeAccount}
      <div class="bg-white shadow rounded-lg p-6 mb-4">
        <h3 class="text-xl font-semibold mb-4">{$t("Buy an account")}</h3>
        <p class="mb-4">
          {$t("Create a {productName} for {price}", {
            productName: data.stripeProduct.product.name,
            price: formatPrice(
              data.stripeProduct.price.unit_amount,
              data.stripeProduct.price.currency,
            ),
          })}
        </p>
        <button
          on:click={handleBuy}
          class="w-full px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition duration-300"
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
      <p class="text-red-500 text-center">
        <strong>{$t("ERROR")}:</strong>
        {buyError}
      </p>
    {/if}
  </div>
</div>
