import { get } from 'svelte/store'
import { hasToRevote } from '@contexts/governance/stores'
import { syncVotingPower } from '@core/account'
import { updateNftInAllAccountNfts } from '@core/nfts'

import { ActivityAction, ActivityDirection, ActivityType, InclusionState } from '@core/wallet'
import { updateClaimingTransactionInclusion } from '@core/wallet/actions/activities/updateClaimingTransactionInclusion'
import {
    getActivityByTransactionId,
    updateActivityByTransactionId,
} from '@core/wallet/stores/all-account-activities.store'

import { WalletApiEvent } from '../../enums'
import { ITransactionInclusionEventPayload } from '../../interfaces'
import { validateWalletApiEvent } from '../../utils'
import { closePopup, openPopup } from '@auxiliary/popup/actions'

export function handleTransactionInclusionEvent(error: Error, rawEvent: string): void {
    const { accountIndex, payload } = validateWalletApiEvent(error, rawEvent, WalletApiEvent.TransactionInclusion)
    /* eslint-disable @typescript-eslint/no-unnecessary-type-assertion */
    handleTransactionInclusionEventInternal(accountIndex, payload as ITransactionInclusionEventPayload)
}

export function handleTransactionInclusionEventInternal(
    accountIndex: number,
    payload: ITransactionInclusionEventPayload
): void {
    const { inclusionState, transactionId } = payload
    updateActivityByTransactionId(accountIndex, transactionId, { inclusionState })

    const activity = getActivityByTransactionId(accountIndex, transactionId)

    if (activity?.type === ActivityType.Nft) {
        const isSpendable =
            (activity.direction === ActivityDirection.Incoming ||
                activity.direction === ActivityDirection.SelfTransaction) &&
            activity.action !== ActivityAction.Burn
        updateNftInAllAccountNfts(accountIndex, activity.nftId, { isSpendable })
    }

    if (activity?.type === ActivityType.Governance) {
        if (get(hasToRevote) && inclusionState === InclusionState.Confirmed) {
            closePopup(true)
            openPopup({
                type: 'revote',
            })
        }
        syncVotingPower(accountIndex)
    }

    updateClaimingTransactionInclusion(transactionId, inclusionState, accountIndex)
}
