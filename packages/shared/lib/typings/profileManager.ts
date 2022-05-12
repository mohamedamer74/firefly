import { AccountId, CreateAccountPayload, EventType, NodeInfo } from '@iota/wallet'
import { StardustAccount } from './account'

export interface ProfileManager {
    getAccount(accountId: AccountId): Promise<StardustAccount>
    getAccounts(): Promise<StardustAccount[]>
    getNodeInfo(): Promise<NodeInfo>
    createAccount(account: CreateAccountPayload): Promise<StardustAccount>
    setStrongholdPassword(password: string): Promise<string>
    generateMnemonic(): Promise<string>
    storeMnemonic(mnemonic: string): Promise<string>
    verifyMnemonic(mnemonic: string): Promise<string>
    backup(destination: string, password: string): Promise<void>
    importAccounts(backupPath: string, password: string): Promise<string>
    listen(eventTypes: EventType[], callback: (error: Error, result: string) => void): void
}