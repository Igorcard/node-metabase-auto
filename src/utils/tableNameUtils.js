
export async function replaceTableName(query, oldTable, newTable) {
  if (
    typeof query === 'object' &&
    query.type === 'native' &&
    query.native &&
    typeof query.native.query === 'string'
  ) {
    query.native.query = query.native.query.replace(new RegExp(oldTable, 'g'), newTable)
    return query
  }

  if (typeof query === 'string') {
    return query.replace(new RegExp(oldTable, 'g'), newTable)
  }

  if (typeof query === 'object' && query.query) {
    if (query.query.source_table === oldTable) {
      query.query.source_table = newTable
    }
  }
  return query
}
