import { FEATURE_TYPE_METADATA } from '../../../constants'
import { IMetadataFeature } from '@iota/types'
import { Converter } from '@core/utils'
import { Output } from '@core/wallet/types'

export function getMetadataFromOutput(output: Output): string {
    const { data } = <IMetadataFeature>output?.features?.find((feature) => feature.type === FEATURE_TYPE_METADATA) ?? {
        data: undefined,
    }
    if (data) {
        return Converter.hexToUtf8(data)
    }
}