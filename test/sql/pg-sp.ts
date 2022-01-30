require('custom-env').env('pg', 'test')

import { assert, expect, should } from 'chai'

import { Param, Select, SelectOne, Insert, Update, Delete, Result, DataSource, Transactional, Cleanup } from "../../index"

class Mapper1 {

    @Select(`select js_batis_test_db."test1_1"({{sql in1}},{{sql in2}})`)
    async test1_1(@Param("in1", false) in1: number, @Param("in2", true) in2: number): Promise<any> {

    }

    @Select(`select js_batis_test_db."test1_2"({{sql in1}},{{sql in2}})`)
    async test1_2(@Param("in1", false) in1: number, @Param("in2", true) in2: number): Promise<any> {

    }

    @Select(`select js_batis_test_db."test1_3"({{sql in1}},{{sql in2}},{{sql in3}},{{sql in4}},{{sql in5}},{{sql in6}},{{sql in7}})`)
    async test1_3(@Param("in1", false) in1: number | null
        , @Param("in2", true) in2: number | null
        , @Param("in3", true) in3: number | null
        , @Param("in4", true) in4: number | null
        , @Param("in5", true) in5: number | null
        , @Param("in6", true) in6: number | null
        , @Param("in7", true) in7: number | null
    ): Promise<any> {
    }

    @Select(`select js_batis_test_db."test1_4"({{sql in1}},{{sql in2}})`)
    async test1_4(@Param("in1", false) in1: number, @Param("in2", false) in2: number): Promise<any> {

    }

    @Select(`select * from js_batis_test_db."test1_4"({{sql in1}},{{sql in2}})`)
    async test1_4X2(@Param("in1", false) in1: number, @Param("in2", false) in2: number): Promise<any> {

    }

    @Select(`select js_batis_test_db."test1_5"()`)
    async test1_5(): Promise<any> {

    }

    @SelectOne(`call "js_batis_test_db"."test2_1"({{sql in1}}, {{sql in2}}, {{sql arg2}})`)
    async test2_1(@Param("in1", false) in1: number, @Param("in2", false) in2: string, in3: number): Promise<any> {

    }

    @SelectOne(`call "js_batis_test_db"."test2_2"({{sql in1}}, {{sql in2}}, {{sql arg2}}, {{sql arg3}})`)
    async test2_2(@Param("in1", false) in1: number, @Param("in2", false) in2: string, in3: number, in4: number): Promise<any> {

    }
}

describe("pg-sp", function() {

    let mapper1 = new Mapper1();

    it("function with in/out parameter which returns single value by return statement", async () => {
        let rows = await mapper1.test1_1(3, 40);
        expect(rows[0]).to.be.equals(43);
    });

    it("function with in/out parameter which returns single value by out parameter", async () => {
        let rows = await mapper1.test1_2(3, 40);
        expect(rows[0]).to.be.equals(43);
    });

    it("function with in/out parameter which returns a record", async () => {
        let rows = await mapper1.test1_3(1, 2, null, null, null, null, null);
        expect(rows.length).to.be.equals(1);
        expect(rows[0]).to.be.equals(`(3,"{ ""abc,',\\\\""\\\\""\\\\""def"" : 1 }","","  ",,abcdef)`);
    });

    it("function with in/out parameter which returns setof record", async () => {
        let rows = await mapper1.test1_4(11, 17);
        expect(rows.length).to.be.equals(4);
        expect(rows[0]).to.be.equals('(11,17)');
        expect(rows[1]).to.be.equals('(12,18)');
        expect(rows[2]).to.be.equals('(,19)');
        expect(rows[3]).to.be.equals('(13,)');
    });

    it("function with in/out parameter which returns setof record, select * from func() syntax", async () => {
        let rows = await mapper1.test1_4X2(11, 17);
        expect(rows.length).to.be.equals(4);
        expect(rows[0]["col1"]).to.be.equals(11);
        expect(rows[0]["col2"]).to.be.equals(17);
        expect(rows[1]["col1"]).to.be.equals(12);
        expect(rows[1]["col2"]).to.be.equals(18);
        expect(rows[2]["col1"]).to.be.equals(null);
        expect(rows[2]["col2"]).to.be.equals(19);
        expect(rows[3]["col1"]).to.be.equals(13);
        expect(rows[3]["col2"]).to.be.equals(null);
    });

    it("function returning nothing", async () => {
        let rows = await mapper1.test1_5();
        expect(rows[0]).to.be.equals('');
    });

    it("stored procedure with in/out parameter which returns single value", async () => {
        let rows = await mapper1.test2_1(1, 'abc', 2);
        expect(rows).to.be.equals(6);
    });

    it("stored procedure with in/out parameter which returns multiple values", async () => {
        let rows = await mapper1.test2_2(1, 'abc', 2, 3);
        expect(rows.length).to.be.equals(undefined);
        expect(rows["inout1"]).to.be.equals(6);
        expect(rows["inout2"]).to.be.equals(9);
    });
});