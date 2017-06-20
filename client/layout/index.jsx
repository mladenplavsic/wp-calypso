/**
 * External dependencies
 */
var React = require( 'react' ),
	connect = require( 'react-redux' ).connect,
	classnames = require( 'classnames' ),
	property = require( 'lodash/property' ),
	sortBy = require( 'lodash/sortBy' );

/**
 * Internal dependencies
 */
var AsyncLoad = require( 'components/async-load' ),
	MasterbarLoggedIn = require( 'layout/masterbar/logged-in' ),
	MasterbarLoggedOut = require( 'layout/masterbar/logged-out' ),
	observe = require( 'lib/mixins/data-observe' ),
	GlobalNotices = require( 'components/global-notices' ),
	notices = require( 'notices' ),
	translator = require( 'lib/translator-jumpstart' ),
	TranslatorInvitation = require( './community-translator/invitation' ),
	TranslatorLauncher = require( './community-translator/launcher' ),
	Welcome = require( 'my-sites/welcome/welcome' ),
	WelcomeMessage = require( 'layout/nux-welcome/welcome-message' ),
	analytics = require( 'lib/analytics' ),
	config = require( 'config' ),
	PulsingDot = require( 'components/pulsing-dot' ),
	SitesListNotices = require( 'lib/sites-list/notices' ),
	OfflineStatus = require( 'layout/offline-status' ),
	QueryPreferences = require( 'components/data/query-preferences' ),
	KeyboardShortcutsMenu,
	Layout;

import QuerySites from 'components/data/query-sites';
import { isOffline } from 'state/application/selectors';
import { hasSidebar } from 'state/ui/selectors';
import { isHappychatOpen } from 'state/ui/happychat/selectors';
import SitePreview from 'blocks/site-preview';
import { getCurrentLayoutFocus } from 'state/ui/layout-focus/selectors';
import DocumentHead from 'components/data/document-head';

if ( config.isEnabled( 'keyboard-shortcuts' ) ) {
	KeyboardShortcutsMenu = require( 'lib/keyboard-shortcuts/menu' );
}

Layout = React.createClass( {
	displayName: 'Layout',

	mixins: [ SitesListNotices, observe( 'user', 'nuxWelcome', 'translatorInvitation' ) ],

	propTypes: {
		primary: React.PropTypes.element,
		secondary: React.PropTypes.element,
		user: React.PropTypes.object,
		nuxWelcome: React.PropTypes.object,
		translatorInvitation: React.PropTypes.object,
		focus: React.PropTypes.object,
		// connected props
		isLoading: React.PropTypes.bool,
		isSupportUser: React.PropTypes.bool,
		section: React.PropTypes.oneOfType( [
			React.PropTypes.bool,
			React.PropTypes.object,
		] ),
		isOffline: React.PropTypes.bool,
	},

	closeWelcome: function() {
		this.props.nuxWelcome.closeWelcome();
		analytics.ga.recordEvent( 'Welcome Box', 'Clicked Close Button' );
	},

	newestSite: function() {
		return sortBy( this.props.sites, property( 'ID' ) ).pop();
	},

	renderMasterbar: function() {
		if ( ! this.props.user ) {
			return <MasterbarLoggedOut sectionName={ this.props.section.name } />;
		}

		return (
			<MasterbarLoggedIn
				user={ this.props.user }
				section={ this.props.section.group }
				sites={ this.props.sites } />
		);
	},

	renderWelcome: function() {
		const translatorInvitation = this.props.translatorInvitation;

		if ( ! this.props.user ) {
			return null;
		}

		const showWelcome = this.props.nuxWelcome.getWelcome();
		const newestSite = this.newestSite();
		const showInvitation = ! showWelcome &&
				translatorInvitation.isPending() &&
				translatorInvitation.isValidSection( this.props.section.name );

		return (
			<span>
				<Welcome isVisible={ showWelcome } closeAction={ this.closeWelcome } additionalClassName="NuxWelcome">
					<WelcomeMessage welcomeSite={ newestSite } />
				</Welcome>
				<TranslatorInvitation isVisible={ showInvitation } />
			</span>
		);
	},

	renderPreview() {
		if ( config.isEnabled( 'preview-layout' ) && this.props.section.group === 'sites' ) {
			return (
				<SitePreview />
			);
		}
	},

	render: function() {
		const sectionClass = classnames(
				'layout',
				`is-group-${ this.props.section.group }`,
				`is-section-${ this.props.section.name }`,
				`focus-${ this.props.currentLayoutFocus }`,
				{ 'is-support-user': this.props.isSupportUser },
				{ 'has-no-sidebar': ! this.props.hasSidebar },
				{ 'wp-singletree-layout': !! this.props.primary },
				{ 'has-chat': this.props.chatIsOpen }
			),
			loadingClass = classnames( {
				layout__loader: true,
				'is-active': this.props.isLoading
			} );

		return (
			<div className={ sectionClass }>
				<DocumentHead />
				<QuerySites allSites />
				<QueryPreferences />
				{ <AsyncLoad require="layout/guided-tours" /> }
				{ config.isEnabled( 'nps-survey/notice' ) && <AsyncLoad require="layout/nps-survey-notice" /> }
				{ config.isEnabled( 'keyboard-shortcuts' ) && <KeyboardShortcutsMenu /> }
				{ this.renderMasterbar() }
				{ config.isEnabled( 'support-user' ) && <AsyncLoad require="support/support-user" /> }
				<div className={ loadingClass } ><PulsingDot active={ this.props.isLoading } chunkName={ this.props.section.name } /></div>
				{ this.props.isOffline && <OfflineStatus /> }
				<div id="content" className="layout__content">
					{ this.renderWelcome() }
					<GlobalNotices id="notices" notices={ notices.list } forcePinned={ 'post' === this.props.section.name } />
					<div id="primary" className="layout__primary">
						{ this.props.primary }
					</div>
					<div id="secondary" className="layout__secondary">
						{ this.props.secondary }
					</div>
				</div>
				<TranslatorLauncher
					isEnabled={ translator.isEnabled() }
					isActive={ translator.isActivated() } />
				{ this.renderPreview() }
				{ config.isEnabled( 'happychat' ) && this.props.chatIsOpen && <AsyncLoad require="components/happychat" /> }
			</div>
		);
	}
} );

export default connect(
	( state ) => {
		const { isLoading, section } = state.ui;
		return {
			isLoading,
			isSupportUser: state.support.isSupportUser,
			section,
			hasSidebar: hasSidebar( state ),
			isOffline: isOffline( state ),
			currentLayoutFocus: getCurrentLayoutFocus( state ),
			chatIsOpen: isHappychatOpen( state )
		};
	}
)( Layout );
