<script lang="ts">
	import { TableBodyCell, Tooltip } from 'flowbite-svelte';
</script>

<TableBodyCell tdClass="px-2 whitespace-normal text-ellipsis">
	<Tooltip>
		<div slot="content"><slot /></div>
		<slot />
	</Tooltip>
</TableBodyCell>
