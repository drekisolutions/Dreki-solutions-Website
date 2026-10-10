import pg from 'pg';
import { randomUUID } from 'node:crypto';

export function database(connectionString = process.env.VOICE_DATABASE_URL) {
  if (!connectionString) throw new Error('Voice database unavailable');
  const url = new URL(connectionString);
  if (!['postgres:','postgresql:'].includes(url.protocol) || !url.hostname.endsWith('.neon.tech')) throw new Error('Dedicated Neon database required');
  // pg URL SSL options override the ssl object. Strip them and require CA verification.
  for (const key of ['ssl','sslmode','sslcert','sslkey','sslrootcert','channel_binding']) url.searchParams.delete(key);
  const pool=new pg.Pool({connectionString:url.toString(),ssl:{rejectUnauthorized:true},max:2,
    connectionTimeoutMillis:8000,idleTimeoutMillis:5000,allowExitOnIdle:true,
    statement_timeout:8000,query_timeout:10000});
  pool.on('error',()=>{console.error('Voice database connection interrupted.');});
  return pool;
}

export async function transaction(pool, operation) {
  const client = await pool.connect();
  try { await client.query('BEGIN'); await client.query("SET LOCAL lock_timeout = '3s'");
    const result = await operation(client); await client.query('COMMIT'); return result;
  } catch (error) { await client.query('ROLLBACK').catch(()=>{}); throw error; }
  finally { client.release(); }
}

export function validateRecord(r) {
  const fields=['call_id','kind','name','callback_number','callback_confirmed','message'];
  if (!r || Array.isArray(r) || Object.keys(r).sort().join()!==fields.sort().join() ||
      !/^[A-Za-z0-9_-]{1,150}$/.test(r.call_id) || !['callback','lead'].includes(r.kind) ||
      typeof r.name!=='string' || r.name.length>200 || typeof r.message!=='string' || !r.message.trim() || r.message.length>4000 ||
      /[\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(r.name+r.message) ||
      (r.callback_number!==null && !/^\+[1-9]\d{7,14}$/.test(r.callback_number)) ||
      typeof r.callback_confirmed!=='boolean' || (r.callback_number===null && r.callback_confirmed)) throw new Error('Invalid report');
  return r.call_id+':'+r.kind;
}

export async function enqueue(client, record) {
  const key = validateRecord(record);
  await client.query('INSERT INTO voice_records(record_key,payload) VALUES($1,$2) ON CONFLICT DO NOTHING',[key,record]);
  const {rows} = await client.query('SELECT payload = $2::jsonb AS same FROM voice_records WHERE record_key=$1',[key,record]);
  if (!rows[0]?.same) throw new Error('Conflicting report replay');
  await client.query("INSERT INTO voice_delivery(record_key,channel) VALUES($1,'clickup'),($1,'email') ON CONFLICT DO NOTHING",[key]);
  return key;
}

export async function advance(pool, sid, transition, blandCallId=null) {
  return transaction(pool, async client=>{
    // Serializes first creation as well as updates across independent function instances.
    await client.query('SELECT pg_advisory_xact_lock(hashtextextended($1, 0))',[sid]);
    if(blandCallId) {
      await client.query('INSERT INTO voice_handoffs(bland_call_id,twilio_call_sid) VALUES($1,$2) ON CONFLICT DO NOTHING',[blandCallId,sid]);
      const binding=await client.query('SELECT twilio_call_sid FROM voice_handoffs WHERE bland_call_id=$1',[blandCallId]);
      if(binding.rows[0]?.twilio_call_sid!==sid)throw new Error('A transfer was already attempted for this call');
    }
    const {rows}=await client.query('SELECT state FROM voice_calls WHERE sid=$1 FOR UPDATE',[sid]);
    const result=transition(rows[0]?.state ?? null);
    if(result.record) await enqueue(client,result.record);
    await client.query('INSERT INTO voice_calls(sid,state) VALUES($1,$2) ON CONFLICT(sid) DO UPDATE SET state=EXCLUDED.state, updated_at=now()',[sid,result.state]);
    return result;
  });
}

export async function claim(pool,key,channel) {
  const id=randomUUID();
  const {rows}=await pool.query(`WITH claimed AS (
    UPDATE voice_delivery SET state='inflight',attempts=attempts+1,claim_id=$3,updated_at=now()
    WHERE record_key=$1 AND channel=$2 AND state='pending' AND attempts<3 RETURNING record_key,attempts)
    SELECT claimed.attempts,r.payload FROM claimed JOIN voice_records r USING(record_key)`,[key,channel,id]);
  if(!rows.length) return null;
  return {id,attempts:rows[0].attempts,record:rows[0].payload};
}

export async function finish(pool,key,channel,id,state,remoteId=null) {
  await pool.query("UPDATE voice_delivery SET state=$4,remote_id=$5,updated_at=now() WHERE record_key=$1 AND channel=$2 AND claim_id=$3 AND state='inflight'",[key,channel,id,state,remoteId]);
}
