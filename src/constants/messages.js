/** Shared user-facing copy for the SPA. Prefer API `result.message` when present. */

export const MESSAGES = {
    requestFailed: 'The request could not be completed.',
    requestCheckEntries: 'The request could not be completed. Please check your entries and try again.',
    serverError: 'Something went wrong on our side. Please try again.',
    unauthorized: 'Please sign in to continue.',
    forbidden: 'You do not have permission to do that.',
    notFound: 'That item could not be found.',
    sessionExpired: 'Your session expired. Please refresh the page and try again.',
    tooManyAttempts: 'Too many attempts. Please wait a moment and try again.',
    permissionsSaveFailed: 'Those permissions could not be saved. Refresh the page and try again.',

    roleAdded: 'The role and its permissions were added.',
    roleSaved: 'The role and its permissions were saved.',
    roleRemoved: 'The role was removed.',
    roleLoadFailed: 'The role could not be loaded.',
    roleSaveFailed: 'The role could not be saved.',
    roleRemoveFailed: 'The role could not be removed.',
    roleNeedsModule: 'Please check at least one module.',

    branchAdded: 'The branch was added.',
    branchSaved: 'The branch details were saved.',
    branchRemoveFailed: 'The branch could not be deleted.',

    screenAdded: 'The screen was added.',
    screenSaved: 'The screen details were saved.',
    screenRemoveFailed: 'The screen could not be deleted.',

    seatAdded: 'The seat was added to this screen.',
    seatSaved: 'The seat record was updated.',
    seatRemoveFailed: 'The seat could not be deleted.',
    seatLayoutSaved: 'The seating layout was saved.',
    seatLayoutSaveFailed: 'The layout could not be saved.',
    seatLayoutEmpty: 'The layout needs at least one seat before it can be saved.',

    genreAdded: 'The genre was added.',
    genreSaved: 'The genre was saved.',
    genreRemoveFailed: 'The genre could not be deleted.',

    foodCategoryAdded: 'The food category was added.',
    foodCategorySaved: 'The food category was saved.',
    foodCategoryRemoveFailed: 'The category could not be deleted.',

    foodProductAdded: 'The menu item was added.',
    foodProductSaved: 'The menu item was saved.',
    foodProductRemoveFailed: 'The product could not be deleted.',
    foodAvailabilityFailed: 'Availability could not be changed.',

    movieAdded: 'The movie was added.',
    movieSaved: 'The movie details were saved.',
    movieRemoveFailed: 'The movie could not be deleted.',
    moviePublishFailed: 'Publication could not be changed.',

    showtimeAdded: 'The screening was added.',
    showtimeSaved: 'The screening details were saved.',
    showtimeCancelFailed: 'The screening could not be cancelled.',

    settingsSaved: 'The system settings were updated.',
    adminCreated: 'The administrator account was created.',
    ticketCheckedIn: 'Ticket checked in.',
    verificationLinkSent: 'Verification link sent.',
    verificationSendFailed: 'The verification email could not be sent.',
    twoFactorCheckFailed: 'That code could not be checked',
    signInFailed: 'Could not sign in',

    dashboardExportOk: 'Excel report downloaded.',
    dashboardExportFailed: 'The Excel report could not be downloaded.',

    moviesEmpty: 'No published movies are available.',
    moviesSearchEmpty: 'No movies matched that search.',
    moviesLoadFailed: 'Movies could not be loaded.',
    bookingNotFound: 'That booking was not found.',
    paymentRecordFailed: 'The test payment could not be recorded.',
};

export function httpFallbackMessage(status, raw = '') {
    const text = typeof raw === 'string' ? raw.trim() : '';

    if (/no permission named|PermissionDoesNotExist/i.test(text)) {
        return MESSAGES.permissionsSaveFailed;
    }

    if (/SQLSTATE|Integrity constraint|stack trace|Illuminate\\|Symfony\\|TypeError|ErrorException/i.test(text)) {
        return status >= 500 ? MESSAGES.serverError : MESSAGES.requestCheckEntries;
    }

    if (status === 401) {
        return text || MESSAGES.unauthorized;
    }

    if (status === 403) {
        return text || MESSAGES.forbidden;
    }

    if (status === 404) {
        return text || MESSAGES.notFound;
    }

    if (status === 419) {
        return MESSAGES.sessionExpired;
    }

    if (status === 429) {
        return MESSAGES.tooManyAttempts;
    }

    if (status >= 500) {
        return MESSAGES.serverError;
    }

    return text || MESSAGES.requestFailed;
}
