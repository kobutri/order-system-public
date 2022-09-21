<script lang="ts">
	import { Input, Select } from 'flowbite-svelte';
	import { createEventDispatcher } from 'svelte';
	import { Category, categoryNames } from './utils/product';

	const dispatch = createEventDispatcher<{ selected: Category }>();

	const normalClass = 'text-gray-900 bg-gray-50 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500';
	const invalidClass ='border-red-500 bg-red-50 text-red-900 placeholder-red-700 rounded-lg focus:border-red-500 focus:ring-red-500 dark:border-red-400 dark:bg-red-100 dark:focus:border-red-500 dark:focus:ring-red-500'

	function change() {
		dispatch('selected', parseInt(value) as Category);
	}
	export let category: Category;
	export let disabled = false;
	$: {
		if (category != Category.Unspecified) {
			value = category.toString();
		} else {
			value = undefined;
		}
	}
	let value: string;
</script>


<Select defaultClass={!value ? invalidClass : normalClass} {disabled} placeholder="Kategorie" items={categoryNames} bind:value on:change={change} />
