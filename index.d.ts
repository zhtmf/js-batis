
export declare let DEFAULT_CATEGORRY_NAME: string;

export declare type TransactionLevel = 'SERIALIZABLE' | 'REPEATABLE READ' | 'READ COMMITTED' | 'READ UNCOMMITTED';
export declare function Transactional(level: TransactionLevel, timeout: number): (target: object, propertyKey: string | symbol, descriptor: object) => void;
export declare function Transactional(level: TransactionLevel): (target: object, propertyKey: string | symbol, descriptor: object) => void;
export declare function Transactional(): (target: object, propertyKey: string | symbol, descriptor: object) => void;

export declare function DataSource(): ((target: object, propertyKey: string | symbol, descriptor: object) => any) & ((target: Function) => any);
export declare function DataSource(name: string): ((target: object, propertyKey: string | symbol, descriptor: object) => any) & ((target: Function) => any);

export declare function Param(name: string): (target: object, propertyKey: string | symbol, parameterIndex: number) => void;
export declare function Param(name: string, out: boolean): (target: object, propertyKey: string | symbol, parameterIndex: number) => void;

export declare function Select(name: string): (target: object, propertyKey: string | symbol, descriptor: object) => any;
export declare function SelectOne(name: string): (target: object, propertyKey: string | symbol, descriptor: object) => any;
export declare function Insert(name: string): (target: object, propertyKey: string | symbol, descriptor: object) => any;
export declare function Update(name: string): (target: object, propertyKey: string | symbol, descriptor: object) => any;
export declare function Delete(name: string): (target: object, propertyKey: string | symbol, descriptor: object) => any;
export declare function Execute(): (target: object, propertyKey: string | symbol, descriptor: object) => any;

export type ResultShape = {
	id?: string,
	prefix?: string,
	list?: boolean,
	scalar?: boolean,
	coerce?: { [p: string]: new () => Object },
	sub?: { [p: string]: ResultShape },
}
export declare function Result(map: ResultShape): (target: object, propertyKey: string | symbol, descriptor: object) => any;

export declare function Cleanup(): (target: Function | object, propertyKey: string | symbol, descriptor: object) => void;

//-------------- internal definitions----------------

export declare function DataSourceClass(name: string | string[]): (constructor: new (options: object) => DatabaseFacade) => any;

export declare type SQLResult = {
	affectedRows?: number;
	//this value is normalized to be either present or undefined
	//database specific values for absence (such as 0 in MySQL) are discarded
	insertId?: number | undefined;
	fields?: { name: string }[] | undefined;
	rows?: object[] | undefined;
}

export declare interface DatabaseFacade {
	getConnection(): Promise<any>;
	call(connection: any, sql: string, parameters: { name: string, value: any, out: boolean }[], timeout?: number): Promise<SQLResult>;
	execute(connection: any, sql: string, parameters: any[], timeout?: number): Promise<SQLResult>;
	release(connection: any): Promise<void>;
	beginTransaction(connection: any, level: TransactionLevel): Promise<void>;
	commit(connection: any): Promise<void>;
	rollback(connection: any): Promise<void>;
	sqlParameterPlaceholder(ordinal: number): string;
	destroy(): Promise<void>;
}