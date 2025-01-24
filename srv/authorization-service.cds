service AuthorizationService {

  function isAdmin() returns  Boolean;

  function userRoles() returns Array of String;
}