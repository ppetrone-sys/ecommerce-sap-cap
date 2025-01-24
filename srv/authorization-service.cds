service AuthorizationService {

  function isAdmin() returns  Boolean;
  
  function InventoryManager() returns  Boolean;
  
  function SalesManager() returns  Boolean;
  
  function StoreSupervisor() returns  Boolean;

  function userRoles() returns Array of String;
}