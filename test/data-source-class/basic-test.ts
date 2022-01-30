require('custom-env').env('test1', 'test')

import { assert, expect, should } from 'chai'
import { DataSourceClass, SQLResult, TransactionLevel } from "../../index"
import { DATA_SOURCES, DEFAULT_DATASOURCE_NAME } from '../../lib/decorators'

describe("basic_test", function() {

	it("default data source", () => {
		should().exist(DATA_SOURCES[DEFAULT_DATASOURCE_NAME])
		expect(DATA_SOURCES[DEFAULT_DATASOURCE_NAME]).to.be.a('object');
		expect(DATA_SOURCES[DEFAULT_DATASOURCE_NAME]["host"]).to.equals("127.0.0.1")
		expect(DATA_SOURCES[DEFAULT_DATASOURCE_NAME]["password"]).to.equals("root")
		expect(DATA_SOURCES[DEFAULT_DATASOURCE_NAME]["user"]).to.equals("root")
		expect(DATA_SOURCES[DEFAULT_DATASOURCE_NAME]["port"]).to.equals("3306")

		should().exist(DATA_SOURCES[DEFAULT_DATASOURCE_NAME].impl)
		expect(DATA_SOURCES[DEFAULT_DATASOURCE_NAME].impl.constructor.name).to.equals("_BATIS_MYSQL_DATASOURCE")
		expect(DATA_SOURCES[DEFAULT_DATASOURCE_NAME].impl.pool.config.connectionLimit).to.equals(10)
	})

	it("fake data source", () => {
		@DataSourceClass("fake")
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

		should().exist(DATA_SOURCES["fake"].impl)
		expect(DATA_SOURCES["fake"].impl.constructor.name).to.equals("FakeDataSource")
	})

	it("fake data source2, with some options", () => {
		@DataSourceClass("FAKE2")
		class FakeDataSource2 {
			constructor(props: any) {
				should().exist(props);
				expect(props.host).to.equals("yyy")
				expect(props.options1).to.equals("abc")
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
		should().exist(DATA_SOURCES["FAKE2"].impl)
		expect(DATA_SOURCES["FAKE2"].impl.constructor.name).to.equals("FakeDataSource2")
	})

	it("one implementation for multiple data sources", () => {
		@DataSourceClass(["FAKE3","FAKE4"])
		class FakeDataSource2 {
			constructor(props: any) {
				should().exist(props);
				expect(props.host).to.equals("yyy")
				expect(props.options1).to.equals("abc")
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
		should().exist(DATA_SOURCES["FAKE4"].impl)
		expect(DATA_SOURCES["FAKE4"].impl.constructor.name).to.equals("FakeDataSource2")
		should().exist(DATA_SOURCES["FAKE3"].impl)
		expect(DATA_SOURCES["FAKE3"].impl.constructor.name).to.equals("FakeDataSource2")
	})
})
