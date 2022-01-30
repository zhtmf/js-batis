const md5 = require('md5');

class _BATIS_PG_DATASOURCE {
	constructor(options) {
		const { Pool } = require('pg');
		this.pool = new Pool(options);
		this.last_timeout = 0;
	}
	sqlParameterPlaceholder(ordinal) {
		return "$" + (ordinal + 1);
	}
	async getConnection() {
		return await this.pool.connect();
	}

	/**
	 * because pg has the feature to return rows with column of different names/types from out parameters, 
	 * so there is no point to derive column names from out parameters. 
	 * furthermore, it is possible for a pg stored procedure to return rows consisted of scalar columns together with composite record typed columns in a single call, 
	 * so split a literal record type value is problematic as column names are unknown.
	 * even the official JDBC driver chooses not to implement most of the registerOutParameter methods of CallableStatement.
	 * so we'd better to keep those things all intact
	 */
	
	async call(conn, sql, parameters, timeout) {
		
		return await this.execute(conn, sql, parameters.map(p => p.value), timeout);
	}
	async execute(conn, sql, parameters, timeout) {

		timeout = timeout >= 0 ? timeout * 1000 : 0;
		if (timeout !== this.last_timeout) {
			await conn.query(`SET statement_timeout TO ${this.last_timeout = timeout}`);
		}
		let result = await conn.query({
			name: md5(sql),
			text: sql,
			values: parameters,
		});

		let command = result.command;
		let rows = result.rows;
		let fields = result.fields;
		let rowCount = result.rowCount;

		let tmp;
		//relies on RETURNING statement after UPDATE or INSERT to return the desired generated key column
		//just as how official JDBC driver handles it.
		return {
			affectedRows: rowCount,
			insertId: (command === 'INSERT' && rows.length && fields.length && (tmp = +rows[0][fields[0].name])) ?
				tmp : undefined,
			fields: (fields && fields.length) ? fields : undefined,
			// RETURNING statement do make rows not empty as there is a result set returned from DB but non-empty rows property will affect logging logic afterwards
			rows: (command === 'INSERT' || command === 'UPDATE') ? undefined : rows,
		}
	}

	async release(connection) {
		connection.release();
	}
	async beginTransaction(connection, level) {
		if (level)
			await connection.query(`BEGIN TRANSACTION ISOLATION LEVEL ${level}`);
		else
			await connection.query(`BEGIN TRANSACTION`);
	}
	async commit(connection) {
		await connection.query(`COMMIT`);
	}
	async rollback(connection) {
		await connection.query(`ROLLBACK`);
	}
	async destroy() {
		await this.pool.end();
	}
}

module.exports = _BATIS_PG_DATASOURCE;