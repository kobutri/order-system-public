<script lang="ts">
	import { createEventDispatcher } from 'svelte';

	let dates: Date[] = (() => {
		let dates = [];
		let now = Date.now();
		for (var i = 0; i < 10; i++) {
			let date = new Date(now);
			date.setDate(date.getDate() + i);
			dates.push(date);
		}
		return dates;
	})();
	const shortWeekDays = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];
	const isWeekend = (day: number) => {
		return day == 0 || day == 6;
	};
	export var selected: number | undefined = undefined;
	export var selectedDate: Date | undefined = undefined;
	const dispatch = createEventDispatcher<{ change: { date: Date } }>();
	const handleSelect = (date: Date, i: number) => {
		if (!isWeekend(date.getDay())) {
			selected = i;
			selectedDate = date;
			dispatch('change', {
				date: date
			});
		}
	};
</script>

<div class="flex flex-row  gap-4">
	{#each dates as date, i}
		<div
			class={`flex flex-col justify-evenly items-center w-16 h-16 p-3 shadow-xl rounded ${
				i == selected
					? 'bg-green-500'
					: !isWeekend(date.getDay())
					? ' bg-slate-100 hover:bg-slate-200'
					: ' bg-white'
			}`}
			style="min-width: 4rem; min-height: 4rem;"
			on:click={() => handleSelect(date, i)}
		>
			<div class="text-lg font-bold">
				{!isWeekend(date.getDay()) ? shortWeekDays[date.getDay()] : ''}
			</div>
			<div class="font-light">{!isWeekend(date.getDay()) ? date.getDate() : ''}</div>
		</div>
	{/each}
</div>
