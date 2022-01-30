require('custom-env').env('instantiation-error','test')
require('rootpath')();

import { assert, expect, should } from 'chai'

describe("instantiation-error", function() {
	it("instantiation-error", () => {
		try{
			const { DATA_SOURCES } = require("lib/decorators")
		}catch(e){
			expect(e.site).to.equals("decorators")
			expect(e.ordinal).to.equals(0)
			return
		}
		expect.fail('should throw error')
	});
});