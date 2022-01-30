require('custom-env').env('test1', 'test')

import { assert, expect, should } from 'chai'
import { Param, Select, SelectOne, Execute, Insert, Update, Delete, Result, DataSource, Transactional, Cleanup } from "../../index"
import { DATA_SOURCES } from '../../lib/decorators'

class Mapper1 {
	@Select(`
 		select 
 			abc,def
 		from 
 			non_exist
 	`)
	async error(): Promise<any[]> {
		return [];
	}
}

describe("mysql leftover", function() {

	let mapper1 = new Mapper1();

	class CleanupManager {
		@Cleanup()
		static doCleanUp(): void {

		}
	}

	it("sql exception", async () => {
		try {
			let results = await mapper1.error();
			should().fail("should throw error");
		} catch (e) {
			expect(e.sqlMessage).to.be.not.equals(undefined);
			expect(e.errno).to.be.not.equals(undefined);
			expect(e.sqlState).to.be.not.equals(undefined);
		}
	});

	it("destroy", async function() {
		await CleanupManager.doCleanUp();
		for (let groupName in DATA_SOURCES) {
			if (DATA_SOURCES[groupName].impl)
				expect(DATA_SOURCES[groupName].impl.pool._closed).to.be.equals(true);
		}
	})
});