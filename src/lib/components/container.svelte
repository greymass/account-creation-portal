<script lang="ts">
</script>

<div class="w-full min-h-screen flex mx-auto">
	<div class="flex flex-col w-full xl:w-1/2">
		<div
			class="bg-[url('/images/creation-right-bg.jpg')] h-10 bg-cover bg-no-repeat bg-center xl:hidden"
		/>
		<div class="flex-1 flex justify-center">
			<div class="px-[60px] max-sm:px-6 w-[820px]">
				<slot />
			</div>
		</div>
		<div class="py-5">
			<a
				class="block m-auto w-[154px] h-[28px] bg-[url('/images/greymass-logo.png')] dark:bg-[url('/images/greymass-logo-dark.png')] bg-no-repeat bg-cover"
				href="https://greymass.com"
				target="_blank"
			>
			</a>
		</div>
	</div>

	<div
		class="w-0 xl:w-1/2 bg-red-200 fixed top-0 left-1/2 bg-[url('/images/creation-right-bg.jpg')] bg-no-repeat bg-cover h-full"
	></div>
</div>
