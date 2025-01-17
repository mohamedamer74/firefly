import { showAppNotification } from '@auxiliary/notification'
import { selectedAccount } from '@core/account/stores/selected-account.store'
import { handleError } from '@core/error/handlers/handleError'
import { localize } from '@core/i18n'
import { handleLedgerError } from '@core/ledger'
import { updateNftInAllAccountNfts } from '@core/nfts'
import { activeProfile, ProfileType } from '@core/profile'
import { get } from 'svelte/store'
import { addActivitiesToAccountActivitiesInAllAccountActivities } from '../stores'
import { generateActivities, preprocessTransaction } from '../utils'

export async function burnNft(nftId: string): Promise<void> {
    const account = get(selectedAccount)
    const _activeProfile = get(activeProfile)
    try {
        const burnNftTransaction = await account.burnNft(nftId)

        // Generate Activity
        const processedTransaction = await preprocessTransaction(burnNftTransaction, account)
        const activities = generateActivities(processedTransaction, account)
        addActivitiesToAccountActivitiesInAllAccountActivities(account.index, activities)

        // Update NFT
        updateNftInAllAccountNfts(account.index, nftId, { isSpendable: false })

        showAppNotification({
            type: 'success',
            message: localize('notifications.burnNft.success'),
            alert: true,
        })
    } catch (err) {
        if (_activeProfile.type === ProfileType.Ledger) {
            handleLedgerError(err.error)
        } else {
            handleError(err)
        }
        throw err
    }
}
