

// מיפוי בסיסי: מזהה → שם + לוגו (נתיב יחסי מ-public)
export const TEAMS = {
    chelsea:    { name: 'Chelsea',        logo: '/logos/chelsea.svg' },
    liverpool:  { name: 'Liverpool',      logo: '/logos/liverpool.svg' },
    arsenal:    { name: 'Arsenal',        logo: '/logos/arsenal.svg' },
    manutd:     { name: 'Manchester United', logo: '/logos/manutd.svg' },
  
    // גם ללייב (לשרת יש שמות "Real Madrid" וכו׳ — נמפה ל־id ידני)
    realmadrid: { name: 'Real Madrid',    logo: '/logos/realmadrid.svg' },
    barcelona:  { name: 'Barcelona',      logo: '/logos/barcelona.svg' },
    inter:      { name: 'Inter',          logo: '/logos/inter.svg' },
    juventus:   { name: 'Juventus',       logo: '/logos/juventus.svg' },
  };
  
  // עזר: קבלת שם ידידותי
  export function teamName(id) {
    return TEAMS[id]?.name ?? id;
  }
  
  // עזר: קבלת לוגו לפי id (נחזיר גם נתיב ברירת מחדל אם אין)
  export function teamLogo(id) {
    return TEAMS[id]?.logo ?? `/logos/${id}.svg`;
  }
  
  // עזר: הפיכת שם כמו "Real Madrid" ל-id מוכר
  const NAME_TO_ID = {
    'chelsea': 'chelsea',
    'liverpool': 'liverpool',
    'arsenal': 'arsenal',
    'manchester united': 'manutd',
    'real madrid': 'realmadrid',
    'barcelona': 'barcelona',
    'inter': 'inter',
    'juventus': 'juventus',
  };
  
  export function teamIdFromName(name) {
    if (!name) return null;
    const key = String(name).trim().toLowerCase();
    return NAME_TO_ID[key] ?? null;
  }
  