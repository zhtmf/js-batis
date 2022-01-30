import { extractStatementVerb } from '../../lib/plugins/sqlite'

import { assert, expect, should } from 'chai'

describe("extractStatementVerb", function() {

	it("comprehensive", async () => {
		let sql = `

		WITH RECURSIVE
		-- asdfsadfasdf"hahahah"skdfjlsjdfljkljlsdjf SELECT AS UNION WITH RECURSIVE
		/*
		-- asdfsadfasdf"hahahah"skdfjlsjdfljkljlsdjf SELECT AS UNION WITH RECURSIVE
		 */input(/*SELECT*/sud/**/)/**/ -- ASDFASDF
		AS   /*     */  -- SELECT AS UNION WITH RECURSIVE
		/*SDFSDF*/(/* SELECT AS UNION WITH RECURSIVE
		*/VALUES('53..7....6..195....98....6.8...6...34..8.3..17...2...6.6....28....419..5....8..79'''' "" "" (( """"SDFSDF" ) sdfsf ) ')/*
		asdfsadfasdf"hahahah"skdfjlsjdfljkljlsdjf SELECT AS UNION WITH RECURSIVE 
		*/),/*SELECT AS UNION WITH RECURSIVE
		SELECT AS UNION WITH RECURSIVE
		SADFASDFASDF
		SELECT AS UNION WITH RECURSIVE

		*/ -- SDFSDFSDF 
		digits(z123123234, lpASDFASDFASDF) AS (
		    VALUES('1', 1, '', "")
		    UNION ALL SELECT
		    CAST(lp+1 AS TEXT), lp+1 FROM digits WHERE lp<9/*SELECT AS UNION WITH RECURSIVE
		SELECT AS UNION WITH RECURSIVE
		SADFASDFASDF
		SELECT AS UNION WITH RECURSIVE
		*/  ),
		--UOIUIOUIOUIOU
		--SDFSDFSDF
		/*SELECT AS UNION WITH RECURSIVE
		*/x(sWERWER, /*SELECT AS UNION WITH RECURSIVE*/ind234234)/*  SELECT AS UNION WITH RECURSIVE */AS/* SELECT AS UNION WITH RECURSIVE  */(
		    SELECT sud, instr(sud, '.' + """(((("")))))))))+ABCDEF") FROM input
		    UNION ALL
		    SELECT
		      substr(s, 1, ind-1) || z || substr(s, ind+1),
		      instr( substr(s, 1, ind-1) || z || substr(s, ind+1), '.' )
		     FROM x, digits AS z
		    WHERE ind>0
		      AND NOT EXISTS (SELECT 1 FROM digits AS lp WHERE z.z = substr(s, ((ind-1)/9)*9 + lp, 1)
		OR z.z = substr(s, /**/((ind-1)%9)/**/ +/**/ (lp-1)*9 + 1, 1) OR z.z = substr(s, (((ind-1)/3) % 3) * 3
		                        + ((ind-1)/27)/**/ * 27 + lp/**//**//**/ -- hehehe
		/**/ +/*
		SELECT AS UNION WITH RECURSIVE
		*/ ((lp-1) / 3)/**/ * 6, 1) )
		  )/*SELECT AS UNION WITH RECURSIVE
		SELECT AS UNION WITH RECURSIVE
		SADFASDFASDF
		SELECT AS UNION WITH RECURSIVE
		*/ -- SDKFSDF
		/**//**//**//**//**/
		SELECT s FROM x WHERE ind=0;

		`;
		expect(extractStatementVerb(sql) === 'SELECT').to.be.equals(true);
	});

	it("comprehensive - not an select query", async () => {
		let sql = `

		WITH RECURSIVE
		-- asdfsadfasdf"hahahah"skdfjlsjdfljkljlsdjf SELECT AS UNION WITH RECURSIVE
		/*
		-- asdfsadfasdf"hahahah"skdfjlsjdfljkljlsdjf SELECT AS UNION WITH RECURSIVE
		 */input(/*SELECT*/sud/**/)/**/ -- ASDFASDF
		AS   /*     */  -- SELECT AS UNION WITH RECURSIVE
		/*SDFSDF*/(/* SELECT AS UNION WITH RECURSIVE
		*/VALUES('53..7....6..195....98....6.8...6...34..8.3..17...2...6.6....28....419..5....8..79'''' "" "" (( """"SDFSDF" ) sdfsf ) ')/*
		asdfsadfasdf"hahahah"skdfjlsjdfljkljlsdjf SELECT AS UNION WITH RECURSIVE 
		*/),/*SELECT AS UNION WITH RECURSIVE
		SELECT AS UNION WITH RECURSIVE
		SADFASDFASDF
		SELECT AS UNION WITH RECURSIVE

		*/ -- SDFSDFSDF 
		digits(z123123234, lpASDFASDFASDF) AS (
		    VALUES('1', 1, '', "")
		    UNION ALL SELECT
		    CAST(lp+1 AS TEXT), lp+1 FROM digits WHERE lp<9/*SELECT AS UNION WITH RECURSIVE
		SELECT AS UNION WITH RECURSIVE
		SADFASDFASDF
		SELECT AS UNION WITH RECURSIVE
		*/  ),
		--UOIUIOUIOUIOU
		--SDFSDFSDF
		/*SELECT AS UNION WITH RECURSIVE
		*/x(sWERWER, /*SELECT AS UNION WITH RECURSIVE*/ind234234)/*  SELECT AS UNION WITH RECURSIVE */AS/* SELECT AS UNION WITH RECURSIVE  */(
		    SELECT sud, instr(sud, '.' + """(((("")))))))))+ABCDEF") FROM input
		    UNION ALL
		    SELECT
		      substr(s, 1, ind-1) || z || substr(s, ind+1),
		      instr( substr(s, 1, ind-1) || z || substr(s, ind+1), '.' )
		     FROM x, digits AS z
		    WHERE ind>0
		      AND NOT EXISTS (SELECT 1 FROM digits AS lp WHERE z.z = substr(s, ((ind-1)/9)*9 + lp, 1)
		OR z.z = substr(s, /**/((ind-1)%9)/**/ +/**/ (lp-1)*9 + 1, 1) OR z.z = substr(s, (((ind-1)/3) % 3) * 3
		                        + ((ind-1)/27)/**/ * 27 + lp/**//**//**/ -- hehehe
		/**/ +/*
		SELECT AS UNION WITH RECURSIVE
		*/ ((lp-1) / 3)/**/ * 6, 1) )
		  )/*SELECT AS UNION WITH RECURSIVE
		SELECT AS UNION WITH RECURSIVE
		SADFASDFASDF
		SELECT AS UNION WITH RECURSIVE
		*/ -- SDKFSDF
		/**//**//**//**//**/
		update x set ind = 0

		`;
		expect(extractStatementVerb(sql) !== 'SELECT').to.be.equals(true);
	});


	it("without with", async () => {

		let sql = `
		/*WITH RECURSIVE*/ 
			-- sdfsdfffffffffffffffff
			-- sdfsdfffffffffffffffff WITH RECURSIVE
		/*
		SELECT
		 */
		SELECT /*
		*/ 1 as result;
		`;
		expect(extractStatementVerb(sql) === 'SELECT').to.be.equals(true);
	});

	it("without with - not an select query", async () => {

		let sql = `
		/*WITH RECURSIVE*/ 
			-- sdfsdfffffffffffffffff
			-- sdfsdfffffffffffffffff WITH RECURSIVE
		/*
		SELECT 
		*/ UPDATE /*
		*/ result set a = 3;
		`;
		expect(extractStatementVerb(sql) === 'UPDATE').to.be.equals(true);
	});

	it("case insensitive", async () => {

		let sql = `
		with recursive
		-- asdfsadfasdf"hahahah"skdfjlsjdfljkljlsdjf select as union with recursive
		/*
		-- asdfsadfasdf"hahahah"skdfjlsjdfljkljlsdjf select as union with recursive
		 */input(/*select*/sud/**/)/**/ -- asdfasdf
		as   /*     */  -- select as union with recursive
		/*sdfsdf*/(/* select as union with recursive
		*/values('53..7....6..195....98....6.8...6...34..8.3..17...2...6.6....28....419..5....8..79'''' "" "" (( """"sdfsdf" ) sdfsf ) ')/*
		asdfsadfasdf"hahahah"skdfjlsjdfljkljlsdjf select as union with recursive 
		*/),/*select as union with recursive
		select as union with recursive
		sadfasdfasdf
		select as union with recursive

		*/ -- sdfsdfsdf 
		digits(z123123234, lpasdfasdfasdf) as (
		    values('1', 1, '', "")
		    union all select
		    cast(lp+1 as text), lp+1 from digits where lp<9/*select as union with recursive
		select as union with recursive
		sadfasdfasdf
		select as union with recursive
		*/  ),
		--uoiuiouiouiou
		--sdfsdfsdf
		/*select as union with recursive
		*/x(swerwer, /*select as union with recursive*/ind234234)/*  select as union with recursive */as/* select as union with recursive  */(
		    select sud, instr(sud, '.' + """(((("")))))))))+abcdef") from input
		    union all
		    select
		      substr(s, 1, ind-1) || z || substr(s, ind+1),
		      instr( substr(s, 1, ind-1) || z || substr(s, ind+1), '.' )
		     from x, digits as z
		    where ind>0
		      and not exists (select 1 from digits as lp where z.z = substr(s, ((ind-1)/9)*9 + lp, 1)
		or z.z = substr(s, /**/((ind-1)%9)/**/ +/**/ (lp-1)*9 + 1, 1) or z.z = substr(s, (((ind-1)/3) % 3) * 3
		                        + ((ind-1)/27)/**/ * 27 + lp/**//**//**/ -- hehehe
		/**/ +/*
		select as union with recursive
		*/ ((lp-1) / 3)/**/ * 6, 1) )
		  )/*select as union with recursive
		select as union with recursive
		sadfasdfasdf
		select as union with recursive
		*/ -- sdkfsdf
		/**//**//**//**//**/
		sEleCt s from x where ind=0;
		`;
		expect(extractStatementVerb(sql) === 'SELECT').to.be.equals(true);
	});

	it("illegal syntax", async () => {
		let sql = `
			WITH RECURSIVE
			  parent_of
			SELECT family.name FROM ancestor_of_alice, family
			 WHERE ancestor_of_alice.name=family.name
			   AND died IS NULL
			 ORDER BY born;
		`;

		expect(extractStatementVerb(sql) === 'SELECT').to.be.equals(true);
	});
});