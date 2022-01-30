
function checkForMultipleResultSets(rows, fields) {
	/*
	 * maybe a bug in mysqljs:
	 * even when multipleStatements is false or unspecified, 
	 * for stored procedures with select queries in them, the return value from pool.execute is still 
	 * nested arrays, much like a result when multipleStatements is enabled.
	 * however the second element of the nested array for field names is undefined and 
	 * only the first element should be processed.
	 * Also, the rows object (first element in the original result array) can be a 'ResultSetHeader' object 
	 * rather than an array or undefined.
	 */
	if (!(rows instanceof Array))
		//ResultSetHeader
		rows = undefined;
	if (!fields || !fields.length)
		return { rows, fields };
	if (!(fields[0] instanceof Array)) {
		//undefined
		return { rows, fields };
	}
	let counter = 0;
	fields.forEach(f => {
		if (f !== undefined)
			++counter;
	});
	//currently this will never happen as we only use prepared query
	if (counter > 1) {
		throw `queries producing multiple result sets are not supported`;
	}

	fields = fields.filter(f => f)[0];
	rows = rows.filter(r => (r instanceof Array))[0];
	return { rows, fields };
}

function skipStringLiteral(str, index) {
	//doubling single/double quote or prefix it with a back slash both counts as an escape in MySQL
	let delimiter = str[index++];
	let escaped = false;
	for (; index < str.length; ++index) {
		let char = str[index];
		if (escaped) {
			escaped = false;
		} else if (char === delimiter) {
			if (index < str.length - 1 && str[index + 1] === delimiter) {
				index += 1;
			} else {
				return index;
			}
		} else if (char === '\\') {
			escaped = true;
		} else {
			escaped = false;
		}
	}
}

class _BATIS_MYSQL_DATASOURCE {
	constructor(options) {
		const mysql = require("mysql2");
		options.multipleStatements = true;
		this.pool = mysql.createPool(options);
		this.pool.execute("select 1+1 as result");
		this._pool = this.pool.promise();
	}
	sqlParameterPlaceholder(ordinal) {
		return "?";
	}
	async getConnection() {
		return await this._pool.getConnection();
	}
	async call(conn, sql, parameters, timeout) {
		let transformed = '';
		let selectVarsSql = 'SELECT ';
		let setVarsSql = 'SET ';
		let setVarsParams = [];
		let parameterIndex = 0;

		/**
		 * if out is false, keep it as a ?
		 * if out is true, execute a set @name = ? statement and replace it as @name
		 */

		for (let index = 0; index < sql.length; ++index) {
			let char = sql[index];
			if (char === "'" || char === '"') {
				let end = skipStringLiteral(sql, index);
				transformed += sql.substring(index, end + 1);
				index = end;
			} else if (char === '?') {
				let parameter = parameters[parameterIndex++];
				if (parameter.out) {
					let value = parameter.value;
					transformed += `@${parameter.name}`;
					setVarsSql += `@${parameter.name}=?,`;
					selectVarsSql += `@${parameter.name},`;
					if (value === null || value === undefined) {
						//use a 'set @var = NULL' statement to reset its value to NULL
						//as value of the same var may be set to some other values in former statements and still remaining in session data of this connection
						//mysql-node does not allow undefined in prepared statement parameter, so if value is undefined, pass null here
						setVarsParams.push(null);
					} else {
						setVarsParams.push(value);
					}
				} else {
					transformed += char;
				}
			} else {
				transformed += char;
			}
		}

		selectVarsSql = selectVarsSql.slice(0, -1);
		setVarsSql = setVarsSql.slice(0, -1);

		await conn.query(setVarsSql, setVarsParams);

		parameters = parameters.filter(p => !p.out).map(p => p.value);
		sql = transformed;

		let queryConfig = timeout ? { sql, timeout: timeout * 1000 } : sql;
		await conn.execute(queryConfig, parameters);

		let ret = await conn.execute(selectVarsSql, []);
		let { rows, fields } = checkForMultipleResultSets(ret[0], ret[1]);

		rows.forEach(r => {
			for (let n in r) {
				r[n.substring(1)] = r[n];
				delete r[n];
			}
		});
		fields.forEach(r => {
			r.name = r.name.substring(1);
		});

		return {
			affectedRows: 0,
			insertId: undefined,
			rows: rows,
			fields: fields,
		}
	}
	async execute(conn, sql, parameters, timeout) {
		try {
			let queryConfig = timeout ? { sql, timeout: timeout * 1000 } : sql;
			let ret = await conn.execute(queryConfig, parameters);
			// mysql does not allow assigning negative value to column with AUTO_INCREMENT constraint
			// so this field will be 0 if there is no auto generated id
			let insertId = ret[0].insertId;
			if (insertId === 0)
				insertId = undefined;
			let { rows, fields } = checkForMultipleResultSets(ret[0], ret[1]);
			return {
				affectedRows: ret[0].affectedRows || 0,
				insertId,
				rows,
				fields: (fields && fields.length) ? fields : undefined,
			}
		} catch (error) {
			if (error && error.code === 'PROTOCOL_SEQUENCE_TIMEOUT') {
				//when a timeout is reached, the connection it occurred on will be destroyed and no further operations can be performed
				//pooled connections seem to need an extra destroy() call to remove it from pool
				conn.__js_batis_invalid = true;
			}
			throw error;
		}
	}
	async release(connection) {
		await connection.release();
	}
	async beginTransaction(connection, level) {
		if (level) {
			await connection.execute(
				`SET TRANSACTION ISOLATION LEVEL ${level}`
			);
		}
		await connection.beginTransaction();
	}
	async commit(connection) {
		await connection.commit();
	}
	async rollback(connection) {
		if (connection.__js_batis_invalid) {
			await connection.destroy();
			return;
		}
		await connection.rollback();
	}
	async destroy() {
		await this._pool.end();
	}
}

module.exports = _BATIS_MYSQL_DATASOURCE;