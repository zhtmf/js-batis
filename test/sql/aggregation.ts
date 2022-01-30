import { assert, expect, should } from 'chai'
import { aggregate } from '../../lib/decorators'

describe("aggregate", function() {

	it("objects with same id", async () => {

		//properties from objects come later in the array overrides that from objects with same id but appear before them
		
		let result = aggregate({id:"name", list: true},[{"name":"abc","title":"title1"},{"name":"abc","title":"title2"}]);
		expect(result).to.deep.equals([
			{
				"name":"abc",
				"title":"title2"
			}
		]);
	});

	it("objects with same id, but not adjacent", async () => {
		
		let result = aggregate({id:"name", list: true},[{"name":"abc","title":"title1"},
			{"name":"def","title":"title2"},{"name":"abc","title":"title3"},{"name":"def","title":"title4"},]);
		expect(result).to.deep.equals([
			{
				"name":"abc",
				"title":"title3"
			},
			{
				"name":"def",
				"title":"title4"
			}
		]);
	});
});