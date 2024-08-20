<script lang="ts">
	import { t } from "../../lib/i18n";

	export let faqExpanded = true;
	interface FAQ {
		title: string;
		content: string;
	}
	const faqArray: FAQ[] = [
		{
			title: $t("What is EOS?"),
			content: $t(
				"EOS is a blockchain platform designed for decentralized applications (dApps).",
			),
		},
		{
			title: $t("Why do I need an EOS account?"),
			content: $t(
				"An EOS account is necessary to interact with the EOS blockchain, use dApps, and manage EOS tokens.",
			),
		},
		{
			title: $t("Are there different ways to create an EOS account?"),
			content: $t(
				"Yes, typically you can create an account for free through certain platforms or purchase an account.",
			),
		},
		{
			title: $t("What information do I need to create an EOS account?"),
			content: $t(
				"Generally, you'll need to provide an email address and create a password. Some methods may require additional verification.",
			),
		},
		{
			title: $t("Are EOS accounts free?"),
			content: $t(
				"Yes, you can create multiple EOS accounts, but each requires a separate creation process.",
			),
		},
		{
			title: $t("Can I create multiple EOS accounts?"),
			content: $t(
				"Yes, you can create multiple EOS accounts, but each requires a separate creation process.",
			),
		},
		{
			title: $t("What should I do after creating an EOS account?"),
			content: $t(
				"After creation, secure your account keys, explore EOS wallets, and familiarize yourself with EOS resources and bandwidth.",
			),
		},
	];
</script>

<div class="px-0 pt-0 pb-5 sm:px-5 sm:py-10">
	<button
		class="rounded-lg py-3 px-5 w-full flex justify-between items-center bg-[#ECF5FF] hover:bg-[#E2EDFF] active:bg-[#D7E4FF] focus:bg-[#E2EDFF] dark:bg-[#161616] dark:hover:bg-[#20242D] dark:active:bg-[#2C3245] dark:focus:bg-[#20242D]"
		on:click={() => {
			faqExpanded = !faqExpanded;
		}}
	>
		<h3>FAQ</h3>
		<svg
			viewBox="0 0 13 7"
			class="float-right w-[13px] y-[7px] fill-black dark:fill-white {faqExpanded
				? 'rotate-0'
				: 'rotate-180'} duration-150"
		>
			<path d="M0.698303 7L6.84912 0.849182L12.9999 7H0.698303Z" />
		</svg>
	</button>
	{#if faqExpanded}
		<ul class="block space-y-8 mt-5">
			{#each faqArray as item}
				<li>
					<h4 class="text-base font-bold">{item.title}</h4>
					<p class="mt-1">
						{item.content}
					</p>
				</li>
			{/each}
		</ul>
	{/if}
</div>
