import { AnyAction } from 'redux'
import ThunkUnit from './ThunkUnit'

/**
 * Unit responsible for making asynchronous query, transforming
 * the result, reducing or reporting it with else unit.
 *
 * Any active unit may issue Ajax requests. A thunk or saga unit
 * may do many things. In contrary, rest unit has single goal.
 */
export default abstract class RestUnit<LocalType extends Object = Object>
	extends ThunkUnit<LocalType>
{

}
