
import { assert, expect, should } from 'chai'

export function logStartsWith(spy, keywords, offset = -1){
	let msg = spy.getCall(spy.callCount + offset).args[0] + '';
	assert(msg && msg.indexOf && msg.indexOf(keywords) === 0, msg);
}

export function logContains(spy, keywords, offset = -1){
	let msg = spy.getCall(spy.callCount + offset).args[0] + '';
	assert(msg && msg.indexOf && msg.indexOf(keywords) >= 0, msg);
}