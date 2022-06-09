import { INode } from '@core/network'
import { updateNewProfileSettings } from '@core/profile'
import { NetworkProtocol, NetworkType } from '../enums'
import { buildClientOptions } from '../helpers'
import { getNetwork } from '../utils'

export function updateNewProfileNetworkClientOptions(
    networkProtocol: NetworkProtocol,
    networkType: NetworkType,
    nodes: INode[]
): void {
    const clientOptions = buildClientOptions(getNetwork(networkProtocol, networkType), nodes)
    updateNewProfileSettings({ clientOptions })
}