require('custom-env').env('test2','test')
require('rootpath')();

import { assert, expect, should } from 'chai'

describe("unknown-type", function() {
	it("unknown-type", () => {
		try {
			const { DATA_SOURCES } = require("lib/decorators")
			expect.fail('should throw error')
		} catch (e) {
			expect(e.site).to.equals("decorators")
			expect(e.ordinal).to.equals(1)
		}
	});
});