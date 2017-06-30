/**
 * External Dependencies
 */
import React, { Component, PropTypes } from 'react';
import { localize } from 'i18n-calypso';
import { noop, values } from 'lodash';

/**
 * Internal Dependencies
 */
import NavTabs from 'components/section-nav/tabs';
import SectionNav from 'components/section-nav';
import NavItem from 'components/section-nav/item';

const posts = 'posts';
const sites = 'sites';
export const SEARCH_TYPES = { posts, sites };

class SearchStreamHeader extends Component {
	static propTypes = {
		translate: PropTypes.func,
		wideDisplay: PropTypes.bool,
		selected: PropTypes.oneOf( values( SEARCH_TYPES ) ),
		onSelection: PropTypes.func,
	};
	static defaultProps = {
		onSelection: noop,
		selected: SEARCH_TYPES.posts,
	};

	handlePostsSelected = () => this.props.onSelection( SEARCH_TYPES.posts );
	handleSitesSelected = () => this.props.onSelection( SEARCH_TYPES.sites );

	render() {
		const { translate, wideDisplay, selected } = this.props;

		if ( wideDisplay ) {
			return (
				<ul className="search-stream__headers">
					<li className="search-stream__post-header">{ translate( 'Posts' ) }</li>
					<li className="search-stream__site-header">{ translate( 'Sites' ) }</li>
				</ul>
			);
		}

		return (
			<div className="search-stream__header">
				<SectionNav>
					<NavTabs>
						<NavItem
							key={ 'posts-nav' }
							selected={ selected === SEARCH_TYPES.posts }
							onClick={ this.handlePostsSelected }
						>
							{ translate( 'Posts' ) }
						</NavItem>
						<NavItem
							key={ 'sites-nav' }
							selected={ selected === SEARCH_TYPES.sites }
							onClick={ this.handleSitesSelected }
						>
							{ translate( 'Sites' ) }
						</NavItem>
					</NavTabs>
				</SectionNav>
			</div>
		);
	}
}

export default localize( SearchStreamHeader );
