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

<div class="pt-20 pb-10 max-xs:pb-6 max-xs:pt-10">
  <svg
    viewBox="0 0 68 96"
    class="w-[68px] h-[96px] m-auto fill-[#111111] dark:fill-white"
  >
    <path
      fill-rule="evenodd"
      clip-rule="evenodd"
      d="M34 4.35948e-05C34.8203 -0.00463096 35.6144 0.367644 36.1175 1.03419L56.9278 28.6057C57.1421 28.8896 57.2929 29.2138 57.3704 29.5575L67.4396 74.1698C67.6747 75.2115 67.21 76.2842 66.2782 76.8504L35.3987 95.6145C34.9695 95.8753 34.4837 96.0028 34 96C33.5163 96.0028 33.0305 95.8753 32.6013 95.6145L1.72183 76.8504C0.790043 76.2842 0.325276 75.2115 0.56039 74.1698L10.6296 29.5575C10.7071 29.2138 10.8579 28.8896 11.0722 28.6057L31.8825 1.03419C32.3856 0.367639 33.1797 -0.00463626 34 4.35948e-05ZM31.3797 10.2537L16.0575 30.554L19.6031 41.3521L31.3797 21.1983V10.2537ZM34 26.961L21.7573 47.9125L29.7271 72.184H38.2729L46.2427 47.9125L34 26.961ZM49.7429 53.9027L43.74 72.184H60.4253L49.7429 53.9027ZM55.8327 77.2359H42.0812L38.6534 87.675L55.8327 77.2359ZM34 85.1967L36.614 77.2359H31.386L34 85.1967ZM24.26 72.184L18.2571 53.9027L7.57472 72.184H24.26ZM9.3335 58.927L16.1029 47.3422L13.6407 39.8437L9.3335 58.927ZM12.1673 77.2359H25.9188L29.3466 87.675L12.1673 77.2359ZM58.6665 58.927L51.8971 47.3422L54.3593 39.8437L58.6665 58.927ZM51.9425 30.554L48.3969 41.3521L36.6203 21.1983V10.2537L51.9425 30.554Z"
    />
  </svg>
  <h1 class="text-center mt-5">{$t("Create New EOS Account")}</h1>
</div>

{#if data.session === undefined}
  <div class="py-10 px-5 max-xs:p-0 max-xs:pt-6">
    <div
      class="space-y-2 text-center rounded-lg ring-1 ring-slate-700/5 shadow py-5 px-10 max-xs:p-6 dark:bg-slate-800"
    >
      <h3>{$t("Checking Login Status")}</h3>
      <div
        class="loader w-5 h-5 border-2 border-[#2D8EFF] border-t-transparent rounded-full animate-spin mx-auto"
      ></div>
      <p>{$t("Please wait while we verify your login status...")}</p>
    </div>
  </div>
{:else if data.session}
  <div class="py-10 px-5 space-y-5 max-xs:p-0 max-xs:pt-6 max-xs:space-y-12">
    <div
      class="flex max-xs:block max-xs:space-y-5 justify-between items-center"
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
        class="btn-primary max-xs:w-full bg-[#FF0000] dark:bg-[#FF1A1A"
      >
        {$t("Logout")}
      </button>
    </div>

    {#if data.canGetFreeAccount}
      <div
        class="rounded-[20px] py-5 px-10 max-xs:p-6 bg-[#DEFFEB] dark:bg-[#003A16] border border-[#7DFFB3] dark:border-[#7DFFB3]"
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
        class="rounded-[20px] py-5 px-10 max-xs:p-6 bg-[#FFE6B1] border border-[#FFAD00] dark:bg-[#674600] dark:border-[#FFB61A]"
      >
        <h3>{$t("Free Account Unvailable")}</h3>
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
  <div class="py-10 px-5 space-y-5 max-xs:px-0 max-xs:py-6">
    <h3>{$t("Sign in to get a free account")}</h3>
    <div
      class="flex justify-between items-center space-x-5 max-xs:block max-xs:space-x-0 max-xs:space-y-4"
    >
      <button
        on:click={() =>
          signIn("google", { callbackUrl: `/buy?${data.searchParams}` })}
        class="flex items-center justify-center btn-white w-full text-xl font-medium drop-shadow"
      >
        <svg
          viewBox="0 0 24 24"
          class="w-6 h-6 mr-3 fill-white dark:fill-black"
        >
          <path
            fill-rule="evenodd"
            clip-rule="evenodd"
            d="M23.04 12.2614C23.04 11.4459 22.9668 10.6618 22.8309 9.90909H12V14.3575H18.1891C17.9225 15.795 17.1123 17.013 15.8943 17.8284V20.7139H19.6109C21.7855 18.7118 23.04 15.7636 23.04 12.2614Z"
            fill="#4285F4"
          />
          <path
            fill-rule="evenodd"
            clip-rule="evenodd"
            d="M12 23.4998C15.105 23.4998 17.7081 22.4701 19.6109 20.7137L15.8943 17.8283C14.8645 18.5183 13.5472 18.926 12 18.926C9.00474 18.926 6.46951 16.903 5.56519 14.1848H1.72314V17.1644C3.61542 20.9228 7.50451 23.4998 12 23.4998Z"
            fill="#34A853"
          />
          <path
            fill-rule="evenodd"
            clip-rule="evenodd"
            d="M5.56523 14.1851C5.33523 13.4951 5.20455 12.758 5.20455 12.0001C5.20455 11.2421 5.33523 10.5051 5.56523 9.81506V6.83551H1.72318C0.944318 8.38801 0.5 10.1444 0.5 12.0001C0.5 13.8557 0.944318 15.6121 1.72318 17.1646L5.56523 14.1851Z"
            fill="#FBBC05"
          />
          <path
            fill-rule="evenodd"
            clip-rule="evenodd"
            d="M12 5.07386C13.6884 5.07386 15.2043 5.65409 16.3961 6.79364L19.6945 3.49523C17.7029 1.63955 15.0997 0.5 12 0.5C7.50451 0.5 3.61542 3.07705 1.72314 6.83545L5.56519 9.815C6.46951 7.09682 9.00474 5.07386 12 5.07386Z"
            fill="#EA4335"
          />
        </svg>
        {$t("Continue with Google")}
      </button>
      <button
        on:click={() =>
          signIn("apple", { callbackUrl: `/buy?${data.searchParams}` })}
        class="flex items-center justify-center btn-black text-xl font-medium drop-shadow w-full"
      >
        <svg
          viewBox="0 0 25 24"
          class="w-6 h-6 mr-3 fill-white dark:fill-black"
        >
          <path
            d="M22.0306 18.424C21.6827 19.2275 21.271 19.9672 20.794 20.6472C20.1438 21.5743 19.6114 22.216 19.2011 22.5724C18.565 23.1573 17.8836 23.4568 17.1539 23.4739C16.63 23.4739 15.9982 23.3248 15.2628 23.0224C14.525 22.7214 13.8469 22.5724 13.2269 22.5724C12.5767 22.5724 11.8793 22.7214 11.1334 23.0224C10.3864 23.3248 9.78456 23.4824 9.32444 23.498C8.62466 23.5278 7.92716 23.2197 7.23093 22.5724C6.78656 22.1848 6.23075 21.5204 5.5649 20.5791C4.85051 19.5739 4.26317 18.4084 3.80304 17.0795C3.31026 15.6442 3.06323 14.2543 3.06323 12.9087C3.06323 11.3673 3.3963 10.0379 4.06342 8.92385C4.58772 8.029 5.28522 7.32312 6.1582 6.80493C7.03118 6.28674 7.97443 6.02267 8.99024 6.00578C9.54605 6.00578 10.2749 6.1777 11.1807 6.51559C12.0839 6.85462 12.6639 7.02655 12.9181 7.02655C13.1082 7.02655 13.7525 6.82552 14.8447 6.42473C15.8775 6.05305 16.7492 5.89916 17.4633 5.95978C19.3984 6.11595 20.8522 6.87876 21.819 8.25303C20.0884 9.30163 19.2323 10.7703 19.2493 12.6544C19.265 14.122 19.7974 15.3432 20.8437 16.3129C21.3179 16.7629 21.8474 17.1107 22.4366 17.3578C22.3088 17.7283 22.1739 18.0832 22.0306 18.424ZM17.5925 0.960131C17.5925 2.11039 17.1723 3.18439 16.3347 4.17847C15.3238 5.36023 14.1012 6.04311 12.7753 5.93536C12.7584 5.79736 12.7486 5.65213 12.7486 5.49951C12.7486 4.39526 13.2293 3.21349 14.083 2.24724C14.5092 1.75801 15.0513 1.35122 15.7086 1.02671C16.3645 0.707053 16.9849 0.530273 17.5684 0.5C17.5854 0.653772 17.5925 0.807554 17.5925 0.960116V0.960131Z"
          ></path>
        </svg>
        {$t("Continue with Apple")}
      </button>
    </div>
  </div>
{/if}

{#if !data.canGetFreeAccount}
  <hr class="my-5" />
  <div
    class="flex justify-between items-center py-10 px-5 max-xs:px-0 max-xs:py-6 max-xs:block max-xs:space-y-5"
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
      class="max-xs:w-full btn-primary bg-[#2D8EFF] dark:bg-[#479DFF]"
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
