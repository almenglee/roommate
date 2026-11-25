<script lang="ts">
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import Header from '#lib/components/Header.svelte';
	import PostForm from '#lib/components/PostForm.svelte';
	import type { ActionData, PageData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();
</script>

<Header
	title="모집글 수정"
	onBack={() => void goto(resolve('/posts/[id]', { id: data.postId }))}
	alwaysCompact
/>

<PostForm initial={data.initial} submitLabel="수정 완료" errorMessage={form?.error ?? ''} />
