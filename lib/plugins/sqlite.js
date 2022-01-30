function readStringLiteral(sql, index, delimiter) {
	++index;
	while (index < sql.length) {
		if (sql[index] === delimiter) {
			//double single quote escapes itself
			if (index < sql.length - 1 && sql[index + 1] === delimiter) {
				index += 2;
			} else {
				break;
			}
		} else {
			++index;
		}
	}
	return index;
}

function readAnyThingExceptAnyChar(context, word) {
	let sql = context.sql;
	let index = context.index;
	while (index < sql.length) {
		if (sql[index] === "'" || sql[index] === '"') {
			index = readStringLiteral(sql, index, sql[index]);
		} else if (word.indexOf(sql[index]) >= 0) {
			break;
		}
		++index;
	}
	let ret = index !== context.index;
	context.index = index;
	return ret;
}

function readAnyThingExceptWord(context, word) {
	let ptr = 0;
	let sql = context.sql;
	let index = context.index;
	while (index < sql.length && ptr < word.length) {
		if (sql[index] === "'" || sql[index] === '"') {
			index = readStringLiteral(sql, index, sql[index]);
		} else if (sql[index] === word[ptr]) {
			++ptr;
		}
		++index;
	}
	let ret = index !== context.index;
	context.index = index;
	return ret;
}

function readIdentifier(context) {
	let sql = context.sql;
	let index = context.index;
	while (index < sql.length && sql[index] !== '(' && sql[index] !== ')' && !/\s/.test(sql[index])) {
		++index;
	}
	let ret = index !== context.index;
	context.index = index;
	return ret;
}

function readMatchingStructure(context, begin, end) {
	let sql = context.sql;
	let index = context.index;
	if (sql[index] !== begin) {
		return false;
	}
	++index;
	let counter = 1;
	while (index < sql.length) {
		if (sql[index] === "'" || sql[index] === '"') {
			index = readStringLiteral(sql, index, sql[index]);
		} else {
			if (sql[index] === begin)
				++counter;
			else if (sql[index] === end)
				--counter;
		}
		++index;
		if (counter === 0)
			break;
	}
	let ret = index !== context.index;
	context.index = index;
	return ret;
}

function readWord(context, word) {
	let ptr = 0;
	let sql = context.sql;
	let index = context.index;
	while (index < sql.length && ptr < word.length) {
		if (sql[index].toLowerCase() === word[ptr].toLowerCase()) {
			++index;
			++ptr;
		} else {
			break;
		}
	}
	if (ptr === word.length) {
		context.index = index;
		return true;
	}
	return false;
}

function readWhiteSpaceOrComment(context) {
	function readWhiteSpace(context) {
		let sql = context.sql;
		let index = context.index;
		while (index < sql.length && /\s/.test(sql[index])) {
			++index;
		}
		let ret = index !== context.index;
		context.index = index;
		return ret;
	}
	function readComment(context) {
		if (readWord(context, "--")) {
			return readAnyThingExceptAnyChar(context, '\r\n') && readWord(context, "\n");
		} else if (readWord(context, "/*")) {
			return readAnyThingExceptWord(context, '*/');
		}
		return false;
	}
	while (readWhiteSpace(context) || readComment(context));
}

function readCTN(context) {
	readWhiteSpaceOrComment(context);
	readIdentifier(context);
	readWhiteSpaceOrComment(context);
	readMatchingStructure(context, "(", ")");
}

function readCTE(context) {
	readCTN(context);
	readWhiteSpaceOrComment(context);
	readWord(context, "AS");
	readWhiteSpaceOrComment(context);
	readWord(context, "NOT");
	readWhiteSpaceOrComment(context);
	readWord(context, "MATERIALIZED");
	readWhiteSpaceOrComment(context);
	readMatchingStructure(context, "(", ")");
}

function removeWithClause(sql) {
	context = { sql, index: 0 };
	readWhiteSpaceOrComment(context);
	if (readWord(context, "WITH")) {
		readWhiteSpaceOrComment(context);
		readWord(context, "RECURSIVE");
		for (; ;) {
			readWhiteSpaceOrComment(context);
			readCTE(context);
			readWhiteSpaceOrComment(context);
			if (!readWord(context, ","))
				break;
		}
	}
	return sql.substring(context.index);
}

class _BATIS_SQLITE_DATASOURCE {
	constructor(options) {
		if (!options || !options.filename)
			throw 'file name is required for sqlite';
		const sqlite3 = require("sqlite3");
		this.db = new sqlite3.Database(options.filename);
		this.sqlParserCache = {};
	}
	sqlParameterPlaceholder(ordinal) {
		return "?";
	}
	async getConnection() {
		return this.db;
	}
	async execute(conn, sql, parameters, timeout) {
		this.db.configure("busyTimeout", timeout > 0 ? timeout * 1000 : -1);
		let verb = this.sqlParserCache[sql];
		if (verb === undefined) {
			verb = this.sqlParserCache[sql] = extractStatementVerb(sql);
		}
		return new Promise((resolve, reject) => {
			try {
				switch (verb) {
					case 'INSERT':
					case 'REPLAC':
						conn.run(sql, parameters, function(err) {
							if (err !== null) {
								reject(err);
								return;
							}
							resolve({
								affectedRows: this.changes,
								insertId : this.lastID
							})
						});
						break;
					case 'UPDATE':
					case 'DELETE':
						conn.run(sql, parameters, function(err) {
							if (err !== null) {
								reject(err);
								return;
							}
							//this.lastID will contains garbage if the statement is not an successful insert statement
							resolve({
								affectedRows: this.changes || 0,
							})
						});
						break;
					case 'SELECT':
					default:
						conn.all(sql, parameters, function(err, rows) {
							if (err !== null) {
								reject(err);
								return;
							}
							resolve({
								rows,
								fields: !rows.length ? [] : Object.keys(rows[0]).map(r => { return { name: r } })
							})
						});
						break;
				}
			} catch (e) {
				reject(e);
			}
		})
	}
	async release(connection) {
		return;
	}
	async beginTransaction(connection, level) {
		return new Promise((resolve, reject) => {
			connection.run("BEGIN TRANSACTION", function(err) {
				if (err !== null) {
					reject(err);
					return;
				}
				resolve();
			});
		})
	}
	async commit(connection) {
		return new Promise((resolve, reject) => {
			connection.run("COMMIT TRANSACTION", function(err) {
				if (err !== null) {
					reject(err);
					return;
				}
				resolve();
			});
		})
	}
	async rollback(connection) {
		return new Promise((resolve, reject) => {
			connection.run("ROLLBACK TRANSACTION", function(err) {
				if (err !== null) {
					reject(err);
					return;
				}
				resolve();
			});
		})
	}
	async destroy() {
		let db = this.db;
		return new Promise((resolve, reject) => {
			db.close(function(err) {
				if (err !== null) {
					reject(err);
					return;
				}
				db.__is_closed = true;
				resolve();
			});
		})
	}
}

function extractStatementVerb(sql) {
	sql = removeWithClause(sql);
	return sql.substring(0, 6).toUpperCase();
}

module.exports = {
	_BATIS_SQLITE_DATASOURCE,
	extractStatementVerb
}