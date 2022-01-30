require('custom-env').env('sqlite', 'test')

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
	async error1(): Promise<any[]> {
		return [];
	}

	@Select(`
 		select 
 			abc,def
 		from 
 			non_exist
 	`)
	async error2(): Promise<any[]> {
		return [];
	}
}

describe("sqlite leftover", function() {

	let mapper1 = new Mapper1();

	class CleanupManager {
		@Cleanup()
		doCleanUp(): void {

		}
	}

	it("sql query exception", async () => {
		try {
			let results = await mapper1.error1();
			should().fail("should throw error");
		} catch (e) {
			expect(e.errno).to.be.not.equals(undefined);
			expect(e.code).to.be.not.equals(undefined);
		}
	});

	it("sql update exception", async () => {
		try {
			let results = await mapper1.error2();
			should().fail("should throw error");
		} catch (e) {
			expect(e.errno).to.be.not.equals(undefined);
			expect(e.code).to.be.not.equals(undefined);
		}
	});

	it("destroy", async function() {
		await new CleanupManager().doCleanUp();
		for (let groupName in DATA_SOURCES) {
			if (DATA_SOURCES[groupName].impl)
				expect(DATA_SOURCES[groupName].impl.db.__is_closed).to.be.equals(true);
		}
	});
});