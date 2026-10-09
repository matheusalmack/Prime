import {test} from 'node:test';
import assert from 'node:assert/strict';
import {buildVideoCaption} from '../src/video-caption.mjs';
test('video captions use authored product copy, emojis, hashtags and only the owner affiliate link',()=>{
 const caption=buildVideoCaption({id:'shopee-58262977415'},'', 'https://s.shopee.com.br/example');
 assert.match(caption,/fone X15/);assert.match(caption,/✨/);assert.match(caption,/#FonesBluetooth/);assert.match(caption,/https:\/\/s.shopee.com.br\/example/);
 assert.notEqual(caption,buildVideoCaption({id:'shopee-58205197736'}));
});
test('new catalog items have a caption and unsafe links are excluded',()=>{
 const caption=buildVideoCaption({id:'new',name:'Minha bolsa'},'Uma bolsa para sua rotina.','javascript:alert(1)');
 assert.match(caption,/Uma bolsa para sua rotina/);assert.match(caption,/#Achadinhos/);assert.doesNotMatch(caption,/javascript/);
 assert.equal(buildVideoCaption(null),'');
});
