import { Pool } from 'pg'

const pool = new Pool()

async function fetchTenants() {
    const res = await pool.query(
        {
            text: 'SELECT "Id", "AccountId", "TenantName", "IsDisabled" FROM public."Tenants"',
        }
    )
    return res
}

fetchTenants().then(value => {
  console.log('resolved', value.rows);
});

pool.end()