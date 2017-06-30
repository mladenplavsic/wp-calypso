/**
 * External dependencies
 */
import { expect } from 'chai';

/**
 * Internal dependencies
 */
import { getSelectedOrAllSitesWithPlugins } from '../';

const userState = {
	currentUser: {
		id: 12345678,
		capabilities: {}
	},
	users: {
		items: {
			12345678: {
				primary_blog: 2916288
			}
		}
	}
};

describe( 'getSelectedOrAllSitesWithPlugins()', () => {
	it( 'should return an empty array if no sites exist in state', () => {
		const state = {
			...userState,
			sites: {
				items: {}
			},
			ui: { selectedSiteId: 2916284 },
		};
		const sites = getSelectedOrAllSitesWithPlugins( state );
		expect( sites ).to.eql( [] );
	} );

	it( 'should return an empty array if the sites existing are not able to contain plugins', () => {
		const state = {
			...userState,
			sites: {
				items: {
					2916288: {
						ID: 2916288,
						visible: true,
						options: {
							unmapped_url: 'https://example.wordpress.com',
						},
					},
				}
			},
			ui: {},
		};
		const sites = getSelectedOrAllSitesWithPlugins( state );
		expect( sites ).to.eql( [] );
	} );

	it( 'should return an array with one site if just one site exists and is able to have plugins', () => {
		const state = {
			...userState,
			sites: {
				items: {
					2916288: {
						ID: 2916288,
						jetpack: true,
						visible: true,
						options: {
							unmapped_url: 'https://example.wordpress.com',
						},
						capabilities: {
							manage_options: true,
						}
					},
				}
			},
			ui: {},
		};
		const sites = getSelectedOrAllSitesWithPlugins( state );
		expect( sites ).to.have.length( 1 );
		expect( sites ).to.satisfy( ( sitesArray ) => sitesArray[ 0 ].ID === 2916288 );
	} );

	it( 'should return an array with all the sites able to have plugins', () => {
		const state = {
			...userState,
			sites: {
				items: {
					2916286: {
						ID: 2916286,
						jetpack: true,
						visible: true,
						options: {
							unmapped_url: 'https://example1.wordpress.com',
						},
						capabilities: {
							manage_options: true,
						}
					},
					2916287: {
						ID: 2916287,
						visible: true,
						options: {
							unmapped_url: 'https://example2.wordpress.com',
						},
					},
					2916289: {
						ID: 2916289,
						jetpack: true,
						visible: true,
						options: {
							unmapped_url: 'https://example3.wordpress.com',
						},
						capabilities: {
							manage_options: true,
						}
					},
				}
			},
			ui: {},
		};
		const sites = getSelectedOrAllSitesWithPlugins( state );
		expect( sites ).to.have.length( 2 );
		expect( sites ).to.satisfy( ( sitesArray ) => sitesArray[ 0 ].ID === 2916286 && sitesArray[ 1 ].ID === 2916289 );
	} );

	it( 'should return an array with the selected site if it is able to have plugins', () => {
		const state = {
			...userState,
			sites: {
				items: {
					2916286: {
						ID: 2916286,
						jetpack: true,
						visible: true,
						options: {
							unmapped_url: 'https://example1.wordpress.com',
						},
						capabilities: {
							manage_options: true,
						}
					},
					2916289: {
						ID: 2916289,
						jetpack: true,
						visible: true,
						options: {
							unmapped_url: 'https://example3.wordpress.com',
						},
						capabilities: {
							manage_options: true,
						}
					},
				}
			},
			ui: { selectedSiteId: 2916289 },
		};
		const sites = getSelectedOrAllSitesWithPlugins( state );
		expect( sites ).to.have.length( 1 );
		expect( sites ).to.satisfy( ( sitesArray ) => sitesArray[ 0 ].ID === 2916289 );
	} );

	it( 'should return an empty array if the selected site is not able to have plugins', () => {
		const state = {
			...userState,
			sites: {
				items: {
					2916286: {
						ID: 2916286,
						jetpack: true,
						visible: true,
						options: {
							unmapped_url: 'https://example1.wordpress.com',
						},
						capabilities: {
							manage_options: true,
						}
					},
					2916287: {
						ID: 2916287,
						visible: true,
						options: {
							unmapped_url: 'https://example2.wordpress.com',
						},
					}
				}
			},
			ui: { selectedSiteId: 2916287 },
		};
		const sites = getSelectedOrAllSitesWithPlugins( state );
		expect( sites ).to.eql( [] );
	} );
} );
