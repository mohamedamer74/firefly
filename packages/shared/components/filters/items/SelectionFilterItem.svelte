<script lang="typescript">
    import type { SelectionFilterUnit } from '@core/wallet/interfaces'
    import { Dropdown } from 'shared/components'
    import { localize } from '@core/i18n'
    import type { IDropdownChoice } from '@core/utils'

    export let filterUnit: SelectionFilterUnit

    const choices: IDropdownChoice[] = filterUnit.choices.map((choice) => ({
        label: localize(`${filterUnit.localeKey}.${choice}`),
        value: choice,
    }))

    $: value = localize(`${filterUnit.localeKey}.${filterUnit.selected}`)

    function onSelect(item): void {
        filterUnit.selected = item.value
    }
</script>

<Dropdown {value} items={choices} {onSelect} small />
