<script lang="ts">
	import { enhance } from '$app/forms';
	import { resolve } from '$app/paths';
	import type { ActionData } from './$types';

	let { form }: { form: ActionData } = $props();
</script>

<section class="onboarding-page">
	<div class="progress-bar" aria-hidden="true">
		<div class="progress-bar__fill" style="width: 100%"></div>
	</div>

	<div class="onboarding-inner">
		<div class="heading-block">
			<p class="eyebrow">roommate</p>
			<h1 class="serif-heading">다시 만나서 반가워요</h1>
			<p class="helper">생활 패턴이 잘 맞는 룸메이트와 대화를 이어가 보세요.</p>
		</div>

		<form class="form-stack" method="POST" use:enhance>
			{#if form?.error}
				<p class="error-banner" role="alert">{form.error}</p>
			{/if}

			<label class="soft-input">
				<span class="soft-input__label">이메일</span>
				<input
					name="email"
					type="email"
					placeholder="example@university.ac.kr"
					value={form?.email ?? ''}
					autocomplete="email"
					required
				/>
			</label>

			<label class="soft-input">
				<span class="soft-input__label">비밀번호</span>
				<input
					name="password"
					type="password"
					placeholder="비밀번호 입력"
					autocomplete="current-password"
					required
				/>
			</label>

			<div class="submit-wrap">
				<button class="btn-pill submit-btn" type="submit">계속하기</button>
			</div>

			<p class="switch-link">
				처음이신가요? <a href={resolve('/signup')}>회원가입</a>
			</p>
		</form>
	</div>
</section>

<style>
	.onboarding-page {
		min-height: 100%;
		display: flex;
		flex-direction: column;
	}

	.progress-bar {
		width: 100%;
		height: 2px;
		background: rgba(0, 0, 0, 0.08);
	}

	.progress-bar__fill {
		height: 100%;
		background: var(--text-primary);
	}

	.onboarding-inner {
		flex: 1;
		display: flex;
		flex-direction: column;
		justify-content: center;
		gap: 28px;
		padding: 36px 24px 48px;
	}

	.heading-block {
		text-align: center;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 10px;
	}

	.eyebrow {
		margin: 0;
		font-size: 12px;
		font-weight: 700;
		letter-spacing: 0.1em;
		text-transform: uppercase;
		color: var(--text-muted);
	}

	.heading-block h1 {
		margin: 0;
		font-size: 28px;
		font-weight: 700;
		color: var(--text-primary);
	}

	.helper {
		margin: 0;
		max-width: 280px;
		font-size: 13.5px;
		line-height: 1.5;
		color: var(--text-secondary);
	}

	.form-stack {
		display: flex;
		flex-direction: column;
		gap: 14px;
	}

	.error-banner {
		margin: 0;
		padding: 12px 14px;
		border-radius: 14px;
		background: var(--danger-soft);
		color: var(--danger);
		font-size: 13px;
		font-weight: 500;
		text-align: center;
	}

	.soft-input {
		display: flex;
		flex-direction: column;
		gap: 4px;
		padding: 12px 16px;
		border-radius: 16px;
		border: 1px solid rgba(0, 0, 0, 0.1);
		background: rgba(255, 255, 255, 0.45);
		transition:
			border-color 150ms ease,
			background-color 150ms ease;
	}

	.soft-input:focus-within {
		border-color: var(--text-primary);
		background: rgba(255, 255, 255, 0.8);
	}

	.soft-input__label {
		font-size: 11.5px;
		font-weight: 500;
		color: var(--text-muted);
	}

	.soft-input input {
		border: 0;
		padding: 0;
		background: transparent;
		font-size: 16px;
		font-weight: 500;
		color: var(--text-primary);
		outline: none;
	}

	.soft-input input::placeholder {
		color: #a6a39d;
		font-weight: 400;
	}

	.submit-wrap {
		display: flex;
		justify-content: center;
		margin-top: 12px;
	}

	.submit-btn {
		min-width: 170px;
	}

	.switch-link {
		margin: 8px 0 0;
		text-align: center;
		font-size: 13.5px;
		color: var(--text-secondary);
	}

	.switch-link a {
		color: var(--text-primary);
		font-weight: 700;
		text-decoration: underline;
		text-underline-offset: 3px;
	}
</style>
