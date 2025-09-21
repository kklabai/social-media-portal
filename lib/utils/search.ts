// Utility for case-insensitive search with SQLite and Prisma

export function buildSearchConditions(search: string, fields: string[]) {
  if (!search) return undefined;
  
  // For SQLite, we create multiple OR conditions to handle case variations
  const searchLower = search.toLowerCase();
  const searchUpper = search.toUpperCase();
  const searchCapitalized = search.charAt(0).toUpperCase() + search.slice(1).toLowerCase();
  
  const conditions: any[] = [];
  
  fields.forEach(field => {
    // Add conditions for different case variations
    conditions.push(
      { [field]: { contains: search } },
      { [field]: { contains: searchLower } },
      { [field]: { contains: searchUpper } },
      { [field]: { contains: searchCapitalized } }
    );
  });
  
  return conditions;
}

// Alternative: Use startsWith for better performance with indexes
export function buildSearchConditionsStartsWith(search: string, fields: string[]) {
  if (!search) return undefined;
  
  const searchLower = search.toLowerCase();
  const searchUpper = search.toUpperCase();
  const searchCapitalized = search.charAt(0).toUpperCase() + search.slice(1).toLowerCase();
  
  const conditions: any[] = [];
  
  fields.forEach(field => {
    conditions.push(
      { [field]: { startsWith: search } },
      { [field]: { startsWith: searchLower } },
      { [field]: { startsWith: searchUpper } },
      { [field]: { startsWith: searchCapitalized } }
    );
  });
  
  return conditions;
}