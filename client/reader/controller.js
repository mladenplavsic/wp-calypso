/**
 * External Dependencies
 */
import ReactDom from 'react-dom';
import React from 'react';
import page from 'page';
import i18n from 'i18n-calypso';

/**
 * Internal Dependencies
 */
import { abtest } from 'lib/abtest';
import route from 'lib/route';
import feedLookup from 'lib/feed-lookup';
import feedStreamFactory from 'lib/feed-stream-store';
import {
	ensureStoreLoading,
	trackPageLoad,
	trackUpdatesLoaded,
	trackScrollPage,
	setPageTitle,
} from './controller-helper';
import FeedError from 'reader/feed-error';
import StreamComponent from 'reader/following/main';
import { getPrettyFeedUrl, getPrettySiteUrl } from 'reader/route';
import { recordTrack } from 'reader/stats';
import { preload } from 'sections-preload';
import { renderWithReduxStore } from 'lib/react-helpers';
import AsyncLoad from 'components/async-load';

const analyticsPageTitle = 'Reader';

const activeAbTests = [
	// active tests would go here
];
let lastRoute = null;

function userHasHistory( context ) {
	return !! context.lastRoute;
}

function renderFeedError( context ) {
	renderWithReduxStore(
		React.createElement( FeedError ),
		document.getElementById( 'primary' ),
		context.store
	);
}

const exported = {
	initAbTests( context, next ) {
		// spin up the ab tests that are currently active for the reader
		activeAbTests.forEach( test => abtest( test ) );
		next();
	},

	prettyRedirects( context, next ) {
		// Do we have a 'pretty' site or feed URL?
		let redirect;
		if ( context.params.blog_id ) {
			redirect = getPrettySiteUrl( context.params.blog_id );
		} else if ( context.params.feed_id ) {
			redirect = getPrettyFeedUrl( context.params.feed_id );
		}

		if ( redirect ) {
			return page.redirect( redirect );
		}

		next();
	},

	legacyRedirects( context, next ) {
		const legacyPathRegexes = {
			feedStream: /^\/read\/blog\/feed\/([0-9]+)$/i,
			feedFullPost: /^\/read\/post\/feed\/([0-9]+)\/([0-9]+)$/i,
			blogStream: /^\/read\/blog\/id\/([0-9]+)$/i,
			blogFullPost: /^\/read\/post\/id\/([0-9]+)\/([0-9]+)$/i,
		};

		if ( context.path.match( legacyPathRegexes.feedStream ) ) {
			page.redirect( `/read/feeds/${ context.params.feed_id }` );
		} else if ( context.path.match( legacyPathRegexes.feedFullPost ) ) {
			page.redirect( `/read/feeds/${ context.params.feed_id }/posts/${ context.params.post_id }` );
		} else if ( context.path.match( legacyPathRegexes.blogStream ) ) {
			page.redirect( `/read/blogs/${ context.params.blog_id }` );
		} else if ( context.path.match( legacyPathRegexes.blogFullPost ) ) {
			page.redirect( `/read/blogs/${ context.params.blog_id }/posts/${ context.params.post_id }` );
		}

		next();
	},

	updateLastRoute( context, next ) {
		if ( lastRoute ) {
			context.lastRoute = lastRoute;
		}
		lastRoute = context.path;
		next();
	},

	incompleteUrlRedirects( context, next ) {
		let redirect;
		// Have we arrived at a URL ending in /posts? Redirect to feed stream/blog stream
		if ( context.path.match( /^\/read\/feeds\/([0-9]+)\/posts$/i ) ) {
			redirect = `/read/feeds/${ context.params.feed_id }`;
		} else if ( context.path.match( /^\/read\/blogs\/([0-9]+)\/posts$/i ) ) {
			redirect = `/read/blogs/${ context.params.blog_id }`;
		}

		if ( redirect ) {
			return page.redirect( redirect );
		}

		next();
	},

	preloadReaderBundle( context, next ) {
		preload( 'reader' );
		next();
	},

	sidebar( context, next ) {
		renderWithReduxStore(
			<AsyncLoad require="reader/sidebar" path={ context.path } />,
			document.getElementById( 'secondary' ),
			context.store
		);

		next();
	},

	unmountSidebar( context, next ) {
		ReactDom.unmountComponentAtNode( document.getElementById( 'secondary' ) );
		next();
	},

	following( context ) {
		const basePath = route.sectionify( context.path ),
			fullAnalyticsPageTitle = analyticsPageTitle + ' > Following',
			followingStore = feedStreamFactory( 'following' ),
			mcKey = 'following';

		const recommendationsStore = feedStreamFactory( 'custom_recs_posts_with_images' );
		recommendationsStore.perPage = 4;

		ensureStoreLoading( followingStore, context );

		trackPageLoad( basePath, fullAnalyticsPageTitle, mcKey );
		recordTrack( 'calypso_reader_following_loaded' );

		setPageTitle( context, i18n.translate( 'Following' ) );

		// warn: don't async load this only. we need it to keep feed-post-store in the reader bundle
		renderWithReduxStore(
			React.createElement( StreamComponent, {
				key: 'following',
				listName: i18n.translate( 'Followed Sites' ),
				postsStore: followingStore,
				recommendationsStore,
				showPrimaryFollowButtonOnCards: false,
				trackScrollPage: trackScrollPage.bind(
					null,
					basePath,
					fullAnalyticsPageTitle,
					analyticsPageTitle,
					mcKey
				),
				onUpdatesShown: trackUpdatesLoaded.bind( null, mcKey ),
			} ),
			'primary',
			context.store
		);
	},

	feedDiscovery( context, next ) {
		if ( ! context.params.feed_id.match( /^\d+$/ ) ) {
			feedLookup( context.params.feed_id )
				.then( function( feedId ) {
					page.redirect( `/read/feeds/${ feedId }` );
				} )
				.catch( function() {
					renderFeedError( context );
				} );
		} else {
			next();
		}
	},

	feedListing( context ) {
		const basePath = '/read/feeds/:feed_id',
			fullAnalyticsPageTitle = analyticsPageTitle + ' > Feed > ' + context.params.feed_id,
			feedStore = feedStreamFactory( 'feed:' + context.params.feed_id ),
			mcKey = 'blog';

		ensureStoreLoading( feedStore, context );

		trackPageLoad( basePath, fullAnalyticsPageTitle, mcKey );
		recordTrack( 'calypso_reader_blog_preview', {
			feed_id: context.params.feed_id,
		} );

		renderWithReduxStore(
			<AsyncLoad
				require="reader/feed-stream"
				key={ 'feed-' + context.params.feed_id }
				postsStore={ feedStore }
				feedId={ +context.params.feed_id }
				trackScrollPage={ trackScrollPage.bind(
					null,
					basePath,
					fullAnalyticsPageTitle,
					analyticsPageTitle,
					mcKey
				) }
				onUpdatesShown={ trackUpdatesLoaded.bind( null, mcKey ) }
				showPrimaryFollowButtonOnCards={ false }
				suppressSiteNameLink={ true }
				showBack={ userHasHistory( context ) }
			/>,
			document.getElementById( 'primary' ),
			context.store
		);
	},

	blogListing( context ) {
		const basePath = '/read/blogs/:blog_id',
			fullAnalyticsPageTitle = analyticsPageTitle + ' > Site > ' + context.params.blog_id,
			feedStore = feedStreamFactory( 'site:' + context.params.blog_id ),
			mcKey = 'blog';

		ensureStoreLoading( feedStore, context );

		trackPageLoad( basePath, fullAnalyticsPageTitle, mcKey );
		recordTrack( 'calypso_reader_blog_preview', {
			blog_id: context.params.blog_id,
		} );

		renderWithReduxStore(
			<AsyncLoad
				require="reader/site-stream"
				key={ 'site-' + context.params.blog_id }
				postsStore={ feedStore }
				siteId={ +context.params.blog_id }
				trackScrollPage={ trackScrollPage.bind(
					null,
					basePath,
					fullAnalyticsPageTitle,
					analyticsPageTitle,
					mcKey
				) }
				onUpdatesShown={ trackUpdatesLoaded.bind( null, mcKey ) }
				showPrimaryFollowButtonOnCards={ false }
				suppressSiteNameLink={ true }
				showBack={ userHasHistory( context ) }
			/>,
			document.getElementById( 'primary' ),
			context.store
		);
	},

	readA8C( context ) {
		const basePath = route.sectionify( context.path ),
			fullAnalyticsPageTitle = analyticsPageTitle + ' > A8C',
			feedStore = feedStreamFactory( 'a8c' ),
			mcKey = 'a8c';

		ensureStoreLoading( feedStore, context );

		trackPageLoad( basePath, fullAnalyticsPageTitle, mcKey );

		setPageTitle( context, 'Automattic' );

		renderWithReduxStore(
			<AsyncLoad
				require="reader/team/main"
				key="read-a8c"
				className="is-a8c"
				listName="Automattic"
				postsStore={ feedStore }
				trackScrollPage={ trackScrollPage.bind(
					null,
					basePath,
					fullAnalyticsPageTitle,
					analyticsPageTitle,
					mcKey
				) }
				showPrimaryFollowButtonOnCards={ false }
				onUpdatesShown={ trackUpdatesLoaded.bind( null, mcKey ) }
			/>,
			document.getElementById( 'primary' ),
			context.store
		);
	},
};

export const {
	initAbTests,
	prettyRedirects,
	legacyRedirects,
	updateLastRoute,
	incompleteUrlRedirects,
	preloadReaderBundle,
	sidebar,
	unmountSidebar,
	following,
	feedDiscovery,
	feedListing,
	blogListing,
	readA8C,
} = exported;
