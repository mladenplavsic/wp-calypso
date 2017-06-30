/**
 * Internal dependencies
 */
import createSelector from 'lib/create-selector';
import { getSites } from 'state/selectors';

/**
 * Get all Jetpack sites
 *
 * @param {Object} state  Global state tree
 * @return {Array}        Array of Jetpack Sites objects
 */
export default createSelector(
	( state ) => {
		return getSites( state ).filter( site => site.jetpack );
	},
	( state ) => state.sites.items
);
