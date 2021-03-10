import { useEffect } from 'react'
import { connect } from 'react-redux'
import classNames from 'classnames'
import Text from 'src/components/Text'
import Scrollbars from 'src/components/Scrollbars'
import { isFullRecord } from 'src/main/data/npi/domain'
import { PropTypes, propTypes, defaultProps, mapStateToProps } from './props'
import styles from './styles.module.scss'

const Record = (props: any) => {
	const { id, record, onFetchRecord, onGoBack } = props as PropTypes

	if (!id) {
		return null
	}

	useEffect(
		() => {
			if (record && isFullRecord(record)) {
				return
			}

			onFetchRecord(id)
		},
		[id, record, onFetchRecord]
	)

	if (!record) {
		return null
	}

	return (
		<div className={styles.record}>
			<Scrollbars>
				<div className={styles.entries}>
					{Object.entries(record).map(([key, value], index) => (
						<div
							key={key}
							className={classNames({
								[styles.field]: true,
								[styles.even]: index % 2 === 0,
								[styles.odd]: index % 2 === 1,
							})}
						>
							{value}
						</div>
					))}
				</div>

				<div className={styles.back}>
					<button
						className="btn btn-dark"
						onClick={onGoBack}
					>
						<Text>RECORD_BACK</Text>
					</button>
				</div>
			</Scrollbars>
		</div>
	)
}

Record.propTypes = propTypes
Record.defaultProps = defaultProps

export default connect(mapStateToProps)(Record)
