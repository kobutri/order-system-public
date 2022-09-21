<script lang="ts">
	import CompactOrderOverview from '$lib/CompactOrderOverview.svelte';
	import MonthCategoryOverview from '$lib/MonthCategoryOverview.svelte';
	import MonthProductOverview from '$lib/MonthProductOverview.svelte';
	import OrderOverview from '$lib/OrderOverview.svelte';
	import { InteractiveTabHead, TabContent } from 'flowbite-svelte';

	let tab1 = { name: 'Tägliche Bestellübersicht', id: 1 };
	let tab2 = { name: 'Tägliche Bestellübersicht kompakt', id: 2 };
	let tab3 = { name: 'Monatsübersicht Produkte', id: 3 };
	let tab4 = { name: 'Monatsübersicht Kategorien', id: 4 };
	let tabhead = [tab1, tab2, tab3, tab4];
</script>

<InteractiveTabHead tabs={tabhead}>
	<TabContent tab={tab1}>
		<OrderOverview />
	</TabContent>
	<TabContent tab={tab2}>
		<CompactOrderOverview />
	</TabContent>
	<TabContent tab={tab3}>
		<MonthProductOverview />
	</TabContent>
	<TabContent tab={tab4}>
		<MonthCategoryOverview />
	</TabContent>
</InteractiveTabHead>
