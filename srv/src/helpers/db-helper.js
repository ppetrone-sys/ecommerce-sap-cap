const cds = require("@sap/cds");
const LOG = cds.log("keymapping-logger");

/**
 * Adapts the provided data to match the specified entity's structure, ensuring
 * that only the properties defined in the entity are included. Properties not in
 * the entity are omitted, and missing entity properties are set to null.
 *
 * @param {Object} data - The data to be adapted
 * @param {string} entityName - The fully qualified name of the entity to adapt the data to.
 *
 * @returns {Object} An object containing properties that match the entity's structure,
 * with any missing properties set to null.
 */
function adaptToEntity(data, entityName) {
    const model = cds.reflect(cds.model);
    const entityType = model.definitions[entityName];

    if (!entityType) return data;

    const entityProperties = Object.keys(entityType.elements);
    const adaptedData = {};

    entityProperties.forEach(prop => {
        if (Object.prototype.hasOwnProperty.call(data, prop)) {
            adaptedData[prop] = data[prop];
        } else {
            adaptedData[prop] = null;
        }
    });

    return adaptedData;
}

/**
* Executes a database stored procedure with or without temporary tables.
* Handles cases where the stored procedure has parameters or is invoked without parameters.
*
* @param {string} procedure - The stored procedure to execute.
* @param {string} [entityName] - The entity name for naming temporary tables (optional).
* @param {Object} [newtab] - Data for the new state, used in the stored procedure (optional).
* @param {Object} [oldtab] - Data for the old state, used in update scenarios (optional).
*/
async function callProcedure(procedure, entityName = null, newtab = null, oldtab = null) {
   let newtabTT = null, oldtabTT = null;

   try {
       if (entityName && newtab) {
           // Create and populate temporary table for new data
           newtabTT = await createTemporaryTable(entityName);
           const insertNew = buildInsertStatement(newtabTT, newtab);
           await cds.run(insertNew, Object.values(newtab));
       }

       if (entityName && oldtab) {
           // Create and populate temporary table for old data
           oldtabTT = await createTemporaryTable(entityName);
           const insertOld = buildInsertStatement(oldtabTT, oldtab);
           await cds.run(insertOld, Object.values(oldtab));
       }

       // Construct stored procedure call
       let spCall;
       if (newtabTT && oldtabTT) {
           spCall = `CALL ${procedure}('${newtabTT}', '${oldtabTT}', ?)`;
       } else if (newtabTT) {
           spCall = `CALL ${procedure}('${newtabTT}', ?)`;
       } else {
           spCall = `CALL ${procedure}()`;
       }

       // Execute the stored procedure
       await cds.run(spCall);
   } catch (error) {
       LOG.error("Operation failed. Details: ", error);
       throw error;
   } finally {
       // Clean up temporary tables
       if (newtabTT) await cds.run(`DROP TABLE ${newtabTT}`);
       if (oldtabTT) await cds.run(`DROP TABLE ${oldtabTT}`);
   }
}


/**
 * Creates a local temporary table based on the structure of the specified entity.
 *
 * @param {string} entityName - The full namespaced path of the entity, which will be
 *                              converted to the corresponding database table name format.
 * @returns {Promise<string>} - The name of the newly created temporary table.
 */
async function createTemporaryTable(entityName) {
    const tableName = entityName.toUpperCase().replace(/\./g, '_');
    const temporaryTable = getTempName(tableName);

    await cds.run(
        `CREATE LOCAL TEMPORARY TABLE ${temporaryTable} LIKE ${tableName}`
    );

    return temporaryTable;
}

/**
 * Generates a unique temporary table name using the entity name and a UUID.
 *
 * @param {string} entityName - The base name for generating the temporary table name.
 * @returns {string} A unique name for a temporary table.
 */
function getTempName(entityName) {
    return `#temp_${entityName.toLowerCase()}_${cds.utils
        .uuid()
        .replace(/-/g, "")}`;
}

/**
 * Constructs an SQL INSERT statement for a specified table with given data.
 * The statement includes columns derived from the data keys and uses placeholders for the values.
 *
 * @param {string} tableName - The name of the table where data will be inserted.
 * @param {Object} data - The data to insert, where keys represent column names.
 * @returns {string} An SQL INSERT statement.
 */
function buildInsertStatement(tableName, data) {
    const columns = Object.keys(data).join(', ');
    const placeholders = Object.keys(data).fill('?').join(', ');

    return `INSERT INTO ${tableName} (${columns}) VALUES (${placeholders})`;
}

module.exports = {
    adaptToEntity,
    callProcedure
};