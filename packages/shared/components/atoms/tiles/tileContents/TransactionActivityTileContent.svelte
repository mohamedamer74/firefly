<script lang="typescript">
    import { localize } from '@core/i18n'
    import { networkHrp } from '@core/network'
    import {
        ActivityDirection,
        IPersistedAsset,
        getFormattedAmountFromActivity,
        TransactionActivity,
        selectedAccountAssets,
        getAssetFromPersistedAssets,
        getActivityTileTitle,
    } from '@core/wallet'
    import { truncateString } from '@core/utils'
    import { Text, AssetIcon, FontWeight } from 'shared/components'

    export let activity: TransactionActivity

    let asset: IPersistedAsset
    $: $selectedAccountAssets, (asset = getAssetFromPersistedAssets(activity.assetId))
    $: title = getActivityTileTitle(activity)
    $: subjectLocale = getSubjectLocale(activity)
    $: amount = getFormattedAmountFromActivity(activity)
    $: isIncoming = activity.direction === ActivityDirection.Incoming

    function getSubjectLocale(_activity: TransactionActivity): string {
        const { isShimmerClaiming, subject } = _activity
        if (isShimmerClaiming) {
            return localize('general.shimmerGenesis')
        }
        if (subject?.type === 'account') {
            return truncateString(subject?.account?.name, 13, 0)
        }
        if (subject?.type === 'address') {
            const address = activity.parsedLayer2Metadata?.ethereumAddress ?? subject?.address
            const hrpLength = activity.parsedLayer2Metadata ? '0x'.length : $networkHrp.length
            return truncateString(address, hrpLength, 6)
        }
        return localize('general.unknownAddress')
    }
</script>

<AssetIcon {asset} showVerifiedBadgeOnly />
<div class="flex flex-col w-full space-y-0.5">
    <div class="flex flex-row justify-between space-x-1">
        <Text
            fontWeight={FontWeight.semibold}
            lineHeight="140"
            classes="overflow-hidden overflow-ellipsis multiwrap-line2"
        >
            {localize(title)}
        </Text>
        <Text
            fontWeight={FontWeight.semibold}
            lineHeight="140"
            color={isIncoming ? 'blue-700' : ''}
            classes="whitespace-nowrap"
        >
            {amount}
        </Text>
    </div>
    <div class="flex flex-row justify-between">
        <Text fontWeight={FontWeight.medium} lineHeight="140" color="gray-600">
            {#if activity.direction === ActivityDirection.SelfTransaction}
                {localize('general.internalTransaction')}
            {:else}
                {localize(isIncoming ? 'general.fromAddress' : 'general.toAddress', {
                    values: { account: subjectLocale },
                })}
            {/if}
        </Text>
    </div>
</div>
