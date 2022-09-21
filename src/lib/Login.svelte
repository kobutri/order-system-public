<script lang="ts">
	import { signInWithEmailAndPassword } from 'firebase/auth';
	import { Button, Helper, Input, Label } from 'flowbite-svelte';

	import { auth, user } from '../Firebase';

	let email: string;
	let password: string;

	function onSubmit(e: any) {
		let result = signInWithEmailAndPassword(auth, email, password);
		result.then((cred) => {
			email = '';
			password = '';
		});
		result.catch((err) => {
			alert(`Login fehlgeschlagen: ${err}`);
		});
	}
</script>

<div class="flex items-center justify-end gap-3">
	{#if $user != null}
		<p class="text-white">{$user?.displayName ?? $user?.email}</p>
		<button
			type="button"
			class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-1 px-4 rounded focus:outline-none focus:shadow-outline"
			on:click={async () => {
				await auth.signOut();
				$user = null;
			}}>Log out</button
		>
{:else}
		<form class="flex justify-end gap-6" on:submit|preventDefault={onSubmit}>
			<div class="flex items-center">
				<Label for="email" class="mr-2">Email</Label>
				<Input size="sm" id="email" type="text" placeholder="Email" bind:value={email} />
			</div>
			<div class=" flex items-center">
				<Label class="mr-2" for="password"> Passwort </Label>
				<Input
					size='sm'
					id="password"
					type="password"
					placeholder="*******"
					bind:value={password}
				/>
			</div>
			<div class="flex items-center justify-between">
				<Button
					size="sm"
					type="submit"
				>
					Login
			</Button>
			</div>
		</form>
{/if}

</div>

