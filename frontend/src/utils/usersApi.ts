export async function deliteUser(id: string) {
    const row = await fetch(`/api/auth/users/${encodeURIComponent(id)}`, {
        method: 'DELETE',
        credentials: 'include',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        }
    })
    if (!row.ok) {
        const e = await row.json().catch((e) => { errror: "Internal Server Error" })
        throw new Error(e.error)
    }
    return row.json()
}