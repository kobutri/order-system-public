<script lang="ts">
	import { PostSearchTransformer } from '$lib/searchTable/search';
	import Search from '$lib/searchTable/Search.svelte';
	import Table from '$lib/searchTable/Table.svelte';
	import type { Order, SupplierDisplay } from '$lib/utils/data';
	import type { Product } from '$lib/utils/product';
	import { formatEuro } from '$lib/utils/util';
	import {
		Button,
		ButtonGroup,
		Checkbox,
		DropdownHeader,
		DropdownItem,
		Helper,
		Input,
		Label,
		Modal,
		Rating,
		TableBodyCell,
		TableBodyRow,
		Tooltip
	} from 'flowbite-svelte';
	import { createEventDispatcher, tick } from 'svelte';
	import { Bookmark } from 'svelte-heros';
	import type { Writable } from 'svelte/store';
	import TooltipCell from './TooltipCell.svelte';

	export let products: Writable<Product[]>;
	export let suppliers: string[];
	export let defaults: Writable<Map<number, number>>;
	export let favorites: Writable<Set<number>>;
	export let selectedSuppliers: Set<string> = new Set(suppliers);
	export let orders: Writable<Map<number, Order>>;
	export let productLimit: number = 30;
	export let defaultsLimit: number = 30;
	export let orderEntryName: string;

	$: {
		let newSelectedSuppliers: Set<string> = new Set();
		selectedSuppliers.forEach((selected) => {
			if (suppliers.includes(selected)) {
				newSelectedSuppliers.add(selected);
			}
		});
	}

	$: emptyProductsSearchDisplay = [
		...Array.from($favorites).map((val) => $products[val]),
		...(() => {
			let elements: Product[] = [];
			for (
				let index = 0;
				index < $products.length && elements.length < productLimit + 1 - $favorites.size;
				index++
			) {
				if (!$favorites.has(index) && selectedSuppliers.has($products[index].Supplier)) {
					elements.push($products[index]);
				}
			}
			return elements;
		})()
	];

	$: emptySupplierSearchDisplay = suppliers.map((val) => ({
		display: val,
		name: val
	})) as SupplierDisplay[];

	$: emptyDefaultsSearchDisplay = [
		...Array.from($defaults.keys()).map((val) => $products[val]),
		...(() => {
			let elements: Product[] = [];
			for (
				let index = 0;
				index < $products.length && elements.length < defaultsLimit + 1 - $defaults.size;
				index++
			) {
				if (!$defaults.has(index)) {
					elements.push($products[index]);
				}
			}
			return elements;
		})()
	];

	const addProductDispatcher = createEventDispatcher<{
		addProduct: { index: number; amount: number };
	}>();

	let showAddProductModal = false;
	let productSearchOpen = false;
	let productToAdd = -1;
	let productAddAmount = '1';
	let input: HTMLElement;
	let productSearch: HTMLDivElement;

	$: {
		if (showAddProductModal && !productSearchOpen) {
			productSearchOpen = true;
		}
	}

	async function onShowModal() {
		if (input) {
			productAddAmount = '';
			await tick();
			(input.firstElementChild as HTMLInputElement).focus();
			(input.firstElementChild as HTMLInputElement).select();
		}
	}

	async function onHideModal() {
		await tick();
		if (productSearch) {
			productSearch.getElementsByTagName('input')[0].focus();
		}
	}

	function addProduct(index: number) {
		addProductDispatcher('addProduct', { index: index, amount: parseFloat(productAddAmount) });
	}

	function toggleFavorite(index: number) {
		favorites.update((favorites) => {
			if (favorites.has(index)) favorites.delete(index);
			else favorites.add(index);
			return favorites;
		});
	}

	function toggleSupplier(supplier: string) {
		if (selectedSuppliers.has(supplier)) {
			selectedSuppliers.delete(supplier);
		} else {
			selectedSuppliers.add(supplier);
		}
		selectedSuppliers = selectedSuppliers;
	}

	function setSelected(selected: string[], value: boolean) {
		selected.forEach((val) => {
			if (value) {
				selectedSuppliers.add(val);
			} else {
				selectedSuppliers.delete(val);
			}
		});
		selectedSuppliers = selectedSuppliers;
	}

	function toggleDefault(index: number) {
		if (!$defaults.has(index) && !$orders.has(index)) {
			orders.update((orders) => {
				orders.set(index, {
					UnitPrice: $products[index].UnitPrice,
					amount: 1,
					index: index,
					invalid: false
				});
				return orders;
			});
		}
		defaults.update((defaults) => {
			if (defaults.has(index)) {
				defaults.delete(index);
			} else {
				defaults.set(index, 1);
			}
			return defaults;
		});
	}

	function changeAmount(index: number, target: EventTarget) {
		let val: number = parseFloat((target as HTMLInputElement).value);
		defaults.update((defaults) => {
			defaults.set(index, val);
			return defaults;
		});
	}
</script>

<div class="flex gap-2">
	<Search
		items={suppliers}
		postTransformer={PostSearchTransformer.suppliers}
		alternativeItems={emptySupplierSearchDisplay}
		param={{}}
		placeholder="Lieferanten"
	>
		<svelte:fragment slot="results" let:items>
			<DropdownHeader>
				<ButtonGroup>
					<Button
						gradient
						color="green"
						on:click={() =>
							setSelected(
								items.map((val) => val.name),
								true
							)}>Alle Auswählen</Button
					>
					<Button
						gradient
						color="red"
						on:click={() =>
							setSelected(
								items.map((val) => val.name),
								false
							)}>keine Auswählen</Button
					>
				</ButtonGroup>
			</DropdownHeader>
			<ul class="p-3 space-y-1 overflow-y-auto py-1 max-h-72">
				{#each items as item}
					<DropdownItem>
						<Checkbox
							checked={selectedSuppliers.has(item.name)}
							on:click={() => toggleSupplier(item.name)}>{@html item.display}</Checkbox
						>
					</DropdownItem>
				{/each}
			</ul>
		</svelte:fragment>
	</Search>

	<div bind:this={productSearch}>
		<Search
			bind:dropdownOpen={productSearchOpen}
			items={$products}
			postTransformer={PostSearchTransformer.products}
			keys={['SupplierName', 'InternalName']}
			alternativeItems={emptyProductsSearchDisplay}
			param={{ selectedSuppliers: selectedSuppliers }}
			bind:limit={productLimit}
			placeholder="Produkte"
		>
			<svelte:fragment slot="results" let:items>
				<Table
					headerItems={[
						'',
						'interne Bezeichnung',
						'Lieferantenbezeichnung',
						'Gebindegröße',
						'Einheit',
						'Stückpreis',
						'Lieferant'
					]}
					hoverable
					bodyItems={items}
					hightLimited
				>
					<svelte:fragment slot="row" let:item>
						<div
							class="contents"
							on:click={() => {
								if (orderEntryName) {
									showAddProductModal = true;
									productToAdd = item.id;
								}
							}}
						>
							<TableBodyRow>
								<TableBodyCell>
									<Tooltip content="Favorit">
										<div class="content" on:click|stopPropagation={() => toggleFavorite(item.id)}>
											{#if $favorites.has(item.id)}
												<Rating total={1} rating={1} />
											{:else}
												<Rating total={1} rating={0} />
											{/if}
										</div>
									</Tooltip>
								</TableBodyCell>
								<TooltipCell>
									{@html item.InternalName}
								</TooltipCell>
								<TooltipCell>
									{@html item.SupplierName}
								</TooltipCell>
								<TableBodyCell>
									{item.ContainerSize.toLocaleString()}
								</TableBodyCell>
								<TableBodyCell>
									{item.ContainerUnit}
								</TableBodyCell>
								<TableBodyCell>
									{formatEuro(item.UnitPrice)}
								</TableBodyCell>
								<TableBodyCell>
									{item.Supplier}
								</TableBodyCell>
							</TableBodyRow>
						</div>
					</svelte:fragment>
					<svelte:fragment slot="footer">
						{#if productLimit < items.length}
							<Button on:click={() => (productLimit += 30)}>Zeige mehr</Button>
						{/if}
					</svelte:fragment>
				</Table>
			</svelte:fragment>
		</Search>
	</div>

	<div class="flex justify-end w-full">
		<Search
			items={$products}
			postTransformer={PostSearchTransformer.products}
			keys={['SupplierName', 'InternalName']}
			alternativeItems={emptyDefaultsSearchDisplay}
			param={{ selectedSuppliers: undefined }}
			bind:limit={defaultsLimit}
			placeholder="Defaults"
		>
			<svelte:fragment slot="results" let:items>
				<Table
					headerItems={[
						'',
						'interne Bezeichnung',
						'Lieferantenbezeichnung',
						'Gebindegröße',
						'Einheit',
						'Stückpreis',
						'Lieferant',
						'Menge'
					]}
					hoverable
					bodyItems={items}
					hightLimited
				>
					<svelte:fragment slot="row" let:item>
						<TableBodyRow>
							<TableBodyCell>
								<Tooltip content="Default">
									<div class="content" on:click|stopPropagation={() => toggleDefault(item.id)}>
										{#if $defaults.has(item.id)}
											<Bookmark variation="solid" />
										{:else}
											<Bookmark variation="outline" />
										{/if}
									</div>
								</Tooltip>
							</TableBodyCell>
							<TooltipCell>
								{@html item.InternalName}
							</TooltipCell>
							<TooltipCell>
								{@html item.SupplierName}
							</TooltipCell>
							<TableBodyCell>
								{item.ContainerSize.toLocaleString()}
							</TableBodyCell>
							<TableBodyCell>
								{item.ContainerUnit}
							</TableBodyCell>
							<TableBodyCell>
								{formatEuro(item.UnitPrice)}
							</TableBodyCell>
							<TableBodyCell>
								{item.Supplier}
							</TableBodyCell>
							<TableBodyCell>
								{#if $defaults.has(item.id)}
									<Input
										id="large-input"
										size="sm"
										placeholder="Large input"
										value={$defaults.get(item.id).toString()}
										on:change={(e) => changeAmount(item.id, e.target)}
										type="number"
										step="any"
									/>
								{/if}
							</TableBodyCell>
						</TableBodyRow>
					</svelte:fragment>
					{#if defaultsLimit < items.length}
						<Button slot="footer" on:click={() => (defaultsLimit += 30)}>Zeige mehr</Button>
					{/if}
				</Table>
			</svelte:fragment>
		</Search>
	</div>
</div>

<Modal bind:open={showAddProductModal} size="xs" on:show={onShowModal} on:hide={onHideModal}>
	<form class="flex flex-col space-y-6" on:submit|preventDefault={() => addProduct(productToAdd)}>
		<Label>Menge:</Label>
		<div class="contents" bind:this={input}>
			<Input type="number" bind:value={productAddAmount} step="any" />
		</div>
		{#if !Number.isNaN(parseFloat(productAddAmount)) && productToAdd >= 0}
			<Helper>
				{formatEuro($products[productToAdd].UnitPrice)} ⨯ {parseFloat(productAddAmount).toLocaleString()}
				{$products[productToAdd].ContainerUnit} = {formatEuro(
					$products[productToAdd].UnitPrice * parseFloat(productAddAmount)
				)}</Helper
			>
		{/if}
		<Button type="submit" disabled={Number.isNaN(parseFloat(productAddAmount))}>Hinzufügen</Button>
	</form>
</Modal>
