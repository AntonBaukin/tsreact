import Transform from 'src/rest/Transform'
import { SearchRecord, SearchResults } from './domain'

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
