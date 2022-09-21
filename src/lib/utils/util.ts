import { writable } from 'svelte/store';

export function insertIntoSorted(arr: string[], val: string) {
	if (arr.length === 0) {
		arr.splice(0, 0, val);
		return;
	}
	if (arr[0] > val) {
		arr.splice(0, 0, val);
		return;
	}
	if (arr[-1] < val) {
		arr.splice(arr.length, 0, val);
		return;
	}
	let start = 0;
	let end = arr.length;
	while (end - start > 1) {
		const middle = Math.trunc((end - start) / 2) + start;
		const middleVal = arr[middle];
		if (middleVal === val) {
			arr.splice(middle, 0, val);
		} else if (middleVal < val) start = middle;
		else end = middle;
	}
	arr.splice(start + 1, 0, val);
}

export function formatEuro(val: number) {
	return `${(Math.round(val * 100) / 100).toLocaleString()}€`;
}

export function arrayEquals(a, b) {
	return a.length === b.length && a.every((v, i) => v === b[i]);
}

export const dataChanged = writable(0);
