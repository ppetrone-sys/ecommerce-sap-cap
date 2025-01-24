module.exports = class SequenceHelper {
	constructor(options) {
		this.db = options.db;
		this.sequence = options.sequence;
		this.table = options.table;
		this.field = options.field;
	}

	/**
	 * Retrieves the next available number based on the current database type (HANA, SQL and SQLite).
	 * The method returns a Promise that resolves with the next number or rejects with an error if the database type is unsupported.
	 * 
	 * @returns {Promise<number>} A promise that resolves to the next available number.
	 */
	getNextNumber() {
		return new Promise((resolve, reject) => {
			let nextNumber = 0;
			switch (this.db.kind) {
				case "hana":
					nextNumber = this.getNextNumerForHana(nextNumber, resolve, reject);
					break;
				case "sql":
				case "sqlite":
					nextNumber = this.getNextNumberForSQLOrSQLite(nextNumber, resolve, reject);
					break;
				default:
					reject(new Error(`Unsupported DB kind --> ${this.db.kind}`));
			}
		});
	}

	getNextNumerForHana(nextNumber, resolve, reject) {
		this.db.run(`SELECT "${this.sequence}".NEXTVAL FROM DUMMY`)
			.then(result => {
				nextNumber = result[0][`${this.sequence}.NEXTVAL`];
				resolve(nextNumber);
			})
			.catch(error => {
				reject(error);
			});
		return nextNumber;
	}

	getNextNumberForSQLOrSQLite(nextNumber, resolve, reject) {
		this.db.run(`SELECT MAX("${this.field}") FROM "${this.table}"`)
			.then(result => {
				nextNumber = parseInt(result[0][`MAX("${this.field}")`]) + 1;
				resolve(nextNumber);
			})
			.catch(error => {
				reject(error);
			});
		return nextNumber;
	}
};