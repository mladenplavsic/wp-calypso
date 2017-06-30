/**
 * External dependencies
 */
import { get } from 'lodash';

/**
 * Internal dependencies
 */
import { getSelectedOrAllSites } from 'state/selectors';
import { getSelectedSiteId } from 'state/ui/selectors';

/**
 * Return an array with the selected site or all sites
 * filtering the ones able to have plugins (equivalent to sitesList.getSelectedOrAllWithPlugins)
 *
 * @param {Object} state  Global state tree
 * @return {Array}        Array of Sites objects with the result
 */
export default ( state ) => {
	return getSelectedOrAllSites( state ).filter( ( site ) =>
			site.jetpack &&
			get( site, 'capabilities.manage_options', false ) &&
			( site.visible || !! getSelectedSiteId( state ) )
	);
};
