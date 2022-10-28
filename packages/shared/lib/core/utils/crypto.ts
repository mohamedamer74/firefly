/* eslint-disable no-bitwise */

import { localize } from '@core/i18n'

import { convertBytesToHexString } from './convert'

export function validateBech32Address(prefix: string, addr: string): string {
    if (!addr || !addr.startsWith(prefix)) {
        return localize('error.send.wrongAddressPrefix', {
            values: {
                prefix: prefix,
            },
        })
    }
    if (!new RegExp(`^${prefix}1[02-9ac-hj-np-z]{59}$`).test(addr)) {
        return localize('error.send.wrongAddressFormat')
    }

    let isValid = false
    try {
        const decoded = Bech32.decode(addr)
        isValid = decoded && decoded.humanReadablePart === prefix
    } catch (err) {
        console.error('error.crypto.cannotDecodeBech32')
    }

    if (!isValid) {
        return localize('error.send.invalidAddress')
    }
}

export function isValidBech32AddressAndPrefix(address: string, expectedAddressPrefix: string): boolean {
    return new RegExp(`^${expectedAddressPrefix}1[02-9ac-hj-np-z]{59}$`).test(address)
}

export function convertBech32AddressToEd25519Address(bech32Address: string, includeTypeByte: boolean = false): string {
    if (!bech32Address) return ''

    return convertBytesToHexString(Array.from(Bech32.decode(bech32Address).data).slice(includeTypeByte ? 0 : 1))
}

// Copyright 2020 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

/**
 * Class to help with Bech32 encoding/decoding
 * Based on reference implementation https://github.com/sipa/bech32/blob/master/ref/javascript/bech32.js
 */
export class Bech32 {
    /**
     * The alphabet to use.
     * @internal
     */
    private static readonly CHARSET: string = 'qpzry9x8gf2tvdw0s3jn54khce6mua7l'

    /**
     * The separator between human readable part and data.
     * @internal
     */
    private static readonly SEPARATOR: string = '1'

    /**
     * The generator constants;
     * @internal
     */
    private static readonly GENERATOR: Uint32Array = Uint32Array.from([
        0x3b6a57b2, 0x26508e6d, 0x1ea119fa, 0x3d4233dd, 0x2a1462b3,
    ])

    /**
     * Encode the buffer.
     * @param humanReadablePart The header
     * @param data The data to encode.
     * @returns The encoded data.
     */
    public static encode(humanReadablePart: string, data: Uint8Array): string {
        return Bech32.encode5BitArray(humanReadablePart, Bech32.to5Bit(data))
    }

    /**
     * Encode the 5 bit data buffer.
     * @param humanReadablePart The header
     * @param data5Bit The data to encode.
     * @returns The encoded data.
     */
    public static encode5BitArray(humanReadablePart: string, data5Bit: Uint8Array): string {
        const checksum = Bech32.createChecksum(humanReadablePart, data5Bit)

        let ret = `${humanReadablePart}${Bech32.SEPARATOR}`

        for (let i = 0; i < data5Bit.length; i++) {
            ret += Bech32.CHARSET.charAt(data5Bit[i])
        }

        for (let i = 0; i < checksum.length; i++) {
            ret += Bech32.CHARSET.charAt(checksum[i])
        }

        return ret
    }

    /**
     * Decode a bech32 string.
     * @param bech The text to decode.
     * @returns The decoded data or undefined if it could not be decoded.
     */
    public static decode(bech: string):
        | {
              humanReadablePart: string
              data: Uint8Array
          }
        | undefined {
        const result = Bech32.decodeTo5BitArray(bech)
        return result
            ? {
                  humanReadablePart: result.humanReadablePart,
                  data: Bech32.from5Bit(result.data),
              }
            : undefined
    }

    /**
     * Decode a bech32 string to 5 bit array.
     * @param bech The text to decode.
     * @returns The decoded data or undefined if it could not be decoded.
     */
    public static decodeTo5BitArray(bech: string):
        | {
              humanReadablePart: string
              data: Uint8Array
          }
        | undefined {
        bech = bech.toLowerCase()

        const separatorPos = bech.lastIndexOf(Bech32.SEPARATOR)
        if (separatorPos === -1) {
            throw new Error(`There is no separator character ${Bech32.SEPARATOR} in the data`)
        }

        if (separatorPos < 1) {
            throw new Error(`The separator position is ${separatorPos}, which is too early in the string`)
        }

        if (separatorPos + 7 > bech.length) {
            throw new Error(`The separator position is ${separatorPos}, which doesn't leave enough space for data`)
        }

        const data = new Uint8Array(bech.length - separatorPos - 1)
        let idx = 0

        for (let i = separatorPos + 1; i < bech.length; i++) {
            const d = Bech32.CHARSET.indexOf(bech.charAt(i))
            if (d === -1) {
                throw new Error(`Data contains characters not in the charset ${bech.charAt(i)}`)
            }
            data[idx++] = Bech32.CHARSET.indexOf(bech.charAt(i))
        }

        const humanReadablePart = bech.slice(0, separatorPos)

        if (!Bech32.verifyChecksum(humanReadablePart, data)) {
            return
        }

        return { humanReadablePart, data: data.slice(0, -6) }
    }

    /**
     * Convert the input bytes into 5 bit data.
     * @param bytes The bytes to convert.
     * @returns The data in 5 bit form.
     */
    public static to5Bit(bytes: Uint8Array): Uint8Array {
        return Bech32.convertBits(bytes, 8, 5, true)
    }

    /**
     * Convert the 5 bit data to 8 bit.
     * @param fiveBit The 5 bit data to convert.
     * @returns The 5 bit data converted to 8 bit.
     */
    public static from5Bit(fiveBit: Uint8Array): Uint8Array {
        return Bech32.convertBits(fiveBit, 5, 8, false)
    }

    /**
     * Does the given string match the bech32 pattern.
     * @param humanReadablePart The human readable part.
     * @param bech32Text The text to test.
     * @returns True if this is potentially a match.
     */
    public static matches(humanReadablePart: string, bech32Text?: string): boolean {
        if (!bech32Text) {
            return false
        }
        const regEx = new RegExp(`^${humanReadablePart}1[${Bech32.CHARSET}]{6,}$`)
        return regEx.test(bech32Text)
    }

    /**
     * Create the checksum from the human redable part and the data.
     * @param humanReadablePart The human readable part.
     * @param data The data.
     * @returns The checksum.
     * @internal
     */
    private static createChecksum(humanReadablePart: string, data: Uint8Array): Uint8Array {
        const expanded = Bech32.humanReadablePartExpand(humanReadablePart)

        const values = new Uint8Array(expanded.length + data.length + 6)
        values.set(expanded, 0)
        values.set(data, expanded.length)
        values.set([0, 0, 0, 0, 0, 0], expanded.length + data.length)

        const mod = Bech32.polymod(values) ^ 1

        const ret = new Uint8Array(6)
        for (let i = 0; i < 6; i++) {
            ret[i] = (mod >> (5 * (5 - i))) & 31
        }
        return ret
    }

    /**
     * Verify the checksum given the humarn readable part and data.
     * @param humanReadablePart The human redable part to validate the checksum.
     * @param data The data to validate the checksum.
     * @returns True if the checksum was verified.
     * @internal
     */
    private static verifyChecksum(humanReadablePart: string, data: Uint8Array): boolean {
        const expanded = Bech32.humanReadablePartExpand(humanReadablePart)

        const values = new Uint8Array(expanded.length + data.length)
        values.set(expanded, 0)
        values.set(data, expanded.length)

        return Bech32.polymod(values) === 1
    }

    /**
     * Calculate the polymod of the values.
     * @param values The values to calculate the polymod for.
     * @returns The polymod of the values.
     * @internal
     */
    private static polymod(values: Uint8Array): number {
        let chk = 1
        for (let p = 0; p < values.length; p++) {
            const top = chk >> 25
            chk = ((chk & 0x1ffffff) << 5) ^ values[p]
            for (let i = 0; i < 5; ++i) {
                if ((top >> i) & 1) {
                    chk ^= Bech32.GENERATOR[i]
                }
            }
        }
        return chk
    }

    /**
     * Expand the human readable part.
     * @param humanReadablePart The human readable part to expand.
     * @returns The expanded human readable part.
     * @internal
     */
    private static humanReadablePartExpand(humanReadablePart: string): Uint8Array {
        const ret = new Uint8Array(humanReadablePart.length * 2 + 1)
        let idx = 0
        for (let i = 0; i < humanReadablePart.length; i++) {
            ret[idx++] = humanReadablePart.charCodeAt(i) >> 5
        }
        ret[idx++] = 0
        for (let i = 0; i < humanReadablePart.length; i++) {
            ret[idx++] = humanReadablePart.charCodeAt(i) & 31
        }
        return ret
    }

    /**
     * Convert input data from one bit resolution to another.
     * @param data The data to convert.
     * @param fromBits The resolution of the input data.
     * @param toBits The required resolution of the output data.
     * @param padding Include padding in the output.
     * @returns The converted data,
     * @internal
     */
    private static convertBits(data: Uint8Array, fromBits: number, toBits: number, padding: boolean): Uint8Array {
        let value = 0
        let bits = 0
        const maxV = (1 << toBits) - 1
        const res = []

        for (let i = 0; i < data.length; i++) {
            value = (value << fromBits) | data[i]
            bits += fromBits

            while (bits >= toBits) {
                bits -= toBits
                res.push((value >> bits) & maxV)
            }
        }

        if (padding) {
            if (bits > 0) {
                res.push((value << (toBits - bits)) & maxV)
            }
        } else {
            if (bits >= fromBits) {
                throw new Error('Excess padding')
            }
            if ((value << (toBits - bits)) & maxV) {
                throw new Error('Non-zero padding')
            }
        }
        return new Uint8Array(res)
    }
}

/**
 * Convert address to bech32.
 */
export class Bech32Helper {
    /**
     * The default human readable part of the bech32 addresses for mainnet, currently 'iota'.
     */
    public static BECH32_DEFAULT_HRP_MAIN: string = 'iota'

    /**
     * The default human readable part of the bech32 addresses for devnet, currently 'atoi'.
     */
    public static BECH32_DEFAULT_HRP_DEV: string = 'atoi'

    /**
     * Encode an address to bech32.
     * @param addressType The address type to encode.
     * @param addressBytes The address bytes to encode.
     * @param humanReadablePart The human readable part to use.
     * @returns The array formated as hex.
     */
    public static toBech32(addressType: number, addressBytes: Uint8Array, humanReadablePart: string): string {
        const addressData = new Uint8Array(1 + addressBytes.length)
        addressData[0] = addressType
        addressData.set(addressBytes, 1)
        return Bech32.encode(humanReadablePart, addressData)
    }

    /**
     * Decode an address from bech32.
     * @param bech32Text The bech32 text to decode.
     * @param humanReadablePart The human readable part to use.
     * @returns The address type and address bytes or undefined if it cannot be decoded.
     */
    public static fromBech32(
        bech32Text: string,
        humanReadablePart: string
    ):
        | {
              addressType: number
              addressBytes: Uint8Array
          }
        | undefined {
        const decoded = Bech32.decode(bech32Text)
        if (decoded) {
            if (decoded.humanReadablePart !== humanReadablePart) {
                throw new Error(
                    `The hrp part of the address should be ${humanReadablePart}, it is ${decoded.humanReadablePart}`
                )
            }

            if (decoded.data.length === 0) {
                throw new Error('The data part of the address should be at least length 1, it is 0')
            }

            const addressType = decoded.data[0]
            const addressBytes = decoded.data.slice(1)

            return {
                addressType,
                addressBytes,
            }
        }
    }

    /**
     * Does the provided string look like it might be an bech32 address with matching hrp.
     * @param bech32Text The bech32 text to text.
     * @param humanReadablePart The human readable part to match.
     * @returns True if the passed address matches the pattern for a bech32 address.
     */
    public static matches(bech32Text: string, humanReadablePart: string): boolean {
        return Bech32.matches(humanReadablePart, bech32Text)
    }
}