import Transform from 'src/rest/Transform'
import { Json } from 'src/utils/objects'
import { SearchRecord, SearchResults, FullRecord } from './domain'

export class TxSearchRecord extends Transform<SearchRecord>
{
	get id() {
		return this.$string(1)
	}

	get type() {
		return this.$string(2)
	}

	get name() {
		return this.$string(0)
	}

	get address() {
		return this.$string(3)
	}
}

export class TxSearchResults extends Transform<SearchResults>
{
	get total() {
		return this.$number(0)
	}

	get records() {
		return this.$suba(TxSearchRecord, 3)
	}
}

export class TxFullRecord extends Transform<FullRecord>
{
	/**
	 * Set target id before the transformation.
	 */
	$id: string | undefined

	$init(data: Json, id: string) {
		this.$id = id
		return super.$init(data)
	}

	/**
	 * Index in the resulting data.
	 */
	$index: number | undefined

	get id() {
		const ids = this.$array(1)
		if (!ids) {
			return
		}

		//~: search for the primary key in the resulting data
		this.$index = ids.findIndex(id => id === this.$id)

		return this.$id
	}

	get type() {
		return this.$string([3, this.$index, 2])
	}

	get name() {
		return this.$string([3, this.$index, 0])
	}

	get address() {
		return this.$string([3, this.$index, 3])
	}

	get gender() {
		return this.$string([2, 'gender', this.$index])
	}

	get country() {
		return this.$string([2, 'addr_practice.country', this.$index])
	}

	get state() {
		return this.$string([2, 'addr_practice.state', this.$index])
	}

	get city() {
		return this.$string([2, 'addr_practice.city', this.$index])
	}

	get phone() {
		return this.$string([2, 'addr_practice.phone', this.$index])
	}
}
