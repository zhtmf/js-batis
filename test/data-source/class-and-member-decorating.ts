require('custom-env').env('test1','test')
require('rootpath')();

import { expect, should } from 'chai'
import { DataSource, DataSourceClass, TransactionLevel, SQLResult } from "../../index"
import { DS_REGISTRY_NAME, DEFAULT_DATASOURCE_NAME, CLASS_DATASOURCE_NAME } from "../../lib/decorators"

@DataSourceClass("FAKE2")
class FakeDataSource2 {
	constructor(props: any) {
		should().exist(props);
		expect(props.host).to.equals("yyy")
		expect(props.options1).to.equals("abc")
	}
	async getConnection(): Promise<any> { return 0; }
	async execute(connection: any, sql: string, parameters: object): Promise<SQLResult> { return {} }
	async release(connection: any): Promise<void> { }
	async beginTransaction(connection: any, level: TransactionLevel): Promise<void> { }
	async commit(connection: any): Promise<void> { }
	async rollback(connection: any): Promise<void> { }
	sqlParameterPlaceholder(ordinal : number) : string{return "?"}
	async destroy(): Promise<void> { }
	async call(connection: any, sql: string, parameters: { name: string, value: any, out: boolean }[], timeout?: number): Promise<SQLResult>{return {};}
}

describe("decoration and overriding", function() {

	it("decoration and overriding", () => {

		@DataSource()
		class Mapper{
			method1(name : string){}
			@DataSource("FAKE2")
			method2(name : string){}
			@DataSource()
			method3(name : string){}
		}

		@DataSource("FAKE2")
		class Mapper2{
			method1(name : string){}
			@DataSource()
			method3(name : string){}
		}

		const { getDataSourceNameForMethod } = require("lib/decorators")

		expect(getDataSourceNameForMethod(Mapper.prototype, "method1")).to.equals(DEFAULT_DATASOURCE_NAME)
		expect(getDataSourceNameForMethod(Mapper.prototype, "method2")).to.equals("FAKE2")
		expect(getDataSourceNameForMethod(Mapper.prototype, "method3")).to.equals(DEFAULT_DATASOURCE_NAME)

		expect(getDataSourceNameForMethod(Mapper2.prototype, "method1")).to.equals("FAKE2")
		expect(getDataSourceNameForMethod(Mapper2.prototype, "method3")).to.equals(DEFAULT_DATASOURCE_NAME)
	});
});