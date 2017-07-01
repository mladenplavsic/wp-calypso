/**
 * Internal dependencies
 */
import {
	GRAVATAR_UPLOAD_RECEIVE,
	GRAVATAR_UPLOAD_REQUEST,
	GRAVATAR_UPLOAD_REQUEST_SUCCESS,
	GRAVATAR_UPLOAD_REQUEST_FAILURE,
} from 'state/action-types';
import { http } from 'state/data-layer/wpcom-http/actions';
import { dispatchRequest } from 'state/data-layer/wpcom-http/utils';
import {
	bumpStat,
	composeAnalytics,
	recordTracksEvent,
	withAnalytics,
} from 'state/analytics/actions';

function uploadGravatar( { dispatch }, action, next ) {
	const { email, file } = action;
	dispatch( http( {
		method: 'POST',
		path: '/gravatar-upload',
		apiNamespace: 'wpcom/v2',
		formData: [
			[ 'account', email ],
			[ 'filedata', file ],
		],
	}, action ) );

	next( action );
}

function uploadComplete( { dispatch }, { file }, next ) {
	const fileReader = new FileReader( file );
	fileReader.addEventListener( 'load', function() {
		next( {
			type: GRAVATAR_UPLOAD_RECEIVE,
			src: fileReader.result,
		} );
		next( withAnalytics(
			recordTracksEvent( 'calypso_edit_gravatar_upload_success' ),
			{ type: GRAVATAR_UPLOAD_REQUEST_SUCCESS }
		) );
	} );
	fileReader.readAsDataURL( file );
}

function uploadFailed( state, action, next ) {
	next( withAnalytics(
		composeAnalytics(
			recordTracksEvent( 'calypso_edit_gravatar_upload_failure' ),
			bumpStat( 'calypso_gravatar_update_error', 'unsuccessful_http_response' )
		),
		{ type: GRAVATAR_UPLOAD_REQUEST_FAILURE }
	) );
}

export default {
	[ GRAVATAR_UPLOAD_REQUEST ]: [ dispatchRequest( uploadGravatar, uploadComplete, uploadFailed ) ],
};
