<script lang="ts">
	import Header from '#lib/components/Header.svelte';
	import PostForm from '#lib/components/PostForm.svelte';
	import type { ActionData, PageData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();
</script>

<Header title="모집글 작성" backHref="/posts" alwaysCompact />

<PostForm initial={data.initial} submitLabel="모집글 등록" errorMessage={form?.error ?? ''} />
