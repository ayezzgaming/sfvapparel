import { getCmsDataDb } from '../src/app/actions/cmsActions.js';

async function test() {
  const result = await getCmsDataDb();
  console.log('RESULT:', result);
}

test();
