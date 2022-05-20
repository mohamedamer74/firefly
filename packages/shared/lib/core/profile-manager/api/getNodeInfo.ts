import { IAuth, INodeInfoResponse } from '@core/network'
import { get } from 'svelte/store'
import { profileManager } from '../store'

export function getNodeInfo(url?: string, auth?: IAuth): Promise<INodeInfoResponse> {
    const manager = get(profileManager)
    return manager.getNodeInfo(url, auth)
}