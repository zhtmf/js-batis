require('custom-env').env('repeated-implementation', 'test')
require('rootpath')();

import { assert, expect, should } from 'chai'
import { DataSourceClass, SQLResult, TransactionLevel } from "index"

describe("repeated-implementation", function() {

	it("repeated-implementation", () => {
		try {
			@DataSourceClass("DS1")
			class FakeDataSource {
				constructor(props: any) {
					should().not.exist(props);
				}
				async call(conn, sql, parameters, timeout): Promise<any> {}
				async getConnection(): Promise<any> { return 0; }
				async execute(connection: any, sql: string, parameters: object): Promise<SQLResult> { return {} }
				async release(connection: any): Promise<void> { }
				async beginTransaction(connection: any, level: TransactionLevel): Promise<void> { }
				async commit(connection: any): Promise<void> { }
				async rollback(connection: any): Promise<void> { }
				sqlParameterPlaceholder(ordinal: number): string { return "?" }
				async destroy(): Promise<void> { }
			}
			const { DATA_SOURCES } = require("lib/decorators")
		} catch (e) {
			expect(e.site).to.equals("decorators")
			expect(e.ordinal).to.equals(7)
			return
		}
		expect.fail('should throw error')
	});
});