<script>
	import Login from '$lib/Login.svelte';
	import {Heading, Navbar, NavBrand, NavHamburger, NavLi, NavUl} from 'flowbite-svelte';
</script>

<Navbar let:hidden let:toggle rounded={true} fluid={true} navDivClass="max-w-full flex flex-wrap justify-between items-center">
	<NavBrand href="/">
		<img
			src="WISAG_logo.svg"
			class="mr-3 h-6 sm:h-9"
			alt="WISAG Logo"
		/>
		<span class="whitespace-nowrap text-xl font-semibold dark:text-white">
			WISAG Bestellsystem
		</span>
	</NavBrand>
	<NavHamburger on:click={toggle} />
	<NavUl {hidden}>
		<Login />
	</NavUl>
</Navbar>
