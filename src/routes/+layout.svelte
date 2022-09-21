<script lang="ts">
	import Navbar from '$lib/utils/Navbar.svelte';
	import '../app.css';
	import { user } from '../Firebase';
</script>

<div class="flex flex-col h-full">
	<Navbar />

	<main class="mt-5 mx-5 h-full flex-grow">
		{#if $user}
			<slot />
		{:else}
			<span class="text-white">Du musst dich einloggen</span>
		{/if}
	</main>
</div>
