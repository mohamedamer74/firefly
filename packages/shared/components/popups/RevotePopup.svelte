<script lang="typescript">
    import { Button, Text, TextHint, HTMLButtonType, TextType } from 'shared/components'
    import { selectedAccount } from '@core/account/stores'
    import { localize } from '@core/i18n'
    import { closePopup } from '@auxiliary/popup/actions'
    import { checkActiveProfileAuth } from '@core/profile/actions'
    import { onDestroy } from 'svelte'
    import { hasToRevote } from '@contexts/governance/stores'
    import { vote } from '@contexts/governance/actions'

    $: disabled = $selectedAccount?.isTransferring

    function onCancelClick(): void {
        closePopup()
    }

    async function onSubmit(): Promise<void> {
        await checkActiveProfileAuth(async () => {
            await vote()
            closePopup()
        })
    }

    onDestroy(() => {
        $hasToRevote = false
    })
</script>

<form id="manage-voting-power" class="space-y-5" on:submit|preventDefault={onSubmit}>
    <Text type={TextType.h4} classes="mb-3">{localize('popups.revote.title')}</Text>
    <Text type={TextType.p} secondary>{localize('popups.revote.body')}</Text>
    <TextHint info text={localize('popups.revote.hint')} />
    <div class="flex flex-row flex-nowrap w-full space-x-4">
        <Button outline classes="w-full" {disabled} onClick={onCancelClick}>
            {localize('actions.cancel')}
        </Button>
        <Button type={HTMLButtonType.Submit} {disabled} isBusy={disabled} classes="w-full">
            {localize('actions.revote')}
        </Button>
    </div>
</form>
