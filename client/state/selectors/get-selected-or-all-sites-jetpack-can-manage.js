/**
 * External dependencies
 */
import { get } from 'lodash';

/**
 * Internal dependencies
 */
import { getSelectedOrAllSites } from 'state/selectors';

/**
 * Return an array with the selected site or all sites
 * filtering the ones Jetpack can manage (equivalent to sitesList.getSelectedOrAllJetpackCanManage)
 *
 * @param {Object} state  Global state tree
 * @return {Array}        Array of Sites objects with the result
 */
export default ( state ) => {
	return getSelectedOrAllSites( state ).filter( ( site ) =>
			site.jetpack &&
			site.canManage &&
			get( site, 'capabilities.manage_options', false )
	);
};
