export async function GETItems() {
    const row = await fetch("/api/auth/items", { method: 'GET', credentials: 'include' })
    if (!row.ok) return row.json().then((i) => {
        i: console.error(i);
    })
    return row.json()
}